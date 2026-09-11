import test from 'node:test';
import assert from 'node:assert/strict';
import { detectedUploadType, csvCell, MAX_UPLOAD_BYTES } from '../lib/operations-upload.ts';
test('upload detection rejects renamed HTML, SVG, empty files and truncated signatures',()=>{
 for(const text of ['','<svg onload="alert(1)">','<html>','%PD']) assert.equal(detectedUploadType(new TextEncoder().encode(text)),null);
 assert.equal(detectedUploadType(new Uint8Array([255,216])),null);
 assert.equal(detectedUploadType(new Uint8Array([137,80,78,71])),null);
 assert.equal(MAX_UPLOAD_BYTES,4194304);
});
test('upload detection accepts supported full signatures only',()=>{
 assert.equal(detectedUploadType(new Uint8Array([255,216,255,1])), 'image/jpeg');
 assert.equal(detectedUploadType(new Uint8Array([137,80,78,71,13,10,26,10])), 'image/png');
 assert.equal(detectedUploadType(new TextEncoder().encode('%PDF-1.7')), 'application/pdf');
});
test('CSV neutralizes formulas, whitespace formula bypasses, quotes and delimiters',()=>{
 for(const value of ['=SUM(A1)','+601234','-1','@SUM(A1)','\t=1'])assert.ok(csvCell(value).startsWith('"\''));
 assert.equal(csvCell('Owner,"name"'),'"Owner,""name"""');
 assert.equal(csvCell(null),'""');
});

test('Malaysian phone input normalizes international and local presentation', async () => {
  const { normalizeMalaysianPhone } = await import('../lib/operations-upload.ts');
  assert.equal(normalizeMalaysianPhone('+60 12-345 6789'), '60123456789');
  assert.equal(normalizeMalaysianPhone('012-3456789'), '60123456789');
  assert.throws(() => normalizeMalaysianPhone('+44 1234567890'));
  assert.throws(() => normalizeMalaysianPhone('60123abc'));
});
