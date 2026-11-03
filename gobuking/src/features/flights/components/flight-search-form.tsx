'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import {
  ArrowLeftRight,
  CalendarDays,
  UsersRound,
  Search,
  LoaderCircle,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { LocationCombobox } from '@/features/home/components/location-combobox';
import { datePlus } from '@/features/hotel/lib/query';
import { flightParams, flightSchema } from '../lib/query';
import type { FlightQuery } from '../lib/types';
export function FlightSearchForm({ initial }: { initial?: FlightQuery }) {
  const { t } = useI18n();
  const router = useRouter();
  const summary = useRef<HTMLDivElement>(null);
  const [swap, setSwap] = useState(0);
  const {
    register,
    control,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof flightSchema>,
    unknown,
    z.output<typeof flightSchema>
  >({
    resolver: zodResolver(flightSchema),
    defaultValues: initial ?? {
      locationId: 'CGK',
      destinationId: 'DPS',
      start: datePlus(7),
      end: datePlus(10),
      trip: 'oneway',
      adults: 2,
      children: 0,
      infants: 0,
      cabin: 'economy',
    },
    mode: 'onBlur',
  });
  const trip = useWatch({ control, name: 'trip' });
  const start = useWatch({ control, name: 'start' });
  const end = useWatch({ control, name: 'end' });
  return (
    <form
      className="flight-search-form"
      aria-label={t('Cari penerbangan')}
      noValidate
      onSubmit={(event) => {
        void handleSubmit(
          (values) => {
            router.push(`/flights/results?${flightParams(values)}`);
          },
          () => requestAnimationFrame(() => summary.current?.focus()),
        )(event);
      }}
    >
      <div className="flight-form-top">
        <fieldset className="flight-trip-choice">
          <legend className="sr-only">{t('Jenis perjalanan')}</legend>
          {(['oneway', 'roundtrip'] as const).map((mode) => (
            <label key={mode}>
              <input type="radio" value={mode} {...register('trip')} />
              {t(mode === 'oneway' ? 'Sekali jalan' : 'Pulang pergi')}
            </label>
          ))}
        </fieldset>
        <label className="flight-cabin">
          <span className="sr-only">{t('Kelas kabin')}</span>
          <select {...register('cabin')}>
            <option value="economy">{t('Ekonomi')}</option>
            <option value="business">{t('Bisnis')}</option>
          </select>
        </label>
      </div>
      {!!Object.keys(errors).length && (
        <div
          className="flight-validation"
          role="alert"
          ref={summary}
          tabIndex={-1}
        >
          <strong>{t('Periksa pencarian penerbangan')}</strong>
          <ul>
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>
                <a
                  href={`#flight-${key}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`flight-${key}`)?.focus();
                  }}
                >
                  {t(error?.message)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flight-route-fields">
        <Controller
          name="locationId"
          control={control}
          render={({ field }) => (
            <LocationCombobox
              key={`origin-${swap}`}
              id="flight-locationId"
              value={field.value}
              onChange={field.onChange}
              airport
              label="Dari"
              error={errors.locationId?.message}
            />
          )}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="flight-swap"
          aria-label={t('Tukar bandara asal dan tujuan')}
          onClick={() => {
            const origin = getValues('locationId');
            setValue('locationId', getValues('destinationId'), {
              shouldValidate: true,
            });
            setValue('destinationId', origin, { shouldValidate: true });
            setSwap((n) => n + 1);
          }}
        >
          <ArrowLeftRight />
        </Button>
        <Controller
          name="destinationId"
          control={control}
          render={({ field }) => (
            <LocationCombobox
              key={`destination-${swap}`}
              id="flight-destinationId"
              value={field.value}
              onChange={field.onChange}
              airport
              label="Ke"
              error={errors.destinationId?.message}
            />
          )}
        />
      </div>
      <div
        className={`flight-date-fields ${trip === 'oneway' ? 'oneway' : ''}`}
      >
        <label>
          <span>
            <CalendarDays size={16} />
            {t('Tanggal berangkat')}
          </span>
          <DateInput
            id="flight-start"
            {...register('start')}
            empty={!start}
            aria-invalid={!!errors.start}
            aria-describedby={errors.start ? 'flight-start-error' : undefined}
          />
          {errors.start && (
            <small id="flight-start-error" className="field-error">
              {t(errors.start.message)}
            </small>
          )}
        </label>
        {trip === 'roundtrip' && (
          <label>
            <span>
              <CalendarDays size={16} />
              {t('Tanggal pulang')}
            </span>
            <DateInput
              id="flight-end"
              {...register('end')}
              min={start}
              empty={!end}
              aria-invalid={!!errors.end}
              aria-describedby={errors.end ? 'flight-end-error' : undefined}
            />
            {errors.end && (
              <small id="flight-end-error" className="field-error">
                {t(errors.end.message)}
              </small>
            )}
          </label>
        )}
      </div>
      <fieldset className="flight-passengers">
        <legend>
          <UsersRound size={16} />
          {t('Penumpang')}
        </legend>
        <div>
          {(['adults', 'children', 'infants'] as const).map((key, i) => (
            <label key={key}>
              <span>
                {t(['Dewasa', 'Anak', 'Bayi'][i])}
                <small>
                  {t(
                    [
                      '12 tahun ke atas',
                      '2–11 tahun',
                      'Di bawah 2 tahun, tanpa kursi',
                    ][i],
                  )}
                </small>
              </span>
              <input
                type="number"
                id={`flight-${key}`}
                aria-label={t(
                  ['Jumlah dewasa', 'Jumlah anak', 'Jumlah bayi'][i],
                )}
                min={key === 'adults' ? 1 : 0}
                max={key === 'infants' ? 4 : 9}
                {...register(key, { valueAsNumber: true })}
                aria-invalid={!!errors[key]}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flight-form-bottom">
        <p>
          {t(
            'Aturan demo: maksimal 9 penumpang dengan kursi dan 1 bayi per dewasa. Kebijakan akhir mengikuti supplier.',
          )}
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Search />
          )}
          {t('Cari penerbangan')}
        </Button>
      </div>
    </form>
  );
}
