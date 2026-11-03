'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  LoaderCircle,
  LockKeyhole,
  UserRound,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  demoAccountExists,
  signOutDemoAccount,
  useDemoAccount,
  verifyDemoAccount,
  type DemoAccountInput,
} from '../lib/demo-auth';
export function AccountAccess({
  onComplete,
  purpose = 'booking',
}: {
  onComplete?: () => void;
  purpose?: 'booking' | 'venue' | 'car' | 'dashboard' | 'partner' | 'admin';
}) {
  const { t } = useI18n();
  const account = useDemoAccount();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [pending, setPending] = useState<DemoAccountInput | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const schema = z
    .object({
      email: z.email('Masukkan email yang valid.'),
      name: z.string(),
      phone: z.string(),
      consent: z.boolean(),
    })
    .superRefine((values, context) => {
      if (mode === 'register') {
        if (values.name.trim().length < 2)
          context.addIssue({
            code: 'custom',
            path: ['name'],
            message: 'Isi nama pemesan minimal 2 karakter.',
          });
        if (!/^\+?[\d\s()-]{8,20}$/.test(values.phone.trim()))
          context.addIssue({
            code: 'custom',
            path: ['phone'],
            message: 'Masukkan nomor telepon yang valid.',
          });
        if (!values.consent)
          context.addIssue({
            code: 'custom',
            path: ['consent'],
            message: 'Setujui ketentuan sebelum melanjutkan.',
          });
      }
    });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', name: '', phone: '', consent: false },
  });
  function changeMode(next: 'login' | 'register') {
    setMode(next);
    setPending(null);
    setCode('');
    setError('');
  }
  if (account)
    return (
      <div className="account-access">
        <span className="account-access-icon">
          <UserRound size={25} />
        </span>
        <h2>{t('Akun demo Anda')}</h2>
        <p className="account-profile-name">{account.name}</p>
        <p>{account.email}</p>
        <Link
          href="/account/bookings"
          onClick={onComplete}
          className="inline-flex min-h-11 items-center justify-center w-full rounded-xl bg-blue-600 text-white mt-5 px-4 py-3 font-semibold"
        >
          {t('Buka dashboard akun')}
        </Link>
        <Link
          href="/partner"
          onClick={onComplete}
          className="inline-flex min-h-11 items-center justify-center w-full rounded-xl border border-blue-200 text-blue-700 mt-3 px-4 py-3 font-semibold"
        >
          {t('Dashboard mitra')}
        </Link>
        <Link
          href="/admin"
          onClick={onComplete}
          className="inline-flex min-h-11 items-center justify-center w-full rounded-xl border border-blue-200 text-blue-700 mt-3 px-4 py-3 font-semibold"
        >
          {t('Super Admin')}
        </Link>
        <Button
          variant="outline"
          className="w-full mt-5"
          onClick={() => {
            signOutDemoAccount();
            onComplete?.();
          }}
        >
          <LogOut size={17} />
          {t('Keluar')}
        </Button>
        <p className="account-demo-note">
          {t('Akun simulasi lokal, bukan akun produksi.')}
        </p>
      </div>
    );
  return (
    <div className="account-access">
      <span className="account-access-icon">
        <LockKeyhole size={25} />
      </span>
      <h2>
        {t(
          purpose === 'admin'
            ? mode === 'login'
              ? 'Masuk ke panel admin'
              : 'Buat akun platform demo'
            : purpose === 'partner'
              ? mode === 'login'
                ? 'Masuk ke ruang mitra'
                : 'Buat akun mitra Anda'
              : purpose === 'dashboard'
                ? mode === 'login'
                  ? 'Masuk ke dashboard Anda'
                  : 'Buat akun perjalanan Anda'
                : mode === 'login'
                  ? purpose !== 'booking'
                    ? 'Masuk untuk mengajukan permintaan'
                    : 'Masuk untuk memesan'
                  : purpose !== 'booking'
                    ? 'Buat akun untuk mengajukan permintaan'
                    : 'Buat akun untuk memesan',
        )}
      </h2>
      <p>
        {t(
          purpose === 'admin'
            ? 'Akses platform memerlukan undangan admin atau aktivasi demo lokal.'
            : purpose === 'partner'
              ? 'Masuk untuk mengelola organisasi, listing, dan layanan mitra.'
              : purpose === 'dashboard'
                ? 'Masuk untuk mengelola pesanan, profil, dan bantuan dalam satu tempat.'
                : purpose === 'car'
                  ? 'Masuk atau daftar untuk mengajukan rental. Pembayaran dibuka setelah verifikasi dan persetujuan mitra.'
                  : purpose === 'venue'
                    ? 'Masuk dengan email PIC yang terverifikasi untuk mengajukan penawaran. Tidak ada pembayaran pada alur venue.'
                    : 'Masuk atau daftar, lalu isi data tamu dan pilih metode pembayaran.',
        )}
      </p>
      <div className="account-mode-switch" aria-label={t('Pilihan akses akun')}>
        <button
          type="button"
          aria-pressed={mode === 'login'}
          disabled={busy}
          onClick={() => changeMode('login')}
        >
          {t('Masuk')}
        </button>
        <button
          type="button"
          aria-pressed={mode === 'register'}
          disabled={busy}
          onClick={() => changeMode('register')}
        >
          {t('Daftar akun')}
        </button>
      </div>
      {!pending ? (
        <form
          noValidate
          onSubmit={handleSubmit((values) => {
            setError('');
            const exists = demoAccountExists(values.email);
            if (mode === 'login' && !exists) {
              setError('Email belum terdaftar. Buat akun terlebih dahulu.');
              return;
            }
            if (mode === 'register' && exists) {
              setError('Email sudah terdaftar. Silakan masuk.');
              return;
            }
            setPending({
              name: values.name.trim(),
              email: values.email.trim().toLowerCase(),
              phone: values.phone.trim(),
            });
          })}
        >
          {mode === 'register' && (
            <label className="account-field">
              {t('Nama lengkap')}
              <input
                autoComplete="name"
                maxLength={100}
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <span className="field-error">{t(errors.name.message)}</span>
              )}
            </label>
          )}
          <label className="account-field">
            {t('Email akun')}
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <span className="field-error">{t(errors.email.message)}</span>
            )}
          </label>
          {mode === 'register' && (
            <>
              <label className="account-field">
                {t('Nomor telepon akun')}
                <input
                  type="tel"
                  autoComplete="tel"
                  maxLength={20}
                  {...register('phone')}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <span className="field-error">{t(errors.phone.message)}</span>
                )}
              </label>
              <label className="account-terms">
                <input
                  type="checkbox"
                  {...register('consent')}
                  aria-invalid={!!errors.consent}
                />
                <span>
                  {t(
                    'Saya menyetujui ketentuan akun demo dan penyimpanan profil selama tab ini terbuka.',
                  )}
                </span>
              </label>
              {errors.consent && (
                <p className="field-error">{t(errors.consent.message)}</p>
              )}
            </>
          )}
          {error && (
            <p role="alert" className="account-error">
              {t(error)}
            </p>
          )}
          <Button type="submit" className="w-full mt-5">
            {t(mode === 'login' ? 'Lanjut masuk' : 'Lanjut daftar')}
            <ArrowRight size={17} />
          </Button>
        </form>
      ) : (
        <form
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setError('');
            try {
              await verifyDemoAccount(mode, pending, code);
              onComplete?.();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : 'Layanan demo sedang terganggu. Coba lagi.',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="account-otp-hint">
            {t(
              'Kode OTP demo: 123456. Tidak ada email sungguhan yang dikirim.',
            )}
          </p>
          <p className="account-otp-email">{pending.email}</p>
          <label className="account-field">
            {t('Kode OTP demo')}
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, ''))
              }
              disabled={busy}
            />
          </label>
          {error && (
            <p role="alert" className="account-error">
              {t(error)}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full mt-5">
            {busy ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <ArrowRight size={17} />
            )}{' '}
            {t(
              busy
                ? 'Memproses simulasi…'
                : mode === 'login'
                  ? 'Masuk ke akun demo'
                  : 'Daftar & lanjutkan',
            )}
          </Button>
          <button
            type="button"
            className="account-back"
            disabled={busy}
            onClick={() => {
              setPending(null);
              setCode('');
              setError('');
            }}
          >
            {t('Ubah data akun')}
          </button>
        </form>
      )}
      <p className="account-demo-note">
        {t(
          'Simulasi lokal. Profil disimpan di tab ini sampai tab ditutup. Tidak menggunakan kata sandi atau autentikasi sungguhan.',
        )}
      </p>
    </div>
  );
}
