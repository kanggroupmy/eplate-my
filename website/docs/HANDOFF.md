# Handoff — current update 11 September 2026

## Order form update — 14 September 2026

Customer form now offers only on-the-road vehicles, the user's exact 53-brand list, one fitment dropdown option (One Auto Motoring, 34 Jalan Permas 9/7), and inline private VOC upload after saving the draft. Screw-bit and delivery-method controls are absent. Existing VIN and eligibility requirements remain. Migration 202609140001 adds nullable legacy-compatible vehicle columns, validates new/resumed drafts and preserves brand on replacement orders; prior migrations are unchanged. Full tests, database scenario including invalid brand/usage/location cases, lint, build and typecheck passed. Local rendered form inspected with synthetic customer data; real document uploads were not used. Preserve the preceding sign-in setup notes.

## Sign-in configuration follow-up

User selected sender `noreply@eplate.my` (name ePlate.my), initial admin email `1automotoring@gmail.com`, and confirmed Resend/Supabase SMTP connected. Resend business account is digital@kang-group.com; eplate.my was verified. A new sending-only, domain-restricted key named `ePlate Supabase SMTP` was created; its value was not printed or written to files. Admin role must wait for verified sign-in.

The live sign-in failure was traced to zero Vercel environment variables. Added production NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (sensitive), NEXT_PUBLIC_SITE_URL, APP_URL and RATE_LIMIT_SECRET (sensitive). Keys were transferred through authenticated CLIs in memory without printing values. Site/Auth URLs now use https://eplate-my.vercel.app and exact allowed callback /auth/callback/. A production redeployment was requested to load the settings. This supersedes the no-environment-settings statement below. Payment/WhatsApp setup and real end-to-end acceptance remain outstanding; do not claim readiness from an HTTP 200 login acknowledgement alone.

## Current authoritative status (supersedes historical sections below)

- Published source: `kanggroupmy/eplate-my`, commit `15223e4`, canonical app under `website/`. Active checkout: `/Users/jkang/.cache/eplate-canonical-publish`. Preserve the original dirty Google Drive checkout; do not reset or publish it over this checkout.
- Vercel Git integration is connected to that repository, restricted to that one repository, with Root Directory `website`. Git-triggered production deployment `dpl_6Ee9CdjcyCbeuahpRZ14tL8NxDVC` is READY at https://eplate-38i09xzpi-eplatemy.vercel.app and https://eplate-my.vercel.app. Home and order routes return 200; health returns 503 because transactional configuration is absent. Do not reconnect the old repository or repeat account installation.
- Supabase CLI is authenticated through the selected business account and linked to `cyyhtcwbhtxpwrwkquru`. Before migration, direct database counts verified zero public tables, zero Auth users and zero Storage objects. The three baseline migrations were applied successfully and recorded remotely. All application tables have RLS enabled, all four buckets are private with 4 MiB limits, and browser roles have no execute grants on `eplate_*` business RPCs.
- Hosted security review identified mutable trigger search paths and anonymous access to boolean ownership helpers. Follow-up migration `202609110001_function_hardening.sql` fixes those issues while retaining signed-in helper execution required by RLS. The full local database scenario passed with all four migrations and new privilege assertions; the fourth migration was then successfully applied remotely. The remaining signed-in SECURITY DEFINER helper advisories are intentional: helpers return only current-user role/ownership booleans; they cannot change records.
- No Vercel environment secrets were added. This intentionally keeps customer ordering unavailable while SMTP, payment, notification and legacy-data acceptance remain incomplete. Do not activate a second writer before legacy reconciliation.
- The legacy baseline is present at `apps/order/migrations/0001_initial.sql`; follow `apps/order/RETIREMENT.md`. Root static pages and legacy source remain preserved; legacy package deployment is disabled locally. Existing remote Worker/D1/R2 contents and writer status are unverified. No DNS changes or legacy data imports were made.

### Next required account actions

1. Obtain access to the legacy Cloudflare Worker/D1/R2 inventory; back up, restore-test and reconcile any records before enabling the new writer. Do not assume the empty new Supabase project means the legacy system has no customers.
2. Configure SMTP and Auth callback allowlist for the chosen production host; securely populate Supabase/Vercel settings, rate-limit and scheduler secrets. Confirm the initial named staff identities after their first sign-in; never infer admin roles from email.
3. Supply ToyyibPay merchant/category access and Meta business phone/app/token plus approved transactional templates. Keep credentials in provider/Vercel secret settings, never conversation text or git. Complete provider acceptance and protected scheduler setup.
4. Confirm invoice business identity, pricing, retention, backup/recovery targets and operational ownership. Run real role, upload, invoice, payment and notification acceptance before DNS/traffic cutover.

