# SATIM EPG integration reference

## 1. Purpose and source

This document captures the integration contract visible in the SATIM CIBWEBLab certification portal at `https://certweb.satim.dz/Cert/url`, inspected on 16 September 2026.

It is an engineering reference for the WathiqPay SDK, not an official replacement for documentation issued by SATIM. Where the portal is inconsistent, this document records the inconsistency instead of inventing behavior.

## 2. System overview

SATIM EPG/IPAY is a hosted e-commerce payment gateway for CIB and Edahabia cards. The portal states that it supports 3-D Secure and merchant-specific anti-fraud rules.

Card information is entered on SATIM's hosted payment page. The merchant backend registers an order, redirects the customer, and then confirms the result with a server-to-server request.

### Payment sequence

1. The customer confirms an order on the merchant website.
2. The merchant backend registers the order with SATIM.
3. SATIM returns a unique `orderId` and a hosted `formUrl`.
4. The merchant redirects the customer's browser to `formUrl`.
5. The customer enters payment information on SATIM's page.
6. SATIM redirects the browser to the supplied `returnUrl` or `failUrl`.
7. The merchant backend calls `acknowledgeTransaction.do` using the SATIM order ID.
8. The merchant persists and displays the authoritative result.

The browser redirect is not authoritative. An SDK consumer must confirm the transaction from its backend before fulfilling an order.

## 3. Environments and transport

The documented certification base URL is:

```text
https://test2.satim.dz/payment/rest
```

The portal labels the endpoints as HTTP `GET`, but explicitly recommends `POST` to prevent credentials and transaction data appearing in URLs, logs, and browser history. WathiqPay should therefore default to:

```http
Content-Type: application/x-www-form-urlencoded
```

Production hostnames are not documented in the accessible portal and must remain explicit configuration until SATIM supplies them.

Live-observed on 22 September 2026: the API host `test2.satim.dz` accepts POST form encoding, while the returned `formUrl` points at `https://test.satim.dz/payment/epg/merchants/<merchant>/payment.html?mdOrder=…&language=fr`. The hosted page and the API are on different hosts.

### Authentication

Every documented operation sends merchant credentials as parameters:

- `userName`: alphanumeric, maximum 30 characters.
- `password`: alphanumeric, maximum 30 characters.

Credentials must only be used on the merchant server. They must never be exposed to browser code, redirect URLs, error pages, telemetry, or normal application logs.

## 4. Amount and currency representation

The API expects integer minor units. Examples from the portal:

| Customer-facing amount | API amount |
|---:|---:|
| `5,000.00 DZD` | `500000` |
| `806.50 DZD` | `80650` |

The SDK must accept decimal strings or a dedicated money type and must not use binary floating-point multiplication.

The portal states that the minimum order amount is `50 DZD`. It also uses the inaccurate phrase “amount must be multiple by 100”; its examples indicate conversion to minor units, not a requirement that the customer-facing amount be divisible by 100.

DZD is represented by ISO 4217 numeric code `012`.

## 5. Register an order

```http
POST /register.do
```

### Request

| Field | Format | Required | Description |
|---|---|---:|---|
| `userName` | `AN..30` | Yes | Merchant login |
| `password` | `AN..30` | Yes | Merchant password |
| `orderNumber` | `AN..10` | Yes | Unique order identifier in the merchant system |
| `amount` | `N 1..12` | Yes | Amount in minor units |
| `currency` | `N3` | Yes | ISO 4217 numeric currency code; DZD is `012` |
| `returnUrl` | `AN..512` | Yes | Redirect after a successful payment attempt |
| `failUrl` | `AN..512` | Yes | Redirect after a failed payment attempt |
| `description` | `AN..512` | No | Free-form order description |
| `language` | `A2` | Yes | Portal-supported values: `AR`, `FR`, `EN` |
| `jsonParams` | `AN..1024` | Yes | JSON-encoded SATIM-specific parameters |

`orderNumber` must be unique for each transaction. Its documented maximum is only ten characters, so an SDK must validate before sending rather than silently truncate it.

### `jsonParams`

```json
{
  "force_terminal_id": "E0123456789",
  "udf1": "invoice-123",
  "udf2": "optional",
  "udf3": "optional",
  "udf4": "optional",
  "udf5": "optional"
}
```

