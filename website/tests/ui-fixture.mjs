// Local visual acceptance fixture only. Does not exercise real Auth/provider APIs.
// node tests/ui-fixture.mjs; visit http://127.0.0.1:3016/order/?previewRole=customer
import http from 'node:http';
const id='11111111-1111-4111-8111-111111111111';
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:3016');
 const requested=url.searchParams.get('previewRole');
 const role=['customer','admin','installer'].includes(requested)?requested:(/previewRole=(customer|admin|installer)/.exec(req.headers.cookie||'')?.[1]||'customer');
 if(requested)res.setHeader('Set-Cookie',`previewRole=${role}; Path=/; HttpOnly; SameSite=Lax`);
 if(url.pathname.startsWith('/api/operations')){
  const status=role==='installer'?'appointment_scheduled':role==='admin'?'admin_review':'docs_pending';
  const order={id,status,owner_name:'Synthetic Test Owner',vehicle_registration:'JTEST123',chassis_vin:'TESTVIN123456',package_price:150,created_at:'2026-09-06T01:00:00Z',customers:{email:'test@example.test',whatsapp_phone:'60123456789'},order_documents:[{id:'22222222-2222-4222-8222-222222222222',document_type:'mykad',status:'rejected',rejection_reason:'Please upload a clearer image.'}],payments:[],invoices:[],appointments:[{id:'a',scheduled_at:'2026-09-10T01:00:00Z',active:true}],order_status_events:[{id:'e',status:'docs_pending',note:'Please complete your documents.',created_at:'2026-09-06T01:00:00Z'}]};
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(url.searchParams.has('id')?{role,order,slots:[],notes:[],audit:[{id:'audit',action:'draft_saved',created_at:order.created_at}],notifications:[]}:{role,orders:[order],count:1,counts:{[status]:1}}));return;
 }
 const target=new URL(url.pathname+url.search,'http://127.0.0.1:3015');
 try{const upstream=await fetch(target,{redirect:'manual'});res.statusCode=upstream.status;for(const [k,v]of upstream.headers)if(!['transfer-encoding','content-encoding','content-length','set-cookie'].includes(k))res.setHeader(k,v);res.end(Buffer.from(await upstream.arrayBuffer()));}catch{res.statusCode=502;res.end('Local application unavailable');}
}).listen(3016,'127.0.0.1',()=>console.log('Synthetic visual fixture at http://127.0.0.1:3016'));
