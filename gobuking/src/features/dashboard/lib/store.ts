import { getDemoAccount } from '@/features/account/lib/demo-auth';
import { DASHBOARD_EVENT } from './config';
import type { DashboardScenario } from './types';
export class DashboardError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'DashboardError';
  }
}
export function requireDashboardAccount() {
  const value = getDemoAccount();
  if (!value)
    throw new DashboardError(
      '401',
      'Sesi berakhir. Masuk kembali untuk membuka dashboard.',
    );
  return value;
}
export function assertSameAccount(id: string) {
  if (requireDashboardAccount().id !== id)
    throw new DashboardError(
      '401',
      'Akun berubah. Buka kembali aktivitas melalui akun Anda.',
    );
}
export function readDashboardStore<T>(key: string): Record<string, T> {
  try {
    return typeof window === 'undefined'
      ? {}
      : (JSON.parse(sessionStorage.getItem(key) ?? '{}') as Record<string, T>);
  } catch {
    return {};
  }
}
export function saveDashboardRecord<T>(key: string, id: string, value: T) {
  const values = readDashboardStore<T>(key);
  values[id] = value;
  sessionStorage.setItem(key, JSON.stringify(values));
  window.dispatchEvent(new Event(DASHBOARD_EVENT));
  return structuredClone(value);
}
export async function dashboardDelay(
  scenario: DashboardScenario = 'ready',
  signal?: AbortSignal,
) {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, scenario === 'loading' ? 1100 : 120);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
  if (scenario === 'error' || scenario === 'timeout')
    throw new DashboardError(
      'SERVICE',
      'Dashboard belum dapat dimuat. Coba lagi tanpa menghapus data Anda.',
    );
  if (scenario === 'unauthorized')
    throw new DashboardError(
      '401',
      'Sesi berakhir. Masuk kembali untuk membuka dashboard.',
    );
  if (scenario === 'forbidden')
    throw new DashboardError(
      '403',
      'Anda tidak memiliki akses ke aktivitas ini.',
    );
  if (scenario === 'rate_limited')
    throw new DashboardError(
      '429',
      'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
      3,
    );
}
export function unknownDashboardResult(scenario: DashboardScenario) {
  if (scenario === 'mutation_timeout')
    throw new DashboardError(
      'UNKNOWN',
      'Hasil pengiriman belum diketahui. Periksa status sebelum mengirim ulang.',
    );
}
