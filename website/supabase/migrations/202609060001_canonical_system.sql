-- Additive canonical migration. Apply after both existing migrations; never reset live data.
begin;
alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users add constraint admin_users_role_check check(role in ('admin','operator','installer'));
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check(status in ('draft','docs_pending','payment_pending','payment_review','payment_confirmed','admin_review','submitted_to_jpjeplate','in_production','arrived_workshop','appointment_scheduled','installation_proof_pending','installed','rejected','cancelled'));
alter table public.orders add constraint canonical_positive_prices check(package_price>0 and official_plate_price>0) not valid;
alter table public.payments add constraint canonical_positive_payment check(amount>0) not valid;
alter table public.orders add column if not exists replacement_for uuid references public.orders(id);
alter table public.order_documents add column if not exists rejection_reason text;
alter table public.order_documents add column if not exists mime_type text;
alter table public.order_documents add column if not exists size_bytes bigint;
alter table public.order_documents add column if not exists reviewed_by uuid references auth.users(id);
alter table public.order_documents add column if not exists reviewed_at timestamptz;
alter table public.payments alter column proof_bucket drop not null;
alter table public.payments alter column proof_path drop not null;
alter table public.payments add column if not exists provider_bill_id text;
alter table public.payments add column if not exists provider_reference text;
alter table public.payments add column if not exists currency text not null default 'MYR' check(currency='MYR');
alter table public.payments add column provider_environment text not null default 'live' check(provider_environment in('live','sandbox','fake'));
create unique index payments_provider_bill on public.payments(provider_bill_id) where provider_bill_id is not null;
create unique index payments_provider_reference on public.payments(provider_reference) where provider_reference is not null;
alter table public.order_status_events add column if not exists previous_status text;
alter table public.order_status_events add column if not exists customer_visible boolean not null default true;
alter table public.admin_notes add column if not exists customer_visible boolean not null default false;
create table public.appointment_slots(id uuid primary key default gen_random_uuid(),starts_at timestamptz not null unique,capacity integer not null default 1 check(capacity between 1 and 20),active boolean not null default true);
alter table public.appointments add column if not exists slot_id uuid references public.appointment_slots(id);
alter table public.appointments add column if not exists active boolean not null default true;
-- Legacy appointments remain untouched; only canonical bookings have slot_id.
create unique index appointments_one_active_slot_order on public.appointments(order_id) where active and slot_id is not null;
create table public.installation_proofs(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),installer_id uuid not null references auth.users(id),storage_path text not null unique,matching_confirmed boolean not null check(matching_confirmed),note text,created_at timestamptz not null default now());
create table public.audit_events(id uuid primary key default gen_random_uuid(),order_id uuid references public.orders(id),actor_id uuid references auth.users(id),action text not null,details jsonb not null default '{}',created_at timestamptz not null default now());
create table public.notification_outbox(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),event text not null,dedupe_key text not null unique,status text not null default 'pending' check(status in('pending','processing','sent','failed')),attempts integer not null default 0,next_attempt_at timestamptz not null default now(),locked_at timestamptz,provider_message_id text,last_error text,created_at timestamptz not null default now());
create table public.notification_attempts(id uuid primary key default gen_random_uuid(),outbox_id uuid not null references public.notification_outbox(id),provider_message_id text,error_code text,created_at timestamptz not null default now());
create table public.payment_events(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),provider_reference text not null unique,provider_bill_id text not null,amount numeric(10,2) not null,created_at timestamptz not null default now());
create table public.rate_limits(key text primary key,count integer not null,reset_at timestamptz not null);
create index orders_status_created on public.orders(status,created_at desc);
create index orders_customer_created on public.orders(customer_id,created_at desc);
create index docs_order on public.order_documents(order_id);
create index audit_order on public.audit_events(order_id,created_at);
create index outbox_pending on public.notification_outbox(status,next_attempt_at);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admin_users where user_id=auth.uid() and role in('admin','operator')); $$;
-- Remove all legacy business write policies, including owner mutation of status/price.
do $$ declare r record; begin for r in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename in ('customers','admin_users','orders','order_documents','payments','appointments','invoices','order_status_events','admin_notes','site_settings') and cmd<>'SELECT' loop execute format('drop policy %I on %I.%I',r.policyname,r.schemaname,r.tablename); end loop; end $$;
revoke insert,update,delete,truncate,references,trigger on public.customers,public.admin_users,public.orders,public.order_documents,public.payments,public.appointments,public.invoices,public.order_status_events,public.admin_notes,public.site_settings from anon,authenticated;
drop policy if exists "document files owner read" on storage.objects;
drop policy if exists "document files owner upload" on storage.objects;
drop policy if exists "invoice files admin upload" on storage.objects;
drop policy if exists "document files admin update" on storage.objects;
drop policy if exists "document files admin delete" on storage.objects;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('eplate-installations','eplate-installations',false,4194304,array['image/jpeg','image/png']) on conflict(id) do nothing;
update storage.buckets set public=false,file_size_limit=4194304,allowed_mime_types=array['image/jpeg','image/png','application/pdf'] where id in('eplate-documents','eplate-payments','eplate-invoices');
update storage.buckets set public=false,file_size_limit=4194304,allowed_mime_types=array['image/jpeg','image/png'] where id='eplate-installations';
do $$ declare t text; begin foreach t in array array['appointment_slots','installation_proofs','audit_events','notification_outbox','notification_attempts','payment_events','rate_limits'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on public.%I from anon,authenticated',t); execute format('grant all on public.%I to service_role',t); end loop; end $$;
create or replace function public.eplate_immutable() returns trigger language plpgsql as $$ begin raise exception 'Audit records are immutable'; end $$;
create trigger immutable_audit before update or delete on public.audit_events for each row execute function public.eplate_immutable();
create trigger immutable_history before update or delete on public.order_status_events for each row execute function public.eplate_immutable();
create trigger immutable_payment_events before update or delete on public.payment_events for each row execute function public.eplate_immutable();
create or replace function public.eplate_event(p_order uuid,p_actor uuid,p_action text,p_details jsonb default '{}') returns void language plpgsql security definer set search_path=public as $$ begin insert into audit_events(order_id,actor_id,action,details) values(p_order,p_actor,p_action,p_details); end $$;
create or replace function public.eplate_transition(p_order uuid,p_actor uuid,p_status text,p_note text default null,p_correction boolean default false) returns void language plpgsql security definer set search_path=public as $$
declare o orders; r text; allowed boolean; ev uuid; begin
select * into strict o from orders where id=p_order for update;
select role into r from admin_users where user_id=p_actor;
if p_actor is null then r:='provider'; elsif r is null then if not exists(select 1 from customers where id=o.customer_id and user_id=p_actor) then raise exception 'Forbidden'; end if; r:='customer'; end if;
if (p_status='rejected' or (o.status='admin_review' and p_status='docs_pending')) and length(trim(coalesce(p_note,'')))<3 then raise exception 'Customer-visible reason required'; end if;
allowed:=case o.status when 'draft' then p_status in('docs_pending','cancelled') when 'docs_pending' then p_status in('payment_pending','admin_review','rejected','cancelled') when 'payment_pending' then p_status in('payment_review','payment_confirmed','cancelled') when 'payment_review' then p_status in('payment_confirmed','cancelled') when 'payment_confirmed' then p_status='admin_review' when 'admin_review' then p_status in('submitted_to_jpjeplate','docs_pending','rejected','cancelled') when 'submitted_to_jpjeplate' then p_status='in_production' when 'in_production' then p_status='arrived_workshop' when 'arrived_workshop' then p_status='appointment_scheduled' when 'appointment_scheduled' then p_status='installation_proof_pending' when 'installation_proof_pending' then p_status='installed' when 'rejected' then p_status in('docs_pending','cancelled') else false end;
if p_correction then if r<>'admin' or length(trim(coalesce(p_note,'')))<10 then raise exception 'Admin correction requires a reason'; end if;
elsif not allowed or (r='customer' and not((o.status in('draft','docs_pending','rejected') and p_status in('docs_pending','payment_pending','admin_review','cancelled')) or (o.status in('payment_pending','payment_review') and p_status='cancelled') or (o.status='arrived_workshop' and p_status='appointment_scheduled'))) or (r='installer' and p_status not in('installation_proof_pending','installed')) or (r='provider' and p_status not in('payment_confirmed','admin_review')) then raise exception 'Forbidden transition'; end if;
if p_status in('payment_confirmed','admin_review','submitted_to_jpjeplate','in_production','arrived_workshop','appointment_scheduled','installation_proof_pending','installed') and not exists(select 1 from payments where order_id=p_order and status='verified' and amount=o.package_price) then raise exception 'Verified payment required'; end if;
if p_status='submitted_to_jpjeplate' and (select count(*) from (select distinct on(document_type) document_type,status from order_documents where order_id=p_order order by document_type,created_at desc,id desc) latest where document_type in('voc_geran','mykad') and status='approved')<>2 then raise exception 'Approved documents required'; end if;
if p_status='installed' and not exists(select 1 from installation_proofs where order_id=p_order) then raise exception 'Installation evidence required'; end if;
if p_status='payment_pending' and (select count(distinct document_type) from order_documents where order_id=p_order and document_type in('voc_geran','mykad'))<>2 then raise exception 'Required documents missing'; end if;
if p_status='appointment_scheduled' and not exists(select 1 from appointments where order_id=p_order and active and slot_id is not null) then raise exception 'Appointment required'; end if;
update orders set status=p_status where id=p_order;
insert into order_status_events(order_id,status,previous_status,note,created_by) values(p_order,p_status,o.status,p_note,p_actor) returning id into ev;
perform eplate_event(p_order,p_actor,case when p_correction then 'status_correction' else 'status_transition' end,jsonb_build_object('from',o.status,'to',p_status,'reason',p_note));
if p_status in('docs_pending','payment_confirmed','submitted_to_jpjeplate','arrived_workshop','appointment_scheduled','installed','rejected') then insert into notification_outbox(order_id,event,dedupe_key) values(p_order,case p_status when 'docs_pending' then case when o.status='draft' then 'order_received' else 'documents_required' end when 'rejected' then 'documents_required' when 'submitted_to_jpjeplate' then 'submitted_for_production' when 'arrived_workshop' then 'plate_arrived' when 'appointment_scheduled' then 'appointment_confirmed' when 'installed' then 'installation_completed' else p_status end,ev::text); end if;
end $$;
create policy "slots signed in read" on public.appointment_slots for select to authenticated using(active);
grant select on public.appointment_slots to authenticated;
create policy "visible notes" on public.admin_notes for select using(public.is_admin() or (customer_visible and public.order_belongs_to_current_user(order_id)));
drop policy "status events readable by owner or admin" on public.order_status_events;
create policy "visible history" on public.order_status_events for select using(public.is_admin() or (customer_visible and public.order_belongs_to_current_user(order_id)));
create or replace function public.eplate_mutate(p_actor uuid,p_action text,p_order uuid default null,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path=public as $$
declare o orders; r text; c uuid; result jsonb; d order_documents; s appointment_slots; path text; bucket text; n integer; begin
if p_actor is null or not exists(select 1 from auth.users where id=p_actor) then raise exception 'Unauthenticated'; end if;
select role into r from admin_users where user_id=p_actor; r:=coalesce(r,'customer');
if jsonb_typeof(p_data)<>'object' or length(p_data::text)>12000 then raise exception 'Invalid data'; end if;
if p_action='slot' then
 if r not in('admin','operator') then raise exception 'Forbidden'; end if;
 if p_data ? 'slot_id' then update appointment_slots set active=coalesce((p_data->>'active')::boolean,true) where id=(p_data->>'slot_id')::uuid returning to_jsonb(appointment_slots.*) into result;
 else if (p_data->>'starts_at')::timestamptz<=now() then raise exception 'Choose a future slot'; end if; insert into appointment_slots(starts_at,capacity) values((p_data->>'starts_at')::timestamptz,coalesce((p_data->>'capacity')::integer,1)) returning to_jsonb(appointment_slots.*) into result; end if;
 perform eplate_event(null,p_actor,'slot_changed',jsonb_build_object('slot_id',result->>'id')); return result;
end if;
if p_order is not null then
 select * into strict o from orders where id=p_order for update;
 if r='customer' and not exists(select 1 from customers where id=o.customer_id and user_id=p_actor) then raise exception 'Forbidden'; end if;
 if r='installer' and (p_action not in('proof','transition') or o.status not in('appointment_scheduled','installation_proof_pending')) then raise exception 'Forbidden'; end if;
end if;
if p_action='draft' then
 if r='installer' or (p_order is not null and o.status not in('draft','docs_pending','rejected')) then raise exception 'Forbidden'; end if;
 if length(trim(coalesce(p_data->>'owner_name',''))) not between 2 and 150 or coalesce(p_data->>'vehicle_registration','') !~ '^[A-Za-z0-9 ]{2,20}$' or coalesce(p_data->>'chassis_vin','') !~ '^[A-Za-z0-9-]{5,40}$' or coalesce(p_data->>'whatsapp_phone','') !~ '^60[0-9]{8,11}$' or coalesce((p_data->>'vehicle_type_confirmed')::boolean,false)=false then raise exception 'Complete required fields'; end if;
 if p_order is null then
 insert into customers(user_id,email,whatsapp_phone) select id,email,p_data->>'whatsapp_phone' from auth.users where id=p_actor on conflict(user_id) do update set whatsapp_phone=excluded.whatsapp_phone returning id into c;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text,0));
 select * into o from orders where customer_id=c and status='draft' and vehicle_registration=upper(p_data->>'vehicle_registration') and chassis_vin=upper(p_data->>'chassis_vin') order by created_at desc limit 1;
 if found then return to_jsonb(o); end if;
 insert into orders(customer_id,owner_name,vehicle_registration,chassis_vin,vehicle_type_confirmed,package_price) values(c,trim(p_data->>'owner_name'),upper(p_data->>'vehicle_registration'),upper(p_data->>'chassis_vin'),true,150) returning * into o;
 else update orders set owner_name=trim(p_data->>'owner_name'),vehicle_registration=upper(p_data->>'vehicle_registration'),chassis_vin=upper(p_data->>'chassis_vin'),vehicle_type_confirmed=true where id=p_order returning * into o;
 update customers set whatsapp_phone=p_data->>'whatsapp_phone' where id=o.customer_id; end if;
 perform eplate_event(o.id,p_actor,'draft_saved'); return to_jsonb(o);
