export { createClient, CERTIFICATION_BASE_URL, ENDPOINTS } from "./client.js";
export type { ClientConfig, CallOptions, Environment, WathiqPayClient } from "./client.js";

export { toMinorUnits, fromMinorUnits, compareMinorUnits, isCurrencyCode, CURRENCY_NUMERIC, MoneyError } from "./money.js";
export type { Money, CurrencyCode } from "./money.js";

export { classifyPayment, paymentMatchesOrder, ORDER_STATUS } from "./payment-status.js";
export type { PaymentState, ExpectedOrder, OrderMatch } from "./payment-status.js";

export type {
  RegisterOrderInput,
  AcknowledgeInput,
  RefundInput,
  OrderMetadata,
  Language,
  WireLanguage,
} from "./requests.js";
export { MINIMUM_REGISTER_AMOUNT_MINOR } from "./requests.js";

export type { RegisterResult, AcknowledgeResult, RefundResult, RawResponse } from "./responses.js";
export { normalizeCode } from "./responses.js";

export {
  WathiqPayError,
  ConfigurationError,
  ValidationError,
  TransportError,
  MalformedResponseError,
  GatewayError,
  isWathiqPayError,
} from "./errors.js";
export type { Outcome } from "./errors.js";

export { redact, redactString } from "./redact.js";

export { createFetchTransport } from "./transport.js";
export type { Transport, TransportRequest, TransportResponse, FetchLike } from "./transport.js";
