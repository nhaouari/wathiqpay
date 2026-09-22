# Outbound requests: send-ready drafts

Status: drafts prepared 17 September 2026. Nothing has been sent. The owner decides whether, when, and through which channel to send them. The full backlog is in [open-questions.md](open-questions.md); these drafts carry only the items that block a stable release or the certification submission.

## Draft 1 — Technical questions to SATIM (certification support)

Subject: WathiqPay module integration — clarification of five contract points before certification

Bonjour,

We are developing a reusable server-side payment module (WathiqPay, TypeScript/Node.js) against the CIBWEBLab certification portal under our existing developer testing slot. Before we freeze the module's behavior, we would appreciate written confirmation on the following points, referenced to the pages at `certweb.satim.dz/Cert/url` and `/Cert/validate`.

1. Transport. The portal labels `register.do`, `acknowledgeTransaction.do`, and `refund.do` as GET but recommends POST. Is `POST` with `Content-Type: application/x-www-form-urlencoded` (UTF-8) formally supported for all three, in certification and production?
2. Acknowledgement semantics. Is `acknowledgeTransaction.do` idempotent when called more than once for the same `mdOrder`? Does it change transaction state or only confirm/return it? What is the exact delay after which an unacknowledged transaction is reversed, and is there a read-only status endpoint for reconciliation?
3. Production endpoint. What is the official production REST base URL, and are IP allowlisting, client certificates, or specific TLS requirements applied to merchant servers?
4. Refunds. Are `language` and `currency` required by `refund.do`? Is `externalRefundId` supported, and in what format? Which `OrderStatus` values are refundable, and what is the minimum refund amount? What mechanism should prevent a duplicate refund after a network timeout?
5. Receipt data. The validation page requires the transaction date/time and payment method on the receipt. Which response fields of `acknowledgeTransaction.do` are the authoritative source for each, or should the merchant use its own acknowledgement timestamp?

We can provide request/response samples from our testing slot on request.

Cordialement,
[name, company, developer account reference]

## Draft 2 — Scope questions to GIE Monétique / the qualifier (via CIBWeb)

Subject: Certification scope of the WathiqPay payment module (existing application)

Bonjour,

Our module-certification application on CIBWeb has been accepted and integration tests are in progress. To make sure we submit the right artifact for qualification, we would like to confirm the scope of the certificate:

1. Eligibility. Is a server-side npm package (no bundled UI) eligible as the certified "module", provided it is accompanied by a reference merchant website demonstrating the full checkout, receipt, and error requirements?
2. Boundary. Which elements will the certificate cover: the package name and version, the reference merchant application, the required UI components, and/or a specific configuration?
3. Versions. Which kinds of updates require recertification (bug fixes, new features, changes to the reference UI)? What are the certificate's duration and renewal process?
4. Proprietary distribution. WathiqPay is a proprietary module, not an open-source distribution. How should merchant licence-authentication requests be validated, and what identifier should a merchant supply when applying under the referenced-module (Type 1) path?
5. Evidence. What evidence must we retain from qualification, and what remains to be tested during a merchant's bank production activation?

Cordialement,
[name, company, CIBWeb application reference]
