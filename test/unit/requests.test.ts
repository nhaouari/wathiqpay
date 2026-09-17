import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRegisterParams, buildAcknowledgeParams, buildRefundParams, normalizeLanguage } from "../../src/requests.js";
import { ValidationError } from "../../src/errors.js";

const ctx = {
  username: "user",
  password: "secret",
  terminalId: "E0000000000",
  defaultLanguage: "FR" as const,
  allowInsecureReturnUrls: false,
};

const valid = {
  orderNumber: "CMD000123",
  amount: { value: "806.50", currency: "DZD" as const },
  returnUrl: "https://merchant.example/return",
  failUrl: "https://merchant.example/fail",
  language: "fr" as const,
  metadata: { udf1: "invoice-123" },
};

test("encodes a registration exactly as documented", () => {
  const params = buildRegisterParams(valid, ctx);
  assert.deepEqual(Object.fromEntries(params), {
    userName: "user",
    password: "secret",
    orderNumber: "CMD000123",
    amount: "80650",
    currency: "012",
    returnUrl: "https://merchant.example/return",
    failUrl: "https://merchant.example/fail",
    language: "FR",
    jsonParams: '{"force_terminal_id":"E0000000000","udf1":"invoice-123"}',
  });
  assert.equal(
    params.toString(),
    "userName=user&password=secret&orderNumber=CMD000123&amount=80650&currency=012&returnUrl=https%3A%2F%2Fmerchant.example%2Freturn&failUrl=https%3A%2F%2Fmerchant.example%2Ffail&language=FR&jsonParams=%7B%22force_terminal_id%22%3A%22E0000000000%22%2C%22udf1%22%3A%22invoice-123%22%7D",
  );
});

test("udf1 defaults to the order number and optional fields are included when set", () => {
  const params = buildRegisterParams({ ...valid, metadata: { udf2: "b", udf5: "e" }, description: "Order", fundingTypeIndicator: "CP" }, ctx);
  assert.equal(params.get("description"), "Order");
  assert.deepEqual(JSON.parse(params.get("jsonParams")!), {
    force_terminal_id: "E0000000000",
    udf1: "CMD000123",
    udf2: "b",
    udf5: "e",
    fundingTypeIndicator: "CP",
  });
});

test("rejects invalid registration inputs before sending", () => {
  const cases: Array<[Partial<typeof valid> | Record<string, unknown>, string]> = [
    [{ orderNumber: "" }, "orderNumber"],
    [{ orderNumber: "12345678901" }, "orderNumber"],
    [{ orderNumber: "CMD-001" }, "orderNumber"],
    [{ amount: { value: "49.99", currency: "DZD" } }, "amount"],
    [{ amount: { value: "806.505", currency: "DZD" } }, "amount"],
    [{ amount: { value: "1000000000000.00", currency: "DZD" } }, "amount"],
    [{ amount: { value: 806.5, currency: "DZD" } }, "amount"],
    [{ returnUrl: "http://merchant.example/return" }, "returnUrl"],
    [{ failUrl: "/relative" }, "failUrl"],
    [{ returnUrl: "https://x.example/" + "a".repeat(600) }, "returnUrl"],
    [{ language: "de" }, "language"],
    [{ metadata: { udf1: "x".repeat(21) } }, "metadata.udf1"],
    [{ description: "d".repeat(513) }, "description"],
  ];
  for (const [patch, field] of cases) {
    assert.throws(
      () => buildRegisterParams({ ...valid, ...patch } as typeof valid, ctx),
      (e: unknown) => e instanceof ValidationError && e.field === field && e.outcome === "not-sent",
      JSON.stringify(patch),
    );
  }
});

test("accepts 50.00 DZD exactly and http URLs only when explicitly allowed", () => {
  assert.equal(buildRegisterParams({ ...valid, amount: { value: "50.00", currency: "DZD" } }, ctx).get("amount"), "5000");
  const insecure = buildRegisterParams({ ...valid, returnUrl: "http://localhost:3000/return" }, { ...ctx, allowInsecureReturnUrls: true });
  assert.equal(insecure.get("returnUrl"), "http://localhost:3000/return");
});

test("language normalization", () => {
  assert.equal(normalizeLanguage("ar", "FR"), "AR");
  assert.equal(normalizeLanguage("EN", "FR"), "EN");
  assert.equal(normalizeLanguage(undefined, "FR"), "FR");
  assert.throws(() => normalizeLanguage("xx" as "FR", "FR"), ValidationError);
});

test("encodes acknowledgement and refund requests", () => {
  const ack = buildAcknowledgeParams({ orderId: "abc123" }, ctx);
  assert.equal(ack.toString(), "userName=user&password=secret&mdOrder=abc123&language=FR");
  const refund = buildRefundParams({ orderId: "abc123", amount: { value: "200.00", currency: "DZD" } }, ctx);
  assert.equal(refund.toString(), "userName=user&password=secret&orderId=abc123&amount=20000");
  assert.throws(() => buildRefundParams({ orderId: "abc123", amount: { value: "0", currency: "DZD" } }, ctx), ValidationError);
  assert.throws(() => buildAcknowledgeParams({ orderId: "" }, ctx), ValidationError);
});

test("error messages never contain credentials", () => {
  try {
    buildRegisterParams({ ...valid, orderNumber: "" }, ctx);
    assert.fail("expected throw");
  } catch (e) {
    assert.ok(!String(e).includes("secret"));
  }
});
