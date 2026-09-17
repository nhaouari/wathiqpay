import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { Simulator } from "./simulator.js";
import { createClient, classifyPayment, TransportError, GatewayError, MalformedResponseError, type WathiqPayClient } from "../../src/index.js";

const creds = { username: "user", password: "secret", terminalId: "E0000000000" };
const order = (n: string) => ({
  orderNumber: n,
  amount: { value: "806.50", currency: "DZD" as const },
  returnUrl: "https://merchant.example/return?x=1&y=é",
  failUrl: "https://merchant.example/fail",
  description: "Commande n°1 & accents: é/ü — “quotes”",
  metadata: { udf1: 'inv "1" & 2' },
});

describe("real fetch transport against the local simulator", () => {
  const sim = new Simulator();
  let client: WathiqPayClient;
  before(async () => {
    const baseUrl = await sim.start();
    client = createClient({ environment: "simulator", baseUrl, ...creds, timeoutMs: 2000 });
  });
  after(() => sim.stop());

  test("full synthetic journey: register, acknowledge unpaid, pay, acknowledge paid, refund", async () => {
    const reg = await client.registerOrder(order("CMD000001"));
    assert.match(reg.orderId, /^SIM\d{6}$/);
    const req = sim.requests.at(-1)!;
    assert.equal(req.method, "POST");
    assert.match(String(req.headers["content-type"]), /^application\/x-www-form-urlencoded/);
    assert.equal(req.form["returnUrl"], "https://merchant.example/return?x=1&y=é");
    assert.equal(req.form["description"], "Commande n°1 & accents: é/ü — “quotes”");
    assert.deepEqual(JSON.parse(req.form["jsonParams"]!), { force_terminal_id: "E0000000000", udf1: 'inv "1" & 2' });

    const before = await client.acknowledgeTransaction(reg.orderId);
    assert.equal(classifyPayment(before), "registered");

    sim.pay(reg.orderId);
    const after = await client.acknowledgeTransaction(reg.orderId);
    assert.equal(classifyPayment(after), "paid");
    assert.equal(after.orderNumber, "CMD000001");
    assert.equal(after.amountMinor, "80650");

    await client.refund({ orderId: reg.orderId, amount: { value: "300.00", currency: "DZD" } });
    await client.refund({ orderId: reg.orderId, amount: { value: "506.50", currency: "DZD" } });
    assert.equal(classifyPayment(await client.acknowledgeTransaction(reg.orderId)), "refunded");
    await assert.rejects(client.refund({ orderId: reg.orderId, amount: { value: "1.00", currency: "DZD" } }), GatewayError);
  });

  test("duplicate order number is rejected by the gateway", async () => {
    await client.registerOrder(order("CMD000002"));
    await assert.rejects(client.registerOrder(order("CMD000002")), (e: unknown) => e instanceof GatewayError && e.errorCode === "1");
  });

  test("wrong credentials surface as GatewayError 5 and unknown order as 6", async () => {
    const bad = createClient({ environment: "simulator", baseUrl: sim.baseUrl, ...creds, password: "wrong" });
    await assert.rejects(bad.registerOrder(order("CMD000003")), (e: unknown) => e instanceof GatewayError && e.errorCode === "5");
    await assert.rejects(client.acknowledgeTransaction("NOPE"), (e: unknown) => e instanceof GatewayError && e.errorCode === "6");
  });
});

describe("failure modes", () => {
  test("HTTP error status, invalid JSON, truncated body, and redirect", async () => {
    const sim = new Simulator({
      override: {
        "/register.do": { status: 500, body: "boom" },
        "/public/acknowledgeTransaction.do": '{"ErrorCode": "0", "OrderStatus": 2',
        "/refund.do": { status: 302, body: "", headers: { location: "http://127.0.0.1/elsewhere" } },
      },
    });
    const baseUrl = await sim.start();
    try {
      const client = createClient({ environment: "simulator", baseUrl, ...creds });
      await assert.rejects(client.registerOrder(order("CMD000004")), (e: unknown) => e instanceof TransportError && e.kind === "http-status" && e.status === 500 && e.outcome === "indeterminate");
      await assert.rejects(client.acknowledgeTransaction("x"), MalformedResponseError);
      await assert.rejects(client.refund({ orderId: "x", amount: { value: "1.00", currency: "DZD" } }), (e: unknown) => e instanceof TransportError && (e.kind === "redirect" || e.kind === "http-status"));
    } finally {
      await sim.stop();
    }
  });

  test("timeout after the simulator recorded the request produces no duplicate request", async () => {
    const sim = new Simulator({ delayMs: { "/refund.do": 400 } });
    const baseUrl = await sim.start();
    try {
      const client = createClient({ environment: "simulator", baseUrl, ...creds, timeoutMs: 100 });
      const reg = await client.registerOrder(order("CMD000005"));
      sim.pay(reg.orderId);
      await assert.rejects(client.refund({ orderId: reg.orderId, amount: { value: "10.00", currency: "DZD" } }), (e: unknown) => e instanceof TransportError && e.kind === "timeout" && e.outcome === "indeterminate");
      await new Promise((r) => setTimeout(r, 500));
      const refundRequests = sim.requests.filter((r) => r.path === "/refund.do");
      assert.equal(refundRequests.length, 1, "exactly one refund request was sent");
      assert.equal(sim.orders.get(reg.orderId)!.refunded, 1000n, "the server did process the refund");
    } finally {
      await sim.stop();
    }
  });

  test("caller cancellation", async () => {
    const sim = new Simulator({ delayMs: { "/register.do": 400 } });
    const baseUrl = await sim.start();
    try {
      const client = createClient({ environment: "simulator", baseUrl, ...creds });
      const controller = new AbortController();
      const pending = client.registerOrder(order("CMD000006"), { signal: controller.signal });
      setTimeout(() => controller.abort(), 50);
      await assert.rejects(pending, (e: unknown) => e instanceof TransportError && e.kind === "aborted");
    } finally {
      await sim.stop();
    }
  });

  test("error messages from the transport do not contain credentials", async () => {
    const client = createClient({ environment: "simulator", baseUrl: "http://127.0.0.1:1", ...creds, timeoutMs: 500 });
    try {
      await client.acknowledgeTransaction("x");
      assert.fail("expected failure");
    } catch (e) {
      assert.ok(e instanceof TransportError);
      assert.ok(!e.message.includes("secret"));
      assert.ok(!JSON.stringify(e).includes("secret"));
    }
  });
});
