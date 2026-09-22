# WathiqPay market, competitor, and legal positioning

Date: 16 September 2026. Status: public-source research and product strategy; not a legal opinion.

## Executive conclusion

SlickPay, Chargily Pay, and SofizPay are not merely alternative npm modules. Their public offers combine payment software with different commercial and financial-service arrangements:

- SlickPay publishes both a direct-merchant integration model and a collection-on-behalf model.
- Chargily publishes a hosted-checkout, collection, held-balance, and payout model.
- SofizPay publishes a broader wallet model with deposits, balances, internal transfers, merchant payments, and withdrawals.

The key distinction is not whether the integration runs through a provider's server. It is who contracts with the merchant, who is authorized to acquire or collect the payment, where the funds settle, whether the provider maintains a merchant/customer balance, and who bears refund, dispute, fraud, and payout obligations.

WathiqPay's recommended first position is a proprietary software product for merchants that hold their own approved banking/payment relationship. It should not initially pool money, maintain withdrawable balances, or promise merchant payouts. This direct-merchant model is distinct from managed collection offerings.

## 1. Three operating models

### Model A — Direct merchant integration software

```text
Software/API flow:
Merchant backend -> WathiqPay module -> approved payment interface

Funds/settlement flow:
Customer -> payment network/acquirer -> merchant's approved account

WathiqPay revenue:
Software licence/support/hosting/onboarding invoice paid separately
```

The merchant obtains its own authorization, bank agreement, production credentials, and terminal configuration. The module helps the merchant implement the required protocol and operational workflow. WathiqPay does not receive the sale proceeds.

This is the recommended initial WathiqPay model.

### Model B — Collection on behalf of merchants

```text
Customer -> provider's collection arrangement -> merchant balance/ledger
         -> holding or reconciliation period -> payout to merchant
```

The provider combines checkout software with merchant onboarding, transaction collection, reconciliation, balances, and payouts. Its percentage fee pays for more than API access: acquiring/partner costs, settlement operations, support, fraud and dispute handling, and financial risk.

A merchant collection contract describes the provider/merchant relationship, but it is not by itself proof of every regulatory, acquiring-bank, safeguarding, or payment-network authorization required for that activity.

### Model C — Wallet ecosystem

```text
Deposit or payment -> wallet balance -> internal transfer/payment/services
                                    -> withdrawal to bank/postal channel
```

The platform maintains user-visible balances and encourages funds to remain usable within its ecosystem. Revenue may come from withdrawals, merchant services, third-party services, or other transactions. This has materially greater regulatory and operational scope than selling an SDK.

## 2. SlickPay

### Published model

SlickPay's terms distinguish two types of merchant:

1. An external merchant obtains its own CIBWeb authorization and bank agreement. The terms reference certified module `NC/03/000775/2022`; after authorization and contracting, the merchant receives access to SlickPay's API.
2. An internal merchant is linked to the gateway through a *contrat d'encaissement pour compte*—a collection-on-behalf contract.

For the internal model, the published terms require a commercial register and commercial bank account, prohibit a personal account, describe transaction charges, and say funds are transferred according to the merchant's chosen frequency.

### Technical and commercial interpretation

SlickPay appears to serve both:

- Merchants prepared to obtain their own CIBWeb/banking relationship, with SlickPay supplying the integration layer.
- Merchants seeking a managed collection and transfer service.

The second model is not equivalent to distributing a certified package. The service value includes onboarding, collection administration, transaction tracking, and transfers.

### Evidence limit

The public terms do not disclose the complete acquiring arrangement, collection-account ownership, safeguarding structure, or every authorization relied upon. The terms also contain drafting ambiguities. They establish what SlickPay markets contractually, not the complete legal analysis of its operation.

