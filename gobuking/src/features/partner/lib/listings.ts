import { listingSchema, calendarSchema } from './schemas';
import {
  readPartnerStore,
  savePartnerStore,
  guarded,
  ownListings,
  recordActivity,
  PartnerError,
  partnerGuard,
  knownCommand,
  markCommand,
  unknownPartnerResult,
} from './store';
import { syncPartnerPublic } from './business';
import { sourceReservations } from './sources';
import type { CalendarPreview, PartnerListing } from './types';
export async function listPartnerListings() {
  await guarded();
  return ownListings();
}
export function missingListingFields(l: PartnerListing) {
  const missing: string[] = [];
  if (l.name.trim().length < 3) missing.push('Nama listing');
  if (l.address.trim().length < 10) missing.push('Alamat listing');
  if (l.description.trim().length < 20)
    missing.push('Deskripsi minimal 20 karakter');
  if (l.price <= 0) missing.push('Tarif dasar');
  if (l.stock < 1) missing.push('Stok awal');
  if (l.capacity < 1)
    missing.push(
      l.category === 'car'
        ? 'Jumlah kursi'
        : l.category === 'mice' || l.category === 'wedding'
          ? 'Kapasitas acara'
          : 'Kapasitas tamu',
    );
  if (!l.facilities.length)
    missing.push(l.category === 'car' ? 'Fitur kendaraan' : 'Fasilitas');
  return missing;
}
export async function saveListingDraft(
  id: string | null,
  input: Parameters<typeof listingSchema.parse>[0],
  version: number,
) {
  const valid = listingSchema.parse(input),
    ctx = await guarded('listing', id ?? undefined),
    s = readPartnerStore();
  let l = s.listings.find((v) => v.id === id);
  if (l) {
    if (l.version !== version)
      throw new PartnerError(
        '409',
        'Listing berubah. Muat ulang versi terbaru.',
      );
    Object.assign(l, valid, { version: l.version + 1, status: 'draft' });
  } else {
    l = {
      ...valid,
      id: `LIST-${crypto.randomUUID().slice(0, 8)}`,
      orgId: ctx.organization.id,
      sourceId: null,
      image: 'hotel',
      resourceId: `manual:${crypto.randomUUID()}`,
      status: 'draft',
      version: 1,
      liveName: null,
      zone: 'Asia/Jakarta',
      publicPath: null,
    };
    s.listings.push(l);
    const m = s.memberships.find((v) => v.id === ctx.membership.id)!;
    if (m.role !== 'owner') m.listingIds.push(l.id);
  }
  recordActivity(s, ctx, 'Draft listing disimpan', l.id, l.id);
  savePartnerStore(s);
  syncPartnerPublic();
  return l;
}
export async function submitListingReview(id: string) {
  const ctx = await guarded('listing', id),
    s = readPartnerStore(),
    l = s.listings.find((v) => v.id === id)!;
  const missing = missingListingFields(l);
  if (missing.length)
    throw new PartnerError('VALIDATION', `Lengkapi: ${missing.join(', ')}.`);
  l.status = 'under_review';
  l.version++;
  recordActivity(s, ctx, 'Listing diajukan untuk review platform', id, id);
  savePartnerStore(s);
  syncPartnerPublic();
}
export async function setListingSales(
  id: string,
  action: 'pause' | 'resume' | 'archive',
) {
  const ctx = await guarded('listing', id),
    s = readPartnerStore(),
    l = s.listings.find((v) => v.id === id)!;
  if (
    action === 'resume' &&
    (!l.liveName ||
      l.status !== 'paused' ||
      ctx.organization.status !== 'approved')
  )
    throw new PartnerError(
      '409',
      'Hanya listing terpublikasi yang dijeda pada usaha approved dapat dibuka kembali.',
    );
  l.status =
    action === 'pause'
      ? 'paused'
      : action === 'resume'
        ? 'published'
        : 'archived';
  l.version++;
  recordActivity(
    s,
    ctx,
    action === 'archive'
      ? 'Listing diarsipkan; reservasi lama tetap dilayani'
      : action === 'pause'
        ? 'Penjualan listing dijeda'
        : 'Penjualan listing dibuka',
    id,
    id,
  );
  savePartnerStore(s);
  syncPartnerPublic();
}
function dates(start: string, end: string) {
  const result: string[] = [];
  for (
    let date = Date.parse(start + 'T00:00:00Z');
    date <= Date.parse(end + 'T00:00:00Z');
    date += 86400000
  ) {
    result.push(new Date(date).toISOString().slice(0, 10));
    if (result.length > 90)
      throw new PartnerError(
        'VALIDATION',
        'Rentang bulk update maksimal 90 hari.',
      );
  }
  return result;
}
export async function previewCalendarChange(
  id: string,
  input: Parameters<typeof calendarSchema.parse>[0],
): Promise<CalendarPreview> {
  const v = calendarSchema.parse(input);
  const ctx = await guarded('inventory', id),
    s = readPartnerStore(),
    l = s.listings.find((v) => v.id === id)!,
    bookings = sourceReservations(ctx).filter((b) => b.listingId === id);
  if (l.status === 'archived')
    throw new PartnerError(
      '404',
      'Listing diarsipkan dan tidak dapat diperbarui.',
    );
  const rows = dates(v.start, v.end).map((date) => {
    const reserved = bookings
      .filter(
        (b) =>
          ['confirmed', 'in_use', 'awaiting_payment'].includes(b.status) &&
          b.start.slice(0, 10) <= date &&
          (l.category === 'car'
            ? b.end.slice(0, 10) >= date
            : b.end.slice(0, 10) > date),
      )
      .reduce((sum, b) => {
        const raw = readSourceQuantity(b.id);
        return sum + raw;
      }, 0);
    return {
      date,
      stock: v.stock,
      price: v.price,
      stopSell: v.stopSell,
      minStay: v.minStay,
      buffer: v.buffer,
      ratePlan: v.ratePlan,
      reserved,
      conflict:
        v.stock < reserved
          ? 'Stok lebih kecil dari confirmed + hold aktif.'
          : l.category === 'car' && l.sourceId && v.stock > 2
            ? 'Stok melebihi armada demo yang tersedia (2 kendaraan).'
            : l.category !== 'hotel' && l.category !== 'car' && v.stock > 1
              ? 'Resource ini dijual sebagai satu unit.'
              : null,
    };
  });
  return {
    id: crypto.randomUUID(),
    listingId: id,
    version: `${l.version}:${s.calendarVersions[id] ?? 0}:${bookings.map((b) => b.version).join(',')}`,
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    rows,
  };
}
function readSourceQuantity(id: string) {
  return id.startsWith('CAR-') ? 1 : sourceStayQuantity(id);
}
import { readDemoBooking } from '@/features/hotel/lib/booking-adapter';
const sourceStayQuantity = (id: string) =>
  readDemoBooking(id)?.query.rooms ?? 1;
