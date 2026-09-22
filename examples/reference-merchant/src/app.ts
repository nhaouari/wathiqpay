/**
 * Reference merchant HTTP application. Framework-free so the flow is
 * readable end to end: catalog -> cart -> checkout -> register -> redirect
 * -> return -> acknowledge -> compare -> fulfil once -> receipt.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import { createClient, classifyPayment, paymentMatchesOrder, fromMinorUnits, isWathiqPayError, redact, type AcknowledgeResult, type WathiqPayClient } from "../../../src/index.js";
import type { MerchantConfig } from "./config.js";
import { OrderStore, type OrderRow, type OrderState } from "./store.js";
import { messages, normalizeLang, formatAmount, type Lang } from "./i18n.js";
import { findProduct } from "./catalog.js";
import { createChallenge, verify } from "./captcha.js";
import { buildReceiptPdf } from "./receipt-pdf.js";
import { createOutboxMailer, createUnconfiguredMailer, isPlausibleEmail, type Mailer } from "./mailer.js";
import { createSmtpMailer, parseSmtpUrl } from "./smtp.js";
import { timingSafeEqual } from "node:crypto";
import { catalogPage, cartPage, checkoutPage, ordersPage, orderDetailPage, successPage, failurePage, receiptPage, receiptRows, notFoundPage, layout, esc, priceCart, type Ctx } from "./views.js";

export interface MerchantApp {
  server: Server;
  store: OrderStore;
  client: WathiqPayClient;
  /** Raw request handler, usable from a serverless function. */
  handle(req: IncomingMessage, res: ServerResponse): Promise<void>;
  start(port?: number): Promise<string>;
  stop(): Promise<void>;
  /** Closed-browser recovery: acknowledge orders the customer never returned from. */
  reconcile(olderThanSeconds?: number): Promise<Array<{ orderNumber: string; state: OrderState }>>;
  log: string[];
}

// Compiled output lives under build/, which tsc does not copy assets into,
// so fall back to the source tree's public/ directory.
const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = [
  join(HERE, "..", "public"),
  join(HERE, "..", "..", "..", "..", "examples", "reference-merchant", "public"),
  join(process.cwd(), "examples", "reference-merchant", "public"), // bundled serverless function
].find((d) => existsSync(d)) ?? join(HERE, "..", "public");