### Release and rollback

Changes pushed to canonical main deploy automatically from `website/`. Use the full repository root for any CLI deployment with this Root Directory setting; the earlier flat `/Users/jkang/.cache/eplate-release` copy is unsuitable for new deployment. Preserve additive database migrations during app rollback. A verified compatible limited-release fallback is https://eplate-flb2jqqzk-eplatemy.vercel.app; never promote the failed June release or restart the legacy backend. No DNS rollback is currently needed.

The sections below are historical evidence only; their statements that source is unpublished, D1 schema is missing or migrations are unapplied are obsolete.

## Canonical repository publication

The Next.js application is now included under `website/` in the canonical Git checkout. Vercel must use Root Directory `website`. Root static pages and the newer `apps/order/` legacy files were preserved from remote main. Its normal deployment command is disabled. The D1 baseline previously reported missing was found at `apps/order/migrations/0001_initial.sql`; use `apps/order/RETIREMENT.md` as the current migration mapping. Older notes below describe earlier discovery and are superseded by this update.

Lint, all 16 unit/security tests plus the embedded database scenario, production build and standalone typecheck passed for this publication copy on Node 22. No environment files or customer data were copied. The original Google Drive worktree was left intact. Supabase's migration history page currently reports no migrations; this does not prove that no tables were created manually. Inspect schema and take backups before running migrations.

## Account and repository update — 11 September 2026

- User selected `digital@kang-group.com` through GitHub `kanggroupmy`. Dashboard sign-in succeeded. Use KANG Group organization `qyizbedqzbxafxacovwp`, project `eplate-my-production`, ref `cyyhtcwbhtxpwrwkquru`, Singapore region. Project was paused; resume completed and the dashboard reported Restoration complete. Verify database readiness before migrations or configuration.
- `kanggroupmy/eplate-my` is the sole authoritative repository. Local origin is correct and remote HEAD was reachable at `451ee72c993c3286dd896351a6dc2147ebff8513`. The obsolete repository URL redirects to this transferred repository; do not delete the destination repository.
- Removed the broken old Git connection from Vercel project `eplatemy/eplate-my`. User approved the Vercel GitHub app installation. Installation `160658188` exists on `kanggroupmy`; saved and verified Only select repositories with exactly `kanggroupmy/eplate-my`. The user repaired the Vercel GitHub sign-in link; the Authentication page now shows `kanggroupmy`. The subsequent CLI `vercel git connect https://github.com/kanggroupmy/eplate-my --yes --scope eplatemy` succeeded with Connected. Account/repository linkage is resolved; do not reinstall the app or request this permission again.
- Removed obsolete repository-name references from the three local handoff/ledger/verification documents. A focused scan of app, components, data, lib, public, docs, Supabase, tests, README, AGENTS, Git config and deployment config found no remaining matches. Historical Git authorship and provider-owned redirects are not changed.
- Remote main still contains the legacy static/Worker layout and does not contain this locally implemented Next.js app. Reconcile and publish the local application before triggering a Git-based production release. No commits, pushes, database migrations, provider activation or DNS cutover were performed in this account-cleanup step.

## Live deployment update — 7 September 2026

The user explicitly authorized deploying the incomplete release. Deployment succeeded on Vercel project `eplatemy/eplate-my` (project ID `prj_e6pHQvA0XqBjKA4syxVK1qTGM9HI`).

- Public URL: https://eplate-my.vercel.app
- Immutable release: https://eplate-flb2jqqzk-eplatemy.vercel.app
- Deployment: https://vercel.com/eplatemy/eplate-my/Dh97jeMn8c3piqXK2ioWATKXiL9Z (READY, production)
- Source uploaded from a fresh environment-free copy at `/Users/jkang/.cache/eplate-release`; this directory is linked to Vercel. No git commit/push was performed. The sole authoritative repository is `kanggroupmy/eplate-my`, confirmed by the user on 11 September 2026. The obsolete Vercel Git connection was removed; verify the replacement connection before enabling automatic releases.
- Added explicit Next.js framework/build/install configuration to vercel.json and .vercelignore to exclude environment files, tests and build outputs. Package engines select Node 22.
- Vercel production environment has NO configured variables. Supabase migrations, provider setup and remote Worker retirement were NOT performed. Ordering is unavailable, not activated against a legacy database.
- Vercel build, lint and type validation passed; remote npm install reported zero vulnerabilities. Build has the existing Supabase Edge process.version warning, so real authenticated middleware still needs account-backed verification.
- Live checks: home/blog/order/sitemap 200; health and private invoice 503; unsigned notification dispatch 401. Use trailing slashes for app/API routes; unslashed paths redirect 308. Browser confirmed ordering-unavailable text.
- eplate.my DNS/custom-domain cutover was NOT performed. The new release is served at the Vercel URL; existing Cloudflare site and remote backend were not changed.

