# Supabase setup

1. Create a Supabase project.
2. Apply `migrations/202606200001_initial_eplate_app.sql`.
3. Configure Supabase Auth email magic links:
   - Enable the Email provider.
   - Set Site URL to `http://127.0.0.1:3000` for local development or `https://eplate.my` for production.
   - Add redirect URLs for `http://127.0.0.1:3000/order/` and `https://eplate.my/order/`.
4. Add the first admin after signing in once:

```sql
insert into public.admin_users (user_id, role)
values ('AUTH_USER_UUID_HERE', 'admin');
```

5. Add Vercel environment variables from `.env.example`.

Storage buckets are private. Customer uploads are stored under `auth.uid()/order_id/...` so RLS can enforce owner access.

## Canonical migration update

The instructions above describe the initial setup. Apply **all** unapplied migration files in lexical order, including the September canonical hardening migration. New business writes go through service-only transactional functions after server-side identity validation; do not restore the original browser write policies. The callback allowlist now uses `/auth/callback/` for PKCE, not `/order/`. Read [the current runbook](../docs/OPERATIONS.md) before changing a deployed project. Never run a reset against production.
