import test from 'node:test';
import assert from 'node:assert/strict';
import { invoicePdf } from '../lib/invoice-pdf.ts';
test('PDF escapes untrusted labels and has valid byte offsets', () => {
  const output = new TextDecoder().decode(invoicePdf({ number: 'EP(test)\\', orderId: '11111111-1111-4111-8111-111111111111', registration: 'ABC123', date:'06/09/2026', amount:'RM 150.00', paid:true, workshop:'Example workshop', address:'Example address' }));
  assert.ok(output.startsWith('%PDF-1.4'));
  assert.ok(output.includes('EP\\(test\\)\\\\'));
  assert.ok(!output.includes('JavaScript'));
  const xref = Number(output.match(/startxref\n(\d+)/)?.[1]);
  assert.equal(output.slice(xref, xref+4), 'xref');
  const offsets = [...output.matchAll(/(\d{10}) 00000 n/g)].map(match => Number(match[1]));
  offsets.forEach((offset,index) => assert.ok(output.slice(offset).startsWith(`${index+1} 0 obj`)));
});
