'use client';
import Link from 'next/link';
import {
  WeddingNeedsSummary,
  WeddingPackageScope,
} from '@/features/wedding/components/shared';
import { WeddingSearchForm } from '@/features/wedding/components/wedding-search-form';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Info,
  LoaderCircle,
  MailCheck,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import { AccountAccess } from '@/features/account/components/account-access';
import { useDemoAccount } from '@/features/account/lib/demo-auth';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import { VenueError } from '@/features/venue/lib/adapter';
import { venueLink, venueScenario } from '@/features/venue/lib/query';
import {
  INQUIRY_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
} from '@/features/venue/lib/config';
import type { VenueInquiry } from '@/features/venue/lib/types';
import { QuoteVersionPanel } from './quote-version-panel';
import { SalesSimulator } from './sales-simulator';
import { ContactVerification } from './contact-verification';
import { EventSearchForm } from './event-search-form';
import {
  EventSummary,
  InquiryOnlyNotice,
  VenueDemoNotice,
  VenueErrorPanel,
  VenueLoading,
  useVenueClock,
} from './shared';
export function InquiryTracking({ id }: { id: string }) {
  const account = useDemoAccount();
  return (
    <InquiryTrackingBody key={`${id}:${account?.id ?? 'guest'}`} id={id} />
  );
}
function InquiryTrackingBody({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const account = useDemoAccount();
  const search = useSearchParams();
  const scenario = venueScenario(search);
  const identity = account?.id ?? 'guest';
  const key = `${id}:${identity}:${scenario}`;
  const [response, setResponse] = useState<{
    key: string;
    inquiry?: VenueInquiry;
    error?: Error;
  }>();
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [mutation, setMutation] = useState<{
    key: string;
    message: string;
    unknown?: boolean;
  }>();
  const [consent, setConsent] = useState<{
    quoteId: string;
    value: boolean;
  } | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const alert = useRef<HTMLDivElement>(null);
  const scheduleTitle = useRef<HTMLHeadingElement>(null);
  const now = useVenueClock();
  useEffect(() => {
    const controller = new AbortController();
    inquiryAdapter
      .getInquiry(id, scenario, controller.signal)
      .then((inquiry) => setResponse({ key, inquiry }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      });
    return () => controller.abort();
  }, [id, scenario, key, attempt]);
  const inquiry = response?.key === key ? response.inquiry : undefined,
    error = response?.key === key ? response.error : undefined;
  async function run(action: () => Promise<VenueInquiry>) {
    if (busy) return;
    setBusy(true);
    setMutation(undefined);
    try {
      const value = await action();
      setResponse({ key, inquiry: value });
    } catch (error) {
      setMutation({
        key,
        message:
          error instanceof Error
            ? error.message
            : 'Layanan venue sedang terganggu. Silakan coba lagi.',
        unknown: error instanceof VenueError && error.code === 'UNKNOWN',
      });
      requestAnimationFrame(() => alert.current?.focus());
    } finally {
      setBusy(false);
    }
  }
  function refresh() {
    setAttempt((n) => n + 1);
    setMutation(undefined);
  }
  function selectQuote(version: number) {
    const p = new URLSearchParams(window.location.search);
    p.set('quote', String(version));
    window.history.pushState(null, '', `/account/inquiries/${id}?${p}`);
    setConsent(null);
    setMutation(undefined);
  }
  async function download(attachmentId: string, name: string) {
    try {
      const file = await inquiryAdapter.getAttachment(id, attachmentId);
      const url = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setMutation({
        key,
        message:
          error instanceof Error
            ? error.message
            : 'Lampiran tidak dapat diakses.',
      });
    }
  }
  if (!inquiry)
    return (
      <main id="main" className="venue-module page-container venue-tracking">
        <Link
          className="venue-back"
          href={search.get('service') === 'wedding' ? '/wedding' : '/mice'}
        >
          <ArrowLeft size={17} />
          {t(
            search.get('service') === 'wedding'
              ? 'Kembali ke Wedding Venue'
              : 'Kembali ke MICE',
          )}
        </Link>
        <VenueDemoNotice
          service={search.get('service') === 'wedding' ? 'wedding' : 'mice'}
        />
        {error ? (
          error instanceof VenueError && error.code === '401' ? (
            <div className="venue-account-gate">
              <AccountAccess purpose="venue" onComplete={refresh} />
            </div>
          ) : (
            <VenueErrorPanel key={key} error={error} onRetry={refresh} />
          )
        ) : (
          <VenueLoading />
        )}
      </main>
    );
  if (!inquiry.verifiedAt)
    return (
      <main id="main" className="venue-module page-container venue-tracking">
        <VenueDemoNotice
          service={
            (inquiry?.service ?? search.get('service')) === 'wedding'
              ? 'wedding'
              : 'mice'
          }
        />
        <ContactVerification inquiry={inquiry} />
      </main>
    );
  const latest = inquiry.quotes.at(-1);
  const version = search.has('quote')
    ? Number(search.get('quote'))
    : latest?.version;
  const quote =
    inquiry.quotes.find((q) => q.version === version) ??
    (!search.has('quote') ? latest : undefined);
  const outdated = !!quote && quote.id !== latest?.id;
  const expired =
    !!quote &&
    (quote.status === 'expired' || Date.parse(quote.validUntil) <= now);
  const eligible =
    !!quote &&
    quote.id === latest?.id &&
    quote.status === 'sent' &&
    !expired &&
    !inquiry.event.flexible;
  const activeRequest =
    inquiry.request &&
    !['withdrawn', 'rejected', 'expired'].includes(inquiry.request.status);
  return (
    <main id="main" className="venue-module page-container venue-tracking">
      <Link
        className="venue-back"
        href={venueLink(
          `/${inquiry.service === 'wedding' ? 'wedding' : 'mice'}/${inquiry.spaceId}`,
          inquiry.event,
        )}
      >
        <ArrowLeft size={17} />
        {t('Kembali ke detail ruang')}
      </Link>
      <VenueDemoNotice
        service={
          (inquiry?.service ?? search.get('service')) === 'wedding'
            ? 'wedding'
            : 'mice'
        }
      />
      <div className="venue-tracking-heading">
        <div>
          <p className="venue-kicker">{t('INQUIRY & TINDAK LANJUT')}</p>
          <h1>{t('Rencana acara Anda, terpantau.')}</h1>
          <p>
            {inquiry.id} · {t(INQUIRY_STATUS_LABELS[inquiry.status])}
          </p>
        </div>
        <span>
          <MailCheck size={17} />
          {t('Email PIC terverifikasi')}
        </span>
      </div>
      <InquiryOnlyNotice />
      {mutation?.key === key && (
        <div
          className="venue-validation"
          role="alert"
          tabIndex={-1}
          ref={alert}
        >
          <p>{t(mutation.message)}</p>
          {mutation.unknown && (
            <Button variant="outline" onClick={refresh}>
              {t('Periksa status pengiriman')}
            </Button>
          )}
        </div>
      )}
      {inquiry.request && (
        <section
          className={`venue-request-state ${inquiry.request.status === 'accepted_for_contract' ? 'for-contract' : ''}`}
        >
          <CheckCircle2 size={26} />
          <div>
            <span>{inquiry.request.id}</span>
            <h2>{t(REQUEST_STATUS_LABELS[inquiry.request.status])}</h2>
            <p>
              {t(
                'Belum ada reservasi venue terkonfirmasi. Kesepakatan final dan kontrak ditindaklanjuti bersama PIC di luar platform.',
              )}
            </p>
            <small>
              {inquiry.request.quoteVersion === null
                ? t('Mengacu paket pilihan; harga final menunggu penawaran')
                : t('Mengacu penawaran versi {version}', {
                    version: inquiry.request.quoteVersion,
                  })}
            </small>
          </div>
        </section>
      )}
      <div className="venue-tracking-layout">
        <div>
          {search.has('quote') && !quote && (
            <div className="venue-version-warning" role="status">
              <Info size={20} />
              <div>
                <strong>{t('Versi penawaran tidak ditemukan')}</strong>
                {latest && (
                  <button
                    type="button"
                    onClick={() => selectQuote(latest.version)}
                  >
                    {t('Tinjau versi {version}', { version: latest.version })}
                  </button>
                )}
              </div>
            </div>
          )}
          {inquiry.service === 'wedding' &&
            !quote &&
            inquiry.request?.packageSnapshot && (
              <section className="venue-quote-panel">
                <h2>{t('Paket pilihan')}</h2>
                <p>{t(inquiry.request.packageSnapshot.name)}</p>
                <WeddingPackageScope pack={inquiry.request.packageSnapshot} />
              </section>
            )}
          <QuoteVersionPanel
            inquiry={inquiry}
            quote={quote}
            onSelect={selectQuote}
          />
          <section className="venue-request-review">
            {inquiry.service === 'wedding' &&
              quote &&
              (expired || outdated) && (
                <Button
                  variant="outline"
                  className="mb-4"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      inquiryAdapter.requestQuoteRefresh(
                        id,
                        `refresh:${quote.id}`,
                      ),
                    )
                  }
                >
                  {t('Minta pembaruan penawaran')}
                </Button>
              )}
            <h2>{t('Tinjau & ajukan permintaan booking')}</h2>
            <p>
              {t(
                'Permintaan meminta PIC memeriksa kesepakatan final. Tidak ada penguncian ruang atau pembayaran.',
              )}
            </p>
            {quote && (
              <>
                {outdated && (
                  <p className="venue-inline-note">
                    <Info size={17} />
                    {t(
                      'Versi lama tidak dapat diajukan. Pilih penawaran terbaru.',
                    )}
                  </p>
                )}
                {expired && (
                  <p className="venue-inline-note">
                    <Clock3 size={17} />
                    {t('Penawaran kedaluwarsa. Minta PIC memvalidasi ulang.')}
                  </p>
                )}
                {inquiry.event.flexible && (
                  <p className="venue-inline-note">
                    <Info size={17} />
                    {t(
                      'Tetapkan tanggal dan jam acara sebelum mengajukan permintaan.',
                    )}
                  </p>
                )}
                {!account ? (
                  <div className="venue-account-gate">
                    <AccountAccess purpose="venue" onComplete={refresh} />
                  </div>
                ) : activeRequest ? (
                  <p className="venue-inline-note">
                    <CheckCircle2 size={18} />
                    {t(
                      'Permintaan sudah tercatat. Pantau tindak lanjut dari PIC.',
                    )}
                  </p>
                ) : (
                  <>
                    <label className="venue-consent">
                      <input
                        type="checkbox"
                        checked={consent?.quoteId === quote.id && consent.value}
                        onChange={(e) =>
                          setConsent({
                            quoteId: quote.id,
                            value: e.target.checked,
                          })
                        }
                        disabled={!eligible}
                      />
                      <span>
                        {t(
                          'Saya menyetujui ketentuan penawaran ini dan memahami bahwa permintaan booking belum menjadi reservasi final.',
                        )}
                      </span>
                    </label>
                    <Button
                      className="mt-5 w-full"
                      disabled={
                        !eligible ||
                        (mutation?.key === key && mutation.unknown) ||
                        !(consent?.quoteId === quote.id && consent.value) ||
                        busy
                      }
                      onClick={() =>
                        run(() =>
                          inquiryAdapter.submitVenueRequest(
                            id,
                            quote.id,
                            quote.version,
                            `request:${id}:${quote.id}`,
                            consent?.quoteId === quote.id && consent.value,
                            scenario,
                          ),
                        )
                      }
                    >
                      {busy ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <ArrowRight />
                      )}
                      {t('Ajukan permintaan booking')}
                    </Button>
                  </>
                )}
                {activeRequest &&
                  account &&
                  !['accepted_for_contract'].includes(
                    inquiry.request!.status,
                  ) && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          inquiryAdapter.withdrawRequest(
                            id,
                            `withdraw:${inquiry.request!.id}`,
                          ),
                        )
                      }
                    >
                      {t('Tarik permintaan')}
                    </Button>
                  )}
              </>
            )}
          </section>
          <section className="venue-timeline">
            <h2>{t('Riwayat tindak lanjut')}</h2>
            <ol>
              {inquiry.history.map((item) => (
                <li key={item.id}>
                  <span />
                  <div>
                    <strong>{t(item.label, item.values)}</strong>
                    <time dateTime={item.at}>
                      {new Intl.DateTimeFormat(
                        locale === 'en' ? 'en-GB' : 'id-ID',
                        {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: inquiry.zone,
                        },
                      ).format(new Date(item.at))}{' '}
                      · {inquiry.zone}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <SalesSimulator
            inquiry={inquiry}
            busy={busy || !!(mutation?.key === key && mutation.unknown)}
            onAction={(action) =>
              run(() =>
                inquiryAdapter.simulateSales(
                  id,
                  action,
                  `sales:${crypto.randomUUID()}`,
                ),
              )
            }
          />
        </div>
        <aside className="venue-tracking-summary">
          <span className="venue-summary-icon">
            <FileText />
          </span>
          <h2>{inquiry.spaceName}</h2>
          <p>{inquiry.venueName}</p>
          <EventSummary
            query={inquiry.event}
            zone={inquiry.zone}
            service={inquiry.service}
          />
          <div className="venue-pic">
            <UserRound size={20} />
            <div>
              <strong>
                {inquiry.pic?.name ?? t('Menunggu penugasan PIC')}
              </strong>
              <p>{inquiry.pic?.team ?? inquiry.venueName}</p>
            </div>
          </div>
          <p className="venue-inline-note">
            <Clock3 size={17} />
            {t('Target respons demo: 1 hari kerja, bukan SLA produksi.')}
          </p>
          {inquiry.responseDueAt && (
            <small>
              {new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: inquiry.zone,
              }).format(new Date(inquiry.responseDueAt))}{' '}
              · {inquiry.zone}
            </small>
          )}
          <dl className="venue-contact-summary">
            <div>
              <dt>{t('Perusahaan')}</dt>
              <dd>{inquiry.contact.company || t('Acara pribadi')}</dd>
            </div>
            <div>
              <dt>{t('PIC acara')}</dt>
              <dd>{inquiry.contact.name}</dd>
            </div>
            <div>
              <dt>{t('Email PIC')}</dt>
              <dd>{inquiry.contact.email}</dd>
            </div>
            <div>
              <dt>{t('Kebutuhan tambahan')}</dt>
              <dd>
                {t(
                  inquiry.needs.av
                    ? 'Audio visual diperlukan'
                    : 'Tanpa kebutuhan audio visual',
                )}{' '}
                ·{' '}
                {t(
                  inquiry.needs.catering
                    ? 'Katering diperlukan'
                    : 'Tanpa kebutuhan katering',
                )}{' '}
                · {t('{count} kamar', { count: inquiry.needs.rooms })}
              </dd>
            </div>
            {inquiry.needs.notes && (
              <div>
                <dt>{t('Catatan kebutuhan')}</dt>
                <dd>{inquiry.needs.notes}</dd>
              </div>
            )}
          </dl>
          {inquiry.wedding && <WeddingNeedsSummary needs={inquiry.wedding} />}
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full mt-3"
                variant="outline"
                disabled={!!activeRequest}
              >
                {t('Perbarui kebutuhan acara')}
              </Button>
            </DialogTrigger>
            <DialogContent
              className={`venue-module venue-needs-dialog ${inquiry.service === 'wedding' ? 'wedding-module' : ''}`}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                scheduleTitle.current?.focus();
              }}
            >
              <DialogTitle
                ref={scheduleTitle}
                tabIndex={-1}
                className="text-xl font-bold"
              >
                {t('Perbarui kebutuhan acara')}
              </DialogTitle>
              <DialogDescription className="my-3">
                {t(
                  'Perubahan kebutuhan membuat penawaran lama perlu diperbarui oleh PIC.',
                )}
              </DialogDescription>
              {inquiry.service === 'wedding' ? (
                <WeddingSearchForm
                  initial={{
                    ...inquiry.event,
                    layout: inquiry.event.layout as 'banquet' | 'standing',
                  }}
                  onApply={async (q) => {
                    const value = await inquiryAdapter.reviseInquiryNeeds(
                      id,
                      q,
                      `needs:${crypto.randomUUID()}`,
                    );
                    setResponse({ key, inquiry: value });
                    setScheduleOpen(false);
                    setConsent(null);
                  }}
                />
              ) : (
                <EventSearchForm
                  initial={inquiry.event}
                  onApply={async (q) => {
                    const value = await inquiryAdapter.reviseInquiryNeeds(
                      id,
                      q,
                      `needs:${crypto.randomUUID()}`,
                    );
                    setResponse({ key, inquiry: value });
                    setScheduleOpen(false);
                    setConsent(null);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
          {inquiry.attachments.length > 0 && (
            <section className="venue-private-attachments">
              <h3>{t('Lampiran kebutuhan')}</h3>
              {inquiry.attachments.map((file) => (
                <button
                  type="button"
                  key={file.id}
                  onClick={() => download(file.id, file.name)}
                >
                  <Download size={16} />
                  <span>{file.name}</span>
                </button>
              ))}
              <small>
                {t(
                  'Akses lampiran diperiksa terhadap pemilik inquiry. File demo bersifat sementara.',
                )}
              </small>
            </section>
          )}
          <Button variant="ghost" className="w-full mt-4" onClick={refresh}>
            <RefreshCw />
            {t('Periksa status')}
          </Button>
        </aside>
      </div>
    </main>
  );
}
