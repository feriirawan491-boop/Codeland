import type { CarBooking, CarDraft } from './types';
export type InternalCarBooking = CarBooking & {
  unitId: string | null;
  driverId: string | null;
};
export const CAR_RECORD_KEY = 'gobuking:car-bookings:v1';
const DRAFT_KEY = 'gobuking:car-drafts:v1';
export function readCarStore<T>(key: string): Record<string, T> {
  try {
    return typeof window === 'undefined'
      ? {}
      : (JSON.parse(sessionStorage.getItem(key) ?? '{}') as Record<string, T>);
  } catch {
    return {};
  }
}
export const carRecords = () =>
  readCarStore<InternalCarBooking>(CAR_RECORD_KEY);
export function saveCarRecord(value: InternalCarBooking) {
  const records = carRecords();
  records[value.id] = value;
  sessionStorage.setItem(CAR_RECORD_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event('gobuking:car-inventory-changed'));
}
export function customerCarView(value: InternalCarBooking): CarBooking {
  const { unitId, driverId, ...publicValue } = value;
  void unitId;
  void driverId;
  return structuredClone({
    ...publicValue,
    serverTime: new Date().toISOString(),
  });
}
export function saveCarDraft(value: CarDraft) {
  const values = readCarStore<CarDraft>(DRAFT_KEY);
  values[value.id] = value;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  return structuredClone(value);
}
export function getCarDraft(id: string) {
  return readCarStore<CarDraft>(DRAFT_KEY)[id] ?? null;
}
