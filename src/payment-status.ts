/**
 * Conservative payment classification. "paid" requires the complete
 * certification condition; anything SATIM has not documented is "unknown".
 */
import { compareMinorUnits, toMinorUnits, type Money } from "./money.js";
import type { AcknowledgeResult } from "./responses.js";

export type PaymentState = "registered" | "paid" | "declined" | "reversed" | "refunded" | "partially_refunded" | "unknown";

export const ORDER_STATUS = Object.freeze({
  DECLINED_FALLBACK: -1,
  REGISTERED: 0,
  APPROVED_ONE_PHASE: 1,
  DEPOSITED: 2,
  REVERSED: 3,
  REFUNDED: 4,
  AUTHORIZATION_DECLINED: 6,
});

export function classifyPayment(result: AcknowledgeResult): PaymentState {
  const { errorCode, orderStatus, respCode } = result;
  // Certification condition: respCode == "00" && ErrorCode == "0" && OrderStatus == 2.
  if (respCode === "00" && errorCode === "0" && orderStatus === ORDER_STATUS.DEPOSITED) return "paid";
  if (errorCode === "0") {
    switch (orderStatus) {
      case ORDER_STATUS.REGISTERED:
        return "registered";
      case ORDER_STATUS.REVERSED:
        return "reversed";
      case ORDER_STATUS.REFUNDED:
        // Live-observed (22 September 2026): after a partial refund SATIM
        // reports OrderStatus 4 with depositAmount = amount still captured.
        // Only a zero deposit means the whole payment was returned.
        if (result.depositAmountMinor === undefined) return "unknown";
        if (result.amountMinor !== undefined && compareMinorUnits(result.depositAmountMinor, result.amountMinor) > 0) return "unknown";
        return compareMinorUnits(result.depositAmountMinor, "0") > 0 ? "partially_refunded" : "refunded";
      case ORDER_STATUS.DECLINED_FALLBACK:
      case ORDER_STATUS.AUTHORIZATION_DECLINED:
        return "declined";
      default:
        // Includes OrderStatus 1 (approved one-phase / preauthorization) and
        // OrderStatus 2 without respCode "00": not automatically settled.
        return "unknown";
    }
  }
  if (errorCode === "2") return "declined"; // declined due to payment credentials
  return "unknown";
}

/**
 * Amount returned to the customer so far, derived from Amount - depositAmount.
 * Undefined when SATIM did not report both figures.
 */
export function refundedAmountMinor(result: AcknowledgeResult): string | undefined {
  if (result.amountMinor === undefined || result.depositAmountMinor === undefined) return undefined;
  const diff = BigInt(result.amountMinor) - BigInt(result.depositAmountMinor);
  return diff < 0n ? undefined : diff.toString();
}

export interface ExpectedOrder {
  orderNumber: string;
  amount: Money;
}

export interface OrderMatch {
  matches: boolean;
  mismatches: string[];
}

/**
 * Compare an acknowledgement with the locally persisted order. Both the
 * order number and the amount must match before fulfilment.
 */
export function paymentMatchesOrder(result: AcknowledgeResult, expected: ExpectedOrder): OrderMatch {
  const mismatches: string[] = [];
  if (result.orderNumber !== expected.orderNumber) mismatches.push("orderNumber");
  const expectedMinor = toMinorUnits(expected.amount);
  if (result.amountMinor === undefined || compareMinorUnits(result.amountMinor, expectedMinor) !== 0) {
    mismatches.push("amount");
  }
  if (result.currency !== undefined) {
    const numeric = expected.amount.currency === "DZD" ? "012" : undefined;
    if (result.currency !== numeric && result.currency !== expected.amount.currency) mismatches.push("currency");
  }
  return { matches: mismatches.length === 0, mismatches };
}
