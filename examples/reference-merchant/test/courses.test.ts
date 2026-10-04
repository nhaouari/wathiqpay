import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { Simulator } from "../../../test/contract/simulator.js";
import { createApp, type MerchantApp } from "../src/app.js";
import { OrderStore } from "../src/store.js";
import { createOchEnroller, type Enroller } from "../src/och.js";
import type { Mailer } from "../src/mailer.js";
import type { MerchantConfig } from "../src/config.js";

interface Page {
  status: number;
  url: string;
  body: string;
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
        headers: { cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "), ...(body !== undefined ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
        ...(body !== undefined ? { body } : {}),
      });
      for (const sc of res.headers.getSetCookie()) {
        const [k, v] = sc.split(";")[0]!.split("=");
        this.cookies.set(k!, v ?? "");
      }
      const text = await res.text();
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        current = new URL(res.headers.get("location")!, current).toString();
        method = "GET";
        body = undefined;
        continue;
      }
      return { status: res.status, url: current, body: text };
    }
    throw new Error("too many redirects");
  }
}

function captchaFrom(html: string): { answer: string; token: string } {
  const q = /<strong>(\d+) \+ (\d+)<\/strong>/.exec(html)!;
  return { answer: String(Number(q[1]) + Number(q[2])), token: /name="captchaToken" value="([^"]+)"/.exec(html)![1]! };
}

interface Harness {
  app: MerchantApp;
  origin: string;
  sim: Simulator;
  enrolled: Array<{ name: string | null; email: string; courseId: string }>;
  sent: string[];
  /** Make the next enrolment calls fail, as if the course platform were down. */
  failing: { on: boolean };
  stop(): Promise<void>;
}

async function startStore(overrides: Partial<MerchantConfig>): Promise<Harness> {
  const sim = new Simulator();
  const baseUrl = await sim.start();
  const enrolled: Harness["enrolled"] = [];
  const sent: string[] = [];
  const failing = { on: false };
  const enroller: Enroller = {
    async enroll(input) {
      if (failing.on) throw new Error("course platform unreachable");
      enrolled.push(input);
    },
  };
  const mailer: Mailer = { async send(m) { sent.push(`${m.to} | ${m.subject} | ${m.text}`); return { id: "x" }; } };
  const config: MerchantConfig = {
    mode: "simulator",
    port: 0,
    host: "127.0.0.1",
    adminToken: undefined,
    smtpUrl: undefined,
    smtpFrom: "receipts@merchant.example",
    publicUrl: "http://127.0.0.1:0",
    dbUrl: ":memory:", dbAuthToken: undefined,
    outboxDir: "/dev/null",
    captchaSecret: "test",
    satim: { username: "user", password: "secret", terminalId: "E0000000000", baseUrl },
    reconcileAfterSeconds: 0,
    store: "courses",
    academyUrl: "https://academy.example",
    ...overrides,
  };
  const app = await createApp(config, { mailer, enroller, store: await OrderStore.open({ url: ":memory:" }) });
  const origin = await app.start(0);
  config.publicUrl = origin;
  return { app, origin, sim, enrolled, sent, failing, stop: async () => { await app.stop(); await sim.stop(); } };
}

/** Put courses in the cart, check out, and pay on the simulated SATIM page. */
async function buy(h: Harness, b: Browser, courses: string[], email = "amina@example.com"): Promise<{ result: Page; ref: string }> {
  for (const product of courses) await b.go(`${h.origin}/cart/add`, { method: "POST", form: { product } });
  const c = captchaFrom((await b.go(`${h.origin}/checkout`)).body);
  const hosted = await b.go(`${h.origin}/checkout`, { method: "POST", form: { name: "Amina Benali", phone: "0550123456", email, terms: "yes", captcha: c.answer, captchaToken: c.token } });
  assert.match(hosted.body, /Simulated SATIM page/);
  const orderId = /\/hosted\/(SIM\d+)/.exec(hosted.url)![1]!;
  const ref = h.sim.orders.get(orderId)!.orderNumber;
  return { result: await b.go(`${hosted.url}/decide`, { method: "POST", form: { outcome: "paid" } }), ref };
}

