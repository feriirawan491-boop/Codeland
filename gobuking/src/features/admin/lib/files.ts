import {
  validateInquiryFile,
  readInquiryFile,
} from '@/features/venue/lib/attachments';
import { readPartnerPlatformFile } from '@/features/partner/lib/files';
import { readSupportPlatformFile } from '@/features/dashboard/lib/support';
import { guardedAdmin, adminGuard, readAdminStore, AdminError } from './store';
import { adminBookings } from './sources';
import { readPartnerStore } from '@/features/partner/lib/store';
import type { PrivateFile } from '@/features/partner/lib/types';
const bytes = new Map<string, { resource: string; file: File }>();
export async function validateAdminFiles(files: File[], required = false) {
  if (required && !files.length)
    throw new AdminError('VALIDATION', 'Lampiran bukti wajib disertakan.');
  if (files.length > 3)
    throw new AdminError('FILE', 'Maksimal 3 file, masing-masing 5 MB.');
  for (const f of files) await validateInquiryFile(f);
}
export function rememberAdminFiles(
  resource: string,
  files: File[],
): PrivateFile[] {
  return files.map((f) => {
    const id = crypto.randomUUID();
    bytes.set(id, { resource, file: f });
    return {
      id,
      name: f.name.replace(/[\\/\u0000-\u001f]/g, '').slice(0, 150),
      type: f.type,
      size: f.size,
    };
  });
}
export async function readAdminFile(
  kind:
    | 'business'
    | 'verification'
    | 'case'
    | 'refund'
    | 'batch'
    | 'customer_ticket'
    | 'partner_ticket'
    | 'inquiry',
  resource: string,
  fileId: string,
) {
  const s = readAdminStore(),
    p = readPartnerStore();
  if (kind === 'business') {
    await guardedAdmin('verify', resource);
    return readPartnerPlatformFile(resource, `business:${resource}`, fileId);
  }
  if (kind === 'verification') {
    await guardedAdmin('verify', resource);
    if (!s.verifications[resource]?.evidence.some((f) => f.id === fileId))
      throw new AdminError('403', 'Bukti verifikasi tidak diizinkan.');
    resource = `verification:${resource}`;
  } else if (kind === 'case') {
    const v = s.cases.find((v) => v.id === resource);
    if (!v) throw new AdminError('404', 'Kasus tidak ditemukan.');
    await guardedAdmin('support', v.orgId);
    if (!v.notes.some((n) => n.files.some((f) => f.id === fileId)))
      throw new AdminError('403', 'Bukti tidak terkait kasus.');
  } else if (kind === 'refund') {
    const v = s.refunds.find((v) => v.id === resource);
    if (!v) throw new AdminError('404', 'Refund tidak ditemukan.');
    await guardedAdmin('reconcile', v.orgId);
    if (!v.files.some((f) => f.id === fileId))
      throw new AdminError('403', 'Bukti refund tidak diizinkan.');
  } else if (kind === 'batch') {
    const v = s.batches.find((v) => v.id === resource);
    if (!v) throw new AdminError('404', 'Batch tidak ditemukan.');
    const ctx = await guardedAdmin('payout_approve');
    v.items.forEach((i) => adminGuard('payout_approve', i.orgId));
    void ctx;
    if (!v.files.some((f) => f.id === fileId))
      throw new AdminError('403', 'Bukti batch tidak diizinkan.');
  } else if (kind === 'customer_ticket') {
    const ctx = await guardedAdmin('support');
    const v = JSON.parse(
      sessionStorage.getItem('gobuking:support-tickets:v1') ?? '{}',
    )[resource];
    if (
      !v ||
      !v.messages.some((m: { files: { id: string }[] }) =>
        m.files.some((f) => f.id === fileId),
      )
    )
      throw new AdminError('403', 'Lampiran tiket tidak diizinkan.');
    adminGuard(
      'support',
      adminBookings(ctx).find((b) => b.id === v.referenceId)?.orgId ?? null,
    );
    return readSupportPlatformFile(resource, fileId);
  } else if (kind === 'partner_ticket') {
    const v = p.tickets.find((t) => t.id === resource);
    if (!v) throw new AdminError('404', 'Tiket tidak ditemukan.');
    await guardedAdmin('support', v.orgId);
    return readPartnerPlatformFile(v.orgId, `ticket:${resource}`, fileId);
  } else if (kind === 'inquiry') {
    const v = JSON.parse(
        sessionStorage.getItem('gobuking:venue-inquiries:v1') ?? '{}',
      )[resource],
      l = p.listings.find(
        (l) => l.sourceId === v?.spaceId && l.category === v?.service,
      );
    if (!v) throw new AdminError('404', 'Inquiry tidak ditemukan.');
    await guardedAdmin('crm', l?.orgId ?? null);
    if (!v.attachments.some((f: { id: string }) => f.id === fileId))
      throw new AdminError('403', 'Lampiran inquiry tidak diizinkan.');
    return readInquiryFile(resource, fileId);
  }
  const data = bytes.get(fileId);
  if (!data || data.resource !== resource)
    throw new AdminError(
      'FILE_MISSING',
      'Isi lampiran tidak tersedia setelah muat ulang atau pergantian akun.',
    );
  return data.file;
}
if (typeof window !== 'undefined')
  window.addEventListener('gobuking:demo-account-change', () => bytes.clear());
