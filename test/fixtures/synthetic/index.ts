/** Synthetic fixtures. No real card data, credentials, or account identifiers. */

export const registerSuccess = {
  errorCode: 0,
  orderId: "SYNTH-ORDER-0001",
  formUrl: "https://simulator.invalid/payment/merchants/SYNTH/payment_fr.html?mdOrder=SYNTH-ORDER-0001",
};

export const registerDuplicate = { errorCode: "1", errorMessage: "Order number is duplicated, order with given order number is processed already" };

export const ackPaid = {
  expiration: "203012",
  cardholderName: "TEST HOLDER",
  depositAmount: 80650,
  currency: "012",
  approvalCode: "303030",
  authorizationResponseId: "303030",
  actionCode: 0,
  actionCodeDescription: "Votre paiement a été accepté",
  ErrorCode: "0",
  ErrorMessage: "Success",
  OrderStatus: 2,
  OrderNumber: "CMD000123",
  Pan: "628058**0011",
  Amount: 80650,
  Ip: "203.0.113.10",
  params: { respCode: "00", respCode_desc: "Votre paiement a été accepté" },
  SvfeResponse: "00",
};

export const ackRegistered = {
  ErrorCode: 0,
  ErrorMessage: "Success",
  OrderStatus: 0,
  OrderNumber: "CMD000123",
  Amount: "80650",
  currency: "012",
  actionCode: -100,
  actionCodeDescription: "",
  params: {},
};

export const ackDeclined = {
  ErrorCode: "0",
  ErrorMessage: "Success",
  OrderStatus: 6,
  OrderNumber: "CMD000123",
  Amount: 80650,
  actionCode: 116,
  actionCodeDescription: "Solde insuffisant",
  params: { respCode: "51", respCode_desc: "Solde insuffisant" },
};

export const ackReversed = { ...ackDeclined, OrderStatus: 3, actionCode: 0, params: { respCode: "00", respCode_desc: "Votre transaction a été annulée" } };
export const ackRefunded = { ...ackPaid, OrderStatus: 4 };
export const ackApprovedOnePhase = { ...ackPaid, OrderStatus: 1 };
export const ackUnknownOrder = { ErrorCode: "6", ErrorMessage: "Unregistered order id" };
export const ackAccessDenied = { ErrorCode: 5, ErrorMessage: "Access denied" };
export const ackCredentialsDeclined = { ErrorCode: "2", ErrorMessage: "Declined", OrderStatus: 6, OrderNumber: "CMD000123", Amount: 80650, params: {} };

export const refundSuccess = { errorCode: 0, errorMessage: "Success" };
export const refundInvalidState = { errorCode: "7", errorMessage: "Transaction in invalid state" };
export const refundEmpty = {};

// ---- Live-observed shapes from the certification gateway (22 September 2026), sanitized.

/** register.do success: errorCode is numeric; formUrl is on test.satim.dz, not the API host. */
export const registerSuccessLive = {
  errorCode: 0,
  orderId: "LIVEORDERIDXXXXXXXXX",
  formUrl: "https://test.satim.dz/payment/epg/merchants/merchantsatim/payment.html?mdOrder=LIVEORDERIDXXXXXXXXX&language=fr",
};

/** acknowledgeTransaction.do before any payment attempt: Pan is "", ErrorCode is a string, Amount numeric. */
export const ackRegisteredLive = {
  depositAmount: 0,
  currency: "012",
  actionCode: -100,
  actionCodeDescription: "No payment attempted yet.",
  ErrorCode: "0",
  ErrorMessage: "Success",
  OrderStatus: 0,
  OrderNumber: "LMUCW7NVN",
  Pan: "",
  Amount: 5000,
  Description: "WathiqPay live smoke",
};

/** acknowledgeTransaction.do for an unknown mdOrder: HTTP 401 with a bare JSON string body. */
export const ackUnknownOrderLive = { status: 401, bodyText: '"Transaction is not found"' };