Next agent: complete the account/data/provider dependencies below before enabling ordering. Continue using this Vercel project and source; do not overwrite it with the stale Git repository. Redeploy from website with CLI project link and `vercel deploy --prod --scope eplatemy` after checks. Never copy .env.local blindly.

Rollback: this project had no successful previous production release. If this limited release must be withdrawn, remove its production alias/deployment in Vercel; do not promote the failed June build or reactivate the legacy backend. No database/DNS changes need reverting. For subsequent compatible releases use the verified Vercel rollback target described in OPERATIONS.md.


## Current state
Local implementation is complete and checks pass. **Deployed as a limited public release; transactional services are not production-verified.** The user requested completion within remaining usage and live publishing if that was not possible. No callable Vercel connector, confirmed project linkage or verified deployment credential was available during the final check. Do not confuse local success with a live release.

Canonical stack: Next.js 15.5.24 in website, Supabase Auth/Postgres/private Storage, ToyyibPay, WhatsApp Cloud API; Vercel target and Cloudflare DNS/edge. Next 14 was upgraded for security; PostCSS is overridden to patched 8.5.28. Audit reports zero known vulnerabilities.

Implemented customer drafts/resumption, magic-link callback/session refresh, private validated uploads, real checkout adapters, payment reconciliation, history/rejection messages, booking, invoices/receipts and replacement orders. Admin/operator dashboard/search/filter/counts/pagination/CSV, document review, notes, corrections, appointment availability, invoice issuance and payment recovery exist. Installer gets a narrow projection and records matching/evidence/completion. SQL owns transitions, audit, payment idempotency, booking capacity and notification outbox. Meta callback HMAC and delivery receipts are implemented.

The Worker is locally disabled (410 entrypoint and refusing deploy script); useful source is retained. This does not disable any already deployed Worker. See ../../order-app/RETIREMENT.md.

## Checks completed
Lint, strict TypeScript and production builds passed. Node 22.23.2 also passed the tests and production build. Sixteen focused tests plus all three migrations and a substantive PostgreSQL security/lifecycle scenario pass. Added assertions cover exactly one invoice/payment-confirmation notification after callback replay and no retry of permanent notification failures. Customer/installer mobile and admin desktop UI were inspected with synthetic data, including no mobile overflow and no installer identity-document/payment controls. PDF rendered and inspected. Public bundles were checked for server credential identifiers. No real personal documents were used.

Details and limitations: VERIFICATION.md. SQL harness uses PGlite with Supabase auth/storage schema stubs; browser role data was a loopback fixture. Real hosted Supabase/SMTP/Storage/provider acceptance is still required.

## Required next actions
1. Verify target Supabase project, applied migration history, remote Worker and Vercel project; inspect credential availability without printing values.
2. Back up and restore-test Postgres, Storage and legacy D1/R2. The D1 baseline schema is absent; build a reviewed import only after obtaining real exports. Reconcile legacy mock/unsigned payments, identity mappings and file hashes.
3. Apply unapplied migrations in lexical order to isolated staging; September file is 202609060001_canonical_system.sql. Confirm RLS, role bootstrap and private Storage/signed URL expiry against real Supabase.
4. Populate .env.example variables securely, configure SMTP/Auth callback allowlist and abuse controls, ToyyibPay merchant/category, Meta phone/token/app secret/templates/subscription and CRON_SECRET-protected POST scheduler.
5. Run real account-backed acceptance. Confirm commercial invoice identity/numbering, pricing, retention, recovery targets and alert ownership.
6. Deploy website with Vercel root website and Node22. Freeze/import/reconcile legacy writes, switch approved routes/callbacks/DNS and explicitly disable the remote Worker. Exactly one backend may write production data.
7. Rollback only to a compatible secure website build using the same authoritative database; never re-enable the old insecure backend. Pause writes, preserve callback evidence and reconcile before replay.

OPERATIONS.md and PROVIDERS.md contain the full release/rollback/provider procedures. .env.local was not copied into the verification build. Do not assume credentials there are complete or safe for deployment.

## Repository preservation
The repository started with modified README/DNS/static index and almost all Next.js files untracked. They remain uncommitted; do not indiscriminately commit, discard or overwrite user work. The workspace parent and order-app are not Git repositories. Temporary test outputs live under ignored .verification or the local cache.
