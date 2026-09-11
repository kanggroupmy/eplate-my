export const notificationEvents = ['order_received', 'documents_required', 'payment_confirmed', 'submitted_for_production', 'plate_arrived', 'appointment_confirmed', 'appointment_changed', 'installation_completed'] as const;
export type NotificationEvent = typeof notificationEvents[number];
export function retryDelay(attempt: number) { return Math.min(21600, 60 * 2 ** Math.min(attempt, 9)); }
export class NotificationSendError extends Error {
  code: string; retryable: boolean; uncertain: boolean;
  constructor(code: string, retryable: boolean, uncertain = false) { super(code); this.code = code; this.retryable = retryable; this.uncertain = uncertain; }
}
export async function sendWhatsApp(input: { id: string; event: string; phone: string; orderId: string }, env: Record<string, string | undefined> = process.env): Promise<string> {
  if (env.WHATSAPP_PROVIDER_MODE === 'fake') {
    if (env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production' || env.ALLOW_LOCAL_FAKE_PROVIDERS !== 'true') throw new NotificationSendError('FAKE_FORBIDDEN', false);
    return `local_${input.id}`;
  }
  if (!notificationEvents.includes(input.event as NotificationEvent)) throw new NotificationSendError('UNKNOWN_TEMPLATE_EVENT', false);
  if (!/^60\d{8,10}$/.test(input.phone.replace(/^\+/, ''))) throw new NotificationSendError('INVALID_PHONE', false);
  let templates: Record<string, unknown>;
  try { templates = JSON.parse(env.WHATSAPP_TEMPLATE_MAP || '{}') as Record<string, unknown>; } catch { throw new NotificationSendError('TEMPLATE_CONFIG', false); }
  const template = templates[input.event];
  if (typeof template !== 'string' || !/^[a-z0-9_]+$/.test(template) || !env.WHATSAPP_ACCESS_TOKEN || !/^\d+$/.test(env.WHATSAPP_PHONE_NUMBER_ID || '') || !/^v\d+\.\d+$/.test(env.WHATSAPP_API_VERSION || '')) throw new NotificationSendError('PROVIDER_CONFIG', false);
  let response: Response;
  try {
    response = await fetch(`https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: input.phone.replace(/^\+/, ''), type: 'template', biz_opaque_callback_data: input.id, template: { name: template, language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' }, components: [{ type: 'body', parameters: [{ type: 'text', text: input.orderId }] }] } }) });
  } catch { throw new NotificationSendError('SEND_UNCERTAIN', false, true); }
  if (!response.ok) throw new NotificationSendError(`HTTP_${response.status}`, response.status === 429 || response.status >= 500);
  let body: unknown;
  try { body = await response.json(); } catch { throw new NotificationSendError('SEND_UNCERTAIN', false, true); }
  const messages = body && typeof body === 'object' && 'messages' in body ? body.messages : null;
  const first: unknown = Array.isArray(messages) ? messages[0] : null;
  const id = first && typeof first === 'object' && 'id' in first ? first.id : null;
  if (typeof id !== 'string') throw new NotificationSendError('SEND_UNCERTAIN', false, true);
  return id;
}

export async function verifyWhatsAppSignature(raw: Uint8Array, signature: string, secret: string): Promise<boolean> {
  if (!secret || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const { createHmac, timingSafeEqual } = await import('node:crypto');
  const expected = createHmac('sha256', secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'));
}
export type DeliveryEvent = { messageId: string; status: 'sent' | 'delivered' | 'read' | 'failed'; timestamp: string };
export function deliveryEvents(payload: unknown): DeliveryEvent[] {
  const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
  const result: DeliveryEvent[] = [];
  const entries = object(payload).entry;
  if (!Array.isArray(entries)) return result;
  for (const entry of entries) {
    const changes = object(entry).changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const statuses = object(object(change).value).statuses;
      if (!Array.isArray(statuses)) continue;
      for (const status of statuses) {
        const row = object(status);
        if (typeof row.id !== 'string' || row.id.length > 256 || !['sent', 'delivered', 'read', 'failed'].includes(String(row.status)) || typeof row.timestamp !== 'string' || !/^\d{10}$/.test(row.timestamp)) continue;
        result.push({ messageId: row.id, status: row.status as DeliveryEvent['status'], timestamp: new Date(Number(row.timestamp) * 1000).toISOString() });
      }
    }
  }
  return result;
}
