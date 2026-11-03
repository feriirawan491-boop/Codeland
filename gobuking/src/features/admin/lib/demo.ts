import { hotelAdapter } from '@/features/hotel/lib/adapter';
import {
  guardedAdmin,
  readAdminStore,
  saveAdminStore,
  adminAudit,
  adminContext,
} from './store';
import {
  readPartnerStore,
  savePartnerStore,
} from '@/features/partner/lib/store';
import {
  createPartnerOrganization,
  syncPartnerPublic,
} from '@/features/partner/lib/business';
import { createDashboardDemo } from '@/features/dashboard/lib/demo';
import {
  allDemoBookings,
  bookingAdapter,
} from '@/features/hotel/lib/booking-adapter';
import { storePartnerFiles } from '@/features/partner/lib/files';
import { createAdminCase } from './operations';
import {
  submitReview,
  reviewEligibility,
} from '@/features/dashboard/lib/reviews';
export async function addAdminExamples() {
  const ctx = await guardedAdmin('access');
  if (!readPartnerStore().listings.length)
    await createPartnerOrganization(
      {
        name: 'Nusa Hospitality',
        email: 'partner@example.test',
        phone: '081234567890',
        address: 'Alamat operasional contoh Gobuking di Indonesia',
      },
      true,
    );
  await createDashboardDemo();
  if (adminContext().key !== ctx.key) throw new Error('Konteks admin berubah.');
  const { PDFDocument, StandardFonts } = await import('pdf-lib');
  const pdf = await PDFDocument.create(),
    page = pdf.addPage(),
    font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText('Gobuking - Private verification demo document', {
    x: 40,
    y: 760,
    size: 14,
    font,
  });
  const file = new File(
    [new Uint8Array(await pdf.save())],
    'business-evidence-demo.pdf',
    { type: 'application/pdf' },
  );
  const p = readPartnerStore();
  if (!p.businesses.some((o) => o.id === 'ORG-ADMIN-READY')) {
    const origin = p.businesses[0],
      id = 'ORG-ADMIN-READY';
    p.businesses.push({
      ...structuredClone(origin),
      id,
      name: 'Lentera Stay · Pengajuan demo',
      status: 'under_review',
      version: 1,
      documents: storePartnerFiles(id, `business:${id}`, [file]),
      contract: { version: 1, acceptedAt: new Date().toISOString() },
      bank: {
        name: 'Bank demo',
        holder: 'Lentera Stay',
        last4: '7088',
        version: 1,
      },
      pendingBank: null,
    });
    p.businesses.push({
      ...structuredClone(origin),
      id: 'ORG-ADMIN-INCOMPLETE',
      name: 'Usaha Baru · Belum lengkap',
      status: 'under_review',
      version: 1,
      documents: [],
      contract: { version: 1, acceptedAt: null },
      bank: null,
      pendingBank: null,
    });
    const home = p.listings.find((l) => l.category === 'home')!;
    p.listings.push({
      ...structuredClone(home),
      id: 'ADMIN-DUPLICATE-VILLA',
      category: 'hotel',
      name: 'Villa Nala · Duplikasi demo',
      status: 'under_review',
      version: 1,
      resourceId: 'unmapped:duplicate-villa',
      sourceId: home.sourceId,
      publicPath: null,
    });
    savePartnerStore(p);
    syncPartnerPublic();
  }
  const suiteId = `admin-demo-suite-${ctx.accountId}`;
  if (
    !allDemoBookings().some((b) =>
      b.processedCommands.includes(`create:${suiteId}`),
    )
  ) {
    const hotel = hotelAdapter.getHotelById('seruni')!,
      room = hotel.rooms.find((r) => r.id === 'suite')!,
      query = {
        locationId: 'bali',
        start: '2099-11-10',
        end: '2099-11-12',
        adults: 2,
        children: 0,
        childAges: [],
        rooms: 1,
      },
      quote = await hotelAdapter.previewBooking(
        hotel,
        room.id,
        room.rates[0].id,
        query,
      ),
      b = await bookingAdapter.createBooking(
        {
          id: suiteId,
          hotelId: hotel.id,
          roomId: room.id,
          rateId: room.rates[0].id,
          query,
          quote,
          scenario: 'ready',
        },
        quote.version,
        'qris',
        {
          name: ctx.actor.name,
          email: ctx.actor.email,
          guestName: ctx.actor.name,
        },
      );
    await bookingAdapter.command(b.id, 'start_payment', suiteId + ':start');
    await bookingAdapter.command(b.id, 'payment_succeeded', suiteId + ':paid');
  }
  const pending = allDemoBookings().find(
    (b) =>
      b.customerId === ctx.accountId && b.bookingStatus === 'awaiting_payment',
  );
  if (pending) {
    await bookingAdapter.command(pending.id, 'expire', 'admin-demo-expire');
    await bookingAdapter.command(
      pending.id,
      'late_payment',
      'admin-demo-late-payment',
    );
    const owner = readAdminStore().actors.find(
      (a) => a.role === 'operations' && a.active,
    )!;
    await createAdminCase({
      bookingId: pending.id,
      ticketId: null,
      customerId: ctx.accountId,
      kind: 'exception',
      priority: 'urgent',
      ownerId: owner.id,
      resolution: 'refund',
      alternative:
        'Tinjau refund atau rebooking setelah validasi pembayaran dan ketersediaan.',
      costBearer: 'platform',
      reason:
        'Pembayaran terlambat tercatat setelah batas reservasi; perlu penyelesaian.',
    });
  }
  const eligible = (await reviewEligibility()).find((r) => r.eligible);
  if (eligible)
    await submitReview(
      {
        bookingId: eligible.booking.id,
        score: 4,
        title: 'Pengalaman perlu ditingkatkan',
        body: 'Waktu tunggu cukup lama tetapi staf berusaha membantu kebutuhan kami.',
        subscore: 5,
      },
      'admin-demo-pending-review',
    );
  const s = readAdminStore();
  adminAudit(
    s,
    ctx,
    'Aktivitas platform demo ditambahkan',
    'demo',
    'Fixture lokal untuk antrean, pengecualian, dan moderasi.',
  );
  saveAdminStore(s);
}
