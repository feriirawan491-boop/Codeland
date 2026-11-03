'use client';
import { useI18n } from '@/components/i18n/locale-provider';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Tag } from 'lucide-react';
import { DEALS } from '../lib/content';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
export function DealTerms({ id }: { id: string }) {
  const { t } = useI18n();
  const deal = DEALS.find((d) => d.id === id)!;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="min-h-11 text-xs font-medium underline underline-offset-4 hover:no-underline">
          {t('Lihat syarat penawaran ')}
        </button>
      </DialogTrigger>
      <DialogContent>
        <span className="mb-4 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">
          {t('Penawaran contoh \u00B7 Demo ')}
        </span>
        <DialogTitle className="pr-6 text-2xl font-bold">
          {t(deal.title).replace('\n', ' ')}
        </DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-6 text-muted-foreground">
          {t(
            'Penawaran ini merupakan ilustrasi desain, belum merupakan promo yang dapat digunakan. ',
          )}
        </DialogDescription>
        <ul className="my-5 space-y-3 text-sm leading-6">
          <li>
            {t(
              '\u2022 Contoh periode: 1\u201330 November 2026, zona waktu lokasi layanan. ',
            )}
          </li>
          <li>
            •{' '}
            {deal.id === 'weekend'
              ? t(
                  'Contoh diskon 15% dari tarif dasar kamar sebelum pajak/biaya. Tidak berlaku untuk semua properti.',
                )
              : t(
                  'Harga hunian bergantung pada tanggal, kapasitas, dan biaya wajib tiap listing.',
                )}
          </li>
          <li>
            {t(
              '\u2022 Kelayakan, sumber pembiayaan, dan kuota harus berasal dari layanan promo sebelum diaktifkan. ',
            )}
          </li>
          <li>
            {t(
              '\u2022 Demo ini tidak menyediakan klaim promo atau pembayaran.',
            )}
          </li>
        </ul>
        <Button asChild className="w-full">
          <Link href={`/?service=${deal.service}#search`}>
            {t('Rencanakan perjalanan ')}
            <ArrowRight />
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
export function Deals({ standalone = false }: { standalone?: boolean }) {
  const { t } = useI18n();
  return (
    <section
      className={standalone ? '' : 'page-container section-space'}
      id="deals"
    >
      {!standalone && (
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('PENAWARAN UNTUK ANDA')}</p>
            <h2>{t('Liburan lebih dekat dari yang Anda kira.')}</h2>
            <p>
              {t(
                'Inspirasi promo dan pilihan menarik untuk rencana berikutnya.',
              )}
            </p>
          </div>
          <Link href="/offers" className="section-link">
            {t('Lihat semua ')}
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {DEALS.map((deal, i) => (
          <article key={deal.id} className={`deal-card ${deal.style}`}>
            <div className="deal-copy">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-current/15 bg-white/60 px-2.5 py-1 text-xs font-semibold">
                <Tag size={11} />
                {t(deal.tag)}
                {t(' \u00B7 Demo ')}
              </span>
              <h3 className="mt-5 whitespace-pre-line text-[26px] font-bold leading-[1.25] tracking-[-0.8px]">
                {t(deal.title)}
              </h3>
              <p className="mb-2 mt-3 max-w-xs text-xs leading-6">
                {t(deal.description)}
              </p>
              <DealTerms id={deal.id} />
            </div>
            <div className="deal-photo">
              <Image
                src={`/images/${i === 0 ? 'hotel' : 'villa'}.jpg`}
                alt={
                  i === 0
                    ? t('Ilustrasi resort dengan kolam renang')
                    : t('Ilustrasi villa pribadi')
                }
                fill
                sizes="(max-width: 767px) 30vw, 18vw"
                className="object-cover"
              />
            </div>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {t(
          'Seluruh penawaran di atas adalah contoh untuk review UI, belum dapat diklaim. ',
        )}
      </p>
    </section>
  );
}
