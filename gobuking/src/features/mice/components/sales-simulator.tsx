'use client';
import { FlaskConical, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import type { VenueInquiry } from '@/features/venue/lib/types';
export function SalesSimulator({
  inquiry,
  busy,
  onAction,
}: {
  inquiry: VenueInquiry;
  busy: boolean;
  onAction: (
    action: Parameters<typeof inquiryAdapter.simulateSales>[1],
  ) => void;
}) {
  const { t } = useI18n();
  return (
    <details className="venue-sales-simulator">
      <summary>
        <FlaskConical size={18} />
        {t('Simulasi Venue Sales')}
      </summary>
      <p>
        {t(
          'Kontrol demo lokal untuk meninjau respons PIC. Tidak mengirim pesan ke mitra atau membuat kontrak nyata.',
        )}
      </p>
      <div>
        {(
          [
            { action: 'assign', label: 'Simulasikan klarifikasi PIC' },
            {
              action: 'quote',
              label: inquiry.quotes.length
                ? 'Kirim revisi penawaran demo'
                : 'Kirim penawaran demo',
            },
            { action: 'expire', label: 'Simulasikan quote kedaluwarsa' },
            { action: 'block', label: 'Blokir ruang bersama' },
            { action: 'unblock', label: 'Lepas blokir ruang' },
            ...(inquiry.request
              ? [
                  { action: 'review', label: 'Simulasikan tinjau permintaan' },
                  {
                    action: 'follow_up',
                    label: 'Simulasikan perlu tindak lanjut',
                  },
                  {
                    action: 'accept_contract',
                    label: 'Simulasikan lanjut kontrak',
                  },
                ]
              : []),
          ] as {
            action: Parameters<typeof inquiryAdapter.simulateSales>[1];
            label: string;
          }[]
        ).map((item) => (
          <Button
            key={item.action}
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => onAction(item.action)}
          >
            {busy && <LoaderCircle className="animate-spin" />}
            {t(item.label)}
          </Button>
        ))}
      </div>
    </details>
  );
}
