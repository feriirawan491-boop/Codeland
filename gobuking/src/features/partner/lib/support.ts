import {
  guarded,
  partnerGuard,
  ownListings,
  readPartnerStore,
  savePartnerStore,
  recordActivity,
  PartnerError,
  knownCommand,
  markCommand,
  unknownPartnerResult,
} from './store';
import { sourceReservations, sourceInquiries } from './sources';
import { validatePartnerFiles, storePartnerFiles } from './files';
import { reasonSchema } from './schemas';
export async function listPartnerTickets() {
  const ctx = await guarded('support'),
    allowed = ownListings(ctx).map((l) => l.id);
  return readPartnerStore().tickets.filter(
    (t) =>
      t.orgId === ctx.organization.id &&
      (!t.listingId || allowed.includes(t.listingId)),
  );
}
export async function createPartnerTicket(
  input: {
    subject: string;
    body: string;
    reference: string;
    listingId: string;
  },
  files: File[],
  commandId: string,
  scenario = 'ready',
) {
  if (input.subject.trim().length < 5)
    throw new PartnerError('VALIDATION', 'Subjek minimal 5 karakter.');
  reasonSchema.parse(input.body);
  await validatePartnerFiles(files);
  const ctx = await guarded('support', input.listingId || undefined),
    s = readPartnerStore();
  if (knownCommand(s, ctx, commandId, 'support'))
    return s.tickets.find((t) => t.commands.includes(commandId))!;
  const ref = input.reference.trim();
  if (
    ref &&
    !sourceReservations(ctx).some(
      (b) =>
        b.id === ref && (!input.listingId || b.listingId === input.listingId),
    ) &&
    !sourceInquiries(ctx).some(
      (i) =>
        i.id === ref && (!input.listingId || i.listingId === input.listingId),
    )
  )
    throw new PartnerError(
      '403',
      'Referensi tidak termasuk organisasi dan listing yang dipilih.',
    );
  const resource = ref || input.listingId || ctx.organization.id,
    at = new Date().toISOString(),
    id = `PTR-TICKET-${crypto.randomUUID().slice(0, 8)}`;
  const context = s.activities
    .filter((a) => a.orgId === ctx.organization.id && a.resource === resource)
    .slice(0, 5)
    .map((a) => ({ resource: a.resource, at: a.at, label: a.action }));
  const ticket = {
    id,
    orgId: ctx.organization.id,
    listingId: input.listingId || null,
    subject: input.subject.trim(),
    reference: ref,
    status: 'open' as const,
    context,
    messages: [
      {
        id: crypto.randomUUID(),
        actor: ctx.membership.name,
        body: input.body.trim(),
        at,
        files: storePartnerFiles(ctx.organization.id, `ticket:${id}`, files),
      },
    ],
    commands: [commandId],
  };
  s.tickets.unshift(ticket);
  recordActivity(
    s,
    ctx,
    'Tiket eskalasi dibuat dengan konteks resource',
    id,
    input.listingId || null,
  );
  markCommand(s, ctx, commandId, 'support');
  savePartnerStore(s);
  unknownPartnerResult(scenario);
  return ticket;
}
export async function replyPartnerTicket(
  id: string,
  body: string,
  files: File[],
  commandId: string,
) {
  reasonSchema.parse(body);
  await validatePartnerFiles(files);
  const ctx = await guarded('support'),
    s = readPartnerStore(),
    t = s.tickets.find((t) => t.id === id && t.orgId === ctx.organization.id);
  if (!t) throw new PartnerError('403', 'Tiket tidak dapat diakses.');
  if (t.listingId) partnerGuard('support', t.listingId);
  if (t.commands.includes(commandId)) return;
  if (t.status === 'closed')
    throw new PartnerError('409', 'Tiket telah selesai.');
  t.messages.push({
    id: crypto.randomUUID(),
    actor: ctx.membership.name,
    body: body.trim(),
    at: new Date().toISOString(),
    files: storePartnerFiles(ctx.organization.id, `ticket:${id}`, files),
  });
  t.commands.push(commandId);
  t.status = 'open';
  recordActivity(s, ctx, 'Tiket bantuan dibalas', id, t.listingId);
  savePartnerStore(s);
}
export async function simulatePartnerSupport(id: string) {
  const ctx = await guarded('support'),
    s = readPartnerStore(),
    t = s.tickets.find((t) => t.id === id && t.orgId === ctx.organization.id);
  if (!t) throw new PartnerError('403', 'Tiket tidak dapat diakses.');
  if (t.listingId) partnerGuard('support', t.listingId);
  t.messages.push({
    id: crypto.randomUUID(),
    actor: 'Tim platform · demo',
    body: 'Eskalasi diterima. Tim platform akan meninjau resource dan kronologi yang dilampirkan.',
    at: new Date().toISOString(),
    files: [],
  });
  t.status = 'waiting_partner';
  savePartnerStore(s);
}
