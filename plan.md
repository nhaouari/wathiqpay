# WathiqPay open-source SDK plan

Date: 22 September 2026 (revision 6). Status: Milestones A–D implemented offline; Milestone E started with live registration and acknowledgement passing (52 tests: unit, contract, tarball consumer, merchant journey; CI workflow). Reference merchant in `examples/reference-merchant/`. First live attempt made; see [live-evidence.md](docs/live-evidence.md). Certification and production readiness remain separate gates.

## Recommendation

Yes—an independently developed open-source SATIM client is technically feasible. The documented integration uses three HTTP operations and a hosted payment page. A small TypeScript library can make the integration much easier by handling serialization, amounts, error parsing, and payment decisions consistently.

The intended product is a reusable payment module that merchants install through npm and that we submit through CIBWeb's developer certification path. CIBWeb explicitly documents module certification and GIE Monétique referencing, followed by a separate authorization path for merchants using that referenced module. This corrects the earlier uncertainty about whether reusable module certification exists. Whether a bare npm SDK is a sufficient certification submission, and which accompanying UI/version is covered, still needs confirmation.

Open-source code does not provide merchant credentials, terminal activation, bank agreements, or automatic authorization. Each merchant must still complete its own authorization and bank activation. The certificate holder also validates merchant licence-authentication requests in CIBWeb. See [the verified CIBWeb process](docs/cibweb-process.md).

The initial business model is software and integration services, not collection on behalf of merchants. Customer payments should settle through each merchant's approved banking/payment relationship; WathiqPay should not initially pool funds, maintain merchant balances, or provide withdrawals. See [the competitor, legal, and positioning analysis](docs/market-legal-positioning.md).

The easiest practical path is one small server-side package, one runnable reference merchant that demonstrates the module for certification, offline and live tests, then the developer module certificate/reference issued by GIE Monétique. Merchant onboarding becomes a documented downstream workflow.

## 1. Open-source scope

Propose MIT for our original code and original examples, with the owner choosing the copyright holder before release. Do not assume this license grants redistribution rights to SATIM manuals, logos, or portal assets; link to official material and confirm permissions for any bundled assets. License selection is proposed here, not enacted by this plan.

Public deliverables:

- TypeScript SDK with JavaScript output and declarations.
- Original integration guide and documented known limitations.
- Synthetic request/response fixtures and a local gateway simulator.
- Reference merchant showing registration, hosted checkout, acknowledgement, and receipts.
- Contribution guide, changelog, security-reporting instructions, and reproducible CI checks.

Merchant credentials and account-specific evidence belong outside the public repository. The previously observed test cards are certification fixtures, not evidence that live card data is needed by the SDK; use local configuration for live testing. Public fixtures can use invented, non-card identifiers.

## 2. MVP boundary and responsibilities

| Component | Owns |
|---|---|
| Core SDK | Register, acknowledge, refund; wire encoding; money conversion; request validation; response parsing; typed errors; timeouts |
| Module developer/certificate holder | Module certification submission, tested release identity, CIBWeb validation of merchant licence requests, maintenance |
| Merchant application | Authentication, checkout totals, order persistence, CAPTCHA, terms acceptance, redirect routing, fulfillment, receipts, email |
| SATIM | Hosted card entry, payment authorization, terminal permissions, gateway outcomes and certification decisions |
| GIE Monétique | Application admissibility, module certificate/reference, merchant production authorization |
| Acquiring bank | Merchant contract and integration/production activation coordination |

Keep receipt/PDF/email dependencies out of the core package. Implement the certification UI requirements in the reference merchant, where they can be exercised end to end. Do not add framework adapters, recurring payments, stored-card features, cancellation endpoints, or webhooks until the underlying SATIM capabilities are documented and verified.

Refunds can be implemented against the documented contract in the alpha. Keep their live support explicitly experimental until permissions, required fields, and timeout recovery are verified. Never invent a cancellation API from the portal's manual cancellation checklist item.

