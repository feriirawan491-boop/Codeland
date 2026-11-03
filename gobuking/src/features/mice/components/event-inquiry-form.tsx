'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  FileUp,
  LoaderCircle,
  Presentation,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import { useDemoAccount } from '@/features/account/lib/demo-auth';
import { venueAdapter } from '@/features/venue/lib/adapter';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import {
  inquiryContactSchema,
  inquiryNeedsSchema,
} from '@/features/venue/lib/inquiry-schema';
import {
  eventParams,
  eventSchema,
  parseEventQuery,
  venueLink,
  venueScenario,
} from '@/features/venue/lib/query';
import { packageEstimate } from '@/features/venue/lib/pricing';
import type {
  Venue,
  VenueSpace,
  VenueInquiry,
} from '@/features/venue/lib/types';
import { formatRupiah } from '@/lib/utils';
import {
  EventSummary,
  InquiryOnlyNotice,
  VenueDemoNotice,
  VenueErrorPanel,
  VenueLoading,
  VenueSteps,
} from './shared';
import { ContactVerification } from './contact-verification';
const formSchema = z.object({
  contact: inquiryContactSchema,
  needs: inquiryNeedsSchema,
  consent: z
    .boolean()
    .refine((v) => v, 'Setujui penggunaan data untuk tindak lanjut inquiry.'),
});
type FormValues = z.infer<typeof formSchema>;
export function EventInquiryForm({ slug }: { slug: string }) {
  const account = useDemoAccount();
  return (
    <InquiryFormBody key={`${slug}:${account?.id ?? 'guest'}`} slug={slug} />
  );
}
function InquiryFormBody({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const account = useDemoAccount();
  const search = useSearchParams();
  const queryKey = eventParams(parseEventQuery(search)).toString();
  const query = useMemo(
    () => parseEventQuery(new URLSearchParams(queryKey)),
    [queryKey],
  );
  const scenario = venueScenario(search),
    key = `${slug}:${scenario}`;
  const [response, setResponse] = useState<{
    key: string;
    venue?: Venue;
    space?: VenueSpace;
    error?: Error;
  }>();
  const [pendingData, setPendingData] = useState<{
    identity: string;
    value: VenueInquiry;
  } | null>(null);
  const identity = account?.id ?? 'guest';
  const pending = pendingData?.identity === identity ? pendingData.value : null;
  function setPending(value: VenueInquiry | null) {
    setPendingData(value ? { identity, value } : null);
  }
  const [files, setFiles] = useState<File[]>([]);
  const [mutationError, setMutationError] = useState(''),
    [unknown, setUnknown] = useState(false),
    [checking, setChecking] = useState(false);
  const [commandId, setCommandId] = useState(
    () => `INQUIRY-CREATE-${crypto.randomUUID()}`,
  );
  const summary = useRef<HTMLDivElement>(null);
  const lastAccount = useRef<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact: { name: '', email: '', phone: '', company: '' },
      needs: {
        av: false,
        catering: false,
        rooms: 0,
        budget: undefined,
        notes: '',
      },
      consent: false,
    },
    mode: 'onBlur',
  });
  const {
    register,
    handleSubmit,
    setValue,
    resetField,
    formState: { errors, isSubmitting },
  } = form;
  useEffect(() => {
    if (account) {
      setValue('contact.name', account.name);
      setValue('contact.email', account.email);
      setValue('contact.phone', account.phone);
    } else if (lastAccount.current) {
      resetField('contact');
    }
    lastAccount.current = account?.id ?? null;
  }, [account, setValue, resetField]);
  useEffect(() => {
    const controller = new AbortController();
    venueAdapter
      .getMeetingSpace(slug, scenario, controller.signal)
      .then((value) => setResponse({ key, ...value }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      });
    return () => controller.abort();
  }, [slug, scenario, key]);
  useEffect(() => {
    const id = sessionStorage.getItem(`gobuking:mice-pending:${slug}`);
    if (!id) return;
    let active = true;
    inquiryAdapter
      .getInquiry(id)
      .then((value) => {
        if (active && !value.verifiedAt)
          setPendingData({ identity: account?.id ?? 'guest', value });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [slug, account?.id]);
  const venue = response?.key === key ? response.venue : undefined,
    space = response?.key === key ? response.space : undefined,
    error = response?.key === key ? response.error : undefined;
  async function checkStatus() {
    setChecking(true);
    try {
      const value = await inquiryAdapter.resolveSubmission(commandId);
      if (value) {
        setPending(value);
        sessionStorage.setItem(
          `gobuking:mice-pending:${value.spaceId}`,
          value.id,
        );
        setUnknown(false);
        setMutationError('');
      } else
        setMutationError(
          'Pengiriman belum tercatat. Periksa data sebelum mencoba lagi.',
        );
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : 'Layanan venue sedang terganggu. Silakan coba lagi.',
      );
    } finally {
      setChecking(false);
    }
  }
  if (!venue || !space)
    return (
      <main id="main" className="venue-module page-container py-10">
        {error ? <VenueErrorPanel key={key} error={error} /> : <VenueLoading />}
      </main>
    );
  const pack =
    space.packages.find((p) => p.id === search.get('packageId')) ??
    space.packages[0];
  const parsed = eventSchema.safeParse(query);
  const estimate = parsed.success ? packageEstimate(pack, query) : null;
  const submit: React.FormEventHandler<HTMLFormElement> = (event) => {
    void handleSubmit(
      async (values) => {
        setMutationError('');
        setUnknown(false);
        try {
          const inquiry = await inquiryAdapter.createInquiry(
            {
              service: 'mice',
              spaceId: space.id,
              packageId: pack.id,
              event: query,
              contact: values.contact,
              needs: values.needs,
              consent: values.consent,
            },
            commandId,
            files,
            scenario,
          );
          setPending(inquiry);
          sessionStorage.setItem(
            `gobuking:mice-pending:${space.id}`,
            inquiry.id,
          );
        } catch (error) {
          setMutationError(
            error instanceof Error
              ? error.message
              : 'Layanan venue sedang terganggu. Silakan coba lagi.',
          );
          if (
            error instanceof Error &&
            'code' in error &&
            error.code === 'UNKNOWN'
          )
            setUnknown(true);
          requestAnimationFrame(() => summary.current?.focus());
        }
      },
      () => requestAnimationFrame(() => summary.current?.focus()),
    )(event);
  };
  return (
    <main id="main" className="venue-module page-container venue-inquiry-page">
      <Link
        className="venue-back"
        href={venueLink(`/mice/${space.slug}`, query, scenario, {
          packageId: pack.id,
        })}
      >
        <ArrowLeft size={17} />
        {t('Kembali ke detail ruang')}
      </Link>
      <VenueDemoNotice />
      <div className="venue-inquiry-heading">
        <p className="venue-kicker">{t('DARI RENCANA MENJADI PERTEMUAN')}</p>
        <h1>{t('Ceritakan kebutuhan acara Anda.')}</h1>
        <p>
          {t(
            'Satu inquiry untuk satu ruang. PIC venue akan membantu menyiapkan penawaran.',
          )}
        </p>
      </div>
      <VenueSteps />
      <div className="venue-inquiry-layout">
        <div>
          {pending ? (
            <ContactVerification
              inquiry={pending}
              onEdit={() => {
                sessionStorage.removeItem(`gobuking:mice-pending:${space.id}`);
                setPending(null);
                setCommandId(`INQUIRY-CREATE-${crypto.randomUUID()}`);
              }}
            />
          ) : (
            <form className="venue-inquiry-form" noValidate onSubmit={submit}>
              {(Object.keys(errors).length > 0 || mutationError) && (
                <div
                  className="venue-validation"
                  role="alert"
                  tabIndex={-1}
                  ref={summary}
                >
                  <strong>{t('Periksa data inquiry')}</strong>
                  {mutationError && <p>{t(mutationError)}</p>}
                  {Object.keys(errors).length > 0 && (
                    <p>
                      {t(
                        'Lengkapi nama PIC, perusahaan, kontak, kebutuhan, dan persetujuan.',
                      )}
                    </p>
                  )}
                  {unknown && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={checkStatus}
                      disabled={checking}
                    >
                      {t(
                        checking
                          ? 'Memeriksa status…'
                          : 'Periksa status pengiriman',
                      )}
                    </Button>
                  )}
                </div>
              )}
              <section>
                <h2>
                  <Building2 size={22} />
                  {t('Perusahaan & PIC acara')}
                </h2>
                {[
                  { key: 'name', label: 'Nama PIC', type: 'text' },
                  {
                    key: 'company',
                    label: 'Perusahaan / organisasi',
                    type: 'text',
                  },
                  { key: 'email', label: 'Email PIC', type: 'email' },
                  { key: 'phone', label: 'Nomor telepon PIC', type: 'tel' },
                ].map((item) => {
                  const field = item.key as keyof FormValues['contact'];
                  return (
                    <label className="venue-form-field" key={field}>
                      <span>
                        {t(item.label)} <b aria-hidden="true">*</b>
                      </span>
                      <input
                        type={item.type}
                        id={`inquiry-${field}`}
                        {...register(`contact.${field}`)}
                        readOnly={field === 'email' && !!account}
                        aria-invalid={!!errors.contact?.[field]}
                        autoComplete={
                          {
                            name: 'name',
                            email: 'email',
                            phone: 'tel',
                            company: 'organization',
                          }[field]
                        }
                      />
                      {errors.contact?.[field] && (
                        <small className="field-error">
                          {t(errors.contact[field]?.message)}
                        </small>
                      )}
                    </label>
                  );
                })}
              </section>
              <section>
                <h2>
                  <Presentation size={22} />
                  {t('Kebutuhan tambahan')}
                </h2>
                <label className="venue-form-field">
                  <span>{t('Anggaran acara (opsional, IDR)')}</span>
                  <input
                    type="number"
                    min={1}
                    step={100000}
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
                <label className="venue-form-field">
                  <span>{t('Kebutuhan kamar (opsional)')}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    {...register('needs.rooms', { valueAsNumber: true })}
                  />
                  {errors.needs?.rooms && (
                    <small className="field-error">
                      {t(errors.needs.rooms.message)}
                    </small>
                  )}
                </label>
                <div className="venue-requirement-checks">
                  <label>
                    <input type="checkbox" {...register('needs.av')} />
                    {t('Perlu peralatan audio visual')}
                  </label>
                  <label>
                    <input type="checkbox" {...register('needs.catering')} />
                    {t('Perlu katering')}
                  </label>
                </div>
                <label className="venue-form-field">
                  <span>{t('Catatan kebutuhan (opsional)')}</span>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    {...register('needs.notes')}
                    placeholder={t(
                      'Contoh: panggung, mikrofon, menu, atau kebutuhan akses khusus',
                    )}
                  />
                </label>
              </section>
              <section className="venue-attachment-upload">
                <h2>
                  <FileUp size={22} />
                  {t('Lampiran kebutuhan (opsional)')}
                </h2>
                <p>
                  {t(
                    'Maksimal 3 file PDF, JPEG, atau PNG, masing-masing 5 MB. Gunakan dokumen contoh tanpa data sensitif.',
                  )}
                </p>
                <input
                  type="file"
                  aria-label={t('Pilih lampiran kebutuhan')}
                  multiple
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
                {files.map((file, i) => (
                  <div className="venue-file-chip" key={`${file.name}-${i}`}>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      aria-label={t('Hapus lampiran {name}', {
                        name: file.name,
                      })}
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, index) => index !== i),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <small>
                  {t(
                    'Demo tidak mengunggah file. Isi file hanya disimpan sementara di memori tab dan hilang setelah muat ulang atau pergantian akun.',
                  )}
                </small>
              </section>
              <label className="venue-consent">
                <input type="checkbox" {...register('consent')} />
                <span>
                  {t(
                    'Saya menyetujui penggunaan data kontak untuk tindak lanjut inquiry dan memahami bahwa ini bukan reservasi terkonfirmasi.',
                  )}
                </span>
              </label>
              {errors.consent && (
                <p className="field-error">{t(errors.consent.message)}</p>
              )}
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isSubmitting || unknown || !parsed.success}
              >
                {isSubmitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ArrowRight />
                )}
                {t('Lanjut verifikasi email')}
              </Button>
              <p className="venue-privacy-note">
                <ShieldCheck size={16} />
                {t(
                  'Kontak disimpan hanya pada tab demo ini, tidak pada URL atau localStorage.',
                )}
              </p>
            </form>
          )}
        </div>
        <aside className="venue-inquiry-summary">
          <h2>{space.name}</h2>
          <p>{venue.name}</p>
          <EventSummary query={query} zone={venue.zone} />
          <span className="venue-summary-package">{t(pack.name)}</span>
          <div className="venue-estimate">
            <small>{t('Estimasi indikatif, bukan harga final')}</small>
            <strong>
              {estimate
                ? formatRupiah(estimate.total, locale)
                : t('Minta penawaran')}
            </strong>
          </div>
          <InquiryOnlyNotice />
          {!parsed.success && (
            <p className="field-error" role="alert">
              {t(parsed.error.issues[0].message)}
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
