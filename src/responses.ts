/**
 * Boundary parsers for SATIM responses. They follow the wire representation
 * (inconsistent capitalization, mixed numeric/string codes) and expose a
 * normalized model while keeping the raw object available.
 */
import { MalformedResponseError, GatewayError, TransportError } from "./errors.js";

export type RawResponse = Record<string, unknown>;

export interface RegisterResult {
  orderId: string;
  formUrl: string;
  raw: RawResponse;
}

export interface AcknowledgeResult {
  /** Normalized ErrorCode as a string ("0" on success). */
  errorCode: string;
  errorMessage: string | undefined;
  /** OrderStatus as a number, or undefined when SATIM omitted it. */
  orderStatus: number | undefined;
  orderNumber: string | undefined;
  /** Amount and depositAmount in minor units, as digit strings. */
  amountMinor: string | undefined;
  depositAmountMinor: string | undefined;
  currency: string | undefined;
  approvalCode: string | undefined;
  actionCode: number | undefined;
  actionCodeDescription: string | undefined;
  /** params.respCode ("00" on an accepted payment) and its description. */
  respCode: string | undefined;
  respCodeDescription: string | undefined;
  maskedPan: string | undefined;
  /** YYYYMM, paid orders only. */
  expiration: string | undefined;
  cardholderName: string | undefined;
  raw: RawResponse;
}

export interface RefundResult {
  /** Normalized errorCode; always "0" here since non-zero codes throw. */
  errorCode: "0";
  raw: RawResponse;
}

/**
 * Interpret an HTTP exchange. 2xx bodies must be JSON objects. Non-2xx bodies
 * are still inspected: SATIM answers an unknown order on
 * acknowledgeTransaction.do with HTTP 401 and the JSON string
 * "Transaction is not found" (live-observed, 22 September 2026), which is a
 * gateway rejection, not a transport failure.
 */
export function interpretHttpResponse(operation: GatewayError["operation"], status: number, bodyText: string): RawResponse {
  if (status >= 200 && status < 300) return parseJsonObject(bodyText);
  let value: unknown;
  try {
    value = JSON.parse(bodyText);
  } catch {
    value = undefined;
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const raw = value as RawResponse;
    const code = normalizeCode(pick(raw, "errorCode"));
    if (code !== undefined) throw new GatewayError(operation, code, toText(pick(raw, "errorMessage")), raw, status);
  }
  if (typeof value === "string" && value.trim() !== "") {
    throw new GatewayError(operation, `http_${status}`, value, { httpStatus: status, body: value }, status);
  }
  throw new TransportError("http-status", `gateway responded with HTTP ${status}`, { status, bodyText });
}

/** Parse the response body text as a JSON object. */
export function parseJsonObject(text: string): RawResponse {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new MalformedResponseError("response body is not valid JSON", text);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new MalformedResponseError("response body is not a JSON object", value);
  }
  return value as RawResponse;
}

/** Case-insensitive lookup of the first present key. */
function pick(raw: RawResponse, ...names: string[]): unknown {
  const lowered = new Map<string, unknown>();
  for (const [k, v] of Object.entries(raw)) lowered.set(k.toLowerCase(), v);
  for (const name of names) {
    const v = lowered.get(name.toLowerCase());
    if (v !== undefined) return v;
  }
  return undefined;
}

/**
 * Normalize a code that may arrive as 0, "0", or "00". Returns undefined for
 * missing, null, or empty values: those are never coerced to "0".
 */
export function normalizeCode(value: unknown): string | undefined {
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    return /^-?\d+$/.test(trimmed) ? String(Number.parseInt(trimmed, 10)) : trimmed;
  }
  return undefined;
}

function toInteger(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isInteger(value) ? value : undefined;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number.parseInt(value, 10);
  return undefined;
}

function toDigits(value: unknown): string | undefined {
  if (typeof value === "number") return Number.isSafeInteger(value) && value >= 0 ? String(value) : undefined;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return value.trim();
  return undefined;
}

function toText(value: unknown): string | undefined {
  // SATIM returns "" for fields that do not apply yet (e.g. Pan before payment); treat as absent.
  if (typeof value === "string") return value === "" ? undefined : value;
  if (typeof value === "number") return String(value);
  return undefined;
}

export function parseRegisterResponse(raw: RawResponse): RegisterResult {
  const code = normalizeCode(pick(raw, "errorCode"));
  if (code === undefined) throw new MalformedResponseError("register response has no errorCode", raw);
  if (code !== "0") throw new GatewayError("register", code, toText(pick(raw, "errorMessage")), raw);
  const orderId = toText(pick(raw, "orderId"));
  const formUrl = toText(pick(raw, "formUrl"));
  if (!orderId || !formUrl) {
    throw new MalformedResponseError("register response reports success without orderId and formUrl", raw);
  }
  return { orderId, formUrl, raw };
}

/** Error codes that mean the acknowledgement request itself failed. */
const ACK_REQUEST_FAILURE_CODES = new Set(["5", "6", "7"]);

export function parseAcknowledgeResponse(raw: RawResponse): AcknowledgeResult {
  const errorCode = normalizeCode(pick(raw, "ErrorCode", "errorCode"));
  if (errorCode === undefined) throw new MalformedResponseError("acknowledge response has no ErrorCode", raw);
  const errorMessage = toText(pick(raw, "ErrorMessage", "errorMessage"));
  if (ACK_REQUEST_FAILURE_CODES.has(errorCode)) {
    throw new GatewayError("acknowledge", errorCode, errorMessage, raw);
  }
  const params = pick(raw, "params");
  const p: RawResponse = typeof params === "object" && params !== null ? (params as RawResponse) : {};
  const respCodeRaw = pick(p, "respCode");
  return {
    errorCode,
    errorMessage,
    orderStatus: toInteger(pick(raw, "OrderStatus", "orderStatus")),
    orderNumber: toText(pick(raw, "OrderNumber", "orderNumber")),
    amountMinor: toDigits(pick(raw, "Amount", "amount")),
    depositAmountMinor: toDigits(pick(raw, "depositAmount")),
    currency: toText(pick(raw, "currency")),
    approvalCode: toText(pick(raw, "approvalCode", "authorizationResponseId")),
    actionCode: toInteger(pick(raw, "actionCode")),
    actionCodeDescription: toText(pick(raw, "actionCodeDescription")),
    // respCode is kept verbatim ("00"), not numerically normalized.
    respCode: typeof respCodeRaw === "string" ? respCodeRaw.trim() : toText(respCodeRaw),
    respCodeDescription: toText(pick(p, "respCode_desc")),
    maskedPan: toText(pick(raw, "Pan", "pan")),
    expiration: toText(pick(raw, "expiration")),
    cardholderName: toText(pick(raw, "cardholderName")),
    raw,
  };
}

export function parseRefundResponse(raw: RawResponse): RefundResult {
  const code = normalizeCode(pick(raw, "errorCode"));
  // An empty or codeless body must never be read as a successful refund.
  if (code === undefined) throw new MalformedResponseError("refund response has no errorCode", raw);
  if (code !== "0") throw new GatewayError("refund", code, toText(pick(raw, "errorMessage")), raw);
  return { errorCode: "0", raw };
}
