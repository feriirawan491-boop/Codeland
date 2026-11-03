import { z } from 'zod';
import { adminBookings } from './sources';
import {
  guardedAdmin,
  readAdminStore,
  saveAdminStore,
  adminAudit,
  AdminError,
  assertReason,
  adminScoped,
} from './store';
import {
  DEFAULT_PLATFORM_POLICY,
  publishPolicyVersions,
} from '@/features/booking/lib/platform-policy';
import type { PlatformPolicy, AdminContext, AdminRole } from './types';
import { PUBLIC_ASSETS } from '@/features/catalog/lib/public-state';
import { readPartnerStore } from '@/features/partner/lib/store';
import { syncPartnerPublic } from '@/features/partner/lib/business';
import type { AccountReview } from '@/features/dashboard/lib/types';
export const cmsSchema = z
  .object({
    kind: z.enum(['banner', 'destination', 'help', 'policy', 'promo']),
    title: z.string().trim().min(5).max(120),
    body: z.string().trim().min(15).max(2000),
    href: z
      .string()
      .refine(
        (v) => /^\/(?:$|hotels|homes|cars|mice|wedding|offers|info|#)/.test(v),
        'Gunakan tautan halaman publik Gobuking.',
      ),
    image: z
      .string()
      .refine(
        (v) => PUBLIC_ASSETS.some((a) => a === v),
        'Gunakan aset foto publik.',
      ),
    seoTitle: z.string().max(70),
    seoDescription: z.string().max(170),
    zone: z.enum(['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura']),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    listingId: z.string().nullable(),
    discountPercent: z.number().int().min(0).max(100),
    basis: z.enum(['nightly_base', 'unit_rate', 'venue_quote']).nullable(),
    fundedBy: z.enum(['platform', 'partner']).nullable(),
  })
  .superRefine((v, c) => {
    if (v.startsAt >= v.endsAt)
      c.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'Waktu akhir harus setelah awal periode.',
      });
    if (
      v.kind === 'promo' &&
      (!v.listingId || !v.basis || !v.fundedBy || v.discountPercent <= 0)
    )
      c.addIssue({
        code: 'custom',
        path: ['discountPercent'],
        message:
          'Promo memerlukan listing, dasar diskon, persentase, dan penanggung biaya.',
      });
  });
