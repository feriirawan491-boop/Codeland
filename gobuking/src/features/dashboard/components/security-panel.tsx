'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import { profileAdapter } from '../lib/profile';
import { createSupportTicket } from '../lib/support';
import { useResource, ResourceState, errorMessage, FormError } from './shared';
import type { TicketCategory } from '../lib/types';
export function SecurityPanel() {
  const { t } = useI18n(),
    router = useRouter(),
    r = useResource(() => profileAdapter.listSessions(), 'sessions'),
    [revoke, setRevoke] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <div className="usr-two">
      <section className="usr-card">
        <span className="usr-icon">
          <Monitor />
        </span>
        <h3>{t('Perangkat & sesi akun')}</h3>
        <p>
          {t(
            'Kelola sesi demo. Sesi yang dicabut tidak dapat digunakan kembali.',
          )}
        </p>
        <ResourceState {...r} retry={r.reload} />
        {r.data?.map((s) => (
          <article className="usr-session" key={s.id}>
            <strong>{t(s.device)}</strong>
            <p>
              {t(s.current ? 'Sesi ini' : 'Sesi lain')} ·{' '}
              {t(s.revokedAt ? 'Dicabut' : 'Aktif')}
            </p>
            <p className="usr-muted">
              {t('Berakhir')}: {new Date(s.expiresAt).toLocaleString()}
            </p>
            <button
              className="usr-button secondary"
              disabled={!!s.revokedAt}
              onClick={() => setRevoke(s.id)}
            >
              {t(s.current ? 'Keluar dari sesi ini' : 'Cabut sesi')}
            </button>
          </article>
        ))}
        <details>
          <summary>{t('Simulasi perangkat lain')}</summary>
          <button
            className="usr-button secondary"
            onClick={() => {
              profileAdapter.addSimulatedSession();
              r.reload();
            }}
          >
            {t('Tambahkan sesi demo')}
          </button>
        </details>
      </section>
      <section className="usr-card">
        <span className="usr-icon">
          <ShieldCheck />
        </span>
        <h3>{t('Privasi & permintaan data')}</h3>
        <p>
          {t(
            'Permintaan dibuat sebagai tiket untuk diverifikasi. Data transaksi tidak dihapus otomatis.',
          )}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setError('');
            try {
              const ticket = await createSupportTicket(
                {
                  category: String(f.get('category')) as TicketCategory,
                  subject: 'Permintaan privasi akun',
                  referenceId: '',
                  body: String(f.get('body')),
                },
                [],
                crypto.randomUUID(),
              );
              router.push(`/account/support/${ticket.id}`);
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {t('Jenis permintaan')}
            <select aria-label={t('Jenis permintaan')} name="category">
              <option value="privacy_access">{t('Akses salinan data')}</option>
              <option value="privacy_correction">{t('Koreksi data')}</option>
              <option value="privacy_delete">
                {t('Permintaan penghapusan data')}
              </option>
            </select>
          </label>
          <label>
            {t('Detail permintaan')}
            <textarea name="body" required minLength={20} maxLength={3000} />
          </label>
          <button className="usr-button" disabled={busy}>
            {t('Ajukan permintaan verifikasi')}
          </button>
        </form>
      </section>
      <FormError message={error} />
      <Dialog
        open={!!revoke}
        onOpenChange={(open) => {
          if (!open && !busy) setRevoke(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{t('Cabut akses sesi ini?')}</DialogTitle>
          <DialogDescription>
            {t('Perangkat tersebut harus masuk kembali untuk mengakses akun.')}
          </DialogDescription>
          <button
            className="usr-button danger"
            disabled={busy}
            onClick={async () => {
              if (!revoke) return;
              setBusy(true);
              try {
                await profileAdapter.revokeSession(revoke);
                setRevoke(null);
                r.reload();
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {t('Konfirmasi cabut sesi')}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
