'use client';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Search, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { useI18n } from '@/components/i18n/locale-provider';
import { LocationCombobox } from '@/features/home/components/location-combobox';
import type { EventQuery } from '@/features/venue/lib/types';
import type { WeddingQuery } from '@/features/venue/lib/wedding-types';
import { weddingQuerySchema, weddingLink } from '../lib/query';
export function WeddingSearchForm({
  initial,
  onApply,
}: {
  initial: WeddingQuery;
  onApply?: (value: WeddingQuery) => Promise<void>;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const alert = useRef<HTMLDivElement>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<EventQuery>({
    resolver: zodResolver(weddingQuerySchema),
    defaultValues: initial,
    mode: 'onBlur',
  });
  const flexible = useWatch({ control, name: 'flexible' }),
    start = useWatch({ control, name: 'start' });
  return (
    <form
      className="wedding-search-form"
      aria-label={t('Pencarian Wedding Venue')}
      noValidate
      onSubmit={(event) => {
        void handleSubmit(
          async (value) => {
            const query = {
              ...value,
              end: value.start,
              layout: value.layout as WeddingQuery['layout'],
            };
            try {
              if (onApply) await onApply(query);
              else router.push(weddingLink('/wedding', query));
            } catch (error) {
              setError('root', {
                message:
                  error instanceof Error
                    ? error.message
                    : 'Layanan venue sedang terganggu. Silakan coba lagi.',
              });
              requestAnimationFrame(() => alert.current?.focus());
            }
          },
          () => requestAnimationFrame(() => alert.current?.focus()),
        )(event);
      }}
    >
      {Object.keys(errors).length > 0 && (
        <div
          className="venue-validation"
          role="alert"
          tabIndex={-1}
          ref={alert}
        >
          <strong>{t('Periksa rencana pernikahan Anda')}</strong>
          <ul>
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>
                <a
                  href={`#wedding-${key}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`wedding-${key}`)?.focus();
                  }}
                >
                  {t(error?.message)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="wedding-search-main">
        <Controller
          name="locationId"
          control={control}
          render={({ field }) => (
            <LocationCombobox
              id="wedding-locationId"
              value={field.value}
              onChange={field.onChange}
              label="Lokasi pernikahan"
              error={errors.locationId?.message}
            />
          )}
        />
        <label>
          <span>
            <UsersRound size={16} />
            {t('Jumlah tamu')}
          </span>
          <input
            id="wedding-participants"
            type="number"
            min={1}
            max={2000}
            {...register('participants', { valueAsNumber: true })}
          />
        </label>
        <label>
          <span>{t('Format tamu')}</span>
          <select
            aria-label={t('Format tamu')}
            id="wedding-layout"
            {...register('layout')}
          >
            <option value="banquet">{t('Duduk')}</option>
            <option value="standing">{t('Berdiri')}</option>
          </select>
        </label>
      </div>
      <label className="venue-flexible">
        <input type="checkbox" {...register('flexible')} />
        {t('Tanggal pernikahan saya fleksibel')}
      </label>
      {!flexible && (
        <div className="wedding-search-dates">
          <label>
            <span>
              <CalendarDays size={16} />
              {t('Tanggal pernikahan')}
            </span>
            <DateInput
              id="wedding-start"
              {...register('start', {
                onChange: (e) => setValue('end', e.target.value),
              })}
              empty={!start}
            />
          </label>
          <label>
            <span>{t('Jam mulai')}</span>
            <input
              type="time"
              id="wedding-startTime"
              {...register('startTime')}
            />
          </label>
          <label>
            <span>{t('Jam selesai')}</span>
            <input type="time" id="wedding-endTime" {...register('endTime')} />
          </label>
        </div>
      )}
      <div className="venue-search-bottom">
        <p>
          {t(
            'Kapasitas duduk dan berdiri dihitung terpisah. Ketersediaan final dikonfirmasi PIC.',
          )}
        </p>
        <Button type="submit" disabled={isSubmitting}>
          <Search />
          {t(onApply ? 'Perbarui rencana' : 'Cari venue pernikahan')}
        </Button>
      </div>
    </form>
  );
}
