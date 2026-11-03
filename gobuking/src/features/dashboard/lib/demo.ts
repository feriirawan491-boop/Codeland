import { getDemoAccount } from '@/features/account/lib/demo-auth';
import {
  bookingAdapter,
  allDemoBookings,
} from '@/features/hotel/lib/booking-adapter';
import { hotelAdapter } from '@/features/hotel/lib/adapter';
import { homeAdapter } from '@/features/home-rental/lib/adapter';
import { carBookingAdapter } from '@/features/car/lib/booking-adapter';
import { carRecords } from '@/features/car/lib/store';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import {
  requireDashboardAccount,
  assertSameAccount,
  DashboardError,
} from './store';
function datePlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
export async function createDashboardDemo() {
  const account = requireDashboardAccount(),
    hotel = hotelAdapter.getHotelById('seruni')!;
  const contact = {
    name: account.name,
    email: account.email,
    guestName: account.name,
  };
  for (const [index, kind] of (
    ['pending', 'partial', 'completed'] as const
  ).entries()) {
    assertSameAccount(account.id);
    const id = `dashboard-demo-${account.id}-${kind}`;
    if (
      allDemoBookings().some(
        (b) =>
          b.customerId === account.id &&
          b.processedCommands.includes(`create:${id}`),
      )
    )
      continue;
    const query = {
      locationId: 'bali',
      start: datePlus(30 + index * 4),
      end: datePlus(32 + index * 4),
      adults: 2,
      children: 0,
      childAges: [],
      rooms: 1,
    };
    const room = hotel.rooms[0],
      rate = room.rates[0],
      quote = await hotelAdapter.previewBooking(hotel, room.id, rate.id, query);
    assertSameAccount(account.id);
    const booking = await bookingAdapter.createBooking(
      {
        id,
        hotelId: hotel.id,
        roomId: room.id,
        rateId: rate.id,
        query,
        quote,
        scenario: 'ready',
      },
      quote.version,
      'qris',
      contact,
    );
    if (kind !== 'pending') {
      if (kind === 'partial')
        await bookingAdapter.simulateCancellationPolicy(booking.id);
      await bookingAdapter.command(booking.id, 'start_payment', `${id}:start`);
      await bookingAdapter.command(
        booking.id,
        'payment_succeeded',
        `${id}:paid`,
      );
      if (kind === 'completed')
        await bookingAdapter.command(booking.id, 'complete', `${id}:completed`);
    }
  }
  const homeId = `dashboard-demo-${account.id}-home`;
  if (
    !allDemoBookings().some(
      (b) =>
        b.customerId === account.id &&
        b.processedCommands.includes(`create:${homeId}`),
    )
  ) {
    const home = homeAdapter.getHomeById('nala')!,
      query = {
        locationId: 'bali',
        start: datePlus(50),
        end: datePlus(52),
        adults: 2,
        children: 0,
        childAges: [],
        rooms: 1 as const,
      },
      quote = await homeAdapter.previewHomeQuote(home, query, []);
    assertSameAccount(account.id);
    const b = await bookingAdapter.createHomeBooking(
      {
        id: homeId,
        homeId: home.id,
        query,
        extraIds: [],
        quote,
        scenario: 'ready',
      },
      quote.version,
      'va',
      contact,
      true,
    );
    await bookingAdapter.command(b.id, 'cancel', `${homeId}:cancel`);
  }
  if (
    !Object.values(carRecords()).some(
      (b) =>
        b.customerId === account.id &&
        b.commands.includes(`dashboard-demo-${account.id}-car`),
    )
  ) {
    const draft = await carBookingAdapter.createDraft('jakarta-mpv-driver', {
      locationId: 'jakarta',
      mode: 'driver',
      pickupArea: 'central',
      returnArea: 'central',
      start: datePlus(40),
      end: datePlus(40),
      startTime: '09:00',
      endTime: '21:00',
    });
    assertSameAccount(account.id);
    await carBookingAdapter.createRentalRequest(
      draft.id,
      {
        name: account.name,
        age: 30,
        license: false,
        eligibility: true,
        pickupDetail: 'Titik temu contoh di pusat kota',
        notes: 'Data contoh dashboard',
        consent: true,
      },
      `dashboard-demo-${account.id}-car`,
    );
  }
  const inquiry = await inquiryAdapter.createInquiry(
    {
      service: 'mice',
      spaceId: 'cendana-hall',
      packageId: 'cendana-hall-full',
      contact: { ...account, company: 'Perencana acara demo' },
      event: {
        locationId: 'jakarta',
        flexible: true,
        start: '',
        end: '',
        startTime: '09:00',
        endTime: '17:00',
        participants: 50,
        layout: 'theater',
        eventType: 'meeting',
      },
      needs: { av: true, catering: true, rooms: 0, notes: '' },
      consent: true,
    },
    `dashboard-demo-${account.id}-inquiry`,
  );
  if (!inquiry.verifiedAt)
    await inquiryAdapter.verifyInquiryContact(inquiry.id, '123456');
  if (!(await inquiryAdapter.getInquiry(inquiry.id)).quotes.length)
    await inquiryAdapter.simulateSales(
      inquiry.id,
      'quote',
      `dashboard-demo-${account.id}-quote`,
    );
  if (getDemoAccount()?.id !== account.id)
    throw new DashboardError('401', 'Sesi akun berubah.');
  return true;
}
