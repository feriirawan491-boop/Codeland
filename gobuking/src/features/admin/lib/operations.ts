import { getDemoAccount } from '@/features/account/lib/demo-auth';
import { readDemoBooking } from '@/features/hotel/lib/booking-adapter';
import { carRecords } from '@/features/car/lib/store';
import {
  guardedAdmin,
  adminGuard,
  readAdminStore,
  saveAdminStore,
  adminAudit,
  AdminError,
  assertReason,
  adminScoped,
} from './store';
import { getAdminBooking, adminBookings } from './sources';
import { inquiryRecords, writeInquiry } from '@/features/partner/lib/sources';
import {
  readPartnerStore,
  savePartnerStore,
} from '@/features/partner/lib/store';
import type { AdminCase, AdminContext } from './types';
import type { SupportTicket } from '@/features/dashboard/lib/types';
import { validateAdminFiles, rememberAdminFiles } from './files';
export function platformInquiries(ctx: AdminContext) {
  const p = readPartnerStore();
  return Object.values(inquiryRecords()).flatMap((v) => {
    const l = p.listings.find(
      (l) => l.sourceId === v.spaceId && l.category === v.service,
    );
    return adminScoped(ctx, l?.orgId ?? null)
      ? [{ ...v, orgId: l?.orgId ?? null }]
      : [];
  });
}
export async function assignVenuePic(
  id: string,
  actorId: string,
  reason: string,
) {
  assertReason(reason);
  const ctx = await guardedAdmin('crm'),
    v = platformInquiries(ctx).find((v) => v.id === id),
    s = readAdminStore(),
    actor = s.actors.find(
      (a) =>
        a.id === actorId &&
        a.active &&
        ['super_admin', 'partnership', 'operations'].includes(a.role),
    );
  if (!v || !actor || !adminScoped({ ...ctx, actor }, v.orgId))
    throw new AdminError('403', 'Inquiry atau PIC berada di luar lingkup.');
  v.pic = { name: actor.name, team: 'Platform Venue Operations' };
  v.status = 'assigned';
  v.history.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    label: 'PIC platform ditugaskan; waktu masuk dan SLA tetap',
  });
  writeInquiry(v);
  adminAudit(
    s,
    ctx,
    'PIC inquiry diperbarui tanpa mengubah SLA',
    id,
    reason,
    v.orgId,
  );
  saveAdminStore(s);
}
export async function createAdminCase(input: {
  bookingId: string | null;
  ticketId: string | null;
  customerId: string | null;
  kind: AdminCase['kind'];
  priority: AdminCase['priority'];
  ownerId: string;
  resolution: AdminCase['resolution'];
  alternative: string;
  costBearer: AdminCase['costBearer'];
  reason: string;
}) {
  assertReason(input.reason);
  const ctx = await guardedAdmin('support'),
    s = readAdminStore(),
    b = input.bookingId ? getAdminBooking(ctx, input.bookingId) : null;
  const ticket = input.ticketId
    ? platformTickets(ctx).find((t) => t.id === input.ticketId)
    : null;
  if (input.ticketId && !ticket)
    throw new AdminError('403', 'Tiket tidak dapat diakses.');
  const orgId = b?.orgId ?? ticket?.orgId ?? null;
  adminGuard('support', orgId);
  if (
    !s.actors.some(
      (a) =>
        a.id === input.ownerId &&
        a.active &&
        ['super_admin', 'operations'].includes(a.role) &&
        adminScoped({ ...ctx, actor: a }, orgId),
    )
  )
    throw new AdminError(
      'VALIDATION',
      'Kasus memerlukan penanggung jawab berizin.',
    );
  if (
    ['exception', 'overbooking'].includes(input.kind) &&
    (!input.alternative.trim() || input.costBearer === 'undecided')
  )
    throw new AdminError(
      'VALIDATION',
      'Catat alternatif layanan/refund dan penanggung biaya.',
    );
  if (b && s.cases.some((c) => c.bookingId === b.id && c.status !== 'resolved'))
    throw new AdminError('409', 'Reservasi ini sudah memiliki kasus aktif.');
  const value: AdminCase = {
    id: `CASE-${crypto.randomUUID().slice(0, 8)}`,
    orgId,
    bookingId: b?.id ?? null,
    customerId: b?.customerId ?? input.customerId,
    ticketId: input.ticketId,
    kind: input.kind,
    ownerId: input.ownerId,
    priority: input.priority,
    status: 'open',
    resolution: input.resolution,
    alternative: input.alternative.trim(),
    costBearer: input.costBearer,
    createdAt: new Date().toISOString(),
    version: 1,
    notes: [
      {
        id: crypto.randomUUID(),
        actor: ctx.actor.name,
        at: new Date().toISOString(),
        body: input.reason,
        visibility: 'internal',
        files: [],
      },
    ],
  };
  s.cases.unshift(value);
  adminAudit(
    s,
    ctx,
    'Kasus ditugaskan dengan rencana penyelesaian',
    value.id,
    input.reason,
    orgId,
  );
  saveAdminStore(s);
  return value;
}
export async function updateAdminCase(
  id: string,
  version: number,
  input: {
    body: string;
    visibility: 'internal' | 'customer';
    status: AdminCase['status'];
    resolution: AdminCase['resolution'];
    alternative: string;
    costBearer: AdminCase['costBearer'];
  },
  files: File[],
) {
  assertReason(input.body);
  await validateAdminFiles(files);
  const ctx = await guardedAdmin('support'),
    s = readAdminStore(),
    c = s.cases.find((c) => c.id === id);
  if (!c) throw new AdminError('404', 'Kasus tidak ditemukan.');
  adminGuard('support', c.orgId);
  if (
    input.status === 'resolved' &&
    c.bookingId &&
    input.resolution === 'no_show_confirmed'
  ) {
    const b = getAdminBooking(ctx, c.bookingId),
      stay = readDemoBooking(c.bookingId),
      car = carRecords()[c.bookingId],
      local = car
        ? `${car.query.start}T${car.query.startTime}:00`
        : `${stay?.query.start}T${stay?.home?.checkIn ?? '14:00'}:00`,
      time = Date.parse(
        local +
          (b.zone === 'Asia/Makassar'
            ? '+08:00'
            : b.zone === 'Asia/Jayapura'
              ? '+09:00'
              : '+07:00'),
      );
    if (
      Date.now() < time ||
      (!files.length && !c.notes.some((n) => n.files.length))
    )
      throw new AdminError(
        'VALIDATION',
        'No-show harus setelah waktu mulai layanan dan memiliki bukti.',
      );
  }
  if (
    input.status === 'resolved' &&
    c.bookingId &&
    input.resolution === 'refund' &&
    getAdminBooking(ctx, c.bookingId).refundStatus !== 'succeeded'
  )
    throw new AdminError(
      '409',
      'Refund belum direkonsiliasi. Kasus tetap menunggu penyelesaian.',
    );
  if (c.version !== version)
    throw new AdminError('409', 'Kasus berubah. Muat ulang sebelum menyimpan.');
  if (
    input.status === 'resolved' &&
    ['exception', 'overbooking'].includes(c.kind) &&
    (!input.alternative.trim() || input.costBearer === 'undecided')
  )
    throw new AdminError(
      'VALIDATION',
      'Alasan, alternatif, dan penanggung biaya wajib untuk penyelesaian.',
    );
  Object.assign(c, {
    status: input.status,
    resolution: input.resolution,
    alternative: input.alternative,
    costBearer: input.costBearer,
    version: c.version + 1,
  });
  c.notes.push({
    id: crypto.randomUUID(),
    actor: ctx.actor.name,
    at: new Date().toISOString(),
    body: input.body,
    visibility: input.visibility,
    files: rememberAdminFiles(id, files),
  });
  if (input.visibility === 'customer' && c.ticketId)
    postSourceTicket(c.ticketId, input.body, false);
  if (
    input.status === 'resolved' &&
    c.bookingId &&
    ['no_show_confirmed', 'no_show_rejected'].includes(input.resolution)
  ) {
    const p = readPartnerStore(),
      service = p.services.find((v) => v.bookingId === c.bookingId);
    if (service) {
      service.notes += '\n' + input.body;
      service.status =
        input.resolution === 'no_show_confirmed'
          ? 'no_show_confirmed'
          : 'scheduled';
      service.version++;
      savePartnerStore(p);
    }
  }
  adminAudit(
    s,
    ctx,
    input.visibility === 'internal'
      ? 'Catatan internal kasus diperbarui'
      : 'Pesan pelanggan kasus dikirim',
    id,
    input.body,
    c.orgId,
  );
  saveAdminStore(s);
}
export function customerVisibleCase(id: string, accountId: string) {
  if (getDemoAccount()?.id !== accountId) return [];
  return readAdminStore()
    .cases.filter((c) => c.id === id && c.customerId === accountId)
    .flatMap((c) =>
      c.notes
        .filter((n) => n.visibility === 'customer')
        .map((n) => ({ body: n.body, at: n.at })),
    );
}
export function platformTickets(ctx: AdminContext) {
  const user = Object.values(
    JSON.parse(
      sessionStorage.getItem('gobuking:support-tickets:v1') ?? '{}',
    ) as Record<string, SupportTicket>,
  ).map((t) => ({
    id: t.id,
    kind: 'customer' as const,
    orgId:
      adminBookings(ctx).find((b) => b.id === t.referenceId)?.orgId ?? null,
    subject: t.subject,
    status: t.status,
    reference: t.referenceId,
    messages: t.messages.map((m) => ({
      id: m.id,
      actor: m.actor,
      body: m.body,
      at: m.at,
      files: m.files,
    })),
  }));
  const partner = readPartnerStore().tickets.map((t) => ({
    id: t.id,
    kind: 'partner' as const,
    orgId: t.orgId,
    subject: t.subject,
    status: t.status,
    reference: t.reference,
    messages: t.messages,
  }));
  return [...user, ...partner].filter((t) => adminScoped(ctx, t.orgId));
}
function postSourceTicket(id: string, body: string, close: boolean) {
  const now = new Date().toISOString(),
    values = JSON.parse(
      sessionStorage.getItem('gobuking:support-tickets:v1') ?? '{}',
    ) as Record<string, SupportTicket>;
  if (values[id]) {
    values[id].messages.push({
      id: crypto.randomUUID(),
      actor: 'support',
      body,
      at: now,
      files: [],
    });
    values[id].status = close ? 'closed' : 'waiting_customer';
    values[id].updatedAt = now;
    sessionStorage.setItem(
      'gobuking:support-tickets:v1',
      JSON.stringify(values),
    );
    window.dispatchEvent(new Event('gobuking:dashboard-changed'));
    return;
  }
  const p = readPartnerStore(),
    t = p.tickets.find((t) => t.id === id);
  if (t) {
    t.messages.push({
      id: crypto.randomUUID(),
      actor: 'Tim platform',
      body,
      at: now,
      files: [],
    });
    t.status = close ? 'closed' : 'waiting_partner';
    savePartnerStore(p);
  }
}
export async function replyPlatformTicket(
  id: string,
  body: string,
  close: boolean,
) {
  assertReason(body);
  const ctx = await guardedAdmin('support'),
    t = platformTickets(ctx).find((t) => t.id === id);
  if (!t) throw new AdminError('403', 'Tiket tidak dapat diakses.');
  adminGuard('support', t.orgId);
  postSourceTicket(id, body, close);
  const s = readAdminStore();
  adminAudit(
    s,
    ctx,
    close
      ? 'Tiket ditutup dengan alasan'
      : 'Balasan platform ke pelanggan/mitra',
    id,
    body,
    t.orgId,
  );
  saveAdminStore(s);
}
