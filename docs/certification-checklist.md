# SATIM certification checklist

This checklist mirrors the accessible SATIM certification portal and adds backend controls required for a safe SDK integration.

## 1. SATIM onboarding

- [ ] Testing slot has been opened and is active.
- [ ] Merchant username and password have been issued.
- [ ] Virtual terminal ID has been issued.
- [ ] Certification and production endpoints have been confirmed in writing.
- [ ] Merchant server IP allowlisting or certificate requirements have been confirmed.
- [ ] Refund permission is enabled for the intended SATIM user.
- [ ] Development is complete before reserving the certification date.
- [ ] Certification date is reserved and validated by SATIM.

## 2. Checkout UI

- [ ] Merchant site has a valid SSL/TLS certificate.
- [ ] Final payable amount is complete and visually prominent.
- [ ] Amount and currency remain consistent through checkout and the result page.
- [ ] CAPTCHA protects the page containing the payment button.
- [ ] Payment button displays the CIB/Edahabia logo.
- [ ] Online-payment terms and product/service sale terms are displayed immediately before payment.
- [ ] Customer must explicitly acknowledge those terms.
- [ ] Language is consistent across checkout, intermediate pages, SATIM redirect, return page, receipts, and errors.
- [ ] SATIM payment page opens as an independent web page, not an embedded merchant frame or mobile WebView.

## 3. Order registration

- [ ] Merchant order is persisted before calling SATIM.
- [ ] `orderNumber` is unique and no longer than ten characters.
- [ ] Amount is converted to integer minor units without floating point.
- [ ] Amount is at least `50 DZD` unless SATIM confirms another limit.
- [ ] Currency code for DZD is `012`.
- [ ] `returnUrl` and `failUrl` use HTTPS and an approved merchant origin.
- [ ] Language is one of `AR`, `FR`, or `EN`.
- [ ] `force_terminal_id` is present in `jsonParams`.
- [ ] `udf1` contains the intended merchant reference.
- [ ] Credentials and request bodies are redacted from logs.
- [ ] Registration response is schema-validated.
- [ ] `orderId` is stored against the merchant order before redirecting.
- [ ] Customer is redirected only to the `formUrl` returned by SATIM.

## 4. Return and acknowledgement

- [ ] Browser redirect is treated as untrusted input, not proof of payment.
- [ ] Backend calls `acknowledgeTransaction.do` using the stored `orderId`.
- [ ] Acknowledgement is performed promptly to avoid automatic reversal.
- [ ] Returned `OrderNumber` matches the local order.
- [ ] Returned `Amount` and currency match the expected payment.
- [ ] Payment is accepted only under the certified condition: `respCode=00`, `ErrorCode=0`, `OrderStatus=2`.
- [ ] Repeated redirects and acknowledgement results are handled idempotently.
- [ ] Unknown status combinations are held for investigation rather than fulfilled.
- [ ] Sensitive fields are redacted from logs and client-facing errors.

## 5. Successful-payment page

- [ ] Displays `params.respCode_desc`.
- [ ] Displays the SATIM transaction identifier (`orderId`).
- [ ] Displays the merchant order number.
- [ ] Displays `approvalCode`.
- [ ] Displays transaction date and time.
- [ ] Displays payment amount and currency.
- [ ] Displays payment method as CIB/Edahabia.
- [ ] Displays SATIM support number `3020`.
- [ ] Allows the receipt to be printed.
- [ ] Allows the receipt to be downloaded as PDF.
- [ ] Allows the PDF receipt to be sent to an email address chosen by the customer.

## 6. Rejected/error result page

- [ ] Reversed/rejected transactions show the localized rejection message required by SATIM.
- [ ] Other failures display `params.respCode_desc`.
- [ ] If `respCode_desc` is empty, `actionCodeDescription` is displayed.
- [ ] SATIM support number `3020` is displayed.
- [ ] Failure does not mark or fulfill the merchant order as paid.
- [ ] Technical details and merchant credentials are not exposed to the customer.

## 7. Card and transaction certification scenarios

Use only SATIM-issued certification data stored outside source control.

- [ ] Valid CIB card → payment accepted.
- [ ] Temporarily blocked card → payment refused.
- [ ] Lost card → payment refused.
- [ ] Stolen card → payment refused.
- [ ] Incorrect expiry date → payment refused.
- [ ] Card absent from issuer server → payment refused.
- [ ] Card limit exceeded → payment refused.
- [ ] Insufficient balance → payment refused.
- [ ] Incorrect CVV2 → payment refused.
- [ ] Incorrect password → payment refused.
- [ ] Three incorrect password attempts → payment refused.
- [ ] Card not authorized for online payment → payment refused.
- [ ] Card inactive for online payment → payment refused.
- [ ] Terminal/transaction amount limit exceeded → payment refused.
- [ ] Expired card → payment refused.
- [ ] Valid credit scenario → expected successful result.
- [ ] Connectivity between merchant and SATIM servers is verified.
- [ ] Full refund through SATIM is successful.
- [ ] Partial/multiple-refund rules are verified if the merchant needs them.
- [ ] Transaction cancellation/reversal through SATIM is successful.

## 8. Release readiness

- [ ] SATIM acceptance-test workbook is fully passed.
- [ ] SATIM certification report/PV has been generated and approved.
- [ ] Merchant has confirmed completion of certification tests.
- [ ] Production credentials are stored in an approved secret manager.
- [ ] Certification credentials and test cards are not present in the npm package.
- [ ] Production base URL is explicitly configured and cannot silently fall back to certification.
- [ ] Alerts exist for SATIM timeouts, malformed responses, unknown statuses, and acknowledgement failures.
- [ ] Operational runbook documents reconciliation, reversals, refunds, and SATIM escalation contacts.