## 3. Implementation decisions

- One repository and one npm package; no monorepo tooling initially.
- TypeScript with strict checking and `tsc` for compilation.
- Native `fetch`, `URLSearchParams`, and `AbortController` for transport.
- Inject a `fetch` implementation for deterministic tests; no global mocking required.
- Node's built-in `node:test` and `node:assert/strict` for tests against compiled output. The [official test runner documentation](https://nodejs.org/api/test.html) describes its test and mocking support.
- Start with ESM and TypeScript declarations. Add a tested CommonJS build only if required by target adopters; this simplifies the earlier dual-format proposal.
- Minimum Node.js 22 (`engines.node: ">=22"`); run CI on Node 22 and Node 24. Node 22 is the oldest line still under maintenance and ships stable `fetch`, `AbortSignal.timeout`, and `node:test`. Do not claim browser/edge runtime support without testing it.
- Prefer no runtime dependencies for the small initial contract, using focused boundary parsers. Add a schema library only if it materially simplifies maintenance.

Use `wathiqpay` as the local package name and `0.1.0-alpha.0` as the initial version. Registry availability and ownership have not been verified; confirm them before public publishing and choose an owned scope if necessary. Keep `private: true` during development. Leave the licence unpublished until the owner confirms MIT and the copyright holder; this does not block local builds or tarball tests.

Increment alpha prereleases for compatible fixes. Before 1.0, increment the minor version for incompatible API, validation, payment-classification, wire-behavior, or runtime-support changes and document migration instructions. Use the `alpha` npm dist-tag for prereleases. Never overwrite a release or imply that a new version inherits certification automatically.

The first public API exports `createClient`, `classifyPayment`, and typed request/response/error definitions. The example in the integration reference (section 9) is aligned to this API. Client methods are `registerOrder`, `acknowledgeTransaction`, and `refund`. Use the field mappings in the integration reference; keep raw gateway responses available to callers without automatically logging them. Registration returns the gateway order identifier and hosted form URL. Acknowledgement returns parsed transaction data; classification is a separate pure function, and fulfillment remains the merchant's responsibility.

Configuration includes credentials, terminal ID, explicit environment, optional injected fetch, and a configurable timeout (30 seconds by default, an SDK choice rather than a SATIM guarantee). Each operation accepts an optional abort signal. Validate before sending, perform one attempt, and never infer failure of a financial operation from a lost response. Transport errors after dispatch expose `outcome: "indeterminate"`; validation errors are known not to have been sent. Reject HTTP redirects for credential-bearing API calls. Require HTTPS for remote gateway URLs; permit HTTP only on loopback for the explicitly selected simulator environment.

Use DZD only in the first implementation. Accept unsigned decimal strings with at most two fractional digits, convert using integer arithmetic, and reject numeric money inputs. Unsupported currencies fail validation. Keep undocumented refund fields and refund idempotency mechanisms outside the initial contract until confirmed.

Suggested layout:

```text
src/
  client.ts
  transport.ts
  money.ts
  errors.ts
  requests.ts
  responses.ts
  payment-status.ts
test/
  unit/
  contract/
  fixtures/synthetic/
  live/
examples/reference-merchant/
docs/
```

## 4. Resolve the contract before hardening it

For each field or behavior, record its source and confidence: portal-documented, live-observed, SATIM-confirmed, or SDK design decision. Existing documentation combines some recommendations with portal facts; revise those labels during this phase.

Examples that need explicit separation:

