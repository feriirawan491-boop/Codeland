import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type RGB,
} from 'pdf-lib';
import type { Locale } from '@/lib/i18n/config';
import type { Translator } from '@/lib/i18n/translate';
import { formatRupiah } from '@/lib/utils';
import {
  BOOKING_LABELS,
  PAYMENT_LABELS,
  REFUND_LABELS,
} from './booking-labels';
import { canDownloadBookingInvoice } from './invoice';
import type { ReservationPresentation } from '@/features/booking/lib/presentation';
import type { DemoBooking } from './types';
/** Browser-only PDF renderer, loaded dynamically when the customer downloads an invoice. */
export async function createBookingInvoicePdf(
  booking: DemoBooking,
  hotel: ReservationPresentation,
  locale: Locale,
  t: Translator,
): Promise<Uint8Array<ArrayBuffer>> {
  if (
    !canDownloadBookingInvoice(booking) ||
    !booking.invoice ||
    !booking.contact
  )
    throw new Error(
      t(
        'Invoice tersedia setelah pembayaran berhasil dan reservasi terkonfirmasi.',
      ),
    );
  await document.fonts.ready;
  const invoice = booking.invoice;
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.09, 0.14, 0.32),
    blue = rgb(0.14, 0.35, 0.92),
    muted = rgb(0.36, 0.41, 0.49),
    line = rgb(0.89, 0.91, 0.94),
    white = rgb(1, 1, 1);
  const width = 595.28,
    height = 841.89,
    margin = 42,
    content = width - margin * 2;
  function newPage() {
    const next = pdf.addPage([width, height]);
    next.drawRectangle({ x: 0, y: 0, width, height, color: white });
    return next;
  }
  let page = newPage();
  let y = height - 45;
  pdf.setTitle(`${t('Invoice booking/reservasi')} ${booking.id}`);
  pdf.setAuthor('Gobuking · Demo');
  pdf.setSubject(t('Bukti pembayaran dan reservasi demo'));
  pdf.setCreationDate(new Date(invoice.issuedAt));
  // Preserve non-Latin customer names with a canvas fallback instead of dropping characters.
  function canvasMeasure(value: string, size: number, isBold: boolean) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error(t('Invoice belum dapat diunduh. Silakan coba lagi.'));
    context.font = `${isBold ? 700 : 400} ${size}px "Plus Jakarta Sans", sans-serif`;
    return context.measureText(value).width;
  }
  function measure(
    value: string,
    size: number,
    font: PDFFont,
    isBold: boolean,
  ) {
    try {
      return font.widthOfTextAtSize(value, size);
    } catch {
      return canvasMeasure(value, size, isBold);
    }
  }
  async function text(
    value: string,
    x: number,
    baseline: number,
    size = 10,
    isBold = false,
    color: RGB = navy,
  ) {
    const font = isBold ? bold : regular;
    const clean = value.replace(/[\r\n\t]/g, ' ');
    try {
      font.encodeText(clean);
      page.drawText(clean, { x, y: baseline, size, font, color });
    } catch {
      const measured = canvasMeasure(clean, size, isBold);
      const canvas = document.createElement('canvas');
      const scale = 3;
      canvas.width = Math.ceil(measured * scale + 8);
      canvas.height = Math.ceil(size * 1.7 * scale);
      const context = canvas.getContext('2d');
      if (!context)
        throw new Error(t('Invoice belum dapat diunduh. Silakan coba lagi.'));
      context.scale(scale, scale);
      context.font = `${isBold ? 700 : 400} ${size}px "Plus Jakarta Sans", sans-serif`;
      context.fillStyle = `rgb(${Math.round(color.red * 255)},${Math.round(color.green * 255)},${Math.round(color.blue * 255)})`;
      context.textBaseline = 'alphabetic';
      context.fillText(clean, 1, size * 1.15);
      const image = await pdf.embedPng(canvas.toDataURL('image/png'));
      page.drawImage(image, {
        x,
        y: baseline - size * 0.55,
        width: canvas.width / scale,
        height: canvas.height / scale,
      });
    }
  }
  function wrap(value: string, maxWidth: number, size = 10, isBold = false) {
    const font = isBold ? bold : regular;
    const lines: string[] = [];
    let current = '';
    for (const char of value.replace(/[\r\n\t]/g, ' ')) {
      if (current && measure(current + char, size, font, isBold) > maxWidth) {
        lines.push(current.trimEnd());
        current = char.trimStart();
      } else current += char;
    }
    if (current) lines.push(current);
    return lines.length ? lines : ['—'];
  }
  async function ensure(space: number) {
    if (y - space < 65) {
      page = newPage();
      y = height - 45;
      await text('gobuking.', margin, y, 20, true, blue);
      await text(invoice.number, width - 250, y, 9, true, muted);
      y -= 36;
    }
  }
  async function section(label: string) {
    await ensure(50);
    y -= 12;
    await text(label, margin, y, 12, true);
    y -= 11;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: line,
    });
    y -= 16;
  }
  async function row(label: string, value: string) {
    const values = wrap(value, content - 155, 10);
    await ensure(Math.max(24, values.length * 15 + 9));
    await text(label, margin, y, 9, false, muted);
    for (const valueLine of values) {
      await text(valueLine, margin + 155, y, 10);
      y -= 15;
    }
    y -= 5;
  }
  function date(value: string | null, withTime = false) {
    return value
      ? new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          ...(withTime
            ? { hour: '2-digit', minute: '2-digit', timeZone: hotel.zone }
            : { timeZone: hotel.zone }),
        }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value))
      : t('Belum tercatat');
  }
  await text('gobuking.', margin, y, 25, true, blue);
  await text(t('LUNAS · DEMO'), width - 148, y + 2, 11, true, blue);
  y -= 40;
  await text(t('Invoice booking/reservasi'), margin, y, 22, true);
  y -= 22;
  await text(invoice.number, margin, y, 10, true, muted);
  y -= 20;
  await text(
    `${t('Tanggal invoice')}: ${date(invoice.issuedAt, true)} · ${hotel.zone}`,
    margin,
    y,
    9,
    false,
    muted,
  );
  y -= 18;
  await section(t('Detail reservasi'));
  await row(t('Nomor reservasi'), booking.id);
  await row(t('Properti'), hotel.name);
  await row(t('Lokasi properti'), t(hotel.address));
  await row(
    t(booking.home ? 'Hunian & tarif' : 'Kamar & tarif'),
    `${t(hotel.selectionLabel)} · ${t(hotel.rateLabel)}`,
  );
  await row(
    t('Tanggal menginap'),
    `${date(booking.query.start)} - ${date(booking.query.end)}`,
  );
  await row(
    t(booking.home ? 'Durasi & jumlah hunian' : 'Durasi & jumlah kamar'),
    t(
      booking.home
        ? '{nights} malam × 1 hunian'
        : '{nights} malam × {rooms} kamar',
      {
        nights: booking.quote.nights,
        rooms: booking.quote.quantity,
      },
    ),
  );
  await row(
    t('Jumlah tamu'),
    String(booking.query.adults + booking.query.children),
  );
  await section(t('Data pemesan'));
  await row(t('Nama lengkap pemesan'), booking.contact.name);
  await row(t('Email pemesan'), booking.contact.email);
  await row(
    t('Nama tamu utama'),
    booking.contact.guestName || t('Tidak tercatat pada pesanan lama'),
  );
  await section(t('Rincian pembayaran'));
  await row(t('Biaya menginap'), formatRupiah(booking.quote.base, locale));
  if (booking.quote.cleaningFee)
    await row(
      t('Biaya kebersihan · per kunjungan'),
      formatRupiah(booking.quote.cleaningFee, locale),
    );
  for (const extra of booking.quote.extras ?? [])
    await row(t(extra.label), formatRupiah(extra.total, locale));
  await row(t('Pajak'), formatRupiah(booking.quote.tax, locale));
  await row(t('Biaya layanan'), formatRupiah(booking.quote.serviceFee, locale));
  y -= 12;
  await ensure(80);
  page.drawRectangle({
    x: margin,
    y: y - 28,
    width: content,
    height: 45,
    color: navy,
  });
  await text(t('Total dibayar'), margin + 14, y - 10, 12, true, white);
  const total = formatRupiah(booking.quote.total, locale);
  await text(
    total,
    width - margin - 14 - measure(total, 15, bold, true),
    y - 10,
    15,
    true,
    white,
  );
  y -= 55;
  await row(
    t('Metode pembayaran'),
    t(booking.paymentMethod === 'qris' ? 'QRIS demo' : 'Virtual Account demo'),
  );
  await row(t('Waktu pembayaran'), date(invoice.paidAt, true));
  await row(t('Status pembayaran'), t(PAYMENT_LABELS[booking.paymentStatus]));
  await row(t('Status reservasi'), t(BOOKING_LABELS[booking.bookingStatus]));
  await row(t('Status refund'), t(REFUND_LABELS[booking.refundStatus]));
  if (booking.refundAmount > 0)
    await row(
      t('Nilai refund demo'),
      formatRupiah(booking.refundAmount, locale),
    );
  if (booking.home?.deposit.amount) {
    await section(t('Deposit terpisah'));
    await row(
      t('Dibayar ke pengelola'),
      `${booking.home.deposit.recipient} · ${formatRupiah(booking.home.deposit.amount, locale)}`,
    );
    await row(
      t('Ketentuan deposit'),
      t('Tidak termasuk total pembayaran online.'),
    );
  }
  await ensure(45);
  y -= 10;
  for (const note of wrap(
    t('Dokumen simulasi lokal. Bukan bukti transaksi nyata atau faktur pajak.'),
    content,
    9,
  )) {
    await text(note, margin, y, 9, false, muted);
    y -= 14;
  }
  const pages = pdf.getPages();
  for (let index = 0; index < pages.length; index++) {
    pages[index].drawLine({
      start: { x: margin, y: 43 },
      end: { x: width - margin, y: 43 },
      color: line,
      thickness: 1,
    });
    pages[index].drawText(`Gobuking · DEMO | ${index + 1}/${pages.length}`, {
      x: margin,
      y: 27,
      size: 8,
      font: regular,
      color: muted,
    });
  }
  return new Uint8Array(await pdf.save());
}
