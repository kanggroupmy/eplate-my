# ePlate.my continuation

The sole authoritative GitHub repository is `kanggroupmy/eplate-my`. Use Supabase through the `kanggroupmy` GitHub identity for `digital@kang-group.com`: KANG Group organization, project `eplate-my-production` (`cyyhtcwbhtxpwrwkquru`). Never reconnect an obsolete repository or substitute a different Supabase project.

Read `docs/HANDOFF.md`, `docs/IMPLEMENTATION_LEDGER.md` and `docs/VERIFICATION.md` before changing the project.

`website/` is the canonical Next.js/Supabase application. Do not reactivate `../order-app/`, restore client-side business writes, rewrite the June migrations, expose private documents, or enable fake providers in production. Preserve the existing uncommitted user work. A limited public release is deployed on Vercel; see docs/HANDOFF.md. No production data migration or transactional service has been verified.

Use Node 22 LTS. Run lint, typecheck, `npm test` (including embedded PostgreSQL migration/security tests) and build. Google Drive hydration can stall existing dependency reads; a clean verification copy excluding all `.env*` exists at `/Users/jkang/.cache/eplate-verification`. Do not assume its contents stay current: compare or refresh changed source files before checking.

Treat provider setup, live data reconciliation, backups, staging acceptance and cutover as explicit launch gates. Never print credentials or identity documents.
