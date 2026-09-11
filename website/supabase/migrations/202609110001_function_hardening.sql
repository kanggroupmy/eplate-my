-- Additive hardening after hosted Supabase security review.
alter function public.touch_updated_at() set search_path = pg_catalog;
alter function public.eplate_immutable() set search_path = pg_catalog;

-- Signed-in RLS policies require these boolean ownership helpers. Anonymous
-- callers have no business use for them; do not expose them as public RPCs.
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.order_belongs_to_current_user(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.order_belongs_to_current_user(uuid) to authenticated, service_role;
