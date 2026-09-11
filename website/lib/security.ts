import { createHash, timingSafeEqual } from 'node:crypto';

export function siteOrigin(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) {
    if (process.env.NODE_ENV === 'production') throw new Error('Site URL is not configured.');
    return 'http://localhost:3000';
  }
  const url = new URL(value);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('HTTPS is required.');
  return url.origin;
}
export function requireOrigin(request: Request): void {
  if (request.headers.get('origin') !== siteOrigin()) throw new Error('Request origin is not allowed.');
}
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function fingerprint(value: string): string {
  const salt = process.env.RATE_LIMIT_SECRET;
  if (!salt || salt.length < 32) throw new Error('Rate limiting is not configured.');
  return createHash('sha256').update(salt).update(value).digest('hex');
}
// Deliberate allowlist: never serialize exceptions, request bodies, URLs or provider payloads.
export function logEvent(event: string, outcome: 'ok' | 'failed', requestId = crypto.randomUUID()): void {
  console.info(JSON.stringify({ event, outcome, requestId, at: new Date().toISOString() }));
}

export async function boundedBody(request: Request, maximumBytes: number): Promise<Uint8Array> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximumBytes) { await reader.cancel(); throw new Error('Request too large.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
