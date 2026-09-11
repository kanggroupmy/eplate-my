export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export function detectedUploadType(bytes: Uint8Array): string | null {
    if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
        return "image/png";
    if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
        return "image/jpeg";
    if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-")
        return "application/pdf";
    return null;
}
// Prefix spreadsheet formulas before escaping CSV delimiters.
export function csvCell(value: unknown): string {
    const text = String(value ?? '');
    const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
}
export function normalizeMalaysianPhone(value: unknown): string {
  if (typeof value !== 'string' || !/^[+\d\s()-]{8,24}$/.test(value)) throw new Error('Enter a valid Malaysian phone number.');
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('0060')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = '60' + digits.slice(1);
  if (!/^60\d{8,10}$/.test(digits)) throw new Error('Enter a valid Malaysian phone number.');
  return digits;
}
