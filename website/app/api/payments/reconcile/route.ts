import { boundedBody } from '@/lib/security';
import { authorizeOrder, OperationError, operationFailure, requireOperations, requireUuid } from '@/lib/operations';
import { paymentConfig, reconcileBill, amountSen } from '@/lib/providers/toyyibpay';
import { settlePayment } from '@/lib/providers/settlement';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const context = await requireOperations(request);
    if (!['admin', 'operator'].includes(context.role)) throw new OperationError('Staff access required.', 403);
    const body: unknown = JSON.parse(new TextDecoder().decode(await boundedBody(request, 8192)));
    const id = requireUuid(body && typeof body === 'object' && 'orderId' in body ? body.orderId : null);
    const order = await authorizeOrder(context, id);
    const billCode = body && typeof body === 'object' && 'billCode' in body ? body.billCode : undefined;
    if (billCode !== undefined && billCode !== '') {
      if (context.role !== 'admin' || typeof billCode !== 'string' || !/^[a-zA-Z0-9]{4,64}$/.test(billCode)) throw new OperationError('An administrator must provide a valid bill reference.', 403);
      const config = paymentConfig();
      const verified = await reconcileBill(config, billCode, id, amountSen(order.package_price));
      if (!verified) throw new OperationError('No matching successful payment found. Check the merchant record.', 409);
      const stored = await context.admin.rpc('eplate_payment_bill', { p_order: id, p_bill: billCode, p_amount: order.package_price, p_provider: 'toyyibpay', p_environment: config.mode });
      if (stored.error) throw new OperationError('Unable to recover this payment reference. Check the existing reservation.', 409);
      await context.admin.from('audit_events').insert({ order_id: id, actor_id: context.user.id, action: 'payment_bill_recovered', details: { provider_bill_id: billCode } });
    }
    return Response.json(await settlePayment(id));
  } catch (error) { return operationFailure(error); }
}
