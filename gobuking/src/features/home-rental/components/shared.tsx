'use client';
import { useI18n } from '@/components/i18n/locale-provider';
import { SearchForm } from '@/features/home/components/search-panel';
import { DEFAULT_SEARCH } from '@/features/home/lib/search';
import { FlaskConical, ChevronDown, Wallet, Info } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { FacilityIcon } from '@/features/hotel/components/facility-icon';
import {
  Wifi,
  CookingPot,
  Waves,
  ParkingCircle,
  AirVent,
  WashingMachine,
  LaptopMinimal,
  Trees,
  type LucideIcon,
} from 'lucide-react';
import { HOME_AMENITY_LABELS } from '../lib/query';
import type { HomeAmenity, HomeProperty, HomeQuery } from '../lib/types';
import type { HomeBookingSnapshot } from '../lib/types';
export const HOME_ICONS: Record<HomeAmenity, LucideIcon> = {
  wifi: Wifi,
  kitchen: CookingPot,
  pool: Waves,
  parking: ParkingCircle,
  air: AirVent,
  washer: WashingMachine,
  workspace: LaptopMinimal,
  garden: Trees,
};
export function HomeAmenityIcon({
  name,
  size = 20,
}: {
  name: HomeAmenity;
  size?: number;
}) {
  const Icon = HOME_ICONS[name];
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
export function HomeDemoNotice() {
  const { t } = useI18n();
  return (
    <div className="hotel-demo">
      <FlaskConical size={16} />
      <p>
        {t(
          'Demo Phase 03 · Hunian, kalender, pengelola, dan pembayaran menggunakan data simulasi. Tidak ada transaksi nyata.',
        )}
      </p>
    </div>
  );
}
export function HomeSearchEditor({ query }: { query: HomeQuery }) {
  const { t } = useI18n();
  return (
    <details className="hotel-search-editor">
      <summary>
        <span>{t('Ubah tanggal & tamu')}</span>
        <ChevronDown size={16} />
      </summary>
      <div className="p-5">
        <SearchForm
          key={JSON.stringify(query)}
          service="home"
          initial={{ ...DEFAULT_SEARCH, ...query }}
          saveDraft={() => {}}
        />
      </div>
    </details>
  );
}
export function HomeFacilities({ home }: { home: HomeProperty }) {
  const { t } = useI18n();
  return (
    <section id="home-facilities" className="hotel-detail-section">
      <h2>{t('Fasilitas hunian')}</h2>
      <div className="home-amenity-grid">
        {home.amenities.map((amenity) => (
          <span key={amenity}>
            <HomeAmenityIcon name={amenity} />
            {t(HOME_AMENITY_LABELS[amenity])}
          </span>
        ))}
      </div>
    </section>
  );
}
export function DepositNotice({
  deposit,
}: {
  deposit: HomeProperty['deposit'];
}) {
  const { t, locale } = useI18n();
  if (!deposit.amount) return null;
  return (
    <div className="home-deposit">
      <Wallet size={21} />
      <div>
        <strong>
          {t('Deposit terpisah')} · {formatRupiah(deposit.amount, locale)}
        </strong>
        <p>
          {t('Dibayar ke pengelola')}: {deposit.recipient}
        </p>
        <p>{t('Tidak termasuk total pembayaran online.')}</p>
        <small>{t(deposit.policy)}</small>
      </div>
    </div>
  );
}
export function HomeRules({
  home,
  compact = false,
}: {
  home:
    | Pick<
        HomeProperty,
        | 'rules'
        | 'checkIn'
        | 'checkOut'
        | 'zone'
        | 'maxGuests'
        | 'minNights'
        | 'bufferNights'
      >
    | HomeBookingSnapshot;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const points = [
    {
      icon: 'reception' as const,
      title: t('Check-in'),
      value: `${home.checkIn} · ${home.zone}`,
    },
    {
      icon: 'reception' as const,
      title: t('Check-out'),
      value: `${home.checkOut} · ${home.zone}`,
    },
    {
      icon: 'bed' as const,
      title: t('Kapasitas hunian'),
      value: t('Maksimal {count} tamu', { count: home.maxGuests }),
    },
    {
      icon: 'security' as const,
      title: t('Jam tenang'),
      value: home.rules.quietHours,
    },
    {
      icon: 'garden' as const,
      title: t('Hewan peliharaan'),
      value: t(home.rules.pets ? 'Diizinkan sesuai aturan' : 'Tidak diizinkan'),
    },
    {
      icon: 'smoke' as const,
      title: t('Merokok'),
      value: t(
        home.rules.smoking ? 'Diizinkan di area tertentu' : 'Tidak diizinkan',
      ),
    },
    {
      icon: 'security' as const,
      title: t('Pesta & acara'),
      value: t(
        home.rules.events ? 'Perlu konfirmasi pengelola' : 'Tidak diizinkan',
      ),
    },
    {
      icon: 'reception' as const,
      title: t('Usia pemesan minimum'),
      value: t('{count} tahun', { count: home.rules.minimumAge }),
    },
  ];
  return (
    <div className={compact ? 'home-rules-list compact' : 'home-rules-list'}>
      {points.map((point) => (
        <div key={point.title}>
          <FacilityIcon name={point.icon} size={19} />
          <span>
            <strong>{point.title}</strong>
            <span>{point.value}</span>
          </span>
        </div>
      ))}
      {!compact && (
        <p className="home-calendar-policy">
          <Info size={16} />
          {t('Minimum {min} malam · Jeda pembersihan {buffer} malam', {
            min: home.minNights,
            buffer: home.bufferNights,
          })}
        </p>
      )}
    </div>
  );
}
