'use client';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CarFront, UserRound, Search, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { LocationCombobox } from '@/features/home/components/location-combobox';
import { useI18n } from '@/components/i18n/locale-provider';
import { carQuerySchema, carLink } from '../lib/query';
import { CAR_AREAS, CAR_ZONE } from '../lib/config';
import type { CarQuery } from '../lib/types';
export function CarSearchForm({ initial }: { initial: CarQuery }) {
  const { t } = useI18n();
  const router = useRouter();
  const alert = useRef<HTMLDivElement>(null);
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CarQuery>({
    resolver: zodResolver(carQuerySchema),
    defaultValues: initial,
    mode: 'onBlur',
  });
  const mode = useWatch({ control, name: 'mode' }),
    city = useWatch({ control, name: 'locationId' });
  return (
    <form
      className="car-search-form"
      noValidate
      aria-label={t('Pencarian rental mobil')}
      onSubmit={(event) => {
        void handleSubmit(
          (value) => router.push(carLink('/cars/results', value)),
          () => requestAnimationFrame(() => alert.current?.focus()),
        )(event);
      }}
    >
      <fieldset className="car-mode-tabs">
        <legend className="sr-only">{t('Mode rental')}</legend>
        {(['driver', 'self'] as const).map((value) => (
          <label className={mode === value ? 'selected' : ''} key={value}>
            <input type="radio" value={value} {...register('mode')} />
            {value === 'driver' ? (
              <UserRound size={19} />
            ) : (
              <CarFront size={19} />
            )}
            <span>
              {t(value === 'driver' ? 'Dengan pengemudi' : 'Tanpa pengemudi')}
            </span>
          </label>
        ))}
      </fieldset>
      {Object.keys(errors).length > 0 && (
        <div className="car-validation" role="alert" tabIndex={-1} ref={alert}>
          <strong>{t('Periksa jadwal rental Anda')}</strong>
          <ul>
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>
                <a
                  href={`#car-${key}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`car-${key}`)?.focus();
                  }}
                >
                  {t(error?.message)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="car-search-grid">
        <Controller
          name="locationId"
          control={control}
          render={({ field }) => (
            <LocationCombobox
              id="car-locationId"
              label="Kota pengambilan"
              value={field.value}
              onChange={field.onChange}
              error={errors.locationId?.message}
            />
          )}
        />
        <label>
          <span>{t('Area pengambilan')}</span>
          <select
            id="car-pickupArea"
            aria-label={t('Area pengambilan')}
            {...register('pickupArea', {
              onChange: (e) => setValue('returnArea', e.target.value),
            })}
          >
            {Object.entries(CAR_AREAS).map(([key, label]) => (
              <option value={key} key={key}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('Area pengembalian')}</span>
          <select
            id="car-returnArea"
            aria-label={t('Area pengembalian')}
            {...register('returnArea')}
          >
            {Object.entries(CAR_AREAS).map(([key, label]) => (
              <option value={key} key={key}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="car-date-grid">
        {(['start', 'end'] as const).map((key) => (
          <div className="car-date-group" key={key}>
            <label>
              <span>
                <CalendarDays size={16} />
                {t(key === 'start' ? 'Tanggal ambil' : 'Tanggal kembali')}
              </span>
              <DateInput
                id={`car-${key}`}
                aria-invalid={!!errors[key]}
                {...register(key)}
              />
            </label>
            <label>
              <span>{t(key === 'start' ? 'Jam ambil' : 'Jam kembali')}</span>
              <input
                id={`car-${key}Time`}
                type="time"
                aria-invalid={!!errors[`${key}Time`]}
                {...register(`${key}Time`)}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="car-search-bottom">
        <p>
          {t(
            mode === 'driver'
              ? 'Paket pengemudi 12 jam; BBM dalam area termasuk.'
              : 'Lepas kunci 24 jam; syarat SIM dan deposit mengikuti mitra.',
          )}
          <span>
            {t('Waktu setempat')} · {CAR_ZONE(city)}
          </span>
        </p>
        <Button type="submit" disabled={isSubmitting}>
          <Search size={19} />
          {t('Cari mobil')}
        </Button>
      </div>
    </form>
  );
}
