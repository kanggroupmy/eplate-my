import { createHash, timingSafeEqual } from 'node:crypto';

export type PaymentConfig = { mode: 'live' | 'sandbox' | 'fake'; baseUrl: string; secret: string; category: string; origin: string };
export function paymentConfig(env: Record<string, string | undefined> = process.env): PaymentConfig {
  const mode = env.PAYMENT_PROVIDER_MODE || 'live';
  if (!['live', 'sandbox', 'fake'].includes(mode)) throw new Error('Invalid payment mode');
  if (mode !== 'live' && (env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production')) throw new Error('Test payments forbidden in production');
  if (mode === 'fake' && env.ALLOW_LOCAL_FAKE_PROVIDERS !== 'true') throw new Error('Fake providers require explicit local flag');
  const origin = new URL(env.APP_URL || env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  if (mode === 'live' && origin.protocol !== 'https:') throw new Error('Live payments require HTTPS');
  if (mode !== 'fake' && (!env.TOYYIBPAY_SECRET_KEY || !env.TOYYIBPAY_CATEGORY_CODE)) throw new Error('Payment configuration unavailable');
  return { mode: mode as PaymentConfig['mode'], baseUrl: mode === 'sandbox' ? 'https://dev.toyyibpay.com' : 'https://toyyibpay.com', secret: env.TOYYIBPAY_SECRET_KEY || '', category: env.TOYYIBPAY_CATEGORY_CODE || '', origin: origin.origin };
}
export function amountSen(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Invalid amount');
  const text = String(value);
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) throw new Error('Invalid amount');
  const [ringgit, sen = ''] = text.split('.');
  return Number(ringgit) * 100 + Number(sen.padEnd(2, '0'));
}
export function verifyCallback(fields: URLSearchParams, secret: string): boolean {
  const hash = fields.get('hash') || '';
  if (!secret || !/^[a-f0-9]{32}$/i.test(hash)) return false;
  for (const field of ['status', 'order_id', 'refno', 'hash', 'billcode', 'amount']) if (fields.getAll(field).length !== 1) return false;
  if (!['1','2','3'].includes(fields.get('status') || '')) return false;
  const expected = createHash('md5').update(secret + fields.get('status') + fields.get('order_id') + fields.get('refno') + 'ok').digest();
  return timingSafeEqual(expected, Buffer.from(hash, 'hex'));
}
async function call(config: PaymentConfig, action: string, fields: Record<string, string>): Promise<unknown> {
  const response = await fetch(`${config.baseUrl}/index.php/api/${action}`, { method: 'POST', body: new URLSearchParams(fields), signal: AbortSignal.timeout(15000), cache: 'no-store', redirect: 'error' });
  if (!response.ok) throw new Error('Payment provider unavailable');
  return response.json();
}
export async function createBill(config: PaymentConfig, order: { id: string; amount_sen: number; owner_name: string; email: string; phone: string }) {
  if (config.mode === 'fake') return { billCode: `fake${order.id.replaceAll('-', '')}`, checkoutUrl: `${config.origin}/order/?order=${order.id}&payment=local_test` };
  const result = await call(config, 'createBill', { userSecretKey: config.secret, categoryCode: config.category, billName: 'ePlate order', billDescription: 'JPJePlate order and installation', billPriceSetting: '1', billPayorInfo: '1', billAmount: String(order.amount_sen), billReturnUrl: `${config.origin}/order/?order=${order.id}`, billCallbackUrl: `${config.origin}/api/webhooks/toyyibpay/`, billExternalReferenceNo: order.id, billTo: order.owner_name, billEmail: order.email, billPhone: order.phone, billPaymentChannel: '0', billChargeToCustomer: '' });
  const billCode: unknown = Array.isArray(result) ? result[0]?.BillCode : null;
  if (typeof billCode !== 'string' || !/^[a-zA-Z0-9]{4,64}$/.test(billCode)) throw new Error('Payment bill creation unconfirmed');
  return { billCode, checkoutUrl: `${config.baseUrl}/${billCode}` };
}
export type ConfirmedTransaction = { reference: string; amount_sen: number; order_id: string };
export function verifiedTransaction(value: unknown, orderId: string, expectedSen: number): ConfirmedTransaction | null {
  if (!Array.isArray(value)) throw new Error('Invalid provider transaction response');
  for (const item of value as unknown[]) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (String(row.billpaymentStatus) !== '1') continue;
    if (row.billExternalReferenceNo !== orderId || amountSen(row.billpaymentAmount) !== expectedSen) throw new Error('Provider payment mismatch');
    if (typeof row.billpaymentInvoiceNo !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(row.billpaymentInvoiceNo)) throw new Error('Invalid provider reference');
    return { reference: row.billpaymentInvoiceNo, amount_sen: expectedSen, order_id: orderId };
  }
  return null;
}
export async function reconcileBill(config: PaymentConfig, billCode: string, orderId: string, expectedSen: number) {
  if (config.mode === 'fake') return null; // Fake checkout never settles a real order.
  return verifiedTransaction(await call(config, 'getBillTransactions', { billCode }), orderId, expectedSen);
}