export async function createApp(config: MerchantConfig, deps: { mailer?: Mailer; store?: OrderStore } = {}): Promise<MerchantApp> {
  const store = deps.store ?? (await OrderStore.open({ url: config.dbUrl, authToken: config.dbAuthToken }));
  const mailer =
    deps.mailer ??
    (config.smtpUrl
      ? createSmtpMailer(parseSmtpUrl(config.smtpUrl, config.smtpFrom))
      : process.env["VERCEL"]
        ? createUnconfiguredMailer() // read-only filesystem: no outbox possible
        : createOutboxMailer(config.outboxDir));
  const emailEnabled = mailer.enabled !== false;
  const log: string[] = [];
  const client = createClient({
    environment: config.mode,
    ...(config.satim.baseUrl ? { baseUrl: config.satim.baseUrl } : {}),
    username: config.satim.username,
    password: config.satim.password,
    terminalId: config.satim.terminalId,
    allowInsecureReturnUrls: config.mode === "simulator",
    timeoutMs: 30_000,
  });

  const fulfil = (order: OrderRow) => {
    // The merchant's real fulfilment (ship, unlock, email) goes here. It runs
    // at most once per order because fulfilOnce() guards it.
    log.push(`fulfilled ${order.orderNumber}`);
  };

  /**
   * Acknowledge with SATIM and settle the local state. Idempotent: an order
   * already in a terminal state is not re-acknowledged.
   */
  async function settle(order: OrderRow): Promise<{ order: OrderRow; ack: AcknowledgeResult | undefined }> {
    if (order.state !== "registered" && order.state !== "unknown") {
      return { order, ack: order.ackJson ? (JSON.parse(order.ackJson) as AcknowledgeResult) : undefined };
    }
    if (!order.satimOrderId) return { order, ack: undefined };
    let ack: AcknowledgeResult;
    try {
      ack = await client.acknowledgeTransaction({ orderId: order.satimOrderId, language: order.language });
    } catch (e) {
      log.push(`acknowledge failed for ${order.orderNumber}: ${isWathiqPayError(e) ? `${e.name} ${e.outcome}` : String(e)}`);
      console.error(`[merchant] acknowledge failed order=${order.orderNumber} ${isWathiqPayError(e) ? `${e.name} (${e.outcome}): ${e.message}` : String(e)}`);
      return { order: (await store.get(order.orderNumber))!, ack: undefined };
    }
    const ackJson = JSON.stringify(ack);
    const state = classifyPayment(ack);
    const match = paymentMatchesOrder(ack, { orderNumber: order.orderNumber, amount: fromMinorUnits(order.amountMinor) });
    if (state === "paid") {
      if (match.matches) {
        if (await store.fulfilOnce(order.orderNumber, ackJson)) fulfil(order);
      } else {
        await store.recordAcknowledgement(order.orderNumber, "review", ackJson, `mismatch: ${match.mismatches.join(",")}`);
        console.error(`[merchant] payment mismatch order=${order.orderNumber} fields=${match.mismatches.join(",")}`);
      }
    } else if (state === "registered" || state === "unknown") {
      await store.recordAcknowledgement(order.orderNumber, state === "registered" ? "registered" : "unknown", ackJson);
      if (state === "unknown") console.error(`[merchant] payment unknown order=${order.orderNumber}`);
    } else {
      await store.recordAcknowledgement(order.orderNumber, state, ackJson);
    }
    return { order: (await store.get(order.orderNumber))!, ack };
  }

  async function renderOutcome(ctx: Ctx, order: OrderRow, ack: AcknowledgeResult | undefined, owner: boolean): Promise<string> {
    switch (order.state) {
      case "paid":
        // Anyone returning from SATIM sees the payment result; receipt tools
        // (which reveal the customer's e-mail) are for the ordering session only.
        return successPage(ctx, { order, ack: ack! }, await store.items(order.orderNumber), undefined, false, owner, emailEnabled);
      case "declined":
        return failurePage(ctx, order, ack, "declined");
      case "reversed":
        return failurePage(ctx, order, ack, "reversed");
      case "refunded":
      case "partially_refunded":
        return failurePage(ctx, order, ack, order.state);
      case "review":
        return failurePage(ctx, order, ack, "review");
      case "failed":
        return failurePage(ctx, order, ack, "failed");
      default:
        return failurePage(ctx, order, ack, "pending");
    }
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", config.publicUrl);
    const cookies = parseCookies(req.headers.cookie);
    const lang = normalizeLang(cookies["lang"]);
    const t = messages[lang];
    const setCookies: string[] = [];
    let sid = cookies["sid"] && /^[a-f0-9]{32}$/.test(cookies["sid"]) ? cookies["sid"] : undefined;
    if (!sid) {
      sid = randomBytes(16).toString("hex");
      setCookies.push(`sid=${sid}; Path=/; HttpOnly; SameSite=Lax${config.publicUrl.startsWith("https://") ? "; Secure" : ""}`);
    }
    const session = sid;
    const ctx = async (): Promise<Ctx> => ({ lang, cartCount: (await store.getCart(session)).reduce((n, l) => n + l.quantity, 0), current: url.pathname + url.search, mode: config.mode, emailEnabled });
    const html = (status: number, body: string, extra: Record<string, string> = {}) => {
      res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "set-cookie": setCookies, ...extra });
      res.end(body);
    };
    const redirect = (to: string) => {
      res.writeHead(303, { location: to, "set-cookie": setCookies });
      res.end();
    };
    // HEAD is answered like GET (Node drops the body), so link checkers and previews see 200.
    const method = req.method === "HEAD" ? "GET" : (req.method ?? "GET");
    const path = url.pathname;

    // Static product images (whitelisted names only; no path traversal).
    const img = /^\/images\/([a-z0-9-]+\.jpg)$/.exec(path);
    if (img && method === "GET") {
      try {
        const bytes = await readFile(join(PUBLIC_DIR, "images", img[1]!));
        res.writeHead(200, { "content-type": "image/jpeg", "cache-control": "public, max-age=86400", "content-length": bytes.length });
        res.end(bytes);
      } catch {
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("not found");
      }
      return;
    }

    // Language switch; kept in a cookie so every page, the SATIM request, and the receipt agree.
    let m = /^\/lang\/(\w+)$/.exec(path);
    if (m) {
      const next = url.searchParams.get("next") ?? "/";
      setCookies.push(`lang=${normalizeLang(m[1])}; Path=/; SameSite=Lax${config.publicUrl.startsWith("https://") ? "; Secure" : ""}`);
      return redirect(next.startsWith("/") ? next : "/");
    }

    // ---- catalog and cart ------------------------------------------------
    if (path === "/" && method === "GET") return html(200, catalogPage(await ctx(), url.searchParams.has("added") ? t.addedToCart : undefined));

    if (path === "/cart/add" && method === "POST") {
      const form = await readForm(req);
      const product = findProduct(form.get("product") ?? "");
      if (!product) return html(404, notFoundPage(await ctx()));
      await store.addToCart(session, product.id, clampQty(form.get("quantity")));
      return redirect("/?added=1");
    }
    if (path === "/cart/update" && method === "POST") {
      const form = await readForm(req);
      const product = findProduct(form.get("product") ?? "");
      if (product) await store.setCartLine(session, product.id, clampQty(form.get("quantity"), 0));
      return redirect("/cart");
    }
    if (path === "/cart" && method === "GET") return html(200, cartPage(await ctx(), priceCart(await store.getCart(session))));

    // ---- checkout ---------------------------------------------------------
    if (path === "/checkout" && method === "GET") {
      const cart = priceCart(await store.getCart(session));
      if (cart.lines.length === 0) return redirect("/cart");
      return html(200, checkoutPage(await ctx(), cart, createChallenge(config.captchaSecret)));
    }

    if (path === "/checkout" && method === "POST") {
      const form = await readForm(req);
      const cart = priceCart(await store.getCart(session));
      if (cart.lines.length === 0) return redirect("/cart");
      const customer = {
        name: (form.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
        phone: (form.get("phone") ?? "").trim(),
        address: (form.get("address") ?? "").trim().slice(0, 200),
        email: (form.get("email") ?? "").trim(),
      };
      const rerender = async (error: string) => html(400, checkoutPage(await ctx(), cart, createChallenge(config.captchaSecret), { error, customer }));
      if (customer.name.length < 2) return rerender(t.nameRequired);
      const phone = normalizeAlgerianPhone(customer.phone);
      if (!phone) return rerender(t.phoneInvalid);
      if (customer.email && !isPlausibleEmail(customer.email)) return rerender(t.emailInvalid);
      if (form.get("terms") !== "yes") return rerender(t.termsRequired);
      if (!verify(config.captchaSecret, form.get("captchaToken") ?? undefined, form.get("captcha") ?? undefined)) return rerender(t.captchaFailed);
      const email = customer.email;

      // 1. Persist first. 2. Register. 3. Store orderId. 4. Redirect to formUrl only.
      const order = await store.createPending({
        amountMinor: cart.totalMinor,
        description: cart.lines.map((l) => `${l.product.name[lang]} x${l.quantity}`).join(", ").slice(0, 512),
        language: lang,
        sessionId: session,
        customerName: customer.name,
        customerPhone: phone,
        customerAddress: customer.address || null,
        customerEmail: email || null,
        items: cart.lines.map((l) => ({ productId: l.product.id, name: l.product.name[lang], unitMinor: l.product.priceMinor, quantity: l.quantity })),
      });
      try {
        const reg = await client.registerOrder({
          orderNumber: order.orderNumber,
          amount: fromMinorUnits(order.amountMinor),
          returnUrl: `${config.publicUrl}/payment/return?ref=${order.orderNumber}`,
          failUrl: `${config.publicUrl}/payment/fail?ref=${order.orderNumber}`,
          description: order.description,
          language: lang,
          metadata: { udf1: order.orderNumber },
        });
        await store.markRegistered(order.orderNumber, reg.orderId);
        await store.clearCart(session);
        return redirect(reg.formUrl);
      } catch (e) {
        const note = isWathiqPayError(e) ? `${e.name} (${e.outcome}): ${e.message}` : "unexpected error";
        log.push(`register failed for ${order.orderNumber}: ${note}`);
        // Operational log (visible in the host's function logs). Never contains credentials.
        console.error(`[merchant] register failed order=${order.orderNumber} ${note}${e instanceof Error && e.cause ? ` cause=${String((e.cause as Error).message ?? e.cause).slice(0, 200)}` : ""}`);
        await store.markFailed(order.orderNumber, note);
        return html(502, failurePage(await ctx(), (await store.get(order.orderNumber))!, undefined, "failed"));
      }
    }

    // ---- return from SATIM ------------------------------------------------
    // Both return routes are handled identically: the query string is only a
    // lookup key, never a payment claim. SATIM's appended orderId is cross-checked.
    if ((path === "/payment/return" || path === "/payment/fail") && method === "GET") {
      const ref = url.searchParams.get("ref") ?? "";
      const order = await store.get(ref);
      if (!order) return html(404, notFoundPage(await ctx()));
      const claimed = url.searchParams.get("orderId");
      if (claimed && order.satimOrderId && claimed !== order.satimOrderId) {
        log.push(`orderId mismatch on return for ${ref}`);
        return html(404, notFoundPage(await ctx()));
      }
      const settled = await settle(order);
      // Language consistency with the checkout that started it, even without the cookie.
      return html(200, await renderOutcome({ ...(await ctx()), lang: settled.order.language }, settled.order, settled.ack, settled.order.sessionId === session));
    }

    // ---- orders, receipts -------------------------------------------------
    if (path === "/orders" && method === "GET") return html(200, ordersPage(await ctx(), await store.ordersForSession(session)));

    m = /^\/orders\/([A-Z0-9]{1,10})$/.exec(path);
    if (m && method === "GET") {
      const order = await store.get(m[1]!);
      if (!order || order.sessionId !== session) return html(404, notFoundPage(await ctx()));
      const ack = order.ackJson ? (JSON.parse(order.ackJson) as AcknowledgeResult) : undefined;
      return html(200, orderDetailPage(await ctx(), order, await store.items(order.orderNumber), ack));
    }

    m = /^\/orders\/([A-Z0-9]{1,10})\/receipt(\.pdf)?$/.exec(path);
    if (m && method === "GET") {
      const order = await store.get(m[1]!);
      // Receipts contain the customer's details: only the session that placed the order may open them.
      if (!order || order.sessionId !== session || order.state !== "paid" || !order.ackJson) return html(404, notFoundPage(await ctx()));
      const data = { order, ack: JSON.parse(order.ackJson) as AcknowledgeResult };
      if (!m[2]) return html(200, receiptPage({ ...(await ctx()), lang: order.language }, data, await store.items(order.orderNumber)));
      const pdf = await renderPdf(order.language, data);
      res.writeHead(200, { "content-type": "application/pdf", "content-disposition": `attachment; filename="receipt-${order.orderNumber}.pdf"`, "cache-control": "no-store" });
      res.end(pdf);
      return;
    }

    m = /^\/orders\/([A-Z0-9]{1,10})\/receipt\/email$/.exec(path);
    if (m && method === "POST" && !emailEnabled) return html(404, notFoundPage(await ctx()));
    if (m && method === "POST") {
      const order = await store.get(m[1]!);
      if (!order || order.sessionId !== session || order.state !== "paid" || !order.ackJson) return html(404, notFoundPage(await ctx()));
      const form = await readForm(req);
      const email = (form.get("email") ?? "").trim();
      const data = { order, ack: JSON.parse(order.ackJson) as AcknowledgeResult };
      const pageCtx = { ...(await ctx()), lang: order.language };
      if (!isPlausibleEmail(email)) return html(400, successPage(pageCtx, data, await store.items(order.orderNumber), undefined, false, true, emailEnabled));
      const t2 = messages[order.language];
      const items = await store.items(order.orderNumber);
      try {
        await mailer.send({
        to: email,
        subject: `${t2.receipt} ${order.orderNumber}`,
        text: receiptRows(order.language, data).map(([k, v]) => `${k}: ${v}`).join("\n") + `\n${t2.support}\n`,
        pdf: await renderPdf(order.language, data),
        pdfName: `receipt-${order.orderNumber}.pdf`,
        });
      } catch (e) {
        console.error(`[merchant] receipt e-mail failed order=${order.orderNumber}: ${e instanceof Error ? e.message : String(e)}`);
        return html(502, successPage(pageCtx, data, items, undefined, true));
      }
      return html(200, successPage(pageCtx, data, items, email));
    }

    // ---- operational endpoints: bearer token required whenever one is configured
    if (path.startsWith("/admin/")) {
      if (config.adminToken) {
        const given = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
        const accepted = [config.adminToken, process.env["CRON_SECRET"]].filter((t): t is string => !!t);
        const ok = accepted.some((t) => given.length === t.length && timingSafeEqual(Buffer.from(given), Buffer.from(t)));
        if (!ok) return json(res, 401, { error: "unauthorized" });
      } else if (config.mode !== "simulator") {
        return json(res, 403, { error: "admin endpoints disabled: MERCHANT_ADMIN_TOKEN not set" });
      }
    }
    m = /^\/admin\/orders\/([A-Z0-9]{1,10})$/.exec(path);
    if (m && method === "GET") {
      const order = await store.get(m[1]!);
      if (!order) return json(res, 404, { error: "not found" });
      return json(res, 200, { ...redact(order), items: await store.items(order.orderNumber), fulfilments: await store.fulfilmentCount(order.orderNumber) });
    }
    if (path === "/admin/reconcile" && (method === "POST" || method === "GET")) {
      const olderThan = Number(url.searchParams.get("olderThan") ?? config.reconcileAfterSeconds);
      return json(res, 200, await reconcile(olderThan));
    }
    if (path === "/healthz") return json(res, 200, { ok: true, mode: config.mode });

    return html(404, layout(await ctx(), "404", `<h1>404</h1><p>${esc(t.notFound)}</p>`));
  }

  async function reconcile(olderThanSeconds = config.reconcileAfterSeconds) {
    const results: Array<{ orderNumber: string; state: OrderState }> = [];
    for (const order of await store.staleRegistered(olderThanSeconds)) {
      const { order: after } = await settle(order);
      results.push({ orderNumber: after.orderNumber, state: after.state });
    }
    return results;
  }

  async function renderPdf(lang: Lang, data: { order: OrderRow; ack: AcknowledgeResult }): Promise<Buffer> {
    const t = messages[lang];
    const items = (await store.items(data.order.orderNumber)).map((it) => ({ label: `${it.quantity} ×`, value: `${it.name}  ${formatAmount((BigInt(it.unitMinor) * BigInt(it.quantity)).toString(), lang)}` }));
    return buildReceiptPdf({
      direction: lang === "AR" ? "rtl" : "ltr",
      title: t.receipt,
      lines: [...receiptRows(lang, data).map(([label, value]) => ({ label, value })), ...items],
      footer: [t.support, `${t.total}: ${formatAmount(data.ack.amountMinor ?? data.order.amountMinor, lang)}`],
    });
  }

  const server = createServer((req, res) => {
    handle(req, res).catch((e) => {
      log.push(`unhandled: ${e instanceof Error ? e.message : String(e)}`);
      if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" });
      res.end("internal error");
    });
  });

  return {
    server,
    store,
    client,
    log,
    reconcile,
    handle,
    async start(port = config.port) {
      server.listen(port, config.host);
      await once(server, "listening");
      const address = server.address();
      return typeof address === "object" && address ? `http://127.0.0.1:${address.port}` : config.publicUrl;
    },
    async stop() {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
      store.close();
    },
  };
}

