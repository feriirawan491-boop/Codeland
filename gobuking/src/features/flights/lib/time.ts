import type { Airport, FlightLeg } from './types';
export function airportDate(instant: string, airport: Airport) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: airport.zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(instant));
}
export function airportTime(instant: string, airport: Airport) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: airport.zone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(instant));
}
export function elapsedMinutes(start: string, end: string) {
  return Math.round((Date.parse(end) - Date.parse(start)) / 60000);
}
export function legDuration(leg: FlightLeg) {
  return elapsedMinutes(
    leg.segments[0].departureAt,
    leg.segments.at(-1)!.arrivalAt,
  );
}
export function arrivalDayOffset(leg: FlightLeg) {
  const first = leg.segments[0],
    last = leg.segments.at(-1)!;
  return Math.round(
    (Date.parse(airportDate(last.arrivalAt, last.destination)) -
      Date.parse(airportDate(first.departureAt, first.origin))) /
      86400000,
  );
}
export function localInstant(date: string, time: string, airport: Airport) {
  return new Date(
    `${date}T${time}:00+${String(airport.offset).padStart(2, '0')}:00`,
  ).toISOString();
}
export function addMinutes(instant: string, minutes: number) {
  return new Date(Date.parse(instant) + minutes * 60000).toISOString();
}
