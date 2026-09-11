import { requireOperations, authorizeOrder, operationFailure, OperationError, requireUuid } from "@/lib/operations";
import { invoicePdf } from "@/lib/invoice-pdf";
import { site } from "@/data/site";
function escape(value: unknown) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c] || c)); }
export async function GET(request: Request) {
  try {
    const context = await requireOperations();
    if (context.role === "installer") throw new OperationError("Access denied.",403);
    const id = requireUuid(new URL(request.url).searchParams.get("id"));
    const { data: invoice, error } = await context.admin.from("invoices").select("*").eq("id",id).single();
    if (error || !invoice || invoice.status !== "issued") throw new OperationError("Invoice unavailable.",404);
    const order = await authorizeOrder(context,invoice.order_id);
    const { data: payments } = await context.admin.from("payments").select("id").eq("order_id",order.id).eq("status","verified").limit(1);
    const logged = await context.admin.from("audit_events").insert({ order_id: order.id, actor_id: context.user.id, action: "invoice_access", details: { invoice_id: id } });
    if (logged.error) throw new OperationError("Invoice unavailable. Please try again.", 503);
    const title = payments?.length ? "Receipt" : "Invoice";
    const amount = new Intl.NumberFormat("en-MY",{style:"currency",currency:"MYR"}).format(Number(invoice.amount));
    if (new URL(request.url).searchParams.get("format") !== "html") {
      const pdf = invoicePdf({ number: invoice.invoice_number, orderId: order.id, registration: order.vehicle_registration, date: new Date(invoice.created_at).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }), amount: amount.replace(/[^0-9.,RM ]/g, ""), paid: Boolean(payments?.length), workshop: site.workshop.name, address: site.workshop.address });
      return new Response(new Uint8Array(pdf).buffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="eplate-${id}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
    }
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} ${escape(invoice.invoice_number)}</title><style>body{font:16px system-ui;max-width:760px;margin:48px auto;padding:24px;color:#142436}h1{border-bottom:3px solid #142436;padding-bottom:20px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:16px 0;border-bottom:1px solid #ddd}@media print{button{display:none}}</style><h1>ePlate.my · ${title}</h1><p>${escape(invoice.invoice_number)}<br>${escape(new Date(invoice.created_at).toLocaleDateString("en-MY",{timeZone:"Asia/Kuala_Lumpur"}))}</p><p>Customer: ${escape(order.owner_name)}<br>Vehicle: ${escape(order.vehicle_registration)}<br>Order: ${escape(order.id)}</p><table><tr><th>Description</th><th>Amount</th></tr><tr><td>JPJePlate installed package</td><td>${escape(amount)}</td></tr><tr><th>Total (MYR)</th><th>${escape(amount)}</th></tr></table><p>${payments?.length ? "Payment confirmed." : "Payment status is available in your account."}</p><p>Installation: ${escape(site.workshop.name)}<br>${escape(site.workshop.address)}</p><p>Keep this document for your records. Use your browser’s Print command to save a PDF.</p></html>`;
    return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Content-Disposition":`attachment; filename="eplate-${id}.html"`,"Cache-Control":"private, no-store","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; sandbox","X-Content-Type-Options":"nosniff"}});
  } catch(error) { return operationFailure(error); }
}
