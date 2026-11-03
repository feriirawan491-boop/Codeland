import type { Airport, FlightScenario } from './types';
export const FLIGHT_AIRPORTS: Airport[] = [
  {
    id: 'CGK',
    name: 'Soekarno–Hatta',
    city: 'Jakarta',
    zone: 'Asia/Jakarta',
    zoneLabel: 'WIB',
    offset: 7,
  },
  {
    id: 'DPS',
    name: 'I Gusti Ngurah Rai',
    city: 'Bali',
    zone: 'Asia/Makassar',
    zoneLabel: 'WITA',
    offset: 8,
  },
  {
    id: 'YIA',
    name: 'Yogyakarta International',
    city: 'Yogyakarta',
    zone: 'Asia/Jakarta',
    zoneLabel: 'WIB',
    offset: 7,
  },
  {
    id: 'SUB',
    name: 'Juanda',
    city: 'Surabaya',
    zone: 'Asia/Jakarta',
    zoneLabel: 'WIB',
    offset: 7,
  },
  {
    id: 'LOP',
    name: 'Zainuddin Abdul Madjid',
    city: 'Lombok',
    zone: 'Asia/Makassar',
    zoneLabel: 'WITA',
    offset: 8,
  },
];
export const DEMO_FLIGHT_RULES = {
  maxSeated: 9,
  maxInfants: 4,
  adultAge: 12,
  childMinAge: 2,
  infantsPerAdult: 1,
} as const;
export const FLIGHT_AIRLINES = [
  { id: 'nusa', name: 'Nusa Air', code: 'NA', color: 'blue' },
  { id: 'aruna', name: 'Aruna Airways', code: 'AR', color: 'orange' },
  { id: 'langit', name: 'Langit Indonesia', code: 'LI', color: 'teal' },
] as const;
export const FLIGHT_SCENARIOS: FlightScenario[] = [
  'ready',
  'loading',
  'empty',
  'timeout',
  'rate_limited',
  'offline',
  'unavailable',
  'expired',
  'no_expiry',
  'error',
  'unauthorized',
  'forbidden',
  'inactive',
];
export const flightAirport = (id: string) =>
  FLIGHT_AIRPORTS.find((a) => a.id === id);
