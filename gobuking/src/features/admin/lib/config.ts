import {
  LayoutDashboard,
  Building2,
  Hotel,
  ClipboardList,
  MessagesSquare,
  Users,
  Wallet,
  Landmark,
  LifeBuoy,
  PanelsTopLeft,
  ChartNoAxesCombined,
  Settings2,
  ShieldCheck,
  Plug,
  KeyRound,
} from 'lucide-react';
export const ADMIN_ROLES = {
  super_admin: 'Super Admin',
  partnership: 'Content / Partnership',
  operations: 'Operations / CS',
  finance_maker: 'Finance Maker',
  finance_checker: 'Finance Checker',
};
export const ADMIN_NAV = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard, cap: 'read' },
  { id: 'partners', label: 'Verifikasi mitra', icon: Building2, cap: 'verify' },
  { id: 'catalog', label: 'Moderasi katalog', icon: Hotel, cap: 'catalog' },
  {
    id: 'reservations',
    label: 'Reservasi & exception',
    icon: ClipboardList,
    cap: 'reservation',
  },
  { id: 'venue-crm', label: 'Venue CRM', icon: MessagesSquare, cap: 'crm' },
  { id: 'customers', label: 'Pelanggan', icon: Users, cap: 'customer' },
  {
    id: 'payments',
    label: 'Pembayaran & refund',
    icon: Wallet,
    cap: 'refund_request',
  },
  {
    id: 'settlements',
    label: 'Settlement & payout',
    icon: Landmark,
    cap: 'payout_make',
  },
  { id: 'support', label: 'Dukungan & kasus', icon: LifeBuoy, cap: 'support' },
  { id: 'cms', label: 'CMS & promo', icon: PanelsTopLeft, cap: 'cms' },
  {
    id: 'reports',
    label: 'Laporan pendapatan',
    icon: ChartNoAxesCombined,
    cap: 'reports',
  },
  {
    id: 'settings',
    label: 'Pengaturan platform',
    icon: Settings2,
    cap: 'settings',
  },
  {
    id: 'moderation',
    label: 'Ulasan & risiko',
    icon: ShieldCheck,
    cap: 'moderation',
  },
  { id: 'integrations', label: 'Integrasi', icon: Plug, cap: 'integration' },
  { id: 'access', label: 'Akses & audit', icon: KeyRound, cap: 'access' },
] as const;
export const adminPath = (id: string) =>
  id === 'overview' ? '/admin' : `/admin/${id}`;
export const REFUND_STATES = {
  requested: 'Menunggu review',
  approved: 'Disetujui · belum dibayar',
  processing: 'Sedang diproses',
  paid: 'Refund direkonsiliasi',
  rejected: 'Ditolak',
};
export const BATCH_STATES = {
  review: 'Menunggu checker',
  approved: 'Disetujui · belum ditransfer',
  processing: 'Bukti tercatat · menunggu rekonsiliasi',
  paid: 'Paid · direkonsiliasi',
  rejected: 'Ditolak',
};
