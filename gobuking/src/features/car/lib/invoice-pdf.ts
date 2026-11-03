import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Translator } from '@/lib/i18n/translate';
import type { Locale } from '@/lib/i18n/config';
import { formatRupiah } from '@/lib/utils';
import { carAreaLabel, CAR_ZONE } from './config';
import { canDownloadCarInvoice } from './booking-adapter';
import type { CarBooking } from './types';
export async function createCarInvoicePdf(
  booking: CarBooking,
  locale: Locale,
  t: Translator,
): Promise<Uint8Array<ArrayBuffer>> {
  if (!canDownloadCarInvoice(booking))
    throw new Error(
      t(
        'Invoice tersedia setelah pembayaran berhasil dan reservasi terkonfirmasi.',
      ),
    );
  await document.fonts.ready;
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica),
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]),
    y = 795;
  const ink = rgb(0.09, 0.14, 0.32);
  async function text(value: string, size = 11, strong = false) {
    const font = strong ? bold : regular;
    if (y < 55) {
      page = pdf.addPage([595, 842]);
      y = 790;
    }
    const words = value.replace(/[\r\n\t]/g, ' ').split(' ');
    let line = '';
    const draw = async (s: string) => {
      try {
        font.encodeText(s);
        page.drawText(s, { x: 42, y, size, font, color: ink });
      } catch {
        const canvas = document.createElement('canvas');
        const measure = canvas.getContext('2d')!;
        measure.font = `${strong ? 700 : 400} ${size * 3}px "Plus Jakarta Sans",sans-serif`;
        canvas.width = Math.ceil(measure.measureText(s).width + 12);
        canvas.height = Math.ceil(size * 5);
        const context = canvas.getContext('2d')!;
        context.font = `${strong ? 700 : 400} ${size * 3}px "Plus Jakarta Sans",sans-serif`;
        context.fillStyle = '#172554';
        context.fillText(s, 2, size * 3.4);
        const image = await pdf.embedPng(canvas.toDataURL('image/png'));
        page.drawImage(image, {
          x: 42,
          y: y - size * 0.3,
          width: canvas.width / 3,
          height: canvas.height / 3,
        });
      }
      y -= size * 1.7;
    };
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > Math.floor((90 * 11) / size) && line) {
        await draw(line);
        line = word;
      } else line = next;
    }
    if (line) await draw(line);
  }
  pdf.setTitle(`${t('Invoice booking/reservasi')} ${booking.id}`);
  pdf.setAuthor('Gobuking Demo');
  await text('gobuking.', 25, true);
  await text(t('Invoice booking/reservasi'), 18, true);
  await text(t('DEMO LOKAL - Bukan bukti transaksi nyata'), 10);
  await text(booking.invoice!.number, 10);
  y -= 15;
  for (const line of [
    booking.contact.name,
    booking.contact.email,
    `${t('Penyewa')}: ${booking.renter.name}`,
    `${t('Penyedia rental')}: ${booking.offer.providerName}`,
    `${booking.offer.name} - ${t(booking.offer.mode === 'driver' ? 'Dengan pengemudi' : 'Tanpa pengemudi')}`,
    `${booking.query.start} ${booking.query.startTime} - ${booking.query.end} ${booking.query.endTime} (${CAR_ZONE(booking.query.locationId)})`,
    `${t('Area pengambilan')}: ${t(carAreaLabel(booking.query.pickupArea))}`,
    `${t('Titik temu')}: ${booking.renter.pickupDetail}`,
  ])
    await text(line);
  y -= 14;
  await text(t('Rincian pembayaran'), 14, true);
  for (const [label, amount] of [
    ['Sewa kendaraan & paket', booking.quote.base],
    ['Pengantaran / pengambilan', booking.quote.deliveryFee],
    ['Biaya layanan', booking.quote.serviceFee],
    ['Pajak', booking.quote.tax],
  ] as const)
    await text(`${t(label)}: ${formatRupiah(amount, locale)}`);
  await text(
    `${t('Total dibayar')}: ${formatRupiah(booking.quote.total, locale)}`,
    16,
    true,
  );
  await text(
    `${t('Metode pembayaran')}: ${booking.paymentMethod === 'qris' ? 'QRIS' : 'Virtual Account'}`,
  );
  await text(
    `${t('Deposit di mitra (di luar total)')}: ${formatRupiah(booking.quote.deposit, locale)}`,
  );
  y -= 12;
  await text(
    t(
      'Bawa identitas dan SIM bila lepas kunci. Konfirmasi titik temu dengan mitra. Overtime atau biaya tambahan membutuhkan kesepakatan terpisah.',
    ),
  );
  await text(
    t(
      'Invoice dan informasi reservasi ini adalah simulasi lokal. Email tidak benar-benar dikirim.',
    ),
    9,
  );
  return new Uint8Array(await pdf.save());
}
