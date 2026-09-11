# Handoff — 7 September 2026

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
