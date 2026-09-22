# Certification-day handoff

Status: not yet ready for an unconditional pass. Local tests are not SATIM certification, and local fixes must be deployed and retested before being presented as live evidence.

## Before the session

1. Complete Arabic PDF rendering and verify Arabic names, mixed numbers/text, and long receipts visually. Current PDF falls back to French; the browser print receipt is not proof that the downloadable PDF passes.
2. Confirm the payment-button layout and rejection wording with SATIM. The generic badge has been replaced with the unmodified CIB/Edahabia banner from SATIM's public payment page (see `examples/reference-merchant/public/images/PAYMENT-ARTWORK.md`). Official-source artwork is installed locally; qualifier acceptance and any language-specific variants remain open.
3. Ask SATIM to correct or accept the four outstanding card scenarios: card limit, terminal limit, expired card, and missing card whose expiry cannot be selected. Attach redacted order IDs, amounts, timestamps, expected and observed results. Do not include PAN, CVV, passwords, or credentials in the public dossier.
4. Confirm the certification appointment and that the testing account remains active for it. The previously recorded testing window was 15–25 September 2026; it is not proof of a booked appointment or continued access.
5. Deploy the tested revision; record the commit and deployment URL. Run paid, declined, cancellation, replay, cross-session access, partial/full refund result display, and receipt checks against that deployment. Do not create new real-money payments without approval.
6. Configure host alert routing for `[merchant]` registration/acknowledgement failures, unknown payments, and mismatches; trigger a safe test alert and verify delivery. Logs alone are not alerts.
7. Confirm acknowledgement deadlines and configure reconciliation accordingly. The daily Vercel schedule is not sufficient evidence of prompt recovery after a customer closes the browser.
8. Email delivery remains deferred by the owner. Obtain SATIM's explicit acceptance of that deferral, or complete delivery before a session that requires it. SMTP itself is a transport choice; do not assume the receipt-email requirement is waived.

## On the day

- Keep the deployed HTTPS merchant, portal, acceptance workbook, and redacted evidence accessible. Keep credentials/test cards in private storage.
- Freeze unrelated changes; record the exact deployed revision and environment as certification, not production.
- Execute the qualifier's workbook and record actual outcomes. Mark SATIM-dependent anomalies as unresolved unless the qualifier explicitly accepts them.
- Obtain the approved certification report/PV and the exact module/version covered. A successful demo does not itself grant certification.

## Before production (separate gate)

- Written production API URL, source-IP/certificate requirements, acknowledgement deadline, and credential activation procedure.
- Production credentials stored as server-only secrets; no silent fallback to the certification gateway.
- Confirm each merchant's bank/onboarding eligibility separately from reusable-module certification.

No appointment, email to SATIM, production activation, or waiver is implied by this document.
