import type {
  EventLayout,
  PriceBasis,
  VenueFacility,
  VenueScenario,
} from './types';
export const LAYOUT_LABELS: Record<EventLayout, string> = {
  theater: 'Theater',
  classroom: 'Classroom',
  boardroom: 'Boardroom',
  ushape: 'U-shape',
  banquet: 'Banquet',
  standing: 'Standing',
};
export const FACILITY_LABELS: Record<VenueFacility, string> = {
  av: 'Peralatan audio visual',
  wifi: 'Wi-Fi',
  parking: 'Parkir',
  catering: 'Katering',
  accessible: 'Akses kursi roda',
};
export const BASIS_LABELS: Record<PriceBasis, string> = {
  event: 'acara',
  participant: 'peserta',
  hour: 'jam',
  day: 'hari',
  quote: 'penawaran',
};
export const EVENT_LABELS = {
  meeting: 'Meeting',
  conference: 'Konferensi',
  workshop: 'Workshop',
  gathering: 'Gathering',
};
export const VENUE_SCENARIOS: VenueScenario[] = [
  'ready',
  'loading',
  'empty',
  'error',
  'timeout',
  'rate_limited',
  'unauthorized',
  'forbidden',
  'inactive',
  'blocked',
  'mutation_timeout',
];
export const INQUIRY_STATUS_LABELS = {
  new: 'Inquiry terverifikasi',
  assigned: 'PIC ditugaskan',
  in_discussion: 'Dalam pembahasan',
  quoted: 'Penawaran tersedia',
  closed_won: 'Hasil tindak lanjut tercatat',
  closed_lost: 'Tidak dilanjutkan',
  withdrawn: 'Inquiry ditarik',
};
export const REQUEST_STATUS_LABELS = {
  submitted: 'Permintaan terkirim',
  under_review: 'Sedang ditinjau',
  follow_up_required: 'Perlu tindak lanjut',
  accepted_for_contract: 'Lanjut kesepakatan kontrak',
  rejected: 'Permintaan tidak dilanjutkan',
  withdrawn: 'Permintaan ditarik',
  expired: 'Permintaan kedaluwarsa',
};
export const QUOTE_STATUS_LABELS = {
  sent: 'Terkirim',
  accepted: 'Dipakai untuk permintaan',
  rejected: 'Ditolak',
  expired: 'Kedaluwarsa',
  superseded: 'Digantikan versi baru',
};