export async function applyCalendarChange(
  preview: CalendarPreview,
  commandId: string,
  scenario = 'ready',
) {
  const ctx = await guarded('inventory', preview.listingId),
    s = readPartnerStore();
  if (knownCommand(s, ctx, commandId, preview.listingId)) return;
  const first = preview.rows[0],
    last = preview.rows.at(-1);
  if (!first || !last)
    throw new PartnerError('VALIDATION', 'Preview kalender belum tersedia.');
  const fresh = await previewCalendarChange(preview.listingId, {
    start: first.date,
    end: last.date,
    ...first,
  });
  const latestCtx = partnerGuard('inventory', preview.listingId);
  if (latestCtx.sessionKey !== ctx.sessionKey)
    throw new PartnerError('409', 'Izin berubah. Muat ulang kalender.');
  if (
    fresh.version !== preview.version ||
    Date.parse(preview.expiresAt) <= Date.now()
  )
    throw new PartnerError(
      '409',
      'Kalender atau reservasi berubah. Buat preview baru.',
    );
  if (fresh.rows.some((r) => r.conflict))
    throw new PartnerError(
      'CONFLICT',
      'Baris konflik ditolak. Perbaiki stok lalu buat preview baru.',
    );
  const latest = readPartnerStore();
  latest.calendars[preview.listingId] = [
    ...(latest.calendars[preview.listingId] ?? []).filter(
      (r) => !fresh.rows.some((f) => f.date === r.date),
    ),
    ...fresh.rows.map(({ reserved, conflict, ...r }) => {
      void reserved;
      void conflict;
      return r;
    }),
  ].sort((a, b) => a.date.localeCompare(b.date));
  latest.calendarVersions[preview.listingId] =
    (latest.calendarVersions[preview.listingId] ?? 0) + 1;
  recordActivity(
    latest,
    ctx,
    'Kalender dan tarif diperbarui',
    preview.listingId,
    preview.listingId,
  );
  markCommand(latest, ctx, commandId, preview.listingId);
  savePartnerStore(latest);
  syncPartnerPublic();
  unknownPartnerResult(scenario);
}