- POST is recommended by the portal; form URL encoding is a proposed transport choice until live-verified.
- Registration's `orderNumber` limit is ten characters; acknowledgement describes a longer returned value. Validate outgoing values conservatively and accept legitimate longer responses.
- Acknowledgement success examples use mixed string and numeric codes. Normalize only known representations; do not coerce missing or empty values to zero.
- `OrderStatus` may be absent on an unknown-order error. Parse error responses independently of successful response schemas.
- Refund response fields are marked optional. An empty or malformed response must not imply successful refund.
- The portal has conflicting refund minimum descriptions and mentions an undocumented `externalRefundId`. Do not silently implement either as a verified rule.
- Portal language tables use uppercase while examples include lowercase. Send uppercase (`AR`, `FR`, `EN`), accept either case from callers, and label this a design decision until live-verified.
- The production hostname is undocumented. Selecting `environment: "production"` must require an explicit `baseUrl`; the client throws instead of falling back to the certification host.
- Date/time and payment method are required on receipts but their authoritative response fields are not established. Confirm the source instead of fabricating a gateway timestamp or inferring the card network from masked digits.

Use [open-questions.md](docs/open-questions.md) as the backlog. Prioritize POST/body encoding, acknowledgement timing/repeatability, production URL, refund semantics, and receipt data over optional features.

## 5. Build in milestones

### Milestone A — Freeze the first contract

- [x] Start the parallel external-dependency track below; record each unresolved item with its next action. External replies and working credentials are not exit requirements for A–C.
- [ ] Annotate the integration reference with fact versus proposal labels and source links.
- [x] Define request inputs, success/error response variants, and unknown-result handling.
- [x] Define exact amount representation: decimal strings externally, integer minor-unit strings on the wire; use exact integer arithmetic internally.
- [x] Turn section 3's public API into TypeScript signatures and synthetic contract examples. Node/module formats, local package name, and versioning policy are fixed there.
- [x] Scaffold the private package, strict TypeScript configuration, test runner, and CI on Node 22 and 24.

Exit: registration, acknowledgement, and refund each have example inputs, expected wire output, response variants, and identified uncertainties; the private package can build and run its first offline check. Unresolved external dependencies are recorded, not treated as completed.

### Parallel track — Start during A, resolve before the affected gate

