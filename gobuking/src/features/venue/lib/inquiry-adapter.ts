import { effectivePlatformPolicy } from '@/features/booking/lib/platform-policy';
import { getDemoAccount } from '@/features/account/lib/demo-auth';
import { venueAdapter, venueDelay, VenueError } from './adapter';
import { inquiryInputSchema } from './inquiry-schema';
import { eventSchema } from './query';
import { packageEstimate } from './pricing';
import { spaceAvailable, setDemoOperationalBlock } from './resources';
import {
  readInquiryFile,
  rememberInquiryFiles,
  validateInquiryFile,
} from './attachments';
import type {
  EventQuery,
  InquiryInput,
  VenueInquiry,
  VenueQuote,
  VenueRequest,
  VenueScenario,
} from './types';
const KEY = 'gobuking:venue-inquiries:v1',
  ACCESS = 'gobuking:venue-inquiry-access:v1';
function records(): Record<string, VenueInquiry> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Record<
      string,
      VenueInquiry
    >;
  } catch {
    return {};
  }
}
function access(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(ACCESS) ?? '{}') as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}
function save(value: VenueInquiry) {
  const all = records();
  all[value.id] = value;
  sessionStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('gobuking:inquiry-changed'));
  return structuredClone(value);
}
function own(id: string): VenueInquiry {
  const value = records()[id];
  if (!value)
    throw new VenueError('404', 'Inquiry tidak ditemukan di tab browser ini.');
  const account = getDemoAccount();
  if (value.ownerId) {
    if (!account)
      throw new VenueError('401', 'Silakan masuk untuk membuka inquiry ini.');
    if (account.id !== value.ownerId)
      throw new VenueError('403', 'Anda tidak memiliki akses ke inquiry ini.');
  } else if (
    !access()[id] ||
    (account &&
      account.email.toLowerCase() !== value.contact.email.toLowerCase())
  )
    throw new VenueError('403', 'Anda tidak memiliki akses ke inquiry ini.');
  return value;
}
function event(
  value: VenueInquiry,
  label: string,
  id: string = crypto.randomUUID(),
  values?: Record<string, string | number>,
) {
  value.history.push({ id, at: new Date().toISOString(), label, values });
}
function nextBusinessDay() {
  const policy = effectivePlatformPolicy();
  if (policy.version > 1)
    return new Date(Date.now() + policy.venueSlaHours * 3600000).toISOString();
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while ([0, 6].includes(date.getDay())) date.setDate(date.getDate() + 1);
  date.setHours(17, 0, 0, 0);
  return date.toISOString();
}
function validateSpace(
  spaceId: string,
  query: EventQuery,
  service: 'mice' | 'wedding',
) {
  const value = venueAdapter.getSpaceById(spaceId, service);
  if (!value || !value.space.active || !value.space.services.includes(service))
    throw new VenueError('404', 'Ruang tidak aktif atau tidak ditemukan.');
  if (value.venue.locationId !== query.locationId)
    throw new VenueError(
      'VALIDATION',
      'Kota acara tidak sesuai dengan lokasi ruang.',
    );
  if ((value.space.capacity[query.layout] ?? 0) < query.participants)
    throw new VenueError(
      'CAPACITY',
      'Jumlah peserta melebihi kapasitas layout ruang ini.',
    );
  if (
    service === 'wedding' &&
    !query.flexible &&
    (query.start !== query.end ||
      query.startTime < '08:00' ||
      query.endTime > '22:00')
  )
    throw new VenueError(
      'HOURS',
      'Acara harus berada dalam jam operasional 08:00–22:00 pada hari yang sama.',
    );
  return value;
}
function requireVerified(value: VenueInquiry) {
  if (!value.verifiedAt)
    throw new VenueError(
      'UNVERIFIED',
      'Verifikasi email terlebih dahulu. Inquiry belum masuk antrean aktif.',
    );
}
function latest(value: VenueInquiry) {
  return value.quotes.at(-1);
}
function assertAvailable(value: VenueInquiry) {
  const context = validateSpace(value.spaceId, value.event, value.service);
  if (!spaceAvailable(context.space, value.event, context.venue))
    throw new VenueError(
      'BLOCKED',
      'Ruang sedang diblokir. Minta PIC memvalidasi ulang jadwal.',
    );
  return context;
}
function maybeUnknown(scenario: VenueScenario) {
  if (scenario === 'mutation_timeout')
    throw new VenueError(
      'UNKNOWN',
      'Hasil pengiriman belum diketahui. Periksa status sebelum mengirim ulang.',
    );
}
export const inquiryAdapter = {
  async createInquiry(
    input: InquiryInput,
    commandId: string,
    files: File[] = [],
    scenario: VenueScenario = 'ready',
  ) {
    const valid = inquiryInputSchema.safeParse(input);
    if (!valid.success)
      throw new VenueError('VALIDATION', valid.error.issues[0].message);
    let context = validateSpace(
      valid.data.spaceId,
      valid.data.event,
      valid.data.service,
    );
    if (!context.space.packages.some((p) => p.id === valid.data.packageId))
      throw new VenueError('VALIDATION', 'Pilih paket ruang yang tersedia.');
    if (files.length > 3)
      throw new VenueError('FILE', 'Maksimal 3 lampiran kebutuhan acara.');
    for (const file of files) await validateInquiryFile(file);
    await venueDelay(scenario);
    const duplicate = Object.values(records()).find(
      (value) => value.commandId === commandId,
    );
    if (duplicate) return structuredClone(own(duplicate.id));
    context = validateSpace(
      valid.data.spaceId,
      valid.data.event,
      valid.data.service,
    );
    if (
      !spaceAvailable(context.space, valid.data.event, context.venue) ||
      scenario === 'blocked'
    )
      throw new VenueError(
        'BLOCKED',
        'Ruang sedang diblokir. Minta PIC memvalidasi ulang jadwal.',
      );
    const account = getDemoAccount();
    if (account && account.email !== valid.data.contact.email)
      throw new VenueError(
        'CONTACT',
        'Email PIC harus sesuai akun yang sedang masuk.',
      );
    const id = `INQ-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const value: VenueInquiry = {
      id,
      service: valid.data.service,
      commandId,
      ownerId: account?.id ?? null,
      contact: valid.data.contact,
      needs: valid.data.needs,
      event: valid.data.event,
      spaceId: context.space.id,
      venueId: context.venue.id,
      packageId: valid.data.packageId,
      wedding: valid.data.wedding,
      spaceName: context.space.name,
      venueName: context.venue.name,
      zone: context.venue.zone,
      verifiedAt: null,
      status: 'new',
      createdAt: new Date().toISOString(),
      pic: null,
      responseDueAt: null,
      attachments: rememberInquiryFiles(id, files),
      quotes: [],
      request: null,
      requests: [],
      history: [],
      commands: [commandId],
    };
    const keys = access();
    keys[id] = crypto.randomUUID();
    sessionStorage.setItem(ACCESS, JSON.stringify(keys));
    event(value, 'Draft inquiry dibuat; menunggu verifikasi email');
    const saved = save(value);
    maybeUnknown(scenario);
    return saved;
  },
  async resolveSubmission(commandId: string) {
    await venueDelay();
    const value = Object.values(records()).find(
      (v) => v.commandId === commandId,
    );
    return value ? structuredClone(own(value.id)) : null;
  },
  async listMyInquiries() {
    const account = getDemoAccount();
    if (!account)
      throw new VenueError('401', 'Silakan masuk untuk membuka inquiry ini.');
    await venueDelay();
    if (getDemoAccount()?.id !== account.id)
      throw new VenueError(
        '401',
        'Sesi berubah. Masuk kembali sebelum melanjutkan.',
      );
    return Object.values(records())
      .filter((value) => value.ownerId === account.id)
      .map((value) => structuredClone(value));
  },
  async claimInquiry(id: string, token: string, commandId: string) {
    const account = getDemoAccount();
    if (!account)
      throw new VenueError('401', 'Silakan masuk untuk membuka inquiry ini.');
    await venueDelay();
    if (getDemoAccount()?.id !== account.id)
      throw new VenueError(
        '401',
        'Sesi berubah. Masuk kembali sebelum melanjutkan.',
      );
    const value = records()[id];
    if (
      !value ||
      value.contact.email.toLowerCase() !== account.email.toLowerCase() ||
      (value.ownerId && value.ownerId !== account.id) ||
      (!value.ownerId && (!value.verifiedAt || access()[id] !== token))
    )
      throw new VenueError(
        'CLAIM',
        'Inquiry belum dapat diklaim. Verifikasi kontak dan gunakan token akses yang sesuai.',
      );
    if (value.ownerId === account.id) return structuredClone(value);
    value.ownerId = account.id;
    value.commands.push(commandId);
    event(value, 'Inquiry terverifikasi diklaim oleh akun pemilik kontak');
    return save(value);
  },
  getClaimToken(id: string) {
    return access()[id] ?? null;
  },
  async getInquiry(
    id: string,
    scenario: VenueScenario = 'ready',
    signal?: AbortSignal,
  ) {
    await venueDelay(scenario, signal);
    return structuredClone(own(id));
  },
  async verifyInquiryContact(id: string, code: string) {
    await venueDelay();
    const value = own(id);
    if (value.verifiedAt) return structuredClone(value);
    if (code !== '123456')
      throw new VenueError('OTP', 'Kode demo belum sesuai. Gunakan 123456.');
    value.verifiedAt = new Date().toISOString();
    value.responseDueAt = nextBusinessDay();
    event(value, 'Email PIC terverifikasi; inquiry masuk antrean demo');
    return save(value);
  },
  async getQuoteVersions(id: string) {
    await venueDelay();
    const value = own(id);
    requireVerified(value);
    return structuredClone(value.quotes);
  },
  async reviseInquiryNeeds(id: string, query: EventQuery, commandId: string) {
    const valid = eventSchema.safeParse(query);
    if (!valid.success)
      throw new VenueError('VALIDATION', valid.error.issues[0].message);
    await venueDelay();
    const value = own(id);
    requireVerified(value);
    if (value.commands.includes(commandId)) return structuredClone(value);
    if (
      value.request &&
      !['withdrawn', 'rejected', 'expired'].includes(value.request.status)
    )
      throw new VenueError(
        'CONFLICT',
        'Tarik permintaan aktif sebelum mengubah kebutuhan.',
      );
    validateSpace(value.spaceId, valid.data, value.service);
    value.event = valid.data;
    value.quotes.forEach((q) => {
      if (q.status === 'sent') q.status = 'superseded';
    });
    value.status = 'in_discussion';
    value.commands.push(commandId);
    event(
      value,
      'Kebutuhan acara diperbarui; penawaran perlu divalidasi ulang',
    );
    return save(value);
  },
  async simulateSales(
    id: string,
    action:
      | 'assign'
      | 'quote'
      | 'expire'
      | 'block'
      | 'unblock'
      | 'review'
      | 'follow_up'
      | 'accept_contract',
    commandId: string,
  ) {
    await venueDelay();
    const value = own(id);
    requireVerified(value);
    if (value.commands.includes(commandId)) return structuredClone(value);
    if (action === 'assign') {
      value.pic = { name: 'Nadia · Venue Sales Demo', team: value.venueName };
      value.status = 'in_discussion';
      event(value, 'PIC demo ditugaskan; klarifikasi kebutuhan dimulai');
    }
    if (action === 'quote') {
      const context = assertAvailable(value),
        pack = context.space.packages.find((p) => p.id === value.packageId)!;
      const estimate = packageEstimate(pack, value.event);
      const base = estimate?.base ?? 5000000,
        serviceFee = estimate?.serviceFee ?? 250000,
        tax = estimate?.tax ?? 577500;
      value.quotes.forEach((q) => {
        if (q.status === 'sent') q.status = 'superseded';
      });
      const version = (latest(value)?.version ?? 0) + 1;
      const quote: VenueQuote = {
        id: `Q-${crypto.randomUUID()}`,
        version,
        status: 'sent',
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 3600000).toISOString(),
        base,
        tax,
        serviceFee,
        total: base + tax + serviceFee,
        lines: [
          { label: 'Biaya ruang & paket', amount: base },
          { label: 'Biaya layanan', amount: serviceFee },
          { label: 'Pajak', amount: tax },
        ],
        event: structuredClone(value.event),
        spaceName: value.spaceName,
        venueName: value.venueName,
        packageName: pack.name,
        packageSnapshot: structuredClone(pack),
        wedding: value.wedding ? structuredClone(value.wedding) : undefined,
        terms: [
          'Penawaran demo untuk pembahasan kontrak, bukan reservasi final.',
          'Tanggal dan ketersediaan harus disepakati tertulis dengan PIC.',
          'DP, termin, dan kontrak ditindaklanjuti di luar platform.',
        ],
      };
      value.pic = value.pic ?? {
        name: 'Nadia · Venue Sales Demo',
        team: value.venueName,
      };
      value.quotes.push(quote);
      value.status = 'quoted';
      event(value, 'Penawaran demo versi {version} dikirim', undefined, {
        version,
      });
    }
    if (action === 'expire') {
      const quote = latest(value);
      if (quote) {
        quote.status = 'expired';
        quote.validUntil = new Date(Date.now() - 1000).toISOString();
        event(value, 'Penawaran demo kedaluwarsa; perlu validasi ulang');
      }
    }
    if (action === 'block' || action === 'unblock') {
      const context = validateSpace(value.spaceId, value.event, value.service);
      setDemoOperationalBlock(context.space.resourceId, action === 'block');
      event(
        value,
        action === 'block'
          ? 'Blok operasional ruang bersama diaktifkan'
          : 'Blok operasional ruang bersama dilepas',
      );
    }
    if (['review', 'follow_up', 'accept_contract'].includes(action)) {
      if (!value.request)
        throw new VenueError(
          'VALIDATION',
          'Belum ada permintaan booking untuk ditindaklanjuti.',
        );
      if (['withdrawn', 'rejected', 'expired'].includes(value.request.status))
        throw new VenueError('CONFLICT', 'Permintaan ini tidak aktif.');
      value.request.status =
        action === 'review'
          ? 'under_review'
          : action === 'follow_up'
            ? 'follow_up_required'
            : 'accepted_for_contract';
      value.requests = value.requests.map((r) =>
        r.id === value.request!.id ? structuredClone(value.request!) : r,
      );
      event(
        value,
        action === 'accept_contract'
          ? 'Lanjut kesepakatan kontrak; belum ada reservasi terkonfirmasi'
          : action === 'review'
            ? 'Permintaan booking ditinjau PIC demo'
            : 'PIC demo meminta tindak lanjut',
      );
    }
    value.commands.push(commandId);
    return save(value);
  },
  async submitVenueRequest(
    id: string,
    quoteId: string,
    version: number,
    commandId: string,
    consent: boolean,
    scenario: VenueScenario = 'ready',
  ) {
    const account = getDemoAccount();
    if (!account)
      throw new VenueError('401', 'Masuk untuk mengajukan permintaan booking.');
    await venueDelay(scenario);
    if (getDemoAccount()?.id !== account.id)
      throw new VenueError(
        '401',
        'Sesi berubah. Masuk kembali sebelum mengajukan permintaan.',
      );
    const value = own(id);
    requireVerified(value);
    if (value.contact.email.toLowerCase() !== account.email.toLowerCase())
      throw new VenueError(
        '403',
        'Gunakan akun dengan email PIC yang telah diverifikasi.',
      );
    if (value.commands.includes(commandId)) return structuredClone(value);
    const quote = latest(value);
    if (!quote || quote.id !== quoteId || quote.version !== version)
      throw new VenueError(
        '409',
        'Penawaran ini sudah digantikan. Tinjau versi terbaru.',
        undefined,
        quote?.version,
      );
    if (quote.status !== 'sent' || Date.parse(quote.validUntil) <= Date.now())
      throw new VenueError(
        'EXPIRED',
        'Penawaran tidak berlaku. Minta PIC mengirim versi terbaru.',
      );
    if (value.event.flexible)
      throw new VenueError(
        'SCHEDULE',
        'Tetapkan tanggal dan jam acara sebelum mengajukan permintaan.',
      );
    if (!consent)
      throw new VenueError(
        'CONSENT',
        'Setujui ketentuan penawaran dan batas permintaan booking.',
      );
    assertAvailable(value);
    if (scenario === 'blocked')
      throw new VenueError(
        'BLOCKED',
        'Ruang sedang diblokir. Minta PIC memvalidasi ulang jadwal.',
      );
    if (
      value.request &&
      !['withdrawn', 'rejected', 'expired'].includes(value.request.status)
    ) {
      if (value.request.quoteId === quote.id) return structuredClone(value);
      throw new VenueError(
        'CONFLICT',
        'Tarik permintaan aktif sebelum mengajukan versi lain.',
      );
    }
    const request: VenueRequest = {
      id: `REQ-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'submitted',
      quoteId: quote.id,
      quoteVersion: quote.version,
      total: quote.total,
      createdAt: new Date().toISOString(),
      event: structuredClone(quote.event),
      terms: [...quote.terms],
      packageSnapshot: quote.packageSnapshot
        ? structuredClone(quote.packageSnapshot)
        : undefined,
      wedding: quote.wedding ? structuredClone(quote.wedding) : undefined,
    };
    value.ownerId = account.id;
    value.request = request;
    value.requests.push(structuredClone(request));
    quote.status = 'accepted';
    value.commands.push(commandId);
    event(value, 'Permintaan booking terkirim; menunggu kesepakatan final');
    const saved = save(value);
    maybeUnknown(scenario);
    return saved;
  },
  async requestQuoteRefresh(id: string, commandId: string) {
    await venueDelay();
    const value = own(id);
    requireVerified(value);
    if (value.commands.includes(commandId)) return structuredClone(value);
    value.commands.push(commandId);
    event(value, 'Pembaruan penawaran diminta kepada PIC demo');
    return save(value);
  },
  async createWeddingRequest(
    input: Omit<InquiryInput, 'service' | 'contact'>,
    commandId: string,
    scenario: VenueScenario = 'ready',
  ) {
    const account = getDemoAccount();
    if (!account)
      throw new VenueError('401', 'Masuk untuk mengajukan permintaan booking.');
    if (input.event.flexible)
      throw new VenueError(
        'SCHEDULE',
        'Tetapkan tanggal dan jam acara sebelum mengajukan permintaan.',
      );
    if (!input.consent)
      throw new VenueError(
        'CONSENT',
        'Setujui ketentuan penawaran dan batas permintaan booking.',
      );
    await venueDelay(scenario);
    if (getDemoAccount()?.id !== account.id)
      throw new VenueError(
        '401',
        'Sesi berubah. Masuk kembali sebelum mengajukan permintaan.',
      );
    const value = await this.createInquiry(
      {
        ...input,
        service: 'wedding',
        contact: {
          name: account.name,
          email: account.email,
          phone: account.phone,
          company: '',
        },
      },
      `${commandId}:inquiry`,
    );
    if (getDemoAccount()?.id !== account.id)
      throw new VenueError(
        '401',
        'Sesi berubah. Masuk kembali sebelum mengajukan permintaan.',
      );
    const current = own(value.id);
    if (current.commands.includes(commandId)) return structuredClone(current);
    assertAvailable(current);
    if (scenario === 'blocked')
      throw new VenueError(
        'BLOCKED',
        'Ruang sedang diblokir. Minta PIC memvalidasi ulang jadwal.',
      );
    const context = validateSpace(current.spaceId, current.event, 'wedding');
    const pack = context.space.packages.find(
      (p) => p.id === current.packageId,
    )!;
    current.verifiedAt = current.verifiedAt ?? new Date().toISOString();
    current.responseDueAt = nextBusinessDay();
    current.ownerId = account.id;
    const request: VenueRequest = {
      id: `REQ-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'submitted',
      quoteId: null,
      quoteVersion: null,
      total: null,
      packageSnapshot: structuredClone(pack),
      wedding: current.wedding ? structuredClone(current.wedding) : undefined,
      createdAt: new Date().toISOString(),
      event: structuredClone(current.event),
      terms: [
        'Permintaan paket belum menjadi reservasi atau harga final.',
        'Ketersediaan, biaya, dan kontrak perlu disepakati tertulis dengan PIC.',
      ],
    };
    current.request = request;
    current.requests.push(structuredClone(request));
    current.commands.push(commandId);
    event(
      current,
      'Permintaan wedding dari akun terverifikasi terkirim; menunggu penawaran dan tindak lanjut',
    );
    const saved = save(current);
    maybeUnknown(scenario);
    return saved;
  },
  async withdrawRequest(id: string, commandId: string) {
    await venueDelay();
    const value = own(id);
    if (value.commands.includes(commandId)) return structuredClone(value);
    if (!value.request)
      throw new VenueError('404', 'Permintaan tidak ditemukan.');
    if (value.request.status === 'accepted_for_contract')
      throw new VenueError(
        'CONFLICT',
        'Hubungi PIC untuk tindak lanjut kesepakatan kontrak.',
      );
    value.request.status = 'withdrawn';
    value.requests = value.requests.map((r) =>
      r.id === value.request!.id ? structuredClone(value.request!) : r,
    );
    value.commands.push(commandId);
    event(value, 'Permintaan booking ditarik oleh penyelenggara');
    return save(value);
  },
  async getAttachment(id: string, attachmentId: string) {
    await venueDelay();
    const value = own(id);
    if (!value.attachments.some((a) => a.id === attachmentId))
      throw new VenueError('403', 'Lampiran tidak dapat diakses.');
    return readInquiryFile(id, attachmentId);
  },
};
