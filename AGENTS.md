# ePlate.my repository

Use `website/` as the canonical application. Read `website/AGENTS.md` and the handoff, ledger and verification documents there before working. Use only `kanggroupmy/eplate-my` and the selected KANG Group Supabase project.

Preserve the root static pages and `apps/order/` history until external data migration and domain cutover are verified. Do not deploy the legacy Worker or enable mock payments in production. The production application is Next.js on Vercel with Supabase Auth/Postgres/private Storage.
