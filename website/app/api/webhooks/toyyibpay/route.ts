import { boundedBody } from '@/lib/security';
import { paymentConfig, verifyCallback } from '@/lib/providers/toyyibpay';
import { settlePayment } from '@/lib/providers/settlement';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) return new Response('Unsupported content type', { status: 415 });
  let raw: string;
  try { raw = new TextDecoder().decode(await boundedBody(request, 8192)); } catch { return new Response('Payload too large', { status: 413 }); }
  try {
    const fields = new URLSearchParams(raw);
    const config = paymentConfig();
    if (config.mode === 'fake' || !verifyCallback(fields, config.secret)) return new Response('Invalid callback', { status: 401 });
    const orderId = fields.get('order_id') || '';
    const billCode = fields.get('billcode') || '';
    if (!/^[a-f0-9-]{36}$/i.test(orderId) || !/^[a-zA-Z0-9]{4,64}$/.test(billCode)) return new Response('Invalid reference', { status: 400 });
    // Even failure/pending callbacks reconcile authoritative state; late callbacks cannot undo payment.
    await settlePayment(orderId, billCode, fields.get('amount') || '');
    return new Response('OK');
  } catch {
    console.error(JSON.stringify({ event: 'payment_callback_failed' }));
    return new Response('Reconciliation unavailable', { status: 503 });
  }
}
