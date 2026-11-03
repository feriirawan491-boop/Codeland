'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Heart,
  Info,
  LoaderCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { useI18n } from '@/components/i18n/locale-provider';
import { useDemoAccount } from '@/features/account/lib/demo-auth';
import {
  inquiryContactSchema,
  inquiryNeedsSchema,
} from '@/features/venue/lib/inquiry-schema';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import type { VenueInquiry } from '@/features/venue/lib/types';
import {
  VenueLoading,
  VenueErrorPanel,
} from '@/features/mice/components/shared';
import { ContactVerification } from '@/features/mice/components/contact-verification';
import { weddingAdapter } from '../lib/adapter';
import { weddingInquiryAdapter } from '../lib/inquiry';
import {
  parseWeddingQuery,
  weddingParams,
  weddingLink,
  weddingScenario,
  weddingRequirementsSchema,
} from '../lib/query';
import {
  WeddingNotice,
  WeddingScope,
  WeddingSummary,
  WeddingPackageScope,
} from './shared';
const schema = z.object({
  contact: inquiryContactSchema.extend({ company: z.string().trim().max(150) }),
  needs: inquiryNeedsSchema,
  wedding: weddingRequirementsSchema,
  consent: z
    .boolean()
    .refine(
      (value) => value,
      'Setujui penggunaan data untuk tindak lanjut inquiry.',
    ),
});
export function WeddingInquiry({ slug }: { slug: string }) {
  const account = useDemoAccount();
  return (
    <WeddingInquiryBody key={`${slug}:${account?.id ?? 'guest'}`} slug={slug} />
  );
}
function WeddingInquiryBody({ slug }: { slug: string }) {
  const { t } = useI18n();
  const account = useDemoAccount();
  const search = useSearchParams();
  const queryKey = weddingParams(parseWeddingQuery(search)).toString();
  const query = useMemo(
    () => parseWeddingQuery(new URLSearchParams(queryKey)),
    [queryKey],
  );
  const scenario = weddingScenario(search),
    key = `${slug}:${scenario}`;
  const [response, setResponse] = useState<{
    key: string;
    data?: Awaited<ReturnType<typeof weddingAdapter.getWeddingVenue>>;
    error?: Error;
  }>();
  const [pending, setPending] = useState<VenueInquiry | null>(null);
  const [command, setCommand] = useState(
    () => `WED-INQ-${crypto.randomUUID()}`,
  );
  const [mutation, setMutation] = useState(''),
    [unknown, setUnknown] = useState(false),
    [checking, setChecking] = useState(false);
  const alert = useRef<HTMLDivElement>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      contact: {
        name: account?.name ?? '',
        email: account?.email ?? '',
        phone: account?.phone ?? '',
        company: '',
      },
      needs: {
        av: false,
        catering: false,
        rooms: 0,
        notes: '',
        budget: undefined,
      },
      wedding: {
        alternativeDates: [],
        siteVisit: false,
        siteVisitDate: '',
        ceremony: 'both',
        decoration: false,
      },
      consent: false,
    },
    mode: 'onBlur',
  });
  const siteVisit = useWatch({ control, name: 'wedding.siteVisit' });
  useEffect(() => {
    const controller = new AbortController();
    weddingAdapter
      .getWeddingVenue(slug, scenario, controller.signal)
      .then((data) => setResponse({ key, data }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      });
    return () => controller.abort();
  }, [slug, scenario, key]);
  useEffect(() => {
    const id = sessionStorage.getItem(`gobuking:wedding-pending:${slug}`);
    if (!id) return;
    let active = true;
    inquiryAdapter
      .getInquiry(id)
      .then((value) => {
        if (active && !value.verifiedAt && value.service === 'wedding')
          setPending(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [slug]);
  const data = response?.key === key ? response.data : undefined,
    error = response?.key === key ? response.error : undefined;
  if (!data)
    return (
      <main
        id="main"
        className="venue-module wedding-module page-container py-10"
      >
        {error ? <VenueErrorPanel error={error} /> : <VenueLoading />}
      </main>
    );
  const pack =
    data.space.packages.find((p) => p.id === search.get('packageId')) ??
    data.space.packages[0];
  async function reconcile() {
    setChecking(true);
    try {
      const value = await inquiryAdapter.resolveSubmission(command);
      if (value) {
        setPending(value);
        setUnknown(false);
        sessionStorage.setItem(
          `gobuking:wedding-pending:${data!.space.id}`,
          value.id,
        );
      }
    } catch (error) {
      setMutation(
        error instanceof Error
          ? error.message
          : 'Layanan venue sedang terganggu. Silakan coba lagi.',
      );
    } finally {
      setChecking(false);
    }
  }
  return (
    <main
      id="main"
      className="venue-module wedding-module page-container venue-inquiry-page"
    >
      <Link
        className="venue-back"
        href={weddingLink(`/wedding/${slug}`, query, scenario, {
          packageId: pack.id,
        })}
      >
        <ArrowLeft size={17} />
        {t('Kembali ke detail Wedding Venue')}
      </Link>
      <WeddingNotice />
      <div className="venue-inquiry-heading">
        <p className="venue-kicker">{t('CERITAKAN HARI YANG ANDA IMPIKAN')}</p>
        <h1>{t('Mari rencanakan momen Anda.')}</h1>
        <p>
          {t(
            'Sampaikan tanggal alternatif dan rencana kunjungan. PIC akan membantu menyiapkan langkah berikutnya.',
          )}
        </p>
      </div>
      <div className="venue-inquiry-layout">
        <div>
          {pending ? (
            <ContactVerification
              inquiry={pending}
              onEdit={() => {
                sessionStorage.removeItem(`gobuking:wedding-pending:${slug}`);
                setPending(null);
                setCommand(`WED-INQ-${crypto.randomUUID()}`);
              }}
            />
          ) : (
            <form
              className="venue-inquiry-form wedding-inquiry-form"
              noValidate
              onSubmit={(event) => {
                void handleSubmit(
                  async (values) => {
                    setMutation('');
                    try {
                      const value =
                        await weddingInquiryAdapter.createWeddingInquiry(
                          {
                            spaceId: data.space.id,
                            packageId: pack.id,
                            event: query,
                            ...values,
                          },
                          command,
                          scenario,
                        );
                      setPending(value);
                      sessionStorage.setItem(
                        `gobuking:wedding-pending:${slug}`,
                        value.id,
                      );
                    } catch (error) {
                      setMutation(
                        error instanceof Error
                          ? error.message
                          : 'Layanan venue sedang terganggu. Silakan coba lagi.',
                      );
                      setUnknown(
                        error instanceof Error &&
                          'code' in error &&
                          error.code === 'UNKNOWN',
                      );
                      requestAnimationFrame(() => alert.current?.focus());
                    }
                  },
                  () => requestAnimationFrame(() => alert.current?.focus()),
                )(event);
              }}
            >
              {(Object.keys(errors).length > 0 || mutation) && (
                <div
                  className="venue-validation"
                  role="alert"
                  tabIndex={-1}
                  ref={alert}
                >
                  <strong>{t('Periksa kebutuhan pernikahan Anda')}</strong>
                  {mutation && <p>{t(mutation)}</p>}
                  {Object.keys(errors).length > 0 && (
                    <p>
                      {t(
                        'Lengkapi kontak, tanggal alternatif, dan persetujuan yang sesuai.',
                      )}
                    </p>
                  )}
                  {errors.contact &&
                    Object.entries(errors.contact).map(([field, error]) => (
                      <p key={field}>
                        <a
                          href={`#wedding-contact-${field}`}
                          onClick={(event) => {
                            event.preventDefault();
                            document
                              .getElementById(`wedding-contact-${field}`)
                              ?.focus();
                          }}
                        >
                          {t(
                            error &&
                              typeof error === 'object' &&
                              'message' in error &&
                              typeof error.message === 'string'
                              ? error.message
                              : '',
                          )}
                        </a>
                      </p>
                    ))}
                  {errors.wedding?.alternativeDates && (
                    <p>
                      <a href="#wedding-alternative-0">
                        {t(errors.wedding.alternativeDates.message)}
                      </a>
                    </p>
                  )}
                  {errors.wedding?.siteVisitDate && (
                    <p>
                      <a href="#wedding-site-visit">
                        {t(errors.wedding.siteVisitDate.message)}
                      </a>
                    </p>
                  )}
                  {errors.consent && (
                    <p>
                      <a href="#wedding-inquiry-consent">
                        {t(errors.consent.message)}
                      </a>
                    </p>
                  )}
                  {errors.needs?.budget && (
                    <p>
                      <a href="#wedding-budget">
                        {t(errors.needs.budget.message)}
                      </a>
                    </p>
                  )}
                  {errors.needs?.notes && (
                    <p>{t(errors.needs.notes.message)}</p>
                  )}
                  {unknown && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={checking}
                      onClick={reconcile}
                    >
                      {t('Periksa status pengiriman')}
                    </Button>
                  )}
                </div>
              )}
              <section>
                <h2>
                  <Heart size={22} />
                  {t('Kontak pasangan atau perencana')}
                </h2>
                {[
                  { name: 'name', label: 'Nama kontak', type: 'text' },
                  { name: 'email', label: 'Email kontak', type: 'email' },
                  { name: 'phone', label: 'Nomor telepon kontak', type: 'tel' },
                  {
                    name: 'company',
                    label: 'Perencana / organisasi (opsional)',
                    type: 'text',
                  },
                ].map((item) => (
                  <label key={item.name} className="venue-form-field">
                    <span>{t(item.label)}</span>
                    <input
                      id={`wedding-contact-${item.name}`}
                      aria-invalid={
                        !!errors.contact?.[
                          item.name as keyof typeof errors.contact
                        ]
                      }
                      type={item.type}
                      {...register(
                        `contact.${item.name as keyof z.input<typeof schema>['contact']}`,
                      )}
                      readOnly={item.name === 'email' && !!account}
                      autoComplete={
                        item.name === 'name'
                          ? 'name'
                          : item.name === 'email'
                            ? 'email'
                            : item.name === 'phone'
                              ? 'tel'
                              : 'organization'
                      }
                    />
                  </label>
                ))}
              </section>
              <section>
                <h2>
                  <CalendarDays size={22} />
                  {t('Tanggal alternatif & perayaan')}
                </h2>
                <label className="venue-form-field">
                  <span>{t('Jenis perayaan')}</span>
                  <select {...register('wedding.ceremony')}>
                    <option value="both">{t('Seremoni & resepsi')}</option>
                    <option value="ceremony">{t('Seremoni')}</option>
                    <option value="reception">{t('Resepsi')}</option>
                  </select>
                </label>
                <p className="wedding-form-hint">
                  {t(
                    'Tanggal alternatif opsional, maksimal 3 pilihan. Tanggal ini tidak menahan venue.',
                  )}
                </p>
                <div className="wedding-alternative-dates">
                  {[0, 1, 2].map((i) => (
                    <label className="venue-form-field" key={i}>
                      <span>
                        {t('Tanggal alternatif {number}', { number: i + 1 })}
                      </span>
                      <DateInput
                        id={`wedding-alternative-${i}`}
                        aria-invalid={!!errors.wedding?.alternativeDates}
                        {...register(`wedding.alternativeDates.${i}`)}
                      />
                    </label>
                  ))}
                </div>
              </section>
              <section>
                <h2>{t('Rencana site visit')}</h2>
                <label className="venue-consent">
                  <input type="checkbox" {...register('wedding.siteVisit')} />
                  <span>
                    {t('Saya ingin mengunjungi venue terlebih dahulu')}
                  </span>
                </label>
                {siteVisit && (
                  <label className="venue-form-field">
                    <span>{t('Preferensi tanggal kunjungan (opsional)')}</span>
                    <DateInput
                      id="wedding-site-visit"
                      aria-invalid={!!errors.wedding?.siteVisitDate}
                      {...register('wedding.siteVisitDate')}
                    />
                  </label>
                )}
                <p className="venue-inline-note">
                  <Info size={17} />
                  {t(
                    'Site visit dicatat sebagai permintaan tindak lanjut, bukan appointment yang dijamin.',
                  )}
                </p>
              </section>
              <section>
                <h2>{t('Kebutuhan & anggaran')}</h2>
                <label className="venue-form-field">
                  <span>{t('Anggaran pernikahan (opsional, IDR)')}</span>
                  <input
                    id="wedding-budget"
                    aria-invalid={!!errors.needs?.budget}
                    type="number"
                    min={1}
                    step={1000000}
                    {...register('needs.budget', {
                      setValueAs: (value) =>
                        value === '' ? undefined : Number(value),
                    })}
                  />
                  {errors.needs?.budget && (
                    <small className="field-error">
                      {t(errors.needs.budget.message)}
                    </small>
                  )}
                </label>
                <div className="venue-requirement-checks">
                  <label>
                    <input type="checkbox" {...register('needs.catering')} />
                    {t('Bahas kebutuhan katering')}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      {...register('wedding.decoration')}
                    />
                    {t('Bahas dekorasi tambahan')}
                  </label>
                </div>
                <label className="venue-form-field">
                  <span>{t('Catatan kebutuhan (opsional)')}</span>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    {...register('needs.notes')}
                  />
                </label>
              </section>
              <label className="venue-consent">
                <input
                  id="wedding-inquiry-consent"
                  type="checkbox"
                  aria-invalid={!!errors.consent}
                  {...register('consent')}
                />
                <span>
                  {t(
                    'Saya menyetujui penggunaan kontak untuk tindak lanjut dan memahami bahwa inquiry belum menjadi reservasi atau jadwal kunjungan pasti.',
                  )}
                </span>
              </label>
              <Button
                className="w-full mt-5"
                type="submit"
                disabled={isSubmitting || unknown}
              >
                {isSubmitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ArrowRight />
                )}
                {t('Lanjut verifikasi email')}
              </Button>
            </form>
          )}
        </div>
        <aside className="venue-inquiry-summary">
          <h2>{data.space.name}</h2>
          <p>{data.venue.name}</p>
          <WeddingSummary query={query} zone={data.venue.zone} />
          <div className="wedding-selected-package">
            <strong>{t(pack.name)}</strong>
            <WeddingPackageScope pack={pack} />
          </div>
          <WeddingScope />
        </aside>
      </div>
    </main>
  );
}
