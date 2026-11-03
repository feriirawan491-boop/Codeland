'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Info,
  LoaderCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import { AccountAccess } from '@/features/account/components/account-access';
import { useDemoAccount } from '@/features/account/lib/demo-auth';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import { VenueError } from '@/features/venue/lib/adapter';
import { spaceAvailable } from '@/features/venue/lib/resources';
import type { VenueInquiry } from '@/features/venue/lib/types';
import type { WeddingQuery } from '@/features/venue/lib/wedding-types';
import {
  VenueLoading,
  VenueErrorPanel,
  useVenueClock,
} from '@/features/mice/components/shared';
import { QuoteVersionPanel } from '@/features/mice/components/quote-version-panel';
import { weddingAdapter } from '../lib/adapter';
import {
  parseWeddingQuery,
  weddingParams,
  weddingLink,
  weddingScenario,
  weddingQuerySchema,
} from '../lib/query';
import {
  WeddingNotice,
  WeddingSummary,
  WeddingScope,
  WeddingPackageScope,
} from './shared';
import { WeddingSearchForm } from './wedding-search-form';
export function WeddingRequest({ slug }: { slug: string }) {
  const account = useDemoAccount();
  return (
    <WeddingRequestBody key={`${slug}:${account?.id ?? 'guest'}`} slug={slug} />
  );
}
function WeddingRequestBody({ slug }: { slug: string }) {
  const { t } = useI18n();
  const account = useDemoAccount();
  const router = useRouter();
  const search = useSearchParams();
  const raw = search.toString();
  const now = useVenueClock();
  const queryKey = weddingParams(parseWeddingQuery(search)).toString();
  const query = useMemo(
    () => parseWeddingQuery(new URLSearchParams(queryKey)),
    [queryKey],
  );
  const scenario = weddingScenario(search),
    key = `${slug}:${scenario}`;
  const inquiryId = search.get('inquiry') ?? '';
  const [resource, setResource] = useState<{
    key: string;
    value?: Awaited<ReturnType<typeof weddingAdapter.getWeddingVenue>>;
    error?: Error;
  }>();
  const [reference, setReference] = useState<{
    key: string;
    value?: VenueInquiry;
    error?: Error;
  }>();
  const referenceKey = `${inquiryId}:${account?.id ?? 'guest'}`;
  const [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [unknown, setUnknown] = useState(false);
  const alert = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    weddingAdapter
      .getWeddingVenue(slug, scenario, controller.signal)
      .then((value) => setResource({ key, value }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResource({ key, error });
      });
    return () => controller.abort();
  }, [slug, scenario, key]);
  useEffect(() => {
    if (!inquiryId) return;
    const controller = new AbortController();
    inquiryAdapter
      .getInquiry(inquiryId, 'ready', controller.signal)
      .then((value) => {
        if (value.service !== 'wedding' || value.spaceId !== slug)
          throw new VenueError(
            '403',
            'Penawaran tidak sesuai dengan area pernikahan ini.',
          );
        setReference({ key: referenceKey, value });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setReference({ key: referenceKey, error });
      });
    return () => controller.abort();
  }, [inquiryId, slug, referenceKey]);
  const data = resource?.key === key ? resource.value : undefined;
  const ref = reference?.key === referenceKey ? reference.value : undefined;
  const pack =
    data?.space.packages.find(
      (p) => p.id === (ref?.packageId ?? search.get('packageId')),
    ) ?? data?.space.packages[0];
  const actualQuery = ref
    ? { ...ref.event, layout: ref.event.layout as WeddingQuery['layout'] }
    : query;
  const draftKey = `${account?.id ?? 'guest'}:${slug}:${weddingParams(actualQuery)}:${pack?.id ?? ''}:${inquiryId}`;
  const [draft, setDraft] = useState<{ key: string; commandId: string }>();
  useEffect(() => {
    const storageKey = `gobuking:wedding-request-draft:${draftKey}`;
    let commandId = sessionStorage.getItem(storageKey);
    if (!commandId) {
      commandId = `WED-REQUEST-${crypto.randomUUID()}`;
      sessionStorage.setItem(storageKey, commandId);
    }
    Promise.resolve().then(() =>
      setDraft({ key: draftKey, commandId: commandId! }),
    );
  }, [draftKey]);
  const commandId = draft?.key === draftKey ? draft.commandId : undefined;
  const quote = ref?.quotes.find(
    (q) =>
      q.version ===
      (search.has('quote')
        ? Number(search.get('quote'))
        : ref.quotes.at(-1)?.version),
  );
  const latest = ref?.quotes.at(-1);
  const valid = weddingQuerySchema.safeParse(actualQuery);
  const available =
    !!data &&
    valid.success &&
    actualQuery.locationId === data.venue.locationId &&
    !actualQuery.flexible &&
    (data.space.capacity[actualQuery.layout] ?? 0) >=
      actualQuery.participants &&
    spaceAvailable(data.space, actualQuery, data.venue) &&
    scenario !== 'blocked';
  const quoteValid =
    !inquiryId ||
    (!!quote &&
      quote.id === latest?.id &&
      quote.status === 'sent' &&
      Date.parse(quote.validUntil) > now);
  async function reconcile() {
    setBusy(true);
    try {
      const value = inquiryId
        ? await inquiryAdapter.getInquiry(inquiryId)
        : await inquiryAdapter.resolveSubmission(`${commandId}:inquiry`);
      if (value?.request)
        router.push(`/account/inquiries/${value.id}?service=wedding`);
      else
        setError(
          'Permintaan belum tercatat. Periksa status sebelum mencoba lagi.',
        );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Layanan venue sedang terganggu. Silakan coba lagi.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!data || !pack || !commandId || busy) return;
    setBusy(true);
    setError('');
    try {
      const value =
        ref && quote
          ? await inquiryAdapter.submitVenueRequest(
              ref.id,
              quote.id,
              quote.version,
              commandId,
              consent,
              scenario,
            )
          : await inquiryAdapter.createWeddingRequest(
              {
                spaceId: data.space.id,
                packageId: pack.id,
                event: actualQuery,
                needs: { av: false, catering: false, rooms: 0, notes: '' },
                wedding: {
                  alternativeDates: [],
                  siteVisit: false,
                  siteVisitDate: '',
                  ceremony: 'both',
                  decoration: false,
                },
                consent,
              },
              commandId,
              scenario,
            );
      router.push(`/account/inquiries/${value.id}?service=wedding`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Layanan venue sedang terganggu. Silakan coba lagi.',
      );
      setUnknown(error instanceof VenueError && error.code === 'UNKNOWN');
      requestAnimationFrame(() => alert.current?.focus());
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <main
        id="main"
        className="venue-module wedding-module page-container py-10"
      >
        {resource?.key === key && resource.error ? (
          <VenueErrorPanel error={resource.error} />
        ) : (
          <VenueLoading />
        )}
      </main>
    );
  if (inquiryId && (!ref || reference?.error))
    return (
      <main
        id="main"
        className="venue-module wedding-module page-container py-10"
      >
        <WeddingNotice />
        {reference?.key === referenceKey && reference.error ? (
          reference.error instanceof VenueError &&
          reference.error.code === '401' ? (
            <AccountAccess purpose="venue" />
          ) : (
            <VenueErrorPanel error={reference.error} />
          )
        ) : (
          <VenueLoading />
        )}
      </main>
    );
  return (
    <main
      id="main"
      className="venue-module wedding-module page-container wedding-request"
    >
      <Link
        className="venue-back"
        href={weddingLink(`/wedding/${slug}`, actualQuery, scenario, {
          packageId: pack!.id,
        })}
      >
        <ArrowLeft size={17} />
        {t('Kembali ke detail Wedding Venue')}
      </Link>
      <WeddingNotice />
      <div className="venue-inquiry-heading">
        <p className="venue-kicker">{t('SATU LANGKAH MENUJU KESEPAKATAN')}</p>
        <h1>{t('Tinjau permintaan pernikahan Anda.')}</h1>
        <p>
          {t(
            'Paket, tanggal, dan jumlah tamu tetap tersimpan saat Anda masuk atau mendaftar.',
          )}
        </p>
      </div>
      <WeddingScope />
      <div className="venue-inquiry-layout wedding-request-layout">
        <div>
          {inquiryId && quote ? (
            <QuoteVersionPanel
              inquiry={ref!}
              quote={quote}
              onSelect={(version) => {
                const p = new URLSearchParams(raw);
                p.set('quote', String(version));
                router.replace(`/wedding/${slug}/request?${p}`);
                setConsent(false);
              }}
            />
          ) : (
            <section className="wedding-request-plan">
              <h2>{t('Rencana perayaan')}</h2>
              <WeddingSearchForm
                key={queryKey}
                initial={query}
                onApply={async (value) =>
                  router.replace(
                    weddingLink(`/wedding/${slug}/request`, value, scenario, {
                      packageId: pack!.id,
                    }),
                  )
                }
              />
              <label className="venue-form-field">
                <span>{t('Paket pilihan')}</span>
                <select
                  aria-label={t('Paket pilihan')}
                  value={pack!.id}
                  onChange={(event) => {
                    const p = new URLSearchParams(raw);
                    p.set('packageId', event.target.value);
                    router.replace(`/wedding/${slug}/request?${p}`);
                    setConsent(false);
                  }}
                >
                  {data.space.packages.map((item) => (
                    <option value={item.id} key={item.id}>
                      {t(item.name)}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          )}
          <section className="venue-request-review">
            <h2>{t('Akun & persetujuan')}</h2>
            {!account ? (
              <AccountAccess purpose="venue" />
            ) : ref?.request &&
              !['withdrawn', 'rejected', 'expired'].includes(
                ref.request.status,
              ) ? (
              <>
                <p>
                  {t(
                    'Permintaan sudah tercatat. Pantau tindak lanjut dari PIC.',
                  )}
                </p>
                <Button asChild className="mt-4">
                  <Link href={`/account/inquiries/${ref.id}?service=wedding`}>
                    {t('Lihat status permintaan')}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="wedding-signed-in">
                  <Check size={18} />
                  {t('Mengajukan sebagai {name}', { name: account.name })}
                </p>
                {!available && (
                  <p className="venue-capacity-warning">
                    <Info size={18} />
                    {t(
                      actualQuery.flexible
                        ? 'Pilih tanggal pasti sebelum mengajukan permintaan.'
                        : 'Periksa kapasitas, jam, dan ketersediaan area.',
                    )}
                  </p>
                )}
                {!quoteValid && (
                  <p className="venue-capacity-warning">
                    {t(
                      'Penawaran lama atau kedaluwarsa tidak dapat diajukan. Tinjau versi terbaru dari tracking.',
                    )}
                  </p>
                )}
                <label className="venue-consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  <span>
                    {t(
                      'Saya memahami isi paket, batas jam, dan aturan venue serta bahwa permintaan ini belum menjadi reservasi final atau pembayaran.',
                    )}
                  </span>
                </label>
                {error && (
                  <div
                    className="venue-validation"
                    role="alert"
                    tabIndex={-1}
                    ref={alert}
                  >
                    <p>{t(error)}</p>
                    {unknown && (
                      <Button
                        variant="outline"
                        onClick={reconcile}
                        disabled={busy}
                      >
                        {t('Periksa status pengiriman')}
                      </Button>
                    )}
                  </div>
                )}
                <Button
                  className="mt-5 w-full"
                  disabled={
                    !consent ||
                    !available ||
                    !quoteValid ||
                    busy ||
                    unknown ||
                    !commandId
                  }
                  onClick={submit}
                >
                  {busy ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <ArrowRight />
                  )}
                  {t('Ajukan permintaan booking')}
                </Button>
                <p className="venue-privacy-note">
                  {t(
                    inquiryId
                      ? 'Permintaan mengacu pada versi penawaran yang Anda tinjau.'
                      : 'Belum ada quote final. PIC akan memeriksa paket dan kebutuhan sebelum menyepakati harga.',
                  )}
                </p>
              </>
            )}
          </section>
        </div>
        <aside className="venue-inquiry-summary">
          <span className="venue-summary-icon">
            <Heart />
          </span>
          <h2>{data.space.name}</h2>
          <p>{data.venue.name}</p>
          <WeddingSummary query={actualQuery} zone={data.venue.zone} />
          <div className="wedding-selected-package">
            <strong>{t(pack!.name)}</strong>
            <WeddingPackageScope pack={pack!} />
          </div>
          <p className="venue-inline-note">
            <Info size={17} />
            {t(
              'Tidak ada invoice pembayaran, voucher, atau jaminan tanggal pada tahap permintaan.',
            )}
          </p>
        </aside>
      </div>
    </main>
  );
}
