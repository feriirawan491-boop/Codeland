import type { CarScenario, CarQuote } from './types';
export class CarError extends Error {
  constructor(
    public code: string,
    message: string,
    public quote?: CarQuote,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'CarError';
  }
}
export async function carDelay(
  scenario: CarScenario = 'ready',
  signal?: AbortSignal,
) {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, scenario === 'loading' ? 1100 : 180);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
  const errors: Partial<Record<CarScenario, [string, string]>> = {
    error: ['SERVICE', 'Layanan rental sedang terganggu. Silakan coba lagi.'],
    timeout: ['TIMEOUT', 'Pencarian rental melewati batas waktu.'],
    rate_limited: [
      '429',
      'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.',
    ],
    inactive: ['404', 'Paket rental tidak aktif atau tidak ditemukan.'],
    unauthorized: ['401', 'Masuk untuk membuka pesanan rental.'],
    forbidden: ['403', 'Anda tidak memiliki akses ke pesanan rental ini.'],
  };
  const error = errors[scenario];
  if (error)
    throw new CarError(
      ...error,
      undefined,
      scenario === 'rate_limited' ? 3 : undefined,
    );
}
