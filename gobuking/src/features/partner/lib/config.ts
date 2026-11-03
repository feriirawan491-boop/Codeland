import {
  LayoutDashboard,
  Building2,
  Hotel,
  CalendarDays,
  ClipboardCheck,
  KeyRound,
  MessagesSquare,
  Users,
  Star,
  Wallet,
  UserRoundCog,
  LifeBuoy,
} from 'lucide-react';
export const PARTNER_NAV = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'business', label: 'Usaha', icon: Building2 },
  { id: 'listings', label: 'Listing', icon: Hotel },
  { id: 'inventory', label: 'Kalender & tarif', icon: CalendarDays },
  { id: 'reservations', label: 'Reservasi', icon: ClipboardCheck },
  { id: 'operations', label: 'Operasional', icon: KeyRound },
  { id: 'inquiries', label: 'Venue CRM', icon: MessagesSquare },
  { id: 'customers', label: 'Pelanggan', icon: Users },
  { id: 'reviews', label: 'Ulasan', icon: Star },
  { id: 'finance', label: 'Keuangan', icon: Wallet },
  { id: 'team', label: 'Tim & akses', icon: UserRoundCog },
  { id: 'support', label: 'Bantuan & aktivitas', icon: LifeBuoy },
] as const;
export const PARTNER_ROLES = {
  owner: 'Owner',
  operations: 'Operations',
  finance: 'Finance',
};
export const LISTING_STATUS = {
  draft: 'Draft',
  under_review: 'Dalam review',
  published: 'Dipublikasikan',
  paused: 'Penjualan dijeda',
  archived: 'Diarsipkan',
};
export const BUSINESS_STATUS = {
  draft: 'Lengkapi usaha',
  under_review: 'Menunggu verifikasi',
  approved: 'Terverifikasi · demo',
  suspended: 'Ditangguhkan',
  closing: 'Penjualan ditutup',
};
export const SERVICE_STATUS = {
  scheduled: 'Terjadwal',
  checked_in: 'Sudah check-in',
  picked_up: 'Kendaraan diserahkan',
  completed: 'Layanan selesai',
  no_show_review: 'No-show dalam review',
  no_show_confirmed: 'No-show dikonfirmasi platform',
  cancellation_review: 'Pembatalan mitra dalam review',
};
export const PARTNER_CATEGORIES = {
  hotel: 'Hotel',
  home: 'Home Rental',
  car: 'Car Rental',
  mice: 'MICE',
  wedding: 'Wedding Venue',
};
export const partnerPath = (id: string) =>
  id === 'overview' ? '/partner' : `/partner/${id}`;
