import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { paymentConfig, verifyCallback, verifiedTransaction, amountSen, createBill } from '../lib/providers/toyyibpay.ts';
import { sendWhatsApp, retryDelay, NotificationSendError } from '../lib/providers/whatsapp.ts';

test('payment test modes fail closed in production and require local opt-in', () => {
  for (const mode of ['fake', 'sandbox']) assert.throws(() => paymentConfig({ NODE_ENV: 'production', PAYMENT_PROVIDER_MODE: mode }));
  assert.throws(() => paymentConfig({ PAYMENT_PROVIDER_MODE: 'fake' }));
  assert.equal(paymentConfig({ PAYMENT_PROVIDER_MODE: 'fake', ALLOW_LOCAL_FAKE_PROVIDERS: 'true' }).mode, 'fake');
});
test('callback requires authentic signature, unique fields and accepted state', () => {
  const fields = new URLSearchParams({ status: '1', order_id: 'order', refno: 'ref', billcode: 'bill', amount: '150.00', hash: createHash('md5').update('secret1orderrefok').digest('hex') });
  assert.equal(verifyCallback(fields, 'secret'), true);
  assert.equal(verifyCallback(fields, 'wrong'), false);
  fields.append('amount', '1.00');
  assert.equal(verifyCallback(fields, 'secret'), false);
});
test('provider reconciliation binds paid state to external order and exact amount', () => {
  const row = { billpaymentStatus: '1', billExternalReferenceNo: 'order', billpaymentAmount: '150.00', billpaymentInvoiceNo: 'ref_1' };
  assert.equal(verifiedTransaction([row], 'order', 15000)?.reference, 'ref_1');
  assert.throws(() => verifiedTransaction([row], 'other', 15000));
  assert.throws(() => verifiedTransaction([row], 'order', 14999));
  assert.equal(verifiedTransaction([{ ...row, billpaymentStatus: '3' }], 'order', 15000), null);
  for (const amount of ['1e3', '-1', '1.001', '', null]) assert.throws(() => amountSen(amount));
});
test('fake checkout uses canonical customer order route', async () => {
  const result = await createBill(paymentConfig({ PAYMENT_PROVIDER_MODE: 'fake', ALLOW_LOCAL_FAKE_PROVIDERS: 'true' }), { id: 'order', amount_sen: 15000, owner_name: 'Test', email: 'test@example.test', phone: '60123456789' });
  assert.equal(result.checkoutUrl, 'http://localhost:3000/order/?order=order&payment=local_test');
});
test('notification local adapter is deterministic and forbidden in production', async () => {
  const input = { id: 'event', event: 'order_received', phone: '60123456789', orderId: 'order' };
  const env = { WHATSAPP_PROVIDER_MODE: 'fake', ALLOW_LOCAL_FAKE_PROVIDERS: 'true' };
  assert.equal(await sendWhatsApp(input, env), await sendWhatsApp(input, env));
  await assert.rejects(sendWhatsApp(input, { ...env, NODE_ENV: 'production' }), NotificationSendError);
  await assert.rejects(sendWhatsApp(input, {}), /PROVIDER_CONFIG/);
  assert.equal(retryDelay(30), 21600);
});

test('WhatsApp webhook verifies raw bytes and extracts no recipient PII', async () => {
  const { createHmac } = await import('node:crypto');
  const { verifyWhatsAppSignature, deliveryEvents } = await import('../lib/providers/whatsapp.ts');
  const raw = new TextEncoder().encode('{"test":1}');
  const signature = `sha256=${createHmac('sha256', 'secret').update(raw).digest('hex')}`;
  assert.equal(await verifyWhatsAppSignature(raw, signature, 'secret'), true);
  assert.equal(await verifyWhatsAppSignature(new TextEncoder().encode('{}'), signature, 'secret'), false);
  assert.equal(await verifyWhatsAppSignature(raw, signature, ''), false);
  const events = deliveryEvents({ entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.test', status: 'delivered', timestamp: '1780000000', recipient_id: '60123456789' }] } }] }] });
  assert.equal(events.length, 1);
  assert.deepEqual(Object.keys(events[0]).sort(), ['messageId','status','timestamp']);
});

test('WhatsApp retries explicit transient rejection but quarantines uncertain delivery', async () => {
  const original = globalThis.fetch;
  const input = { id: 'event', event: 'order_received', phone: '60123456789', orderId: 'order' };
  const env = { WHATSAPP_ACCESS_TOKEN: 'test', WHATSAPP_PHONE_NUMBER_ID: '123', WHATSAPP_API_VERSION: 'v23.0', WHATSAPP_TEMPLATE_MAP: '{"order_received":"test_template"}' };
  try {
    globalThis.fetch = async () => new Response('{}', { status: 429 });
    await assert.rejects(sendWhatsApp(input, env), (error: unknown) => error instanceof NotificationSendError && error.retryable && !error.uncertain);
    globalThis.fetch = async () => { throw new Error('network'); };
    await assert.rejects(sendWhatsApp(input, env), (error: unknown) => error instanceof NotificationSendError && !error.retryable && error.uncertain);
    globalThis.fetch = async () => new Response('invalid', { status: 200 });
    await assert.rejects(sendWhatsApp(input, env), (error: unknown) => error instanceof NotificationSendError && error.uncertain);
  } finally { globalThis.fetch = original; }
});
