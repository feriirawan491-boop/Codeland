'use client';
import { PublicCms } from '@/features/admin/components/public-cms';
import { useI18n } from '@/components/i18n/locale-provider';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSavedListings } from '@/hooks/use-saved-listings';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Heart,
  RotateCcw,
  Compass,
  ImageOff,
  Check,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getHomepageContent,
  type HomeContent as HomeContentData,
  type Listing,
  type Scenario,
} from '../lib/content';
import { formatRupiah } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';
import { BrowseTypes } from './browse-types';
import { ListingRating } from './listing-rating';
function Photo({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="flex size-full items-center justify-center bg-slate-100 text-muted-foreground">
      <ImageOff size={28} />
      <span className="sr-only">
        {alt}
        {t(', gambar tidak tersedia')}
      </span>
    </div>
  ) : (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => setFailed(true)}
    />
  );
}
function ListingCard({
  listing,
  saved,
  onSave,
}: {
  listing: Listing;
  saved: boolean;
  onSave: () => void;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const service = SERVICES.find((s) => s.id === listing.category)!;
  return (
    <article className="listing-card group">
      <div className="relative aspect-[1.42] overflow-hidden bg-muted">
        <Photo
          src={`/images/${listing.image}.jpg`}
          alt={t('Ilustrasi {0}', { '0': t(listing.type).toLowerCase() })}
          sizes="(max-width: 767px) 90vw, (max-width: 1023px) 45vw, 25vw"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold">
          {t(listing.type)}
          {listing.hotelStars && (
            <span
              className="inline-flex items-center gap-0.5 border-l border-slate-200 pl-2"
              aria-label={t('Hotel bintang {count} · contoh', {
                count: listing.hotelStars,
              })}
              title={t('Hotel bintang {count} · contoh', {
                count: listing.hotelStars,
              })}
            >
              <Star
                size={12}
                className="fill-amber-400 text-amber-600"
                aria-hidden="true"
              />
              {listing.hotelStars}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onSave}
          aria-label={t(saved ? 'Hapus {0} dari tersimpan' : 'Simpan {0}', {
            '0': listing.name,
          })}
          aria-pressed={saved}
          className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm transition-colors hover:bg-secondary"
        >
          <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} />
            {t(listing.area)}
          </span>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">
            {t('DEMO ')}
          </span>
        </div>
        <h3 className="text-lg font-bold tracking-[-0.3px]">
          {t(listing.name)}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {t(listing.features)}
        </p>
        <ListingRating review={listing.review} />
        <div className="my-4 h-px bg-border/60" />
        <span className="text-xs text-muted-foreground">
          {t('Contoh harga mulai dari ')}
        </span>
        <div className="mt-0.5 flex items-end justify-between">
          <div>
            <strong className="text-xl tracking-tight text-primary">
              {formatRupiah(listing.price, locale)}
            </strong>
            <span className="ml-1 text-xs text-muted-foreground">
              / {t(listing.unit)}
            </span>
          </div>
          {listing.category === 'hotel' ||
          listing.category === 'home' ||
          listing.category === 'wedding' ? (
            <Link
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-primary hover:text-white"
              href={
                listing.category === 'wedding'
                  ? '/wedding/amara-ballroom?locationId=bandung'
                  : listing.category === 'home'
                    ? '/homes/villa-nala-ubud?locationId=bali'
                    : `/hotels/${listing.name.includes('Seruni') ? 'seruni-resort-spa' : 'artha-city-hotel'}?locationId=${listing.area.includes('Bali') ? 'bali' : 'yogyakarta'}`
              }
              aria-label={t('Lihat {0}', { '0': listing.name })}
            >
              <ArrowUpRight size={19} />
            </Link>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-primary hover:text-white"
                  aria-label={t('Lihat {0}', { '0': listing.name })}
                >
                  <ArrowUpRight size={19} />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="pr-8 text-2xl font-bold">
                  {t(listing.name)}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-muted-foreground">
                  {t(listing.type)} · {t(listing.area)}
                  {t(' \u00B7 Properti contoh ')}
                </DialogDescription>
                <ListingRating review={listing.review} />
                <div className="relative my-5 aspect-video overflow-hidden rounded-xl">
                  <Photo
                    src={`/images/${listing.image}.jpg`}
                    alt={t('Foto ilustrasi properti contoh')}
                    sizes="500px"
                  />
                </div>
                <p className="text-sm leading-6">
                  {t(listing.features)}
                  {t('. Contoh harga ')}
                  {formatRupiah(listing.price, locale)} / {t(listing.unit)}
                  {t(
                    '. Harga ini hanya ilustrasi, belum merupakan penawaran atau total transaksi. ',
                  )}
                </p>
                <p className="my-4 rounded-lg bg-muted p-3 text-xs leading-5">
                  {t('Detail, ketersediaan, dan')} {t('pemesanan')}
                  {t(' akan diimplementasikan pada Phase ')}
                  {service.phase}
                  {t(
                    '. Foto tidak merepresentasikan properti nyata dengan nama ini. ',
                  )}
                </p>
                <Button asChild className="w-full">
                  <Link
                    href={`${service.path}?locationId=${listing.area.includes('Bali') ? 'bali' : listing.area.includes('Bandung') ? 'bandung' : 'yogyakarta'}`}
                  >
                    {t('Lihat rencana modul ')}
                    {t(service.label)}
                    <ArrowRight />
                  </Link>
                </Button>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </article>
  );
}
export function HomeContent() {
  const { t } = useI18n();
  const query = useSearchParams();
  const scenario =
    (['ready', 'loading', 'empty', 'error'] as const).find(
      (s) => s === query.get('scenario'),
    ) ?? 'ready';
  const [result, setResult] = useState<{
    key: string;
    data?: HomeContentData;
    error: boolean;
  }>();
  const [retry, setRetry] = useState(0);
  const { saved, update } = useSavedListings();
  const [filter, setFilter] = useState('all');
  const requestKey = `${scenario}:${retry}`;
  const loading = result?.key !== requestKey;
  const data = loading ? undefined : result?.data;
  const error = !loading && result?.error;
  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    getHomepageContent(
      (retry > 0 ? 'ready' : scenario) as Scenario,
      controller.signal,
    )
      .then((data) => {
        if (current) setResult({ key: requestKey, data, error: false });
      })
      .catch((e) => {
        if (current && e instanceof Error && e.name !== 'AbortError')
          setResult({ key: requestKey, error: true });
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [scenario, retry, requestKey]);
  function toggle(id: string) {
    const next = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];
    try {
      update(next);
      toast.success(
        t(
          saved.includes(id)
            ? 'Dihapus dari tersimpan'
            : 'Disimpan di browser ini',
        ),
        {
          description: t(
            'Properti contoh dapat Anda tinjau kembali di bagian Pilihan Gobuking.',
          ),
        },
      );
    } catch {
      toast.error(t('Belum dapat menyimpan'), {
        description: t(
          'Penyimpanan browser tidak tersedia. Coba izinkan penyimpanan situs.',
        ),
      });
    }
  }
  return (
    <>
      <PublicCms />
      <section id="destinations" className="page-container section-space">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('DEKAT ATAU JAUH, SAMA-SAMA BERARTI')}</p>
            <h2>{t('Destinasi yang selalu bikin ingin kembali.')}</h2>
            <p>
              {t(
                'Sudut-sudut Indonesia yang selalu punya cara membuat jatuh hati. ',
              )}
            </p>
          </div>
          <a href="#search" className="section-link">
            {t('Jelajahi destinasi ')}
            <ArrowRight size={16} />
          </a>
        </div>
        {loading ? (
          <div
            className="destination-grid"
            aria-busy="true"
            aria-label={t('Memuat destinasi')}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`skeleton h-[225px] rounded-xl ${i === 0 ? 'destination-wide' : ''}`}
              />
            ))}
          </div>
        ) : error ? (
          <div className="content-feedback" role="alert">
            <Compass size={30} />
            <h3>{t('Inspirasi sedang dalam perjalanan.')}</h3>
            <p>
              {t(
                'Konten belum dapat dimuat. Pencarian di atas tetap dapat digunakan. ',
              )}
            </p>
            <Button variant="outline" onClick={() => setRetry((r) => r + 1)}>
              <RotateCcw />
              {t('Coba lagi ')}
            </Button>
          </div>
        ) : !data?.destinations.length ? (
          <div className="content-feedback">
            <Compass size={30} />
            <h3>{t('Destinasi pilihan segera hadir.')}</h3>
            <p>
              {t('Gunakan pencarian untuk menentukan tujuan Anda sendiri.')}
            </p>
            <Button asChild variant="outline">
              <a href="#search">{t('Mulai pencarian')}</a>
            </Button>
          </div>
        ) : (
          <div className="destination-grid">
            {data.destinations.map((d) => (
              <Link
                key={d.id}
                href={`/hotels?locationId=${d.id}`}
                className={`destination-card group ${d.className ?? ''}`}
              >
                <Photo
                  src={`/images/${d.image}.jpg`}
                  alt={t('Ilustrasi suasana {0}', { '0': d.name })}
                  sizes="(max-width: 767px) 90vw, (max-width: 1023px) 45vw, 30vw"
                />
                <div className="destination-shade" />
                <span className="destination-badge">{t('INDONESIA')}</span>
                <div className="absolute inset-x-5 bottom-5 z-10 flex items-end justify-between text-white">
                  <div>
                    <h3 className="text-[25px] font-semibold tracking-[-0.5px]">
                      {t(d.name)}
                    </h3>
                    <p className="mt-1 text-xs text-white/95">
                      {t(d.subtitle)}
                    </p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-full border border-white/60 bg-black/10">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <BrowseTypes />
      <section className="page-container section-space" id="curated">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('DIPILIH UNTUK JADI INSPIRASI')}</p>
            <h2>{t('Temukan tempat menginap favorit Anda.')}</h2>
            <p>
              {t(
                'Pilihan editorial Gobuking, untuk berbagai cara menikmati perjalanan. ',
              )}
            </p>
          </div>
          <span className="demo-chip">{t('Koleksi contoh')}</span>
        </div>
        <div
          className="mb-6 flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label={t('Filter pilihan Gobuking')}
        >
          {[
            ['all', 'Semua pilihan'],
            ['hotel', 'Hotel'],
            ['home', 'Home Rental'],
            ['wedding', 'Venue'],
            ['saved', `Tersimpan (${saved.length})`],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              className={`filter-chip ${filter === value ? 'selected' : ''}`}
              onClick={() => setFilter(value)}
            >
              {value === 'saved' && <Heart size={13} />}{' '}
              {value === 'saved'
                ? t('Tersimpan ({0})', { '0': saved.length })
                : t(label)}
            </button>
          ))}
        </div>
        {loading ? (
          <div
            className="listing-grid"
            aria-busy="true"
            aria-label={t('Memuat properti')}
          >
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-80 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl bg-muted p-5 text-sm">
            {t(
              'Pilihan properti belum dapat dimuat. Gunakan tombol Coba lagi pada bagian destinasi. ',
            )}
          </p>
        ) : (
          <div className="listing-grid">
            {data?.listings
              .filter(
                (l) =>
                  filter === 'all' ||
                  (filter === 'saved'
                    ? saved.includes(l.id)
                    : filter === l.category),
              )
              .map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  saved={saved.includes(l.id)}
                  onSave={() => toggle(l.id)}
                />
              ))}
            {!data?.listings.some(
              (l) =>
                filter === 'all' ||
                (filter === 'saved'
                  ? saved.includes(l.id)
                  : filter === l.category),
            ) && (
              <div className="content-feedback col-span-full">
                <Heart size={28} />
                <h3>
                  {filter === 'saved'
                    ? t('Belum ada tempat tersimpan.')
                    : t('Belum ada pilihan dalam kategori ini.')}
                </h3>
                <p>
                  {filter === 'saved'
                    ? t('Ketuk ikon hati pada properti yang Anda suka.')
                    : t('Coba kategori lain untuk mendapatkan inspirasi.')}
                </p>
                <Button variant="outline" onClick={() => setFilter('all')}>
                  {t('Lihat semua pilihan ')}
                </Button>
              </div>
            )}
          </div>
        )}
        <p className="mt-4 inline-flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
          <Check size={12} className="mt-1 shrink-0" />
          {t(
            'Nama, harga, dan fasilitas adalah data demo. Foto merupakan ilustrasi. Belum menunjukkan ketersediaan nyata. ',
          )}
        </p>
      </section>
    </>
  );
}
