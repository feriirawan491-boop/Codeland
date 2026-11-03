'use client';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import { useI18n } from '@/components/i18n/locale-provider';
import { guestSchema } from '@/features/hotel/lib/booking-adapter';
export type GuestValues = z.infer<typeof guestSchema>;
export function GuestContactFields({
  form,
}: {
  form: Pick<UseFormReturn<GuestValues>, 'register' | 'formState'>;
}) {
  const { t } = useI18n();
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <>
      <div className="hotel-form-grid">
        <label className="hotel-form-field" htmlFor="guest-name">
          {t('Nama lengkap pemesan')}
          <input
            id="guest-name"
            autoComplete="name"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <span className="field-error">{t(errors.name.message)}</span>
          )}
        </label>
        <label className="hotel-form-field" htmlFor="guest-email">
          {t('Email pemesan')}
          <input
            id="guest-email"
            type="email"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <span className="field-error">{t(errors.email.message)}</span>
          )}
        </label>
        <label className="hotel-form-field" htmlFor="guest-phone">
          {t('Nomor telepon')}
          <input
            id="guest-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+62"
            {...register('phone')}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <span className="field-error">{t(errors.phone.message)}</span>
          )}
        </label>
        <label className="hotel-form-field" htmlFor="guest-guestName">
          {t('Nama tamu utama')}
          <input
            id="guest-guestName"
            {...register('guestName')}
            aria-invalid={!!errors.guestName}
          />
          {errors.guestName && (
            <span className="field-error">{t(errors.guestName.message)}</span>
          )}
        </label>
      </div>
      <label className="hotel-form-field mt-5" htmlFor="guest-notes">
        {t('Permintaan khusus (opsional)')}
        <textarea
          id="guest-notes"
          rows={3}
          maxLength={500}
          {...register('notes')}
        />
        <small>
          {t(
            'Pemenuhan permintaan khusus tidak dijamin. Maksimal 500 karakter.',
          )}
        </small>
      </label>
    </>
  );
}
