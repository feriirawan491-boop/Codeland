'use client';
import { useId } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import type { WeddingFilters as Filters } from '@/features/venue/lib/wedding-types';
export const WEDDING_KIND_LABELS = {
  ballroom: 'Ballroom',
  garden: 'Garden',
  resort: 'Resort',
  hall: 'Hall',
};
export function WeddingFilters({
  value,
  onChange,
  onReset,
}: {
  value: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const { t } = useI18n();
  const id = useId();
  return (
    <div className="venue-filters wedding-filters">
      <div>
        <h2>{t('Pilihan perayaan')}</h2>
        <button type="button" onClick={onReset}>
          {t('Reset')}
        </button>
      </div>
      <fieldset>
        <legend>{t('Suasana venue')}</legend>
        {(['', 'indoor', 'outdoor'] as const).map((setting) => (
          <label key={setting}>
            <input
              type="radio"
              name={`${id}-setting`}
              checked={value.setting === setting}
              onChange={() => onChange({ setting })}
            />
            {t(
              setting === 'indoor'
                ? 'Indoor'
                : setting === 'outdoor'
                  ? 'Outdoor'
                  : 'Semua area',
            )}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Tipe venue')}</legend>
        <select
          value={value.kind}
          aria-label={t('Tipe venue')}
          onChange={(e) =>
            onChange({ kind: e.target.value as Filters['kind'] })
          }
        >
          <option value="">{t('Semua tipe')}</option>
          {Object.entries(WEDDING_KIND_LABELS).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>{t('Cakupan paket')}</legend>
        {(['', 'venue-only', 'inclusive'] as const).map((kind) => (
          <label key={kind}>
            <input
              type="radio"
              name={`${id}-package`}
              checked={value.packageKind === kind}
              onChange={() => onChange({ packageKind: kind })}
            />
            {t(
              kind === 'venue-only'
                ? 'Sewa venue saja'
                : kind === 'inclusive'
                  ? 'Paket perayaan'
                  : 'Semua paket',
            )}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Anggaran total indikatif')}</legend>
        <label className="venue-max-rate">
          <span>{t('Maksimal estimasi acara (IDR)')}</span>
          <input
            type="number"
            min={0}
            step={1000000}
            value={value.budget || ''}
            onChange={(e) => onChange({ budget: Number(e.target.value) })}
            placeholder={t('Tanpa batas anggaran')}
          />
        </label>
        <p>
          {t(
            'Estimasi memperhitungkan tamu, minimum paket, overtime yang diketahui, pajak, dan layanan.',
          )}
        </p>
      </fieldset>
      <button type="button" className="venue-filter-reset" onClick={onReset}>
        {t('Hapus semua filter')}
      </button>
    </div>
  );
}
