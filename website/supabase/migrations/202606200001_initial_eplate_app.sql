create extension if not exists "pgcrypto";

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  whatsapp_phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'operator')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  status text not null default 'draft' check (status in (
    'draft',
    'docs_pending',
    'payment_pending',
    'payment_review',
    'admin_review',
    'submitted_to_jpjeplate',
    'in_production',
    'arrived_workshop',
    'appointment_scheduled',
    'installed',
    'rejected',
    'cancelled'
  )),
  owner_name text not null,
  vehicle_registration text not null,
  chassis_vin text not null,
  vehicle_type_confirmed boolean not null default false,
  workshop_key text not null default 'one_auto_permas_jaya',
  package_price numeric(10,2) not null default 150,
  official_plate_price numeric(10,2) not null default 98,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  document_type text not null check (document_type in ('voc_geran', 'mykad')),
  storage_bucket text not null,
  storage_path text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(10,2) not null,
  method text not null default 'manual_transfer',
  proof_bucket text not null,
  proof_path text not null,
  status text not null default 'pending_review' check (status in ('pending_review', 'verified', 'rejected')),
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  scheduled_at timestamptz not null,
  workshop_key text not null default 'one_auto_permas_jaya',
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  invoice_number text not null unique,
  amount numeric(10,2) not null,
  status text not null default 'issued' check (status in ('draft', 'issued', 'void')),
  storage_bucket text,
  storage_path text,
  issued_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  note text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

create or replace function public.order_belongs_to_current_user(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = target_order_id
      and c.user_id = auth.uid()
  );
$$;

alter table public.customers enable row level security;
alter table public.admin_users enable row level security;
alter table public.orders enable row level security;
alter table public.order_documents enable row level security;
alter table public.payments enable row level security;
alter table public.appointments enable row level security;
alter table public.invoices enable row level security;
alter table public.order_status_events enable row level security;
alter table public.admin_notes enable row level security;
alter table public.site_settings enable row level security;

create policy "customers can read self" on public.customers for select using (user_id = auth.uid() or public.is_admin());
create policy "customers can insert self" on public.customers for insert with check (user_id = auth.uid());
create policy "customers can update self" on public.customers for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admin users can read admin list" on public.admin_users for select using (public.is_admin());

create policy "orders readable by owner or admin" on public.orders for select using (
  public.is_admin() or exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = auth.uid()
  )
);
create policy "customers can create own orders" on public.orders for insert with check (
  exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = auth.uid()
  )
);
create policy "admins can update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "customers can update own draft documents state" on public.orders for update using (
  exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.customers c
    where c.id = customer_id and c.user_id = auth.uid()
  )
);

create policy "documents readable by owner or admin" on public.order_documents for select using (public.is_admin() or public.order_belongs_to_current_user(order_id));
create policy "documents insertable by owner" on public.order_documents for insert with check (public.order_belongs_to_current_user(order_id));
create policy "documents updateable by admin" on public.order_documents for update using (public.is_admin()) with check (public.is_admin());

create policy "payments readable by owner or admin" on public.payments for select using (public.is_admin() or public.order_belongs_to_current_user(order_id));
create policy "payments insertable by owner" on public.payments for insert with check (public.order_belongs_to_current_user(order_id));
create policy "payments updateable by admin" on public.payments for update using (public.is_admin()) with check (public.is_admin());

create policy "appointments readable by owner or admin" on public.appointments for select using (public.is_admin() or public.order_belongs_to_current_user(order_id));
create policy "appointments admin insert" on public.appointments for insert with check (public.is_admin());
create policy "appointments admin update" on public.appointments for update using (public.is_admin()) with check (public.is_admin());

create policy "invoices readable by owner or admin" on public.invoices for select using (public.is_admin() or public.order_belongs_to_current_user(order_id));
create policy "invoices admin insert" on public.invoices for insert with check (public.is_admin());
create policy "invoices admin update" on public.invoices for update using (public.is_admin()) with check (public.is_admin());

create policy "status events readable by owner or admin" on public.order_status_events for select using (public.is_admin() or public.order_belongs_to_current_user(order_id));
create policy "status events insertable by owner or admin" on public.order_status_events for insert with check (public.is_admin() or public.order_belongs_to_current_user(order_id));

create policy "admin notes admin only" on public.admin_notes for all using (public.is_admin()) with check (public.is_admin());
create policy "site settings admin only" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('eplate-documents', 'eplate-documents', false),
  ('eplate-payments', 'eplate-payments', false),
  ('eplate-invoices', 'eplate-invoices', false)
on conflict (id) do nothing;

create policy "document files owner read" on storage.objects for select using (
  bucket_id in ('eplate-documents', 'eplate-payments', 'eplate-invoices')
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "document files owner upload" on storage.objects for insert with check (
  bucket_id in ('eplate-documents', 'eplate-payments')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "invoice files admin upload" on storage.objects for insert with check (
  bucket_id = 'eplate-invoices'
  and public.is_admin()
);

create policy "document files admin update" on storage.objects for update using (public.is_admin()) with check (public.is_admin());
create policy "document files admin delete" on storage.objects for delete using (public.is_admin());

insert into public.site_settings (key, value)
values (
  'workshop',
  '{"name":"One Auto Motoring Sdn. Bhd.","address":"34, Jalan Permas 9/7, Permas Jaya, 81750 Johor Bahru, Johor","map_url":"https://maps.app.goo.gl/BHhva4J4mbhUKzDeA"}'
)
on conflict (key) do update set value = excluded.value, updated_at = now();
