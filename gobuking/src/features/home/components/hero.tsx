'use client';
import { useI18n } from '@/components/i18n/locale-provider';
import Image from 'next/image';
import { ArrowUpRight, MapPin, Sparkles } from 'lucide-react';
export function Hero() {
  const { t } = useI18n();
  return (
    <section className="hero">
      <div className="page-container hero-layout">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <Sparkles size={16} />
            {t(' Waktunya menemukan tempat baru')}
          </p>
          <h1 className="hero-title">
            {t('Rencana baru.')}
            <br />
            {t('Cerita ')}
            <span>{t('lebih seru.')}</span>
          </h1>
          <p className="hero-description">
            {t('Dari hotel nyaman sampai momen istimewa.')}
            <br className="hidden sm:block" />
            {t(' Temukan semua yang Anda butuhkan untuk pergi.')}
          </p>
          <a href="#destinations" className="hero-inspiration">
            {t('Jelajahi Indonesia ')}
            <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="hero-photo">
          <Image
            src="/images/hero.jpg"
            alt={t('Pura di tepi Danau Beratan, Bali')}
            fill
            priority
            sizes="(max-width: 767px) 1px, 40vw"
            className="object-cover"
          />
          <div className="hero-photo-shade" />
          <div className="hero-photo-caption">
            <span className="hero-photo-label">
              {t('SEBUAH TEMPAT, SERIBU CERITA')}
            </span>
            <span>
              <MapPin size={16} />
              {t(' Danau Beratan, Bali')}
            </span>
          </div>
          <span className="hero-photo-stamp">
            {t('JELAJAHI')}
            <br />
            {t('INDONESIA \u2197')}
          </span>
        </div>
      </div>
    </section>
  );
}
