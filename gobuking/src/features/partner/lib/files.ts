import { readInquiryFile } from '@/features/venue/lib/attachments';
import { sourceInquiries } from './sources';
import { validateInquiryFile } from '@/features/venue/lib/attachments';
import {
  partnerGuard,
  PartnerError,
  readPartnerStore,
  ownListings,
} from './store';
import type { PrivateFile } from './types';
const files = new Map<
  string,
  { orgId: string; resource: string; file: File }
>();
export async function validatePartnerFiles(values: File[]) {
  if (values.length > 3)
    throw new PartnerError('FILE', 'Maksimal 3 lampiran, masing-masing 5 MB.');
  for (const file of values) await validateInquiryFile(file);
}
export function storePartnerFiles(
  orgId: string,
  resource: string,
  values: File[],
): PrivateFile[] {
  return values.map((file) => {
    const id = crypto.randomUUID();
    files.set(id, { orgId, resource, file });
    return {
      id,
      name: file.name.replace(/[\\/\u0000-\u001f]/g, '').slice(0, 160),
      type: file.type,
      size: file.size,
    };
  });
}
export function readPartnerFile(
  resource: string,
  id: string,
  listingId?: string,
) {
  const ctx = partnerGuard(
    resource.startsWith('business')
      ? 'business'
      : resource.startsWith('service')
        ? 'operation'
        : resource.startsWith('quote') || resource.startsWith('inquiry')
          ? 'crm'
          : 'support',
  );
  const ref = resource.slice(resource.indexOf(':') + 1),
    store = readPartnerStore();
  let assigned = listingId;
  if (resource.startsWith('quote') || resource.startsWith('inquiry')) {
    const records = JSON.parse(
      sessionStorage.getItem('gobuking:venue-inquiries:v1') ?? '{}',
    );
    const inquiry = records[ref];
    const listing = ownListings(ctx).find(
      (l) => l.sourceId === inquiry?.spaceId && l.category === inquiry?.service,
    );
    if (!listing)
      throw new PartnerError('403', 'Lampiran tidak termasuk assignment Anda.');
    assigned = listing.id;
  }
  if (resource.startsWith('service')) {
    const v = store.services.find(
      (v) => v.bookingId === ref && v.orgId === ctx.organization.id,
    );
    if (!v) throw new PartnerError('403', 'Bukti layanan tidak dapat diakses.');
    assigned = v.listingId;
  }
  if (resource.startsWith('ticket')) {
    const v = store.tickets.find(
      (v) => v.id === ref && v.orgId === ctx.organization.id,
    );
    if (!v)
      throw new PartnerError('403', 'Lampiran tiket tidak dapat diakses.');
    assigned = v.listingId ?? undefined;
  }
  if (assigned)
    partnerGuard(
      resource.startsWith('quote')
        ? 'crm'
        : resource.startsWith('service')
          ? 'operation'
          : 'support',
      assigned,
    );
  const value = files.get(id);
  if (
    !value ||
    value.orgId !== ctx.organization.id ||
    value.resource !== resource
  )
    throw new PartnerError(
      '403',
      'Lampiran tidak tersedia atau tidak diizinkan pada sesi ini.',
    );
  return value.file;
}
if (typeof window !== 'undefined')
  window.addEventListener('gobuking:demo-account-change', () => files.clear());

export function readPartnerInquiryAttachment(
  inquiryId: string,
  fileId: string,
) {
  const ctx = partnerGuard('crm'),
    v = sourceInquiries(ctx).find((i) => i.id === inquiryId);
  if (!v || !v.attachments.some((f) => f.id === fileId))
    throw new PartnerError('403', 'Lampiran inquiry tidak diizinkan.');
  partnerGuard('crm', v.listingId);
  return readInquiryFile(inquiryId, fileId);
}
export function readPartnerPlatformFile(
  orgId: string,
  resource: string,
  id: string,
) {
  const v = files.get(id);
  if (!v || v.orgId !== orgId || v.resource !== resource)
    throw new PartnerError(
      'FILE_MISSING',
      'Isi dokumen tidak tersedia pada sesi ini.',
    );
  return v.file;
}
