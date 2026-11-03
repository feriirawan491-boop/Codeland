'use client';
import { useId } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import { FACILITY_LABELS, BASIS_LABELS } from '@/features/venue/lib/config';
import type {
  VenueFacility,
  VenueFilters as Filters,
} from '@/features/venue/lib/types';
export function VenueFilters({
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
    <div className="venue-filters">
      <div>
        <h2>{t('Sesuaikan ruang')}</h2>
        <button type="button" onClick={onReset}>
          {t('Reset')}
        </button>
      </div>
      <fieldset>
        <legend>{t('Area ruang')}</legend>
        {(['', 'indoor', 'outdoor'] as const).map((v) => (
          <label key={v}>
            <input
              type="radio"
              name={`${id}-setting`}
              checked={value.setting === v}
              onChange={() => onChange({ setting: v })}
            />
            {t(
              v === 'indoor'
                ? 'Indoor'
                : v === 'outdoor'
                  ? 'Outdoor'
                  : 'Semua area',
            )}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Fasilitas terverifikasi')}</legend>
        {(Object.keys(FACILITY_LABELS) as VenueFacility[]).map((f) => (
          <label key={f}>
            <input
              type="checkbox"
              checked={value.facilities.includes(f)}
              onChange={(e) =>
                onChange({
                  facilities: e.target.checked
                    ? [...value.facilities, f]
                    : value.facilities.filter((v) => v !== f),
                })
              }
            />
            {t(FACILITY_LABELS[f])}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Basis harga paket')}</legend>
        <select
          aria-label={t('Basis harga paket')}
          value={value.basis}
          onChange={(e) =>
            onChange({
              basis: e.target.value as Filters['basis'],
              maxRate: 0,
              sort: 'recommended',
            })
          }
        >
          <option value="">{t('Semua basis harga')}</option>
          {Object.entries(BASIS_LABELS)
            .filter(([key]) => key !== 'event')
            .map(([key, label]) => (
              <option key={key} value={key}>
                {key === 'quote'
                  ? t('Harga melalui penawaran')
                  : t('Per {unit}', { unit: t(label) })}
              </option>
            ))}
        </select>
        {value.basis && value.basis !== 'quote' && (
          <label className="venue-max-rate">
            <span>
              {t('Maksimal tarif per {unit}', {
                unit: t(BASIS_LABELS[value.basis]),
              })}
            </span>
            <input
              aria-label={t('Maksimal tarif')}
              type="number"
              min={0}
              step={50000}
              value={value.maxRate || ''}
              onChange={(e) => onChange({ maxRate: Number(e.target.value) })}
              placeholder="IDR"
            />
          </label>
        )}
        <p>
          {t(
            'Pilih satu basis harga untuk membandingkan atau mengurutkan tarif.',
          )}
        </p>
      </fieldset>
      <button type="button" className="venue-filter-reset" onClick={onReset}>
        {t('Hapus semua filter')}
      </button>
    </div>
  );
}
