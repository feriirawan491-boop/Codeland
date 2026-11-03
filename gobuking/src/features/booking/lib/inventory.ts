export type ResourceReservation = {
  id: string;
  resourceId: string;
  start: string;
  end: string;
  quantity: number;
  bufferNights: number;
};
const KEY = 'gobuking:hotel-bookings:v1';
export function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function resourceReservations(
  resourceId: string,
): ResourceReservation[] {
  if (typeof window === 'undefined') return [];
  try {
    const records: Record<
      string,
      {
        id: string;
        bookingStatus: string;
        expiresAt: string;
        query: { start: string; end: string };
        quote: {
          resourceId?: string;
          propertyId?: string;
          selectionId?: string;
          hotelId?: string;
          roomId?: string;
          quantity: number;
        };
        home?: { bufferNights: number };
      }
    > = JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
    return Object.values(records)
      .filter(
        (record) =>
          (record.quote.resourceId ??
            `${record.quote.propertyId ?? record.quote['hotelId']}:${record.quote.selectionId ?? record.quote['roomId']}`) ===
            resourceId &&
          (record.bookingStatus === 'confirmed' ||
            (record.bookingStatus === 'awaiting_payment' &&
              Date.parse(record.expiresAt) > Date.now())),
      )
      .map((record) => ({
        id: record.id,
        resourceId,
        start: record.query.start,
        end: record.query.end,
        quantity: record.quote.quantity,
        bufferNights: record.home?.bufferNights ?? 0,
      }));
  } catch {
    return [];
  }
}
export function maximumResourceHolds(
  resourceId: string,
  start: string,
  end: string,
) {
  const reservations = resourceReservations(resourceId);
  let maximum = 0;
  for (let date = start; date < end; date = shiftDate(date, 1))
    maximum = Math.max(
      maximum,
      reservations
        .filter(
          (r) =>
            shiftDate(r.start, -r.bufferNights) <= date &&
            shiftDate(r.end, r.bufferNights) > date,
        )
        .reduce((sum, r) => sum + r.quantity, 0),
    );
  return maximum;
}
