'use client';
import { useId } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import { FLIGHT_AIRLINES } from '../lib/config';
import type { FlightFilters as Filters } from '../lib/types';
export function FlightFilters({
  value,
  onChange,
  onReset,
}: {
  value: Filters;
  onChange: (value: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const { t } = useI18n();
  const id = useId();
  return (
    <div className="flight-filters">
      <div>
        <h2>{t('Filter penerbangan')}</h2>
        <button type="button" onClick={onReset}>
          {t('Reset')}
        </button>
      </div>
      <fieldset>
        <legend>{t('Jumlah transit')}</legend>
        {(['all', 'direct', 'one'] as const).map((v) => (
          <label key={v}>
            <input
              type="radio"
              name={`${id}-stops`}
              checked={value.stops === v}
              onChange={() => onChange({ stops: v })}
            />
            {t(
              v === 'all'
                ? 'Semua penerbangan'
                : v === 'direct'
                  ? 'Langsung'
                  : '1 transit',
            )}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Maskapai demo')}</legend>
        {FLIGHT_AIRLINES.map((a) => (
          <label key={a.id}>
            <input
              type="checkbox"
              checked={value.airlines.includes(a.id)}
              onChange={(e) =>
                onChange({
                  airlines: e.target.checked
                    ? [...value.airlines, a.id]
                    : value.airlines.filter((id) => id !== a.id),
                })
              }
            />
            {a.name}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Jam berangkat')}</legend>
        {(['all', 'morning', 'afternoon', 'evening'] as const).map((v, i) => (
          <label key={v}>
            <input
              type="radio"
              name={`${id}-departure`}
              checked={value.departure === v}
              onChange={() => onChange({ departure: v })}
            />
            <span>
              {t(['Semua waktu', 'Pagi', 'Siang & sore', 'Malam'][i])}
              {v !== 'all' && (
                <small>
                  {['', '00:00–11:59', '12:00–17:59', '18:00–23:59'][i]}
                </small>
              )}
            </span>
          </label>
        ))}
      </fieldset>
      <p>{t('Filter waktu menggunakan zona bandara keberangkatan.')}</p>
      <button type="button" className="flight-filter-reset" onClick={onReset}>
        {t('Hapus semua filter')}
      </button>
    </div>
  );
}
