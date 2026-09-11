import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { safeEqual, logEvent } from '@/lib/security';
import { sendWhatsApp, NotificationSendError, retryDelay } from '@/lib/providers/whatsapp';
export const runtime = 'nodejs';
export const maxDuration = 60;
type Claimed = { id: string; order_id: string; event: string; attempts: number; lease_token: string };
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET || '';
  if (secret.length < 32 || !safeEqual(request.headers.get('authorization') || '', `Bearer ${secret}`)) return new Response('Unauthorized', { status: 401 });
  const admin = createSupabaseAdminClient();
  if (!admin) return new Response('Unavailable', { status: 503 });
  const claimed = await admin.rpc('eplate_claim_notifications', { p_limit: 2 });
  if (claimed.error) { logEvent('notification_claim', 'failed'); return new Response('Unavailable', { status: 503 }); }
  let processed = 0;
  for (const row of (claimed.data || []) as Claimed[]) {
    let message: string | null = null, code: string | null = null, retry: number | null = null;
    try {
      const order = await admin.from('orders').select('customer_id').eq('id', row.order_id).single();
      if (order.error || !order.data) throw new NotificationSendError('ORDER_UNAVAILABLE', true);
      const customer = await admin.from('customers').select('whatsapp_phone').eq('id', order.data.customer_id).single();
      if (customer.error || !customer.data?.whatsapp_phone) throw new NotificationSendError('CONTACT_UNAVAILABLE', false);
      message = await sendWhatsApp({ id: row.id, event: row.event, phone: customer.data.whatsapp_phone, orderId: row.order_id });
    } catch (error) {
      code = error instanceof NotificationSendError ? error.code : 'SEND_UNCERTAIN';
      if (error instanceof NotificationSendError && error.retryable && row.attempts < 8) retry = retryDelay(row.attempts);
    }
    const finished = await admin.rpc('eplate_finish_notification', { p_id: row.id, p_lease: row.lease_token, p_message: message, p_error: code, p_retry_seconds: retry });
    if (finished.error) logEvent('notification_finish', 'failed');
    else processed++;
  }
  return Response.json({ processed }, { headers: { 'Cache-Control': 'no-store' } });
}
