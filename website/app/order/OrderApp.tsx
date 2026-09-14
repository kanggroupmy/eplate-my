"use client";
import { useCallback, useEffect, useState } from "react";
import { ORDER_STATUSES, PRICE_MYR, STATUS_LABELS, canTransition, formatMYR, TIME_ZONE, type AppRole, type CanonicalOrderStatus } from "@/lib/domain";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { site } from "@/data/site";
import { VehicleOrderForm } from './VehicleOrderForm';
type Row = {
    id: string;
    status: CanonicalOrderStatus;
    owner_name: string;
    vehicle_registration: string;
    chassis_vin?: string;
    vehicle_brand?: string;
    package_price?: number;
    customers?: {
        email: string;
        whatsapp_phone: string;
    };
    created_at: string;
    order_documents?: {
        id: string;
        document_type: string;
        status: string;
        rejection_reason?: string;
    }[];
    payments?: {
        id: string;
        amount: number;
        status: string;
    }[];
    invoices?: {
        id: string;
        invoice_number: string;
    }[];
    appointments?: {
        id: string;
        scheduled_at: string;
        active: boolean;
    }[];
    order_status_events?: {
        id: string;
        status: CanonicalOrderStatus;
        note: string;
        created_at: string;
    }[];
};
type Detail = {
    proofs?: {
        id: string;
        created_at: string;
        note: string;
        matching_confirmed: boolean;
    }[];
    role: AppRole;
    order: Row;
    slots?: {
        id: string;
        starts_at: string;
    }[];
    notes?: {
        id: string;
        note: string;
        created_at: string;
    }[];
    audit?: {
        id: string;
        action: string;
        created_at: string;
    }[];
    notifications?: {
        id: string;
        event: string;
        status: string;
        attempts: number;
        last_error?: string;
    }[];
};
const date = (value: string) => new Date(value).toLocaleString('en-MY', { timeZone: TIME_ZONE });
async function request(path: string, init?: RequestInit) { const response = await fetch(path, init); const body = await response.json(); if (!response.ok)
    throw new Error(body.error || 'Unable to complete request.'); return body; }
