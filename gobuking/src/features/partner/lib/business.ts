import { getDemoAccount } from '@/features/account/lib/demo-auth';
import { businessSchema, reasonSchema } from './schemas';
import { validatePartnerFiles, storePartnerFiles } from './files';
import {
  getPartnerContext,
  readPartnerStore,
  savePartnerStore,
  guarded,
  recordActivity,
  PartnerError,
} from './store';
import { demoPartnerListings } from './catalog';
import { writePublicPartnerInventory } from './public-inventory';
import type { Business } from './types';
export function syncPartnerPublic() {
  const s = readPartnerStore();
  writePublicPartnerInventory(
    s.listings
      .filter((l) => l.sourceId)
      .map((l) => ({
        category: l.category,
        sourceId: l.sourceId!,
        resourceId: l.resourceId,
        salesOpen:
          s.businesses.find((o) => o.id === l.orgId)?.status === 'approved' &&
          l.status === 'published',
        version: l.version + (s.calendarVersions[l.id] ?? 0),
        calendar: s.calendars[l.id] ?? [],
      })),
  );
}
export async function createPartnerOrganization(
  input: Parameters<typeof businessSchema.parse>[0],
  demo = false,
) {
  const account = getDemoAccount();
  if (!account)
    throw new PartnerError('401', 'Masuk kembali untuk membuka ruang mitra.');
  const valid = businessSchema.parse(input);
  const s = readPartnerStore();
  const id = `ORG-${crypto.randomUUID().slice(0, 8)}`;
  const business: Business = {
    ...valid,
    id,
    status: 'draft',
    version: 1,
    documents: [],
    contract: { version: 1, acceptedAt: null },
    bank: null,
    pendingBank: null,
    closureReason: null,
  };
  s.businesses.push(business);
  s.memberships.push({
    id: crypto.randomUUID(),
    orgId: id,
    accountId: account.id,
    demoOwnerId: null,
    name: account.name,
    email: account.email,
    role: 'owner',
    listingIds: [],
    status: 'active',
    version: 1,
  });
  savePartnerStore(s);
  if (demo) await setupPartnerDemo(id);
  return id;
}
async function setupPartnerDemo(id: string) {
  const ctx = getPartnerContext(),
    s = readPartnerStore();
  if (ctx.organization.id !== id || s.listings.some((l) => l.sourceId))
    throw new PartnerError(
      '409',
      'Katalog contoh sudah dikelola organisasi lain. Buat listing draft untuk usaha Anda.',
    );
  const first = s.businesses.find((o) => o.id === id)!;
  first.name = 'Nusa Hospitality';
  first.status = 'approved';
  first.contract.acceptedAt = new Date().toISOString();
  first.bank = {
    name: 'Bank demo',
    holder: first.name,
    last4: '8841',
    version: 1,
  };
  const car: Business = {
    ...structuredClone(first),
    id: `ORG-${crypto.randomUUID().slice(0, 8)}`,
    name: 'Jelajah Mobility',
    documents: [],
    bank: {
      name: 'Bank demo',
      holder: 'Jelajah Mobility',
      last4: '5092',
      version: 1,
    },
  };
  s.businesses.push(car);
  s.listings.push(...demoPartnerListings(first.id, car.id));
  const account = getDemoAccount()!;
  for (const org of [first, car]) {
    if (org.id === car.id)
      s.memberships.push({
        id: crypto.randomUUID(),
        orgId: org.id,
        accountId: account.id,
        demoOwnerId: null,
        name: account.name,
        email: account.email,
        role: 'owner',
        listingIds: [],
        status: 'active',
        version: 1,
      });
    for (const role of ['operations', 'finance'] as const)
      s.memberships.push({
        id: crypto.randomUUID(),
        orgId: org.id,
        accountId: null,
        demoOwnerId: account.id,
        name:
          role === 'operations'
            ? 'Nadia · Operations demo'
            : 'Dimas · Finance demo',
        email: `${role}@example.test`,
        role,
        listingIds: s.listings
          .filter((l) => l.orgId === org.id)
          .map((l) => l.id),
        status: 'active',
        version: 1,
      });
  }
  recordActivity(s, ctx, 'Workspace demo diaktifkan', id);
  savePartnerStore(s);
  syncPartnerPublic();
}
export async function saveBusinessDraft(
  input: Parameters<typeof businessSchema.parse>[0],
  version: number,
  files: File[],
  contract: boolean,
) {
  const valid = businessSchema.parse(input);
  await validatePartnerFiles(files);
  const ctx = await guarded('business'),
    s = readPartnerStore(),
    o = s.businesses.find((v) => v.id === ctx.organization.id)!;
  if (o.version !== version)
    throw new PartnerError(
      '409',
      'Profil usaha berubah. Muat ulang versi terbaru.',
    );
  Object.assign(o, valid);
  o.version++;
  o.documents.push(...storePartnerFiles(o.id, `business:${o.id}`, files));
  if (contract) o.contract.acceptedAt = new Date().toISOString();
  recordActivity(s, ctx, 'Draft usaha diperbarui', o.id);
  savePartnerStore(s);
  return o;
}
export async function submitBusinessVerification() {
  const ctx = await guarded('business'),
    s = readPartnerStore(),
    o = s.businesses.find((v) => v.id === ctx.organization.id)!;
  businessSchema.parse(o);
  if (!o.documents.length || !o.contract.acceptedAt)
    throw new PartnerError(
      'VALIDATION',
      'Unggah dokumen usaha dan setujui perjanjian sebelum verifikasi.',
    );
  o.status = 'under_review';
  o.version++;
  recordActivity(s, ctx, 'Verifikasi usaha diajukan', o.id);
  savePartnerStore(s);
  syncPartnerPublic();
}
export async function requestBankChange(input: {
  name: string;
  holder: string;
  number: string;
}) {
  const ctx = await guarded('bank');
  if (
    input.name.trim().length < 2 ||
    input.holder.trim().length < 2 ||
    !/^\d{8,20}$/.test(input.number)
  )
    throw new PartnerError(
      'VALIDATION',
      'Lengkapi bank, pemilik, dan nomor rekening 8–20 digit.',
    );
  const s = readPartnerStore(),
    o = s.businesses.find((v) => v.id === ctx.organization.id)!;
  o.pendingBank = {
    name: input.name.trim(),
    holder: input.holder.trim(),
    last4: input.number.slice(-4),
    version: (o.bank?.version ?? 0) + 1,
    status: 'under_review',
  };
  o.version++;
  recordActivity(
    s,
    ctx,
    'Perubahan rekening diajukan untuk verifikasi ulang',
    o.id,
  );
  savePartnerStore(s);
  return o;
}
export async function closePartnerSales(reason: string) {
  reasonSchema.parse(reason);
  const ctx = await guarded('closure'),
    s = readPartnerStore(),
    o = s.businesses.find((v) => v.id === ctx.organization.id)!;
  o.status = 'closing';
  o.closureReason = reason;
  o.version++;
  recordActivity(
    s,
    ctx,
    'Penjualan baru ditutup; kewajiban reservasi tetap dilayani',
    o.id,
  );
  savePartnerStore(s);
  syncPartnerPublic();
}
