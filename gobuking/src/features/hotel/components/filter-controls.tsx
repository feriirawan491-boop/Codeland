'use client';
import { useId } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import { AMENITY_LABELS, HOTEL_AMENITIES } from '../lib/query';
import type { HotelFilters } from '../lib/types';
export function FilterControls({
  value,
  onChange,
  onReset,
}: {
  value: HotelFilters;
  onChange: (value: Partial<HotelFilters>) => void;
  onReset: () => void;
}) {
  const { t } = useI18n();
  const id = useId();
  return (
    <div className="hotel-filters">
      <div className="filter-title">
        <h2>{t('Filter pencarian')}</h2>
        <button onClick={onReset} type="button">
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
          <option value={0}>{t('Semua harga')}</option>
          <option value={1500000}>Rp1.500.000</option>
          <option value={3000000}>Rp3.000.000</option>
          <option value={5000000}>Rp5.000.000</option>
          <option value={10000000}>Rp10.000.000</option>
        </select>
      </fieldset>
      <fieldset>
        <legend>{t('Pilihan populer')}</legend>
        <label className="hotel-check">
          <input
            type="checkbox"
            checked={value.breakfast}
            onChange={(e) => onChange({ breakfast: e.target.checked })}
          />
          {t('Termasuk sarapan')}
        </label>
        <label className="hotel-check">
          <input
            type="checkbox"
            checked={value.freeCancellation}
            onChange={(e) => onChange({ freeCancellation: e.target.checked })}
          />
          {t('Bisa dibatalkan gratis')}
        </label>
      </fieldset>
      <fieldset>
        <legend>{t('Kelas bintang hotel')}</legend>
        {[5, 4, 3].map((stars) => (
          <label key={stars} className="hotel-check">
            <input
              type="checkbox"
              checked={value.stars.includes(stars)}
              onChange={(e) =>
                onChange({
                  stars: e.target.checked
                    ? [...value.stars, stars]
                    : value.stars.filter((s) => s !== stars),
                })
              }
            />
            {t('{count} bintang', { count: stars })}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Skor ulasan')}</legend>
        <select
          aria-label={t('Skor ulasan minimum')}
          value={value.minScore}
          onChange={(e) => onChange({ minScore: Number(e.target.value) })}
        >
          <option value={0}>{t('Semua skor')}</option>
          <option value={9}>{t('Istimewa: 9+')}</option>
          <option value={8}>{t('Sangat baik: 8+')}</option>
        </select>
      </fieldset>
      <fieldset>
        <legend>{t('Fasilitas')}</legend>
        {HOTEL_AMENITIES.map((amenity) => (
          <label key={amenity} className="hotel-check">
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
            {t(AMENITY_LABELS[amenity])}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Tipe properti')}</legend>
        <select
          aria-label={t('Tipe properti')}
          value={value.propertyType}
          onChange={(e) => onChange({ propertyType: e.target.value })}
        >
          <option value="">{t('Semua tipe')}</option>
          <option value="hotel">{t('Hotel')}</option>
          <option value="resort">{t('Resort')}</option>
        </select>
      </fieldset>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onReset}
      >
        {t('Hapus semua filter')}
      </Button>
    </div>
  );
}
