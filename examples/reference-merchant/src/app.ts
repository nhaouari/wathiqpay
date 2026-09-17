/**
 * Reference merchant HTTP application. Framework-free so the flow is
 * readable end to end: checkout -> register -> redirect -> return ->
 * acknowledge -> compare -> fulfil once -> receipt.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { once } from "node:events";
import { createClient, classifyPayment, paymentMatchesOrder, fromMinorUnits, isWathiqPayError, redact, type AcknowledgeResult, type WathiqPayClient } from "../../../src/index.js";
import type { MerchantConfig } from "./config.js";
import { OrderStore, type OrderRow, type OrderState } from "./store.js";
import { messages, normalizeLang, formatAmount, type Lang } from "./i18n.js";
import { createChallenge, verify } from "./captcha.js";
import { buildReceiptPdf } from "./receipt-pdf.js";
import { createOutboxMailer, isPlausibleEmail, type Mailer } from "./mailer.js";
import { checkoutPage, successPage, failurePage, receiptPage, receiptRows, notFoundPage, layout, esc } from "./views.js";

const UNIT_PRICE_MINOR = "80650"; // 806.50 DZD, the portal's own example amount

export interface MerchantApp {
  server: Server;
  store: OrderStore;
  client: WathiqPayClient;
  start(port?: number): Promise<string>;
  stop(): Promise<void>;
  /** Closed-browser recovery: acknowledge orders the customer never returned from. */
  reconcile(olderThanSeconds?: number): Promise<Array<{ orderNumber: string; state: OrderState }>>;
  log: string[];
}