/** Accept 0X XX XX XX XX (X in 5,6,7) or +213 / 00213 forms; return the national 10-digit form. */
export function normalizeAlgerianPhone(raw: string): string | undefined {
  const digits = raw.replace(/[\s.\-()]/g, "");
  let m = /^(?:\+213|00213)([567]\d{8})$/.exec(digits);
  if (m) return `0${m[1]}`;
  m = /^0([567]\d{8})$/.exec(digits);
  if (m) return `0${m[1]}`;
  return undefined;
}

function clampQty(v: string | null | undefined, min = 1): number {
  const n = Number.parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n >= min && n <= 99 ? n : min;
}

async function readForm(req: IncomingMessage): Promise<URLSearchParams> {
  // Vercel's Node runtime consumes the stream and exposes the parsed body.
  const pre = (req as IncomingMessage & { body?: unknown }).body;
  if (pre !== undefined && pre !== null) {
    if (typeof pre === "string") return new URLSearchParams(pre);
    if (Buffer.isBuffer(pre)) return new URLSearchParams(pre.toString("utf8"));
    if (typeof pre === "object") {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(pre as Record<string, unknown>)) params.set(k, Array.isArray(v) ? String(v[0] ?? "") : String(v ?? ""));
      return params;
    }
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 64 * 1024) throw new Error("body too large");
    chunks.push(c as Buffer);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}
