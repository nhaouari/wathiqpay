# CIBWeb: WathiqPay developer and merchant process

Public pages inspected through the browser on 16 September 2026. The requested HTTP homepage redirects to HTTPS at https://cibweb.dz/fr/.

## What we are building

WathiqPay is intended to be a reusable payment module distributed as an npm package, submitted by its developer for certification and referencing. Other merchants can integrate that module and use the authorization process for an already referenced module.

This is a material correction to the original plan: module certification is explicitly documented by CIBWeb. What remains unconfirmed is the exact certification scope for a headless npm SDK, accompanying reference application, release versions, and forks.

The open-source software licence and the certificate/licence authentication mentioned by CIBWeb are different concepts. The portal describes licences sold or transferred to merchants and requires the certificate holder to validate those requests. It does not explain how free npm installations map to this process. Do not assume an npm download automatically gives a merchant certified-module status, or that payment for a software licence is necessarily required.

## Developer path: certify WathiqPay

The official module-certification page lists eight steps:

1. Create a CIBWeb profile and submit the “Certifier mon module” application/form.
2. GIE Monétique processes the application and determines admissibility.
3. After favorable notification, obtain the APIs and open a testing slot.
4. Book certification of the proposed module on the internet payment platform.
5. The qualifier executes certification tests and prepares the certification PV.
6. The PV is sent to GIE Monétique.
7. GIE Monétique establishes the certificate.
8. The certificate is sent to the developer and the certified module is referenced, including on CIBWeb.

Afterwards, the certificate holder must validate requests sent by GIE Monétique through the developer's CIBWeb session to authenticate certificate licences sold or transferred to merchants.

Source: [Certification of a payment module or solution](https://cibweb.dz/fr/page/processus-de-certification-dun-module-de-paiement-ou-solution-de-paiement-p19).

## Merchant path: adopt the referenced module (Type 1)

1. The merchant creates its profile and submits an integration application.
2. GIE Monétique reviews admissibility.
3. The referenced developer validates the licence sale online.
4. GIE Monétique notifies the merchant of production-entry authorization.

The page says an existing domiciliary member bank receives notifications at steps 2 and 4. A merchant without bank domiciliation may be listed for potential bank outreach.

This published authorization path does not repeat the eight-step module-certification procedure. It still leads into a separate bank integration and production process, including tests.

Source: [Authorization with a GIE-referenced payment module](https://cibweb.dz/fr/page/processus-dautorisation-avec-un-module-de-paiement-reference-gie-monetique-p21).

## Alternative merchant path: unreferenced module (Type 2)

A merchant using an unreferenced module follows an eight-step procedure: application, admissibility, APIs/testing slot, certification appointment, qualification/PV, PV sent to GIE Monétique, authorization established, authorization delivered.

This page ends in merchant authorization; the developer path ends in a reusable module certificate and referencing. That distinction is why the developer path is the relevant target for WathiqPay.

Source: [Authorization with an unreferenced module](https://cibweb.dz/fr/page/processus-dautorisation-avec-un-module-de-paiement-non-reference-gie-monetique-p22).

## Production activation through the merchant's bank

After GIE Monétique notifies the acquiring bank of the merchant's authorization:

1. The merchant requests entry into operation through its domiciliary bank.
2. The bank and merchant sign their contract.
3. The acquiring bank sends integration and production files to the payment-platform operator.
4. The CMI tests and puts the merchant website into production.
5. The merchant receives notification of entry into operation.

Source: [Entry into operation](https://cibweb.dz/fr/page/processus-dintegration-et-dentree-en-exploitation-dun-web-marchand-certifie-p20).

## Implications for development

- Keep the npm core small, but prepare a runnable reference integration covering the SATIM UI/receipt checklist as the demonstrable payment solution.
- Ask the qualifier to define the certificate boundary: core package, integration template, UI components, supported configuration, version, and module name.
- Maintain a release-to-certificate record and merchant integration instructions.
- Document the developer's operational responsibility to validate merchant licence requests; this is not an API call in the payment SDK.
- Support a merchant's own credentials and terminal ID; the developer certificate is not shared payment credentials.
- Decide with GIE Monétique how free distribution, forks, modifications, and upgrades affect certificate authentication and referencing.

## What is verified versus still inaccessible

Verified: the public developer, Type 1, Type 2, and bank activation procedures above.

The “Certifier mon module” entry initially redirected to a login page. After the user signed in, the existing developer account was inspected read-only. No application or licence activation was submitted.

The authenticated account confirmed:

- An existing module-certification application, with a notification that the application was validated.
- A dashboard explicitly showing integration tests in progress.
- A dedicated payment-module licence activation section describing merchant websites that want to integrate the developer's module; it currently has no results.

Application acceptance is not proof that the final module certificate has been issued. No final certificate was visible in the inspected pages. Account identifiers, personal details, and notification timestamps are intentionally omitted from these public-facing project docs.

The next project phase is to implement and demonstrate the module within the existing testing process, rather than create a new developer application. Original application-form requirements and submitted module details were not exposed on the inspected dashboard.

The FAQ lists developer eligibility and certificate-validity questions, but its answer did not expand in the browser. Eligibility documents, certificate duration, renewal rules, and version-change rules are therefore not established by this inspection.

## Homologation procedure PDF (GIE/PHWM/21/3.0), reviewed 22 September 2026

The [procedure PDF](https://cibweb.dz/procedure-homologation.pdf) (9 pages, version 3.0 of 13 January 2021) confirms the portal pages and adds these points:

- **Developer eligibility** (section VI.b): be registered in the commercial register or hold an equivalent document. Nothing else is listed.
- **Merchant eligibility** (section VI.a): commercial or craft register *and* registration in the national "E-fournisseurs" file at the CNRC (e-commerce code). Every merchant adopting WathiqPay needs both.
- **Certification runs in five phases** (section VII): application form on CIBWeb; admissibility decision online; remote online tests of the module on the CMI test platform; test report (PV) by the qualifier and certificate issued by GIE Monétique; referencing on CIBWeb. This matches the eight-step web page.
- **Certificate validity** (section VII "Décision"): the developer receives an *attestation de certification* valid "for a fixed, renewable period". The duration itself is not stated; ask when the certificate is issued.
- **Licence validation duty** (note after section VII): the certificate holder must validate, in their CIBWeb session, each request from GIE Monétique to authenticate a certificate licence sold or transferred to a merchant. This is the process draft 2 in [outbound-requests.md](outbound-requests.md) asks about for free distributions.
- **Publication** (section VIII): GIE Monétique publishes granted authorizations, issued certificates, and the contact details of authorized merchants and certified developers on CIBWeb.
- **Audit** (section IX): GIE Monétique may audit a certified module or an authorized merchant site at any time. Keep the certified release reproducible and the evidence log current.
- No technical UI or receipt requirements appear in the PDF; those remain on the SATIM portal pages.

The PDF was served with HTTP 500 to plain HTTP clients but downloads normally through a browser session. It is not redistributed in this repository.

The SATIM account previously displayed a testing slot. Together with the authenticated CIBWeb dashboard, this supports that the developer is in the integration-testing phase. The exact linkage of SATIM credentials/terminal to the proposed WathiqPay name and version still needs verification; the visible pages do not establish issuance of the final certificate.