Source: [SlickPay terms](https://slick-pay.com/terms) and [SlickPay developer documentation](https://developers.slick-pay.com/).

## 3. Chargily Pay

### Published model

Chargily offers a hosted checkout. A merchant sends a server-side API request, receives a checkout URL, and redirects the customer to Chargily's hosted payment flow.

Its merchant terms describe Chargily as collecting payments for the merchant. They also describe a held balance, payouts/withdrawals, suspension of withdrawals during a dispute investigation, and the merchant's obligation to provide evidence of the underlying sale.

This makes the published product a managed payment-collection service with a developer-friendly API—not simply an SDK.

### Published pricing observed on 16 September 2026

| Plan | Transaction charge | Published holding period |
|---|---:|---:|
| Starter | Limited one-time allowance | Subject to offer conditions |
| Comfort | 1.5%, minimum 15 DA, maximum 1,500 DA | 72 hours |
| Supreme | 3%, minimum 30 DA, maximum 3,000 DA | 48 hours |
| Elite | 4.5%, minimum 45 DA, maximum 4,500 DA | 24 hours |

The pricing page also publishes included payout counts, a charge for additional withdrawals, and a refund fee. These conditions can change and must be checked at purchase time.

The general merchant terms mention a 48-hour holding period, while the pricing page distinguishes 24-, 48-, and 72-hour plans. The applicable signed/current conditions should control; this discrepancy should be verified rather than inferred.

### Economic interpretation

Chargily's percentage is payment-service revenue, not pure software revenue. Its plans monetize convenience, collection, risk operations, support, and faster availability of merchant funds. Gross payment volume is not revenue: network, partner, refund, fraud, support, and payout costs must be deducted before judging profitability.

Sources: [Chargily merchant terms](https://chargily.com/dz/business/pay/term), [current pricing](https://chargily.com/dz/business/pay/pricing), and [checkout documentation](https://dev.chargily.com/pay-v2/the-quick-guide/create-a-checkout).

## 4. SofizPay

### Published model

SofizPay's terms and product pages describe a DZD wallet with:

- Card, postal, bank, or partner deposits.
- Personal and business balances.
- Transfers between users.
- Merchant payments and payment links.
- Withdrawals to supported channels.
- Additional services such as bill payment and mobile recharge.

Merchant proceeds can be credited to a wallet and reused inside the ecosystem or withdrawn. This is therefore broader than a checkout gateway.

### Published pricing observed on 16 September 2026

The published fee documentation states 0% for internal transfers and a withdrawal charge of 1% with a 200 DA minimum, with a 1,000 DA minimum withdrawal. These figures should not be assumed to represent the complete cost of every card-payment or merchant service.

### Economic interpretation

Free internal transfers encourage users to keep and reuse value inside the network. Withdrawal and service charges are visible potential revenue sources. The complete revenue model and cost structure are not public.

### Evidence limit

SofizPay publicly presents SATIM integration/validation, GIE Monétique approval, commercial registration, and a startup label. Each document proves only its stated scope. A certified payment module, company registration, or startup label should not be treated as interchangeable with a Banque d'Algérie PSP approval.

Sources: [SofizPay terms](https://sofizpay.com/en/terms-and-conditions/), [wallet description](https://www.sofizpay.com/en/wallet/), [fee documentation](https://docs.sofizpay.com/en/docs/fees/), [API documentation](https://docs.sofizpay.com/), and [transparency page](https://sofizpay.com/fr/transparency).

## 5. Certification and legal roles must remain separate

| Item | What it demonstrates | What it does not automatically demonstrate |
|---|---|---|
| Commercial registration | A legal business and its registered activities | Authorization for every payment service |
| SATIM/GIE module certification | Technical qualification/referencing of a particular submitted module and scope | PSP approval, merchant approval, or coverage of every future release |
| Merchant authorization and acquiring-bank agreement | A specified merchant's approved payment acceptance and settlement arrangement | Permission transferable to every merchant using the software |
| Banque d'Algérie PSP approval | Authorization for the services specified in the approval | Unlimited authority outside that published scope |
| PSP agent mandate | Authority to act for the mandating PSP within the contract and approved services | An independent PSP licence or authority beyond the mandate |

The CIBWeb directory references SlickPay, Chargily, and SofizPay as certified modules. This is important evidence of technical module certification, but it is not sufficient by itself to determine the legal structure under which money is collected, held, or paid out.

## 6. Banque d'Algérie PSP framework

Regulation 25-02 of 14 April 2025, published in Official Journal No. 28 on 7 May 2025, defines a payment service provider as a company approved by the Governor of Banque d'Algérie to provide one or more listed payment services.

The listed services include cash deposits/withdrawals and payment-account management, transfers and direct debits, card payments, issuance of payment instruments, acquisition of payment transactions, and money transmission.

Material requirements include:

- The PSP's registered office, payment platform, and redundancies must be hosted in Algeria.
- Minimum capital is 160,000,000 DA, fully paid after authorization to constitute and before the approval application.
- Approval is granted by the Governor, identifies the permitted service scope, and is published in the Official Journal.
- A PSP can contractually mandate payment-service agents for authorized services, but remains fully responsible to Banque d'Algérie, must inform it of mandates, and must publish its agent list.
- User funds must be separately identified and deposited into a special safeguarded bank account (*compte de cantonnement*).
- The PSP must maintain security, traceability, continuity, complaint handling, published tariffs, and a guarantee or professional-liability insurance.

Source: [Official Journal No. 28, Regulation 25-02](https://www.joradp.dz/FTP/jo-francais/2025/F2025028.pdf), especially articles 2–8 and 14–26. Banque d'Algérie also lists [PSP authorization and operating instructions](https://www.bank-of-algeria.dz/agrement-instruction/).

### Verification finding

The public sources inspected did not establish a published Banque d'Algérie PSP approval decision for SlickPay, Chargily, or SofizPay. This is not a finding that they operate unlawfully. They may rely on bank/acquirer agreements, partner arrangements, agent mandates, transitional structures, or non-public documents. A reliable conclusion requires the exact contract and authorization chain.

Do not describe any platform as licensed, unlicensed, legal, or illegal based only on its marketing pages or module certificate.

## 7. Recommended WathiqPay position

### Phase 1 — Proprietary integration software, certification pending

Build and certify a reproducible release of the SDK plus a reference merchant. Each merchant obtains its own CIBWeb authorization, bank/acquirer agreement, credentials, terminal configuration, and production activation. WathiqPay earns revenue independently from the customer's sales proceeds.

The product promise should be:

> Production-ready, transparent payment integration for Algerian merchants, while the merchant retains its own banking relationship and settlement account.

Possible revenue:

- Paid onboarding and integration.
- Fixed-price certification/production-readiness assistance.
- Annual maintenance and priority support.
- Hosted monitoring, reconciliation, receipts, and operational alerts.
- Framework-specific adapters and enterprise support agreements.

WathiqPay is proprietary. Software licensing, installation, operations, and support are possible commercial services; pricing and contractual terms remain to be defined. Certification claims must identify the exact tested release; modified versions must not claim to be the certified artifact unless the relevant authority confirms that scope.

### Phase 2 — Hosted software without merchant balances

A hosted control plane could add logs, reconciliation, status monitoring, webhook delivery, receipts, and support while keeping settlement in the merchant's approved account.

This still requires contractual and regulatory review. Merely avoiding custody does not automatically settle questions concerning outsourcing, credentials, data hosting, security responsibility, or the provider's operational role.

### Phase 3 — Collection or wallet services only through a verified route

Do not add pooled collection, merchant balances, withdrawal functions, or payment accounts as an informal extension of the SDK. Pursue them only through one of these routes:

- WathiqPay obtains the required PSP authorization and operating capability.
- A duly authorized PSP mandates WathiqPay as an agent within an explicit permitted scope.
- A bank/acquirer or other authorized partner supplies a written structure that clearly allocates collection, safeguarding, settlement, compliance, and liability.

This phase is a different company-risk profile, not merely another npm feature.

## 8. Competitive differentiation

WathiqPay should not try to beat a collection platform solely on transaction percentage. Its credible advantages are:

- TypeScript-first, strongly typed integration.
- Proprietary module with controlled releases and documented test evidence.
- Reproducible builds and cryptographic package provenance.
- A clearly identified certified release and controlled compatibility policy.
- Exact money handling and conservative financial retry behavior.
- Excellent local simulator, fixtures, and reference application.
- Merchant-controlled credentials, banking relationship, data, and settlement.
- Clear separation between payment status, business fulfillment, refunds, and accounting.
- High-quality French, Arabic, and English documentation.
- Assisted CIBWeb/bank onboarding and evidence-based certification support.

The disadvantage is greater paperwork for each merchant. That is also the opportunity: sell a repeatable onboarding and implementation service without pretending the module can eliminate required authorizations.

## 9. Due-diligence checklist before adopting a collection model

Obtain documentary answers to all of the following:

- [ ] Exact contracting legal entity and commercial-register activities.
- [ ] Identity of the acquiring bank, PSP, or payment partner.
- [ ] Banque d'Algérie approval decision and exact authorized-service scope, if the entity acts as a PSP.
- [ ] Agent mandate and evidence of regulator notification/listing, if acting for a PSP.
- [ ] Owner of the merchant/terminal identifiers and production credentials.
- [ ] Complete transaction and settlement flow for every payment method.
- [ ] Legal owner of funds at each stage.
- [ ] Bank and title of every collection or safeguarded account.
- [ ] Reconciliation frequency and proof that protected balances equal user liabilities.
- [ ] Merchant payout timetable, reserves, holds, and suspension rights.
- [ ] Refund, chargeback, dispute, fraud, and insolvency allocation.
- [ ] KYC/KYB, AML/CFT, sanctions, transaction-monitoring, and reporting duties.
- [ ] Hosting locations, subprocessors, security audit, incident response, and business continuity.
- [ ] Personal-data role and compliance with Algerian data-protection obligations.
- [ ] Scope and version of SATIM/GIE module certification.
- [ ] Process and cost for changes, recertification, merchant activation, and termination.
- [ ] Tariffs, taxes, invoicing, minimums, caps, and all third-party deductions.

## 10. Claims WathiqPay must avoid

Until supported by exact documents, do not claim:

- That module certification makes WathiqPay a PSP or acquirer.
- That one module certificate authorizes every merchant.
- That modified/forked releases inherit certification automatically.
- That merchant funds are protected when no verified safeguarding structure exists.
- That WathiqPay can collect or settle for merchants under its own account.
- That a collection contract alone supplies the necessary regulatory authority.
- That a competitor is licensed, unlicensed, compliant, or unlawful solely from public marketing material.

## 11. Decision

Pursue certification of the proprietary SDK and the direct-merchant model. Define commercial terms around software licensing, integration, onboarding, support, maintenance, and optional non-custodial hosted operations. Treat collection and wallet functionality as a later regulated business line requiring a separately documented authorization and partner strategy.
