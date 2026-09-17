# Live evidence log

Sanitized record of every exchange with the real SATIM certification environment. No credentials, terminal identifiers, or customer data are recorded here.

| Date | SDK commit/version | Scenario | Request | Observed response | Expected | Result |
|---|---|---|---|---|---|---|
| 2026-09-17 | 0.1.0-alpha.0 (uncommitted) | Register 50.00 DZD, language FR, POST form-encoded, `test2.satim.dz` | `register.do` | HTTP 200, `{"errorCode":5,"errorMessage":"Access denied"}` | `errorCode 0` with `orderId`/`formUrl` | Blocked by account access |
| 2026-09-17 | curl probe | Same fields via GET query string, `test2.satim.dz` | `register.do` | HTTP 200, `{"errorCode":5,"errorMessage":"Access denied"}` | same | Blocked by account access |
| 2026-09-17 | curl probe | Same fields via GET, `test.satim.dz` | `register.do` | HTTP 200, `{"errorCode":5,"errorMessage":"Access denied"}` | same | Blocked by account access |

## Findings

- The certification host answers POST `application/x-www-form-urlencoded` with a JSON object of the documented shape, so the SDK's transport, encoding, and error parsing are compatible with the real gateway at the HTTP level.
- `errorCode 5` is documented as "access denied, password change required, or invalid parameter". Because GET and POST on two hosts return the same answer, the cause is on the account side: the merchant user is not enabled for the API, its password must be changed in the portal, the terminal is not linked to the user, or the source IP is not allowlisted (open question 3).
- The plan's earlier observation of a disabled merchant-user label in the portal is consistent with this result.

## Next live step

Ask SATIM support (or check the CIBWEBLab portal) why the web-merchant user is refused, then rerun `npm run test:live`. A successful registration yields `OrderStatus 0` on acknowledgement before payment.
