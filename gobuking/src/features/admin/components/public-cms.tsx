'use client';
import { useSyncExternalStore, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { liveCms } from '../lib/public-content';
const getSnapshot = () => JSON.stringify(liveCms());
function subscribe(callback: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  function refresh() {
    clearTimeout(timer);
    callback();
    let records: { startsAt: string; endsAt: string }[] = [];
    try {
      records = JSON.parse(
        sessionStorage.getItem('gobuking:public-cms:v1') ?? '[]',
      );
    } catch {}
    const next = records
      .flatMap((v) => [Date.parse(v.startsAt), Date.parse(v.endsAt)])
      .filter((v) => v > Date.now());
    timer = setTimeout(
      refresh,
      next.length
        ? Math.min(86400000, Math.max(1, Math.min(...next) - Date.now() + 2))
        : 86400000,
    );
  }
  refresh();
  window.addEventListener('gobuking:cms-changed', refresh);
  window.addEventListener('focus', refresh);
  return () => {
    clearTimeout(timer);
    window.removeEventListener('gobuking:cms-changed', refresh);
    window.removeEventListener('focus', refresh);
  };
}
export function PublicCms() {
  const { t } = useI18n(),
    raw = useSyncExternalStore(subscribe, getSnapshot, () => '[]'),
    items = useMemo(() => JSON.parse(raw) as ReturnType<typeof liveCms>, [raw]);
  if (!items.length) return null;
  return (
    <section
      className="page-container my-8"
      aria-label={t('Informasi & promo terbaru')}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((v) => (
          <article
            key={v.id}
            className="rounded-2xl border border-blue-200 bg-blue-50 p-6"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-blue-700">
              <Sparkles size={15} />
              {t(v.kind === 'promo' ? 'Promo terbatas' : 'Pilihan terbaru')}
            </span>
            <h2 className="text-xl font-bold mt-3">{v.title}</h2>
            <p className="text-sm text-slate-600 mt-3 leading-7">{v.body}</p>
            {v.kind === 'promo' && (
              <p className="text-xs text-slate-600 mt-3">
                {v.discountPercent}% ·{' '}
                {t(
                  v.basis === 'nightly_base'
                    ? 'Dari tarif dasar menginap'
                    : v.basis === 'unit_rate'
                      ? 'Dari tarif per unit kendaraan'
                      : 'Untuk pembahasan quote venue',
                )}{' '}
                · {t('Ditanggung')}: {v.fundedBy}
              </p>
            )}
            <Link
              href={v.href}
              className="inline-flex items-center gap-2 text-blue-700 text-sm font-bold mt-4"
            >
              {t('Lihat selengkapnya')}
              <ArrowUpRight size={16} />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
