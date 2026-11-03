'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MapPin } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { getHotelFacilities, type FacilityStatus } from '../lib/facilities';
import { AMENITY_LABELS } from '../lib/query';
import type { Hotel } from '../lib/types';
import { AMENITY_ICONS, FacilityIcon } from './facility-icon';
const STATUS_LABELS: Record<FacilityStatus, string> = {
  included: 'Termasuk',
  extra: 'Biaya tambahan',
  rate: 'Sesuai tarif',
  request: 'Atas permintaan',
};
export function HotelFacilities({
  hotel,
  mapHref,
}: {
  hotel: Hotel;
  mapHref: string;
}) {
  const { t } = useI18n();
  const groups = getHotelFacilities(hotel);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(['room', 'bathroom']),
  );
  const allExpanded = groups.every((group) => expanded.has(group.id));
  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  return (
    <section
      id="facilities"
      className="hotel-detail-section hotel-facilities-section"
    >
      <div className="facility-section-heading">
        <div>
          <h2>{t('Fasilitas yang bisa Anda nikmati')}</h2>
        </div>
      </div>
      <div className="facility-highlights" aria-label={t('Fasilitas unggulan')}>
        {hotel.amenities.map((amenity) => (
          <div key={amenity}>
            <span className="facility-highlight-icon">
              <FacilityIcon name={AMENITY_ICONS[amenity]} size={25} />
            </span>
            <span>{t(AMENITY_LABELS[amenity])}</span>
          </div>
        ))}
      </div>
      <div className="facility-detail-heading">
        <div>
          <h3>{t('Detail fasilitas & layanan')}</h3>
        </div>
        <button
          type="button"
          onClick={() =>
            setExpanded(
              allExpanded ? new Set() : new Set(groups.map((g) => g.id)),
            )
          }
        >
          {t(allExpanded ? 'Tutup semua detail' : 'Buka semua detail')}
          <ChevronDown
            size={16}
            className={allExpanded ? 'is-open' : ''}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="facility-group-grid">
        {groups.map((group) => {
          const open = expanded.has(group.id);
          return (
            <article
              className={`facility-group ${open ? 'is-open' : ''}`}
              key={group.id}
            >
              <h4>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`facility-group-${group.id}`}
                  onClick={() => toggle(group.id)}
                >
                  <span className="facility-group-icon">
                    <FacilityIcon name={group.icon} size={22} />
                  </span>
                  <span>
                    <strong>{t(group.title)}</strong>
                  </span>
                  <ChevronDown
                    size={18}
                    className="facility-chevron"
                    aria-hidden="true"
                  />
                </button>
              </h4>
              <div id={`facility-group-${group.id}`} hidden={!open}>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.title}>
                      <FacilityIcon name={item.icon} size={19} />
                      <div>
                        <div className="facility-item-heading">
                          <h5>{t(item.title)}</h5>
                          <span
                            className={`facility-status facility-status-${item.status}`}
                          >
                            {t(STATUS_LABELS[item.status])}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
      <div className="facility-location">
        <span className="facility-location-icon">
          <MapPin size={21} aria-hidden="true" />
        </span>
        <div>
          <strong>{t('Lokasi properti')}</strong>
          <p>
            {t(hotel.address)} <span>· {hotel.zone}</span>
          </p>
        </div>
        <Link href={mapHref}>
          {t('Lihat di peta')}
          <MapPin size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