| Field | Format | Required | Description |
|---|---|---:|---|
| `force_terminal_id` | `AN..16` | Yes | Bank-assigned terminal ID |
| `udf1` | `AN..20` | Yes | Merchant reference such as invoice/order number |
| `udf2`–`udf5` | `AN..20` | No | Additional merchant values |

For merchants enabled by SATIM, `fundingTypeIndicator` may also be sent. The currently documented bill-payment values are `CP` and `698`.

### Response

```ts
export interface SatimRegisterResponse {
  errorCode: number | string;
  orderId?: string;
  formUrl?: string;
}
```

On success, `errorCode` is zero and SATIM returns:

- `orderId`: SATIM/EPG-generated order identifier, also called `mdOrder` by other operations.
- `formUrl`: hosted payment page to which the customer must be redirected.

### Documented registration errors

| Code | Meaning |
|---:|---|
| `0` | No system error |
| `1` | Order already processed, duplicate/unpaid order number, or incorrect child ID |
| `3` | Unknown currency |
| `4` | Required data such as order number, username, amount, return URL, or password is absent |
| `5` | Invalid parameter/language/JSON, access denied, or password change required |
| `7` | System error |
| `14` | Invalid payment method |

The portal table contains message rows without repeated code cells. The SDK must preserve the raw code and response and must not pretend each message has a separately documented numeric code.

## 6. Acknowledge a transaction

```http
POST /public/acknowledgeTransaction.do
```

The portal says this request confirms that the merchant successfully handled the customer's redirect and returns the transaction details. It also warns that a transaction may be automatically cancelled after a timeout if the gateway receives no acknowledgement.

### Request

| Field | Format | Required | Description |
|---|---|---:|---|
| `userName` | `AN..30` | Yes | Merchant login |
| `password` | `AN..30` | Yes | Merchant password |
| `mdOrder` | `ANS20` | Yes | `orderId` returned during registration |
| `language` | `A2` | Yes | `AR`, `FR`, or `EN` |

### Response model

```ts
export interface SatimAcknowledgeResponse {
  expiration?: string;
  cardholderName?: string;
  depositAmount: number;
  currency?: string;
  authorizationResponseId?: string;
  approvalCode?: string;
  actionCode: number;
  actionCodeDescription: string;
  ErrorCode: number | string;
  ErrorMessage?: string;
  OrderStatus: number;
  OrderNumber: string;
  Pan?: string;
  Amount: number;
  Ip?: string;
  clientId?: string;
  bindingId?: string;
  paymentAccountReference?: string;
  Description?: string;
  params?: {
    respCode?: string;
    respCode_desc?: string;
    [key: string]: unknown;
  };
  SvfeResponse?: string;
}
```

Important details:

- `expiration` is `YYYYMM` and is returned only for paid orders.
- `Pan` is a masked card number and is returned only for paid orders.
- `approvalCode`/`authorizationResponseId` is the six-character authorization code.
- `Amount` and `depositAmount` are minor units.
- Field capitalization is inconsistent (`ErrorCode`, `OrderStatus`, `Pan` versus lower-camel-case fields). The SDK parser must follow the wire representation and expose a normalized public model separately.

Live-observed on 22 September 2026: before any payment attempt the response is `{"depositAmount":0,"currency":"012","actionCode":-100,"actionCodeDescription":"No payment attempted yet.","ErrorCode":"0","ErrorMessage":"Success","OrderStatus":0,"OrderNumber":"…","Pan":"","Amount":5000,"Description":"…"}`. An unknown `mdOrder` is answered with HTTP 401 and the JSON string `"Transaction is not found"` rather than an `ErrorCode 6` object.

### Documented acknowledgement errors

| Code | Meaning |
|---:|---|
| `0` | Success |
| `2` | Declined due to an error in payment credentials |
| `5` | Access denied, password change required, or empty order ID |
| `6` | Unregistered order ID |
| `7` | System error |

### `OrderStatus`

| Value | Documented meaning |
|---:|---|
| `-1` | Generic/fallback decline |
| `0` | Registered but not paid |
| `1` | Approved one-phase transaction; the same table also associates this phase with a preauthorization hold |
| `2` | Amount deposited successfully |
| `3` | Authorization reversed |
| `4` | Refunded |
| `6` | Authorization declined |

The certification page defines an accepted payment using all of:

```text
params.respCode == "00"
ErrorCode == "0"
OrderStatus == 2
```

