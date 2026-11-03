import { assertPurchaseEligibility } from '@/features/account/lib/purchase-eligibility';
import { capturePlatformPolicy } from '@/features/booking/lib/platform-policy';
import { getDemoAccount } from '@/features/account/lib/demo-auth';
import { validateInquiryFile } from '@/features/venue/lib/attachments';
import { carAdapter } from './adapter';
import { carDelay, CarError } from './error';
import { carFixture } from './fixtures';
import {
  fleetAllocation,
  setCarMaintenance,
  unitPool,
  unitFree,
  driverFree,
} from './inventory';
import { renterSchema, rentalInterval } from './query';
import {
  carRecords,
  customerCarView,
  getCarDraft,
  saveCarDraft,
  saveCarRecord,
  type InternalCarBooking,
} from './store';
import type {
  CarAction,
  CarAssignment,
  CarOffer,
  CarQuery,
  CarRenter,
  CarScenario,
} from './types';
export { getCarDraft };
function account() {
  const value = getDemoAccount();
  if (!value) throw new CarError('401', 'Masuk untuk membuka pesanan rental.');
  return value;
}
function own(id: string) {
  const user = account(),
    value = carRecords()[id];
  if (!value)
    throw new CarError('404', 'Pesanan rental tidak ditemukan pada sesi ini.');
  if (value.customerId !== user.id)
    throw new CarError(
      '403',
      'Anda tidak memiliki akses ke pesanan rental ini.',
    );
  return value;
}
function log(value: InternalCarBooking, label: string) {
  value.events.push({
    id: crypto.randomUUID(),
    label,
    at: new Date().toISOString(),
  });
  value.serverTime = new Date().toISOString();
}
function expire(value: InternalCarBooking) {
  if (
    value.status === 'awaiting_payment' &&
    value.expiresAt &&
    Date.parse(value.expiresAt) <= Date.now()
  ) {
    value.status = 'expired';
    value.assignment = null;
    value.replacement = null;
    value.unitId = null;
    value.driverId = null;
    value.payment = value.payment === 'pending' ? 'expired' : value.payment;
    log(value, 'Batas pembayaran berakhir; alokasi armada dilepas');
    saveCarRecord(value);
  }
  return value;
}
function assignment(offer: CarOffer): CarAssignment {
  return {
    model: offer.name,
    vehicleClass: offer.vehicleClass,
    seats: offer.seats,
    baggage: offer.baggage,
    transmission: offer.transmission,
    plate: 'B •••• DEMO',
    driverName: offer.mode === 'driver' ? 'Raka · Pengemudi demo' : null,
    equivalent: true,
  };
}
function allocated(value: InternalCarBooking) {
  return (
    !!value.unitId &&
    unitFree(value.unitId, value.query, value.offer, value.id) &&
    (value.offer.mode === 'self' ||
      (!!value.driverId &&
        driverFree(value.driverId, value.query, value.offer, value.id)))
  );
}
function unknown(scenario: CarScenario) {
  if (scenario === 'mutation_timeout')
    throw new CarError(
      'UNKNOWN',
      'Hasil pengiriman belum diketahui. Periksa status sebelum mengirim ulang.',
    );
}
export const carBookingAdapter = {
  async createDraft(
    id: string,
    query: CarQuery,
    scenario: CarScenario = 'ready',
  ) {
    const data = await carAdapter.getRentalOffer(id, query, scenario);
    if (!data.available)
      throw new CarError(
        'UNAVAILABLE',
        data.reason ?? 'Armada belum tersedia.',
      );
    return saveCarDraft({
      id: `CAR-DRAFT-${crypto.randomUUID()}`,
      query: structuredClone(query),
      offer: data.offer,
      quote: data.quote,
      scenario,
    });
  },
  async refreshDraft(id: string) {
    const draft = getCarDraft(id);
    if (!draft)
      throw new CarError(
        '404',
        'Draft rental tidak ditemukan. Mulai dari pencarian mobil.',
      );
    const data = await carAdapter.getRentalOffer(
      draft.offer.id,
      draft.query,
      draft.scenario === 'quote_expired' ? 'ready' : draft.scenario,
    );
    return saveCarDraft({
      ...draft,
      quote: data.quote,
      scenario: draft.scenario === 'quote_expired' ? 'ready' : draft.scenario,
    });
  },
  setDraftScenario(id: string, scenario: CarScenario) {
    const draft = getCarDraft(id);
    if (!draft)
      throw new CarError(
        '404',
        'Draft rental tidak ditemukan. Mulai dari pencarian mobil.',
      );
    return saveCarDraft({ ...draft, scenario });
  },
  async createRentalRequest(
    id: string,
    renter: CarRenter,
    commandId: string,
    file?: File,
  ) {
    const user = account(),
      draft = getCarDraft(id);
    if (!draft)
      throw new CarError(
        '404',
        'Draft rental tidak ditemukan. Mulai dari pencarian mobil.',
      );
    const parsed = renterSchema.safeParse(renter);
    if (!parsed.success)
      throw new CarError('VALIDATION', parsed.error.issues[0].message);
    if (renter.age < draft.offer.minAge)
      throw new CarError(
        'ELIGIBILITY',
        'Usia belum memenuhi kebijakan mitra untuk paket ini.',
      );
    if (draft.offer.mode === 'self' && !renter.license)
      throw new CarError(
        'ELIGIBILITY',
        'Konfirmasikan SIM yang masih berlaku untuk lepas kunci.',
      );
    if (draft.offer.uploadRequired && !file)
      throw new CarError(
        'FILE',
        'Mitra meminta satu dokumen SIM contoh untuk verifikasi.',
      );
    if (file) await validateInquiryFile(file);
    await carDelay(draft.scenario);
    if (getDemoAccount()?.id !== user.id)
      throw new CarError(
        '401',
        'Sesi berubah. Masuk kembali sebelum melanjutkan.',
      );
    const duplicate = Object.values(carRecords()).find(
      (v) =>
        v.customerId === user.id &&
        (v.draftId === id || v.commands.includes(commandId)),
    );
    if (duplicate) return customerCarView(own(duplicate.id));
    const data = await carAdapter.getRentalOffer(
      draft.offer.id,
      draft.query,
      draft.scenario,
    );
    if (getDemoAccount()?.id !== user.id)
      throw new CarError(
        '401',
        'Sesi berubah. Masuk kembali sebelum melanjutkan.',
      );
    const concurrent = Object.values(carRecords()).find(
      (v) => v.customerId === user.id && v.draftId === id,
    );
    if (concurrent) return customerCarView(own(concurrent.id));
    if (!data.available)
      throw new CarError(
        'UNAVAILABLE',
        data.reason ?? 'Armada belum tersedia.',
      );
    if (data.quote.version !== draft.quote.version)
      throw new CarError(
        '409',
        'Harga berubah. Tinjau rincian terbaru sebelum mengajukan.',
        data.quote,
      );
    if (Date.parse(draft.quote.expiresAt) <= Date.now())
      throw new CarError(
        'EXPIRED',
        'Estimasi kedaluwarsa. Perbarui rincian sebelum mengajukan.',
      );
    const now = new Date().toISOString();
    assertPurchaseEligibility(user.id);
    const value: InternalCarBooking = {
      id: `CAR-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      customerId: user.id,
      platformPolicy: capturePlatformPolicy(),
      draftId: id,
      query: structuredClone(draft.query),
      offer: structuredClone(draft.offer),
      quote: structuredClone(draft.quote),
      renter: {
        ...parsed.data,
        license: draft.offer.mode === 'self' ? parsed.data.license : false,
      },
      contact: { name: user.name, email: user.email, phone: user.phone },
      document: file
        ? {
            name: file.name.replace(/[\\/\u0000-\u001f]/g, '').slice(0, 160),
            size: file.size,
            type: file.type,
          }
        : null,
      status: 'requested',
      payment: 'not_started',
      paymentMethod: null,
      refund: 'none',
      reason: null,
      expiresAt: null,
      assignment: null,
      replacement: null,
      unitId: null,
      driverId: null,
      handover: {
        pickup: false,
        returned: false,
        fuelStart: null,
        fuelEnd: null,
        odometerStart: null,
        odometerEnd: null,
        conditionStart: null,
        conditionEnd: null,
      },
      dispute: false,
      invoice: null,
      events: [],
      commands: [commandId],
      createdAt: now,
      serverTime: now,
    };
    log(
      value,
      'Permintaan rental terkirim; menunggu pemeriksaan kelayakan dan alokasi',
    );
    saveCarRecord(value);
    unknown(draft.scenario);
    return customerCarView(value);
  },
  async resolveSubmission(draftId: string) {
    const user = account();
    await carDelay();
    if (getDemoAccount()?.id !== user.id)
      throw new CarError(
        '401',
        'Sesi berubah. Masuk kembali sebelum melanjutkan.',
      );
    const value = Object.values(carRecords()).find(
      (v) => v.draftId === draftId && v.customerId === user.id,
    );
    return value ? customerCarView(expire(own(value.id))) : null;
  },
  async listMyBookings() {
    const user = account();
    await carDelay();
    if (getDemoAccount()?.id !== user.id)
      throw new CarError(
        '401',
        'Sesi berubah. Masuk kembali sebelum melanjutkan.',
      );
    return Object.values(carRecords())
      .filter((value) => value.customerId === user.id)
      .map((value) => customerCarView(expire(value)));
  },
  async getBookingStatus(
    id: string,
    scenario: CarScenario = 'ready',
    signal?: AbortSignal,
  ) {
    const user = account();
    await carDelay(scenario, signal);
    if (getDemoAccount()?.id !== user.id)
      throw new CarError(
        '401',
        'Sesi berubah. Masuk kembali sebelum melanjutkan.',
      );
    return customerCarView(expire(own(id)));
  },
  async command(
    id: string,
    action: CarAction,
    commandId: string,
    method?: 'va' | 'qris',
    scenario: CarScenario = 'ready',
  ) {
    const user = account();
    await carDelay(scenario);
    if (getDemoAccount()?.id !== user.id)
      throw new CarError(
        '401',
        'Sesi berubah. Masuk kembali sebelum melanjutkan.',
      );
    const value = expire(own(id));
    if (value.commands.includes(commandId)) return customerCarView(value);
    const fail = () => {
      throw new CarError(
        'CONFLICT',
        'Tindakan tidak sesuai status rental terbaru. Periksa status pesanan.',
      );
    };
    if (action === 'approve') {
      if (value.status !== 'requested') return fail();
      const current = carFixture(value.offer.id);
      if (!current?.active)
        throw new CarError(
          '404',
          'Paket rental tidak aktif atau tidak ditemukan.',
        );
      const allocation = fleetAllocation(value.offer, value.query, value.id);
      if (!allocation.available)
        throw new CarError('ALLOCATION', allocation.reason!);
      if (
        value.renter.age < value.offer.minAge ||
        (value.offer.mode === 'self' && !value.renter.license)
      )
        throw new CarError(
          'ELIGIBILITY',
          'Persyaratan penyewa belum memenuhi kebijakan mitra.',
        );
      value.unitId = allocation.unitId;
      value.driverId = allocation.driverId;
      value.assignment = assignment(value.offer);
      value.status = 'awaiting_payment';
      value.expiresAt = new Date(Date.now() + 20 * 60000).toISOString();
      log(
        value,
        'Kelayakan dan alokasi disetujui; pembayaran dibuka selama 20 menit',
      );
    }
    if (action === 'reject') {
      if (value.status !== 'requested') return fail();
      value.status = 'rejected';
      value.reason =
        'Persyaratan verifikasi mitra belum terpenuhi. Tidak ada tagihan pembayaran.';
      log(value, 'Permintaan ditolak mitra dengan alasan verifikasi');
    }
    if (action === 'maintenance') {
      if (!['requested', 'awaiting_payment'].includes(value.status))
        return fail();
      const interval = rentalInterval(value.query);
      for (const unit of unitPool(value.offer))
        setCarMaintenance(
          unit,
          interval.start,
          interval.end + value.offer.bufferMinutes * 60000,
        );
      if (value.status === 'awaiting_payment') {
        value.status = 'cancelled';
        value.assignment = null;
        value.replacement = null;
        value.unitId = null;
        value.driverId = null;
        value.reason =
          'Armada tidak dapat digunakan; alokasi dan akses pembayaran dilepas.';
      }
      log(value, 'Simulasi maintenance armada diterapkan pada interval rental');
    }
    if (action === 'driver_conflict') {
      if (value.status !== 'requested' || value.offer.mode !== 'driver')
        return fail();
      throw new CarError(
        'ALLOCATION',
        'Pengemudi memiliki penugasan lain pada interval ini. Persetujuan ditolak.',
      );
    }
    if (action === 'expire') {
      if (value.status !== 'awaiting_payment') return fail();
      value.expiresAt = new Date(Date.now() - 1000).toISOString();
      expire(value);
    }
    if (action === 'start_payment') {
      if (value.status !== 'awaiting_payment' || !method) return fail();
      if (!allocated(value))
        throw new CarError(
          'ALLOCATION',
          'Alokasi berubah. Hubungi mitra sebelum membayar.',
        );
      value.paymentMethod = method;
      value.payment = 'pending';
      log(value, 'Instruksi pembayaran demo dibuat; menunggu hasil pembayaran');
    }
    if (action === 'payment_succeeded') {
      if (value.status !== 'awaiting_payment' || value.payment !== 'pending')
        return fail();
      if (!allocated(value))
        throw new CarError(
          'ALLOCATION',
          'Alokasi berubah. Pembayaran perlu diperiksa sebelum konfirmasi.',
        );
      value.payment = 'succeeded';
      value.status = 'confirmed';
      value.invoice = {
        number: `INV-${value.id}`,
        issuedAt: new Date().toISOString(),
        emailStatus: 'simulated',
        attempts: 1,
      };
      log(
        value,
        'Pembayaran terverifikasi; reservasi rental dikonfirmasi dan invoice diterbitkan',
      );
    }
    if (action === 'payment_failed') {
      if (value.status !== 'awaiting_payment' || value.payment !== 'pending')
        return fail();
      value.payment = 'failed';
      log(
        value,
        'Pembayaran demo gagal; pilih ulang metode sebelum batas waktu',
      );
    }
    if (action === 'late_payment') {
      if (!['expired', 'cancelled'].includes(value.status)) return fail();
      value.payment = 'succeeded';
      value.status = 'exception';
      value.refund = 'processing';
      value.invoice = null;
      log(
        value,
        'Pembayaran terlambat diterima; tidak ada reservasi dan refund perlu rekonsiliasi',
      );
    }
    if (action === 'propose_replacement') {
      if (value.status !== 'confirmed' || value.replacement) return fail();
      const alternate = {
        ...carFixture(
          `${value.query.locationId}-${value.offer.vehicleClass === 'city' ? 'mpv' : 'city'}-${value.offer.mode}`,
        )!,
        providerId: value.offer.providerId,
        providerName: value.offer.providerName,
      };
      value.replacement = { ...assignment(alternate), equivalent: false };
      log(
        value,
        'Perubahan kendaraan diusulkan; menunggu persetujuan pelanggan tanpa biaya otomatis',
      );
    }
    if (action === 'accept_replacement') {
      if (value.status !== 'confirmed' || !value.replacement) return fail();
      const alternate = {
        ...carFixture(
          `${value.query.locationId}-${value.replacement.vehicleClass}-${value.offer.mode}`,
        )!,
        providerId: value.offer.providerId,
        providerName: value.offer.providerName,
      };
      const allocation = fleetAllocation(alternate, value.query, value.id);
      if (!allocation.available)
        throw new CarError(
          'ALLOCATION',
          'Kendaraan pengganti tidak tersedia. Kendaraan awal tetap berlaku.',
        );
      value.unitId = allocation.unitId;
      value.driverId = allocation.driverId;
      value.assignment = value.replacement;
      value.replacement = null;
      log(
        value,
        'Pelanggan menyetujui kendaraan pengganti; nilai pembayaran tetap',
      );
    }
    if (action === 'reject_replacement') {
      if (!value.replacement) return fail();
      value.replacement = null;
      log(value, 'Pelanggan menolak perubahan; assignment awal tetap berlaku');
    }
    if (action === 'pickup') {
      if (
        value.status !== 'confirmed' ||
        value.replacement ||
        !value.assignment
      )
        return fail();
      if (!allocated(value))
        throw new CarError(
          'ALLOCATION',
          'Alokasi berubah. Periksa kendaraan dan pengemudi sebelum serah terima.',
        );
      value.status = 'in_use';
      value.handover = {
        ...value.handover,
        pickup: true,
        fuelStart: 'Penuh',
        odometerStart: 14500,
        conditionStart: 'Bodi, ban, dan perlengkapan diperiksa bersama',
      };
      log(value, 'Serah terima kendaraan dicatat; rental dimulai');
    }
    if (action === 'return') {
      if (value.status !== 'in_use') return fail();
      value.status = 'completed';
      value.handover = {
        ...value.handover,
        returned: true,
        fuelEnd: 'Penuh',
        odometerEnd: 14620,
        conditionEnd:
          'Pemeriksaan pengembalian selesai; biaya tambahan perlu kesepakatan terpisah',
      };
      log(
        value,
        'Pengembalian kendaraan dicatat; rental selesai tanpa tagihan tambahan otomatis',
      );
    }
    if (action === 'dispute') {
      if (!['in_use', 'completed'].includes(value.status)) return fail();
      value.dispute = true;
      log(
        value,
        'Permintaan pemeriksaan kondisi diteruskan; sengketa terpisah dari tagihan',
      );
    }
    if (action === 'cancel') {
      if (!['requested', 'awaiting_payment'].includes(value.status))
        return fail();
      value.status = 'cancelled';
      value.assignment = null;
      value.replacement = null;
      value.unitId = null;
      value.driverId = null;
      value.payment = value.payment === 'pending' ? 'expired' : value.payment;
      log(value, 'Permintaan rental dibatalkan; alokasi dilepas');
    }
    if (action === 'resend_invoice' || action === 'invoice_email_failed') {
      if (
        !value.invoice ||
        !['confirmed', 'in_use', 'completed'].includes(value.status)
      )
        return fail();
      value.invoice.emailStatus =
        action === 'resend_invoice' ? 'simulated' : 'failed';
      value.invoice.attempts++;
      log(
        value,
        action === 'resend_invoice'
          ? 'Pengiriman invoice email disimulasikan ulang'
          : 'Simulasi email invoice gagal; reservasi tetap berlaku',
      );
    }
    if (action === 'refund_succeeded') {
      if (value.refund !== 'processing') return fail();
      value.refund = 'succeeded';
      log(value, 'Refund pembayaran terlambat selesai pada simulasi');
    }
    value.commands.push(commandId);
    saveCarRecord(value);
    unknown(scenario);
    return customerCarView(value);
  },
};
export const canDownloadCarInvoice = (
  value: Pick<import('./types').CarBooking, 'payment' | 'status' | 'invoice'>,
) =>
  value.payment === 'succeeded' &&
  !!value.invoice &&
  ['confirmed', 'in_use', 'completed'].includes(value.status);