export function createApp(config: MerchantConfig, deps: { mailer?: Mailer; store?: OrderStore } = {}): MerchantApp {
  const store = deps.store ?? new OrderStore(config.dbPath);
  const mailer = deps.mailer ?? createOutboxMailer(config.outboxDir);
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
      return { order: store.get(order.orderNumber)!, ack: undefined };
    }
    const ackJson = JSON.stringify(ack);
    const state = classifyPayment(ack);
    const match = paymentMatchesOrder(ack, { orderNumber: order.orderNumber, amount: fromMinorUnits(order.amountMinor) });
    if (state === "paid") {
      if (match.matches) {
        if (store.fulfilOnce(order.orderNumber, ackJson)) fulfil(order);
      } else {
        store.recordAcknowledgement(order.orderNumber, "review", ackJson, `mismatch: ${match.mismatches.join(",")}`);
      }
    } else if (state === "registered" || state === "unknown") {
      store.recordAcknowledgement(order.orderNumber, state === "registered" ? "registered" : "unknown", ackJson);
    } else {
      store.recordAcknowledgement(order.orderNumber, state, ackJson);
    }
    return { order: store.get(order.orderNumber)!, ack };
  }

  function renderOutcome(lang: Lang, order: OrderRow, ack: AcknowledgeResult | undefined): string {
    switch (order.state) {
      case "paid":
        return successPage(lang, { order, ack: ack! });
      case "declined":
        return failurePage(lang, order, ack, "declined");
      case "reversed":
      case "refunded":
        return failurePage(lang, order, ack, "reversed");
      case "review":
        return failurePage(lang, order, ack, "review");
      case "failed":
        return failurePage(lang, order, ack, "failed");
      default:
        return failurePage(lang, order, ack, "pending");
    }
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", config.publicUrl);
    const cookies = parseCookies(req.headers.cookie);
    const lang = normalizeLang(cookies["lang"]);
    const t = messages[lang];
    const html = (status: number, body: string, extra: Record<string, string> = {}) => {
      res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...extra });
      res.end(body);
    };
    const redirect = (to: string, extra: Record<string, string> = {}) => {
      res.writeHead(303, { location: to, ...extra });
      res.end();
    };
    const method = req.method ?? "GET";
    const path = url.pathname;

    // Language switch; kept in a cookie so every page, the SATIM request, and the receipt agree.
    let m = /^\/lang\/(\w+)$/.exec(path);
    if (m) {
      const next = url.searchParams.get("next") ?? "/";
      return redirect(next.startsWith("/") ? next : "/", { "set-cookie": `lang=${normalizeLang(m[1])}; Path=/; SameSite=Lax` });
    }

    if (path === "/" && method === "GET") {
      const qty = clampQty(url.searchParams.get("quantity"));
      const c = createChallenge(config.captchaSecret);
      return html(200, checkoutPage(lang, { unitMinor: UNIT_PRICE_MINOR, quantity: qty, totalMinor: total(qty), captchaQuestion: c.question, captchaToken: c.token }));
    }

    if (path === "/checkout" && method === "POST") {
      const form = await readForm(req);
      const qty = clampQty(form.get("quantity"));
      const rerender = (error: string) => {
        const c = createChallenge(config.captchaSecret);
        return html(400, checkoutPage(lang, { unitMinor: UNIT_PRICE_MINOR, quantity: qty, totalMinor: total(qty), captchaQuestion: c.question, captchaToken: c.token, error }));
      };
      if (form.get("terms") !== "yes") return rerender(t.termsRequired);
      if (!verify(config.captchaSecret, form.get("captchaToken") ?? undefined, form.get("captcha") ?? undefined)) return rerender(t.captchaFailed);

      // 1. Persist first. 2. Register. 3. Store orderId. 4. Redirect to formUrl only.
      const order = store.createPending({ amountMinor: total(qty), description: `${t.product} x${qty}`, language: lang });
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
        store.markRegistered(order.orderNumber, reg.orderId);
        return redirect(reg.formUrl);
      } catch (e) {
        const note = isWathiqPayError(e) ? `${e.name} (${e.outcome}): ${e.message}` : "unexpected error";
        log.push(`register failed for ${order.orderNumber}: ${note}`);
        store.markFailed(order.orderNumber, note);
        return html(502, failurePage(lang, store.get(order.orderNumber)!, undefined, "failed"));
      }
    }

    // Both return routes are handled identically: the query string is only a
    // lookup key, never a payment claim. SATIM's appended orderId is cross-checked.
    if ((path === "/payment/return" || path === "/payment/fail") && method === "GET") {
      const ref = url.searchParams.get("ref") ?? "";
      const order = store.get(ref);
      if (!order) return html(404, notFoundPage(lang));
      const claimed = url.searchParams.get("orderId");
      if (claimed && order.satimOrderId && claimed !== order.satimOrderId) {
        log.push(`orderId mismatch on return for ${ref}`);
        return html(404, notFoundPage(lang));
      }
      const settled = await settle(order);
      const pageLang = settled.order.language; // language consistency with the checkout that started it
      return html(200, renderOutcome(pageLang, settled.order, settled.ack));
    }

    m = /^\/orders\/([A-Z0-9]{1,10})\/receipt(\.pdf)?$/.exec(path);
    if (m && method === "GET") {
      const order = store.get(m[1]!);
      if (!order || order.state !== "paid" || !order.ackJson) return html(404, notFoundPage(lang));
      const data = { order, ack: JSON.parse(order.ackJson) as AcknowledgeResult };
      if (!m[2]) return html(200, receiptPage(order.language, data));
      const pdf = renderPdf(order.language, data);
      res.writeHead(200, { "content-type": "application/pdf", "content-disposition": `attachment; filename="receipt-${order.orderNumber}.pdf"`, "cache-control": "no-store" });
      res.end(pdf);
      return;
    }

    m = /^\/orders\/([A-Z0-9]{1,10})\/receipt\/email$/.exec(path);
    if (m && method === "POST") {
      const order = store.get(m[1]!);
      if (!order || order.state !== "paid" || !order.ackJson) return html(404, notFoundPage(lang));
      const form = await readForm(req);
      const email = (form.get("email") ?? "").trim();
      const data = { order, ack: JSON.parse(order.ackJson) as AcknowledgeResult };
      if (!isPlausibleEmail(email)) return html(400, successPage(order.language, data));
      const pdf = renderPdf(order.language, data);
      const t2 = messages[order.language];
      await mailer.send({
        to: email,
        subject: `${t2.receipt} ${order.orderNumber}`,
        text: receiptRows(order.language, data).map(([k, v]) => `${k}: ${v}`).join("\n") + `\n${t2.support}\n`,
        pdf,
        pdfName: `receipt-${order.orderNumber}.pdf`,
      });
      return html(200, successPage(order.language, data, email));
    }

    // Operational endpoints (demo only; protect them in a real deployment).
    m = /^\/admin\/orders\/([A-Z0-9]{1,10})$/.exec(path);
    if (m && method === "GET") {
      const order = store.get(m[1]!);
      if (!order) return json(res, 404, { error: "not found" });
      return json(res, 200, { ...redact(order), fulfilments: store.fulfilmentCount(order.orderNumber) });
    }
    if (path === "/admin/reconcile" && method === "POST") {
      const olderThan = Number(url.searchParams.get("olderThan") ?? config.reconcileAfterSeconds);
      return json(res, 200, await reconcile(olderThan));
    }
    if (path === "/healthz") return json(res, 200, { ok: true, mode: config.mode });

    return html(404, layout(lang, "404", `<h1>404</h1><p>${esc(t.notFound)}</p>`));
  }

  async function reconcile(olderThanSeconds = config.reconcileAfterSeconds) {
    const results: Array<{ orderNumber: string; state: OrderState }> = [];
    for (const order of store.staleRegistered(olderThanSeconds)) {
      const { order: after } = await settle(order);
      results.push({ orderNumber: after.orderNumber, state: after.state });
    }
    return results;
  }

  function renderPdf(lang: Lang, data: { order: OrderRow; ack: AcknowledgeResult }): Buffer {
    // Standard PDF fonts cannot render Arabic; fall back to French labels for AR.
    const pdfLang: Lang = lang === "AR" ? "FR" : lang;
    const t = messages[pdfLang];
    return buildReceiptPdf(
      t.receipt,
      receiptRows(pdfLang, data).map(([label, value]) => ({ label, value })),
      [t.support, `${t.total}: ${formatAmount(data.ack.amountMinor ?? data.order.amountMinor, pdfLang)}`],
    );
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
    async start(port = config.port) {
      server.listen(port, "127.0.0.1");
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

function total(qty: number): string {
  return (BigInt(UNIT_PRICE_MINOR) * BigInt(qty)).toString();
}

function clampQty(v: string | null | undefined): number {
  const n = Number.parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n >= 1 && n <= 99 ? n : 1;
}

async function readForm(req: IncomingMessage): Promise<URLSearchParams> {
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