export function toScheduledIso(value: string, zone: string) {
  const offset =
    zone === 'Asia/Makassar'
      ? '+08:00'
      : zone === 'Asia/Jayapura'
        ? '+09:00'
        : '+07:00';
  const date = new Date(value + ':00' + offset);
  if (!Number.isFinite(date.getTime()))
    throw new AdminError('VALIDATION', 'Waktu jadwal tidak valid.');
  return date.toISOString();
}
export function canAccessCms(
  ctx: AdminContext,
  item: { listingId: string | null },
) {
  if (ctx.actor.orgIds === 'all') return true;
  const listing = readPartnerStore().listings.find(
    (l) => l.id === item.listingId,
  );
  return !!listing && adminScoped(ctx, listing.orgId);
}
export async function saveCms(
  id: string | null,
  version: number,
  input: z.input<typeof cmsSchema>,
) {
  const valid = cmsSchema.parse(input),
    ctx = await guardedAdmin('cms'),
    s = readAdminStore();
  if (!canAccessCms(ctx, valid))
    throw new AdminError('403', 'Konten berada di luar lingkup admin.');
  if (valid.kind === 'promo') {
    const l = readPartnerStore().listings.find(
      (l) => l.id === valid.listingId && l.status === 'published',
    );
    if (!l || !adminScoped(ctx, l.orgId))
      throw new AdminError(
        'VALIDATION',
        'Pilih listing aktif di lingkup admin.',
      );
    if (
      (l.category === 'car' && valid.basis !== 'unit_rate') ||
      (['hotel', 'home'].includes(l.category) &&
        valid.basis !== 'nightly_base') ||
      (['mice', 'wedding'].includes(l.category) &&
        valid.basis !== 'venue_quote')
    )
      throw new AdminError(
        'VALIDATION',
        'Dasar diskon tidak sesuai kategori listing.',
      );
  }
  let v = s.cms.find((c) => c.id === id);
  if (v && !canAccessCms(ctx, v))
    throw new AdminError('403', 'Konten berada di luar lingkup admin.');
  if (v && v.version !== version)
    throw new AdminError('409', 'Konten berubah. Muat ulang versi terbaru.');
  if (v) Object.assign(v, valid, { version: v.version + 1, status: 'draft' });
  else {
    v = {
      ...valid,
      id: `CMS-${crypto.randomUUID().slice(0, 8)}`,
      status: 'draft',
      version: 1,
    };
    s.cms.push(v);
  }
  adminAudit(
    s,
    ctx,
    'Draft CMS disimpan',
    v.id,
    'Draft konten belum dipublikasikan.',
  );
  saveAdminStore(s);
  return v;
}
export async function publishCms(
  id: string,
  version: number,
  publish: boolean,
  reason: string,
) {
  assertReason(reason);
  const ctx = await guardedAdmin('cms'),
    s = readAdminStore(),
    v = s.cms.find((c) => c.id === id);
  if (!v || v.version !== version)
    throw new AdminError('409', 'Konten berubah. Muat ulang preview.');
  if (!canAccessCms(ctx, v))
    throw new AdminError('403', 'Konten berada di luar lingkup admin.');
  cmsSchema.parse(v);
  if (publish && Date.parse(v.endsAt) <= Date.now())
    throw new AdminError('VALIDATION', 'Periode konten sudah berakhir.');
  v.status = publish ? 'published' : 'archived';
  v.version++;
  sessionStorage.setItem(
    'gobuking:public-cms:v1',
    JSON.stringify(
      s.cms
        .filter((c) => c.status === 'published')
        .map((c) => ({
          ...c,
          listingId: c.listingId
            ? (readPartnerStore().listings.find((l) => l.id === c.listingId)
                ?.sourceId ?? null)
            : null,
        })),
    ),
  );
  window.dispatchEvent(new Event('gobuking:cms-changed'));
  adminAudit(
    s,
    ctx,
    publish ? 'CMS dijadwalkan/publikasi' : 'CMS diarsipkan',
    id,
    reason,
  );
  saveAdminStore(s);
}
export const policySchema = z.object({
  commissionBps: z.number().int().min(0).max(10000),
  venueSlaHours: z.number().int().min(1).max(720),
  cutoffHour: z.number().int().min(0).max(23),
  refundReviewHours: z.number().int().min(1).max(720),
  effectiveAt: z.iso.datetime(),
  scope: z.literal('future_only'),
  categories: z.object({
    hotel: z.boolean(),
    home: z.boolean(),
    car: z.boolean(),
    mice: z.boolean(),
    wedding: z.boolean(),
  }),
  note: z.string().trim().min(10).max(1000),
});
export async function updatePlatformPolicy(
  version: number,
  input: z.input<typeof policySchema>,
) {
  const valid = policySchema.parse(input),
    ctx = await guardedAdmin('settings'),
    s = readAdminStore(),
    current = s.policies.at(-1) ?? DEFAULT_PLATFORM_POLICY;
  if (current.version !== version)
    throw new AdminError(
      '409',
      'Konfigurasi berubah. Tinjau diff versi terbaru.',
    );
  const value: PlatformPolicy = { ...valid, version: current.version + 1 };
  s.policies.push(value);
  publishPolicyVersions(s.policies);
  adminAudit(
    s,
    ctx,
    'Konfigurasi berversi diubah untuk data baru',
    'platform-policy',
    valid.note,
  );
  saveAdminStore(s);
  syncPartnerPublic();
  return value;
}
export function platformReviews(ctx: AdminContext) {
  const reviews = Object.values(
    JSON.parse(
      sessionStorage.getItem('gobuking:account-reviews:v1') ?? '{}',
    ) as Record<string, AccountReview>,
  );
  const p = readPartnerStore();
  return reviews.flatMap((r) => {
    const reports = p.reviewReports.filter((v) => v.reviewId === r.id),
      orgId =
        reports[0]?.orgId ??
        adminBookings(ctx).find((b) => b.id === r.bookingId)?.orgId ??
        null;
    return adminScoped(ctx, orgId) ? [{ ...r, orgId, reports }] : [];
  });
}
export async function moderateReview(
  id: string,
  action: 'publish' | 'retain' | 'reject',
  guideline: string,
  reason: string,
) {
  assertReason(reason);
  if (
    !['privacy', 'abuse', 'irrelevant', 'no_violation'].includes(guideline) ||
    (action === 'reject' && guideline === 'no_violation')
  )
    throw new AdminError(
      'VALIDATION',
      'Penolakan harus berdasarkan pelanggaran pedoman, bukan nilai ulasan.',
    );
  const ctx = await guardedAdmin('moderation'),
    r = platformReviews(ctx).find((r) => r.id === id);
  if (!r) throw new AdminError('403', 'Ulasan tidak dapat diakses.');
  const values = JSON.parse(
    sessionStorage.getItem('gobuking:account-reviews:v1') ?? '{}',
  ) as Record<string, AccountReview>;
  values[id].status = action === 'reject' ? 'rejected' : 'published';
  values[id].reason = reason;
  sessionStorage.setItem('gobuking:account-reviews:v1', JSON.stringify(values));
  window.dispatchEvent(new Event('gobuking:dashboard-changed'));
  const s = readAdminStore();
  s.moderation.push({
    id: crypto.randomUUID(),
    reviewId: id,
    action,
    reason,
    guideline,
    actor: ctx.actor.name,
    at: new Date().toISOString(),
  });
  adminAudit(
    s,
    ctx,
    'Keputusan moderasi berbasis pedoman',
    id,
    reason,
    r.orgId,
  );
  saveAdminStore(s);
}
export async function restrictAccount(
  accountId: string,
  active: boolean,
  reason: string,
) {
  assertReason(reason);
  const ctx = await guardedAdmin('customer'),
    s = readAdminStore();
  s.restrictions = s.restrictions.filter((v) => v.accountId !== accountId);
  s.restrictions.push({ accountId, active, reason });
  adminAudit(
    s,
    ctx,
    active ? 'Akun dibatasi untuk review' : 'Pembatasan akun dicabut',
    accountId,
    reason,
  );
  saveAdminStore(s);
  sessionStorage.setItem(
    'gobuking:restricted-accounts:v1',
    JSON.stringify(
      s.restrictions.filter((v) => v.active).map((v) => v.accountId),
    ),
  );
  window.dispatchEvent(new Event('gobuking:account-restriction-changed'));
}
export async function manageAdminActor(
  id: string | null,
  input: {
    name: string;
    email: string;
    role: AdminRole;
    orgIds: 'all' | string[];
    active: boolean;
  },
  reason: string,
) {
  assertReason(reason);
  const ctx = await guardedAdmin('access'),
    s = readAdminStore();
  if (
    !input.name.trim() ||
    !z.email().safeParse(input.email).success ||
    ![
      'super_admin',
      'partnership',
      'operations',
      'finance_maker',
      'finance_checker',
    ].includes(input.role)
  )
    throw new AdminError(
      'VALIDATION',
      'Nama, email, dan peran platform wajib valid.',
    );
  const existing = s.actors.find((a) => a.id === id);
  if (existing?.id === ctx.actor.id && !input.active)
    throw new AdminError(
      'VALIDATION',
      'Gunakan admin lain untuk menonaktifkan akses Anda.',
    );
  if (
    existing?.role === 'super_admin' &&
    (!input.active || input.role !== 'super_admin') &&
    s.actors.filter((a) => a.active && a.role === 'super_admin').length <= 1
  )
    throw new AdminError(
      'VALIDATION',
      'Minimal satu Super Admin aktif harus dipertahankan.',
    );
  if (id) {
    if (!existing) throw new AdminError('404', 'Staf tidak ditemukan.');
    Object.assign(existing, input, { version: existing.version + 1 });
  } else {
    if (s.actors.some((a) => a.email === input.email && a.active))
      throw new AdminError('VALIDATION', 'Email staf sudah terdaftar.');
    s.actors.push({
      ...input,
      id: crypto.randomUUID(),
      accountId: null,
      demoOwnerId: null,
      version: 1,
    });
  }
  adminAudit(s, ctx, 'Akses platform diperbarui', id ?? 'invitation', reason);
  saveAdminStore(s);
}
export async function acceptAdminInvitation(code: string) {
  const { getDemoAccount } = await import('@/features/account/lib/demo-auth');
  const a = getDemoAccount(),
    s = readAdminStore(),
    member = s.actors.find(
      (v) => v.email === a?.email && v.active && !v.accountId && !v.demoOwnerId,
    );
  if (!a || !member || code !== '123456')
    throw new AdminError('403', 'Undangan dan verifikasi akun tidak sesuai.');
  member.accountId = a.id;
  member.version++;
  saveAdminStore(s);
}
