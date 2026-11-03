import {
  CalendarCheck,
  History,
  MessagesSquare,
  Heart,
  UserRound,
  RotateCcw,
  Star,
  ShieldCheck,
  LifeBuoy,
} from 'lucide-react';
export const DASHBOARD_NAV = [
  {
    id: 'bookings',
    path: '/account/bookings',
    label: 'Pesanan saya',
    icon: CalendarCheck,
  },
  {
    id: 'history',
    path: '/account/history',
    label: 'Riwayat perjalanan',
    icon: History,
  },
  {
    id: 'inquiries',
    path: '/account/inquiries',
    label: 'Inquiry & penawaran',
    icon: MessagesSquare,
  },
  {
    id: 'saved',
    path: '/account/saved',
    label: 'Properti tersimpan',
    icon: Heart,
  },
  {
    id: 'profile',
    path: '/account/profile',
    label: 'Profil & preferensi',
    icon: UserRound,
  },
  {
    id: 'refunds',
    path: '/account/refunds',
    label: 'Pembatalan & refund',
    icon: RotateCcw,
  },
  { id: 'reviews', path: '/account/reviews', label: 'Ulasan saya', icon: Star },
  {
    id: 'security',
    path: '/account/security',
    label: 'Keamanan & privasi',
    icon: ShieldCheck,
  },
  {
    id: 'support',
    path: '/account/support',
    label: 'Pusat bantuan akun',
    icon: LifeBuoy,
  },
] as const;
export const CATEGORY_LABELS = {
  hotel: 'Hotel',
  home: 'Home Rental',
  car: 'Car Rental',
  mice: 'MICE',
  wedding: 'Wedding Venue',
};
export const TICKET_STATUS = {
  open: 'Menunggu respons CS',
  waiting_customer: 'Menunggu balasan Anda',
  closed: 'Tiket selesai',
  verification_required: 'Menunggu verifikasi permintaan data',
};
export const REVIEW_STATUS = {
  pending: 'Menunggu moderasi',
  published: 'Dipublikasikan pada simulasi',
  rejected: 'Perlu perbaikan',
};
export const PAGE_SIZE = 5;
export const DASHBOARD_EVENT = 'gobuking:dashboard-changed';