end if;
if p_order is null then raise exception 'Order required'; end if;
case p_action
when 'transition' then perform eplate_transition(p_order,p_actor,case when p_data->>'status'='payment_pending' and o.status='docs_pending' and exists(select 1 from payments where order_id=p_order and status='verified' and amount=o.package_price) then 'admin_review' else p_data->>'status' end,p_data->>'note',coalesce((p_data->>'correction')::boolean,false));
when 'document' then
 if o.status not in('draft','docs_pending','rejected','payment_pending','admin_review') then raise exception 'Documents locked'; end if;
 path:=p_data->>'storage_path';
 if path not like p_actor::text||'/'||p_order::text||'/%' or not exists(select 1 from storage.objects where bucket_id='eplate-documents' and name=path) or coalesce((p_data->>'size_bytes')::bigint,0) not between 10 and 4194304 or coalesce(p_data->>'mime_type','') not in('application/pdf','image/jpeg','image/png') then raise exception 'Invalid upload'; end if;
 insert into order_documents(order_id,document_type,storage_bucket,storage_path,mime_type,size_bytes) values(p_order,p_data->>'document_type','eplate-documents',path,p_data->>'mime_type',(p_data->>'size_bytes')::bigint);
when 'review_document' then
 if r not in('admin','operator') or p_data->>'status' not in('approved','rejected') then raise exception 'Forbidden'; end if;
 if p_data->>'status'='rejected' and length(trim(coalesce(p_data->>'reason','')))<3 then raise exception 'Reason required'; end if;
 select * into strict d from order_documents where id=(p_data->>'document_id')::uuid and order_id=p_order for update;
 update order_documents set status=p_data->>'status',rejection_reason=left(p_data->>'reason',2000),reviewed_by=p_actor,reviewed_at=now() where id=d.id;
 if p_data->>'status'='rejected' then if o.status='admin_review' then perform eplate_transition(p_order,p_actor,'docs_pending',p_data->>'reason'); else insert into notification_outbox(order_id,event,dedupe_key) values(p_order,'documents_required',gen_random_uuid()::text); end if; end if;
