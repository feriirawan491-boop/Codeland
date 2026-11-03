import type { EventQuery, VenuePackage } from './types';
export function packageEstimate(pack: VenuePackage, event: EventQuery) {
  if (pack.amount === null) return null;
  const eventHours = event.flexible
    ? pack.durationHours
    : (Date.parse(`${event.end}T${event.endTime}:00Z`) -
        Date.parse(`${event.start}T${event.startTime}:00Z`)) /
      3600000;
  const extraHours = pack.wedding
    ? Math.max(0, Math.ceil(eventHours - pack.durationHours))
    : 0;
  if (extraHours && pack.wedding?.overtime === null) return null;
  const overtime = extraHours * (pack.wedding?.overtime ?? 0);
  const units =
    pack.basis === 'event'
      ? 1
      : pack.basis === 'participant'
        ? Math.max(event.participants, pack.minParticipants)
        : pack.basis === 'hour'
          ? Math.max(eventHours, pack.durationHours)
          : Math.max(1, Math.ceil(eventHours / pack.durationHours));
  const packageBase = Math.round(pack.amount * units),
    base = packageBase + overtime,
    serviceFee = Math.round((base * pack.servicePercent) / 100),
    tax = Math.round(((base + serviceFee) * pack.taxPercent) / 100);
  return {
    units,
    packageBase,
    overtime,
    extraHours,
    base,
    serviceFee,
    tax,
    total: base + serviceFee + tax,
    belowMinimum: event.participants < pack.minParticipants,
  };
}
