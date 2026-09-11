import { createHash } from 'node:crypto';
import { boundedBody, safeEqual, logEvent } from '@/lib/security';
import { verifyWhatsAppSignature, deliveryEvents } from '@/lib/providers/whatsapp';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
  if (token.length < 32 || params.get('hub.mode') !== 'subscribe' || !safeEqual(params.get('hub.verify_token') || '', token)) return new Response('Unauthorized', { status: 401 });
  const challenge = params.get('hub.challenge') || '';
  if (!/^\d{1,100}$/.test(challenge)) return new Response('Invalid challenge', { status: 400 });
  return new Response(challenge, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  let raw: Uint8Array;
  try { raw = await boundedBody(request, 65536); } catch { return new Response('Payload too large', { status: 413 }); }
  if (!await verifyWhatsAppSignature(raw, request.headers.get('x-hub-signature-256') || '', process.env.WHATSAPP_APP_SECRET || '')) return new Response('Unauthorized', { status: 401 });
  let payload: unknown;
  try { payload = JSON.parse(new TextDecoder().decode(raw)); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const admin = createSupabaseAdminClient();
  if (!admin) return new Response('Unavailable', { status: 503 });
  for (const event of deliveryEvents(payload)) {
    const outbox = await admin.from('notification_outbox').select('id').eq('provider_message_id', event.messageId).maybeSingle();
    if (outbox.error) return new Response('Unavailable', { status: 503 });
    // Provider delivery can race the send commit. Retrying avoids losing that receipt.
    if (!outbox.data) return new Response('Message awaiting reconciliation', { status: 503 });
    const id = createHash('sha256').update(`${event.messageId}\n${event.status}\n${event.timestamp}`).digest('hex');
    const result = await admin.from('notification_delivery_events').upsert({ id, outbox_id: outbox.data.id, provider_message_id: event.messageId, status: event.status, provider_timestamp: event.timestamp }, { onConflict: 'id', ignoreDuplicates: true });
    if (result.error) { logEvent('notification_delivery', 'failed'); return new Response('Unavailable', { status: 503 }); }
  }
  return new Response('OK');
}
