# Hosting the demo shop on Vercel

The shop runs as one Vercel serverless function (`api/merchant.ts`), with product images served statically and orders stored in a hosted libSQL database on Turso. The landing page keeps its own Vercel project with root directory `site`; the demo is a second project on the same repository with the repository root as its root directory.

## 1. Database (Turso, free tier)

Either install the **Turso** integration from the Vercel Marketplace on the `wathiqpay-demo` project (it creates a database and injects `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, which the shop reads directly), or create one with the CLI:

```bash
brew install tursodatabase/tap/turso   # or: curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup                      # or turso auth login
turso db create wathiqpay-demo --location fra   # pick a European or nearby region
turso db show wathiqpay-demo --url              # -> libsql://wathiqpay-demo-<org>.turso.io
turso db tokens create wathiqpay-demo           # -> auth token
```

The schema is created automatically on the first request.

## 2. Vercel project

1. In Vercel, **Add New Project**, import `nhaouari/wathiqpay` again, and name it `wathiqpay-demo`.
2. Root Directory: leave as the repository root. Framework Preset: **Other**. The build and output settings come from `vercel.json`.
3. Environment variables (Production):

| Name | Value |
|---|---|
| `MERCHANT_MODE` | `certification` |
| `MERCHANT_PUBLIC_URL` | `https://demo.wathiqpay.com` (must be the domain customers use: SATIM returns them there, and the session cookie belongs to it) |
| `MERCHANT_DB_URL` | the `libsql://…` URL from step 1 |
| `MERCHANT_DB_AUTH_TOKEN` | the Turso token |
| `MERCHANT_ADMIN_TOKEN` | `openssl rand -hex 32` |
| `MERCHANT_CAPTCHA_SECRET` | `openssl rand -hex 32` |
| `CRON_SECRET` | same value as `MERCHANT_ADMIN_TOKEN` (Vercel sends it on cron calls) |
| `SATIM_USERNAME`, `SATIM_PASSWORD`, `SATIM_TERMINAL_ID` | certification credentials |
| `SMTP_URL`, `SMTP_FROM` | optional, not set for now; without them the e-mail receipt form is hidden and print/PDF receipts remain |

4. Deploy. Then **Settings → Domains** on the demo project: add `demo.wathiqpay.com`. Because the domain's DNS is already on Vercel, the record is created for you.

## 3. Checks

```bash
curl https://demo.wathiqpay.com/healthz
curl -H "Authorization: Bearer $MERCHANT_ADMIN_TOKEN" https://demo.wathiqpay.com/admin/reconcile
```

## Differences from the Docker deployment

- Reconciliation of abandoned orders runs every ten minutes from `.github/workflows/reconcile.yml` once the repository secrets `SHOP_URL` and `MERCHANT_ADMIN_TOKEN` are set, plus the Vercel cron in `vercel.json` once a day at 03:00 UTC (the most a Hobby plan allows; Pro plans may shorten the schedule) and on demand through the admin endpoint. Customers who return normally are acknowledged immediately either way.
- No local outbox: without `SMTP_URL` the e-mail receipt form is hidden.
- Cold starts add a few hundred milliseconds to the first request after idle.
