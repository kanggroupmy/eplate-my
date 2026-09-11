import test from 'node:test';
import assert from 'node:assert/strict';
import { requireOrigin, safeEqual, fingerprint } from '../lib/security.ts';

test('mutation origin must exactly match configured site', () => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://example.test';
  assert.doesNotThrow(() => requireOrigin(new Request('https://example.test/api/', { headers: { origin: 'https://example.test' } })));
  for (const origin of ['', 'https://example.test.evil.test', 'http://example.test', 'null']) {
    assert.throws(() => requireOrigin(new Request('https://example.test/api/', { headers: { origin } })));
  }
});
test('secret comparisons reject length mismatch and altered values', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abcd'), false);
  assert.equal(safeEqual('abc', 'abd'), false);
});
test('rate-limit identifiers are irreversible salted fingerprints', () => {
  process.env.RATE_LIMIT_SECRET = 'a'.repeat(32);
  const first = fingerprint('customer@example.test');
  assert.match(first, /^[0-9a-f]{64}$/);
  process.env.RATE_LIMIT_SECRET = 'b'.repeat(32);
  assert.notEqual(fingerprint('customer@example.test'), first);
  delete process.env.RATE_LIMIT_SECRET;
  assert.throws(() => fingerprint('customer@example.test'));
});

test('stream limit rejects oversized chunked requests without trusting content-length', async () => {
  const { boundedBody } = await import('../lib/security.ts');
  const request = new Request('https://example.test', { method: 'POST', body: 'abcdef' });
  await assert.rejects(boundedBody(request, 5));
  assert.equal(new TextDecoder().decode(await boundedBody(new Request('https://example.test', { method:'POST', body:'abc' }), 3)), 'abc');
});
