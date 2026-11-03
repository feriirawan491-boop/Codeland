'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import type { VenueInquiry } from '@/features/venue/lib/types';
export function ContactVerification({
  inquiry,
  onEdit,
}: {
  inquiry: VenueInquiry;
  onEdit?: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [code, setCode] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section className="venue-verification">
      <span>
        <MailCheck size={28} />
      </span>
      <h2>
        {t(
          inquiry.service === 'wedding'
            ? 'Verifikasi email kontak terlebih dahulu'
            : 'Verifikasi email PIC terlebih dahulu',
        )}
      </h2>
      <p>
        {t('Draft {id} sudah tersimpan. Inquiry belum masuk antrean aktif.', {
          id: inquiry.id,
        })}
      </p>
      <p>
        <strong>{inquiry.contact.email}</strong>
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError('');
          try {
            await inquiryAdapter.verifyInquiryContact(inquiry.id, code);
            sessionStorage.removeItem(
              `gobuking:${inquiry.service}-pending:${inquiry.spaceId}`,
            );
            router.push(
              `/account/inquiries/${inquiry.id}${inquiry.service === 'wedding' ? '?service=wedding' : ''}`,
            );
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : 'Layanan venue sedang terganggu. Silakan coba lagi.',
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label htmlFor="inquiry-otp">{t('Kode verifikasi inquiry demo')}</label>
        <input
          id="inquiry-otp"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
          required
        />
        <small>
          {t('Tidak ada email sungguhan. Gunakan kode demo 123456.')}
        </small>
        {error && (
          <p role="alert" className="field-error">
            {t(error)}
          </p>
        )}
        <Button type="submit" disabled={busy} className="w-full mt-5">
          {busy ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
          {t('Verifikasi & kirim inquiry')}
        </Button>
      </form>
      {onEdit && (
        <Button variant="ghost" className="mt-3" onClick={onEdit}>
          {t('Ubah data inquiry')}
        </Button>
      )}
    </section>
  );
}
