import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { Simulator } from "../../../test/contract/simulator.js";
import { createApp, type MerchantApp } from "../src/app.js";
import { OrderStore, generateOrderNumber } from "../src/store.js";
import type { Mailer } from "../src/mailer.js";
import type { MerchantConfig } from "../src/config.js";

interface Page {
  status: number;
  url: string;
  body: string;
  headers: Headers;
}

/** Minimal "browser": follows redirects manually and keeps a cookie jar. */
class Browser {
  cookies = new Map<string, string>();
  async go(url: string, init: { method?: string; form?: Record<string, string> } = {}): Promise<Page> {
    let current = url;
    let method = init.method ?? "GET";
    let body: string | undefined = init.form ? new URLSearchParams(init.form).toString() : undefined;
    for (let hops = 0; hops < 8; hops += 1) {
      const res = await fetch(current, {
        method,
        redirect: "manual",
        headers: {
          cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
          ...(body !== undefined ? { "content-type": "application/x-www-form-urlencoded" } : {}),
        },
        ...(body !== undefined ? { body } : {}),
      });
      for (const sc of res.headers.getSetCookie()) {
        const [pair] = sc.split(";");
        const [k, v] = pair!.split("=");
        this.cookies.set(k!, v ?? "");
      }
      const text = await res.text();
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        current = new URL(res.headers.get("location")!, current).toString();
        method = "GET";
        body = undefined;
        continue;
      }
      return { status: res.status, url: current, body: text, headers: res.headers };
    }
    throw new Error("too many redirects");
  }
}

function captchaFrom(html: string): { answer: string; token: string } {
  const q = /<strong>(\d+) \+ (\d+)<\/strong>/.exec(html)!;
  const token = /name="captchaToken" value="([^"]+)"/.exec(html)![1]!;
  return { answer: String(Number(q[1]) + Number(q[2])), token };
}