WathiqPay must not classify a payment as successful from the browser redirect or `ErrorCode` alone. It should expose a conservative helper that checks the SATIM certification condition and returns an explicit `unknown` state for combinations not documented by SATIM.

## 7. Refund a transaction

```http
POST /refund.do
```

### Request

| Field | Format | Required | Description |
|---|---|---:|---|
| `userName` | `AN..30` | Yes | Merchant login |
| `password` | `AN..30` | Yes | Merchant password |
| `orderId` | `ANS20` | Yes | SATIM-generated order identifier |
| `amount` | `N..20` | Yes | Refund amount in minor units |

The endpoint summary additionally lists `language` and `currency`, but the expanded request table omits them. Their actual production requirement must be confirmed.

SATIM permits multiple partial refunds, but their cumulative amount cannot exceed the deposited amount. The merchant user needs the appropriate refund permission, and the payment must be in a refundable state.

### Response

```ts
export interface SatimRefundResponse {
  errorCode?: number | string;
  errorMessage?: string;
}
```

### Documented refund errors

| Code | Meaning |
|---:|---|
| `0` | Success |
| `5` | Access denied, password change required, invalid/too-small amount, or duplicate external refund ID |
| `6` | Unregistered order ID |
| `7` | System error or transaction in an invalid state |

The error table mentions `externalRefundId`, although it is absent from the request table. Automated retry of refund requests is unsafe until SATIM confirms an idempotency mechanism.

## 8. SDK security requirements

- Execute every SATIM operation from trusted server-side code.
- Enforce HTTPS for merchant return and failure URLs outside local development.
- Never accept or process raw card number, CVV, expiry, or 3-D Secure password.
- Never bundle certification cards or merchant credentials with the package.
- Redact `userName`, `password`, PAN-like values, authorization data, and query strings from logs and errors.
- Do not log raw `application/x-www-form-urlencoded` request bodies.
- Add request timeouts and abort support.
- Validate redirect URLs and require the merchant application to use configured allowlisted origins.
- Persist the merchant order before registering it with SATIM.
- Make result processing idempotent and transactional.
- Compare the acknowledgement order number and amount with locally persisted values before fulfillment.
- Retain the raw response only where operationally necessary and according to the merchant's data-retention policy.

## 9. Proposed public API

This example matches the API fixed in [plan.md](../plan.md), section 3.

```ts
import { createClient, classifyPayment } from "wathiqpay";

const satim = createClient({
  environment: "certification", // "production" additionally requires baseUrl
  username: process.env.SATIM_USERNAME!,
  password: process.env.SATIM_PASSWORD!,
  terminalId: process.env.SATIM_TERMINAL_ID!,
  timeoutMs: 30_000 // SDK default; not a SATIM guarantee
});

const order = await satim.registerOrder({
  orderNumber: "CMD000123",
  amount: { value: "806.50", currency: "DZD" },
  returnUrl: "https://merchant.example/payments/return",
  failUrl: "https://merchant.example/payments/failure",
  language: "fr", // sent as "FR"
  metadata: { udf1: "invoice-123" }
});

// Redirect the browser to order.formUrl.

const payment = await satim.acknowledgeTransaction(order.orderId);
const decision = classifyPayment(payment);

if (decision === "paid") {
  // Persist idempotently, fulfill the order, and issue the receipt.
}

// Experimental until live-verified.
await satim.refund({
  orderId: order.orderId,
  amount: { value: "200.00", currency: "DZD" }
});
```

Recommended public payment states:

```ts
type PaymentState =
  | "registered"
  | "paid"
  | "declined"
  | "reversed"
  | "refunded"
  | "unknown";
```

The normalized response must always include the original SATIM fields or a `raw` object for forward compatibility and diagnostics.

## 10. Test strategy

Unit tests should cover:

- Exact DZD conversion, including `806.50` → `80650`.
- Rejection of floating-point and malformed amounts.
- All documented size and required-field limits.
- Serialization of `jsonParams`.
- Mixed numeric/string error codes.
- SATIM's inconsistent response capitalization.
- Success only when the complete certification condition is satisfied.
- Redaction of credentials and PAN-like data.
- Timeout and malformed-response handling.
- Idempotent processing of repeated browser redirects.

Certification tests should obtain test card data from protected environment variables or a private test-secret store. PANs, CVVs, expiries, and passwords must not be committed to the repository or published to npm.

