'use client';
import { Check, Clock3, Info, UsersRound } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatRupiah } from '@/lib/utils';
import { BASIS_LABELS } from '@/features/venue/lib/config';
import type { EventQuery, VenuePackage } from '@/features/venue/lib/types';
export function PackageCard({
  pack,
  selected,
  onSelect,
  query,
}: {
  pack: VenuePackage;
  selected: boolean;
  onSelect: () => void;
  query: EventQuery;
}) {
  const { t, locale } = useI18n();
  return (
    <article className={`venue-package-card ${selected ? 'selected' : ''}`}>
      <label className="venue-package-select">
        <input
          type="radio"
          name="venue-package"
          checked={selected}
          onChange={onSelect}
        />
        <span>{t(pack.name)}</span>
      </label>
      <p className="venue-package-price">
        {pack.amount === null
          ? t('Minta penawaran')
          : formatRupiah(pack.amount, locale)}
        {pack.amount !== null && <span> / {t(BASIS_LABELS[pack.basis])}</span>}
      </p>
      <span className="venue-indicative">
        {t('Harga indikatif, bukan total final')}
      </span>
      <div className="venue-package-facts">
        <span>
          <UsersRound size={15} />
          {t('Minimum {count} peserta', { count: pack.minParticipants })}
        </span>
        <span>
          <Clock3 size={15} />
          {t('{count} jam pemakaian', { count: pack.durationHours })}
        </span>
      </div>
      {query.participants < pack.minParticipants && (
        <p className="venue-minimum-note">
          <Info size={16} />
          {t(
            'Peserta di bawah minimum. Estimasi memakai minimum {count} peserta.',
            { count: pack.minParticipants },
          )}
        </p>
      )}
      <ul>
        {pack.includes.map((item) => (
          <li key={item}>
            <Check size={15} />
            {t(item)}
          </li>
        ))}
      </ul>
      <p className="venue-package-exclusions">
        <strong>{t('Di luar paket')}: </strong>
        {pack.excludes.map((text) => t(text)).join(' · ')}
      </p>
      <p className="venue-package-tax">
        {t('Pajak {tax}% dan layanan {service}% dihitung pada estimasi.', {
          tax: pack.taxPercent,
          service: pack.servicePercent,
        })}
      </p>
    </article>
  );
}
