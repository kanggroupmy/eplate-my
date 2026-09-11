import { requireOrigin, fingerprint } from "./security";
import { createSupabaseServerClient } from "./supabaseServer";
import { createSupabaseAdminClient } from "./supabaseAdmin";
export class OperationError extends Error {
    constructor(message: string, public status = 400) { super(message); }
}
export async function requireOperations(request?: Request) {
    if (request && request.method !== "GET")
        requireOrigin(request);
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!supabase || !admin)
        throw new OperationError("Ordering is temporarily unavailable.", 503);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
        throw new OperationError("Please sign in to continue.", 401);
    const { data: staff, error: roleError } = await admin.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
    if (roleError)
        throw new OperationError("Unable to verify access.", 503);
    if (request && request.method !== "GET") {
        const limit = await admin.rpc("eplate_rate_limit", { p_key: fingerprint(`operations:${data.user.id}`), p_limit: 60, p_seconds: 60 });
        if (limit.error || limit.data !== true)
            throw new OperationError("Please wait a minute before trying again.", 429);
    }
    const role = staff?.role as "admin" | "operator" | "installer" | undefined;
    return { supabase, admin, user: data.user, role: role || "customer" as const };
}
export type OperationsContext = Awaited<ReturnType<typeof requireOperations>>;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function requireUuid(value: unknown): string { if (typeof value !== "string" || !uuidPattern.test(value))
    throw new OperationError("Invalid reference."); return value; }
export async function authorizeOrder(context: OperationsContext, id: string, allowInstaller = false) {
    requireUuid(id);
    const { data: order, error } = await context.admin.from("orders").select("*").eq("id", id).maybeSingle();
    if (error || !order)
        throw new OperationError("Order unavailable.", 404);
    if (context.role === "installer") {
        if (!allowInstaller || !["arrived_workshop", "appointment_scheduled", "installation_proof_pending", "installed"].includes(order.status))
            throw new OperationError("Order unavailable.", 403);
        if (order.status === "installed") {
            const { data: proof, error: proofError } = await context.admin.from("installation_proofs").select("id").eq("order_id", id).eq("installer_id", context.user.id).limit(1);
            if (proofError || !proof?.length)
                throw new OperationError("Order unavailable.", 404);
        }
    }
    else if (context.role === "customer") {
        const { data } = await context.admin.from("customers").select("id").eq("id", order.customer_id).eq("user_id", context.user.id).maybeSingle();
        if (!data)
            throw new OperationError("Order unavailable.", 404);
    }
    return order;
}
export function operationFailure(error: unknown) { return Response.json({ error: error instanceof OperationError ? error.message : "Unable to complete this request. Please try again." }, { status: error instanceof OperationError ? error.status : 500, headers: { "Cache-Control": "no-store" } }); }
export async function mutate(context: OperationsContext, action: string, order: string | null, data: Record<string, unknown>) {
    const result = await context.admin.rpc("eplate_mutate", { p_actor: context.user.id, p_action: action, p_order: order, p_data: data });
    if (result.error)
        throw new OperationError("This action is unavailable. Check the order status and required information.");
    return result.data;
}

export function orderFilters(url: URL) {
    return { search: (url.searchParams.get('q') || '').trim().replace(/[^\w@. +\-]/g, '').slice(0, 100), status: url.searchParams.get('status') || '' };
}
export async function orderListQuery(context: OperationsContext, search: string, status: string) {
    let query = context.supabase.from('orders').select('*,customers(email,whatsapp_phone)', { count: 'exact' }).order('created_at', { ascending: false });
    if (search) {
        const { data: customers, error } = await context.supabase.from('customers').select('id').or(`email.ilike.%${search}%,whatsapp_phone.ilike.%${search}%`).limit(200);
        if (error) throw error;
        const parts = [`owner_name.ilike.%${search}%`, `vehicle_registration.ilike.%${search}%`];
        if (uuidPattern.test(search)) parts.push(`id.eq.${search}`);
        if (customers?.length) parts.push(`customer_id.in.(${customers.map(c => c.id).join(',')})`);
        query = query.or(parts.join(','));
    }
    if (/^[a-z_]+$/.test(status)) query = query.eq('status', status);
    // Wrap the thenable to return a query builder without executing it yet.
    return { query };
}
