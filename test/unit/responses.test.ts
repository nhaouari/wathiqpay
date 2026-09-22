import { test } from "node:test";
import assert from "node:assert/strict";
import * as fx from "../fixtures/synthetic/index.js";
import { parseRegisterResponse, parseAcknowledgeResponse, parseRefundResponse, parseJsonObject, normalizeCode, interpretHttpResponse } from "../../src/responses.js";
import { GatewayError, MalformedResponseError, TransportError } from "../../src/errors.js";

test("normalizeCode treats 0, '0', and '00' alike but never coerces missing values", () => {
  assert.equal(normalizeCode(0), "0");
  assert.equal(normalizeCode("0"), "0");
  assert.equal(normalizeCode("00"), "0");
  assert.equal(normalizeCode(" 5 "), "5");
  assert.equal(normalizeCode("-1"), "-1");
  assert.equal(normalizeCode(undefined), undefined);
  assert.equal(normalizeCode(null), undefined);
  assert.equal(normalizeCode(""), undefined);
  assert.equal(normalizeCode("  "), undefined);
  assert.equal(normalizeCode(1.5), undefined);
  assert.equal(normalizeCode("E01"), "E01");
});

test("register: success and errors", () => {
  const ok = parseRegisterResponse(fx.registerSuccess);
  assert.equal(ok.orderId, "SYNTH-ORDER-0001");
  assert.ok(ok.formUrl.startsWith("https://"));
  assert.equal(ok.raw, fx.registerSuccess);

  assert.throws(() => parseRegisterResponse(fx.registerDuplicate), (e: unknown) =>
    e instanceof GatewayError && e.errorCode === "1" && e.operation === "register" && e.outcome === "rejected");
  assert.throws(() => parseRegisterResponse({ errorCode: 0 }), MalformedResponseError);
  assert.throws(() => parseRegisterResponse({ orderId: "x", formUrl: "y" }), MalformedResponseError);
  assert.throws(() => parseRegisterResponse({ errorCode: "", orderId: "x", formUrl: "y" }), MalformedResponseError);
});

test("acknowledge: paid response is fully normalized", () => {
  const r = parseAcknowledgeResponse(fx.ackPaid);
  assert.equal(r.errorCode, "0");
  assert.equal(r.orderStatus, 2);
  assert.equal(r.orderNumber, "CMD000123");
  assert.equal(r.amountMinor, "80650");
  assert.equal(r.depositAmountMinor, "80650");
  assert.equal(r.currency, "012");
  assert.equal(r.approvalCode, "303030");
  assert.equal(r.respCode, "00");
  assert.equal(r.respCodeDescription, "Votre paiement a été accepté");
  assert.equal(r.maskedPan, "628058**0011");
  assert.equal(r.expiration, "203012");
  assert.equal(r.raw, fx.ackPaid);
});

test("acknowledge: mixed representations and missing fields", () => {
  const r = parseAcknowledgeResponse(fx.ackRegistered);
  assert.equal(r.errorCode, "0");
  assert.equal(r.orderStatus, 0);
  assert.equal(r.amountMinor, "80650");
  assert.equal(r.respCode, undefined);
  const lower = parseAcknowledgeResponse({ errorCode: "0", orderStatus: "2", orderNumber: "X", amount: "1", params: { respCode: "00" } });
  assert.equal(lower.orderStatus, 2);
  assert.equal(lower.respCode, "00");
  const extra = parseAcknowledgeResponse({ ...fx.ackPaid, newField: { nested: true } });
  assert.deepEqual(extra.raw["newField"], { nested: true });
});

test("acknowledge: request-level failures throw, payment outcomes do not", () => {
  assert.throws(() => parseAcknowledgeResponse(fx.ackUnknownOrder), (e: unknown) => e instanceof GatewayError && e.errorCode === "6");
  assert.throws(() => parseAcknowledgeResponse(fx.ackAccessDenied), (e: unknown) => e instanceof GatewayError && e.errorCode === "5");
  assert.throws(() => parseAcknowledgeResponse({ ErrorCode: 7 }), GatewayError);
  assert.throws(() => parseAcknowledgeResponse({}), MalformedResponseError);
  assert.throws(() => parseAcknowledgeResponse({ ErrorCode: "" }), MalformedResponseError);
  const declined = parseAcknowledgeResponse(fx.ackCredentialsDeclined);
  assert.equal(declined.errorCode, "2");
});

test("refund: empty or codeless responses never mean success", () => {
  assert.equal(parseRefundResponse(fx.refundSuccess).errorCode, "0");
  assert.throws(() => parseRefundResponse(fx.refundEmpty), (e: unknown) => e instanceof MalformedResponseError && e.outcome === "indeterminate");
  assert.throws(() => parseRefundResponse({ errorCode: null }), MalformedResponseError);
  assert.throws(() => parseRefundResponse(fx.refundInvalidState), (e: unknown) => e instanceof GatewayError && e.errorCode === "7");
});

test("parseJsonObject rejects non-objects", () => {
  assert.throws(() => parseJsonObject("not json"), MalformedResponseError);
  assert.throws(() => parseJsonObject("[]"), MalformedResponseError);
  assert.throws(() => parseJsonObject("null"), MalformedResponseError);
  assert.throws(() => parseJsonObject(""), MalformedResponseError);
  assert.deepEqual(parseJsonObject('{"a":1}'), { a: 1 });
});

test("live-observed shapes: registered-unpaid acknowledgement and register success", () => {
  const r = parseAcknowledgeResponse(fx.ackRegisteredLive);
  assert.equal(r.errorCode, "0");
  assert.equal(r.orderStatus, 0);
  assert.equal(r.amountMinor, "5000");
  assert.equal(r.depositAmountMinor, "0");
  assert.equal(r.maskedPan, undefined, 'Pan "" is treated as absent');
  assert.equal(r.respCode, undefined);
  const reg = parseRegisterResponse(fx.registerSuccessLive);
  assert.equal(new URL(reg.formUrl).hostname, "test.satim.dz");
});

test("interpretHttpResponse: 401 with a JSON string is a gateway rejection, other non-2xx are transport errors", () => {
  assert.throws(
    () => interpretHttpResponse("acknowledge", fx.ackUnknownOrderLive.status, fx.ackUnknownOrderLive.bodyText),
    (e: unknown) => e instanceof GatewayError && e.errorCode === "http_401" && e.errorMessage === "Transaction is not found" && e.httpStatus === 401 && e.outcome === "rejected",
  );
  assert.throws(() => interpretHttpResponse("register", 403, '{"errorCode":5,"errorMessage":"Access denied"}'), (e: unknown) => e instanceof GatewayError && e.errorCode === "5" && e.httpStatus === 403);
  assert.throws(() => interpretHttpResponse("refund", 500, "boom"), (e: unknown) => e instanceof TransportError && e.kind === "http-status" && e.status === 500 && e.bodyText === "boom");
  assert.throws(() => interpretHttpResponse("refund", 502, ""), (e: unknown) => e instanceof TransportError && e.status === 502);
  assert.deepEqual(interpretHttpResponse("register", 200, '{"errorCode":0,"orderId":"x","formUrl":"y"}'), { errorCode: 0, orderId: "x", formUrl: "y" });
});

test("refund: live-observed success and invalid-state responses", () => {
  assert.equal(parseRefundResponse(fx.refundSuccessLive).errorCode, "0");
  assert.throws(() => parseRefundResponse(fx.refundImpossibleLive), (e: unknown) => e instanceof GatewayError && e.errorCode === "7");
});
