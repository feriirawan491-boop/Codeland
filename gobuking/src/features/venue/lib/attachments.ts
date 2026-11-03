import { VenueError } from './adapter';
import type { AttachmentMeta } from './types';
const memory = new Map<string, { inquiryId: string; file: File }>();
let listening = false;
export async function validateInquiryFile(file: File) {
  if (file.size > 5 * 1024 * 1024 || file.size === 0)
    throw new VenueError(
      'FILE',
      'Lampiran harus berukuran 1 byte hingga 5 MB.',
    );
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))
    throw new VenueError('FILE', 'Gunakan PDF, JPEG, atau PNG untuk lampiran.');
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () =>
      reject(new VenueError('FILE', 'Lampiran belum dapat dibaca.'));
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
  const valid =
    file.type === 'application/pdf'
      ? new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'
      : file.type === 'image/jpeg'
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : [137, 80, 78, 71, 13, 10, 26, 10].every(
            (value, i) => bytes[i] === value,
          );
  if (!valid)
    throw new VenueError('FILE', 'Isi lampiran tidak sesuai dengan tipe file.');
}
export function rememberInquiryFiles(
  inquiryId: string,
  files: File[],
): AttachmentMeta[] {
  if (!listening) {
    window.addEventListener('gobuking:demo-account-change', () =>
      memory.clear(),
    );
    listening = true;
  }
  return files.map((file) => {
    const id = `ATT-${crypto.randomUUID()}`;
    memory.set(id, { inquiryId, file });
    return {
      id,
      name: file.name.replace(/[\\/\u0000-\u001f]/g, '').slice(0, 160),
      type: file.type,
      size: file.size,
    };
  });
}
export function readInquiryFile(inquiryId: string, id: string) {
  const value = memory.get(id);
  if (!value || value.inquiryId !== inquiryId)
    throw new VenueError(
      'FILE_MISSING',
      'Isi lampiran tidak disimpan setelah muat ulang atau pergantian akun. Hanya metadata yang tersisa pada demo ini.',
    );
  return value.file;
}
