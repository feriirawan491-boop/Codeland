'use client';
import { WeddingPackageScope } from '@/features/wedding/components/shared';
import { Info, ShieldCheck, Clock3 } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatRupiah } from '@/lib/utils';
import { QUOTE_STATUS_LABELS } from '@/features/venue/lib/config';
import type { VenueInquiry, VenueQuote } from '@/features/venue/lib/types';
import { EventSummary, useVenueClock } from './shared';
export function QuoteVersionPanel({
  inquiry,
  quote,
  onSelect,
}: {
  inquiry: VenueInquiry;
  quote: VenueQuote | undefined;
  onSelect: (version: number) => void;
}) {
  const { t, locale } = useI18n();
  const now = useVenueClock();
  const latest = inquiry.quotes.at(-1);
  const previous = quote
    ? inquiry.quotes.find((value) => value.version === quote.version - 1)
    : undefined;
  if (!quote)
    return (
      <section className="venue-no-quote">
        <Clock3 size={27} />
        <h2>{t('Menunggu penawaran dari PIC')}</h2>
        <p>
          {t(
            'PIC akan meninjau kebutuhan acara sebelum mengirim penawaran. Pada demo, gunakan simulasi Venue Sales di bawah.',
          )}
        </p>
      </section>
    );
  const superseded =
    latest?.version !== quote.version || quote.status === 'superseded';
  const expired =
    quote.status === 'expired' || Date.parse(quote.validUntil) <= now;
  return (
    <section className="venue-quote-panel">
      <div className="venue-section-title">
        <div>
          <p className="venue-kicker">{t('PENAWARAN UNTUK ACARA ANDA')}</p>
          <h2>{t('Penawaran versi {version}', { version: quote.version })}</h2>
        </div>
        <label>
          <span className="sr-only">{t('Versi penawaran')}</span>
          <select
            aria-label={t('Versi penawaran')}
            value={quote.version}
            onChange={(e) => onSelect(Number(e.target.value))}
          >
            {inquiry.quotes.map((q) => (
              <option key={q.id} value={q.version}>
                v{q.version} · {t(QUOTE_STATUS_LABELS[q.status])}
              </option>
            ))}
          </select>
        </label>
      </div>
      {superseded && (
        <div className="venue-version-warning" role="status">
          <Info size={20} />
          <div>
            <strong>{t('Versi ini sudah digantikan')}</strong>
            <p>
              {t(
                'Penawaran lama hanya dapat dibaca. Gunakan versi terbaru untuk mengajukan permintaan.',
              )}
            </p>
            <button type="button" onClick={() => onSelect(latest!.version)}>
              {t('Tinjau versi {version}', { version: latest!.version })}
            </button>
          </div>
        </div>
      )}
      {expired && (
        <p className="venue-expired" role="status">
          <Clock3 size={18} />
          {t('Penawaran kedaluwarsa. Minta PIC memvalidasi ulang.')}
        </p>
      )}
      {inquiry.service === 'wedding' && previous && quote && (
        <div className="venue-version-warning">
          <Info size={20} />
          <div>
            <strong>
              {t('Perbandingan dengan versi {version}', {
                version: previous.version,
              })}
            </strong>
            <p>
              {t('Total sebelumnya {before}; versi ini {after}.', {
                before: formatRupiah(previous.total, locale),
                after: formatRupiah(quote.total, locale),
              })}
            </p>
            <p>
              {t(
                JSON.stringify(previous.event) === JSON.stringify(quote.event)
                  ? 'Tanggal, jam, format, dan jumlah tamu tetap.'
                  : 'Tanggal, jam, format, atau jumlah tamu telah berubah. Tinjau ringkasan versi ini.',
              )}
            </p>
            <p>
              {t(
                previous.packageName === quote.packageName
                  ? 'Paket pilihan tetap; baca kembali isi dan ketentuannya.'
                  : 'Paket pilihan berubah; tinjau isi dan pengecualiannya.',
              )}
            </p>
          </div>
        </div>
      )}
      <div className="venue-quote-context">
        <strong>{quote.spaceName}</strong>
        <span>
          {quote.venueName} · {t(quote.packageName)}
        </span>
        <EventSummary
          query={quote.event}
          zone={inquiry.zone}
          service={inquiry.service}
        />
      </div>
      {quote.packageSnapshot?.wedding && (
        <WeddingPackageScope pack={quote.packageSnapshot} />
      )}
      <dl className="venue-quote-lines">
        {quote.lines.map((line) => (
          <div key={line.label}>
            <dt>{t(line.label)}</dt>
            <dd>{formatRupiah(line.amount, locale)}</dd>
          </div>
        ))}
        <div className="total">
          <dt>{t('Total penawaran')}</dt>
          <dd>{formatRupiah(quote.total, locale)}</dd>
        </div>
      </dl>
      <p className="venue-valid-until">
        {t('Berlaku hingga {time}', {
          time: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: inquiry.zone,
          }).format(new Date(quote.validUntil)),
        })}{' '}
        · {inquiry.zone}
      </p>
      <ul className="venue-quote-terms">
        {quote.terms.map((term) => (
          <li key={term}>
            <ShieldCheck size={17} />
            <span>{t(term)}</span>
          </li>
        ))}
      </ul>
      <small className="venue-reference-code">{quote.id}</small>
    </section>
  );
}
