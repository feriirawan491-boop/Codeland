import {
  readPartnerStore,
  savePartnerStore,
  guarded,
  partnerGuard,
  recordActivity,
  PartnerError,
  knownCommand,
  markCommand,
  unknownPartnerResult,
} from './store';
import { sourceReservations } from './sources';
import { carRecords, saveCarRecord } from '@/features/car/lib/store';
import { fleetAllocation } from '@/features/car/lib/inventory';
import { readDemoBooking } from '@/features/hotel/lib/booking-adapter';
import { reasonSchema } from './schemas';
import { validatePartnerFiles, storePartnerFiles } from './files';
export async function listPartnerReservations() {
  const ctx = await guarded('reservation');
  return sourceReservations(ctx);
}
export async function decidePartnerRequest(
  id: string,
  version: string,
  action: 'approve' | 'reject',
  reason: string,
  commandId: string,
  scenario = 'ready',
) {
  reasonSchema.parse(reason);
  const ctx = await guarded('reservation'),
    s = readPartnerStore(),
    row = sourceReservations(ctx).find((v) => v.id === id);
  if (!row)
    throw new PartnerError(
      '403',
      'Reservasi tidak termasuk organisasi dan assignment Anda.',
    );
  partnerGuard('reservation', row.listingId);
  if (knownCommand(s, ctx, commandId, id)) return;
  const b = carRecords()[id];
  if (
    !b ||
    row.source !== 'car' ||
    b.status !== 'requested' ||
    row.version !== version
  )
    throw new PartnerError(
      '409',
      'Request sudah diputuskan atau berubah. Status terbaru dimuat ulang.',
    );
  if (action === 'approve') {
    if (ctx.organization.status !== 'approved')
      throw new PartnerError(
        '409',
        'Penjualan ditutup. Request baru tidak dapat disetujui.',
      );
    if (
      b.renter.age < b.offer.minAge ||
      (b.offer.mode === 'self' && !b.renter.license)
    )
      throw new PartnerError(
        'ELIGIBILITY',
        'Kelayakan penyewa belum memenuhi ketentuan.',
      );
    const allocation = fleetAllocation(b.offer, b.query, b.id);
    if (!allocation.available)
      throw new PartnerError('ALLOCATION', allocation.reason!);
    b.unitId = allocation.unitId;
    b.driverId = allocation.driverId;
    b.assignment = {
      model: b.offer.name,
      plate: 'B •••• DEMO',
      transmission: b.offer.transmission,
      vehicleClass: b.offer.vehicleClass,
      seats: b.offer.seats,
      baggage: b.offer.baggage,
      driverName: b.offer.mode === 'driver' ? 'Pengemudi demo' : null,
      equivalent: true,
    };
    b.status = 'awaiting_payment';
    b.expiresAt = new Date(Date.now() + 1200000).toISOString();
  } else {
    b.status = 'rejected';
    b.reason = reason.trim();
  }
  b.commands.push(commandId);
  b.events.push({
    id: commandId,
    at: new Date().toISOString(),
    label:
      action === 'approve'
        ? 'Mitra menyetujui kelayakan dan alokasi; pembayaran dibuka'
        : 'Mitra menolak request: ' + reason.trim(),
  });
  saveCarRecord(b);
  markCommand(s, ctx, commandId, id);
  recordActivity(
    s,
    ctx,
    action === 'approve' ? 'Request disetujui' : 'Request ditolak',
    id,
    row.listingId,
  );
  savePartnerStore(s);
  unknownPartnerResult(scenario);
}
export async function recordPartnerService(
  id: string,
  version: number,
  action:
    | 'instruction'
    | 'checkin'
    | 'checkout'
    | 'pickup'
    | 'return'
    | 'no_show'
    | 'cancellation',
  notes: string,
  files: File[],
  commandId: string,
  scenario = 'ready',
) {
  await validatePartnerFiles(files);
  const ctx = await guarded('operation'),
    s = readPartnerStore(),
    b = sourceReservations(ctx).find((v) => v.id === id);
  if (!b) throw new PartnerError('403', 'Reservasi tidak dapat diakses.');
  partnerGuard('operation', b.listingId);
  if (knownCommand(s, ctx, commandId, id)) return;
  let record = s.services.find((v) => v.bookingId === id);
  if ((record?.version ?? 0) !== version)
    throw new PartnerError(
      '409',
      'Status operasional berubah. Muat ulang rincian.',
    );
  if (action !== 'instruction' && !['confirmed', 'in_use'].includes(b.status))
    throw new PartnerError(
      '409',
      'Layanan belum terkonfirmasi atau sudah berakhir.',
    );
  const start = Date.parse(
    b.start + ':00' + (b.zone === 'Asia/Makassar' ? '+08:00' : '+07:00'),
  );
  if (action === 'no_show' && (Date.now() < start || !files.length))
    throw new PartnerError(
      'VALIDATION',
      'No-show hanya setelah waktu mulai layanan dan memerlukan bukti untuk review.',
    );
  if (['no_show', 'cancellation'].includes(action)) reasonSchema.parse(notes);
  if (
    ['checkout', 'return'].includes(action) &&
    (!record || !['checked_in', 'picked_up'].includes(record.status))
  )
    throw new PartnerError(
      '409',
      'Catat kedatangan atau pickup sebelum menyelesaikan layanan.',
    );
  if (
    (['checkin', 'checkout'].includes(action) && b.category === 'car') ||
    (['pickup', 'return'].includes(action) && b.category !== 'car')
  )
    throw new PartnerError(
      'VALIDATION',
      'Tindakan tidak sesuai kategori layanan.',
    );
  record ??= {
    bookingId: id,
    orgId: ctx.organization.id,
    listingId: b.listingId,
    status: 'scheduled',
    version: 0,
    instruction: '',
    notes: '',
    files: [],
    commands: [],
  };
  if (action === 'instruction') record.instruction = notes.trim();
  else {
    record.status =
      action === 'checkin'
        ? 'checked_in'
        : action === 'pickup'
          ? 'picked_up'
          : action === 'checkout' || action === 'return'
            ? 'completed'
            : action === 'no_show'
              ? 'no_show_review'
              : 'cancellation_review';
    record.notes = notes.trim();
    record.files.push(
      ...storePartnerFiles(ctx.organization.id, `service:${id}`, files),
    );
  }
  record.version++;
  record.commands.push(commandId);
  s.services = s.services.filter((v) => v.bookingId !== id);
  s.services.push(record);
  if (action === 'checkout') {
    const source = readDemoBooking(id)!;
    source.bookingStatus = 'completed';
    source.completedAt = new Date().toISOString();
    source.events.push({
      id: commandId,
      label: 'Layanan selesai pada simulasi mitra',
      at: source.completedAt,
    });
    source.processedCommands.push(commandId);
    const all = JSON.parse(
      sessionStorage.getItem('gobuking:hotel-bookings:v1') ?? '{}',
    );
    all[id] = source;
    sessionStorage.setItem('gobuking:hotel-bookings:v1', JSON.stringify(all));
    window.dispatchEvent(new Event('gobuking:inventory-changed'));
  }
  if (action === 'pickup' || action === 'return') {
    const car = carRecords()[id];
    car.handover[action === 'pickup' ? 'pickup' : 'returned'] = true;
    car.status = action === 'pickup' ? 'in_use' : 'completed';
    car.events.push({
      id: commandId,
      label:
        action === 'return'
          ? 'Pengembalian kendaraan dicatat; rental selesai tanpa tagihan tambahan otomatis'
          : 'Kendaraan diserahkan oleh mitra',
      at: new Date().toISOString(),
    });
    car.commands.push(commandId);
    saveCarRecord(car);
  }
  recordActivity(
    s,
    ctx,
    action === 'no_show'
      ? 'Laporan no-show diajukan untuk review'
      : action === 'cancellation'
        ? 'Pembatalan mitra diajukan untuk review'
        : 'Pemenuhan layanan diperbarui',
    id,
    b.listingId,
  );
  markCommand(s, ctx, commandId, id);
  savePartnerStore(s);
  unknownPartnerResult(scenario);
}
