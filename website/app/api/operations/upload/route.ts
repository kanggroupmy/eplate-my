import { randomUUID } from "node:crypto";
import { requireOperations, authorizeOrder, operationFailure, OperationError, mutate, requireUuid } from "@/lib/operations";
import { detectedUploadType, MAX_UPLOAD_BYTES } from "@/lib/operations-upload";
import { boundedBody } from "@/lib/security";
export async function POST(request: Request) {
    try {
        const context = await requireOperations(request);
        if (Number(request.headers.get("content-length")) > MAX_UPLOAD_BYTES + 16384)
            throw new OperationError("Choose a file smaller than 4 MB.");
        const body = await boundedBody(request, MAX_UPLOAD_BYTES + 16384);
        const form = await new Request(request.url, { method: "POST", headers: { "content-type": request.headers.get("content-type") || "" }, body: Buffer.from(body) }).formData();
        const id = requireUuid(form.get("orderId"));
        const type = String(form.get("type") || "");
        const proof = type === "installation";
        const order = await authorizeOrder(context, id, proof);
        if (proof ? !["installer", "admin", "operator"].includes(context.role) : context.role === "installer")
            throw new OperationError("Access denied.", 403);
        if (!proof && !["draft", "docs_pending", "rejected", "payment_pending", "admin_review"].includes(order.status))
            throw new OperationError("Documents cannot be changed at this stage.");
        if (!["voc_geran", "mykad", "installation"].includes(type))
            throw new OperationError("Choose a supported document.");
        const file = form.get("file");
        if (!(file instanceof File) || file.size < 10 || file.size > MAX_UPLOAD_BYTES)
            throw new OperationError("Choose a JPG, PNG or PDF smaller than 4 MB.");
        const bytes = new Uint8Array(await file.arrayBuffer());
        const mime = detectedUploadType(bytes);
        if (!mime || mime !== file.type || (proof && mime === "application/pdf"))
            throw new OperationError("File contents do not match a supported image or PDF.");
        const bucket = proof ? "eplate-installations" : "eplate-documents";
        const path = `${context.user.id}/${id}/${randomUUID()}.${mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : "jpg"}`;
        const { error } = await context.admin.storage.from(bucket).upload(path, bytes, { contentType: mime, upsert: false });
        if (error)
            throw new OperationError("Upload failed. Please try again.", 503);
        try {
            await mutate(context, proof ? "proof" : "document", id, proof ? { storage_path: path, matching_confirmed: form.get("matching_confirmed") === "true", note: String(form.get("note") || "").slice(0, 2000) } : { document_type: type, storage_path: path, mime_type: mime, size_bytes: file.size });
        }
        catch (mutationError) {
            await context.admin.storage.from(bucket).remove([path]);
            throw mutationError;
        }
        return Response.json({ message: "Upload saved securely." });
    }
    catch (error) {
        return operationFailure(error);
    }
}
