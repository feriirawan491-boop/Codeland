'use client';
import { useId } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';
import {
  HOME_AMENITIES,
  HOME_AMENITY_LABELS,
  HOME_TYPE_LABELS,
} from '../lib/query';
import type { HomeFilters } from '../lib/types';
export function HomeFilterControls({
  value,
  onChange,
  onReset,
}: {
  value: HomeFilters;
  onChange: (patch: Partial<HomeFilters>) => void;
  onReset: () => void;
}) {
  const { t, locale } = useI18n();
  const id = useId();
  return (
    <div className="hotel-filters">
      <div className="filter-title">
        <h2>{t('Filter hunian')}</h2>
        <button type="button" onClick={onReset}>
          {t('Reset')}
        </button>
      </div>
      <fieldset>
        <legend>{t('Anggaran total menginap')}</legend>
        <label htmlFor={`${id}-budget`}>
          {t('Maksimal total, termasuk pajak')}
        </label>
        <select
          id={`${id}-budget`}
          value={value.maxTotal}
          onChange={(e) => onChange({ maxTotal: Number(e.target.value) })}
        >
          {[0, 1500000, 3000000, 5000000, 10000000].map((amount) => (
            <option key={amount} value={amount}>
              {amount ? formatRupiah(amount, locale) : t('Semua harga')}
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>{t('Tipe hunian')}</legend>
        <select
          aria-label={t('Tipe hunian')}
          value={value.type}
          onChange={(e) => onChange({ type: e.target.value })}
        >
          <option value="">{t('Semua tipe')}</option>
          {Object.entries(HOME_TYPE_LABELS).map(([type, label]) => (
            <option key={type} value={type}>
              {t(label)}
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>{t('Konfigurasi ruang')}</legend>
        {(
          [
            ['minBedrooms', 'Kamar tidur'],
            ['minBeds', 'Tempat tidur'],
            ['minBathrooms', 'Kamar mandi'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="home-space-filter">
            <span>{t(label)}</span>
            <select
              aria-label={t(`Minimum ${label.toLowerCase()}`)}
              value={value[key]}
              onChange={(e) => onChange({ [key]: Number(e.target.value) })}
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n ? `${n}+` : t('Semua')}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Fasilitas')}</legend>
        {HOME_AMENITIES.map((amenity) => (
          <label className="hotel-check" key={amenity}>
            <input
              type="checkbox"
              checked={value.amenities.includes(amenity)}
              onChange={(e) =>
                onChange({
                  amenities: e.target.checked
                    ? [...value.amenities, amenity]
                    : value.amenities.filter((a) => a !== amenity),
                })
              }
            />
            {t(HOME_AMENITY_LABELS[amenity])}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Aturan & ulasan')}</legend>
        <label className="hotel-check">
          <input
            type="checkbox"
            checked={value.pets}
            onChange={(e) => onChange({ pets: e.target.checked })}
          />
          {t('Hewan peliharaan diizinkan')}
        </label>
        <label htmlFor={`${id}-score`}>{t('Skor ulasan minimum')}</label>
        <select
          id={`${id}-score`}
          value={value.minScore}
          onChange={(e) => onChange({ minScore: Number(e.target.value) })}
        >
          <option value={0}>{t('Semua skor')}</option>
          <option value={9}>{t('Istimewa: 9+')}</option>
          <option value={8}>{t('Sangat baik: 8+')}</option>
        </select>
      </fieldset>
      <Button className="w-full" variant="outline" onClick={onReset}>
        {t('Hapus semua filter')}
      </Button>
    </div>
  );
}
