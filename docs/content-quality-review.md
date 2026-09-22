# Content and accessibility review - 23 September 2026

Scope: public landing page and reference merchant. This is a local implementation review, not a SATIM approval or a WCAG AAA conformance certificate.

## Corrected

- Distinguish the alpha SDK, reference shop, and pending certification. State that the package is not published to npm.
- Replace “15 cards passed / four reported” with the recorded evidence: 11 expected results, three unexpected approvals, one unenterable scenario. No claim that a message was sent to SATIM.
- Remove the misleading complete-integration claim from the code excerpt; include payment/order matching before fulfilment.
- Explain the French/English gateway-message limitation and deferred email delivery. Do not describe owner deferral as a SATIM waiver.
- Retain provenance for official artwork and deployment evidence; correct stale French-fallback statements after the Arabic PDF fix.
- Add a localized test-only warning to simulator/certification pages; hide it in production. Ask testers to use fictional contact details and SATIM-issued test cards.
- Hide checkout email collection when email receipts are disabled.
- Add keyboard skip links, visible focus, 44px navigation targets, language metadata, stronger text/input contrast, mobile reflow, and a direct contact-form alternative with third-party privacy context.

## Checks

- Landing build and lint of edited React entry/components pass.
- Desktop screenshot reviewed at 1440px; 320px browser check found no document overflow, missing images, or duplicate main heading.
- Selected text/background pairs measured above the WCAG enhanced 7:1 target: secondary landing text 8.66:1, green links 9.15:1, status chip 7.17:1, code caption 9.89:1, merchant receipt labels 8.50:1, success state 7.87:1, pending state 8.09:1. These are representative palette checks, not a complete page audit.
- Merchant regression tests cover localized banners, skip targets, production-banner suppression, and disabled email collection.
- All 65 automated tests and the package consumer check pass. Keyboard Tab/Enter on the landing skip link moves focus to the main content. The merchant also has no document overflow at 320px.

## Still requires verification

- Screen-reader testing, complete keyboard journeys, zoom/text-spacing checks, and automated/manual testing of every state. No full AAA claim is made.
- SATIM's hosted pages and Tally's embedded form are third-party interfaces; their conformance is not established here.
- Arithmetic CAPTCHA, receipt PDF tagging/text extraction, long-receipt pagination, and the French text embedded in the SATIM banner require separate review before any AAA claim.
- Deploy these edits, then repeat the checks on the deployed URLs. Local checks do not establish the deployed site's state.
- SATIM appointment, four card-scenario clarifications, rejection wording approval, operational alert delivery, and production activation remain external gates.

## Primary references

- https://www.w3.org/WAI/WCAG22/quickref/ - accessibility success criteria.
- https://www.cibweb.dz/fr/ - separate merchant and module-developer pathways and published eligibility conditions.
- https://www.satim.dz/index.php/fr/services-cib/paiement-en-ligne - SATIM technical certification role.
- https://cib.satim.dz/payment/merchants/SATIM/payment_fr.html - source payment artwork.

User decision retained: do not configure SMTP now.
