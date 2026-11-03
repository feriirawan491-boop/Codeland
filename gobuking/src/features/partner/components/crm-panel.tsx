'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { readPartnerFile, readPartnerInquiryAttachment } from '../lib/files';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  savePartnerQuoteDraft,
  sendPartnerQuote,
  updatePartnerLead,
} from '../lib/crm';
import {
  INQUIRY_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
} from '@/features/venue/lib/config';
import { maskedEmail } from '../lib/sources';
import type { partnerAdapter } from '../lib/adapter';
import {
  usePartnerAction,
  usePartnerNow,
  Feedback,
  FormField,
  field,
  uploaded,
  FileInput,
  money,
  Empty,
} from './shared';
type Workspace = Awaited<ReturnType<typeof partnerAdapter.getWorkspace>>;
export function CrmPanel({
  data,
  reload,
}: {
  data: Workspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    now = usePartnerNow(),
    a = usePartnerAction(reload),
    params = useSearchParams(),
    router = useRouter(),
    filter = params.get('status') ?? '';
  function download(
    inquiry: string,
    id: string,
    name: string,
    customer = false,
  ) {
    return a.run(async () => {
      const file = customer
        ? readPartnerInquiryAttachment(inquiry, id)
        : readPartnerFile(`quote:${inquiry}`, id);
      const url = URL.createObjectURL(file),
        link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'Lampiran disiapkan.');
  }
  const rows = data.inquiries.filter((v) => !filter || v.status === filter);
  return (
    <>
      <div className="ptr-notice">
        {t(
          'Venue CRM mengelola inquiry dan penawaran. Penawaran belum mengonfirmasi reservasi dan belum membuka pembayaran.',
        )}
      </div>
      <FormField label="Status inquiry">
        <select
          value={filter}
          onChange={(e) =>
            router.replace(e.target.value ? `?status=${e.target.value}` : '?', {
              scroll: false,
            })
          }
        >
          <option value="">{t('Semua status')}</option>
          {Object.entries(INQUIRY_STATUS_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {t(label)}
            </option>
          ))}
        </select>
      </FormField>
      {!rows.length && <Empty title="Belum ada inquiry venue" />}
      {rows.map((v) => {
        const draft = data.quoteDrafts.find((d) => d.inquiryId === v.id),
          latest = v.quotes.at(-1);
        return (
          <article className="ptr-card" key={v.id}>
            <span className="ptr-eyebrow">
              {v.service.toUpperCase()} · {v.id}
            </span>
            <h3>{v.spaceName}</h3>
            {v.attachments.length > 0 ||
            v.quotes.some((q) => data.quoteFiles[q.id]?.length) ||
            draft?.files.length ? (
              <details>
                <summary>{t('Lampiran privat inquiry & penawaran')}</summary>
                {v.attachments.map((f) => (
                  <button
                    className="ptr-text-button"
                    key={f.id}
                    onClick={() => download(v.id, f.id, f.name, true)}
                  >
                    {f.name}
                  </button>
                ))}
                {v.quotes.map((q) =>
                  (data.quoteFiles[q.id] ?? []).map((f) => (
                    <button
                      className="ptr-text-button"
                      key={f.id}
                      onClick={() => download(v.id, f.id, f.name)}
                    >
                      {t('Versi')} {q.version} · {f.name}
                    </button>
                  )),
                )}
                {draft?.files.map((f) => (
                  <button
                    className="ptr-text-button"
                    key={f.id}
                    onClick={() => download(v.id, f.id, f.name)}
                  >
                    {t('Draft')} · {f.name}
                  </button>
                ))}
              </details>
            ) : null}
            <p>
              {v.contact.name} · {maskedEmail(v.contact.email)}
            </p>
            <div className="ptr-badges">
              <span>{t(INQUIRY_STATUS_LABELS[v.status])}</span>
              <span>
                {t(
                  v.verifiedAt
                    ? 'Kontak terverifikasi'
                    : 'Kontak belum terverifikasi',
                )}
              </span>
            </div>
            <p>
              {t('PIC')}: {v.pic?.name ?? t('Belum ditugaskan')} ·{' '}
              {t('Batas respons')}:{' '}
              {v.responseDueAt
                ? new Date(v.responseDueAt).toLocaleString()
                : '—'}
            </p>
            <details>
              <summary>{t('Assignment & tindak lanjut')}</summary>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await a.run(() =>
                    updatePartnerLead(v.id, 'assign', field(f, 'member')),
                  );
                }}
              >
                <FormField label="PIC berizin">
                  <select name="member" required>
                    {data.context.memberships
                      .filter(
                        (m) =>
                          m.orgId === data.context.organization.id &&
                          m.role !== 'finance' &&
                          (m.role === 'owner' ||
                            m.listingIds.includes(v.listingId)),
                      )
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                  </select>
                </FormField>
                <button className="ptr-button secondary" disabled={a.busy}>
                  {t('Tugaskan PIC')}
                </button>
              </form>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await a.run(() =>
                    updatePartnerLead(
                      v.id,
                      field(f, 'action') as 'response' | 'won' | 'lost',
                      field(f, 'message'),
                    ),
                  );
                }}
              >
                <FormField label="Hasil tindak lanjut">
                  <select name="action">
                    <option value="response">
                      {t('Respons / pembahasan')}
                    </option>
                    <option value="won">
                      {t('Hasil tindak lanjut tercatat')}
                    </option>
                    <option value="lost">{t('Tidak dilanjutkan')}</option>
                  </select>
                </FormField>
                <FormField label="Respons / alasan hasil">
                  <textarea name="message" required minLength={10} />
                </FormField>
                <button className="ptr-button secondary" disabled={a.busy}>
                  {t('Simpan tindak lanjut')}
                </button>
              </form>
            </details>
            <details>
              <summary>
                {t('Riwayat versi penawaran')} · {v.quotes.length}
              </summary>
              {v.quotes.map((q) => (
                <div className="ptr-inset" key={q.id}>
                  <strong>
                    {t('Versi')} {q.version} · {money(q.total)}
                  </strong>
                  <p>
                    {t(QUOTE_STATUS_LABELS[q.status])} · {t('Berlaku sampai')}:{' '}
                    {new Date(q.validUntil).toLocaleString()}
                  </p>
                  {q.lines.map((l, i) => (
                    <p key={i}>
                      {t(l.label)}: {money(l.amount)}
                    </p>
                  ))}
                  <p>{q.terms.map((v) => t(v)).join(' ')}</p>
                  {q.status === 'superseded' && (
                    <p>{t('Versi lama hanya dapat dibaca.')}</p>
                  )}
                </div>
              ))}
            </details>
            <details>
              <summary>{t('Susun draft penawaran baru')}</summary>
              <p>
                {t('Perubahan dibanding versi terakhir')}:{' '}
                {latest
                  ? `${t('Versi')} ${latest.version} · ${money(latest.total)}`
                  : t('Penawaran pertama')}
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await a.run(
                    () =>
                      savePartnerQuoteDraft(
                        v.id,
                        {
                          lines: [
                            {
                              label: field(f, 'label'),
                              amount: Number(f.get('base')),
                            },
                          ],
                          tax: Number(f.get('tax')),
                          serviceFee: Number(f.get('fee')),
                          validUntil: field(f, 'expiry'),
                          terms: field(f, 'terms'),
                        },
                        uploaded(f),
                      ),
                    'Draft penawaran tersimpan; belum dikirim.',
                  );
                }}
              >
                <FormField label="Nama item ruang / paket">
                  <input
                    name="label"
                    defaultValue={
                      draft?.lines[0]?.label ?? 'Ruang dan paket acara'
                    }
                    required
                    minLength={3}
                  />
                </FormField>
                <div className="ptr-grid three">
                  <FormField label="Nilai item (IDR)">
                    <input
                      name="base"
                      type="number"
                      min={1}
                      required
                      defaultValue={
                        draft?.lines[0]?.amount ?? latest?.base ?? 5000000
                      }
                    />
                  </FormField>
                  <FormField label="Pajak (IDR)">
                    <input
                      name="tax"
                      type="number"
                      min={0}
                      required
                      defaultValue={draft?.tax ?? latest?.tax ?? 500000}
                    />
                  </FormField>
                  <FormField label="Biaya layanan (IDR)">
                    <input
                      name="fee"
                      type="number"
                      min={0}
                      required
                      defaultValue={
                        draft?.serviceFee ?? latest?.serviceFee ?? 250000
                      }
                    />
                  </FormField>
                </div>
                <FormField label="Berlaku sampai (waktu lokal perangkat)">
                  <input
                    name="expiry"
                    type="datetime-local"
                    required
                    defaultValue={
                      draft?.validUntil.slice(0, 16) ??
                      new Date(
                        now + 86400000 - new Date().getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .slice(0, 16)
                    }
                  />
                </FormField>
                <FormField label="Ketentuan penawaran">
                  <textarea
                    name="terms"
                    required
                    minLength={20}
                    defaultValue={
                      draft?.terms ??
                      'Penawaran untuk pembahasan kontrak. Tanggal dan layanan harus disepakati tertulis dengan PIC. Belum ada reservasi terkonfirmasi.'
                    }
                  />
                </FormField>
                <FileInput />
                <button
                  className="ptr-button secondary"
                  disabled={a.busy || !v.verifiedAt}
                >
                  {t('Simpan draft penawaran')}
                </button>
              </form>
              {draft && (
                <div className="ptr-inset">
                  <h4>
                    {t('Draft siap ditinjau')} · v{draft.baseVersion + 1}
                  </h4>
                  <p>
                    {t('Total penawaran')}:{' '}
                    {money(
                      draft.lines.reduce((n, l) => n + l.amount, 0) +
                        draft.tax +
                        draft.serviceFee,
                    )}
                  </p>
                  <p>
                    {t('Selisih terhadap versi terakhir')}:{' '}
                    {money(
                      draft.lines.reduce((n, l) => n + l.amount, 0) +
                        draft.tax +
                        draft.serviceFee -
                        (latest?.total ?? 0),
                    )}
                  </p>
                  <p>
                    {t(
                      'Mengirim versi baru menggantikan versi lama yang masih aktif.',
                    )}
                  </p>
                  <button
                    className="ptr-button"
                    disabled={a.busy}
                    onClick={() =>
                      a.run(
                        () =>
                          sendPartnerQuote(
                            v.id,
                            draft.version,
                            crypto.randomUUID(),
                          ),
                        'Penawaran baru dikirim. Versi sebelumnya hanya baca.',
                      )
                    }
                  >
                    {t('Kirim penawaran baru')}
                  </button>
                </div>
              )}
            </details>
          </article>
        );
      })}
      <Feedback {...a} />
    </>
  );
}
