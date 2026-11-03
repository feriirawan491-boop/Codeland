'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  ShieldCheck,
  FileCheck,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountAccess } from '@/features/account/components/account-access';
import { useDemoAccount } from '@/features/account/lib/demo-auth';
import { useI18n } from '@/components/i18n/locale-provider';
import { validateInquiryFile } from '@/features/venue/lib/attachments';
import { carBookingAdapter, getCarDraft } from '../lib/booking-adapter';
import { CarError } from '../lib/error';
import { renterSchema, carLink } from '../lib/query';
import type { CarDraft, CarRenter } from '../lib/types';
import {
  CarNotice,
  CarPrice,
  CarSummary,
  CarFacts,
  CarErrorPanel,
  CarLoading,
} from './shared';
export function CarCheckout({ draftId }: { draftId: string }) {
  const account = useDemoAccount();
  return (
    <CarCheckoutBody
      key={`${draftId}:${account?.id ?? 'guest'}`}
      draftId={draftId}
    />
  );
}
function CarCheckoutBody({ draftId }: { draftId: string }) {
  const { t } = useI18n();
  const account = useDemoAccount();
  const router = useRouter();
  const [draft, setDraft] = useState<CarDraft>();
  const [loadError, setLoadError] = useState<Error>();
  const [error, setError] = useState<Error>();
  const [unknown, setUnknown] = useState(false),
    [busy, setBusy] = useState(false),
    [file, setFile] = useState<File>();
  const alert = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CarRenter>({
    resolver: zodResolver(renterSchema),
    defaultValues: {
      name: account?.name ?? '',
      age: 30,
      license: false,
      eligibility: false,
      pickupDetail: '',
      notes: '',
      consent: false,
    },
    mode: 'onBlur',
  });
  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      const value = getCarDraft(draftId);
      if (!active) return;
      if (!value) {
        setLoadError(
          new CarError(
            '404',
            'Draft rental tidak ditemukan. Mulai dari pencarian mobil.',
          ),
        );
        return;
      }
      setDraft(value);
      if (account) {
        try {
          const existing = await carBookingAdapter.resolveSubmission(draftId);
          if (active && existing) router.replace(`/bookings/${existing.id}`);
        } catch (error) {
          if (active && error instanceof Error) setLoadError(error);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [draftId, account, router]);
  async function reconcile() {
    setBusy(true);
    try {
      const existing = await carBookingAdapter.resolveSubmission(draftId);
      if (existing) router.replace(`/bookings/${existing.id}`);
      else {
        setUnknown(false);
        setError(
          new CarError(
            'NOT_FOUND',
            'Pengiriman belum tercatat. Anda dapat meninjau lalu mengajukan kembali.',
          ),
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error
          : new Error('Layanan rental sedang terganggu. Silakan coba lagi.'),
      );
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    setBusy(true);
    try {
      const value = await carBookingAdapter.refreshDraft(draftId);
      setDraft(value);
      setError(undefined);
      setValue('consent', false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error
          : new Error('Layanan rental sedang terganggu. Silakan coba lagi.'),
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(values: CarRenter) {
    setError(undefined);
    try {
      const result = await carBookingAdapter.createRentalRequest(
        draftId,
        values,
        `request:${account?.id}:${draftId}`,
        file,
      );
      router.push(`/bookings/${result.id}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error
          : new Error('Layanan rental sedang terganggu. Silakan coba lagi.'),
      );
      setUnknown(error instanceof CarError && error.code === 'UNKNOWN');
      requestAnimationFrame(() => alert.current?.focus());
    }
  }
  if (!draft)
    return (
      <main id="main" className="car-module page-container car-checkout">
        <Link href="/cars" className="car-back">
          <ArrowLeft size={17} />
          {t('Kembali ke rental mobil')}
        </Link>
        {loadError ? <CarErrorPanel error={loadError} /> : <CarLoading />}
      </main>
    );
  return (
    <main id="main" className="car-module page-container car-checkout">
      <Link
        href={carLink(`/cars/${draft.offer.id}`, draft.query, draft.scenario)}
        className="car-back"
      >
        <ArrowLeft size={17} />
        {t('Kembali ke paket rental')}
      </Link>
      <CarNotice />
      <div className="car-page-heading">
        <p className="car-kicker">
          {t('TINJAU, AJUKAN, LALU TUNGGU PERSETUJUAN')}
        </p>
        <h1>{t('Siapkan perjalanan Anda.')}</h1>
        <p>
          {t(
            'Lengkapi data penyewa dan titik temu. Belum ada tagihan sebelum mitra menyetujui kelayakan dan alokasi.',
          )}
        </p>
      </div>
      <div className="car-checkout-layout">
        <div>
          {!account ? (
            <AccountAccess purpose="car" />
          ) : (
            <form
              className="car-renter-form"
              noValidate
              onSubmit={(event) => {
                void handleSubmit(submit, () =>
                  requestAnimationFrame(() => alert.current?.focus()),
                )(event);
              }}
            >
              {(error || Object.keys(errors).length > 0) && (
                <div
                  className="car-validation"
                  role="alert"
                  tabIndex={-1}
                  ref={alert}
                >
                  <strong>{t('Periksa pengajuan rental Anda')}</strong>
                  {error && <p>{t(error.message)}</p>}
                  <ul>
                    {Object.entries(errors).map(([key, value]) => (
                      <li key={key}>
                        <a
                          href={`#renter-${key}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(`renter-${key}`)?.focus();
                          }}
                        >
                          {t(value?.message)}
                        </a>
                      </li>
                    ))}
                  </ul>
                  {unknown && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={reconcile}
                      disabled={busy}
                    >
                      {t('Periksa status pengiriman')}
                    </Button>
                  )}
                  {error instanceof CarError &&
                    ['409', 'EXPIRED'].includes(error.code) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={refresh}
                        disabled={busy}
                      >
                        {t('Tinjau estimasi terbaru')}
                      </Button>
                    )}
                </div>
              )}
              <section>
                <div className="car-section-heading">
                  <UserIcon />
                  <h2>{t('Data penyewa')}</h2>
                </div>
                <p className="car-hint">
                  {t(
                    'Email dan telepon menggunakan akun terverifikasi Anda. Data ini hanya untuk tindak lanjut rental.',
                  )}
                </p>
                <div className="car-account-contact">
                  <strong>{account.name}</strong>
                  <span>{account.email}</span>
                  <span>{account.phone}</span>
                </div>
                <label>
                  <span>{t('Nama penyewa (wajib)')}</span>
                  <input
                    id="renter-name"
                    aria-invalid={!!errors.name}
                    autoComplete="name"
                    {...register('name')}
                  />
                </label>
                <label>
                  <span>{t('Usia penyewa (tahun, wajib)')}</span>
                  <input
                    id="renter-age"
                    type="number"
                    min={draft.offer.minAge}
                    max={100}
                    aria-invalid={!!errors.age}
                    {...register('age', { valueAsNumber: true })}
                  />
                  <small>
                    {t('Kebijakan paket: minimal {age} tahun.', {
                      age: draft.offer.minAge,
                    })}
                  </small>
                </label>
              </section>
              <section>
                <div className="car-section-heading">
                  <ShieldCheck size={23} />
                  <h2>{t('Pemeriksaan kelayakan')}</h2>
                </div>
                <p>
                  {t(
                    draft.offer.mode === 'self'
                      ? 'Siapkan SIM A yang masih berlaku dan identitas asli untuk pemeriksaan mitra.'
                      : 'Siapkan identitas penyewa. Pengemudi disediakan mitra setelah alokasi disetujui.',
                  )}
                </p>
                {draft.offer.mode === 'self' && (
                  <label className="car-checkbox">
                    <input
                      id="renter-license"
                      type="checkbox"
                      {...register('license')}
                    />
                    <span>
                      {t(
                        'Saya memiliki SIM A yang masih berlaku untuk periode rental.',
                      )}
                    </span>
                  </label>
                )}
                {draft.offer.uploadRequired && (
                  <label className="car-file-field">
                    <span>
                      <FileCheck size={18} />
                      {t('Dokumen SIM contoh (PDF/JPEG/PNG, maks. 5 MB)')}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={async (e) => {
                        setFile(undefined);
                        const value = e.target.files?.[0];
                        if (!value) return;
                        try {
                          await validateInquiryFile(value);
                          setFile(value);
                          setError(undefined);
                        } catch (error) {
                          setError(
                            error instanceof Error
                              ? error
                              : new Error('Dokumen belum dapat dibaca.'),
                          );
                          e.target.value = '';
                          requestAnimationFrame(() => alert.current?.focus());
                        }
                      }}
                    />
                    <small>
                      {t(
                        'Gunakan file contoh tanpa data identitas asli. Demo hanya menyimpan nama, tipe, dan ukuran file.',
                      )}
                    </small>
                    {file && <small>{file.name}</small>}
                  </label>
                )}
                <label className="car-checkbox">
                  <input
                    id="renter-eligibility"
                    type="checkbox"
                    aria-invalid={!!errors.eligibility}
                    {...register('eligibility')}
                  />
                  <span>
                    {t(
                      'Saya memahami usia, identitas, dan dokumen akan diperiksa mitra sebelum pembayaran dibuka.',
                    )}
                  </span>
                </label>
              </section>
              <section>
                <h2>{t('Titik temu & kebutuhan')}</h2>
                <label>
                  <span>{t('Rincian titik pengambilan (wajib)')}</span>
                  <textarea
                    id="renter-pickupDetail"
                    rows={3}
                    maxLength={300}
                    aria-invalid={!!errors.pickupDetail}
                    placeholder={t(
                      'Contoh: lobi hotel atau pintu kedatangan yang disepakati',
                    )}
                    {...register('pickupDetail')}
                  />
                </label>
                <label>
                  <span>{t('Catatan rental (opsional)')}</span>
                  <textarea
                    id="renter-notes"
                    rows={3}
                    maxLength={1000}
                    {...register('notes')}
                  />
                </label>
              </section>
              <label className="car-checkbox car-terms">
                <input
                  id="renter-consent"
                  type="checkbox"
                  aria-invalid={!!errors.consent}
                  {...register('consent')}
                />
                <span>
                  {t(
                    'Saya menyetujui total estimasi, aturan durasi, area, deposit terpisah, dan verifikasi mitra. Pengajuan ini belum menjadi reservasi terkonfirmasi.',
                  )}
                </span>
              </label>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || unknown || busy}
              >
                {isSubmitting ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <ArrowRight size={18} />
                )}{' '}
                {t('Kirim permintaan rental')}
              </Button>
              <p className="car-hint">
                <Info size={15} />
                {t(
                  'Tidak ada pembayaran saat mengajukan. Persetujuan mitra akan tampil pada status pesanan.',
                )}
              </p>
            </form>
          )}
        </div>
        <aside className="car-booking-summary">
          <h2>{draft.offer.name}</h2>
          <p className="car-provider">{draft.offer.providerName}</p>
          <CarFacts offer={draft.offer} />
          <CarSummary query={draft.query} />
          <CarPrice quote={draft.quote} offer={draft.offer} full />
          <p className="car-hint">
            {t(
              'Unit armada dan pengemudi diperiksa bersama interval serta buffer sebelum persetujuan.',
            )}
          </p>
        </aside>
      </div>
      <details className="car-demo-tools">
        <summary>{t('Alat skenario demo')}</summary>
        <Button
          variant="outline"
          onClick={() =>
            setDraft(
              carBookingAdapter.setDraftScenario(draftId, 'price_changed'),
            )
          }
        >
          {t('Simulasikan perubahan harga')}
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            setDraft(
              carBookingAdapter.setDraftScenario(draftId, 'mutation_timeout'),
            )
          }
        >
          {t('Simulasikan hasil belum diketahui')}
        </Button>
      </details>
    </main>
  );
}
import { UserRound as UserIcon } from 'lucide-react';
