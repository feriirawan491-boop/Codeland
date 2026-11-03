'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ZodError } from 'zod';
import { useI18n } from '@/components/i18n/locale-provider';
export function errorMessage(error: unknown) {
  return error instanceof ZodError
    ? (error.issues[0]?.message ?? 'Data tidak valid.')
    : error instanceof Error
      ? error.message
      : 'Layanan sedang terganggu. Coba lagi.';
}
export function useResource<T>(load: () => Promise<T>, key: string) {
  const [state, setState] = useState<{
    data: T | null;
    error: string;
    loading: boolean;
  }>({ data: null, error: '', loading: true });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    Promise.resolve()
      .then(() => {
        if (live) setState({ data: null, error: '', loading: true });
      })
      .then(load)
      .then((data) => {
        if (live) setState({ data, error: '', loading: false });
      })
      .catch((error) => {
        if (live)
          setState({ data: null, error: errorMessage(error), loading: false });
      });
    return () => {
      live = false;
    };
    // The key describes the source request, while revision explicitly refreshes mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, revision]);
  return { ...state, reload: () => setRevision((v) => v + 1) };
}
export function Empty({
  title = 'Belum ada aktivitas',
  description = 'Mulai rencana perjalanan Anda dan temukan pilihan yang sesuai.',
}: {
  title?: string;
  description?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="usr-empty">
      <span aria-hidden="true">✦</span>
      <h3>{t(title)}</h3>
      <p>{t(description)}</p>
      <Link className="usr-link" href="/">
        {t('Jelajahi pilihan perjalanan')}
      </Link>
    </div>
  );
}
export function ResourceState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  const { t } = useI18n();
  return loading ? (
    <div role="status" className="usr-loading">
      {t('Memuat aktivitas akun…')}
      <div />
      <div />
    </div>
  ) : error ? (
    <div role="alert" className="usr-error">
      <p>{t(error)}</p>
      <button className="usr-button secondary" onClick={retry}>
        {t('Coba lagi')}
      </button>
    </div>
  ) : null;
}
export const money = (v: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
export function FormError({ message }: { message: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);
  const { t } = useI18n();
  return message ? (
    <p ref={ref} tabIndex={-1} className="usr-error" role="alert">
      {t(message)}
    </p>
  ) : null;
}
