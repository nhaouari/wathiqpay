# Operations runbook — reference merchant

For whoever operates a WathiqPay merchant (the demo at `https://wathiqpay-demo2.vercel.app`, or a merchant using the module). Commands assume `ADMIN=$MERCHANT_ADMIN_TOKEN` and `SHOP=https://<shop host>`.

## Order states

| State | Meaning | Action |
|---|---|---|
| `pending` | Saved, not yet registered with SATIM | None; becomes `failed` if registration fails |
| `failed` | Registration refused or timed out; no payment possible | None; customer was told no payment was taken |
| `registered` | Registered, customer on or left the SATIM page | Wait; reconciliation settles it |
| `paid` | Acknowledged with respCode 00, ErrorCode 0, OrderStatus 2, amount and order number matching | Fulfilled exactly once |
| `declined` / `reversed` | Refused by issuer, cancelled on the SATIM page, or reversed | None |
| `refunded` / `partially_refunded` | OrderStatus 4; `depositAmount` is what remains captured | None |
| `unknown` | SATIM returned a combination it has not documented (e.g. OrderStatus 1) | Investigate before fulfilling |
| `review` | SATIM says paid but amount or order number differs from the stored order | Do not fulfil; contact SATIM |

## Routine tasks

**Look at one order** (credentials and card data are redacted):

```bash
curl -H "Authorization: Bearer $ADMIN" $SHOP/admin/orders/<ORDER_NUMBER>
```

**Reconcile abandoned payments** (customer paid, then closed the browser before SATIM redirected back). Runs daily on Vercel and every minute in Docker; run by hand any time:

```bash
curl -X POST -H "Authorization: Bearer $ADMIN" "$SHOP/admin/reconcile?olderThan=600"
```

The hosted SATIM session lasts about ten minutes, so orders older than that can safely be reconciled.

**Refund** (full or partial; never retried automatically):

```bash
node build/test/live/cli.js refund <SATIM_ORDER_ID> <amount, e.g. 200.00>
node build/test/live/cli.js ack <SATIM_ORDER_ID>     # confirm OrderStatus 4 and remaining depositAmount
```

If the refund call times out, the SDK reports `outcome: indeterminate`. Acknowledge the order to see whether `depositAmount` dropped **before** trying again; SATIM has no documented idempotency key for refunds.

**Cancellation.** There is no cancellation API. A customer cancels on the SATIM page ("Annuler"), which lands on the failure route with "Operation cancelled by user". After capture, use a refund.

## Incidents

| Symptom | Where it shows | What to do |
|---|---|---|
| `[merchant] register failed … TransportError` in function logs | Checkout shows "could not be registered, no payment taken" | Check SATIM reachability from the host; on Vercel keep the function in `cdg1` |
| `register failed … GatewayError … errorCode 5` | Same | Credentials, password-change requirement, or terminal link on the SATIM account |
| `acknowledge failed` | Customer sees "payment being verified" | Order stays `registered`; reconciliation retries; nothing is fulfilled until confirmed |
| `receipt e-mail failed` | Customer sees "receipt could not be e-mailed" | Check `SMTP_URL`; the PDF download still works |
| Orders stuck in `unknown` or `review` | Admin order lookup | Compare with SATIM; never fulfil by hand without a matching acknowledgement |

Alerting: the shop writes these lines to standard error with the `[merchant]` prefix. Route them to an alert (Vercel Log Drains, or `docker compose logs` to your log collector) with a rule on `register failed`, `acknowledge failed`, and `receipt e-mail failed`.

## SATIM contacts

- Customer service for cardholders: **3020** (shown on every result page).
- Certification support: through the CIBWEBLab portal (`certweb.satim.dz`).
- Module certification and merchant authorization: GIE Monétique through CIBWeb (`cibweb.dz`).
