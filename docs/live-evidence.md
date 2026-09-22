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

## Card scenarios, 22 September 2026 (SDK commit 1249642 plus the partial-refund change)

Each scenario registered a fresh 50.00 DZD order through the SDK (999 999.00 DZD for the terminal-limit scenario), was driven through SATIM's hosted card page and static 3-D Secure password page with `test/live/cards-driver.py`, then acknowledged through the SDK. EC = ErrorCode, OS = OrderStatus, AC = actionCode, RC = params.respCode. PANs are never recorded.

| Scenario | First attempt | Second attempt | Expected | Verdict |
|---|---|---|---|---|
| Valid card | EC=0 OS=2 AC=0 RC=00 → `paid` | — | paid | Pass |
| Valid credit | EC=0 OS=2 AC=0 RC=00 → `paid` | — | paid | Pass |
| Temporarily blocked | EC=2 OS=6 AC=119 RC=37 → `declined` | — | declined | Pass |
| Lost | EC=2 OS=6 AC=126 RC=41 → `declined` | — | declined | Pass |
| Stolen | EC=2 OS=6 AC=127 RC=43 → `declined` | — | declined | Pass |
| Incorrect expiration date entry | EC=2 OS=6 AC=100882 RC=AD → `declined` | — | declined | Pass |
| Card no longer exists on issuer server | hosted page refused the entry (year picker has no past years); order stays registered | — | declined | Not testable via hosted page |
| Card limit exceeded | EC=2 OS=6 AC=140 RC=AB → `declined` | EC=0 OS=2 AC=0 RC=00 → `paid` | declined | Approved, but a decline was expected |
| Insufficient card balance | EC=2 OS=6 AC=140 RC=AB → `declined` | EC=2 OS=6 AC=116 RC=51 → `declined` | declined | Pass |
| Incorrect CVV2 | EC=2 OS=6 AC=140 RC=AB → `declined` | — | declined | Pass |
| Three incorrect password attempts / password-attempt limit exceeded | EC=2 OS=6 AC=2003 RC=None → `declined` | — | declined | Pass |
| Not authorised for online payment | EC=2 OS=6 AC=2003 RC=None → `declined` | — | declined | Pass |
| Not active/valid for online payment | EC=2 OS=6 AC=100254 RC=AE → `declined` | — | declined | Pass |
| Terminal/transaction amount limit exceeded | EC=2 OS=6 AC=140 RC=AB → `declined` | EC=0 OS=2 AC=0 RC=00 → `paid` | declined | Approved, but a decline was expected |
| Expired card | EC=0 OS=2 AC=0 RC=00 → `paid` | — | declined | Approved, but a decline was expected |

Observations from the card runs:

- The hosted flow has two steps: card entry on `test.satim.dz`, then a static 3-D Secure password page on `test2.satim.dz/acs/api/3ds/form`. The browser is finally redirected to `returnUrl` or `failUrl` with `?lang=fr&orderId=<mdOrder>` appended.
- The first attempt with each card in this session was declined as "incorrect CVV" (AC 140, RC AB) even for valid cards; the second attempt gave the scenario's real outcome. Cause unknown (issuer simulator warm-up or a per-card first-use rule). The SDK is unaffected, but certification runs should expect it.
- Accepted payment: EC "0", OS 2, AC 0, RC "00", `approvalCode` and `authorizationResponseId` both present (6 digits), `depositAmount` equals `Amount`.
- Issuer declines: EC "2", OS 6, `depositAmount` 0, numeric `actionCode`, alphanumeric `respCode` ("37", "41", "43", "51", "AB", "AD", "AE"). Cards blocked before 3-D Secure (AC 2003) return `params` without any `respCode`; the merchant must fall back to `actionCodeDescription`, as the checklist requires.
- "Card limit exceeded" and "Terminal/transaction amount limit exceeded" were approved on the second attempt at 50.00 DZD and 999 999.00 DZD respectively. Either the scenario needs a specific amount or the test cards changed; to ask SATIM.
- "Card no longer exists" (expiry 01/2025) cannot be entered: the hosted page's year picker offers no past years, so the order stays registered. "Expired card" (12/2022) could be selected and was approved; to ask SATIM.
- Refunds on a paid 50.00 order: refund 20.00 → `errorCode "0"`; acknowledgement then shows OS 4 with `depositAmount` 3000. Refund 30.00 → success; OS 4 with `depositAmount` 0. A further 1.00 → `errorCode 7 "Refund is impossible for current transaction state"`. So OS 4 means "a refund happened", and `depositAmount` is what is still captured. The SDK now classifies OS 4 with a non-zero deposit as `partially_refunded`.
- Acknowledging a paid order twice returned identical bodies.

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

Deploy the reference merchant on a public HTTPS host so the return redirect, result pages, and receipts are exercised by SATIM's redirect rather than by a placeholder URL, then repeat the scenarios through the shop. Ask SATIM about the two limit scenarios, the expired-card approval, and the first-attempt CVV declines.

Earlier plan: complete a payment on the hosted page with SATIM's certification test cards (from the CIBWEBLab portal, kept out of the repository), then acknowledge the order with `npm run test:live` extended to that order ID, or run the reference merchant on a public HTTPS host so the return flow is exercised end to end. That produces the first live `paid` fixture and lets the refund path be tested.
