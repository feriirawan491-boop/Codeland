'use client';
import { useRef, useState } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { adminAdapter } from '../lib/adapter';
import {
  errorMessage,
  FormError,
} from '@/features/dashboard/components/shared';
export {
  FormField,
  FileInput,
  field,
  uploaded,
  ResourceState,
  usePartnerResource as useAdminResource,
  usePartnerNow as useAdminNow,
  Empty,
  money,
} from '@/features/partner/components/shared';
export { FormError, errorMessage };
export function useAdminAction(reload: () => void) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [unknown, setUnknown] = useState(false),
    command = useRef<string | null>(null);
  async function run(
    action: (commandId: string) => Promise<unknown>,
    message = 'Tindakan admin tercatat.',
    refresh = true,
  ) {
    if (busy) return false;
    command.current ??= crypto.randomUUID();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await action(command.current);
      command.current = null;
      setUnknown(false);
      setSuccess(message);
      if (refresh) reload();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      const unknownResult =
        e instanceof Error && 'code' in e && e.code === 'UNKNOWN';
      setUnknown(unknownResult);
      if (!unknownResult) command.current = null;
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function reconcile() {
    if (!command.current) return;
    setBusy(true);
    try {
      const known = await adminAdapter.resolveCommand(command.current);
      if (!known)
        throw new Error(
          'Tindakan belum tercatat. Tinjau data sebelum mencoba ulang.',
        );
      setSuccess('Tindakan telah tercatat pada sumber.');
      setError('');
      setUnknown(false);
      command.current = null;
      reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, success, unknown, run, reconcile };
}
export function AdminFeedback(a: ReturnType<typeof useAdminAction>) {
  const { t } = useI18n();
  return (
    <>
      <FormError message={a.error} />
      {a.success && (
        <p className="ptr-success" role="status">
          {t(a.success)}
        </p>
      )}
      {a.unknown && (
        <button
          className="ptr-button secondary"
          disabled={a.busy}
          onClick={a.reconcile}
        >
          {t('Periksa hasil tindakan')}
        </button>
      )}
    </>
  );
}
export function ReviewAction({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="ptr-button secondary">{t(label)}</button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{t(label)}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="ptr-module ptr-inline">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="ptr-badge">{children}</span>;
}
