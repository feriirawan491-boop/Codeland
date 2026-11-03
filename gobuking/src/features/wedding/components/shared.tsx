'use client';
import {
  Heart,
  Info,
  CalendarDays,
  UsersRound,
  MapPin,
  Clock3,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { LOCATIONS } from '@/features/home/lib/search';
import type { EventQuery, VenuePackage } from '@/features/venue/lib/types';
import type { WeddingRequirements } from '@/features/venue/lib/wedding-types';
import { formatRupiah } from '@/lib/utils';
export function WeddingNotice() {
  const { t } = useI18n();
  return (
    <div className="wedding-demo">
      <Heart size={17} />
      <p>
        {t(
          'Demo Phase 06 · Venue, paket, verifikasi, site visit, dan respons mitra merupakan simulasi lokal.',
        )}
      </p>
    </div>
  );
}
export function WeddingScope() {
  const { t } = useI18n();
  return (
    <div className="venue-inquiry-notice wedding-scope">
      <Info size={21} />
      <div>
        <strong>
          {t('Awali dengan rencana, lanjutkan dengan kesepakatan')}
        </strong>
        <p>
          {t(
            'Inquiry, site visit, dan permintaan booking belum mengunci tanggal. Tidak ada DP, pembayaran, atau reservasi otomatis.',
          )}
        </p>
      </div>
    </div>
  );
}
export function WeddingSummary({
  query,
  zone,
}: {
  query: EventQuery;
  zone?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="venue-event-summary">
      <span>
        <MapPin size={16} />
        {LOCATIONS.find((l) => l.id === query.locationId)?.label ??
          query.locationId}
      </span>
      <span>
        <CalendarDays size={16} />
        {query.flexible
          ? t('Tanggal fleksibel')
          : `${query.start}, ${query.startTime}–${query.endTime}`}
        {zone ? ` · ${zone}` : ''}
      </span>
      <span>
        <UsersRound size={16} />
        {t('{count} tamu', { count: query.participants })} ·{' '}
        {t(query.layout === 'standing' ? 'Berdiri' : 'Duduk')}
      </span>
    </div>
  );
}
export function WeddingNeedsSummary({ needs }: { needs: WeddingRequirements }) {
  const { t } = useI18n();
  return (
    <section className="wedding-needs-summary">
      <h3>{t('Rencana pernikahan')}</h3>
      <dl>
        <div>
          <dt>{t('Jenis perayaan')}</dt>
          <dd>
            {t(
              needs.ceremony === 'both'
                ? 'Seremoni & resepsi'
                : needs.ceremony === 'ceremony'
                  ? 'Seremoni'
                  : 'Resepsi',
            )}
          </dd>
        </div>
        <div>
          <dt>{t('Tanggal alternatif')}</dt>
          <dd>
            {needs.alternativeDates.length
              ? needs.alternativeDates.join(' · ')
              : t('Belum ditentukan')}
          </dd>
        </div>
        <div>
          <dt>{t('Rencana site visit')}</dt>
          <dd>
            {needs.siteVisit
              ? t('Diminta, menunggu konfirmasi PIC')
              : t('Belum diminta')}
            {needs.siteVisit && needs.siteVisitDate
              ? ` · ${needs.siteVisitDate}`
              : ''}
          </dd>
        </div>
        <div>
          <dt>{t('Dekorasi tambahan')}</dt>
          <dd>
            {t(needs.decoration ? 'Dibahas dengan PIC' : 'Tidak diminta')}
          </dd>
        </div>
      </dl>
      {needs.siteVisit && (
        <p className="venue-inline-note">
          <Info size={16} />
          {t(
            'Site visit dicatat sebagai permintaan tindak lanjut, bukan appointment yang dijamin.',
          )}
        </p>
      )}
    </section>
  );
}
export function WeddingPackageScope({ pack }: { pack: VenuePackage }) {
  const { t, locale } = useI18n();
  if (!pack.wedding) return null;
  return (
    <div className="wedding-package-scope">
      <span>
        {t('Katering')}:{' '}
        <strong>
          {t(
            pack.wedding.catering === null
              ? 'Perlu konfirmasi'
              : pack.wedding.catering
                ? 'Termasuk'
                : 'Tidak termasuk',
          )}
        </strong>
      </span>
      <span>
        {t('Dekorasi')}:{' '}
        <strong>
          {t(
            pack.wedding.decoration === null
              ? 'Perlu konfirmasi'
              : pack.wedding.decoration
                ? 'Termasuk'
                : 'Tidak termasuk',
          )}
        </strong>
      </span>
      <span>
        <Clock3 size={15} />
        {t('Overtime')}:{' '}
        <strong>
          {pack.wedding.overtime === null
            ? t('Minta rincian')
            : `${formatRupiah(pack.wedding.overtime, locale)} / ${t('jam')}`}
        </strong>
      </span>
      <p>{t(pack.wedding.overtimePolicy)}</p>
    </div>
  );
}
