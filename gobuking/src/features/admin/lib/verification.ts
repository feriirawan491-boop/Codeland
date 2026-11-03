import {
  readPartnerStore,
  savePartnerStore,
} from '@/features/partner/lib/store';
import { syncPartnerPublic } from '@/features/partner/lib/business';
import { missingListingFields } from '@/features/partner/lib/listings';
import {
  guardedAdmin,
  readAdminStore,
  saveAdminStore,
  adminAudit,
  AdminError,
  assertReason,
  adminScoped,
} from './store';
import { validateAdminFiles, rememberAdminFiles } from './files';
import type { AdminContext } from './types';
import { publishCatalog } from './public-catalog';
export function verificationBlockers(ctx: AdminContext, id: string) {
  const p = readPartnerStore(),
    o = p.businesses.find((o) => o.id === id);
  if (!o || !adminScoped(ctx, id))
    throw new AdminError('403', 'Mitra tidak termasuk lingkup admin.');
  const v = readAdminStore().verifications[id],
    items: string[] = [];
  if (!o.name || !o.email || !o.phone || !o.address || !v?.pic)
    items.push('PIC usaha belum diverifikasi');
  if (!o.documents.length || !v?.documents)
    items.push('Dokumen usaha belum diverifikasi');
  if (!o.bank || !v?.bank) items.push('Rekening belum tervalidasi');
  if (!o.contract.acceptedAt || !v?.contract)
    items.push('Perjanjian belum disetujui dan diverifikasi');
  return items;
}
export async function updateVerification(
  id: string,
  version: number,
  checks: {
    pic: boolean;
    documents: boolean;
    bank: boolean;
    contract: boolean;
  },
  files: File[],
  reason: string,
) {
  assertReason(reason);
  await validateAdminFiles(files, true);
  const ctx = await guardedAdmin('verify', id),
    p = readPartnerStore(),
    o = p.businesses.find((o) => o.id === id);
  if (!o || o.version !== version)
    throw new AdminError(
      '409',
      'Versi usaha berubah. Muat ulang sebelum verifikasi.',
    );
  if (checks.documents && !o.documents.length)
    throw new AdminError('VALIDATION', 'Dokumen usaha belum tersedia.');
  if (checks.bank && !o.bank && !o.pendingBank)
    throw new AdminError('VALIDATION', 'Belum ada pengajuan rekening.');
  if (checks.contract && !o.contract.acceptedAt)
    throw new AdminError('VALIDATION', 'Perjanjian belum disetujui mitra.');
  const s = readAdminStore(),
    old = s.verifications[id];
  s.verifications[id] = {
    orgId: id,
    version: (old?.version ?? 0) + 1,
    ...checks,
    evidence: [
      ...(old?.evidence ?? []),
      ...rememberAdminFiles(`verification:${id}`, files),
    ],
    decisions: old?.decisions ?? [],
  };
  adminAudit(s, ctx, 'Checklist verifikasi diperbarui', id, reason, id);
  saveAdminStore(s);
}
export async function decideVerification(
  id: string,
  version: number,
  action: 'approve' | 'revision' | 'reject' | 'suspend' | 'bank',
  reason: string,
) {
  assertReason(reason);
  const ctx = await guardedAdmin('verify', id),
    p = readPartnerStore(),
    o = p.businesses.find((o) => o.id === id);
  if (!o || o.version !== version)
    throw new AdminError(
      '409',
      'Pengajuan usaha berubah. Muat ulang versi terbaru.',
    );
  const s = readAdminStore(),
    v = s.verifications[id];
  if (action === 'bank') {
    if (!v?.bank || !v.evidence.length || !o.pendingBank)
      throw new AdminError(
        'VALIDATION',
        'Validasi rekening dan bukti diperlukan.',
      );
    const { status, ...bank } = o.pendingBank;
    void status;
    o.bank = bank;
    o.pendingBank = null;
  } else if (action === 'approve') {
    const blockers = verificationBlockers(ctx, id);
    if (blockers.length || !v?.evidence.length)
      throw new AdminError(
        'VALIDATION',
        `Aktivasi ditolak: ${blockers.join('; ') || 'Bukti review belum tersedia'}.`,
      );
    o.status = 'approved';
  } else o.status = action === 'suspend' ? 'suspended' : 'draft';
  o.version++;
  if (v)
    v.decisions.unshift({
      id: crypto.randomUUID(),
      actor: ctx.actor.name,
      action,
      reason,
      at: new Date().toISOString(),
      businessVersion: o.version,
    });
  adminAudit(s, ctx, `Keputusan verifikasi: ${action}`, id, reason, id);
  savePartnerStore(p);
  saveAdminStore(s);
  syncPartnerPublic();
}
export function listingDuplicates(id: string) {
  const p = readPartnerStore(),
    l = p.listings.find((l) => l.id === id);
  if (!l) return [];
  const normalized = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
  return p.listings.filter(
    (other) =>
      other.id !== id &&
      ((!!l.sourceId &&
        other.sourceId === l.sourceId &&
        other.category !== l.category) ||
        other.resourceId === l.resourceId ||
        (['home', 'hotel'].includes(l.category) &&
          ['home', 'hotel'].includes(other.category) &&
          l.address.length > 15 &&
          !l.address.includes('sesuai katalog') &&
          normalized(other.address) === normalized(l.address))),
  );
}
export async function decideListing(
  id: string,
  version: number,
  action: 'publish' | 'revision' | 'suspend' | 'reject',
  reason: string,
  input: { sharedWith: string; locationId: string; image: string },
) {
  assertReason(reason);
  const ctx = await guardedAdmin('catalog'),
    p = readPartnerStore(),
    l = p.listings.find((v) => v.id === id);
  if (!l) throw new AdminError('404', 'Listing tidak ditemukan.');
  if (!adminScoped(ctx, l.orgId))
    throw new AdminError('403', 'Listing di luar lingkup admin.');
  if (l.version !== version)
    throw new AdminError('409', 'Listing berubah. Tinjau versi terbaru.');
  if (action === 'publish') {
    const missing = missingListingFields(l);
    if (missing.length)
      throw new AdminError(
        'VALIDATION',
        `Listing belum lengkap: ${missing.join(', ')}.`,
      );
    if (p.businesses.find((o) => o.id === l.orgId)?.status !== 'approved')
      throw new AdminError('VALIDATION', 'Mitra belum aktif untuk publikasi.');
    const duplicates = listingDuplicates(id);
    if (input.sharedWith) {
      const target = p.listings.find((v) => v.id === input.sharedWith);
      if (!target || target.orgId !== l.orgId)
        throw new AdminError(
          '403',
          'Resource bersama harus dimiliki organisasi yang sama.',
        );
      l.resourceId = target.resourceId;
      l.stock = Math.min(l.stock, target.stock);
    }
    if (duplicates.some((v) => v.resourceId !== l.resourceId))
      throw new AdminError(
        'DUPLICATE',
        'Duplikasi inventori perlu ditautkan ke resource bersama atau ditolak.',
      );
    l.sourceId ??= `custom-${l.id.toLowerCase()}`;
    l.image = input.image;
    l.status = 'published';
    l.liveName = l.name;
    publishCatalog(l, input.locationId, input.image);
    l.publicPath = `/${l.category === 'hotel' ? 'hotels' : l.category === 'home' ? 'homes' : l.category === 'car' ? 'cars' : l.category}/${l.sourceId.startsWith('custom-') ? l.sourceId : (l.publicPath?.split('/').at(-1) ?? l.sourceId)}`;
  } else l.status = action === 'suspend' ? 'paused' : 'draft';
  l.version++;
  const s = readAdminStore();
  adminAudit(s, ctx, `Moderasi listing: ${action}`, id, reason, l.orgId);
  savePartnerStore(p);
  saveAdminStore(s);
  syncPartnerPublic();
}
