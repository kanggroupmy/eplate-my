# Verification record — 7 September 2026

## Local results

- Clean dependency install and audit: zero reported vulnerabilities. Next.js 15.5.24 and patched PostCSS 8.5.28 replace vulnerable dependencies. PGlite is a development-only dependency for repeatable SQL tests.
- Lint and strict TypeScript: passed.
- Optimized production build: passed; public landing/blog routes, sitemap and robots are retained.
- `npm test`: 16 focused tests passed, followed by execution of all three migrations and the database security regression scenario.
- Database tests cover draft creation/resumption/deduplication; customer ownership; customer, operator, admin and installer read boundaries; denied public RPC execution; missing, uploaded, rejected and approved documents; prohibited lifecycle jumps; mismatched payment amount; duplicate settlement; paid resubmission; capacity and installation-proof gates; invoice permission; replacement deduplication; outbox lease replay; immutable audit; late payment on a cancelled order.
- Adapter tests cover production fake-mode guards, callback signatures and duplicate fields, authoritative transaction mismatches, safe redirects, upload signatures, CSV formula escaping, Malaysian phone normalization, request origin/size boundaries, PDF escaping and offsets, WhatsApp HMAC and receipt deduplication.
- PDF receipt rendered and visually inspected using synthetic identifiers; no clipping or overlap.
- Browser: 390px customer and installer screens fit without horizontal overflow. Customer resumption and rejection reason visible. Installer screen hides identity-document and payment controls. Desktop admin dashboard/review controls inspected at 1440px.
- HTTP smoke checks: home and sitemap 200; unsigned notification dispatch 401; unconfigured health and private invoice endpoint 503 (fail closed).
- Browser JavaScript bundles contain none of the server credential variable names or secret-key prefix searched. No real identity documents or account records were used in test artifacts.

## Reproduce

Use Node 22.18+ on the 22 LTS line. Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` in `website/`. `npm run test:db` runs the isolated SQL scenario alone. The SQL harness stubs Supabase's auth/storage schemas in embedded PostgreSQL; it is not a complete Supabase service deployment.

The Google Drive workspace stalled on hydration of some existing dependencies. Checks ran against a clean local source copy at `/Users/jkang/.cache/eplate-verification`, excluding `.env*`, `.git`, existing build outputs and uploaded assets. Nothing from a live account was copied or queried.

`tests/ui-fixture.mjs` is a loopback-only visual fixture. Start a production server on 3015 and run it for a synthetic UI on 3016. It substitutes read-only sample operations data; it does not prove real authentication, Storage or payment execution.

## Not verified in production

No migration was applied to a remote database. No real magic link, upload, bill, payment, WhatsApp message, DNS change or deployment was performed. Real Supabase Storage signed-link expiry, SMTP delivery, provider callbacks, concurrent hosted requests, approved templates and production role acceptance remain launch gates in OPERATIONS.md. Local tests are evidence for the implementation, not merchant/Meta acceptance.

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
