/** Small, dependency-free PDF for an order invoice; contains no identity documents. */
export function invoicePdf(input: { number: string; orderId: string; registration: string; date: string; amount: string; paid: boolean; workshop: string; address: string }): Uint8Array {
  const literal = (value: string) => value.replace(/[^\x20-\x7e]/g, ' ').replace(/[\\()]/g, '\\$&');
  const line = (text: string, x: number, y: number, size = 12) => `BT /F1 ${size} Tf ${x} ${y} Td (${literal(text)}) Tj ET`;
  const title = input.paid ? 'RECEIPT' : 'INVOICE';
  const stream = [
    '0.08 0.14 0.20 rg', line('ePlate.my', 48, 786, 28), line(title, 420, 790, 16),
    '0.6 0.8 0.2 RG 2 w 48 764 m 547 764 l S',
    line(`Number: ${input.number}`, 48, 735), line(`Issued: ${input.date}`, 48, 711),
    line('ORDER DETAILS', 48, 664, 14), line(input.orderId, 48, 638, 11),
    line(`Vehicle: ${input.registration}`, 48, 614),
    line('DESCRIPTION', 48, 552, 11), line('AMOUNT', 438, 552, 11),
    '0.8 G 0.5 w 48 540 m 547 540 l S',
    line('JPJePlate installed package', 48, 511), line(input.amount, 428, 511),
    '48 486 m 547 486 l S', line('TOTAL (MYR)', 48, 456, 14), line(input.amount, 428, 456, 14),
    line(input.paid ? 'Payment confirmed.' : 'Payment status is available in your account.', 48, 412),
    line('INSTALLATION LOCATION', 48, 338, 11), line(input.workshop, 48, 313),
    line(input.address.slice(0, 80), 48, 292, 9), line(input.address.slice(80), 48, 271, 9),
    line('Keep this document with your order records.', 48, 112, 10),
    line('Account holder details are available securely in your ePlate.my account.', 48, 94, 9),
    line('1 / 1', 510, 48, 9)
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
