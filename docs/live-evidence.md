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

## Reference merchant on the public host, 22 September 2026

Shop: `https://wathiqpay-demo2.vercel.app` (Vercel function in `cdg1`, Turso database), certification mode, commit `92f2856`. Each scenario was a real purchase: catalog, cart, checkout with name, phone, terms, and CAPTCHA, SATIM hosted page and 3-D Secure password page, SATIM's redirect back to the shop, backend acknowledgement, result page. Card fields were verified against the card data before each payment.

| Scenario | Result page | Expected | Verdict |
|---|---|---|---|
| Valid card | Paiement accepté: Votre paiement a été accepté. | accepted | Pass |
| Valid credit | Paiement accepté: Votre paiement a été accepté. | accepted | Pass |
| Temporarily blocked | Paiement refusé: Paiement refusé : carte signalée comme bloquée. Veuillez contacter votre banque. Code d'erreur  | refused | Pass |
| Lost | Paiement refusé: Paiement refusé : carte signalée comme perdue. Veuillez contacter votre banque. Code d'erreur : | refused | Pass |
| Stolen | Paiement refusé: Paiement refusé : carte signalée comme volée. Veuillez contacter votre banque. Code d'erreur :  | refused | Pass |
| Incorrect expiration date entry | Paiement refusé: Paiement refusé : date d'expiration incorrecte. Veuillez vérifier les informations et réessayer | refused | Pass |
| Card no longer exists on issuer server | Card cannot be entered (no past years in the expiry picker) | refused | Not testable |
| Card limit exceeded | Paiement accepté: Votre paiement a été accepté. — retried at 2376000.00 DZD: Paiement accepté | refused | Card approved; SATIM test data to confirm |
| Insufficient card balance | Paiement refusé: Paiement refusé : fonds insuffisants. Veuillez approvisionner votre compte et réessayer. Code d | refused | Pass |
| Incorrect CVV2 | Paiement refusé: Paiement refusé : code CVV incorrect. Veuillez vérifier les informations et réessayer. Code d'e | refused | Pass |
| Three incorrect password attempts / password-attempt limit exceeded | Paiement refusé: Card blocked for E-payments. Contact your bank Error code :2003. | refused | Pass |
| Not authorised for online payment | Paiement refusé: Card blocked for E-payments. Contact your bank Error code :2003. | refused | Pass |
| Not active/valid for online payment | Paiement refusé: Paiement refusé : carte inactive. Veuillez contacter votre banque. Code d'erreur : AE | refused | Pass |
| Terminal/transaction amount limit exceeded | Paiement accepté: Votre paiement a été accepté. — retried at 2376000.00 DZD: Paiement accepté | refused | Card approved; SATIM test data to confirm |
| Expired card | Paiement accepté: Votre paiement a été accepté. | refused | Card approved; SATIM test data to confirm |

| Checklist item | Result |
|---|---|
| Checkout shows terms checkbox, CAPTCHA, CIB/Edahabia mark, prominent total | Pass |
| Missing terms blocks payment before any SATIM call | Pass |
| Wrong CAPTCHA blocks payment | Pass |
| Invalid phone blocks payment | Pass |
| Hosted page opens as an independent top-level page on test.satim.dz | Pass |
| Success page shows respCode_desc, SATIM order ID, order number, approval code, date/time, amount, method, 3020 | Pass |
| Printable receipt | Pass |
| PDF receipt download | Pass |
| E-mail receipt | Fail |
| Repeated return shows the same result without re-fulfilment | Pass |
| Forged orderId in the return URL is rejected | Pass |
| Order history shows the paid order; another session cannot open it | Pass |
| Cancel on the hosted page returns to the failure route with SATIM's message | Pass |
| Arabic: RTL checkout, SATIM page in Arabic (language=ar), Arabic result page | Pass |
| English: SATIM page in English (language=en) | Pass |

Notes:

