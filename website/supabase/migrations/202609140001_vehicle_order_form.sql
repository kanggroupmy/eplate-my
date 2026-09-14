-- Preserve legacy orders; collect vehicle details on new/resumed drafts.
create table public.vehicle_brands(name text primary key);
insert into public.vehicle_brands(name) values ('Audi'),('BMW'),('BYD'),('CAM'),('Chery'),('Denza'),('Dongfeng'),('Eveasy'),('FIAT'),('FORD'),('GAC'),('Genesis'),('Higer'),('Honda'),('Hongqi'),('Hyundai'),('iCAUR'),('JAC'),('Jaecoo'),('Jaguar'),('Jetour'),('KIA'),('Leapmotor'),('Lexus'),('Lotus'),('Mazda'),('Mercedes Benz'),('MG'),('Mini'),('Neta'),('Nissan'),('ORA'),('Perodua'),('Peugeot'),('Polestar'),('Porsche'),('Proton'),('Renault'),('Rolls Royce'),('Seres'),('Smart'),('Suzuki'),('Tesla'),('Togg'),('Toyota'),('Vinfast'),('Volkswagen'),('Volvo'),('Weststar Maxus'),('Wuling'),('XinNeng'),('Xpeng'),('Zeekr');
alter table public.vehicle_brands enable row level security;
revoke all on public.vehicle_brands from anon, authenticated;
grant select on public.vehicle_brands to service_role;
alter table public.orders add column vehicle_brand text references public.vehicle_brands(name);
alter table public.orders add column vehicle_usage text check (vehicle_usage = 'on_the_road');
alter function public.eplate_mutate(uuid,text,uuid,jsonb) rename to eplate_mutate_v1;
create function public.eplate_mutate(p_actor uuid,p_action text,p_order uuid,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
 if p_action='draft' then
  if not exists(select 1 from vehicle_brands where name=p_data->>'vehicle_brand')
     or (p_data->>'vehicle_usage') is distinct from 'on_the_road'
     or (p_data->>'workshop_key') is distinct from 'one_auto_permas_jaya'
  then raise exception 'Select valid vehicle and fitment details'; end if;
 end if;
 result := public.eplate_mutate_v1(p_actor,p_action,p_order,p_data);
 if p_action='draft' then
  update orders set vehicle_brand=p_data->>'vehicle_brand',vehicle_usage='on_the_road',workshop_key='one_auto_permas_jaya'
  where id=(result->>'id')::uuid returning to_jsonb(orders.*) into result;
 elsif p_action='replacement' then
  update orders set vehicle_brand=original.vehicle_brand,vehicle_usage=original.vehicle_usage
  from orders original where orders.id=(result->>'id')::uuid and original.id=p_order
  returning to_jsonb(orders.*) into result;
 end if;
 return result;
end $$;
revoke all on function public.eplate_mutate_v1(uuid,text,uuid,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.eplate_mutate(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.eplate_mutate(uuid,text,uuid,jsonb) to service_role;
