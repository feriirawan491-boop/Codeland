'use client';
import { useState } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  saveBusinessDraft,
  submitBusinessVerification,
  requestBankChange,
  closePartnerSales,
} from '../lib/business';
import { BUSINESS_STATUS } from '../lib/config';
import { readPartnerFile } from '../lib/files';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { PartnerContext } from '../lib/types';
import {
  usePartnerAction,
  Feedback,
  FormField,
  field,
  uploaded,
  FileInput,
} from './shared';
export function BusinessPanel({
  ctx,
  reload,
}: {
  ctx: PartnerContext;
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = usePartnerAction(reload),
    o = ctx.organization,
    [close, setClose] = useState(false),
    [reason, setReason] = useState('');
  return (
    <>
      <div className="ptr-grid">
        <section className="ptr-card">
          <h2>{t('Profil usaha')}</h2>
          <span className="ptr-badge">{t(BUSINESS_STATUS[o.status])}</span>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await a.run(() =>
                saveBusinessDraft(
                  {
                    name: field(f, 'name'),
                    email: field(f, 'email'),
                    phone: field(f, 'phone'),
                    address: field(f, 'address'),
                  },
                  o.version,
                  uploaded(f),
                  f.get('contract') === 'on',
                ),
              );
            }}
          >
            <FormField label="Nama usaha">
              <input
                name="name"
                defaultValue={o.name}
                required
                minLength={3}
                disabled={!ctx.capabilities.includes('business')}
              />
            </FormField>
            <FormField label="Email usaha">
              <input
                name="email"
                type="email"
                defaultValue={o.email}
                required
                disabled={!ctx.capabilities.includes('business')}
              />
            </FormField>
            <FormField label="Telepon usaha">
              <input
                name="phone"
                type="tel"
                defaultValue={o.phone}
                required
                disabled={!ctx.capabilities.includes('business')}
              />
            </FormField>
            <FormField label="Alamat usaha">
              <textarea
                name="address"
                defaultValue={o.address}
                minLength={10}
                required
                disabled={!ctx.capabilities.includes('business')}
              />
            </FormField>
            {ctx.capabilities.includes('business') && (
              <>
                <FileInput />
                <label className="ptr-check">
                  <input
                    type="checkbox"
                    name="contract"
                    defaultChecked={!!o.contract.acceptedAt}
                  />
                  {t('Saya menyetujui perjanjian mitra versi {version}.', {
                    version: o.contract.version,
                  })}
                </label>
                <div className="ptr-actions">
                  <button className="ptr-button" disabled={a.busy}>
                    {t('Simpan draft usaha')}
                  </button>
                  <button
                    type="button"
                    className="ptr-button secondary"
                    disabled={a.busy || o.status === 'under_review'}
                    onClick={() =>
                      a.run(
                        submitBusinessVerification,
                        'Usaha diajukan untuk verifikasi platform.',
                      )
                    }
                  >
                    {t('Ajukan verifikasi')}
                  </button>
                </div>
              </>
            )}
          </form>
          <h3>{t('Dokumen & perjanjian')}</h3>
          <p>
            {t('Versi perjanjian')}: {o.contract.version} ·{' '}
            {t(o.contract.acceptedAt ? 'Disetujui' : 'Belum disetujui')}
          </p>
          {o.documents.map((f) => (
            <button
              key={f.id}
              className="ptr-text-button"
              disabled={!ctx.capabilities.includes('business')}
              onClick={() =>
                a.run(async () => {
                  const file = readPartnerFile(`business:${o.id}`, f.id),
                    url = URL.createObjectURL(file),
                    link = document.createElement('a');
                  link.href = url;
                  link.download = file.name;
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }, 'Dokumen disiapkan.')
              }
            >
              {f.name}
            </button>
          ))}
        </section>
        <div>
          <section className="ptr-card">
            <h2>{t('Rekening pencairan')}</h2>
            <p>
              {o.bank
                ? `${o.bank.name} · •••• ${o.bank.last4}`
                : t('Belum ada rekening terverifikasi')}
            </p>
            <p className="ptr-muted">
              {t(
                'Perubahan rekening memerlukan verifikasi ulang. Rekening pada payout historis tetap tersimpan.',
              )}
            </p>
            {o.pendingBank && (
              <div className="ptr-notice">
                {t('Rekening baru menunggu verifikasi')}: {o.pendingBank.name} ·
                •••• {o.pendingBank.last4}
              </div>
            )}
            {ctx.capabilities.includes('bank') ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget,
                    f = new FormData(form);
                  if (
                    await a.run(
                      () =>
                        requestBankChange({
                          name: field(f, 'bank'),
                          holder: field(f, 'holder'),
                          number: field(f, 'number'),
                        }),
                      'Perubahan rekening diajukan untuk verifikasi ulang.',
                    )
                  )
                    form.reset();
                }}
              >
                <FormField label="Nama bank">
                  <input name="bank" required minLength={2} />
                </FormField>
                <FormField label="Pemilik rekening">
                  <input name="holder" required minLength={2} />
                </FormField>
                <FormField label="Nomor rekening baru">
                  <input
                    name="number"
                    inputMode="numeric"
                    pattern="[0-9]{8,20}"
                    required
                    autoComplete="off"
                  />
                </FormField>
                <button className="ptr-button" disabled={a.busy}>
                  {t('Ajukan perubahan rekening')}
                </button>
              </form>
            ) : (
              <p className="ptr-muted">
                {t('Hanya Owner dapat mengajukan perubahan rekening.')}
              </p>
            )}
          </section>
          {ctx.capabilities.includes('closure') && (
            <section className="ptr-card">
              <h3>{t('Penutupan penjualan')}</h3>
              <p>
                {t(
                  'Penjualan baru dihentikan. Reservasi terkonfirmasi dan kewajiban pembayaran tetap ditangani.',
                )}
              </p>
              <button
                className="ptr-button danger"
                disabled={o.status === 'closing'}
                onClick={() => setClose(true)}
              >
                {t('Tinjau penutupan penjualan')}
              </button>
            </section>
          )}
        </div>
      </div>
      <Feedback {...a} />
      <Dialog open={close} onOpenChange={setClose}>
        <DialogContent>
          <DialogTitle>{t('Tutup penjualan baru?')}</DialogTitle>
          <DialogDescription>
            {t(
              'Reservasi lama tetap harus dilayani. Tindakan ini tidak membatalkan pesanan pelanggan.',
            )}
          </DialogDescription>
          <div className="ptr-module ptr-inline">
            <FormField label="Alasan penutupan">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minLength={10}
              />
            </FormField>
            <button
              className="ptr-button danger"
              disabled={a.busy || reason.trim().length < 10}
              onClick={async () => {
                if (
                  await a.run(
                    () => closePartnerSales(reason),
                    'Penjualan baru ditutup. Kewajiban lama tetap dilayani.',
                  )
                )
                  setClose(false);
              }}
            >
              {t('Konfirmasi penutupan')}
            </button>
            <Feedback {...a} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
