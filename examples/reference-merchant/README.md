# Reference merchant

A framework-free Node.js shop that demonstrates the WathiqPay module end to end for certification: a six-product catalog, a cart, a checkout with order summary, order registration, redirect to the hosted page, return handling, server-to-server acknowledgement, exactly-once fulfilment, an order history, and receipts.

Pages: `/` catalog · `/cart` · `/checkout` · `/orders` and `/orders/<ref>` (per browser session) · `/payment/return` and `/payment/fail` · `/orders/<ref>/receipt[.pdf]`.

```text
npm run demo             # simulator mode: starts a local SATIM simulator and the shop on http://localhost:3000
MERCHANT_MODE=certification MERCHANT_PUBLIC_URL=https://your-host.example npm run demo
```

Certification mode reads `SATIM_USERNAME`, `SATIM_PASSWORD`, and `SATIM_TERMINAL_ID` from `.env` and needs a public HTTPS origin for the return URLs.

## How each certification requirement is met

| Requirement (docs/certification-checklist.md) | Where |
|---|---|
| Final amount complete and prominent; consistent through result page and receipt | `views.ts` checkout `.total`, success page, receipt rows use the acknowledged amount |
| CAPTCHA on the page with the payment button | `captcha.ts`, HMAC-signed arithmetic challenge verified in `POST /checkout` before any SATIM call |
| CIB/Edahabia logo on the payment button | Badge next to the button plus a documented placement for SATIM's official logo (not redistributed) |
| Terms of sale and online-payment terms shown and explicitly accepted | `.terms` block with required checkbox; server rejects without it |
| Language consistent across checkout, SATIM request, result, receipts, errors | Cookie-selected FR/AR/EN; stored on the order; sent to `register.do` and `acknowledgeTransaction.do`; result page uses the order's language |
| Hosted page opens as an independent page | `303` redirect to `formUrl`; no iframe or WebView |
| Order persisted before registration; `orderNumber` unique and 10 chars | `store.ts` `createPending` writes the order and its items in one transaction (SQLite primary key, 32-symbol alphabet) |
| SATIM `orderId` stored before redirect; redirect only to returned `formUrl` | `app.ts` `POST /checkout` |
| Browser redirect untrusted; acknowledgement from the backend using the stored `orderId` | `app.ts` `settle()`; query-string `orderId` only cross-checked, mismatches get 404 |
| Amount and order number compared before fulfilment | `paymentMatchesOrder`; mismatches go to state `review` |
| Accept only `respCode=00`, `ErrorCode=0`, `OrderStatus=2` | `classifyPayment` from the SDK |
| Repeated returns and concurrent callbacks fulfil once | `store.fulfilOnce` conditional UPDATE inside `BEGIN IMMEDIATE` |
| Unknown combinations held, not fulfilled | state `unknown`, "payment being verified" page |
| Success page: `respCode_desc`, SATIM order ID, merchant order number, approval code, date/time, amount and currency, payment method, 3020 | `successPage` / `receiptRows` |
| Print, PDF download, email receipt | `/orders/:ref/receipt`, `/orders/:ref/receipt.pdf` (`receipt-pdf.ts`), `POST /orders/:ref/receipt/email` (`mailer.ts` outbox) |
| Failure page: rejection message for reversed, else `respCode_desc` or `actionCodeDescription`, 3020, no credentials | `failurePage` |
| Closed browser / abandoned payment recovery | `POST /admin/reconcile` acknowledges stale registered orders (`reconcile()`) |

## Documented limitations

- Receipt date/time is the merchant's acknowledgement timestamp. SATIM has not confirmed an authoritative gateway timestamp field (open question). Payment method is shown generically as "CIB / Edahabia card" because the card network must not be inferred from the masked PAN.
- The PDF uses standard Latin fonts; Arabic receipts fall back to French labels in the PDF. Embed a font for production.
- The mailer writes `.eml` files to `outbox/`. Replace with SMTP in production.
- `/admin/*` endpoints are unauthenticated demo tooling.
- Sessions are an anonymous `sid` cookie; there is no customer login. Order pages are visible only to the session that placed them.
- Product photos are openly licensed images from Wikimedia Commons; see `public/images/ATTRIBUTION.md`. Replace them with your own product photography.
- The store is SQLite via `node:sqlite` (flag `--experimental-sqlite` on Node 22). Any database with a unique constraint and a conditional update works the same way.

## Tests

`npm run test:merchant` drives the full journey through real HTTP against the simulator: success, decline, reversal, undocumented status, forged query strings, repeated and concurrent returns, closed browser plus reconcile, language consistency, and registration failure.
