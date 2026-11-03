import { getI18n } from '@/lib/i18n/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Construction,
} from 'lucide-react';
import { SERVICES } from '@/lib/constants';
import { AIRPORTS, LOCATIONS } from '@/features/home/lib/search';
import { Button } from '@/components/ui/button';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Ringkasan pencarian'),
    robots: { index: false, follow: false },
  };
}
const labels: Record<string, string> = {
  locationId: 'Lokasi / asal',
  destinationId: 'Bandara tujuan',
  start: 'Tanggal mulai',
  end: 'Tanggal selesai',
  adults: 'Dewasa',
  children: 'Anak',
  childAges: 'Usia anak',
  rooms: 'Kamar',
  trip: 'Jenis perjalanan',
  cabin: 'Kelas',
  infants: 'Bayi',
  flexible: 'Tanggal fleksibel',
  participants: 'Jumlah peserta / tamu',
  layout: 'Tata ruang',
  mode: 'Mode rental',
  startTime: 'Jam ambil',
  endTime: 'Jam kembali',
  pickup: 'Area ambil & kembali',
};
const valueLabels: Record<string, string> = {
  roundtrip: 'Pulang pergi',
  oneway: 'Sekali jalan',
  economy: 'Ekonomi',
  business: 'Bisnis',
  true: 'Ya',
  theater: 'Theater',
  classroom: 'Classroom',
  banquet: 'Banquet',
  seated: 'Duduk',
  standing: 'Berdiri',
  driver: 'Dengan pengemudi',
  self: 'Lepas kunci',
};
export default async function SearchHandoff({
  params,
  searchParams,
}: {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, locale } = await getI18n();
  const { category } = await params;
  const service = SERVICES.find((s) => s.path === `/${category}`);
  if (!service) notFound();
  const query = await searchParams;
  const allowed = Object.entries(query).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === 'string' && entry[0] in labels,
  );
  const back = new URLSearchParams({ service: service.id });
  allowed.forEach(([key, value]) => back.set(key, value));
  function valueFor(key: string, value: string) {
    if (key === 'locationId' || key === 'destinationId')
      return (
        [...LOCATIONS, ...AIRPORTS].find((o) => o.id === value)?.label ??
        t('Lokasi tidak dikenali')
      );
    if (
      (key === 'start' || key === 'end') &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      const date = new Date(`${value}T12:00:00`);
      if (!Number.isNaN(date.getTime()))
        return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(date);
    }
    return t(valueLabels[value] ?? value);
  }
  return (
    <main id="main" className="page-container min-h-[65vh] py-12 sm:py-20">
      <Link
        href={`/?${back.toString()}#search`}
        className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
      >
        <ArrowLeft size={16} />
        {t('Ubah pencarian ')}
      </Link>
      <div className="grid items-start gap-10 md:grid-cols-[1.3fr_1fr]">
        <div>
          <span className="demo-chip">
            {t('Phase 1 \u00B7 Serah-terima pencarian')}
          </span>
          <div className="my-5 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <service.icon size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('Rencana {service} Anda sudah punya titik awal.', {
              service: t(service.label).toLowerCase(),
            })}
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">
            {t(
              'Parameter pencarian diteruskan melalui URL dan dapat dipulihkan saat kembali ke beranda. ',
            )}
          </p>
          <div className="mt-7 flex max-w-lg items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <Construction className="mt-0.5 size-5 shrink-0" />
            <div>
              <h2 className="font-semibold">
                {t('Modul {service} dilanjutkan pada Phase {phase}', {
                  service: t(service.label),
                  phase: service.phase,
                })}
              </h2>
              <p className="mt-2 text-sm leading-6">
                {t('Halaman hasil dan detail belum diimplementasikan.')}{' '}
                {service.id === 'flight'
                  ? t(
                      'Pencarian supplier nyata akan diintegrasikan pada Phase 4.',
                    )
                  : service.id === 'mice' || service.id === 'wedding'
                    ? t(
                        'Inquiry, penawaran, dan permintaan booking akan tersedia pada fase venue.',
                      )
                    : t(
                        'Ketersediaan, harga aktual, dan pemesanan akan tersedia pada fase terkait.',
                      )}{' '}
                {t('Tidak ada reservasi atau pembayaran yang dibuat. ')}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/">
              {t('Kembali ke beranda ')}
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <section
          className="rounded-2xl border border-border bg-white p-6 shadow-sm"
          aria-label={t('Ringkasan parameter')}
        >
          <div className="mb-5 flex items-center gap-2 border-b border-border pb-4">
            <CheckCircle2 size={18} className="text-primary" />
            <h2 className="font-semibold">{t('Ringkasan pencarian')}</h2>
          </div>
          {allowed.length ? (
            <dl className="space-y-4">
              {allowed.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-5 text-sm">
                  <dt className="text-muted-foreground">{t(labels[key])}</dt>
                  <dd className="max-w-[60%] break-words text-right font-medium">
                    {valueFor(key, value) || t('Belum diisi')}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              {t(
                'Tentukan lokasi dan tanggal melalui form pencarian di beranda. ',
              )}
            </p>
          )}
          <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
            {t('Ringkasan ini bukan konfirmasi pemesanan. ')}
          </p>
        </section>
      </div>
    </main>
  );
}