- **Correction to the earlier card run.** The "first attempt declined as incorrect CVV" pattern recorded below was caused by the test driver: SATIM's card page reorders digits typed faster than about 100 ms apart into the CVV field. With verified slow entry every scenario gives a stable outcome. Question 49 for SATIM is withdrawn.
- Three cards are approved although a refusal is expected: card limit exceeded and terminal limit exceeded (also approved at 2 376 000.00 DZD), and expired card (12/2022). This is SATIM test data, not merchant behaviour.
- The e-mail receipt failed because the demo project has no `SMTP_URL`; the shop now shows a clear message instead of an error page. It passes once SMTP is configured.
- Declines issued before 3-D Secure (actionCode 2003) and user cancellation carry only an English `actionCodeDescription` from SATIM ("Card blocked for E-payments…", "Operation cancelled by user"), so the French and Arabic result pages show that English sentence. Worth asking SATIM for localized text or a documented code list.
- Registration from the function's first region (`iad1`) failed intermittently; after moving the function to `cdg1` no registration failed across more than 25 orders.

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
- ~~The first attempt with each card was declined as "incorrect CVV"~~ Withdrawn: caused by the driver typing the CVV too fast (see the public-host section above).
- Accepted payment: EC "0", OS 2, AC 0, RC "00", `approvalCode` and `authorizationResponseId` both present (6 digits), `depositAmount` equals `Amount`.
- Issuer declines: EC "2", OS 6, `depositAmount` 0, numeric `actionCode`, alphanumeric `respCode` ("37", "41", "43", "51", "AB", "AD", "AE"). Cards blocked before 3-D Secure (AC 2003) return `params` without any `respCode`; the merchant must fall back to `actionCodeDescription`, as the checklist requires.
- "Card limit exceeded" and "Terminal/transaction amount limit exceeded" were approved on the second attempt at 50.00 DZD and 999 999.00 DZD respectively. Either the scenario needs a specific amount or the test cards changed; to ask SATIM.
- "Card no longer exists" (expiry 01/2025) cannot be entered: the hosted page's year picker offers no past years, so the order stays registered. "Expired card" (12/2022) could be selected and was approved; to ask SATIM.
- Refunds on a paid 50.00 order: refund 20.00 → `errorCode "0"`; acknowledgement then shows OS 4 with `depositAmount` 3000. Refund 30.00 → success; OS 4 with `depositAmount` 0. A further 1.00 → `errorCode 7 "Refund is impossible for current transaction state"`. So OS 4 means "a refund happened", and `depositAmount` is what is still captured. The SDK now classifies OS 4 with a non-zero deposit as `partially_refunded`.
- Acknowledging a paid order twice returned identical bodies.

## Findings

Account-side blocker resolved 22 September 2026.

- POST with `application/x-www-form-urlencoded` succeeded for registration, acknowledgement, and the refunds recorded above in certification. Formal production confirmation remains open.
- The hosted payment page lives on `test.satim.dz`, not on the API host `test2.satim.dz`. Return-URL configuration must not assume a single host.
- The hosted page shows a session countdown starting at about ten minutes. An abandoned page therefore expires within minutes; the reconciliation job should treat "registered" orders older than that as candidates.
- Before payment, the acknowledgement returns `Pan: ""` and `depositAmount: 0` with `actionCode -100`. `ErrorCode` is a string while `Amount` and `OrderStatus` are numbers, confirming the mixed representation the parser was built for.
- Repeated acknowledgement of unpaid and paid orders returned identical responses in the recorded runs. This observation is not a formal production idempotency guarantee.
- An unknown `mdOrder` is answered with HTTP 401 and the JSON string `"Transaction is not found"`, not the documented error code 6. The SDK now inspects non-2xx bodies and reports this as a `GatewayError` with code `http_401`.
- The `formUrl` appends `language=fr` in lowercase even though the request sent `FR`; SATIM accepts the uppercase input.

Findings before 22 September 2026:

- The certification host answers POST `application/x-www-form-urlencoded` with a JSON object of the documented shape, so the SDK's transport, encoding, and error parsing are compatible with the real gateway at the HTTP level.
- `errorCode 5` is documented as "access denied, password change required, or invalid parameter". Because GET and POST on two hosts return the same answer, the cause is on the account side: the merchant user is not enabled for the API, its password must be changed in the portal, the terminal is not linked to the user, or the source IP is not allowlisted (open question 3).
- The plan's earlier observation of a disabled merchant-user label in the portal is consistent with this result.

## Next live step

The public HTTPS journey and refund runs are complete as recorded above. Next: deploy the locally verified refund-display and unknown-balance fixes, repeat the affected checks, and capture the deployment identifier. Resolve the two limit scenarios, expired-card approval, and unavailable expiry with SATIM. The CVV-driver issue was withdrawn and must not be raised as a gateway defect.

Arabic PDF rendering remains incomplete (French fallback); the existing PDF download pass does not establish Arabic-language compliance. Email delivery is deferred at the owner's request, not passed or waived by SATIM. See `certification-day.md` for the remaining handoff gates.
