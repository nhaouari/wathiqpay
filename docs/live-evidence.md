# Live evidence log

Sanitized record of every exchange with the real SATIM certification environment. No credentials, terminal identifiers, or customer data are recorded here.

| Date | SDK commit/version | Scenario | Request | Observed response | Expected | Result |
|---|---|---|---|---|---|---|
| 2026-09-17 | 0.1.0-alpha.0 (uncommitted) | Register 50.00 DZD, language FR, POST form-encoded, `test2.satim.dz` | `register.do` | HTTP 200, `{"errorCode":5,"errorMessage":"Access denied"}` | `errorCode 0` with `orderId`/`formUrl` | Blocked by account access |
| 2026-09-17 | curl probe | Same fields via GET query string, `test2.satim.dz` | `register.do` | HTTP 200, `{"errorCode":5,"errorMessage":"Access denied"}` | same | Blocked by account access |
| 2026-09-17 | curl probe | Same fields via GET, `test.satim.dz` | `register.do` | HTTP 200, `{"errorCode":5,"errorMessage":"Access denied"}` | same | Blocked by account access |
| 2026-09-17 | 4fc94e3 | Reference merchant in certification mode: checkout 806.50 DZD via the shop UI, POST to `test2.satim.dz` | `register.do` | HTTP 200, `{"errorCode":5,"errorMessage":"Access denied"}` | `orderId`/`formUrl`, redirect to hosted page | Blocked by account access; shop showed the failure page, order persisted as `failed`, no credentials leaked |
| 2026-09-22 | 652b156 | Register 50.00 DZD, POST form-encoded, language FR, `test2.satim.dz` | `register.do` | HTTP 200, `{"errorCode":0,"orderId":"<20 chars>","formUrl":"https://test.satim.dz/payment/epg/merchants/merchantsatim/payment.html?mdOrder=<id>&language=fr"}` | `errorCode 0` with `orderId`/`formUrl` | Pass |
| 2026-09-22 | 652b156 | Acknowledge the registered order before any payment | `public/acknowledgeTransaction.do` | HTTP 200, `{"depositAmount":0,"currency":"012","actionCode":-100,"actionCodeDescription":"No payment attempted yet.","ErrorCode":"0","ErrorMessage":"Success","OrderStatus":0,"OrderNumber":"<ref>","Pan":"","Amount":5000,"Description":"..."}` | `OrderStatus 0`, classified `registered` | Pass |
| 2026-09-22 | 652b156 | Acknowledge the same order a second time (language EN) | `public/acknowledgeTransaction.do` | Byte-identical body to the first call | No state change | Pass (idempotent for an unpaid order) |
| 2026-09-22 | 652b156 | Acknowledge an unknown `mdOrder` | `public/acknowledgeTransaction.do` | HTTP 401, `application/json`, body `"Transaction is not found"` (a JSON string) | Documented: `ErrorCode 6` in a JSON object | Divergence; SDK updated to raise `GatewayError http_401` |
| 2026-09-22 | 652b156 | Open the returned `formUrl` in a browser | hosted page | HTTP 200, title "Paiement", CIB and Algérie Poste branding, merchant name "WATHIQ PAY", amount 50.00 DZD, card form, session timer starting at 10 minutes, help link and 3020 | Hosted page renders | Pass |

## Findings

Account-side blocker resolved 22 September 2026.

- POST with `application/x-www-form-urlencoded` is accepted by `register.do` and `acknowledgeTransaction.do` in certification. Open question 2 is answered for these two endpoints; `refund.do` is untested.
- The hosted payment page lives on `test.satim.dz`, not on the API host `test2.satim.dz`. Return-URL configuration must not assume a single host.
- The hosted page shows a session countdown starting at about ten minutes. An abandoned page therefore expires within minutes; the reconciliation job should treat "registered" orders older than that as candidates.
- Before payment, the acknowledgement returns `Pan: ""` and `depositAmount: 0` with `actionCode -100`. `ErrorCode` is a string while `Amount` and `OrderStatus` are numbers, confirming the mixed representation the parser was built for.
- Acknowledging an unpaid order twice returned identical bodies. Repeatability after a *paid* outcome is still unverified.
- An unknown `mdOrder` is answered with HTTP 401 and the JSON string `"Transaction is not found"`, not the documented error code 6. The SDK now inspects non-2xx bodies and reports this as a `GatewayError` with code `http_401`.
- The `formUrl` appends `language=fr` in lowercase even though the request sent `FR`; SATIM accepts the uppercase input.

Findings before 22 September 2026:

- The certification host answers POST `application/x-www-form-urlencoded` with a JSON object of the documented shape, so the SDK's transport, encoding, and error parsing are compatible with the real gateway at the HTTP level.
- `errorCode 5` is documented as "access denied, password change required, or invalid parameter". Because GET and POST on two hosts return the same answer, the cause is on the account side: the merchant user is not enabled for the API, its password must be changed in the portal, the terminal is not linked to the user, or the source IP is not allowlisted (open question 3).
- The plan's earlier observation of a disabled merchant-user label in the portal is consistent with this result.

## Next live step

Complete a payment on the hosted page with SATIM's certification test cards (from the CIBWEBLab portal, kept out of the repository), then acknowledge the order with `npm run test:live` extended to that order ID, or run the reference merchant on a public HTTPS host so the return flow is exercised end to end. That produces the first live `paid` fixture and lets the refund path be tested.
