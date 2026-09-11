import { createSupabaseAdminClient } from '../supabaseAdmin';
import { paymentConfig, reconcileBill, amountSen } from './toyyibpay';
export async function settlePayment(orderId: string, billCode?: string, callbackAmount?: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error('Database unavailable');
  let query = admin.from('payments').select('provider_bill_id,provider_environment,amount,currency,status').eq('order_id', orderId).in('method', ['toyyibpay', 'local_fake']);
  if (billCode) query = query.eq('provider_bill_id', billCode);
  const { data: payment, error } = await query.maybeSingle();
  if (error || !payment?.provider_bill_id || payment.currency !== 'MYR') throw new Error('Unknown payment');
  const config = paymentConfig();
  if (payment.provider_environment !== config.mode) throw new Error('Payment environment mismatch');
  const expectedSen = amountSen(payment.amount);
  if (callbackAmount !== undefined && amountSen(callbackAmount) !== expectedSen) throw new Error('Callback amount mismatch');
  let transaction: Awaited<ReturnType<typeof reconcileBill>>;
  try { transaction = await reconcileBill(config, payment.provider_bill_id, orderId, expectedSen); }
  catch {
    await admin.from('audit_events').insert({ order_id: orderId, action: 'payment_reconciliation_failed', details: { provider_bill_id: payment.provider_bill_id } });
    throw new Error('Payment reconciliation unavailable');
  }
  if (!transaction) return { confirmed: false };
  const result = await admin.rpc('eplate_confirm_payment', { p_order: orderId, p_bill: payment.provider_bill_id, p_reference: transaction.reference, p_amount: transaction.amount_sen / 100, p_currency: 'MYR' });
  if (result.error) throw new Error('Payment reconciliation failed');
  return { confirmed: true };
}
