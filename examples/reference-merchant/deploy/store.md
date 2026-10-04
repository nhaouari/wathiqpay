# The course store (store.wathiqpay.com)

The same application serves two shops. With `MERCHANT_STORE=courses` it becomes a real store that sells online courses: catalog and course pages, cart, checkout, payment on SATIM's page, and automatic enrolment on the course platform (OnlineCourseHost) once SATIM confirms the payment. The store has its own name ("Wathiq Store") and never names the platform's site in its pages; the platform's address appears only to a buyer who has been enrolled. `demo.wathiqpay.com` keeps running the demonstration shop from the same repository.

## How a sale works

1. The buyer picks a course, enters name, phone and e-mail address, accepts the terms and pays on SATIM's hosted page.
2. On return the shop acknowledges the payment server-to-server and fulfils the order exactly once, as in the demo.
3. Fulfilment calls OnlineCourseHost's [enrol endpoint](https://help.onlinecoursehost.com/article/78-enroll-student-api) with the buyer's e-mail address and the course ID. The platform creates the student account if there is none and enrols it.
4. The result page tells the buyer to sign in on the course platform with that e-mail address and, on a first sign-in, to choose a password through the password reset link. With `SMTP_URL` set, the same instructions are e-mailed with the receipt.

The API needs a password for accounts it creates; the shop sends a random one that nobody sees, so the instructions are the same whether or not the buyer already had an account.

If enrolment fails (the platform is unreachable, say) the payment stays confirmed, the buyer sees "enrolment being finalised", and the enrolment is retried when the buyer opens the order page and on every `/admin/reconcile` call, up to 10 times. `GET /admin/orders/<ref>` shows each course's attempts and last error.

**Test payments enrol nobody unless you ask.** SATIM's test cards are public, so outside `MERCHANT_MODE=production` the shop records the delivery as skipped and shows no access notice. Skipped orders stay skipped if the same database later goes live. `COURSES_ENROLL_IN_TEST=1` enrols test payers too, so a SATIM reviewer sees the complete flow; anyone with a test card then gets the course, so use it only while the courses on sale are free on the platform, and remove it before selling paid ones. The store shows no demo or test banner in any mode.

## The catalog

`src/courses.ts` lists the courses on sale, with their OnlineCourseHost `courseId`, texts in Arabic, French and English, cover and **price in dinars**. To add a course, find its ID with:

```bash
curl -H "X-INTEGRATION-TOKEN: $OCH_INTEGRATION_TOKEN" -H "Accept: application/json" https://api.onlinecoursehost.com/api/zapier-tenant-courses
```

then add an entry and put its cover in `public/images/` (lower-case name, `.png` or `.jpg`).

## Deployment

A third Vercel project on the same repository, set up exactly like the demo ([vercel.md](vercel.md)): root directory = repository root, framework preset "Other", its own Turso database (recommended; see below), domain `store.wathiqpay.com`. Environment variables are those of the demo, with these differences:

| Name | Value |
|---|---|
| `MERCHANT_STORE` | `courses` |
| `MERCHANT_PUBLIC_URL` | `https://store.wathiqpay.com` |
| `MERCHANT_DB_URL`, `MERCHANT_DB_AUTH_TOKEN` (or `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) | preferably a database of its own. Sharing the demo's works while both run on SATIM's test platform: orders are told apart by their products, and each shop only enrols for its own. Separate them before production, when the two shops use different SATIM credentials and one can no longer acknowledge the other's abandoned payments |
| `OCH_INTEGRATION_TOKEN` | OnlineCourseHost: Admin > Settings > Integrations > Zapier Integrations. Required in production |
| `ACADEMY_URL` | optional; the course platform's address, shown to enrolled buyers |
| `LEGAL_NAME`, `LEGAL_ADDRESS`, `LEGAL_RC`, `LEGAL_EMAIL`, `LEGAL_PHONE`, `LEGAL_WEBSITE` | the seller's legal identity and contact, shown on the terms and privacy pages. Set them: a real store must name its seller |
| `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` | keys created for `store.wathiqpay.com` |
| `SMTP_URL`, `SMTP_FROM` | as for the demo; also sends the access confirmation |
| `MERCHANT_MODE`, `SATIM_*` | `certification` with the test credentials until SATIM issues production credentials; then `production`, the production credentials and `SATIM_BASE_URL` |

Check it:

```bash
curl https://store.wathiqpay.com/healthz   # {"ok":true,"mode":"certification","store":"courses"}
```

To reconcile every ten minutes rather than once a day, add a second job to `.github/workflows/reconcile.yml` with the store's URL and admin token.

Run it locally with the simulator: `MERCHANT_STORE=courses npm run demo`.
