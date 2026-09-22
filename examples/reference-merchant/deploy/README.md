# Deploying the reference merchant for certification

SATIM must be able to redirect the customer's browser back to the shop, so the merchant needs a public hostname with a valid TLS certificate. This folder gives a one-command deployment on any Linux host with Docker: Caddy obtains a Let's Encrypt certificate automatically and proxies to the merchant container.

## Prerequisites

- A VPS or cloud VM reachable on ports 80 and 443 (any provider; 1 vCPU and 1 GB RAM are plenty).
- A DNS A (and optionally AAAA) record for the shop hostname pointing at that VM.
- Docker Engine with the Compose plugin.
- The SATIM certification credentials and terminal ID.

## Steps

```bash
git clone <this repository> wathiqpay && cd wathiqpay
cp examples/reference-merchant/deploy/.env.deploy.example examples/reference-merchant/deploy/.env.deploy
$EDITOR examples/reference-merchant/deploy/.env.deploy      # domain, tokens, SATIM credentials, SMTP
docker compose --env-file examples/reference-merchant/deploy/.env.deploy \
  -f examples/reference-merchant/deploy/compose.yml up -d --build
```

Then open `https://<MERCHANT_DOMAIN>/`. The first request may take a few seconds while Caddy obtains the certificate.

## Checks

```bash
curl https://<MERCHANT_DOMAIN>/healthz
curl -X POST -H "Authorization: Bearer $MERCHANT_ADMIN_TOKEN" https://<MERCHANT_DOMAIN>/admin/reconcile
docker compose -f examples/reference-merchant/deploy/compose.yml logs -f merchant
```

## What changes compared with the local demo

- Return and failure URLs are built from `MERCHANT_PUBLIC_URL`, so SATIM redirects to `https://<MERCHANT_DOMAIN>/payment/return?ref=…`.
- `/admin/*` requires the bearer token. `/healthz` stays public for the proxy's health check.
- Receipts are e-mailed through `SMTP_URL` (implicit TLS on port 465 with AUTH PLAIN). Leave it empty to keep writing `.eml` files to the data volume.
- Closed-browser reconciliation also runs every minute for orders older than `MERCHANT_RECONCILE_AFTER` seconds.
- The SQLite database and outbox live on the `merchant-data` volume.

## Running the certification scenarios through the shop

Once the shop is public, run each card scenario by placing an order in the browser and paying with the SATIM test card for that scenario on the hosted page. SATIM redirects back to the shop, which acknowledges the order and shows the result page. Record each outcome in `docs/live-evidence.md`. For the qualifier session the manual path is the one to demonstrate.
