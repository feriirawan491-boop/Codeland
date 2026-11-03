'use client';
import {
  Download,
  FileText,
  LoaderCircle,
  Mail,
  RefreshCw,
  Paperclip,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import { invoiceFilename } from '../lib/invoice';
import type { DemoBooking } from '../lib/types';
export function BookingInvoicePanel({
  booking,
  downloading,
  busy,
  onDownload,
  onResend,
}: {
  booking: DemoBooking;
  downloading: boolean;
  busy: boolean;
  onDownload: () => void;
  onResend: () => void;
}) {
  const { t, locale } = useI18n();
  const invoice = booking.invoice;
  if (!invoice) return null;
  const failed = invoice.emailStatus === 'failed';
  return (
    <section
      className="booking-invoice-panel"
      aria-labelledby="booking-invoice-heading"
    >
      <div className="invoice-ready-heading">
        <span>
          <FileText size={27} />
        </span>
        <div>
          <p>{t('DOKUMEN RESERVASI')}</p>
          <h2 id="booking-invoice-heading">{t('Invoice booking/reservasi')}</h2>
        </div>
      </div>
      <p>{t('Unduh invoice reservasi sebagai bukti pembayaran Anda.')}</p>
      <dl className="invoice-document-meta">
        <div>
          <dt>{t('Nomor invoice')}</dt>
          <dd>{invoice.number}</dd>
        </div>
        <div>
          <dt>{t('Tanggal invoice')}</dt>
          <dd>
            {new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(invoice.issuedAt))}
          </dd>
        </div>
      </dl>
      <Button
        onClick={onDownload}
        disabled={downloading || busy}
        className="invoice-download-button"
      >
        {downloading ? <LoaderCircle className="animate-spin" /> : <Download />}
        {t(
          downloading
            ? 'Menyiapkan invoice…'
            : 'Unduh invoice booking/reservasi',
        )}
        <span className="invoice-format" aria-hidden="true">
          PDF
        </span>
      </Button>
      <div className={`invoice-email-panel ${failed ? 'email-failed' : ''}`}>
        <div className="invoice-email-heading">
          <Mail size={21} />
          <div>
            <h3>{t('Pengiriman email invoice')}</h3>
            <p>{invoice.recipientEmail}</p>
          </div>
          <span className="invoice-email-badge">
            {failed ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}{' '}
            {t(failed ? 'Simulasi email gagal' : 'Simulasi email tercatat')}
          </span>
        </div>
        <p>
          {t(
            'Pengiriman email pada versi lokal ini hanya simulasi. Belum ada email sungguhan yang dikirim.',
          )}
        </p>
        <div className="invoice-email-actions">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {t('Lihat contoh email')}
              </Button>
            </DialogTrigger>
            <DialogContent className="invoice-email-preview max-h-[90dvh] overflow-y-auto">
              <DialogTitle>{t('Contoh email invoice')}</DialogTitle>
              <DialogDescription>
                {t('Pratinjau simulasi, bukan email yang sudah terkirim.')}
              </DialogDescription>
              <dl>
                <div>
                  <dt>{t('Kepada')}</dt>
                  <dd>{invoice.recipientEmail}</dd>
                </div>
                <div>
                  <dt>{t('Subjek')}</dt>
                  <dd>{t('Invoice reservasi {id}', { id: booking.id })}</dd>
                </div>
              </dl>
              <div className="invoice-email-body">
                <p>
                  {t('Halo {name},', { name: booking.contact?.name ?? '' })}
                </p>
                <p>
                  {t(
                    'Pembayaran reservasi {id} sudah dicatat dalam simulasi. Invoice booking/reservasi tersedia sebagai lampiran.',
                    { id: booking.id },
                  )}
                </p>
                <p>
                  {t(
                    'Terima kasih telah merencanakan perjalanan bersama Gobuking.',
                  )}
                </p>
              </div>
              <div className="invoice-email-attachment">
                <Paperclip size={18} />
                <span>{invoiceFilename(booking)}</span>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResend}
            disabled={busy || downloading}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
            {t('Simulasikan kirim ulang email')}
          </Button>
        </div>
      </div>
    </section>
  );
}
