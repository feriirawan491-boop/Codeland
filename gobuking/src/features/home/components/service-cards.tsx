'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  BedDouble,
  CarFront,
  Heart,
  House,
  Plane,
  Presentation,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { SERVICES } from '@/lib/constants';
import { localDate } from '../lib/search';

const SERVICE_DETAILS = {
  hotel: {
    description: 'Bandingkan hotel dan resort untuk perjalanan Anda.',
    image: '/images/hotel.jpg',
    icon: BedDouble,
  },
  home: {
    description: 'Lihat villa, rumah, dan apartemen untuk menginap.',
    image: '/images/villa.jpg',
    icon: House,
  },
  flight: {
    description: 'Jelajahi jadwal dan tarif penerbangan demo.',
    image: '/images/flight-demo.svg',
    icon: Plane,
  },
  mice: {
    description: 'Temukan ruang meeting dan acara sesuai kebutuhan.',
    image: '/images/mice-conference.jpg',
    icon: Presentation,
  },
  wedding: {
    description: 'Jelajahi venue untuk hari yang istimewa.',
    image: '/images/wedding-garden.jpg',
    icon: Heart,
  },
  car: {
    description: 'Pilih mobil dengan sopir atau lepas kunci.',
    image: '/images/car-city.jpg',
    icon: CarFront,
  },
} as const;

function serviceHref(service: (typeof SERVICES)[number]) {
  const start = localDate(new Date(Date.now() + 7 * 86400000));
  const nextDay = localDate(new Date(Date.now() + 8 * 86400000));

  switch (service.id) {
    case 'hotel':
    case 'home':
      return `${service.path}?locationId=bali`;
    case 'flight':
      return `/flights?locationId=CGK&destinationId=DPS&start=${start}&trip=oneway&adults=2&children=0&infants=0&cabin=economy`;
    case 'mice':
      return '/mice?locationId=bali&flexible=true&participants=50&layout=theater';
    case 'wedding':
      return '/wedding?locationId=bali&flexible=true&participants=100&layout=banquet';
    case 'car':
      return `/cars?locationId=bali&pickupArea=central&returnArea=central&start=${start}&end=${nextDay}&startTime=09%3A00&endTime=10%3A00&mode=self`;
  }
}

export function ServiceCards() {
  const { t } = useI18n();

  return (
    <section
      className="page-container section-space service-cards-section"
      aria-labelledby="service-cards-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t('SEMUA YANG ANDA BUTUHKAN')}</p>
          <h2 id="service-cards-title">{t('Jelajahi layanan Gobuking')}</h2>
          <p>
            {t(
              'Pilih layanan untuk langsung melihat pilihan demo, tanpa mengisi pencarian.',
            )}
          </p>
        </div>
      </div>
      <div className="service-cards-grid">
        {SERVICES.map((service) => {
          const details = SERVICE_DETAILS[service.id];
          const Icon = details.icon;

          return (
            <Link
              key={service.id}
              href={serviceHref(service)}
              className="service-card group"
            >
              <div className="service-card-image">
                <Image
                  src={details.image}
                  alt=""
                  fill
                  sizes="(max-width: 639px) 90vw, (max-width: 1023px) 45vw, 30vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="service-card-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span className="service-card-arrow" aria-hidden="true">
                  <ArrowUpRight size={19} />
                </span>
              </div>
              <div className="service-card-copy">
                <h3>{t(service.label)}</h3>
                <p>{t(details.description)}</p>
                <span>{t('Lihat pilihan demo')}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
