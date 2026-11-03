'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
const TYPES = [
  {
    label: 'Hotel',
    description: 'Nyaman untuk setiap perjalanan',
    image: 'room',
    service: 'hotel',
  },
  {
    label: 'Villa',
    description: 'Ruang lebih, waktu bersama',
    image: 'villa',
    service: 'home',
  },
  {
    label: 'Resort',
    description: 'Rehat dengan suasana berbeda',
    image: 'hotel',
    service: 'hotel',
  },
  {
    label: 'Venue acara',
    description: 'Tempat untuk momen berarti',
    image: 'venue',
    service: 'wedding',
  },
];
export function BrowseTypes() {
  const { t } = useI18n();
  return (
    <section
      className="page-container section-space"
      aria-labelledby="browse-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t('SESUAIKAN DENGAN GAYA ANDA')}</p>
          <h2 id="browse-title">{t('Anda ingin menginap di mana?')}</h2>
          <p>
            {t(
              'Pilih suasana yang pas. Mulai dari hotel di kota hingga villa untuk bersama.',
            )}
          </p>
        </div>
      </div>
      <div className="property-types">
        {TYPES.map((type) => (
          <Link
            key={type.label}
            href={`/?service=${type.service}#search`}
            className="property-type group"
          >
            <div className="property-type-image">
              <Image
                src={`/images/${type.image}.jpg`}
                alt={t('Ilustrasi {0}', { '0': t(type.label) })}
                fill
                sizes="(max-width: 767px) 45vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span>
                <ArrowUpRight size={18} />
              </span>
            </div>
            <h3>{t(type.label)}</h3>
            <p>{t(type.description)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
