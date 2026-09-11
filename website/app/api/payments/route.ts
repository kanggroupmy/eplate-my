import { boundedBody } from '@/lib/security';
import { authorizeOrder, OperationError, operationFailure, requireOperations, requireUuid } from '@/lib/operations';
import { createBill, paymentConfig, amountSen } from '@/lib/providers/toyyibpay';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const context = await requireOperations(request);
    const body: unknown = JSON.parse(new TextDecoder().decode(await boundedBody(request, 8192)));
    const id = requireUuid(body && typeof body === 'object' && 'orderId' in body ? body.orderId : null);
    const order = await authorizeOrder(context, id);
    if (context.role !== 'customer' && context.role !== 'admin') throw new OperationError('Payment access unavailable.', 403);
    if (!['payment_pending', 'payment_review'].includes(order.status)) throw new OperationError('Complete your order and documents before paying.');
    const config = paymentConfig();
    const { data: customer, error: contactError } = await context.admin.from('customers').select('email,whatsapp_phone').eq('id', order.customer_id).single();
    if (contactError || !customer?.email || !customer.whatsapp_phone) throw new OperationError('Please complete your email and WhatsApp number.');
    const { data, error } = await context.admin.rpc('eplate_reserve_payment', { p_order: id });
    if (error || !data?.payment) throw new OperationError('Unable to start payment.', 409);
    const payment = data.payment as { provider_bill_id: string | null; provider_environment: string; amount: number; status: string };
    if (payment.status === 'verified') throw new OperationError('This order is already paid.', 409);
    if (payment.provider_bill_id) {
      if (payment.provider_environment !== config.mode) throw new OperationError('Payment environment mismatch. Please contact support.', 409);
      if (!/^[a-zA-Z0-9]{4,64}$/.test(payment.provider_bill_id)) throw new OperationError('Payment reference requires support.', 409);
      return Response.json({ checkoutUrl: config.mode === 'fake' ? `${config.origin}/order/?order=${id}&payment=local_test` : `${config.baseUrl}/${payment.provider_bill_id}` }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (!data.created) throw new OperationError('Payment setup is being checked. Please contact support before retrying.', 409);
    let bill: Awaited<ReturnType<typeof createBill>>;
    try { bill = await createBill(config, { id, amount_sen: amountSen(payment.amount), owner_name: String(order.owner_name), email: customer.email, phone: customer.whatsapp_phone }); }
    catch {
      await context.admin.from('audit_events').insert({ order_id: id, action: 'payment_bill_creation_uncertain', details: { code: 'PROVIDER_CREATE_FAILED' } });
      throw new OperationError('Payment setup requires a support check. Please do not retry payment yet.', 503);
    }
    const stored = await context.admin.rpc('eplate_payment_bill', { p_order: id, p_bill: bill.billCode, p_amount: payment.amount, p_provider: config.mode === 'fake' ? 'local_fake' : 'toyyibpay', p_environment: config.mode });
    if (stored.error) {
      await context.admin.from('audit_events').insert({ order_id: id, action: 'payment_bill_storage_failed', details: { provider_bill_id: bill.billCode } });
      throw new OperationError('Payment setup requires a support check. Please do not pay yet.', 503);
    }
    return Response.json({ checkoutUrl: bill.checkoutUrl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return operationFailure(error); }
}
