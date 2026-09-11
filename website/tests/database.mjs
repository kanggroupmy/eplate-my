// Isolated PostgreSQL execution with minimal Supabase auth/storage schema stubs.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync,readdirSync } from 'node:fs';
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text); create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security; create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;`);
for(const f of readdirSync(new URL('../supabase/migrations/', import.meta.url)).sort()) { const sql=readFileSync(new URL('../supabase/migrations/'+f, import.meta.url),'utf8').replace('create extension if not exists "pgcrypto";',''); await db.exec(sql); console.log('Applied '+f); }
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'];
for(const id of ids) await db.query('insert into auth.users values($1,$2)',[id,id+'@example.test']);
await db.query("insert into admin_users(user_id,role) values($1,'admin'),($2,'installer')",[ids[2],ids[3]]);
const draft={owner_name:'Test owner',vehicle_registration:'JAB123',chassis_vin:'VIN123456',vehicle_type_confirmed:true,whatsapp_phone:'60123456789'};
async function mutate(actor,action,order,data={}){return (await db.query('select eplate_mutate($1,$2,$3,$4) as result',[actor,action,order,data])).rows[0].result;}
async function denied(fn){try{await fn()}catch{return;}throw Error('Expected denial');}
const order=await mutate(ids[0],'draft',null,draft);
if((await mutate(ids[0],'draft',null,draft)).id!==order.id)throw Error('Duplicate draft');
await mutate(ids[0],'draft',order.id,{...draft,owner_name:'Resumed owner'});
await denied(()=>mutate(ids[1],'draft',order.id,draft));
await denied(()=>mutate(ids[3],'invoice',order.id));
await denied(()=>mutate(ids[0],'transition',order.id,{status:'installed'}));
await mutate(ids[0],'transition',order.id,{status:'docs_pending'});
await denied(()=>mutate(ids[0],'transition',order.id,{status:'payment_pending'}));
for(const type of ['voc_geran','mykad']) {const path=ids[0]+'/'+order.id+'/'+type+'.pdf';await db.query("insert into storage.objects(bucket_id,name) values('eplate-documents',$1)",[path]);await mutate(ids[0],'document',order.id,{document_type:type,storage_path:path,mime_type:'application/pdf',size_bytes:100});}
await denied(()=>mutate(ids[0],'document',order.id,{document_type:'mykad',storage_path:'other/fake',mime_type:'application/pdf',size_bytes:100}));
await mutate(ids[0],'transition',order.id,{status:'payment_pending'});
await db.query('select eplate_reserve_payment($1)',[order.id]);await db.query("select eplate_payment_bill($1,'bill123',150,'toyyibpay')",[order.id]);
await denied(()=>db.query("select eplate_confirm_payment($1,'bill123','txn1',149,'MYR')",[order.id]));
await db.query("select eplate_confirm_payment($1,'bill123','txn1',150,'MYR')",[order.id]);
const duplicate=(await db.query("select eplate_confirm_payment($1,'bill123','txn1',150,'MYR') result",[order.id])).rows[0].result;if(!duplicate.duplicate)throw Error('No idempotency');
const paidCounts=(await db.query("select (select count(*) from payment_events where order_id=$1) settlements,(select count(*) from invoices where order_id=$1) invoices,(select count(*) from notification_outbox where order_id=$1 and event='payment_confirmed') notifications",[order.id])).rows[0];if(Object.values(paidCounts).some(n=>Number(n)!==1))throw Error('Duplicate payment side effects');
await denied(()=>mutate(ids[2],'transition',order.id,{status:'submitted_to_jpjeplate'}));
const docs=(await db.query('select id from order_documents where order_id=$1',[order.id])).rows;for(const d of docs)await mutate(ids[2],'review_document',order.id,{document_id:d.id,status:'approved'});
const rejected=docs[0];await mutate(ids[2],'review_document',order.id,{document_id:rejected.id,status:'rejected',reason:'Unreadable image'});
await mutate(ids[0],'transition',order.id,{status:'payment_pending'});
if((await db.query('select status from orders where id=$1',[order.id])).rows[0].status!=='admin_review')throw Error('Paid resubmission stuck');
await mutate(ids[2],'review_document',order.id,{document_id:rejected.id,status:'approved'});
await mutate(ids[2],'transition',order.id,{status:'submitted_to_jpjeplate'});
await mutate(ids[2],'transition',order.id,{status:'in_production'});await mutate(ids[2],'transition',order.id,{status:'arrived_workshop'});
const slot=await mutate(ids[2],'slot',null,{starts_at:'2099-01-01T01:00:00Z',capacity:1});await mutate(ids[0],'book',order.id,{slot_id:slot.id});
await denied(()=>mutate(ids[3],'transition',order.id,{status:'installed'}));
const path=ids[3]+'/'+order.id+'/proof.jpg';await db.query("insert into storage.objects(bucket_id,name) values('eplate-installations',$1)",[path]);await mutate(ids[3],'proof',order.id,{storage_path:path,matching_confirmed:true});await mutate(ids[3],'transition',order.id,{status:'installed'});
const replacement=await mutate(ids[0],'replacement',order.id);if((await mutate(ids[0],'replacement',order.id)).id!==replacement.id)throw Error('Duplicate replacement');await mutate(ids[2],'invoice',order.id);await denied(()=>mutate(ids[0],'invoice',order.id));
const claimed=(await db.query('select * from eplate_claim_notifications(20)')).rows;const n=claimed[0];await db.query("select eplate_finish_notification($1,$2,null,'RATE_LIMIT',30)",[n.id,n.lease_token]);const again=(await db.query("select eplate_finish_notification($1,$2,'bad',null,30) result",[n.id,n.lease_token])).rows[0];if(again.result)throw Error('Lease replay accepted');
const permanent=claimed[1];await db.query("select eplate_finish_notification($1,$2,null,'PROVIDER_CONFIG',null)",[permanent.id,permanent.lease_token]);if((await db.query('select status from notification_outbox where id=$1',[permanent.id])).rows[0].status!=='failed')throw Error('Permanent send failure retried');
await denied(()=>db.exec('update audit_events set action=\'tampered\''));
const permission=(await db.query("select has_function_privilege('authenticated','public.eplate_mutate(uuid,text,uuid,jsonb)','execute') allowed")).rows[0];if(permission.allowed)throw Error('Public mutation executable');
await db.exec('grant usage on schema public,auth to authenticated; grant select on orders,customers,order_documents to authenticated;');
for(const [id,expected] of [[ids[0],true],[ids[1],false],[ids[3],false],[ids[2],true]]) {await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');const rows=(await db.query('select id from orders where id=$1',[order.id])).rows;const documentRows=(await db.query('select id from order_documents where order_id=$1',[order.id])).rows;await db.exec('reset role');if(Boolean(rows.length)!==expected||Boolean(documentRows.length)!==expected)throw Error('RLS boundary failed '+id);}
await db.query("update admin_users set role='operator' where user_id=$1",[ids[2]]);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[2]]);await db.exec('set role authenticated');if(!(await db.query('select id from order_documents where order_id=$1',[order.id])).rows.length)throw Error('Operator RLS denied');await db.exec('reset role');
const second=await mutate(ids[1],'draft',null,{...draft,vehicle_registration:'JAB999'});await db.query("update orders set status='arrived_workshop' where id=$1",[second.id]);await denied(()=>mutate(ids[1],'book',second.id,{slot_id:slot.id}));
await db.query("update orders set status='payment_pending' where id=$1",[second.id]);await db.query('select eplate_reserve_payment($1)',[second.id]);await db.query("select eplate_payment_bill($1,'bill999',150,'toyyibpay')",[second.id]);await mutate(ids[1],'transition',second.id,{status:'cancelled'});await db.query("select eplate_confirm_payment($1,'bill999','txn999',150,'MYR')",[second.id]);if((await db.query('select status from orders where id=$1',[second.id])).rows[0].status!=='cancelled')throw Error('Late callback regressed order');
console.log('PASS: creation/resumption ownership, installer isolation, missing/uploaded/approved docs, transitions, amount mismatch, duplicate settlement, appointment, proof, invoice permissions, replacement, notification lease replay, immutable audit, service-only RPC');await db.close();
