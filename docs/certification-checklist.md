# SATIM certification checklist

This checklist mirrors the accessible SATIM certification portal and adds backend controls required for a safe SDK integration.

## 1. SATIM onboarding

- [x] Testing slot has been opened and is active.
- [x] Merchant username and password have been issued.
- [x] Virtual terminal ID has been issued.
- [ ] Certification and production endpoints have been confirmed in writing.
- [ ] Merchant server IP allowlisting or certificate requirements have been confirmed.
- [x] Refund permission is enabled for the intended SATIM user.
- [ ] Development is complete before reserving the certification date. *Arabic PDFs and payment artwork were deployed and retested at 6472e50; final qualifier requirements and operational gates remain open.*
- [ ] Certification date is reserved and validated by SATIM.

## 2. Checkout UI

- [x] Merchant site has a valid SSL/TLS certificate.
- [x] Final payable amount is complete and visually prominent.
- [x] Amount and currency remain consistent through checkout and the result page.
- [x] CAPTCHA protects the page containing the payment button.
- [x] Payment button displays the CIB/Edahabia logo. *Unmodified banner from SATIM's public payment page, deployed and verified 22 September 2026; qualifier acceptance of the layout remains to confirm. See `PAYMENT-ARTWORK.md` in the merchant image directory.*
- [x] Online-payment terms and product/service sale terms are displayed immediately before payment.
- [x] Customer must explicitly acknowledge those terms.
- [ ] Language is consistent across checkout, intermediate pages, SATIM redirect, return page, receipts, and errors. *Arabic PDFs were verified at 6472e50; some SATIM decline messages still arrive in English.*
- [x] SATIM payment page opens as an independent web page, not an embedded merchant frame or mobile WebView.

## 3. Order registration

- [x] Merchant order is persisted before calling SATIM.
- [x] `orderNumber` is unique and no longer than ten characters.
- [x] Amount is converted to integer minor units without floating point.
- [x] Amount is at least `50 DZD` unless SATIM confirms another limit.
- [x] Currency code for DZD is `012`.
- [x] `returnUrl` and `failUrl` use HTTPS and an approved merchant origin.
- [x] Language is one of `AR`, `FR`, or `EN`.
- [x] `force_terminal_id` is present in `jsonParams`.
- [x] `udf1` contains the intended merchant reference.
- [x] Credentials and request bodies are redacted from logs.
- [x] Registration response is schema-validated.
- [x] `orderId` is stored against the merchant order before redirecting.
- [x] Customer is redirected only to the `formUrl` returned by SATIM.

## 4. Return and acknowledgement

- [x] Browser redirect is treated as untrusted input, not proof of payment.
- [x] Backend calls `acknowledgeTransaction.do` using the stored `orderId`.
- [x] Acknowledgement is performed promptly to avoid automatic reversal.
- [x] Returned `OrderNumber` matches the local order.
- [x] Returned `Amount` and currency match the expected payment.
- [x] Payment is accepted only under the certified condition: `respCode=00`, `ErrorCode=0`, `OrderStatus=2`.
- [x] Repeated redirects and acknowledgement results are handled idempotently.
- [x] Unknown status combinations are held for investigation rather than fulfilled.
- [x] Sensitive fields are redacted from logs and client-facing errors.

## 5. Successful-payment page

- [x] Displays `params.respCode_desc`.
- [x] Displays the SATIM transaction identifier (`orderId`).
- [x] Displays the merchant order number.
- [x] Displays `approvalCode`.
- [x] Displays transaction date and time.
- [x] Displays payment amount and currency.
- [x] Displays payment method as CIB/Edahabia.
- [x] Displays SATIM support number `3020`.
- [x] Allows the receipt to be printed.
- [x] Allows the receipt to be downloaded as PDF. *(French, English, and Arabic; verified on the deployment)*
- [x] Allows the PDF receipt to be sent to an email address chosen by the customer. *(Resend SMTP from recus@wathiqpay.com; delivered with PDF on 23 September 2026, order WEDFSKPTM2)*

## 6. Rejected/error result page

- [ ] Reversed/rejected transactions show the localized rejection message required by SATIM. *Shows SATIM's message and a localized fallback; the exact wording SATIM requires is still to confirm.*
- [x] Other failures display `params.respCode_desc`.
- [x] If `respCode_desc` is empty, `actionCodeDescription` is displayed.
- [x] SATIM support number `3020` is displayed.
- [x] Failure does not mark or fulfill the merchant order as paid.
- [x] Technical details and merchant credentials are not exposed to the customer.

## 7. Card and transaction certification scenarios

Use only SATIM-issued certification data stored outside source control.

- [x] Valid CIB card → payment accepted. *(22 Sept 2026, through the public shop)*
- [x] Temporarily blocked card → payment refused. *(AC 119 / RC 37)*
- [x] Lost card → payment refused. *(AC 126 / RC 41)*
- [x] Stolen card → payment refused. *(AC 127 / RC 43)*
- [x] Incorrect expiry date → payment refused. *(AC 100882 / RC AD)*
- [ ] Card absent from issuer server → payment refused. *Not testable: the card number in the portal fails the Luhn checksum, so SATIM's page keeps the Paiement button disabled (the expiry year is selectable).*
- [ ] Card limit exceeded → payment refused. *Approved at 50.00, 1 200.00 and 2 376 000.00 DZD; SATIM test data to confirm (question 50).*
- [x] Insufficient balance → payment refused. *(AC 116 / RC 51)*
- [x] Incorrect CVV2 → payment refused. *(AC 140 / RC AB)*
- [x] Incorrect password → payment refused. *A wrong 3-D Secure password keeps the customer on SATIM's password page to retry; nothing is paid. Lockout after three attempts is covered by the dedicated card below.*
- [x] Three incorrect password attempts → payment refused. *(AC 2003, declined before 3-D Secure)*
- [x] Card not authorized for online payment → payment refused. *(AC 2003)*
- [x] Card inactive for online payment → payment refused. *(AC 100254 / RC AE)*
- [ ] Terminal/transaction amount limit exceeded → payment refused. *Approved at 1 200.00 and 2 376 000.00 DZD; SATIM test data to confirm (question 50).*
- [ ] Expired card → payment refused. *Approved with 12/2022 on the public shop too; SATIM test data to confirm (question 51).*
- [x] Valid credit scenario → expected successful result.
- [x] Connectivity between merchant and SATIM servers is verified.
- [x] Full refund through SATIM is successful. *(two partial refunds summing to the deposit)*
- [x] Partial/multiple-refund rules are verified if the merchant needs them. *(OS 4 with remaining depositAmount; over-refund → error 7)*
- [x] Transaction cancellation/reversal through SATIM is successful. *(Annuler on the hosted page; refunds via `refund.do`)*

## 8. Release readiness

- [ ] SATIM acceptance-test workbook is fully passed.
- [ ] SATIM certification report/PV has been generated and approved.
- [ ] Merchant has confirmed completion of certification tests.
- [ ] Production credentials are stored in an approved secret manager.
- [x] Certification credentials and test cards are not present in the npm package. *(`npm run test:package` enforces a file allowlist)*
- [x] Production base URL is explicitly configured and cannot silently fall back to certification. *(client refuses production without `baseUrl`; unit-tested)*
- [ ] Alerts exist for SATIM timeouts, malformed responses, unknown statuses, and acknowledgement failures. *Failures are logged with a `[merchant]` prefix; the alert rule itself must be set up in the host's log tooling (see runbook).*
- [x] Operational runbook documents reconciliation, reversals, refunds, and SATIM escalation contacts. *(docs/runbook.md)*
