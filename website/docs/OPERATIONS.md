# Deployment and operations

## Architecture and setup
`website/` is the sole supported application: patched Next.js 15, Supabase Auth/Postgres/private Storage, ToyyibPay and Meta WhatsApp Cloud API. Vercel hosts the app; Cloudflare provides DNS/edge protection. Historical static HTML is preserved but must not be deployed as another application.

Use Node 22 LTS, `npm ci`, and populate `.env.local` using `.env.example` from a secret manager. Never commit secrets. Run `npm run dev`, lint, typecheck, tests and build. Compilation without credentials does not verify integrations. Health returns 503 until required configuration and database schema exist.

## Database rollout and staff bootstrap
Obtain production approval and confirm project/migration history. Back up Postgres AND Storage object bytes; database backups do not include uploaded objects. Restore into isolated staging and verify counts and content hashes. Apply unapplied files in `supabase/migrations/` in lexical order; never edit historical migrations. Hardened RLS stops the old browser writes, so coordinate the application release in a maintenance window.

After a staff member signs in, privately confirm their Auth UUID and insert into `public.admin_users` with role `admin`, `operator` or `installer` using the reviewed SQL editor/service connection. Never infer roles from email domains or user-editable metadata. Test direct REST/RPC/Storage access with two customers and all roles. Test signed URLs after expiry.

## Authentication and edge controls
Enable Supabase email magic links, production SMTP, verified sending domain and Auth email/IP rate limits. Allow only the canonical HTTPS `/auth/callback/` plus explicit localhost development URLs. The callback exchanges PKCE codes. Refresh cookies use secure production transport and SameSite=Lax. Supabase browser authentication needs readable cookies; server authorization independently verifies the current user.

The app email limiter hashes identifiers with RATE_LIMIT_SECRET and fails closed. Supabase's public Auth endpoint requires provider-side limits because it can be called directly. Configure Cloudflare/Vercel limits for login, uploads, checkout and webhooks. Do not put interactive challenges on provider callbacks. Trust forwarded addresses only where the platform overwrites them.

## Provider setup
Populate all variables from `.env.example` in Vercel's secret environment. APP_URL and NEXT_PUBLIC_SITE_URL must match exactly. Live payments are required in production; fake and sandbox modes are restricted to nonproduction runtimes.

Configure ToyyibPay merchant/category and `/api/webhooks/toyyibpay/` callback. Validate an approved small live payment against the merchant transaction record, including amount, external order ID, duplicate callbacks and cancellation. Browser returns do not confirm payment. Reconcile uncertain bill creation before retrying because a timeout can occur after provider acceptance.

Configure Meta business account, phone, token, approved template names/language and explicit API version. Match template variables and event map to `docs/PROVIDERS.md`. Configure a scheduler calling the notification dispatch route with CRON_SECRET. Alert on stale pending jobs, exhausted retries and provider errors. External send timeouts can be ambiguous; inspect provider message references before manual retry.

## Deployment and cutover
Configure Vercel root `website`, Node 22, install `npm ci`, build `npm run build`. Scope production and preview secrets separately. Deploy staging first. Verify public pages, sitemap/robots/structured data and customer/admin/installer mobile and desktop journeys. Account/API responses must not be cached publicly. Protect preview deployments; use synthetic documents only.

Only with explicit approval: publish the tested release, update callbacks and change DNS/routes. Follow `../../order-app/RETIREMENT.md`: restore/test D1/R2 export, freeze legacy writes, reconcile final delta and import reviewed data. The old baseline D1 schema is absent; a reliable import needs the real export. Local retirement safeguards do not disable an already deployed Worker. Ensure exactly one live writer. Verify health, login, upload, checkout, role boundaries and appointment completion after cutover.

## Monitoring, retention and recovery
Structured logs contain event/outcome/request ID only. Never log bodies, cookies, signed URLs, credentials, document bytes or full exceptions. Limit platform log access/retention. Monitor `/api/health/`, provider errors, outbox age and stalled orders; assign an escalation owner. Preserve audit evidence during incidents, restrict access and rotate affected credentials/sessions.

The business must approve retention periods for identity documents, evidence, financial records and audit history. No legal retention duration is assumed. After approval, use a reviewed service-only deletion procedure: remove object bytes, redact permitted personal fields, preserve required financial/audit references and record completion. Apply backup expiry rules too. Do not cascade-delete order history to remove a customer's identity.

Enable appropriate Supabase backups/PITR and encrypted Storage exports. Rehearse restoration into an isolated project, verify hashes/counts and reconcile provider payments after recovery. Record RPO/RTO and responsible owner. Never replay every outbox entry after restoring an old snapshot.

## Rollback
Before traffic moves, roll back the staging app and preserve additive schema. After traffic moves, pause writes/payment creation, preserve callback evidence, deploy the last compatible secure website build, reconcile transactions and replay only idempotent confirmations. Never re-enable the insecure legacy Worker or old browser-write app. Database rollback is a reviewed forward repair or restoration into a separate project plus reconciliation; do not drop tables containing new records. DNS rollback must target a compatible app using the same authoritative data.

## Launch checklist
- [ ] Production migration history verified; staging database/access tests pass.
- [ ] D1/R2 export restored, mapped, reconciled; legacy writer disabled.
- [ ] SMTP, Auth allowlist, abuse controls and named staff verified.
- [ ] Live payment, callback, duplicate and reconciliation verified.
- [ ] Approved WhatsApp templates, scheduler/retries and alerts verified.
- [ ] Private uploads, installer boundaries and invoice ownership verified.
- [ ] Appointment capacity/time zone and installation proof verified.
- [ ] Business invoice identity/numbering, pricing and retention approved.
- [ ] Backup restore/rollback rehearsed; owner identified.
- [ ] Mobile/desktop staging acceptance and production approval recorded.
