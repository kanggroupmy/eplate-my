# Implementation ledger

## Current status — 11 September 2026 (supersedes older entries below)

- Canonical source published to `kanggroupmy/eplate-my` main at `15223e4`; Vercel Git deployment READY, Root Directory `website`.
- Business Supabase project confirmed and linked. Empty project verified by database counts before applying all three baseline migrations. RLS/private buckets/service-only business RPCs verified remotely.
- Additive function hardening migration and regression assertions added following hosted security review; see HANDOFF.md and VERIFICATION.md for application/check results.
- Local lint, typecheck, 16 tests plus database scenario, and build passed before publication. Public home/order HTTP 200, readiness 503 as expected without configuration.
- Legacy D1 baseline found in `apps/order/migrations/0001_initial.sql`; historical source preserved, normal deploy command disabled. Remote data and writer still require account-backed review.
- Remaining work: legacy backup/import/reconciliation, SMTP/Auth and staff setup, secure Vercel environment setup, ToyyibPay/Meta credentials and acceptance, scheduler/alerts, business retention/invoice decisions, real customer/staff acceptance and approved domain cutover. No claim of full production readiness.

## Confirmed facts
- Canonical application is `website/`: patched Next.js 15, Supabase Auth/Postgres/private Storage; Vercel target, Cloudflare DNS/edge only.
- Workspace parent and `order-app/` are not Git repositories. Existing modified README, DNS notes and static index, plus untracked application files, were preserved. No commit or deployment was made.
- Two historical Supabase migrations were preserved; a third additive migration removes unsafe browser writes and installs transactional business functions.
- Legacy Worker code is retained, entrypoint locally returns 410 and deploy script refuses deployment. Existing remotely deployed resources remain unverified and unchanged.
- D1 baseline schema is missing. A reliable data import requires a real schema/data/object export; mapping and retirement procedure are documented.

## Assumptions
- Requested architecture adopted; Next 14 upgraded for security.
- Existing RM150 package, RM98 component, workshop and regulatory/SEO content retained; manual-transfer instructions updated for ToyyibPay.
- SQL is the authoritative lifecycle enforcement. UI permissions are convenience checks only.

## Work packages
1. Inventory and preservation — complete.
2. Additive model, RLS, lifecycle, audit, appointments and outbox — implemented and locally tested.
3. Customer/admin/installer workflows, secure uploads and invoices — implemented; browser checked with synthetic fixtures.
4. Payment/notification adapters, signed callbacks, reconciliation, retries — implemented; local tests pass.
5. Auth hardening, operational setup, health, retirement and rollback guidance — complete locally.
6. Lint, typecheck, build, focused tests, SQL scenario and visual checks — pass; see VERIFICATION.md for scope.
7. Production setup, data migration and cutover — NOT performed; requires external accounts and explicit approval.

## Exact external dependencies
- Confirm target Supabase project and applied migrations; export/restore Postgres, private objects and D1/R2; reconcile identities and unverified legacy payments.
- Configure SMTP, Auth callback allowlist and provider-side abuse limits; confirm initial named staff Auth UUIDs.
- Supply ToyyibPay merchant/category credentials; run approved sandbox/live checkout and callback acceptance.
- Configure Meta phone/token/app secret, approved templates, webhook subscription and protected scheduler; verify actual delivery and retry handling.
- Approve invoice business identity/numbering, commercial terms, retention periods and backup recovery targets.
- Approve Vercel release and DNS/callback cutover after staging acceptance. Exactly one writer must be active; old Worker must be explicitly disabled remotely.

Local implementation is ready for account-backed staging acceptance. It is not a claim that the production ecosystem has been deployed or verified.

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
