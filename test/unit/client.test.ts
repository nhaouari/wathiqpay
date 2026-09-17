import { test } from "node:test";
import assert from "node:assert/strict";
import * as fx from "../fixtures/synthetic/index.js";
import { createClient, CERTIFICATION_BASE_URL } from "../../src/client.js";
import type { Transport, TransportRequest } from "../../src/transport.js";
import { ConfigurationError, GatewayError, MalformedResponseError, ValidationError } from "../../src/errors.js";

function stubTransport(responses: Array<Record<string, unknown> | string>): { transport: Transport; calls: TransportRequest[] } {
  const calls: TransportRequest[] = [];
  const queue = [...responses];
  const transport: Transport = async (req) => {
    calls.push(req);
    const next = queue.shift();
    if (next === undefined) throw new Error("no stubbed response left");
    return { status: 200, bodyText: typeof next === "string" ? next : JSON.stringify(next) };
  };
  return { transport, calls };
}

const base = { username: "user", password: "secret", terminalId: "E0000000000" };

test("configuration: environments and base URLs", () => {
  const { transport } = stubTransport([]);
  assert.equal(createClient({ environment: "certification", ...base, transport }).baseUrl, CERTIFICATION_BASE_URL);
  assert.throws(() => createClient({ environment: "production", ...base, transport }), (e: unknown) => e instanceof ConfigurationError && /production requires an explicit baseUrl/.test(e.message));
  assert.equal(createClient({ environment: "production", baseUrl: "https://prod.example/payment/rest/", ...base, transport }).baseUrl, "https://prod.example/payment/rest");
  assert.throws(() => createClient({ environment: "production", baseUrl: "http://prod.example/", ...base, transport }), ConfigurationError);
  assert.throws(() => createClient({ environment: "simulator", ...base, transport }), ConfigurationError);
  assert.throws(() => createClient({ environment: "simulator", baseUrl: "http://evil.example/", ...base, transport }), ConfigurationError);
  assert.equal(createClient({ environment: "simulator", baseUrl: "http://127.0.0.1:4000", ...base, transport }).baseUrl, "http://127.0.0.1:4000");
  assert.throws(() => createClient({ environment: "certification", ...base, transport, timeoutMs: 0 }), ConfigurationError);
  assert.throws(() => createClient({ environment: "certification", ...base, terminalId: "", transport }), ConfigurationError);
  assert.throws(() => createClient({ environment: "certification", ...base, username: "x".repeat(31), transport }), ValidationError);
});

test("registerOrder posts to the documented endpoint with credentials and returns orderId/formUrl", async () => {
  const { transport, calls } = stubTransport([fx.registerSuccess]);
  const client = createClient({ environment: "certification", ...base, transport, timeoutMs: 1234 });
  const result = await client.registerOrder({
    orderNumber: "CMD000123",
    amount: { value: "806.50", currency: "DZD" },
    returnUrl: "https://merchant.example/return",
    failUrl: "https://merchant.example/fail",
  });
  assert.equal(result.orderId, "SYNTH-ORDER-0001");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, `${CERTIFICATION_BASE_URL}/register.do`);
  assert.equal(calls[0]!.timeoutMs, 1234);
  assert.equal(calls[0]!.body.get("userName"), "user");
  assert.equal(calls[0]!.body.get("language"), "FR");
  assert.equal(calls[0]!.body.get("amount"), "80650");
});

test("validation failures never reach the transport", async () => {
  const { transport, calls } = stubTransport([fx.registerSuccess]);
  const client = createClient({ environment: "certification", ...base, transport });
  await assert.rejects(
    client.registerOrder({ orderNumber: "TOO-LONG-ORDER", amount: { value: "1", currency: "DZD" }, returnUrl: "https://a.example", failUrl: "https://a.example" }),
    ValidationError,
  );
  assert.equal(calls.length, 0);
});

test("acknowledgeTransaction accepts a string or object and classifies via parser", async () => {
  const { transport, calls } = stubTransport([fx.ackPaid, fx.ackUnknownOrder, "<html>"]);
  const client = createClient({ environment: "certification", ...base, transport, defaultLanguage: "ar" });
  const r = await client.acknowledgeTransaction("SYNTH-ORDER-0001");
  assert.equal(r.orderStatus, 2);
  assert.equal(calls[0]!.url, `${CERTIFICATION_BASE_URL}/public/acknowledgeTransaction.do`);
  assert.equal(calls[0]!.body.get("mdOrder"), "SYNTH-ORDER-0001");
  assert.equal(calls[0]!.body.get("language"), "AR");
  await assert.rejects(client.acknowledgeTransaction({ orderId: "nope", language: "en" }), (e: unknown) => e instanceof GatewayError && e.errorCode === "6");
  assert.equal(calls[1]!.body.get("language"), "EN");
  await assert.rejects(client.acknowledgeTransaction("x"), MalformedResponseError);
});

test("refund posts the documented fields and rejects non-zero codes", async () => {
  const { transport, calls } = stubTransport([fx.refundSuccess, fx.refundInvalidState, fx.refundEmpty]);
  const client = createClient({ environment: "certification", ...base, transport });
  const ok = await client.refund({ orderId: "SYNTH-ORDER-0001", amount: { value: "200.00", currency: "DZD" } });
  assert.equal(ok.errorCode, "0");
  assert.deepEqual(Object.fromEntries(calls[0]!.body), { userName: "user", password: "secret", orderId: "SYNTH-ORDER-0001", amount: "20000" });
  await assert.rejects(client.refund({ orderId: "SYNTH-ORDER-0001", amount: { value: "1.00", currency: "DZD" } }), GatewayError);
  await assert.rejects(client.refund({ orderId: "SYNTH-ORDER-0001", amount: { value: "1.00", currency: "DZD" } }), MalformedResponseError);
  assert.equal(calls.length, 3, "exactly one request per call; no retries");
});

test("a transport failure is surfaced once with no retry", async () => {
  let attempts = 0;
  const transport: Transport = async () => {
    attempts += 1;
    throw new Error("boom");
  };
  const client = createClient({ environment: "certification", ...base, transport });
  await assert.rejects(client.acknowledgeTransaction("x"), /boom/);
  assert.equal(attempts, 1);
});

test("caller abort signal is forwarded", async () => {
  const { transport, calls } = stubTransport([fx.ackPaid]);
  const client = createClient({ environment: "certification", ...base, transport });
  const controller = new AbortController();
  await client.acknowledgeTransaction("x", { signal: controller.signal });
  assert.equal(calls[0]!.signal, controller.signal);
});
