import { requireOperations, authorizeOrder, operationFailure, OperationError, requireUuid } from "@/lib/operations";
import { logEvent } from "@/lib/security";
export async function GET(request: Request) {
    try {
        const context = await requireOperations();
        if (context.role === "installer")
            throw new OperationError("Access denied.", 403);
        const id = requireUuid(new URL(request.url).searchParams.get("id"));
        const { data, error } = await context.admin.from("order_documents").select("order_id,storage_bucket,storage_path").eq("id", id).single();
        if (error || !data)
            throw new OperationError("Document unavailable.", 404);
        await authorizeOrder(context, data.order_id);
        const signed = await context.admin.storage.from(data.storage_bucket).createSignedUrl(data.storage_path, 60, { download: true });
        if (signed.error)
            throw new OperationError("Document unavailable.", 503);
        const audit = await context.admin.from("audit_events").insert({ order_id: data.order_id, actor_id: context.user.id, action: "document_access", details: { document_id: id } });
        if (audit.error)
            throw new OperationError("Document unavailable.", 503);
        return new Response(null, { status: 303, headers: { Location: signed.data.signedUrl, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
    }
    catch (error) {
        logEvent("document_access", "failed");
        return operationFailure(error);
    }
}
