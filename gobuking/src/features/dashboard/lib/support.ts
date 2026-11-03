import { z } from 'zod';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import { validateInquiryFile } from '@/features/venue/lib/attachments';
import { getMyBooking } from './bookings';
import { ticketSchema } from './query';
import {
  requireDashboardAccount,
  assertSameAccount,
  readDashboardStore,
  saveDashboardRecord,
  dashboardDelay,
  unknownDashboardResult,
  DashboardError,
} from './store';
import type { SupportTicket, TicketFile, DashboardScenario } from './types';
const KEY = 'gobuking:support-tickets:v1';
const filesMemory = new Map<
  string,
  { ticketId: string; accountId: string; file: File }
>();
let listening = false;
function bindClear() {
  if (listening) return;
  window.addEventListener('gobuking:demo-account-change', () =>
    filesMemory.clear(),
  );
  listening = true;
}
function ownTicket(id: string) {
  const account = requireDashboardAccount(),
    ticket = readDashboardStore<SupportTicket>(KEY)[id];
  if (!ticket)
    throw new DashboardError('404', 'Tiket tidak ditemukan pada akun ini.');
  if (ticket.accountId !== account.id)
    throw new DashboardError('403', 'Anda tidak memiliki akses ke tiket ini.');
  return ticket;
}
async function checkReference(category: string, id: string) {
  if (category === 'booking') await getMyBooking(id);
  if (category === 'inquiry') {
    const account = requireDashboardAccount(),
      value = await inquiryAdapter.getInquiry(id);
    if (value.ownerId !== account.id)
      throw new DashboardError(
        '403',
        'Klaim inquiry terverifikasi sebelum menghubungkannya ke tiket.',
      );
  }
}
function rememberFiles(
  ticketId: string,
  accountId: string,
  files: File[],
): TicketFile[] {
  bindClear();
  return files.map((file) => {
    const id = `FILE-${crypto.randomUUID()}`;
    filesMemory.set(id, { ticketId, accountId, file });
    return {
      id,
      name: file.name.replace(/[\\/\u0000-\u001f]/g, '').slice(0, 160),
      type: file.type,
      size: file.size,
    };
  });
}
export async function listSupportTickets() {
  const account = requireDashboardAccount();
  await dashboardDelay();
  assertSameAccount(account.id);
  return Object.values(readDashboardStore<SupportTicket>(KEY))
    .filter((value) => value.accountId === account.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function getSupportTicket(id: string, signal?: AbortSignal) {
  const account = requireDashboardAccount();
  await dashboardDelay('ready', signal);
  assertSameAccount(account.id);
  return structuredClone(ownTicket(id));
}
export async function createSupportTicket(
  input: z.input<typeof ticketSchema>,
  files: File[],
  commandId: string,
  scenario: DashboardScenario = 'ready',
) {
  const account = requireDashboardAccount(),
    valid = ticketSchema.parse(input);
  if (files.length > 3)
    throw new DashboardError('FILE', 'Maksimal 3 lampiran per pesan.');
  for (const file of files) await validateInquiryFile(file);
  await checkReference(valid.category, valid.referenceId);
  await dashboardDelay(scenario);
  assertSameAccount(account.id);
  const existing = Object.values(readDashboardStore<SupportTicket>(KEY)).find(
    (value) =>
      value.accountId === account.id && value.commands.includes(commandId),
  );
  if (existing) return existing;
  await checkReference(valid.category, valid.referenceId);
  assertSameAccount(account.id);
  const concurrent = Object.values(readDashboardStore<SupportTicket>(KEY)).find(
    (value) =>
      value.accountId === account.id && value.commands.includes(commandId),
  );
  if (concurrent) return concurrent;
  const now = new Date().toISOString(),
    id = `TICKET-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const value: SupportTicket = {
    id,
    accountId: account.id,
    category: valid.category,
    subject: valid.subject,
    referenceId: ['booking', 'inquiry'].includes(valid.category)
      ? valid.referenceId
      : null,
    status: valid.category.startsWith('privacy_')
      ? 'verification_required'
      : 'open',
    messages: [
      {
        id: crypto.randomUUID(),
        actor: 'customer',
        body: valid.body,
        at: now,
        files: rememberFiles(id, account.id, files),
      },
      {
        id: crypto.randomUUID(),
        actor: 'system',
        body: valid.category.startsWith('privacy_')
          ? 'Permintaan data dicatat untuk verifikasi. Transaksi tidak dihapus otomatis.'
          : 'Tiket demo tercatat. Menunggu respons CS pada simulasi lokal.',
        at: now,
        files: [],
      },
    ],
    createdAt: now,
    updatedAt: now,
    commands: [commandId],
  };
  const saved = saveDashboardRecord(KEY, id, value);
  unknownDashboardResult(scenario);
  return saved;
}
export async function resolveSupportSubmission(commandId: string) {
  const account = requireDashboardAccount();
  await dashboardDelay();
  assertSameAccount(account.id);
  return (
    Object.values(readDashboardStore<SupportTicket>(KEY)).find(
      (value) =>
        value.accountId === account.id && value.commands.includes(commandId),
    ) ?? null
  );
}
export async function replySupportTicket(
  id: string,
  body: string,
  files: File[],
  commandId: string,
  scenario: DashboardScenario = 'ready',
) {
  const account = requireDashboardAccount();
  z.string().trim().min(5, 'Balasan minimal 5 karakter.').max(3000).parse(body);
  if (files.length > 3)
    throw new DashboardError('FILE', 'Maksimal 3 lampiran per pesan.');
  for (const file of files) await validateInquiryFile(file);
  await dashboardDelay(scenario);
  assertSameAccount(account.id);
  const value = ownTicket(id);
  if (value.commands.includes(commandId)) return structuredClone(value);
  if (value.status === 'closed')
    throw new DashboardError(
      'CONFLICT',
      'Tiket sudah selesai. Buat tiket baru jika memerlukan bantuan lain.',
    );
  value.messages.push({
    id: crypto.randomUUID(),
    actor: 'customer',
    body: body.trim(),
    files: rememberFiles(id, account.id, files),
    at: new Date().toISOString(),
  });
  value.updatedAt = new Date().toISOString();
  if (value.status !== 'verification_required') value.status = 'open';
  value.commands.push(commandId);
  const saved = saveDashboardRecord(KEY, id, value);
  unknownDashboardResult(scenario);
  return saved;
}
export async function readSupportAttachment(ticketId: string, fileId: string) {
  const account = requireDashboardAccount();
  await dashboardDelay();
  assertSameAccount(account.id);
  const value = ownTicket(ticketId);
  if (
    !value.messages.some((message) =>
      message.files.some((file) => file.id === fileId),
    )
  )
    throw new DashboardError('403', 'Lampiran tiket tidak dapat diakses.');
  const data = filesMemory.get(fileId);
  if (!data || data.accountId !== account.id || data.ticketId !== ticketId)
    throw new DashboardError(
      'FILE_MISSING',
      'Isi lampiran tidak disimpan setelah muat ulang atau pergantian akun pada demo.',
    );
  return data.file;
}
export async function simulateSupportResponse(id: string, close = false) {
  const account = requireDashboardAccount();
  await dashboardDelay();
  assertSameAccount(account.id);
  const value = ownTicket(id);
  value.messages.push({
    id: crypto.randomUUID(),
    actor: 'support',
    body: close
      ? 'Tindak lanjut tiket dinyatakan selesai pada simulasi.'
      : 'CS demo telah meninjau tiket. Mohon lengkapi konteks tambahan melalui balasan ini.',
    at: new Date().toISOString(),
    files: [],
  });
  if (!value.category.startsWith('privacy_'))
    value.status = close ? 'closed' : 'waiting_customer';
  value.updatedAt = new Date().toISOString();
  return saveDashboardRecord(KEY, id, value);
}
export function readSupportPlatformFile(ticketId: string, fileId: string) {
  const v = filesMemory.get(fileId);
  if (!v || v.ticketId !== ticketId)
    throw new DashboardError(
      'FILE_MISSING',
      'Isi lampiran tidak tersedia pada sesi ini.',
    );
  return v.file;
}