describe("reference merchant journey against the simulator", () => {
  const sim = new Simulator();
  const sent: Array<{ to: string; pdf: Buffer }> = [];
  const mailer: Mailer = { async send(m) { sent.push({ to: m.to, pdf: m.pdf }); return { id: "x" }; } };
  let app: MerchantApp;
  let origin: string;

  before(async () => {
    const baseUrl = await sim.start();
    const config: MerchantConfig = {
      mode: "simulator",
      port: 0,
      publicUrl: "http://127.0.0.1:0",
      dbPath: ":memory:",
      outboxDir: "/dev/null",
      captchaSecret: "test",
      satim: { username: "user", password: "secret", terminalId: "E0000000000", baseUrl },
      reconcileAfterSeconds: 0,
    };
    app = createApp(config, { mailer, store: new OrderStore(":memory:") });
    origin = await app.start(0);
    config.publicUrl = origin;
  });
  after(async () => {
    await app.stop();
    await sim.stop();
  });

  /** Add items to the cart and submit the checkout; returns the hosted page (or the error page). */
  async function checkout(b: Browser, opts: { captcha?: string; terms?: string; items?: Array<[string, string]>; email?: string; name?: string; phone?: string } = {}): Promise<Page> {
    for (const [product, quantity] of opts.items ?? [["dates", "1"]]) {
      await b.go(`${origin}/cart/add`, { method: "POST", form: { product, quantity } });
    }
    const page = await b.go(`${origin}/checkout`);
    const c = captchaFrom(page.body);
    return b.go(`${origin}/checkout`, {
      method: "POST",
      form: { name: opts.name ?? "Amina Benali", phone: opts.phone ?? "+213 550 12 34 56", address: "12 rue Didouche Mourad, Alger", terms: opts.terms ?? "yes", captcha: opts.captcha ?? c.answer, captchaToken: c.token, email: opts.email ?? "" },
    });
  }

  function refFromHosted(page: Page): { orderId: string; ref: string } {
    const orderId = /\/hosted\/(SIM\d+)/.exec(page.url)![1]!;
    const ref = sim.orders.get(orderId)!.orderNumber;
    return { orderId, ref };
  }

  test("catalog, cart, and checkout: totals are exact and the checkout shows terms, CAPTCHA, and the CIB/Edahabia button", async () => {
    const b = new Browser();
    const catalog = await b.go(`${origin}/`);
    assert.match(catalog.body, /Dattes Deglet Nour/);
    assert.match(catalog.body, /1 200,00 DZD/);
    await b.go(`${origin}/cart/add`, { method: "POST", form: { product: "dates", quantity: "2" } });
    await b.go(`${origin}/cart/add`, { method: "POST", form: { product: "olive-oil", quantity: "1" } });
    let cart = await b.go(`${origin}/cart`);
    assert.match(cart.body, /4 200,00 DZD/); // 2 × 1200 + 1800
    await b.go(`${origin}/cart/update`, { method: "POST", form: { product: "olive-oil", quantity: "0" } });
    cart = await b.go(`${origin}/cart`);
    assert.match(cart.body, /2 400,00 DZD/);
    assert.doesNotMatch(cart.body, /Huile d'olive/);
    const page = await b.go(`${origin}/checkout`);
    assert.match(page.body, /id="total">2 400,00 DZD/);
    assert.match(page.body, /name="terms"/);
    assert.match(page.body, /name="captcha"/);
    assert.match(page.body, /CIB · Edahabia/);
    assert.match(page.body, /lang="fr"/);
    const empty = await new Browser().go(`${origin}/checkout`);
    assert.match(empty.body, /panier est vide/);
  });

  test("CAPTCHA and terms are enforced before any SATIM call", async () => {
    const b = new Browser();
    const before = sim.requests.length;
    const bad = await checkout(b, { captcha: "999" });
    assert.equal(bad.status, 400);
    assert.match(bad.body, /anti-robot a échoué/);
    const noTerms = await checkout(b, { terms: "" });
    assert.equal(noTerms.status, 400);
    const noName = await checkout(b, { name: " " });
    assert.equal(noName.status, 400);
    assert.match(noName.body, /nom complet/);
    const badPhone = await checkout(b, { phone: "0412345678" });
    assert.equal(badPhone.status, 400);
    assert.match(badPhone.body, /numéro de téléphone/);
    assert.match(badPhone.body, /value="Amina Benali"/, "typed values are kept on re-render");
    assert.equal(sim.requests.length, before, "no gateway request was made");
  });

  test("successful payment: register, redirect, return, acknowledge, fulfil once, receipts", async () => {
    const b = new Browser();
    const hosted = await checkout(b, { items: [["dates", "2"], ["book", "1"]], email: "client@example.com" });
    assert.match(hosted.body, /Simulated SATIM page/);
    const { orderId, ref } = refFromHosted(hosted);
    assert.equal(ref.length, 10);
    let rec = await (await fetch(`${origin}/admin/orders/${ref}`)).json() as { state: string; satimOrderId: string };
    assert.equal(rec.state, "registered");
    assert.equal(rec.satimOrderId, orderId, "SATIM orderId stored before redirect");

    const result = await b.go(`${hosted.url}/decide`, { method: "POST", form: { outcome: "paid" } });
    assert.equal(result.status, 200);
    assert.match(result.body, /Paiement accepté/);
    assert.match(result.body, new RegExp(ref));
    assert.match(result.body, new RegExp(orderId));
    assert.match(result.body, /303030/); // approval code
    assert.match(result.body, /4 900,00 DZD/); // 2 × 1200 + 2500
    assert.match(result.body, /Dattes Deglet Nour 1 kg × 2/);
    assert.match(result.body, /Carte CIB \/ Edahabia/);
    const cartAfter = await b.go(`${origin}/cart`);
    assert.match(cartAfter.body, /panier est vide/, "cart is cleared after a successful registration");
    const orders = await b.go(`${origin}/orders`);
    assert.match(orders.body, new RegExp(`${ref}[\\s\\S]*Payée`));
    const detail = await b.go(`${origin}/orders/${ref}`);
    assert.match(detail.body, /receipt\.pdf/);
    assert.match(detail.body, /Amina Benali/);
    assert.match(detail.body, /0550123456/, "phone normalised to national form");
    const stored = await (await fetch(`${origin}/admin/orders/${ref}`)).json() as { customerName: string; customerPhone: string };
    assert.equal(stored.customerPhone, "0550123456");
    const foreign = await new Browser().go(`${origin}/orders/${ref}`);
    assert.equal(foreign.status, 404, "another session cannot open the order");
    assert.match(result.body, /3020/);
    assert.match(result.body, /receipt\.pdf/);

    rec = await (await fetch(`${origin}/admin/orders/${ref}`)).json() as { state: string; satimOrderId: string };
    assert.equal(rec.state, "paid");
    assert.deepEqual(app.log.filter((l) => l.startsWith("fulfilled")), [`fulfilled ${ref}`]);

    // Repeated return: served from stored state, no second acknowledgement, no second fulfilment.
    const acksBefore = sim.requests.filter((r) => r.path.includes("acknowledge")).length;
    const again = await b.go(`${origin}/payment/return?ref=${ref}&orderId=${orderId}`);
    assert.match(again.body, /Paiement accepté/);
    assert.equal(sim.requests.filter((r) => r.path.includes("acknowledge")).length, acksBefore);
    assert.equal(app.store.fulfilmentCount(ref), 1);

    // Printable receipt, PDF, and email.
    const printable = await b.go(`${origin}/orders/${ref}/receipt`);
    assert.match(printable.body, /Reçu de paiement/);
    const pdf = await fetch(`${origin}/orders/${ref}/receipt.pdf`);
    assert.equal(pdf.headers.get("content-type"), "application/pdf");
    const bytes = Buffer.from(await pdf.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    assert.ok(bytes.includes(Buffer.from(ref)));
    const mailed = await b.go(`${origin}/orders/${ref}/receipt/email`, { method: "POST", form: { email: "client@example.com" } });
    assert.match(mailed.body, /envoyé à client@example.com/);
    assert.equal(sent.length, 1);
    assert.equal(sent[0]!.to, "client@example.com");
    assert.equal(sent[0]!.pdf.subarray(0, 5).toString(), "%PDF-");
  });

  test("declined payment lands on the failure route, shows the gateway message, and never fulfils", async () => {
    const b = new Browser();
    const hosted = await checkout(b);
    const { ref } = refFromHosted(hosted);
    const result = await b.go(`${hosted.url}/decide`, { method: "POST", form: { outcome: "declined" } });
    assert.match(result.url, /\/payment\/fail\?ref=/);
    assert.match(result.body, /Paiement refusé/);
    assert.match(result.body, /Solde insuffisant/);
    assert.match(result.body, /3020/);
    const rec = await (await fetch(`${origin}/admin/orders/${ref}`)).json() as { state: string };
    assert.equal(rec.state, "declined");
    assert.equal(app.store.fulfilmentCount(ref), 0);
  });

  test("reversed transaction shows the required rejection message", async () => {
    const b = new Browser();
    const hosted = await checkout(b);
    const result = await b.go(`${hosted.url}/decide`, { method: "POST", form: { outcome: "reversed" } });
    assert.match(result.body, /Votre transaction a été rejetée/);
    assert.match(result.body, /3020/);
  });

  test("undocumented status 1 is held as unknown, not fulfilled", async () => {
    const b = new Browser();
    const hosted = await checkout(b);
    const { ref } = refFromHosted(hosted);
    const result = await b.go(`${hosted.url}/decide`, { method: "POST", form: { outcome: "approved-one-phase" } });
    assert.match(result.body, /en cours de vérification/);
    const rec = await (await fetch(`${origin}/admin/orders/${ref}`)).json() as { state: string };
    assert.equal(rec.state, "unknown");
    assert.equal(app.store.fulfilmentCount(ref), 0);
  });

  test("query-string claims are not trusted: foreign orderId or unknown ref yields 404, no fulfilment", async () => {
    const b = new Browser();
    const hosted = await checkout(b);
    const { ref } = refFromHosted(hosted);
    const forged = await b.go(`${origin}/payment/return?ref=${ref}&orderId=SIM999999`);
    assert.equal(forged.status, 404);
    const unknown = await b.go(`${origin}/payment/return?ref=WNOPE12345`);
    assert.equal(unknown.status, 404);
    assert.equal(app.store.fulfilmentCount(ref), 0);
  });

  test("concurrent returns for one paid order fulfil exactly once", async () => {
    const b = new Browser();
    const hosted = await checkout(b);
    const { orderId, ref } = refFromHosted(hosted);
    sim.pay(orderId);
    const pages = await Promise.all(Array.from({ length: 6 }, () => new Browser().go(`${origin}/payment/return?ref=${ref}`)));
    for (const p of pages) assert.match(p.body, /Paiement accepté/);
    assert.equal(app.store.fulfilmentCount(ref), 1);
    assert.equal(app.log.filter((l) => l === `fulfilled ${ref}`).length, 1);
  });

  test("closed browser: reconcile acknowledges stale registered orders", async () => {
    const b = new Browser();
    const paidHosted = await checkout(b);
    const paid = refFromHosted(paidHosted);
    await b.go(`${paidHosted.url}/decide`, { method: "POST", form: { outcome: "abandon" } });
    sim.orders.get(paid.orderId)!.status = 2; // customer paid, then closed the browser before the redirect
    sim.orders.get(paid.orderId)!.respCode = "00";
    const unpaidHosted = await checkout(new Browser());
    const unpaid = refFromHosted(unpaidHosted);

    const summary = await (await fetch(`${origin}/admin/reconcile?olderThan=0`, { method: "POST" })).json() as Array<{ orderNumber: string; state: string }>;
    const byRef = Object.fromEntries(summary.map((s) => [s.orderNumber, s.state]));
    assert.equal(byRef[paid.ref], "paid");
    assert.equal(byRef[unpaid.ref], "registered");
    assert.equal(app.store.fulfilmentCount(paid.ref), 1);
    assert.equal(app.store.fulfilmentCount(unpaid.ref), 0);
  });

  test("language is consistent from checkout through SATIM request to result page", async () => {
    const b = new Browser();
    await b.go(`${origin}/lang/AR?next=/`);
    const page = await b.go(`${origin}/`);
    assert.match(page.body, /dir="rtl"/);
    const hosted = await checkout(b);
    const reg = sim.requests.filter((r) => r.path === "/register.do").at(-1)!;
    assert.equal(reg.form["language"], "AR");
    const result = await new Browser().go(`${(await b.go(`${hosted.url}/decide`, { method: "POST", form: { outcome: "paid" } })).url}`);
    assert.match(result.body, /تم قبول الدفع/, "result page uses the order's language even without the cookie");
    const ack = sim.requests.filter((r) => r.path.includes("acknowledge")).at(-1)!;
    assert.equal(ack.form["language"], "AR");
  });

  test("registration failure is reported without taking payment", async () => {
    const broken = createApp(
      { mode: "simulator", port: 0, publicUrl: origin, dbPath: ":memory:", outboxDir: "/dev/null", captchaSecret: "test", satim: { username: "user", password: "wrong", terminalId: "E0000000000", baseUrl: sim.baseUrl }, reconcileAfterSeconds: 0 },
      { mailer, store: new OrderStore(":memory:") },
    );
    const o = await broken.start(0);
    try {
      const b = new Browser();
      await b.go(`${o}/cart/add`, { method: "POST", form: { product: "dates", quantity: "1" } });
      const page = await b.go(`${o}/checkout`);
      const c = captchaFrom(page.body);
      const res = await b.go(`${o}/checkout`, { method: "POST", form: { name: "Test", phone: "0661223344", terms: "yes", captcha: c.answer, captchaToken: c.token } });
      assert.equal(res.status, 502);
      assert.match(res.body, /pas pu être enregistrée/);
      assert.doesNotMatch(res.body, /wrong/);
    } finally {
      await broken.stop();
    }
  });
});

describe("order store", () => {
  test("order numbers are 10 alphanumeric characters and unique", () => {
    const store = new OrderStore(":memory:");
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i += 1) {
      const n = generateOrderNumber();
      assert.match(n, /^[A-Z0-9]{10}$/);
      seen.add(n);
    }
    assert.equal(seen.size, 2000);
    const a = store.createPending({ amountMinor: "5000", description: "x", language: "FR" });
    const b = store.createPending({ amountMinor: "5000", description: "x", language: "FR" });
    assert.notEqual(a.orderNumber, b.orderNumber);
    store.markRegistered(a.orderNumber, "SIM1");
    assert.throws(() => store.markRegistered(b.orderNumber, "SIM1"), /UNIQUE/);
    assert.equal(store.fulfilOnce(a.orderNumber, "{}"), true);
    assert.equal(store.fulfilOnce(a.orderNumber, "{}"), false);
    assert.equal(store.fulfilmentCount(a.orderNumber), 1);
    store.close();
  });
});
