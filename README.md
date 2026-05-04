# ePlate Pre-Launch App

This is a separate working preview app for the order system. It does not replace the SEO site in `/Users/jkang/Documents/eplate-static`.

## Run locally

```bash
python3 -m http.server 3000
```

Open:

```text
http://localhost:3000
```

## Preview accounts

Admin:

```text
username: admin
password: admin123
```

Installer:

```text
username: installer
password: install123
```

Customer login uses mock OTP. Click `Send OTP` and the demo OTP appears on screen.

## What is mocked

- OTP sending
- ToyyibPay payment
- WhatsApp messages
- Invoice delivery
- File storage

All data is stored in browser `localStorage`.

## Publish target

This app is prepared for GitHub Pages on:

```text
order.eplate.my
```

The `CNAME` file is already included.

Recommended publishing path:

1. Create a new GitHub repository, for example `eplate-order`.
2. Push this folder to that repository.
3. Enable GitHub Pages from the `main` branch root.
4. In Cloudflare DNS, add:

```text
order  CNAME  jasonzlah.github.io
```

Keep the record DNS only until GitHub Pages verifies the custom domain.

## Cloudflare production architecture

The repo now includes a Cloudflare Workers backend in `src/worker.js`.

Production target:

```text
order.eplate.my  customer app
admin.eplate.my  staff dashboard
```

Cloudflare services:

```text
Workers  API, auth, payment webhooks, WhatsApp webhooks
D1       orders, customers, staff, sessions, audit logs
R2       Geran/VOC and installation photos, later when enabled
Assets   frontend files
```

Important files:

```text
wrangler.toml
migrations/0001_initial.sql
migrations/0002_seed_staff.sql
src/worker.js
public/index.html
public/assets/app.js
public/assets/styles.css
```

Production API routes included:

```text
POST /api/auth/otp/request
POST /api/auth/otp/verify
GET  /api/customer/me
POST /api/orders
GET  /api/orders
POST /api/orders/:id/files
GET  /api/invoices/:invoiceId.pdf

POST /api/admin/login
GET  /api/admin/orders
GET  /api/admin/orders.csv
PATCH /api/admin/orders/:id
GET  /api/admin/files/:fileId

GET  /api/installer/orders/plate/:plate
POST /api/installer/orders/:id/installation-files

GET  /api/webhooks/whatsapp
POST /api/webhooks/whatsapp
POST /api/webhooks/toyyibpay
```

Before full production, create these in Cloudflare:

```text
D1 database: eplate-prod
R2 bucket:   eplate-uploads
Worker:      eplate-app
```

Then update `wrangler.toml`:

```text
account_id
database_id
WHATSAPP_VERIFY_TOKEN
```

Production secrets to add with Wrangler or Cloudflare dashboard:

```text
SETUP_TOKEN
SMS_API_URL
SMS_API_KEY
TOYYIBPAY_SECRET_KEY
TOYYIBPAY_CATEGORY_CODE
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID
```

Set this to use real providers:

```text
MOCK_PROVIDERS = "false"
```

R2 is optional for the first Cloudflare deploy. The current config uses:

```text
FILE_STORAGE = "mock"
```

When R2 is enabled in Cloudflare, add this binding back to `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "eplate-uploads"
```

Then set:

```text
FILE_STORAGE = "r2"
```

Staff accounts should be created through:

```text
POST /api/setup/staff
Header: x-setup-token: <SETUP_TOKEN>
```

The frontend is still the pre-launch mock UI. The backend is now Cloudflare-native and ready for the next step: wiring the UI to these `/api/*` routes.