export function OrderApp({ mode = 'customer', initialId = '' }: {
    mode?: 'customer' | 'admin' | 'installer';
    initialId?: string;
}) {
    const [role, setRole] = useState<AppRole>('customer'), [orders, setOrders] = useState<Row[]>([]), [detail, setDetail] = useState<Detail | null>(null), [selected, setSelected] = useState(initialId), [message, setMessage] = useState(''), [signedIn, setSignedIn] = useState(false), [busy, setBusy] = useState(false), [page, setPage] = useState(0), [count, setCount] = useState(0), [counts, setCounts] = useState<Record<string, number>>({}), [search, setSearch] = useState(''), [filter, setFilter] = useState('');
    const load = useCallback(async () => { try {
        const body = await request(`/api/operations?q=${encodeURIComponent(search)}&status=${filter}&page=${page}`);
        setSignedIn(true);
        setRole(body.role);
        setOrders(body.orders || []);
        setCount(body.count || 0);
        setCounts(body.counts || {});
        if (selected)
            setDetail(await request(`/api/operations?id=${selected}`));
        else setDetail(null);
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Unable to load orders.');
    } }, [search, filter, page, selected]);
    useEffect(() => { const returned = new URLSearchParams(window.location.search).get('order'); if (returned && /^[0-9a-f-]{36}$/i.test(returned))
        setSelected(returned); }, []);
    useEffect(() => { void load(); }, [load]);
    async function run(work: () => Promise<unknown>) { setBusy(true); setMessage(''); try {
        await work();
        setMessage('Saved.');
        await load();
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Please try again.');
    }
    finally {
        setBusy(false);
    } }
    async function action(name: string, data: Record<string, unknown>, id: string | null = selected || null) { const body = await request('/api/operations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: name, orderId: id, data }) }); if (body.result?.id && (name === 'draft' || name === 'replacement'))
        setSelected(body.result.id); return body; }
    const staff = role === 'admin' || role === 'operator';
    const order = detail?.order;
    const editableOrder = order && ['draft', 'docs_pending', 'rejected'].includes(order.status) ? order : undefined;
    function formAction(name: string, form: HTMLFormElement) { const values = Object.fromEntries(new FormData(form)); void run(() => action(name, values)); }
    async function upload(form: HTMLFormElement) { const data = new FormData(form); data.set('orderId', selected); await request('/api/operations/upload', { method: 'POST', body: data }); form.reset(); }
    if (!signedIn)
        return <div className="panel"><h2>Sign in securely</h2><p>We will email a link to access your orders.</p><form onSubmit={e => { e.preventDefault(); const email = new FormData(e.currentTarget).get('email'); setBusy(true); setMessage(''); void request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).then(() => setMessage('Check your email for your sign-in link.')).catch(e => setMessage(e instanceof Error ? e.message : 'Unable to send sign-in link.')).finally(() => setBusy(false)); }}><label className="field">Email address<input name="email" type="email" autoComplete="email" required/></label><button className="btn" disabled={busy}>Send sign-in link</button></form><p role="status">{message}</p><p>Prepare VOC/geran and MyKad. Pay securely through ToyyibPay. Installation: {site.workshop.name}.</p></div>;
    if ((mode === 'admin' && !staff) || (mode === 'installer' && role !== 'installer' && !staff))
        return <p className="notice">Your account does not have access to this workspace.</p>;
    return <div><button className="btn-light" disabled={busy} onClick={() => void run(async () => { const client = createSupabaseBrowserClient(); if (!client)
        throw new Error("Sign out unavailable."); const { error } = await client.auth.signOut(); if (error)
        throw new Error("Unable to sign out. Please try again."); setSignedIn(false); setOrders([]); setDetail(null); setSelected(''); window.location.assign('/order'); })}>Sign out</button><p role="status" aria-live="polite" className="notice">{message || 'Your information is stored securely.'}</p><div className="panel"><h2>{mode === 'customer' ? 'Your orders' : 'Find orders'}</h2><label className="field">Search by {role === 'installer' ? 'exact plate or full order number' : 'order number, plate, owner, email or phone'}<input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}/></label>{role !== 'installer' && <label className="field">Status<select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="">All statuses</option>{ORDER_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label>}{staff && <div className="grid">{ORDER_STATUSES.filter(s => counts[s]).map(s => <button className="btn-light" key={s} onClick={() => { setFilter(s); setPage(0); }}>{STATUS_LABELS[s]}: {counts[s]}</button>)}</div>}<p>{count} matching orders</p>{staff && <a className="btn-light" href={`/api/operations/export?q=${encodeURIComponent(search)}&status=${filter}`}>Download CSV (up to 1,000 orders)</a>}<div className="grid">{orders.map(o => <button className="btn-light" key={o.id} onClick={() => setSelected(o.id)}>{o.vehicle_registration || 'Draft'} · {STATUS_LABELS[o.status]}<br /><small>{o.id}</small></button>)}</div>{!orders.length && <p>No matching orders. {role === 'installer' ? 'Enter the exact plate or full order number.' : 'Create a new order below.'}</p>}<button disabled={!page} onClick={() => setPage(page - 1)}>Previous</button> <button disabled={(page + 1) * 25 >= count} onClick={() => setPage(page + 1)}>Next</button></div>
 {mode === 'customer' && role === 'customer' && <div className="panel"><h2>{editableOrder ? 'Resume order' : 'New order'}</h2><p>{formatMYR(PRICE_MYR)} installed package</p><VehicleOrderForm key={editableOrder?.id || 'new'} order={editableOrder} busy={busy} reset={() => { setSelected(''); setDetail(null); }} save={async (data, file) => { await run(async () => { if (file && file.size > 4 * 1024 * 1024) throw new Error('Choose a VOC smaller than 4 MB.'); const saved = await action('draft', data, editableOrder?.id || null); if (file) { const uploadData = new FormData(); uploadData.set('orderId', saved.result.id); uploadData.set('type', 'voc_geran'); uploadData.set('file', file); await request('/api/operations/upload', { method: 'POST', body: uploadData }); } }); }}/></div>}
 {order && <><section className="panel"><h2>{order.vehicle_registration} · {STATUS_LABELS[order.status]}</h2><p>Order {order.id}<br />Owner: {order.owner_name}</p>{role !== 'installer' && <p>{order.customers?.email}<br />{order.customers?.whatsapp_phone}<br />VIN: {order.chassis_vin}</p>}
 {ORDER_STATUSES.filter(s => !staff && canTransition(order.status, s, role) && !['payment_confirmed', 'admin_review', 'appointment_scheduled', 'installed'].includes(s)).map(s => <button key={s} className="btn-light" disabled={busy} onClick={() => void run(() => action('transition', { status: s }))}>{s === 'docs_pending' ? (order.status === 'rejected' ? 'Resubmit documents' : 'Submit order') : s === 'payment_pending' ? (order.payments?.some(p => p.status === 'verified') ? 'Resubmit documents' : 'Continue to payment') : s === 'cancelled' ? 'Cancel order' : STATUS_LABELS[s]}</button>)}
 {staff && <form onSubmit={e => { e.preventDefault(); formAction('transition', e.currentTarget); }}><h3>Change status</h3><label className="field">Status<select name="status">{ORDER_STATUSES.filter(s => canTransition(order.status, s, role)).map(s => <option value={s} key={s}>{STATUS_LABELS[s]}</option>)}</select></label><label className="field">Customer-visible reason<textarea name="note" required maxLength={2000}/></label><button disabled={busy}>Save status</button></form>}
 {role === 'admin' && <form onSubmit={e => { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); void run(() => action('transition', { ...values, correction: true })); }}><h3>Documented correction</h3><label className="field">Corrected status<select name="status">{ORDER_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label><label className="field">Reason (at least 10 characters)<textarea name="note" required minLength={10} maxLength={2000}/></label><button disabled={busy}>Record correction</button></form>}</section>
 {role !== 'installer' && <section className="panel"><h3>Documents</h3><p>JPG, PNG or PDF, up to 4 MB each.</p>{['voc_geran', 'mykad'].map(type => <div key={type}><h4>{type === 'mykad' ? 'MyKad' : 'VOC / geran'}</h4>{(order.order_documents || []).filter(d => d.document_type === type).map(d => <div key={d.id}><a href={`/api/operations/document?id=${d.id}`}>View document</a> · {d.status}<p>{d.rejection_reason}</p>{staff && <form onSubmit={e => { e.preventDefault(); formAction('review_document', e.currentTarget); }}><input type="hidden" name="document_id" value={d.id}/><label>Decision<select name="status"><option value="approved">Approve</option><option value="rejected">Reject</option></select></label><label className="field">Reason<input name="reason" maxLength={2000}/></label><button disabled={busy}>Review</button></form>}</div>)}{['draft', 'docs_pending', 'rejected', 'payment_pending', 'admin_review'].includes(order.status) && <form onSubmit={e => { e.preventDefault(); const form = e.currentTarget; void run(() => upload(form)); }}><input type="hidden" name="type" value={type}/><label className="field">Upload {type === 'mykad' ? 'MyKad' : 'VOC / geran'}<input type="file" name="file" accept="image/jpeg,image/png,application/pdf" required/></label><button disabled={busy}>Upload securely</button></form>}</div>)}</section>}
 {role !== 'installer' && <section className="panel"><h3>Payment and invoices</h3>{role === 'admin' && <form onSubmit={e => { e.preventDefault(); const billCode = new FormData(e.currentTarget).get('billCode'); void run(() => request('/api/payments/reconcile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id, billCode }) })); }}><label className="field">Recover a paid bill after interrupted setup<input name="billCode" required pattern="[a-zA-Z0-9]{4,64}" placeholder="Bill reference from merchant account" /></label><button disabled={busy}>Verify and recover payment</button></form>}{order.payments?.map(p => <p key={p.id}>{formatMYR(p.amount)} · {p.status}</p>)}{['payment_pending', 'payment_review'].includes(order.status) && role === 'customer' && <button className="btn" disabled={busy} onClick={() => void run(async () => { const result = await request('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id }) }); window.location.assign(result.checkoutUrl); })}>Pay with ToyyibPay</button>}{staff && <><button disabled={busy} onClick={() => void run(() => request('/api/payments/reconcile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id }) }))}>Reconcile with ToyyibPay</button><button disabled={busy} onClick={() => void run(() => action('invoice', {}))}>Issue invoice</button></>}{order.invoices?.map(i => <p key={i.id}><a href={`/api/operations/invoice?id=${i.id}`}>Download {i.invoice_number}</a></p>)}</section>}
 <section className="panel"><h3>Installation appointment</h3>{detail?.proofs?.map(proof => <p key={proof.id}>Your installation evidence saved {date(proof.created_at)} · Customer and vehicle matched<br />{proof.note}</p>)}<p>{site.workshop.name}<br />{site.workshop.address}</p>{order.appointments?.filter(a => a.active !== false).map(a => <p key={a.id}>{date(a.scheduled_at)} (Malaysia time)</p>)}{role !== 'installer' && ['arrived_workshop', 'appointment_scheduled'].includes(order.status) && <form onSubmit={e => { e.preventDefault(); formAction('book', e.currentTarget); }}><label className="field">Available time<select name="slot_id" required>{detail?.slots?.map(s => <option key={s.id} value={s.id}>{date(s.starts_at)}</option>)}</select></label>{!detail?.slots?.length && <p>No times available yet. Please check back.</p>}<button disabled={busy || !detail?.slots?.length}>Confirm appointment</button></form>}
 {(staff || role === 'installer') && ['appointment_scheduled', 'installation_proof_pending'].includes(order.status) && <form onSubmit={e => { e.preventDefault(); const form = e.currentTarget; void run(() => upload(form)); }}><h4>Installation evidence</h4><input type="hidden" name="type" value="installation"/><label><input type="checkbox" name="matching_confirmed" value="true" required/> I matched the customer and vehicle to this order.</label><label className="field">Installation photo<input type="file" name="file" accept="image/jpeg,image/png" required/></label><label className="field">Installation notes<textarea name="note" maxLength={2000}/></label><button disabled={busy}>Save evidence</button></form>}{(staff || role === 'installer') && order.status === 'installation_proof_pending' && <button disabled={busy} onClick={() => void run(() => action('transition', { status: 'installed' }))}>Complete installation</button>}</section>
 {staff && <section className="panel"><h3>Notes</h3><form onSubmit={e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); void run(() => action('note', { ...data, customer_visible: data.customer_visible === 'on' })); }}><label className="field">Note<textarea name="note" required maxLength={2000}/></label><label><input name="customer_visible" type="checkbox"/> Share with customer</label><button disabled={busy}>Add note</button></form></section>}
 {role !== 'installer' && <section className="panel"><h3>Progress and messages</h3>{detail?.notes?.map(n => <p key={n.id}>{n.note}<br /><small>{date(n.created_at)}</small></p>)}{order.order_status_events?.map(e => <p key={e.id}>{STATUS_LABELS[e.status]} · {e.note}<br /><small>{date(e.created_at)}</small></p>)}{role === 'customer' && order.status === 'installed' && <button disabled={busy} onClick={() => void run(() => action('replacement', {}))}>Request a replacement order</button>}</section>}
 {staff && <section className="panel"><h3>Notification history</h3>{detail?.notifications?.map(n => <p key={n.id}>{n.event} · {n.status} · {n.attempts} attempts {n.last_error}</p>)}<h3>Audit trail</h3>{detail?.audit?.map(a => <p key={a.id}>{a.action} · {date(a.created_at)}</p>)}</section>}</>}
 {staff && <section className="panel"><h3>Appointment availability</h3>{detail?.slots?.map(slot => <p key={slot.id}>{date(slot.starts_at)} <button disabled={busy} onClick={() => void run(() => action('slot', { slot_id: slot.id, active: false }, null))}>Close availability</button></p>)}<form onSubmit={e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); void run(() => action('slot', { starts_at: new Date(`${data.starts_at}:00+08:00`).toISOString(), capacity: Number(data.capacity) }, null)); }}><label className="field">Date and time (Malaysia)<input type="datetime-local" name="starts_at" required/></label><label className="field">Capacity<input type="number" name="capacity" min={1} max={20} defaultValue={1}/></label><button disabled={busy}>Add available time</button></form></section>}</div>;
}
