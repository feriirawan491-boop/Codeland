import { venueAdapter } from '@/features/venue/lib/adapter';
import { spaceAvailable } from '@/features/venue/lib/resources';
import {
  guarded,
  partnerGuard,
  readPartnerStore,
  savePartnerStore,
  recordActivity,
  PartnerError,
  knownCommand,
  markCommand,
  unknownPartnerResult,
} from './store';
import { sourceInquiries, writeInquiry } from './sources';
import { quoteSchema, reasonSchema } from './schemas';
import { storePartnerFiles, validatePartnerFiles } from './files';
import type { VenueQuote } from '@/features/venue/lib/types';
export async function listPartnerInquiries() {
  const ctx = await guarded('crm');
  return sourceInquiries(ctx);
}
export async function savePartnerQuoteDraft(
  id: string,
  input: Parameters<typeof quoteSchema.parse>[0],
  files: File[],
) {
  const valid = quoteSchema.parse(input);
  await validatePartnerFiles(files);
  const ctx = await guarded('crm'),
    s = readPartnerStore(),
    v = sourceInquiries(ctx).find((v) => v.id === id);
  if (!v)
    throw new PartnerError('403', 'Inquiry tidak termasuk assignment Anda.');
  partnerGuard('crm', v.listingId);
  if (!v.verifiedAt)
    throw new PartnerError(
      'VALIDATION',
      'Kontak inquiry harus terverifikasi sebelum penawaran.',
    );
  const key = `${ctx.organization.id}:${id}`;
  const draft = {
    ...valid,
    inquiryId: id,
    listingId: v.listingId,
    version: (s.quoteDrafts[key]?.version ?? 0) + 1,
    baseVersion: v.quotes.at(-1)?.version ?? 0,
    files: [
      ...(s.quoteDrafts[key]?.files ?? []),
      ...storePartnerFiles(ctx.organization.id, `quote:${id}`, files),
    ],
  };
  s.quoteDrafts[key] = draft;
  recordActivity(
    s,
    ctx,
    'Draft penawaran disimpan; belum dikirim',
    id,
    v.listingId,
  );
  savePartnerStore(s);
  return draft;
}
export async function sendPartnerQuote(
  id: string,
  draftVersion: number,
  commandId: string,
  scenario = 'ready',
) {
  const ctx = await guarded('crm'),
    s = readPartnerStore(),
    v = sourceInquiries(ctx).find((v) => v.id === id);
  if (!v) throw new PartnerError('403', 'Inquiry tidak dapat diakses.');
  partnerGuard('crm', v.listingId);
  if (knownCommand(s, ctx, commandId, id)) return;
  const d = s.quoteDrafts[`${ctx.organization.id}:${id}`];
  if (
    !d ||
    d.version !== draftVersion ||
    d.baseVersion !== (v.quotes.at(-1)?.version ?? 0)
  )
    throw new PartnerError(
      '409',
      'Versi penawaran berubah. Simpan dan tinjau draft terbaru.',
    );
  quoteSchema.parse(d);
  const context = venueAdapter.getSpaceById(v.spaceId, v.service);
  if (
    s.listings.find((l) => l.id === v.listingId)?.status !== 'published' ||
    !context ||
    !spaceAvailable(context.space, v.event, context.venue)
  )
    throw new PartnerError(
      '409',
      'Listing atau tanggal venue tidak tersedia. Validasi ulang sebelum mengirim penawaran.',
    );
  if (
    ctx.organization.status !== 'approved' ||
    !v.verifiedAt ||
    ['closed_lost', 'withdrawn'].includes(v.status)
  )
    throw new PartnerError(
      '409',
      'Inquiry atau organisasi tidak aktif untuk penawaran baru.',
    );
  v.quotes.forEach((q) => {
    if (q.status === 'sent') q.status = 'superseded';
  });
  const base = d.lines.reduce((sum, l) => sum + l.amount, 0);
  const quote: VenueQuote = {
    id: `Q-${crypto.randomUUID()}`,
    version: d.baseVersion + 1,
    status: 'sent',
    createdAt: new Date().toISOString(),
    validUntil: new Date(d.validUntil).toISOString(),
    base,
    tax: d.tax,
    serviceFee: d.serviceFee,
    total: base + d.tax + d.serviceFee,
    lines: [
      ...d.lines,
      { label: 'Pajak', amount: d.tax },
      { label: 'Biaya layanan', amount: d.serviceFee },
    ],
    event: structuredClone(v.event),
    spaceName: v.spaceName,
    venueName: v.venueName,
    packageName: v.quotes.at(-1)?.packageName ?? 'Penawaran terstruktur mitra',
    packageSnapshot: v.quotes.at(-1)?.packageSnapshot,
    wedding: v.wedding,
    terms: d.terms.split('\n').filter(Boolean),
  };
  v.quotes.push(quote);
  v.status = 'quoted';
  v.history.push({
    id: commandId,
    at: new Date().toISOString(),
    label: 'Penawaran mitra versi {version} dikirim',
    values: { version: quote.version },
  });
  v.commands.push(commandId);
  s.quoteFiles[quote.id] = d.files;
  delete s.quoteDrafts[`${ctx.organization.id}:${id}`];
  writeInquiry(v);
  recordActivity(
    s,
    ctx,
    'Penawaran dikirim; versi sebelumnya superseded',
    id,
    v.listingId,
  );
  markCommand(s, ctx, commandId, id);
  savePartnerStore(s);
  unknownPartnerResult(scenario);
}
export async function updatePartnerLead(
  id: string,
  action: 'assign' | 'response' | 'won' | 'lost',
  text: string,
) {
  reasonSchema.parse(text);
  const ctx = await guarded('crm'),
    s = readPartnerStore(),
    v = sourceInquiries(ctx).find((v) => v.id === id);
  if (!v) throw new PartnerError('403', 'Inquiry tidak dapat diakses.');
  partnerGuard('crm', v.listingId);
  if (action === 'assign') {
    const member = s.memberships.find(
      (m) =>
        m.id === text &&
        m.orgId === ctx.organization.id &&
        m.status === 'active' &&
        (m.role === 'owner' ||
          (m.role === 'operations' && m.listingIds.includes(v.listingId))),
    );
    if (!member)
      throw new PartnerError(
        '403',
        'PIC tidak memiliki izin untuk listing ini.',
      );
    v.pic = { name: member.name, team: ctx.organization.name };
    v.status = 'assigned';
  } else if (action === 'won' || action === 'lost')
    v.status = action === 'won' ? 'closed_won' : 'closed_lost';
  else v.status = 'in_discussion';
  v.history.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    label:
      action === 'won'
        ? 'Hasil tindak lanjut dicatat; bukan reservasi terkonfirmasi'
        : action === 'lost'
          ? 'Inquiry tidak dilanjutkan: ' + text
          : action === 'assign'
            ? 'PIC mitra ditugaskan'
            : 'Respons mitra: ' + text,
  });
  writeInquiry(v);
  recordActivity(s, ctx, 'Tindak lanjut inquiry diperbarui', id, v.listingId);
  savePartnerStore(s);
}