describe("course store with enrolment enabled", () => {
  let h: Harness;
  before(async () => { h = await startStore({ enrollInTestMode: true }); });
  after(() => h.stop());

  test("catalog is Arabic by default and lists paid courses, their pages and the free courses", async () => {
    const b = new Browser();
    const home = await b.go(`${h.origin}/`);
    assert.match(home.body, /<html lang="ar" dir="rtl">/);
    assert.match(home.body, /متجر وثيق/);
    assert.match(home.body, /الأتمتة بأداة N8N خطوة بخطوة/);
    assert.match(home.body, /2\u00a0000,00 دج/);
    assert.match(home.body, /1\u00a0500,00 دج/);
    assert.doesNotMatch(home.body, /name="quantity"/, "a course has no quantity");
    assert.doesNotMatch(home.body, /Dattes|Maison Wathiq|دار وثيق/);
    assert.doesNotMatch(home.body, /test-banner"|· DEMO|· TEST/, "the store never presents itself as a demo");

    const course = await b.go(`${h.origin}/courses/n8n-automation`);
    assert.equal(course.status, 200);
    assert.match(course.body, /إنشاء بوت تيليجرام/);
    assert.match(course.body, /د\. نورالدين هواري[\s\S]*دكتوراه في أنظمة الحاسوب/, "the course page presents the instructor");
    assert.equal((await b.go(`${h.origin}/courses/dates`)).status, 404);
    assert.equal((await b.go(`${h.origin}/images/course-n8n.png`)).status, 200);
    assert.equal((await b.go(`${h.origin}/images/course-prompt.png`)).status, 200);

    const french = await b.go(`${h.origin}/lang/FR`);
    assert.match(french.body, /Automatiser avec N8N, pas à pas/);
    const terms = await b.go(`${h.origin}/conditions`);
    assert.match(terms.body, /cours en ligne/);
    assert.doesNotMatch(terms.body, /boutique de démonstration/);
    assert.match(french.body, /class="site-foot rich"[\s\S]*href="\/contact"[\s\S]*cib-edahabia-logo\.png/, "the footer links to contact and shows the accepted cards");
    const contact = await b.go(`${h.origin}/contact`);
    assert.equal(contact.status, 200);
    assert.match(contact.body, /Vendeur/);
    const privacy = await b.go(`${h.origin}/confidentialite`);
    assert.match(privacy.body, /OnlineCourseHost/);
    for (const lang of ["FR", "AR", "EN"]) {
      await b.go(`${h.origin}/lang/${lang}`);
      for (const path of ["/", "/courses/prompt-engineering", "/conditions", "/confidentialite", "/cart", "/contact"]) {
        assert.doesNotMatch((await b.go(`${h.origin}${path}`)).body, /gpt4ar|acad[eé]m|أكاديمي/i, `${lang} ${path}`);
      }
    }
    assert.deepEqual(await (await fetch(`${h.origin}/healthz`)).json(), { ok: true, mode: "simulator", store: "courses" });
  });

  test("a course is bought once, and checkout needs an e-mail address but no delivery address", async () => {
    const b = new Browser();
    await b.go(`${h.origin}/lang/FR`);
    await b.go(`${h.origin}/cart/add`, { method: "POST", form: { product: "n8n-automation" } });
    const cart = await b.go(`${h.origin}/cart/add`, { method: "POST", form: { product: "n8n-automation", quantity: "5" } });
    assert.match(cart.url, /\/cart$/);
    assert.match(cart.body, /1 500,00 DZD/);
    assert.doesNotMatch(cart.body, /7 500,00/);
    const page = await b.go(`${h.origin}/checkout`);
    assert.doesNotMatch(page.body, /name="address"/);
    assert.match(page.body, /name="email"[^>]*required/);
    const c = captchaFrom(page.body);
    const refused = await b.go(`${h.origin}/checkout`, { method: "POST", form: { name: "Amina Benali", phone: "0550123456", email: "", terms: "yes", captcha: c.answer, captchaToken: c.token } });
    assert.equal(refused.status, 400);
    assert.match(refused.body, /Indiquez votre adresse e-mail/);
    assert.equal(h.sim.requests.filter((r) => r.path.includes("register")).length, 0, "nothing reached SATIM");
  });

  test("a confirmed payment enrols the buyer once, shows how to sign in, and e-mails the confirmation", async () => {
    const b = new Browser();
    await b.go(`${h.origin}/lang/FR`);
    const { result, ref } = await buy(h, b, ["n8n-automation", "prompt-engineering"]);
    assert.match(result.body, /Paiement accepté/);
    assert.match(result.body, /3 500,00 DZD/);
    assert.deepEqual(h.enrolled, [
      { name: "Amina Benali", email: "amina@example.com", courseId: "rkUNIGXTgtrPCz130A2D" },
      { name: "Amina Benali", email: "amina@example.com", courseId: "3IOz3Dgd5qNg4bwlq6qg" },
    ]);
    assert.match(result.body, /Votre inscription est active/);
    assert.match(result.body, /<a href="https:\/\/academy\.example">la plateforme de cours<\/a>/);
    assert.match(result.body, /amina@example\.com/);
    assert.equal(h.sent.length, 1);
    assert.match(h.sent[0]!, /^amina@example\.com \| Votre accès au cours · Wathiq Store \| Votre inscription est active\. Connectez-vous sur https:\/\/academy\.example /);

    // Coming back, reopening the order and reconciling never enrol again.
    await b.go(`${h.origin}/payment/return?ref=${ref}`);
    assert.match((await b.go(`${h.origin}/orders/${ref}`)).body, /Votre inscription est active/);
    await h.app.reconcile(0);
    assert.equal(h.enrolled.length, 2);
    assert.equal(h.sent.length, 1);
    // Another visitor returning with the same link sees the result but not the buyer's e-mail address.
    assert.doesNotMatch((await new Browser().go(`${h.origin}/payment/return?ref=${ref}`)).body, /amina@example\.com/);
  });

  test("an enrolment that fails is retried by reconciliation; the buyer is told it is in progress", async () => {
    h.enrolled.length = 0;
    h.sent.length = 0;
    h.failing.on = true;
    const b = new Browser();
    await b.go(`${h.origin}/lang/EN`);
    const { result, ref } = await buy(h, b, ["n8n-automation"], "karim@example.com");
    assert.match(result.body, /Payment accepted/);
    assert.match(result.body, /Your enrolment is being finalised/);
    assert.doesNotMatch(result.body, /Your enrolment is active/);
    assert.equal(h.enrolled.length, 0);
    let rec = (await (await fetch(`${h.origin}/admin/orders/${ref}`)).json()) as { state: string; fulfilments: number; deliveries: Record<string, { attempts: number; deliveredAt: string | null; lastError: string | null }> };
    assert.equal(rec.state, "paid");
    assert.equal(rec.deliveries["n8n-automation"]!.deliveredAt, null);
    assert.match(rec.deliveries["n8n-automation"]!.lastError!, /unreachable/);

    h.failing.on = false;
    await h.app.reconcile(0);
    assert.deepEqual(h.enrolled, [{ name: "Amina Benali", email: "karim@example.com", courseId: "rkUNIGXTgtrPCz130A2D" }]);
    rec = (await (await fetch(`${h.origin}/admin/orders/${ref}`)).json()) as typeof rec;
    assert.ok(rec.deliveries["n8n-automation"]!.deliveredAt);
    assert.equal(rec.fulfilments, 1, "the order itself was fulfilled once");
    assert.match((await b.go(`${h.origin}/orders/${ref}`)).body, /Your enrolment is active/);
    assert.equal(h.sent.length, 1, "the confirmation goes out once the course is open");
    await h.app.reconcile(0);
    assert.equal(h.enrolled.length, 1);
  });

  test("a declined payment enrols nobody", async () => {
    h.enrolled.length = 0;
    const b = new Browser();
    await b.go(`${h.origin}/cart/add`, { method: "POST", form: { product: "n8n-automation" } });
    const c = captchaFrom((await b.go(`${h.origin}/checkout`)).body);
    const hosted = await b.go(`${h.origin}/checkout`, { method: "POST", form: { name: "Amina Benali", phone: "0550123456", email: "amina@example.com", terms: "yes", captcha: c.answer, captchaToken: c.token } });
    const result = await b.go(`${hosted.url}/decide`, { method: "POST", form: { outcome: "declined" } });
    assert.doesNotMatch(result.body, /تم قبول الدفع/);
    assert.equal(h.enrolled.length, 0);
  });
});

describe("course store on SATIM's test platform", () => {
  let h: Harness;
  before(async () => { h = await startStore({}); });
  after(() => h.stop());

  test("a test payment never opens a course, now or later", async () => {
    const b = new Browser();
    await b.go(`${h.origin}/lang/EN`);
    const { result, ref } = await buy(h, b, ["n8n-automation"]);
    assert.match(result.body, /Payment accepted/);
    assert.doesNotMatch(result.body, /class="access/, "no access is announced for a payment that enrols nobody");
    assert.doesNotMatch(result.body, /test mode/i);
    assert.equal(h.enrolled.length, 0);
    assert.equal(h.sent.length, 0);
    const rec = (await (await fetch(`${h.origin}/admin/orders/${ref}`)).json()) as { deliveries: Record<string, { skipped: boolean }> };
    assert.equal(rec.deliveries["n8n-automation"]!.skipped, true);
    assert.deepEqual(await h.app.store.ordersAwaitingDelivery(), [], "nothing is left to enrol if the store later goes live on the same database");
  });
});

test("the OnlineCourseHost client posts the documented request and rejects anything but success", async () => {
  const seen: Array<{ url: string; token: string; body: { name?: string; email: string; courseId: string; password: string } }> = [];
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString()) as (typeof seen)[number]["body"];
      seen.push({ url: `${req.method} ${req.url}`, token: String(req.headers["x-integration-token"]), body });
      const ok = body.courseId !== "missing";
      res.writeHead(ok ? 200 : 404, { "content-type": "application/json" });
      res.end(JSON.stringify(ok ? { status: "success", message: "Account created successfully." } : { status: "error", message: "Course not found" }));
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const enroller = createOchEnroller({ token: "tok", baseUrl: `http://127.0.0.1:${(server.address() as { port: number }).port}/` });
  try {
    await enroller.enroll({ name: "Amina", email: "amina@example.com", courseId: "c1" });
    assert.equal(seen[0]!.url, "POST /api/zapier-enroll-student-action-webhook");
    assert.equal(seen[0]!.token, "tok");
    assert.deepEqual({ ...seen[0]!.body, password: "" }, { name: "Amina", email: "amina@example.com", courseId: "c1", password: "" });
    assert.ok(seen[0]!.body.password.length >= 20, "a random password is always supplied");
    await assert.rejects(enroller.enroll({ name: null, email: "amina@example.com", courseId: "missing" }), (e: Error) => /HTTP 404/.test(e.message) && !e.message.includes("tok"));
  } finally {
    server.closeAllConnections();
    server.close();
  }
});
