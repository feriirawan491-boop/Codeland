'use client';
import {
  useEffect,
  useState,
  isValidElement,
  cloneElement,
  type ReactElement,
} from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  FormError,
  errorMessage,
  money,
  Empty,
  ResourceState as BaseResourceState,
  useResource,
} from '@/features/dashboard/components/shared';
export { FormError, errorMessage, money, Empty, useResource };
export function usePartnerAction(reload: () => void) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  async function run(
    action: () => Promise<unknown>,
    message = 'Perubahan tersimpan.',
    refresh = true,
  ) {
    if (busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await action();
      setSuccess(message);
      if (refresh) reload();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, success, run, setError };
}
export function Feedback({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  const { t } = useI18n();
  return (
    <>
      <FormError message={error} />
      {success && (
        <p role="status" className="ptr-success">
          {t(success)}
        </p>
      )}
    </>
  );
}
export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <label className="ptr-field">
      <span>{t(label)}</span>
      {isValidElement(children) && children.type === 'select'
        ? cloneElement(children as ReactElement<{ 'aria-label'?: string }>, {
            'aria-label': t(label),
          })
        : children}
    </label>
  );
}
export const field = (f: FormData, key: string) => String(f.get(key) ?? '');
export const uploaded = (f: FormData) =>
  f.getAll('files').filter((v): v is File => v instanceof File && v.size > 0);
export function FileInput() {
  const { t } = useI18n();
  return (
    <FormField label="Lampiran privat (opsional)">
      <input
        name="files"
        type="file"
        multiple
        accept="application/pdf,image/jpeg,image/png"
      />
      <small>{t('PDF, JPG, PNG · maksimal 3 file, masing-masing 5 MB.')}</small>
    </FormField>
  );
}

export function usePartnerResource<T>(load: () => Promise<T>, key: string) {
  const [state, setState] = useState<{
      data: T | null;
      error: string;
      loading: boolean;
    }>({ data: null, error: '', loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    Promise.resolve()
      .then(() => {
        if (live) setState((old) => ({ ...old, error: '', loading: true }));
      })
      .then(load)
      .then((data) => {
        if (live) setState({ data, error: '', loading: false });
      })
      .catch((e) => {
        if (live)
          setState({ data: null, error: errorMessage(e), loading: false });
      });
    return () => {
      live = false;
    };
    // key includes organization, membership version, section and refresh revision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, revision]);
  return { ...state, reload: () => setRevision((v) => v + 1) };
}

export function usePartnerNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);
  return now;
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
  const { t } = useI18n(),
    [released, setReleased] = useState(''),
    blocked = error.includes('Terlalu banyak permintaan') && released !== error;
  useEffect(() => {
    if (!blocked) return;
    const timer = setTimeout(() => setReleased(error), 3000);
    return () => clearTimeout(timer);
  }, [blocked, error]);
  if (blocked)
    return (
      <div role="alert" className="usr-error">
        <p>{t(error)}</p>
        <button className="ptr-button secondary" disabled>
          {t('Tunggu 3 detik sebelum mencoba kembali')}
        </button>
      </div>
    );
  return (
    <BaseResourceState
      loading={loading}
      error={error}
      retry={() => {
        setReleased('');
        retry();
      }}
    />
  );
}