when 'note' then
 if r not in('admin','operator') or length(trim(coalesce(p_data->>'note',''))) not between 1 and 2000 then raise exception 'Forbidden or invalid note'; end if;
 insert into admin_notes(order_id,note,created_by,customer_visible) values(p_order,p_data->>'note',p_actor,coalesce((p_data->>'customer_visible')::boolean,false));
when 'book' then
 if r='installer' or o.status not in('arrived_workshop','appointment_scheduled') then raise exception 'Booking unavailable'; end if;
 select * into strict s from appointment_slots where id=(p_data->>'slot_id')::uuid and active and starts_at>now() for update;
 select count(*) into n from appointments where slot_id=s.id and active and order_id<>p_order;
 if n>=s.capacity then raise exception 'Slot full'; end if;
 update appointments set active=false where order_id=p_order and active;
 insert into appointments(order_id,slot_id,scheduled_at,created_by) values(p_order,s.id,s.starts_at,p_actor);
 if o.status='arrived_workshop' then perform eplate_transition(p_order,p_actor,'appointment_scheduled'); else insert into notification_outbox(order_id,event,dedupe_key) values(p_order,'appointment_changed',gen_random_uuid()::text); end if;
when 'proof' then
 if r not in('installer','admin','operator') or o.status not in('appointment_scheduled','installation_proof_pending') or coalesce((p_data->>'matching_confirmed')::boolean,false)=false then raise exception 'Installation unavailable'; end if;
 path:=p_data->>'storage_path';
 if path not like p_actor::text||'/'||p_order::text||'/%' or not exists(select 1 from storage.objects where bucket_id='eplate-installations' and name=path) then raise exception 'Invalid evidence'; end if;
 insert into installation_proofs(order_id,installer_id,storage_path,matching_confirmed,note) values(p_order,p_actor,path,true,left(p_data->>'note',2000));
 if o.status='appointment_scheduled' then perform eplate_transition(p_order,p_actor,'installation_proof_pending'); end if;
