'use client';
import { useI18n } from '@/components/i18n/locale-provider';
import { CAR_CLASSES, CAR_PROVIDERS } from '../lib/config';
import type { CarFilters as Filters } from '../lib/types';
export function CarFilters({
  value,
  onChange,
  onReset,
}: {
  value: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="car-filters">
      <div>
        <h2>{t('Pilihan kendaraan')}</h2>
        <button type="button" onClick={onReset}>
          {t('Reset')}
        </button>
      </div>
      <label>
        <span>{t('Kelas kendaraan')}</span>
        <select
          aria-label={t('Kelas kendaraan')}
          value={value.vehicleClass}
          onChange={(e) =>
            onChange({
              vehicleClass: e.target.value as Filters['vehicleClass'],
            })
          }
        >
          <option value="">{t('Semua kelas')}</option>
          {Object.entries(CAR_CLASSES).map(([key, label]) => (
            <option value={key} key={key}>
              {t(label)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('Transmisi')}</span>
        <select
          aria-label={t('Transmisi')}
          value={value.transmission}
          onChange={(e) =>
            onChange({
              transmission: e.target.value as Filters['transmission'],
            })
          }
        >
          <option value="">{t('Semua transmisi')}</option>
          <option value="automatic">{t('Otomatis')}</option>
          <option value="manual">{t('Manual')}</option>
        </select>
      </label>
      <label>
        <span>{t('Minimal kursi penumpang')}</span>
        <select
          aria-label={t('Minimal kursi penumpang')}
          value={value.seats}
          onChange={(e) => onChange({ seats: Number(e.target.value) })}
        >
          {[0, 5, 7, 12].map((n) => (
            <option value={n} key={n}>
              {n ? t('{count} kursi', { count: n }) : t('Semua kapasitas')}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('Minimal bagasi')}</span>
        <select
          aria-label={t('Minimal bagasi')}
          value={value.baggage}
          onChange={(e) => onChange({ baggage: Number(e.target.value) })}
        >
          {[0, 2, 3, 4].map((n) => (
            <option value={n} key={n}>
              {n ? t('{count} koper', { count: n }) : t('Semua kapasitas')}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('Penyedia rental')}</span>
        <select
          aria-label={t('Penyedia rental')}
          value={value.provider}
          onChange={(e) => onChange({ provider: e.target.value })}
        >
          <option value="">{t('Semua penyedia')}</option>
          {Object.entries(CAR_PROVIDERS).map(([key, name]) => (
            <option value={key} key={key}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('Maksimal total rental (IDR)')}</span>
        <input
          type="number"
          min={0}
          step={100000}
          value={value.maxTotal || ''}
          placeholder={t('Tanpa batas anggaran')}
          onChange={(e) => onChange({ maxTotal: Number(e.target.value) })}
        />
      </label>
      <p>
        {t(
          'Harga total sudah mencakup durasi, pajak, layanan, dan pengantaran bila berlaku. Deposit tetap terpisah.',
        )}
      </p>
    </div>
  );
}
