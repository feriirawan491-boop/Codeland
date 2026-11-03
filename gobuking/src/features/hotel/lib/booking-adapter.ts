import { assertPurchaseEligibility } from '@/features/account/lib/purchase-eligibility';
import { capturePlatformPolicy } from '@/features/booking/lib/platform-policy';
import {
  calculateCancellation,
  type CancellationPreview,
} from '@/features/booking/lib/cancellation';
import { z } from 'zod';
import {
  homeAdapter,
  homeAvailability,
  homeSnapshot,
} from '@/features/home-rental/lib/adapter';
import type {
  HomeDraft,
  HomeBookingSnapshot,
} from '@/features/home-rental/lib/types';
import { canDownloadBookingInvoice, issueDemoInvoice } from './invoice';
import { getDemoAccount } from '@/features/account/lib/demo-auth';
import {
  availableStock,
  hotelAdapter,
  HotelAdapterError,
  simulateDelay,
} from './adapter';
import { makeQuote } from './adapter';
import type {
  BookingCommand,
  BookingContact,
  DemoBooking,
  HotelQuery,
  HotelQuote,
  HotelScenario,
} from './types';
export type HotelDraft = {
  id: string;
  hotelId: string;
  roomId: string;
  rateId: string;
  query: HotelQuery;
  quote: HotelQuote;
  scenario: HotelScenario;
};
const DRAFT_KEY = 'gobuking:hotel-drafts:v1';
const BOOKING_KEY = 'gobuking:hotel-bookings:v1';
// Tab-local demo records. Contact snapshots support invoice and simulated email delivery; no payment credentials.
function readStore<T>(key: string): Record<string, T> {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? '{}') as Record<string, T>;
  } catch {
    return {};
  }
}
function save<T>(key: string, id: string, value: T) {
  const store = readStore<T>(key);
  store[id] = value;
  sessionStorage.setItem(key, JSON.stringify(store));
  if (key === BOOKING_KEY)
    window.dispatchEvent(new Event('gobuking:inventory-changed'));
}
export function createHotelDraft(draft: Omit<HotelDraft, 'id'>) {
  const value = { ...draft, id: `DRAFT-${crypto.randomUUID()}` };
  save(DRAFT_KEY, value.id, value);
  return value;
}
export function getHotelDraft(id: string) {
  return readStore<HotelDraft>(DRAFT_KEY)[id] ?? null;
}
export function updateHotelDraft(draft: HotelDraft) {
  save(DRAFT_KEY, draft.id, draft);
}
export function readDemoBooking(id: string) {
  return readStore<DemoBooking>(BOOKING_KEY)[id] ?? null;
}
export function allDemoBookings() {
  return Object.values(readStore<DemoBooking>(BOOKING_KEY));
}
export function heldRoomCount(
  hotelId: string,
  roomId: string,
  query: HotelQuery,
) {
  const bookings = allDemoBookings().filter(
    (b) =>
      b.quote.propertyId === hotelId &&
      b.quote.selectionId === roomId &&
      b.query.start < query.end &&
      b.query.end > query.start &&
      (['confirmed'].includes(b.bookingStatus) ||
        (['awaiting_payment'].includes(b.bookingStatus) &&
          Date.parse(b.expiresAt) > Date.now())),
  );
  let maximum = 0;
  for (
    let day = Date.parse(query.start);
    day < Date.parse(query.end);
    day += 86400000
  ) {
    const date = new Date(day).toISOString().slice(0, 10);
    maximum = Math.max(
      maximum,
      bookings
        .filter((b) => b.query.start <= date && b.query.end > date)
        .reduce((total, b) => total + b.quote.quantity, 0),
    );
  }
  return maximum;
}
export const guestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Isi nama pemesan minimal 2 karakter.')
    .max(100),
  email: z.email('Masukkan email yang valid.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{8,20}$/, 'Masukkan nomor telepon yang valid.'),
  guestName: z
    .string()
    .trim()
    .min(2, 'Isi nama tamu utama.')
    .max(100, 'Nama tamu maksimal 100 karakter.'),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter.'),
  consent: z
    .boolean()
    .refine(Boolean, 'Setujui ketentuan sebelum melanjutkan.'),
});
function requireAccount() {
  const account = getDemoAccount();
  if (!account)
    throw new HotelAdapterError(
      '401',
      'Silakan masuk sebelum membuat pesanan.',
    );
  return account;
}
function authorizeBooking(booking: DemoBooking) {
  if (booking.customerId !== requireAccount().id)
    throw new HotelAdapterError(
      '403',
      'Pesanan ini milik akun lain. Masuk dengan akun pemesan.',
    );
}
async function quoteOrExisting<T extends HotelQuote>(
  draftId: string,
  preview: () => Promise<T>,
): Promise<{ quote: T } | { booking: DemoBooking }> {
  const find = () =>
    allDemoBookings().find((booking) =>
      booking.processedCommands.includes(`create:${draftId}`),
    );
  try {
    const quote = await preview();
    const booking = find();
    if (booking) {
      authorizeBooking(booking);
      return { booking };
    }
    return { quote };
  } catch (error) {
    const booking = find();
    if (booking) {
      authorizeBooking(booking);
      return { booking };
    }
    throw error;
  }
}
function commitReservation(
  input: {
    draftId: string;
    customerId: string;
    contact: BookingContact;
    paymentMethod: 'va' | 'qris';
    query: HotelQuery;
    quote: HotelQuote;
    home?: HomeBookingSnapshot;
  },
  validateAllocation: () => void,
) {
  const winner = allDemoBookings().find((b) =>
    b.processedCommands.includes(`create:${input.draftId}`),
  );
  if (winner) {
    authorizeBooking(winner);
    return winner;
  }
  if (requireAccount().id !== input.customerId)
    throw new HotelAdapterError(
      '401',
      'Sesi akun berubah. Silakan ulangi pemesanan.',
    );
  validateAllocation();
  const now = new Date().toISOString();
  assertPurchaseEligibility(input.customerId);
  const booking: DemoBooking = {
    id: `GB-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    customerId: input.customerId,
    platformPolicy: capturePlatformPolicy(),
    contact: input.contact,
    paymentMethod: input.paymentMethod,
    query: input.query,
    quote: { ...input.quote },
    ...(input.home ? { home: input.home } : {}),
    bookingStatus: 'awaiting_payment',
    paymentStatus: 'not_started',
    refundStatus: 'none',
    refundAmount: 0,
    createdAt: now,
    expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
    events: [
      {
        id: 'created',
        label: 'Pesanan demo dibuat',
        at: now,
      },
    ],
    processedCommands: [`create:${input.draftId}`],
    cancellationPolicy: {
      id: input.quote.freeCancellation ? 'flex-v1' : 'nonref-v1',
      label: input.quote.freeCancellation
        ? 'Kebijakan fleksibel pada transaksi'
        : 'Kebijakan nonrefundable pada transaksi',
      feePercent: input.quote.freeCancellation ? 0 : 100,
    },
  };
  const hotel = hotelAdapter.getHotelById(input.quote.propertyId);
  if (input.home)
    booking.staySnapshot = {
      name: input.home.name,
      address: input.home.area,
      zone: input.home.zone,
      selectionLabel: 'Seluruh hunian',
      rateLabel: 'Satu unit penuh',
      path: '/homes',
      categoryLabel: 'Home Rental',
      kind: 'home',
    };
  else if (hotel)
    booking.staySnapshot = {
      name: hotel.name,
      address: hotel.address,
      zone: hotel.zone,
      selectionLabel:
        hotel.rooms.find((item) => item.id === input.quote.selectionId)?.name ??
        '',
      rateLabel:
        hotel.rooms
          .find((item) => item.id === input.quote.selectionId)
          ?.rates.find((item) => item.id === input.quote.rateId)?.label ?? '',
      path: '/hotels',
      categoryLabel: 'Hotel',
      kind: 'hotel',
    };
  save(BOOKING_KEY, booking.id, booking);
  return booking;
}
export const bookingAdapter = {
  async createBooking(
    draft: HotelDraft,
    acceptedVersion: string,
    paymentMethod: 'va' | 'qris' = 'va',
    contact?: BookingContact,
  ) {
    const account = requireAccount();
    const contactSnapshot = guestSchema
      .pick({ name: true, email: true, guestName: true })
      .parse(
        contact ?? {
          name: account.name,
          email: account.email,
          guestName: account.name,
        },
      );
    await simulateDelay();
    const existing = allDemoBookings().find((b) =>
      b.processedCommands.includes(`create:${draft.id}`),
    );
    if (existing) {
      authorizeBooking(existing);
      return existing;
    }
    const hotel = hotelAdapter.getHotelById(draft.hotelId);
    if (!hotel)
      throw new HotelAdapterError(
        '404',
        'Hotel tidak ditemukan atau sedang tidak tersedia.',
      );
    const preview = await quoteOrExisting(draft.id, () =>
      hotelAdapter.previewBooking(
        hotel,
        draft.roomId,
        draft.rateId,
        draft.query,
        draft.scenario,
      ),
    );
    if ('booking' in preview) return preview.booking;
    const current = preview.quote;
    if (current.version !== acceptedVersion)
      throw new HotelAdapterError(
        'PRICE_CHANGED',
        'Harga telah berubah. Tinjau rincian terbaru sebelum melanjutkan.',
      );
    if (
      Date.parse(draft.quote.expiresAt) <= Date.now() ||
      Date.parse(current.expiresAt) <= Date.now()
    )
      throw new HotelAdapterError(
        'EXPIRED',
        'Penawaran kedaluwarsa. Perbarui harga sebelum melanjutkan.',
      );
    const room = hotel.rooms.find((r) => r.id === draft.roomId)!;
    return commitReservation(
      {
        draftId: draft.id,
        customerId: account.id,
        contact: contactSnapshot,
        paymentMethod,
        query: draft.query,
        quote: current,
      },
      () => {
        if (
          draft.query.rooms > availableStock(room, draft.query, draft.scenario)
        )
          throw new HotelAdapterError(
            'SOLD_OUT',
            'Kamar terakhir sudah dialokasikan pada pesanan demo lain.',
          );
      },
    );
  },
  findOwnDraftBooking(draftId: string) {
    const account = getDemoAccount();
    if (!account) return null;
    return (
      allDemoBookings().find(
        (booking) =>
          booking.customerId === account.id &&
          booking.processedCommands.includes(`create:${draftId}`),
      ) ?? null
    );
  },
  async createHomeBooking(
    draft: HomeDraft,
    acceptedVersion: string,
    paymentMethod: 'va' | 'qris',
    contact: BookingContact,
    rulesAccepted: boolean,
  ) {
    const account = requireAccount();
    const contactSnapshot = guestSchema
      .pick({ name: true, email: true, guestName: true })
      .parse(contact);
    if (!rulesAccepted)
      throw new HotelAdapterError(
        'VALIDATION',
        'Setujui aturan rumah dan ketentuan deposit sebelum melanjutkan.',
      );
    await simulateDelay();
    const existing = allDemoBookings().find((booking) =>
      booking.processedCommands.includes(`create:${draft.id}`),
    );
    if (existing) {
      authorizeBooking(existing);
      return existing;
    }
    const home = homeAdapter.getHomeById(draft.homeId);
    if (!home)
      throw new HotelAdapterError(
        '404',
        'Hunian tidak aktif atau tidak tersedia.',
      );
    const preview = await quoteOrExisting(draft.id, () =>
      homeAdapter.previewHomeQuote(
        home,
        draft.query,
        draft.extraIds,
        draft.scenario,
      ),
    );
    if ('booking' in preview) return preview.booking;
    const current = preview.quote;
    if (current.version !== acceptedVersion)
      throw new HotelAdapterError(
        'PRICE_CHANGED',
        'Harga telah berubah. Tinjau rincian terbaru sebelum melanjutkan.',
      );
    if (
      Date.parse(draft.quote.expiresAt) <= Date.now() ||
      Date.parse(current.expiresAt) <= Date.now()
    )
      throw new HotelAdapterError(
        'EXPIRED',
        'Penawaran kedaluwarsa. Perbarui harga sebelum melanjutkan.',
      );
    return commitReservation(
      {
        draftId: draft.id,
        customerId: account.id,
        contact: contactSnapshot,
        paymentMethod,
        query: draft.query,
        quote: current,
        home: homeSnapshot(home, draft.query.start),
      },
      () => {
        const invalid = homeAvailability(home, draft.query, draft.scenario);
        if (invalid) throw new HotelAdapterError('UNAVAILABLE', invalid);
      },
    );
  },
  async getBooking(id: string) {
    requireAccount();
    await simulateDelay();
    const booking = readDemoBooking(id);
    if (!booking)
      throw new HotelAdapterError(
        '404',
        'Pesanan demo tidak ditemukan di tab browser ini.',
      );
    authorizeBooking(booking);
    const legacy = booking.quote as HotelQuote & {
      hotelId?: string;
      roomId?: string;
    };
    if (!legacy.propertyId && legacy.hotelId) {
      legacy.propertyId = legacy.hotelId;
      legacy.selectionId = legacy.roomId ?? '';
      legacy.resourceId = `${legacy.propertyId}:${legacy.selectionId}`;
      legacy.productType = 'hotel';
      save(BOOKING_KEY, id, booking);
    }
    // Upgrade older paid demo records without inventing a missing historical guest name.
    if (
      !booking.invoice &&
      booking.paymentStatus === 'succeeded' &&
      ['confirmed', 'cancelled', 'completed'].includes(booking.bookingStatus)
    ) {
      const account = requireAccount();
      booking.contact = booking.contact ?? {
        name: account.name,
        email: account.email,
        guestName: '',
      };
      const paidEvent = booking.events.find(
        (event) =>
          event.label ===
          'Pembayaran demo terverifikasi dan reservasi demo dikonfirmasi',
      );
      booking.invoice = issueDemoInvoice(
        booking,
        booking.contact.email,
        paidEvent?.at ?? null,
      );
      booking.events.push({
        id: `invoice:${booking.id}`,
        label:
          'Invoice reservasi demo diterbitkan; pengiriman email disimulasikan',
        at: booking.invoice.issuedAt,
      });
      save(BOOKING_KEY, booking.id, booking);
    }
    if (
      ['awaiting_payment'].includes(booking.bookingStatus) &&
      Date.parse(booking.expiresAt) <= Date.now()
    )
      return this.command(id, 'expire', `expiry:${id}`);
    return booking;
  },
  async command(id: string, command: BookingCommand, commandId: string) {
    requireAccount();
    await simulateDelay();
    const booking = readDemoBooking(id);
    if (!booking)
      throw new HotelAdapterError(
        '404',
        'Pesanan demo tidak ditemukan di tab browser ini.',
      );
    authorizeBooking(booking);
    if (booking.processedCommands.includes(commandId)) return booking;
    const next: DemoBooking = {
      ...booking,
      events: [...booking.events],
      processedCommands: [...booking.processedCommands, commandId],
    };
    let label = '';
    const deny = () => {
      throw new HotelAdapterError(
        'CONFLICT',
        'Status telah berubah. Muat ulang sebelum melanjutkan.',
      );
    };
    if (command === 'complete') {
      if (
        next.bookingStatus !== 'confirmed' ||
        next.paymentStatus !== 'succeeded'
      )
        deny();
      next.bookingStatus = 'completed';
      next.completedAt = new Date().toISOString();
      label = 'Layanan selesai pada simulasi mitra';
    }
    if (command === 'expire') {
      if (!['awaiting_payment'].includes(next.bookingStatus)) deny();
      next.bookingStatus = 'expired';
      next.paymentStatus =
        next.paymentStatus === 'succeeded' ? 'succeeded' : 'expired';
      label = 'Batas waktu demo berakhir';
    }
    if (command === 'start_payment') {
      if (
        next.bookingStatus !== 'awaiting_payment' ||
        Date.parse(next.expiresAt) <= Date.now()
      )
        throw new HotelAdapterError(
          'EXPIRED',
          'Jendela pembayaran telah berakhir. Periksa status pesanan.',
        );
      next.paymentStatus = 'pending';
      label = 'Pembayaran demo menunggu hasil simulasi';
    }
    if (command === 'payment_succeeded') {
      if (
        next.bookingStatus !== 'awaiting_payment' ||
        next.paymentStatus !== 'pending' ||
        Date.parse(next.expiresAt) <= Date.now()
      )
        deny();
      next.paymentStatus = 'succeeded';
      next.bookingStatus = 'confirmed';
      next.contact = next.contact ?? {
        name: requireAccount().name,
        email: requireAccount().email,
        guestName: '',
      };
      next.invoice = issueDemoInvoice(
        next,
        next.contact.email,
        new Date().toISOString(),
      );
      label = 'Pembayaran demo terverifikasi dan reservasi demo dikonfirmasi';
    }
    if (command === 'payment_failed') {
      if (
        next.bookingStatus !== 'awaiting_payment' ||
        next.paymentStatus !== 'pending'
      )
        deny();
      next.paymentStatus = 'failed';
      label = 'Percobaan pembayaran demo gagal';
    }
    if (command === 'late_payment') {
      if (!['expired', 'awaiting_payment'].includes(next.bookingStatus)) deny();
      next.paymentStatus = 'succeeded';
      next.bookingStatus = 'exception';
      label = 'Pembayaran demo terlambat; perlu penanganan';
    }
    if (command === 'cancel') {
      if (!['confirmed', 'awaiting_payment'].includes(next.bookingStatus))
        deny();
      next.bookingStatus = 'cancelled';
      const preview = calculateCancellation({
        id: next.id,
        status: booking.bookingStatus,
        paid: next.paymentStatus === 'succeeded',
        total: next.quote.total,
        policy: next.cancellationPolicy ?? {
          id: 'legacy',
          label: 'Kebijakan pada transaksi',
          feePercent: next.quote.freeCancellation ? 0 : 100,
        },
        now: next.cancellationClock
          ? Date.parse(next.cancellationClock)
          : undefined,
      });
      next.refundAmount = preview.refund;
      next.refundStatus = preview.refund > 0 ? 'processing' : 'none';
      next.cancellation = {
        ...preview,
        requestedAt: new Date().toISOString(),
        customerReason: 'Pembatalan diminta pelanggan',
      };
      label = next.refundAmount
        ? 'Dibatalkan; refund demo diproses'
        : 'Pesanan demo dibatalkan';
    }
    if (command === 'refund_succeeded') {
      if (next.refundStatus !== 'processing') deny();
      next.refundStatus = 'succeeded';
      label = 'Pengembalian dana demo selesai';
    }
    if (command === 'resend_invoice' || command === 'invoice_email_failed') {
      if (!canDownloadBookingInvoice(next) || !next.invoice) deny();
      next.invoice = {
        ...next.invoice!,
        emailStatus: command === 'resend_invoice' ? 'simulated' : 'failed',
        emailAttemptedAt: new Date().toISOString(),
        emailAttempts:
          next.invoice!.emailAttempts + (command === 'resend_invoice' ? 1 : 0),
      };
      label =
        command === 'resend_invoice'
          ? 'Pengiriman ulang email invoice disimulasikan'
          : 'Simulasi pengiriman email invoice gagal';
    }
    if (!label) deny();
    next.events.push({ id: commandId, label, at: new Date().toISOString() });
    if (command === 'payment_succeeded' && next.invoice)
      next.events.push({
        id: `invoice:${id}`,
        label:
          'Invoice reservasi demo diterbitkan; pengiriman email disimulasikan',
        at: next.invoice.issuedAt,
      });
    save(BOOKING_KEY, id, next);
    return next;
  },
  async listMyBookings() {
    const account = requireAccount();
    await simulateDelay();
    if (requireAccount().id !== account.id)
      throw new HotelAdapterError(
        '401',
        'Sesi akun berubah. Silakan masuk kembali.',
      );
    return Promise.all(
      allDemoBookings()
        .filter((item) => item.customerId === account.id)
        .map((item) => this.getBooking(item.id)),
    );
  },
  async previewCancellation(id: string): Promise<CancellationPreview> {
    const booking = await this.getBooking(id);
    return calculateCancellation({
      id,
      status: booking.bookingStatus,
      paid: booking.paymentStatus === 'succeeded',
      total: booking.quote.total,
      policy: booking.cancellationPolicy ?? {
        id: 'legacy',
        label: 'Kebijakan pada transaksi',
        feePercent: booking.quote.freeCancellation ? 0 : 100,
      },
      now: booking.cancellationClock
        ? Date.parse(booking.cancellationClock)
        : undefined,
    });
  },
  async requestCancellation(
    id: string,
    preview: CancellationPreview,
    reason: string,
    commandId: string,
  ) {
    const account = requireAccount();
    await simulateDelay();
    const booking = readDemoBooking(id);
    if (!booking)
      throw new HotelAdapterError('404', 'Pesanan tidak ditemukan.');
    authorizeBooking(booking);
    if (requireAccount().id !== account.id)
      throw new HotelAdapterError(
        '401',
        'Sesi akun berubah. Silakan masuk kembali.',
      );
    if (booking.processedCommands.includes(commandId)) return booking;
    const current = calculateCancellation({
      id,
      status: booking.bookingStatus,
      paid: booking.paymentStatus === 'succeeded',
      total: booking.quote.total,
      policy: booking.cancellationPolicy ?? {
        id: 'legacy',
        label: 'Kebijakan pada transaksi',
        feePercent: booking.quote.freeCancellation ? 0 : 100,
      },
      now: booking.cancellationClock
        ? Date.parse(booking.cancellationClock)
        : undefined,
    });
    if (
      !current.eligible ||
      current.version !== preview.version ||
      Date.parse(preview.expiresAt) <= Date.now()
    )
      throw new HotelAdapterError(
        '409',
        'Estimasi pembatalan berubah. Tinjau ulang sebelum menyetujui.',
      );
    if (reason.trim().length < 5)
      throw new HotelAdapterError(
        'VALIDATION',
        'Isi alasan pembatalan minimal 5 karakter.',
      );
    const next: DemoBooking = {
      ...booking,
      bookingStatus: 'cancelled',
      refundStatus: current.refund > 0 ? 'processing' : 'none',
      refundAmount: current.refund,
      cancellation: {
        ...current,
        requestedAt: new Date().toISOString(),
        customerReason: reason.trim(),
      },
      processedCommands: [...booking.processedCommands, commandId],
      events: [
        ...booking.events,
        {
          id: commandId,
          label: current.refund
            ? 'Dibatalkan; refund demo diproses'
            : 'Pesanan demo dibatalkan',
          at: new Date().toISOString(),
        },
      ],
    };
    save(BOOKING_KEY, id, next);
    return next;
  },
  async simulateCancellationPolicy(id: string) {
    const booking = await this.getBooking(id);
    if (booking.bookingStatus !== 'awaiting_payment')
      throw new HotelAdapterError(
        'CONFLICT',
        'Kebijakan transaksi berbayar tidak dapat diganti.',
      );
    booking.quote.freeCancellation = false;
    if (booking.staySnapshot)
      booking.staySnapshot.rateLabel = 'Kebijakan pembatalan parsial demo';
    booking.cancellationPolicy = {
      id: 'partial-demo-v1',
      label: 'Kebijakan demo: biaya 25%, menjadi 50% setelah batas fleksibel',
      feePercent: 25,
      freeUntil: new Date(
        Date.parse(booking.query.start) - 86400000,
      ).toISOString(),
      lateFeePercent: 50,
    };
    save(BOOKING_KEY, id, booking);
    return booking;
  },
  async simulateCancellationDeadline(id: string) {
    const booking = await this.getBooking(id);
    if (
      !booking.cancellationPolicy?.freeUntil ||
      booking.bookingStatus !== 'confirmed'
    )
      throw new HotelAdapterError(
        'CONFLICT',
        'Tidak ada batas fleksibel untuk simulasi ini.',
      );
    booking.cancellationClock = new Date(
      Date.parse(booking.cancellationPolicy.freeUntil) + 3600000,
    ).toISOString();
    save(BOOKING_KEY, id, booking);
    return booking;
  },
  async getHomeArrivalInstructions(id: string) {
    const booking = await this.getBooking(id);
    if (
      !booking.home ||
      booking.bookingStatus !== 'confirmed' ||
      booking.paymentStatus !== 'succeeded'
    )
      throw new HotelAdapterError(
        '403',
        'Instruksi kedatangan tersedia setelah reservasi terkonfirmasi.',
      );
    return {
      area: booking.home.area,
      hostName: booking.home.hostName,
      checkIn: booking.home.checkIn,
      checkOut: booking.home.checkOut,
      zone: booking.home.zone,
      steps: [
        'Hubungi pengelola dengan nomor reservasi sebelum kedatangan.',
        'Titik temu demo berada di area pengelola, bukan pin peta publik.',
        'Tunjukkan invoice reservasi kepada pengelola saat check-in.',
        'Jangan kirim dokumen identitas atau pembayaran deposit melalui halaman demo ini.',
      ],
    };
  },
  async refreshQuote(draft: HotelDraft) {
    const hotel = hotelAdapter.getHotelById(draft.hotelId);
    if (!hotel)
      throw new HotelAdapterError(
        '404',
        'Hotel tidak ditemukan atau sedang tidak tersedia.',
      );
    const room = hotel.rooms.find((r) => r.id === draft.roomId)!;
    const rate = room.rates.find((r) => r.id === draft.rateId)!;
    await simulateDelay();
    const value = {
      ...draft,
      scenario: 'ready' as const,
      quote: makeQuote(hotel, room, rate, draft.query),
    };
    updateHotelDraft(value);
    return value;
  },
};
