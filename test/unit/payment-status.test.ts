import { test } from "node:test";
import assert from "node:assert/strict";
import * as fx from "../fixtures/synthetic/index.js";
import { parseAcknowledgeResponse } from "../../src/responses.js";
import { classifyPayment, paymentMatchesOrder, refundedAmountMinor } from "../../src/payment-status.js";

const classify = (raw: Record<string, unknown>) => classifyPayment(parseAcknowledgeResponse(raw));

test("paid requires all three documented signals", () => {
  assert.equal(classify(fx.ackPaid), "paid");
  assert.equal(classify({ ...fx.ackPaid, params: { respCode: "01" } }), "unknown");
  assert.equal(classify({ ...fx.ackPaid, params: {} }), "unknown");
  assert.equal(classify({ ...fx.ackPaid, OrderStatus: "2" }), "paid");
  assert.equal(classify({ ...fx.ackPaid, ErrorCode: 0 }), "paid");
});

test("status 1 is not automatically treated as settled", () => {
  assert.equal(classify(fx.ackApprovedOnePhase), "unknown");
});

test("documented non-paid states", () => {
  assert.equal(classify(fx.ackRegistered), "registered");
  assert.equal(classify(fx.ackDeclined), "declined");
  assert.equal(classify({ ...fx.ackDeclined, OrderStatus: -1 }), "declined");
  assert.equal(classify(fx.ackReversed), "reversed");
  assert.equal(classify(fx.ackRefunded), "refunded");
  assert.equal(classify(fx.ackCredentialsDeclined), "declined");
});

test("undocumented combinations are unknown", () => {
  assert.equal(classify({ ErrorCode: "0", OrderStatus: 9 }), "unknown");
  assert.equal(classify({ ErrorCode: "0" }), "unknown");
  assert.equal(classify({ ErrorCode: "3", OrderStatus: 2, params: { respCode: "00" } }), "unknown");
});

test("paymentMatchesOrder compares order number and amount", () => {
  const paid = parseAcknowledgeResponse(fx.ackPaid);
  assert.deepEqual(paymentMatchesOrder(paid, { orderNumber: "CMD000123", amount: { value: "806.50", currency: "DZD" } }), { matches: true, mismatches: [] });
  assert.deepEqual(paymentMatchesOrder(paid, { orderNumber: "CMD000124", amount: { value: "806.5", currency: "DZD" } }).mismatches, ["orderNumber"]);
  assert.deepEqual(paymentMatchesOrder(paid, { orderNumber: "CMD000123", amount: { value: "806.51", currency: "DZD" } }).mismatches, ["amount"]);
  const noAmount = parseAcknowledgeResponse({ ErrorCode: "0", OrderStatus: 2, OrderNumber: "CMD000123" });
  assert.deepEqual(paymentMatchesOrder(noAmount, { orderNumber: "CMD000123", amount: { value: "806.50", currency: "DZD" } }).mismatches, ["amount"]);
  const otherCurrency = parseAcknowledgeResponse({ ...fx.ackPaid, currency: "978" });
  assert.ok(paymentMatchesOrder(otherCurrency, { orderNumber: "CMD000123", amount: { value: "806.50", currency: "DZD" } }).mismatches.includes("currency"));
});

test("live-observed shapes classify as expected", () => {
  assert.equal(classify(fx.ackPaidLive), "paid");
  assert.equal(classify(fx.ackDeclinedLive), "declined");
  assert.equal(classify(fx.ackDeclinedNoRespCodeLive), "declined");
  assert.equal(classify(fx.ackPartiallyRefundedLive), "partially_refunded");
  assert.equal(classify(fx.ackFullyRefundedLive), "refunded");
  assert.equal(refundedAmountMinor(parseAcknowledgeResponse(fx.ackPartiallyRefundedLive)), "2000");
  assert.equal(refundedAmountMinor(parseAcknowledgeResponse(fx.ackFullyRefundedLive)), "5000");
  assert.equal(refundedAmountMinor(parseAcknowledgeResponse(fx.ackPaidLive)), "0");
  assert.equal(refundedAmountMinor(parseAcknowledgeResponse({ ErrorCode: "0", OrderStatus: 4 })), undefined);
  // Missing or inconsistent balances cannot establish a completed refund.
  assert.equal(classify({ ErrorCode: "0", OrderStatus: 4 }), "unknown");
  assert.equal(classify({ ...fx.ackFullyRefundedLive, depositAmount: 6000 }), "unknown");
  const paid = parseAcknowledgeResponse(fx.ackPaidLive);
  assert.equal(paid.approvalCode, "485040");
  assert.equal(paid.respCodeDescription, "Votre paiement a été accepté.");
});
