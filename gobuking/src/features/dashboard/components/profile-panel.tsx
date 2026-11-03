'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useI18n } from '@/components/i18n/locale-provider';
import { profileAdapter } from '../lib/profile';
import { profileSchema } from '../lib/query';
import { useResource, ResourceState, FormError, errorMessage } from './shared';
export function ProfilePanel() {
  const r = useResource(() => profileAdapter.getProfile(), 'profile');
  return (
    <>
      <ResourceState {...r} retry={r.reload} />
      {r.data && (
        <ProfileForm
          key={JSON.stringify(r.data)}
          data={r.data}
          reload={r.reload}
        />
      )}
    </>
  );
}
function ProfileForm({
  data,
  reload,
}: {
  data: Awaited<ReturnType<typeof profileAdapter.getProfile>>;
  reload: () => void;
}) {
  const { t, changeLocale } = useI18n(),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [busy, setBusy] = useState(false),
    [field, setField] = useState<'email' | 'phone'>('email'),
    [contact, setContact] = useState(''),
    [challenge, setChallenge] = useState<(typeof data.pending)[number] | null>(
      data.pending[0] ?? null,
    ),
    [code, setCode] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: data.account.name, ...data.preferences },
  });
  return (
    <div className="usr-two">
      <section className="usr-card">
        <h3>{t('Profil & preferensi')}</h3>
        <p className="usr-muted">
          {t('ID akun tetap')}: {data.account.id}
        </p>
        <form
          onSubmit={handleSubmit(async (values) => {
            setError('');
            try {
              await profileAdapter.updateProfile(values);
              changeLocale(values.language);
              setSuccess('Profil berhasil disimpan.');
            } catch (e) {
              setError(errorMessage(e));
            }
          })}
        >
          <label>
            {t('Nama lengkap')}
            <input
              {...register('name')}
              autoComplete="name"
              aria-invalid={!!errors.name}
            />
          </label>
          {errors.name && <FormError message={errors.name.message ?? ''} />}
          <label>
            {t('Bahasa pilihan')}
            <select aria-label={t('Bahasa pilihan')} {...register('language')}>
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            {t('Mata uang')}
            <input value="IDR — Rupiah Indonesia" readOnly />
          </label>
          <label className="usr-check">
            <input type="checkbox" {...register('emailUpdates')} />
            {t('Terima informasi perjalanan melalui email')}
          </label>
          <button className="usr-button" disabled={isSubmitting}>
            {t('Simpan profil')}
          </button>
        </form>
        <p role="status">{t(success)}</p>
      </section>
      <section className="usr-card">
        <h3>{t('Kontak terverifikasi')}</h3>
        <dl className="usr-totals">
          <div>
            <dt>Email</dt>
            <dd>{data.account.email}</dd>
          </div>
          <div>
            <dt>{t('Telepon')}</dt>
            <dd>{data.account.phone}</dd>
          </div>
        </dl>
        <p>
          {t(
            'Kontak lama tetap aktif sampai kontak baru berhasil diverifikasi. Data kontak pada pesanan lama tetap tersimpan.',
          )}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              if (challenge) {
                await profileAdapter.verifyContactChange(challenge.id, code);
                reload();
              } else {
                setChallenge(
                  await profileAdapter.beginContactChange(field, contact),
                );
              }
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {!challenge ? (
            <>
              <label>
                {t('Ubah kontak')}
                <select
                  aria-label={t('Ubah kontak')}
                  value={field}
                  onChange={(e) =>
                    setField(e.target.value as 'email' | 'phone')
                  }
                >
                  <option value="email">Email</option>
                  <option value="phone">{t('Telepon')}</option>
                </select>
              </label>
              <label>
                {t('Kontak baru')}
                <input
                  type={field === 'email' ? 'email' : 'tel'}
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <p>{challenge.value}</p>
              <p>
                {t(
                  'Kode OTP demo: 123456. Tidak ada email sungguhan yang dikirim.',
                )}
              </p>
              <label>
                {t('Kode OTP demo')}
                <input
                  value={code}
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
            </>
          )}
          {challenge && (
            <button
              type="button"
              className="usr-button secondary mb-3"
              disabled={busy}
              onClick={() => {
                setChallenge(null);
                setCode('');
                setError('');
              }}
            >
              {t('Ajukan perubahan kontak baru')}
            </button>
          )}
          <button className="usr-button" disabled={busy}>
            {t(
              challenge
                ? 'Verifikasi kontak baru'
                : 'Kirim kode verifikasi demo',
            )}
          </button>
        </form>
      </section>
      <FormError message={error} />
    </div>
  );
}
