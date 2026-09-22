# Questions for SATIM

The accessible certification portal leaves the following points undocumented or internally inconsistent. These questions should be answered in writing before WathiqPay is considered production-ready.

## Endpoints and connectivity

1. What is the official production REST base URL?
2. Is `POST` with `application/x-www-form-urlencoded` formally supported for all three endpoints? *Live-observed 22 September 2026: registration, acknowledgement, and refunds succeeded in certification; formal production confirmation still wanted.*
3. Are merchant-server IP allowlisting, mTLS, or client certificates required?
4. Which TLS versions and cipher requirements apply?
5. What are the official connection and response timeouts?
6. What rate limits apply in certification and production?
7. Does SATIM publish source/callback IP ranges?

## Transaction lifecycle

8. Is `acknowledgeTransaction.do` safe and idempotent when called repeatedly? *Live-observed: repeated calls on unpaid and on paid orders returned identical responses and changed nothing.*
9. Does acknowledgement mutate transaction state, or only query/confirm it?
10. Exactly how long may pass before an unacknowledged transaction is reversed? *Live-observed: the hosted page shows a session timer starting at about ten minutes; the acknowledgement window itself is still undocumented.*
11. Is there a read-only transaction-status endpoint for reconciliation?
12. Are server-to-server notifications or webhooks available?
13. Should a one-phase approved payment with `OrderStatus=1` be fulfilled, or is `OrderStatus=2` always required?
14. Why does the validation page call `OrderStatus=3` rejected while the status table calls it authorization reversed?
15. Which response combinations should be treated as pending or manually reviewable?

## Amounts and currency

16. Does the `50 DZD` minimum apply to registration, refunds, or both?
17. Does “multiple by 100” only mean minor-unit encoding?
18. Are fractional-dinar customer amounts such as `806.50 DZD` universally supported?
19. Are currencies other than DZD enabled, and how is terminal eligibility determined?

## Refunds and idempotency

20. Are `language` and `currency` accepted or required by `refund.do`?
21. Is `externalRefundId` supported? If so, what is its format and where must it be sent?
22. What mechanism prevents duplicate refunds after a network timeout?
23. Which `OrderStatus` values are refundable? *Live-observed: status 2 refundable; after any refund the status is 4 with `depositAmount` = remaining captured amount; a second partial refund from status 4 succeeded; refunding beyond the deposit returns error 7.*
24. What is the minimum partial-refund amount? *Live-observed: 20.00 DZD and 30.00 DZD partial refunds accepted.*
25. Is there a refund-status or refund-history endpoint?

## Request and response contract

26. What character encoding is required for form fields and `jsonParams`?
27. Are language values case-sensitive?
28. Are numeric response fields consistently numbers, strings, or potentially both?
29. Is the capitalization of `ErrorCode`, `OrderStatus`, `OrderNumber`, `Pan`, and `Amount` guaranteed?
30. Can SATIM provide a complete machine-readable error-code catalogue? *Live-observed: an unknown `mdOrder` returns HTTP 401 with the JSON string `"Transaction is not found"` instead of the documented `ErrorCode 6`. Which other errors use HTTP status codes rather than in-body codes?*
31. Can SATIM provide an OpenAPI specification or a versioned integration manual?
32. How are breaking API changes communicated and versioned?

## Security, data, and certification

33. Which response fields may the merchant persist, and for how long?
34. Are there SATIM-specific PCI DSS, privacy, or Algerian regulatory retention requirements?
35. Is certificate pinning required or recommended for mobile applications?
36. What is the approved wording/layout for payment receipts?
37. Must receipts have a merchant-controlled sequence number?
38. What evidence must be retained from certification?
39. How are production credentials and permissions activated after approval of the certification PV?
40. Is there a production go-live verification or limited pilot period?

## Module certification and proprietary distribution (GIE Monétique / qualifier)

CIBWeb explicitly confirms reusable payment-module certification. These questions concern its application to WathiqPay, not whether that pathway exists. See [the verified process](cibweb-process.md).

41. Is a headless npm SDK eligible as the module, and what reference website/UI must accompany its submission?
42. Which legal/developer profile and supporting documents are required? *Partly answered by procedure GIE/PHWM/21/3.0: commercial register or equivalent for the developer; merchants also need the CNRC E-fournisseurs registration.*
43. How should merchant licences for this proprietary module be authenticated in the Type 1 pathway?
44. What certificate/module/licence identifier should a merchant provide, and how does the developer validate it?
45. Which code, version, configuration, and UI components are covered by the certificate?
46. Which updates, merchant customizations, or forks require recertification?
47. What are the certificate duration, renewal process, and ongoing developer obligations? *Procedure GIE/PHWM/21/3.0: the certificate is valid for a fixed renewable period (duration unstated); the holder validates licence requests in CIBWeb; GIE Monétique may audit at any time.*
48. What evidence and testing remain required during bank production activation for a merchant using the referenced module?

## Raised by the card-scenario run of 22 September 2026

49. ~~First-attempt "incorrect CVV" declines~~ Withdrawn 22 September 2026: a test-driver typing artefact, not SATIM behaviour.
50. Which amount triggers the "card limit exceeded" and "terminal/transaction amount limit exceeded" scenarios? Both cards were approved at 50.00, 1 200.00, and 2 376 000.00 DZD.
51. The "expired card" test card (12/2022) was approved, and the hosted page's year picker cannot select 2025 for the "card no longer exists" card. Are these cards still current?
52. Is the two-step flow (card page on `test.satim.dz`, static 3-D Secure password on `test2.satim.dz/acs`) identical in production?
53. Declines before 3-D Secure (actionCode 2003) and user cancellation return only an English `actionCodeDescription` and no `respCode_desc`. Is localized text available, or a code list the merchant should translate?