when 'invoice' then
 if r not in('admin','operator') then raise exception 'Forbidden'; end if;
 select to_jsonb(i) into result from invoices i where order_id=p_order and status='issued' limit 1;
 if result is null then insert into invoices(order_id,invoice_number,amount,issued_by) values(p_order,'EP-'||upper(replace(p_order::text,'-','')),o.package_price,p_actor) returning to_jsonb(invoices.*) into result; end if;
when 'replacement' then
 if r='installer' or o.status<>'installed' then raise exception 'Replacement unavailable'; end if;
 select to_jsonb(x) into result from orders x where replacement_for=o.id and status not in('installed','cancelled') order by created_at desc limit 1;
 if result is not null then return result; end if;
 insert into orders(customer_id,owner_name,vehicle_registration,chassis_vin,vehicle_type_confirmed,replacement_for,package_price) values(o.customer_id,o.owner_name,o.vehicle_registration,o.chassis_vin,o.vehicle_type_confirmed,o.id,150) returning to_jsonb(orders.*) into result;
else raise exception 'Unknown action'; end case;
perform eplate_event(p_order,p_actor,p_action,jsonb_build_object('record_id',coalesce(result->>'id',p_data->>'document_id')));
if result is null then select to_jsonb(x) into result from orders x where id=p_order; end if; return result;
end $$;
create or replace function public.eplate_reserve_payment(p_order uuid) returns jsonb language plpgsql security definer set search_path=public as $$ declare o orders; p payments; begin
select * into strict o from orders where id=p_order for update;
if o.status not in('payment_pending','payment_review') then raise exception 'Payment unavailable'; end if;
select * into p from payments where order_id=p_order and method in('toyyibpay','local_fake') order by created_at desc limit 1;
if found then return jsonb_build_object('created',false,'payment',to_jsonb(p)); end if;
insert into payments(order_id,amount,method) values(p_order,o.package_price,'toyyibpay') returning * into p;
return jsonb_build_object('created',true,'payment',to_jsonb(p)); end $$;
create or replace function public.eplate_payment_bill(p_order uuid,p_bill text,p_amount numeric,p_provider text,p_environment text default 'live') returns void language plpgsql security definer set search_path=public as $$ declare o orders; begin
select * into strict o from orders where id=p_order for update;
if p_environment not in('live','sandbox','fake') or (p_provider='local_fake')<>(p_environment='fake') or p_provider not in('toyyibpay','local_fake') or p_amount<>o.package_price or p_bill !~ '^[A-Za-z0-9_-]{5,100}$' then raise exception 'Invalid bill'; end if;
update payments set provider_bill_id=p_bill,method=p_provider,provider_environment=p_environment where order_id=p_order and method='toyyibpay' and provider_bill_id is null and status='pending_review';
if not found then raise exception 'Payment reservation unavailable'; end if;
perform eplate_event(p_order,null,'payment_bill_created',jsonb_build_object('bill',p_bill)); end $$;
create or replace function public.eplate_confirm_payment(p_order uuid,p_bill text,p_reference text,p_amount numeric,p_currency text) returns jsonb language plpgsql security definer set search_path=public as $$ declare o orders; p payments; e payment_events; begin
select * into strict o from orders where id=p_order for update;
select * into strict p from payments where order_id=p_order and provider_bill_id=p_bill for update;
if p_currency<>'MYR' or p_amount<>o.package_price or p_amount<>p.amount or length(coalesce(p_reference,'')) not between 1 and 200 then raise exception 'Payment mismatch'; end if;
select * into e from payment_events where provider_reference=p_reference;
if found then if e.order_id<>p_order or e.provider_bill_id<>p_bill or e.amount<>p_amount then raise exception 'Reference conflict'; end if; return jsonb_build_object('duplicate',true); end if;
if p.status='verified' then raise exception 'Additional settlement requires reconciliation'; end if;
insert into payment_events(order_id,provider_reference,provider_bill_id,amount) values(p_order,p_reference,p_bill,p_amount);
update payments set status='verified',provider_reference=p_reference,verified_at=now() where id=p.id;
insert into invoices(order_id,invoice_number,amount) select p_order,'EP-'||upper(replace(p_order::text,'-','')),o.package_price where not exists(select 1 from invoices where order_id=p_order and status='issued');
perform eplate_event(p_order,null,'payment_verified',jsonb_build_object('reference',p_reference));
if o.status in('payment_pending','payment_review') then perform eplate_transition(p_order,null,'payment_confirmed'); perform eplate_transition(p_order,null,'admin_review'); end if;
return jsonb_build_object('duplicate',false); end $$;
create or replace function public.eplate_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$ declare n integer; begin
if p_limit<1 or p_seconds not between 1 and 86400 or length(p_key)>200 then raise exception 'Invalid limiter'; end if;
insert into rate_limits(key,count,reset_at) values(p_key,1,now()+make_interval(secs=>p_seconds)) on conflict(key) do update set count=case when rate_limits.reset_at<=now() then 1 else rate_limits.count+1 end,reset_at=case when rate_limits.reset_at<=now() then excluded.reset_at else rate_limits.reset_at end returning count into n;
return n<=p_limit; end $$;
alter table public.notification_outbox add column lease_token uuid;
create or replace function public.eplate_claim_notifications(p_limit integer default 20) returns setof public.notification_outbox language plpgsql security definer set search_path=public as $$ begin
update notification_outbox set status='failed',last_error='SEND_UNCERTAIN',lease_token=null where status='processing' and locked_at<now()-interval '10 minutes';
return query with candidates as(select id from notification_outbox where status='pending' and next_attempt_at<=now() order by created_at for update skip locked limit greatest(1,least(p_limit,100))) update notification_outbox n set status='processing',attempts=n.attempts+1,locked_at=now(),lease_token=gen_random_uuid() from candidates c where n.id=c.id returning n.*; end $$;
create or replace function public.eplate_finish_notification(p_id uuid,p_lease uuid,p_message text,p_error text,p_retry_seconds integer default 60) returns boolean language plpgsql security definer set search_path=public as $$ declare n notification_outbox; begin
select * into n from notification_outbox where id=p_id and lease_token=p_lease and status='processing' for update;
if not found then return false; end if;
insert into notification_attempts(outbox_id,provider_message_id,error_code) values(p_id,p_message,left(p_error,100));
update notification_outbox set status=case when p_message is not null then 'sent' when n.attempts>=8 or p_retry_seconds is null or p_error='SEND_UNCERTAIN' then 'failed' else 'pending' end,provider_message_id=p_message,last_error=left(p_error,100),next_attempt_at=now()+make_interval(secs=>greatest(30,least(p_retry_seconds,86400))),lease_token=null,locked_at=null where id=p_id;
return true; end $$;
create table public.notification_delivery_events(id text primary key,outbox_id uuid not null references public.notification_outbox(id),provider_message_id text not null,status text not null check(status in('sent','delivered','read','failed')),provider_timestamp timestamptz not null,created_at timestamptz not null default now());
alter table public.notification_delivery_events enable row level security;
revoke all on public.notification_delivery_events from anon,authenticated;
create trigger immutable_delivery_events before update or delete on public.notification_delivery_events for each row execute function public.eplate_immutable();
-- RPCs trust an actor verified by the server. They must never be directly callable by users.
do $$ declare f record; begin for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'eplate_%' loop execute format('revoke all on function %s from public,anon,authenticated',f.signature); execute format('grant execute on function %s to service_role',f.signature); end loop; end $$;
grant all on all tables in schema public to service_role;
commit;
