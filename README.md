# WathiqPay

WathiqPay is a server-side TypeScript/Node.js client for the SATIM e-commerce payment gateway (SATIM EPG/IPAY): order registration, hosted-page redirection, server-to-server acknowledgement, and refunds.

Status: `0.1.0-alpha.0`, private, unpublished. The SDK and the reference merchant are complete and tested offline, and registration, acknowledgement, 15 card scenarios, and refunds have been run against SATIM's certification gateway (see [docs/live-evidence.md](docs/live-evidence.md)).

## Requirements

- Node.js 22 or later (uses the built-in `fetch`, `AbortSignal`, and `node:test`).
- ESM only. No runtime dependencies.

## Usage

```ts
import { createClient, classifyPayment, paymentMatchesOrder } from "wathiqpay";

const satim = createClient({
  environment: "certification", // "production" additionally requires baseUrl
  username: process.env.SATIM_USERNAME!,
  password: process.env.SATIM_PASSWORD!,
  terminalId: process.env.SATIM_TERMINAL_ID!,
  timeoutMs: 30_000, // SDK default; not a SATIM guarantee
});

// 1. Persist your order first, then register it with SATIM.
const order = await satim.registerOrder({
  orderNumber: "CMD000123", // unique, alphanumeric, max 10 chars
  amount: { value: "806.50", currency: "DZD" }, // decimal string; never a float
  returnUrl: "https://merchant.example/payments/return",
  failUrl: "https://merchant.example/payments/failure",
  language: "fr", // sent as "FR"
  metadata: { udf1: "invoice-123" }, // defaults to orderNumber
});
// Store order.orderId, then redirect the browser to order.formUrl.

// 2. On return, confirm server-to-server. The redirect itself proves nothing.
const payment = await satim.acknowledgeTransaction(order.orderId);
const state = classifyPayment(payment); // "paid" | "registered" | "declined" | "reversed" | "refunded" | "partially_refunded" | "unknown"
const match = paymentMatchesOrder(payment, { orderNumber: "CMD000123", amount: { value: "806.50", currency: "DZD" } });

if (state === "paid" && match.matches) {
  // Fulfil exactly once (idempotent, transactional). payment.raw holds every gateway field.
}

// 3. Refunds: partial and full, live-verified in certification. Never retried automatically.
//    After any refund SATIM reports OrderStatus 4; depositAmount is what is still captured.
await satim.refund({ orderId: order.orderId, amount: { value: "200.00", currency: "DZD" } });
```

`"paid"` requires all three documented signals: `params.respCode == "00"`, `ErrorCode == "0"`, `OrderStatus == 2`. Anything SATIM has not documented, including `OrderStatus 1`, is `"unknown"`.

### Errors

Every error extends `WathiqPayError` and carries an `outcome`:

| Error | `outcome` | Meaning |
|---|---|---|
| `ConfigurationError`, `ValidationError` | `not-sent` | Rejected locally; nothing reached SATIM |
| `GatewayError` | `rejected` | SATIM answered with a non-zero code (`errorCode`, `errorMessage`, `raw`) |
| `TransportError` | `indeterminate` | Timeout, abort, network, redirect, or HTTP status failure; SATIM may have received the request |
| `MalformedResponseError` | `indeterminate` | SATIM answered, but the body was unusable |

Error messages never contain credentials or card data. Use `redact()` before logging raw responses or request bodies.

## Development

```text
npm run check         # type checks, unit + contract tests, build
npm run test:package  # pack the tarball and test it in a clean consumer
npm run test:merchant # reference merchant journey tests against the simulator
npm run test:live     # opt-in smoke test against certification; reads .env (gitignored)
npm run demo          # run the reference merchant shop with the local simulator
```

## Reference merchant

`examples/reference-merchant/` is the demonstrable payment solution for certification: checkout with terms and CAPTCHA, registration, hosted-page redirect, untrusted return handling, backend acknowledgement, exactly-once fulfilment, and printable, PDF, and email receipts in French, Arabic, and English. Its [README](examples/reference-merchant/README.md) maps each certification requirement to the code.

Copy `.env.example` to `.env` for live tests. Never commit credentials or SATIM test cards.

## Repository layout

| Path | Contents |
|---|---|
| `src/` | The SDK (published as the npm package) |
| `test/` | Unit, contract, packaging, and opt-in live tests |
| `examples/reference-merchant/` | The demo shop used for certification, with its Docker deployment |
| `docs/` | Integration reference, checklists, evidence log, process notes |
| `site/` | The public landing page at www.wathiqpay.com (Vite + React, deployed by Vercel with root directory `site`) |

## Documentation

- [Build and validation plan](plan.md)
- [SATIM integration reference](docs/satim-integration.md)
- [Certification checklist](docs/certification-checklist.md)
- [CIBWeb developer certification and merchant onboarding](docs/cibweb-process.md)
- [Questions and documentation gaps](docs/open-questions.md)
- [Send-ready outbound request drafts](docs/outbound-requests.md)
- [Live evidence log](docs/live-evidence.md)
- [Market, competitor, and legal positioning](docs/market-legal-positioning.md)

## Scope and legal position

WathiqPay is integration software. Each merchant keeps its own CIBWeb authorization, acquiring-bank relationship, credentials, terminal, and settlement account. Collection on behalf of merchants, pooled balances, payouts, and wallet services are out of scope. Module certification, when obtained, covers the exact tested release only.
