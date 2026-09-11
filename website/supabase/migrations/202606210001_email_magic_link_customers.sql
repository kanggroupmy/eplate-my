alter table public.customers
  add column if not exists email text,
  add column if not exists whatsapp_phone text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'phone'
  ) then
    update public.customers
    set whatsapp_phone = phone
    where whatsapp_phone is null;

    alter table public.customers
      alter column phone drop not null;
  end if;
end $$;

alter table public.customers
  alter column email drop not null,
  alter column whatsapp_phone drop not null;
