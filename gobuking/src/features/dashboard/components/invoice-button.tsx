'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { getMyBooking } from '../lib/bookings';
import { requireDashboardAccount, assertSameAccount } from '../lib/store';
import { errorMessage, FormError } from './shared';
export function DashboardInvoice({ id }: { id: string }) {
  const { locale, t } = useI18n(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <div>
      <button
        className="usr-button secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            const account = requireDashboardAccount();
            const source = await getMyBooking(id);
            const bytes =
              source.kind === 'stay'
                ? await (
                    await import('@/features/hotel/lib/invoice-pdf')
                  ).createBookingInvoicePdf(
                    source.value,
                    source.presentation,
                    locale,
                    t,
                  )
                : await (
                    await import('@/features/car/lib/invoice-pdf')
                  ).createCarInvoicePdf(source.value, locale, t);
            assertSameAccount(account.id);
            const url = URL.createObjectURL(
              new Blob([bytes], { type: 'application/pdf' }),
            );
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${id}.pdf`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Download size={16} />
        {t(busy ? 'Menyiapkan invoice…' : 'Unduh invoice booking/reservasi')}
      </button>
      <FormError message={error} />
    </div>
  );
}