- [ ] Inspect testing-slot expiry and account status when the portal is accessible; record unknown values explicitly. Prepare an extension request if needed. Working account/terminal API access is a gate for E, not offline implementation.
- [ ] Send-ready draft 2 in [outbound-requests.md](docs/outbound-requests.md) covers SDK eligibility, required reference UI, certificate/version boundary, and open-source merchant licence authentication. Seek scope confirmation during A–C; incorporate the answer before finalizing D's certification application and before E's formal qualification run.
- [ ] Send-ready draft 1 in [outbound-requests.md](docs/outbound-requests.md) covers POST encoding, acknowledgement semantics, production URL, refund rules, and receipt timestamp source. Only the owner sends external messages; this plan does not authorize sending them. Record replies and evidence as they arrive.
- [ ] Complete review of the [CIBWeb homologation procedure PDF](https://cibweb.dz/procedure-homologation.pdf) before finalizing D's certification requirements. Access varies: part of it was retrieved earlier through browsing, a later attempt timed out, and a plain HTTP download on 17 September 2026 returned HTTP 500 with a “Web Page Blocked” page. Retry through a browser session (an agent task) and fall back to the owner if that keeps failing; its review remains pending. Continue A–C using the documented portal contract.

If certification scope remains unanswered, continue the generic simulator demonstration but do not label it an accepted certification submission. Do not invent an answer to an unresolved question to satisfy a milestone.

### Milestone B — Implement an offline vertical slice

- [x] Implement client configuration, credentials, terminal ID, and explicit environment selection: `certification`, `production` (requires `baseUrl`), and `simulator` (loopback HTTP only).
- [x] Implement decimal conversion, validation, form encoding, and `jsonParams` serialization.
- [x] Implement registration and acknowledgement before refund support.
- [x] Implement the documented refund request/response contract with experimental status and synthetic fixtures; an absent success signal or lost response never implies a successful refund.
- [x] Classify payment outcomes while preserving gateway fields for callers.
- [x] Implement errors for invalid input, transport failure, gateway rejection, and malformed responses.
- [x] Implement timeout and caller cancellation handling.
- [x] Disable automatic retries of financial operations by default.
- [x] Return an indeterminate outcome after an ambiguous timeout: the operation might have reached SATIM.

Exit: one synthetic order can be registered and acknowledged through the SDK using an injected transport, with tests proving correct wire requests and result classification.

### Milestone C — Validate real HTTP behavior and npm packaging

- [x] Add a local HTTP simulator with synthetic scenarios; use it to exercise the real fetch transport.
- [x] Test body encoding, reserved URL/JSON characters, HTTP errors, invalid JSON, truncated bodies, delays, and cancellation.
- [x] Test a timeout after the simulator records an operation to prove it does not trigger a duplicate request.
- [x] Build the package, run `npm pack`, install the tarball into a temporary consumer, and test public imports and TypeScript declarations.
- [x] Inspect packaged files; include only intended output, README, explicitly selected documentation, and the license file once the owner has confirmed it.
- [x] Run offline verification on pull requests with no SATIM credentials or external payment traffic.

Exit: the actual installable tarball works in a clean consumer and all offline checks pass.

### Milestone D — Build the reference merchant

- [x] Add minimal checkout, order persistence, and separate success/failure return routes.
- [x] Generate collision-resistant merchant order references within the documented limit and enforce uniqueness in storage.
- [x] Store SATIM `orderId` before redirecting to its returned `formUrl`.
- [x] Correlate returned identifiers with persisted orders; never trust query-string payment claims.
- [x] Acknowledge and compare verified amount, currency when available, and merchant order number before fulfillment.
- [x] Handle repeated returns with a transaction/unique constraint so fulfillment happens once.
- [x] Implement required checkout notices, CAPTCHA, branding, language consistency, and result messages.
- [x] Implement printable/PDF/email receipts outside the SDK, using confirmed transaction data.
- [x] Add merchant-browser tests against the simulator, including success, decline, reversal, unknown outcome, repeated return, and closed-browser scenarios.

Exit: a contributor can run the complete synthetic journey locally (`npm run demo`, `npm run test:merchant`; done 17 September 2026). Qualification readiness additionally requires the accepted submission scope, reviewed homologation requirements, and required receipt/UI data; if these are pending, only the local demonstration is complete.

### Milestone E — Test against SATIM certification

- [x] Confirm the merchant account is enabled, the testing slot is usable, and credentials/terminal permissions work. These are mandatory entry conditions for E, tracked since A. Confirmed 22 September 2026. The observed portal showed an active slot but a disabled merchant-user label; neither alone proves working API access.
  - 2026-09-17: live registration returned `errorCode 5 Access denied` over GET and POST on both certification hosts. Account-side blocker; SDK transport confirmed compatible at the HTTP level. Details in [live-evidence.md](docs/live-evidence.md).
- [ ] Verify that the reference merchant matches the submission scope agreed during the parallel track before running formal qualification scenarios.
- [ ] Use explicit opt-in commands and local secrets for live tests, separate from ordinary CI.
- [x] Run the reference merchant against certification and verify POST form encoding and actual response shapes. Registration and pre-payment acknowledgement verified 22 September 2026; see [live-evidence.md](docs/live-evidence.md).
- [x] Complete hosted payment entry manually with SATIM test data; exercise CAPTCHA/3-D Secure through the approved flow. Done 22 September 2026 with a browser driver; the hosted flow has a static 3-D Secure password step.
- [x] Run each applicable scenario in [certification-checklist.md](docs/certification-checklist.md). 11 of 15 card scenarios pass; 4 need SATIM clarification (see live evidence).
- [ ] Verify acknowledgement behavior and abandoned-browser recovery with SATIM's documented guidance; do not assume acknowledgement is a harmless polling endpoint.
- [x] Verify refunds separately using refundable certification orders and approved amounts. Partial, full, and over-refund verified 22 September 2026.
- [x] Record SDK commit/version, scenario, observed response shape, expected result, actual result, and evidence reference. See [live-evidence.md](docs/live-evidence.md).
- [x] Convert useful findings into sanitized regression fixtures after removing account/customer data. First three live fixtures added (register success, unpaid acknowledgement, unknown-order 401).

Exit: live results support each advertised capability; unresolved scenarios remain explicitly unsupported or experimental.

### Milestone F — Certify and release

- [ ] Continue the existing accepted CIBWeb developer application; verify the final submitted artifact matches the scope agreed earlier. Do not create a duplicate application.
- [ ] Complete the module qualification tests; retain the PV and track its transmission to GIE Monétique.
- [ ] Obtain the module certificate from GIE Monétique and verify its directory referencing.
- [ ] Record the certified module/release identity and clarify changes that require recertification.
- [ ] Define the developer process for validating merchant licence-authentication requests, including free/open-source distributions as agreed with GIE Monétique.
- [ ] Document merchant Type 1 authorization and the subsequent acquiring-bank production process.
- [ ] State precisely what was tested: SDK version, merchant integration, environment, and date. Do not imply universal SATIM endorsement.
- [ ] Publish an alpha only when the offline package works; label live-validation gaps clearly. Keep the README scope in step with this plan: refunds stay experimental until live-verified.
- [ ] Release a stable version when supported payment/refund paths have live evidence, critical contract questions are resolved, and production configuration is confirmed.
- [ ] Add license, contributor guidance, security-reporting instructions, changelog, and a maintenance policy.
- [ ] Configure npm trusted publishing where supported. npm's [trusted publishing](https://docs.npmjs.com/trusted-publishers/) and [provenance documentation](https://docs.npmjs.com/generating-provenance-statements/) describe OIDC publishing and source/build attestations.

Exit: users can install a versioned package, follow a working example, understand validation limits, and report problems with a reproducible case. Publishing is a later action; this plan does not publish anything.

## 6. Validation matrix

| Layer | Proves | Does not prove |
|---|---|---|
| Pure unit tests | Exact amounts, validation, code normalization, classification, redaction | SATIM accepts the requests |
| Local HTTP contract tests | Actual request encoding, response parsing, failure/timeout behavior | Simulator accurately reproduces undocumented gateway behavior |
| Tarball consumer tests | Published exports, declarations, included files, supported Node versions | Merchant checkout complies with SATIM |
| Reference merchant tests | Persistence, return handling, receipt flow, fulfillment exactly once | Hosted authorization or bank behavior |
| Live certification scenarios | Observed compatibility with SATIM credentials/terminal/environment | Every merchant configuration or production permission |
| Module qualification and GIE certificate | Certification/referencing of the submitted payment module within the issued scope | Automatic coverage of forks/new versions or authorization of every merchant |
| Merchant authorization and bank activation | A particular merchant is authorized and integrated for production | Transfer of that approval to other merchants |

Essential regression cases: `50.00` and `806.50` DZD; invalid precision and overflow; duplicate order number; codes `0` versus `"0"` versus missing; success requires all documented success signals; status `1` is not automatically treated as settled; reversed/refunded orders do not trigger fulfillment; missing status on error; unknown fields retained; timeout after server receipt causes no automatic retry; concurrent callbacks fulfill once; errors contain no credentials.

## 7. Developer workflow

Scripts defined in `package.json`:

```text
npm run check         # type checks, unit + contract tests, build      (implemented)
npm run test:unit     # pure unit tests                                  (implemented)
npm run test:contract # local HTTP simulator tests                       (implemented)
npm run test:package  # pack + clean consumer checks                     (implemented)
npm run test:live     # opt-in certification smoke test; reads .env      (implemented)
npm run demo          # reference merchant with simulator by default     (implemented)
npm run test:merchant # HTTP journey tests of the reference merchant     (implemented)
```

Default all development and pull-request checks to synthetic/offline data. Use a short loop: failing contract example → implement → offline checks → inspect tarball. Batch live scenarios when an active testing slot is available, and turn confirmed findings into regression tests.

## 8. Practical starting point

The authenticated CIBWeb account confirms that the developer application has already been accepted and integration tests are in progress. Continue that existing process; a new application is not the starting point. The module-licence activation area is present and has no merchant requests yet. Final certificate issuance was not observed.

Begin by scaffolding the private package and implementing one synthetic registration request and acknowledgement response with tests. Complete A–C while tracking external questions in parallel. Build the reference merchant next, incorporate confirmed qualification requirements, and enter E only when scope and live access are ready. Target a referenced WathiqPay module, followed by a repeatable merchant Type 1 onboarding process. Unit tests alone cannot demonstrate the hosted checkout and UI requirements.

## 9. Decisions and risks

Decisions fixed (SDK design decisions, not SATIM facts; details in section 3):

- Node.js 22 minimum; CI on 22 and 24; ESM plus declarations only.
- Local package name `wathiqpay`, `private: true`, initial version `0.1.0-alpha.0`, `alpha` dist-tag; registry name unverified.
- Public API: `createClient`, `classifyPayment`; methods `registerOrder`, `acknowledgeTransaction`, `refund`.
- Environments `certification`, `production` (explicit `baseUrl` required, no silent fallback), `simulator` (loopback HTTP only); remote URLs must be HTTPS; HTTP redirects rejected.
- Default timeout 30 s; per-call abort signal; one attempt only.
- Language sent uppercase; caller input case-insensitive.
- Amounts: DZD only; unsigned decimal strings with at most two fractional digits in, integer minor-unit strings on the wire, exact integer arithmetic; numeric inputs rejected.
- No automatic retries of financial operations; lost responses after dispatch return `outcome: "indeterminate"`.
- Refunds implemented and live-verified (partial, full, over-refund rejection) on 22 September 2026; no cancellation API; no `externalRefundId` until confirmed.
- Payment classification returns `unknown` for any combination SATIM has not documented. Status 4 with a non-zero `depositAmount` is `partially_refunded` (live-observed).

Known risks and how the plan handles them:

| Risk | Handling |
|---|---|
| Testing slot expires before Milestone E | Track expiry/extension in parallel from A; block E only, not A–C |
| SATIM does not answer priority questions | Continue offline work with labelled assumptions; block only affected live capabilities and production release until critical questions are resolved |
| Headless npm SDK is not accepted as the certified module | Seek confirmation during A–C; adjust D to the accepted scope before formal qualification in E |
| README and plan drift on scope | README aligned now; Milestone F checks alignment before release |
| Homologation PDF adds unreviewed requirements | Access is intermittent; retry via browser, owner as fallback. Review required before D's qualification-ready exit, not before offline SDK work |

## Sources and supporting documents

- [CIBWeb module and merchant process](docs/cibweb-process.md), with primary-source links.
- [CIBWeb homologation procedure PDF](https://cibweb.dz/procedure-homologation.pdf), partially seen via browser, full review pending; plain download returned HTTP 500 on 17 September 2026.
- [Outbound request drafts](docs/outbound-requests.md), unsent.
- [Live evidence log](docs/live-evidence.md).
- [SATIM API and test-card portal](https://certweb.satim.dz/Cert/url), inspected 16 September 2026.
- [SATIM validation requirements](https://certweb.satim.dz/Cert/validate), inspected 16 September 2026.
- [SATIM certification process](https://certweb.satim.dz/Cert/index), inspected 16 September 2026.
- [Integration reference](docs/satim-integration.md).
- [Certification checklist](docs/certification-checklist.md).
- [Questions for SATIM](docs/open-questions.md).
- [Market, competitor, and legal positioning](docs/market-legal-positioning.md).
