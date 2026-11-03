'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Check,
  CheckCircle2,
  Clock,
  Info,
  ShieldCheck,
  LoaderCircle,
  MapPin,
  Maximize,
  UsersRound,
} from 'lucide-react';
import {
  PropertyGallery,
  PropertyReviews,
} from '@/components/property/property-media';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatRupiah } from '@/lib/utils';
import { HotelFacilities } from './hotel-facilities';
import { hotelAdapter, availableStock, makeQuote } from '../lib/adapter';
import { createHotelDraft } from '../lib/booking-adapter';
import { hotelParams, parseHotelFilters, parseHotelQuery } from '../lib/query';
import type { Hotel, HotelScenario } from '../lib/types';
import {
  DemoNotice,
  ErrorPanel,
  HotelSearchEditor,
  LoadingCards,
  ScenarioControl,
  StaySummary,
} from './shared';
import { HotelSaveButton, ReviewScore, StarClass } from './hotel-card';
export function HotelDetail({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const raw = search.toString();
  const query = useMemo(() => parseHotelQuery(new URLSearchParams(raw)), [raw]);
  const scenario = parseHotelFilters(search).scenario;
  const [response, setResponse] = useState<{
    key: string;
    hotel?: Hotel;
    error?: string;
  }>();
  const dataKey = `${slug}:${scenario}`;
  const hotel = response?.key === dataKey ? response.hotel : undefined;
  const error = response?.key === dataKey ? response.error : undefined;
  const [selection, setSelection] = useState<{
    roomId: string;
    rateId: string;
  } | null>(null);
  const [replacement, setReplacement] = useState<{
    roomId: string;
    rateId: string;
  } | null>(null);
  const [quantity, setQuantity] = useState(query.rooms);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    hotelAdapter
      .getHotel(slug, scenario, controller.signal)
      .then((hotel) => setResponse({ key: dataKey, hotel }))
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError')
          setResponse({ key: dataKey, error: e.message });
      });
    return () => controller.abort();
  }, [slug, scenario, dataKey]);
  const effectiveQuery = {
    ...query,
    locationId: search.has('locationId')
      ? query.locationId
      : (hotel?.locationId ?? query.locationId),
    rooms: quantity,
  };
  const room = hotel?.rooms.find((r) => r.id === selection?.roomId);
  const rate = room?.rates.find((r) => r.id === selection?.rateId);
  const quote =
    hotel && room && rate ? makeQuote(hotel, room, rate, effectiveQuery) : null;
  function scenarioChange(value: HotelScenario) {
    const params = new URLSearchParams(raw);
    params.set('scenario', value);
    router.replace(`/hotels/${slug}?${params}`, { scroll: false });
  }
  function select(roomId: string, rateId: string) {
    if (
      selection &&
      (selection.roomId !== roomId || selection.rateId !== rateId)
    ) {
      setReplacement({ roomId, rateId });
      return;
    }
    setSelection({ roomId, rateId });
    setActionError('');
  }
  async function checkout() {
    if (!hotel || !selection) return;
    setBusy(true);
    setActionError('');
    try {
      const draftQuote = await hotelAdapter.previewBooking(
        hotel,
        selection.roomId,
        selection.rateId,
        effectiveQuery,
        scenario === 'price_changed' ? 'ready' : scenario,
      );
      const draft = createHotelDraft({
        hotelId: hotel.id,
        roomId: selection.roomId,
        rateId: selection.rateId,
        query: effectiveQuery,
        quote: draftQuote,
        scenario,
      });
      router.push(`/checkout/hotel/${draft.id}`);
    } catch (e) {
      setActionError(
        e instanceof Error
          ? e.message
          : 'Layanan demo sedang terganggu. Coba lagi.',
      );
    } finally {
      setBusy(false);
    }
  }
  if (!hotel)
    return (
      <main id="main" className="hotel-module page-container py-12">
        <Link
          className="section-link"
          href={`/hotels?${hotelParams(effectiveQuery)}`}
        >
          <ArrowLeft size={16} />
          {t('Kembali ke hasil')}
        </Link>
        {error ? (
          <ErrorPanel message={error} retry={() => scenarioChange('ready')} />
        ) : (
          <LoadingCards />
        )}
      </main>
    );
  return (
    <main id="main" className="hotel-module hotel-detail">
      <div className="page-container">
        <nav className="hotel-breadcrumb" aria-label={t('Breadcrumb')}>
          <Link href="/">{t('Beranda')}</Link>
          <span>/</span>
          <Link href={`/hotels?${hotelParams(effectiveQuery)}`}>
            {t('Hotel')}
          </Link>
          <span>/</span>
          <span>{hotel.name}</span>
        </nav>
        <DemoNotice />
        <div className="hotel-detail-heading">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StarClass stars={hotel.stars} />
              <span className="hotel-tag">{t('Pesan langsung')}</span>
            </div>
            <h1>{hotel.name}</h1>
            <p>
              <MapPin size={16} />
              {hotel.area} · {t('Alamat ilustratif')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ReviewScore score={hotel.score} />
            <HotelSaveButton id={hotel.id} name={hotel.name} />
          </div>
        </div>
        <PropertyGallery hotel={hotel} />
        <nav className="hotel-anchor-nav" aria-label={t('Bagian detail hotel')}>
          {[
            ['overview', 'Ringkasan'],
            ['rooms', 'Kamar & tarif'],
            ['facilities', 'Fasilitas'],
            ['hotel-reviews', 'Ulasan tamu'],
            ['rules', 'Aturan menginap'],
          ].map(([id, label]) => (
            <a href={`#${id}`} key={id}>
              {t(label)}
            </a>
          ))}
        </nav>
        <div className="hotel-detail-grid">
          <div className="min-w-0">
            <section id="overview" className="hotel-detail-section">
              <h2>{t('Rehat sejenak, nikmati suasananya.')}</h2>
              <p>{t(hotel.description)}</p>
              <div className="hotel-overview-highlights">
                <span>
                  <ShieldCheck size={21} />
                  {t('Informasi harga transparan')}
                </span>
                <span>
                  <BedDouble size={21} />
                  {t('Pilihan kamar untuk Anda')}
                </span>
                <span>
                  <CheckCircle2 size={21} />
                  {t('Ketentuan terlihat sebelum memesan')}
                </span>
              </div>
            </section>
            <section id="rooms" className="hotel-detail-section">
              <div className="section-heading">
                <div>
                  <h2>{t('Pilih kamar dan tarif Anda')}</h2>
                  <p>
                    {t(
                      'Satu pesanan memakai satu tipe kamar dan satu pilihan tarif.',
                    )}
                  </p>
                </div>
              </div>
              <StaySummary query={effectiveQuery} />
              <HotelSearchEditor query={effectiveQuery} />
              <label className="hotel-quantity">
                {t('Jumlah kamar')}
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <div className="hotel-room-list">
                {hotel.rooms.map((option) => (
                  <article key={option.id} className="hotel-room-card">
                    <div className="room-overview">
                      <div className="room-photo">
                        <Image
                          src={`/images/${option.image}.jpg`}
                          alt={t(option.name)}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3>{t(option.name)}</h3>
                        <p>
                          <BedDouble size={15} />
                          {t(option.beds)}
                        </p>
                        <p>
                          <Maximize size={15} />
                          {option.size} m² <UsersRound size={15} />
                          {t('Maks. {count} tamu per kamar', {
                            count: option.capacity,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('Stok bersama untuk semua tarif tipe kamar ini.')}
                        </p>
                      </div>
                    </div>
                    <div className="room-rates">
                      {option.rates.map((plan) => {
                        const price = makeQuote(
                          hotel,
                          option,
                          plan,
                          effectiveQuery,
                        );
                        const stock = availableStock(
                          option,
                          effectiveQuery,
                          scenario,
                        );
                        const unavailable =
                          stock < quantity ||
                          option.capacity * quantity <
                            query.adults + query.children;
                        const active =
                          selection?.roomId === option.id &&
                          selection.rateId === plan.id;
                        return (
                          <div
                            className={`room-rate ${active ? 'selected' : ''}`}
                            key={plan.id}
                          >
                            <div>
                              <strong>{t(plan.label)}</strong>
                              <span>
                                <Check size={14} />
                                {t(
                                  plan.breakfast
                                    ? 'Termasuk sarapan'
                                    : 'Tanpa sarapan',
                                )}
                              </span>
                              <span
                                className={
                                  plan.freeCancellation ? 'hotel-positive' : ''
                                }
                              >
                                {t(
                                  plan.freeCancellation
                                    ? 'Pembatalan gratis sesuai ketentuan'
                                    : 'Tarif non-refundable',
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {t(
                                  'Konfirmasi setelah pembayaran terverifikasi',
                                )}
                              </span>
                            </div>
                            <div className="room-rate-price">
                              <b>{formatRupiah(price.total, locale)}</b>
                              <small>{t('Total termasuk pajak & biaya')}</small>
                              <Button
                                variant={active ? 'secondary' : 'default'}
                                disabled={unavailable}
                                onClick={() => select(option.id, plan.id)}
                                aria-pressed={active}
                              >
                                {t(
                                  unavailable
                                    ? 'Tidak tersedia'
                                    : active
                                      ? 'Tarif dipilih'
                                      : 'Pilih tarif',
                                )}
                              </Button>
                              {unavailable && (
                                <small className="text-red-700">
                                  {t(
                                    'Tanggal atau kapasitas tidak memenuhi pilihan ini.',
                                  )}
                                </small>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
              {actionError && (
                <div className="hotel-action-error" role="alert">
                  <Info size={18} />
                  <p>{t(actionError)}</p>
                </div>
              )}
            </section>
            <HotelFacilities
              hotel={hotel}
              mapHref={`/hotels?${hotelParams(effectiveQuery)}&view=map`}
            />
            <PropertyReviews hotel={hotel} />
            <section id="rules" className="hotel-detail-section">
              <h2>{t('Aturan menginap')}</h2>
              <div className="hotel-rules-grid">
                <div>
                  <Clock size={20} />
                  <h3>{t('Check-in')}</h3>
                  <p>
                    {hotel.checkIn} · {hotel.zone}
                  </p>
                </div>
                <div>
                  <Clock size={20} />
                  <h3>{t('Check-out')}</h3>
                  <p>
                    {hotel.checkOut} · {hotel.zone}
                  </p>
                </div>
                <div>
                  <UsersRound size={20} />
                  <h3>{t('Anak & kapasitas')}</h3>
                  <p>
                    {t(
                      'Usia setiap anak diperlukan. Kapasitas mengikuti tipe kamar dan jumlah kamar.',
                    )}
                  </p>
                </div>
                <div>
                  <ShieldCheck size={20} />
                  <h3>{t('Ketentuan tarif')}</h3>
                  <p>
                    {t(
                      'Pembatalan mengikuti pilihan tarif pada pesanan. Permintaan khusus tidak dijamin.',
                    )}
                  </p>
                </div>
              </div>
            </section>
          </div>
          <aside className="hotel-reserve-panel">
            <div className="reserve-icon">
              <BedDouble size={27} />
            </div>
            <h2>{t('Temukan ruang nyaman Anda.')}</h2>
            <p>
              {t(
                'Pilih satu kamar dan tarif untuk melihat ringkasan sebelum melanjutkan.',
              )}
            </p>
            {quote && room && rate ? (
              <>
                <div className="hotel-selected-rate">
                  <strong>{t(room.name)}</strong>
                  <span>{t(rate.label)}</span>
                  <span>
                    {t('{nights} malam · {rooms} kamar', {
                      nights: quote.nights,
                      rooms: quantity,
                    })}
                  </span>
                </div>
                <div className="hotel-reserve-total">
                  <small>{t('Total menginap')}</small>
                  <b>{formatRupiah(quote.total, locale)}</b>
                  <span>{t('Termasuk pajak & biaya wajib')}</span>
                </div>
                <Button className="w-full" disabled={busy} onClick={checkout}>
                  {busy ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <ArrowRight />
                  )}
                  {t(
                    busy
                      ? 'Memeriksa ketersediaan…'
                      : 'Lanjut ke checkout demo',
                  )}
                </Button>
              </>
            ) : (
              <Button asChild className="w-full">
                <a href="#rooms">
                  {t('Pilih kamar')}
                  <ArrowRight />
                </a>
              </Button>
            )}
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              <Info size={14} className="mr-1 inline" />
              {t(
                'Reservasi demo dikonfirmasi setelah hasil pembayaran simulasi berhasil.',
              )}
            </p>
          </aside>
        </div>
        <ScenarioControl value={scenario} onChange={scenarioChange} />
        <div className="hotel-mobile-reserve">
          <span>
            <small>{t(quote ? 'Total menginap' : 'Mulai rencanakan')}</small>
            <strong>
              {quote ? formatRupiah(quote.total, locale) : t('Pilih kamar')}
            </strong>
          </span>
          {quote ? (
            <Button disabled={busy} onClick={checkout}>
              {busy ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ArrowRight />
              )}
              {t('Lanjutkan')}
            </Button>
          ) : (
            <Button asChild>
              <a href="#rooms">{t('Pilih kamar')}</a>
            </Button>
          )}
        </div>
      </div>
      <Dialog
        open={replacement !== null}
        onOpenChange={(open) => {
          if (!open) setReplacement(null);
        }}
      >
        <DialogContent>
          <DialogTitle className="pr-8 text-xl font-bold">
            {t('Ganti pilihan kamar atau tarif?')}
          </DialogTitle>
          <DialogDescription className="my-4 text-sm leading-7 text-muted-foreground">
            {t(
              'Pilihan baru akan menggantikan pilihan sebelumnya. Satu pesanan hanya mendukung satu tipe kamar dan tarif.',
            )}
          </DialogDescription>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReplacement(null)}>
              {t('Pertahankan pilihan')}
            </Button>
            <Button
              onClick={() => {
                setSelection(replacement);
                setReplacement(null);
                setActionError('');
              }}
            >
              {t('Ganti pilihan')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
