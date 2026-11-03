'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  Search,
  UsersRound,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { LocationCombobox } from '@/features/home/components/location-combobox';
import { eventSchema, venueLink } from '@/features/venue/lib/query';
import { EVENT_LABELS, LAYOUT_LABELS } from '@/features/venue/lib/config';
import type { EventQuery } from '@/features/venue/lib/types';
export function EventSearchForm({
  initial,
  onApply,
}: {
  initial: EventQuery;
  onApply?: (q: EventQuery) => Promise<void>;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const summary = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventQuery>({
    resolver: zodResolver(eventSchema),
    defaultValues: initial,
    mode: 'onBlur',
  });
  const flexible = useWatch({ control, name: 'flexible' }),
    start = useWatch({ control, name: 'start' });
  return (
    <form
      className="venue-search-form"
      aria-label={t('Pencarian ruang MICE')}
      noValidate
      onSubmit={(event) => {
        void handleSubmit(
          async (values) => {
            setError('');
            try {
              if (onApply) await onApply(values);
              else router.push(venueLink('/mice', values));
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : 'Layanan venue sedang terganggu. Silakan coba lagi.',
              );
              requestAnimationFrame(() => summary.current?.focus());
            }
          },
          () => requestAnimationFrame(() => summary.current?.focus()),
        )(event);
      }}
    >
      {(Object.keys(errors).length > 0 || error) && (
        <div
          className="venue-validation"
          ref={summary}
          tabIndex={-1}
          role="alert"
        >
          <strong>{t('Periksa kebutuhan acara Anda')}</strong>
          {error && <p>{t(error)}</p>}
          <ul>
            {Object.entries(errors).map(([key, value]) => (
              <li key={key}>
                <a
                  href={`#event-${key}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`event-${key}`)?.focus();
                  }}
                >
                  {t(value?.message)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="venue-search-main">
        <Controller
          name="locationId"
          control={control}
          render={({ field }) => (
            <LocationCombobox
              id="event-locationId"
              value={field.value}
              onChange={field.onChange}
              label="Kota acara"
              error={errors.locationId?.message}
            />
          )}
        />
        <label>
          <span>
            <UsersRound size={16} />
            {t('Jumlah peserta')}
          </span>
          <input
            id="event-participants"
            type="number"
            min={1}
            max={2000}
            {...register('participants', { valueAsNumber: true })}
            aria-invalid={!!errors.participants}
          />
        </label>
        <label>
          <span>{t('Tata ruang')}</span>
          <select id="event-layout" {...register('layout')}>
            {Object.entries(LAYOUT_LABELS).map(([id, label]) => (
              <option value={id} key={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('Jenis acara')}</span>
          <select {...register('eventType')} id="event-eventType">
            {Object.entries(EVENT_LABELS).map(([id, label]) => (
              <option value={id} key={id}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="venue-flexible">
        <input type="checkbox" {...register('flexible')} />
        {t('Tanggal acara saya fleksibel')}
      </label>
      {!flexible && (
        <div className="venue-search-dates">
          <label>
            <span>
              <CalendarDays size={16} />
              {t('Tanggal acara')}
            </span>
            <DateInput
              id="event-start"
              {...register('start')}
              empty={!start}
              aria-invalid={!!errors.start}
            />
          </label>
          <label>
            <span>
              <CalendarDays size={16} />
              {t('Tanggal selesai')}
            </span>
            <DateInput
              id="event-end"
              {...register('end')}
              min={start}
              aria-invalid={!!errors.end}
            />
          </label>
          <label>
            <span>
              <Clock3 size={16} />
              {t('Jam mulai')}
            </span>
            <input
              type="time"
              id="event-startTime"
              {...register('startTime')}
            />
          </label>
          <label>
            <span>
              <Clock3 size={16} />
              {t('Jam selesai')}
            </span>
            <input type="time" id="event-endTime" {...register('endTime')} />
          </label>
        </div>
      )}
      <div className="venue-search-bottom">
        <p>
          {t(
            'Kapasitas dicocokkan dengan layout ruang, bukan kapasitas total venue.',
          )}
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Search />
          )}
          {t(onApply ? 'Perbarui kebutuhan' : 'Cari ruang')}
        </Button>
      </div>
    </form>
  );
}
