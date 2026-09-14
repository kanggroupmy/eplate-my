import { normalizeMalaysianPhone } from "@/lib/operations-upload";
import { requireOperations, authorizeOrder, operationFailure, OperationError, mutate, requireUuid, orderFilters, orderListQuery } from "@/lib/operations";
import { ORDER_STATUSES } from "@/lib/domain";
import { VEHICLE_BRANDS, FITMENT_KEY } from "@/lib/order-options";
import { boundedBody } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
    try {
        const context = await requireOperations();
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (id) {
            const order = await authorizeOrder(context, id, true);
            if (context.role === "installer") {
                const { data: appointments } = await context.admin.from("appointments").select("id,scheduled_at,active").eq("order_id", id);
                const { data: proofs } = await context.admin.from("installation_proofs").select("id,created_at,note,matching_confirmed").eq("order_id", id).eq("installer_id", context.user.id);
                return Response.json({ role: context.role, order: { id: order.id, owner_name: order.owner_name, vehicle_registration: order.vehicle_registration, status: order.status, appointments }, proofs }, { headers: { "Cache-Control": "no-store" } });
            }
            const { data, error } = await context.supabase.from("orders").select("*,customers(email,whatsapp_phone),order_documents(id,document_type,status,rejection_reason,created_at),payments(id,amount,status,created_at),appointments(*),invoices(id,invoice_number,amount,status,created_at),order_status_events(*)").eq("id", id).single();
            if (error)
                throw error;
            const { data: allSlots, error: slotError } = await context.admin.from("appointment_slots").select("*").eq("active", true).gt("starts_at", new Date().toISOString()).order("starts_at").limit(100);
            const { data: visibleNotes } = await context.admin.from("admin_notes").select("id,note,created_at").eq("order_id", id).eq("customer_visible", true);
            if (slotError)
                throw slotError;
            const { data: bookings, error: bookingError } = allSlots?.length ? await context.admin.from("appointments").select("slot_id").eq("active", true).in("slot_id", allSlots.map(slot => slot.id)).limit(2000) : { data: [], error: null };
            if (bookingError)
                throw bookingError;
            const slots = (allSlots || []).filter(slot => (bookings || []).filter(booking => booking.slot_id === slot.id).length < slot.capacity);
            let staffData: Record<string, unknown> = { notes: visibleNotes || [] };
            if (["admin", "operator"].includes(context.role)) {
                const [notes, audit, notifications] = await Promise.all([
                    context.admin.from("admin_notes").select("*").eq("order_id", id).order("created_at"),
                    context.admin.from("audit_events").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(100),
                    context.admin.from("notification_outbox").select("id,event,status,attempts,last_error,created_at").eq("order_id", id).order("created_at", { ascending: false }).limit(50)
                ]);
                staffData = { notes: notes.data || [], audit: audit.data || [], notifications: notifications.data || [] };
            }
            return Response.json({ role: context.role, order: data, slots: slots || [], ...staffData }, { headers: { "Cache-Control": "no-store" } });
        }
        const page = Math.max(0, Math.min(10000, Math.floor(Number(url.searchParams.get("page")) || 0)));
        const { search, status } = orderFilters(url);
        if (context.role === "installer") {
            if (search.length < 3)
                return Response.json({ role: context.role, orders: [], count: 0 });
            let query = context.admin.from("orders").select("id,owner_name,vehicle_registration,status,created_at", { count: "exact" }).in("status", ["arrived_workshop", "appointment_scheduled", "installation_proof_pending"]);
            query = query.or(`vehicle_registration.eq.${search.toUpperCase()},id.eq.${/^[0-9a-f-]{36}$/i.test(search) ? search : "00000000-0000-0000-0000-000000000000"}`);
            const { data, count, error } = await query.limit(10);
            if (error)
                throw error;
            return Response.json({ role: context.role, orders: data, count });
        }
        const { query } = await orderListQuery(context, search, status);
        const { data, count, error } = await query.range(page * 25, page * 25 + 24);
        if (error)
            throw error;
        const counts: Record<string, number> = {};
        if (["admin", "operator"].includes(context.role)) {
            const results = await Promise.all(ORDER_STATUSES.map(async (value) => { const result = await context.supabase.from("orders").select("id", { head: true, count: "exact" }).eq("status", value); if (result.error)
                throw result.error; return [value, result.count || 0] as const; }));
            for (const [value, total] of results)
                counts[value] = total;
        }
        return Response.json({ role: context.role, orders: data, count, page, counts }, { headers: { "Cache-Control": "no-store" } });
    }
    catch (error) {
        return operationFailure(error);
    }
}
export async function POST(request: Request) {
    try {
        const context = await requireOperations(request);
        if (Number(request.headers.get("content-length")) > 12000)
            throw new OperationError("Request is too large.");
        const body = JSON.parse(new TextDecoder().decode(await boundedBody(request, 12000))) as {
            action?: unknown;
            orderId?: unknown;
            data?: unknown;
        };
        const action = String(body.action || "");
        if (!["draft", "transition", "review_document", "note", "book", "slot", "invoice", "replacement"].includes(action))
            throw new OperationError("Unknown action.");
        const id = body.orderId ? requireUuid(body.orderId) : null;
        if (id)
            await authorizeOrder(context, id, action === "proof" || action === "transition");
        if (!body.data || typeof body.data !== "object" || Array.isArray(body.data) || JSON.stringify(body.data).length > 10000)
            throw new OperationError("Invalid information.");
        const data = body.data as Record<string, unknown>;
        if (action === 'draft') {
            if (!VEHICLE_BRANDS.some(brand => brand === data.vehicle_brand) || data.vehicle_usage !== 'on_the_road' || data.workshop_key !== FITMENT_KEY)
                throw new OperationError('Select a vehicle brand and the available fitment location. Only on the road vehicles are accepted.');
            try { data.whatsapp_phone = normalizeMalaysianPhone(data.whatsapp_phone); }
            catch { throw new OperationError('Enter a valid Malaysian WhatsApp number.'); }
        }
        const result = await mutate(context, action, id, data);
        return Response.json({ result }, { headers: { "Cache-Control": "no-store" } });
    }
    catch (error) {
        return operationFailure(error);
    }
}
