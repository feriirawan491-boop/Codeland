'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  getMyBookings,
  dashboardStatus,
  dashboardPayment,
  dashboardRefund,
} from '../lib/bookings';
import { parseListFilters, dashboardScenario } from '../lib/query';
import { ResourceState, useResource, Empty, money } from './shared';
import { CancellationPanel } from './cancellation-panel';
import { DashboardInvoice } from './invoice-button';
export function BookingList({
  section,
}: {
  section: 'bookings' | 'history' | 'refunds';
}) {
  const { t } = useI18n(),
    router = useRouter(),
    params = useSearchParams(),
    filters = parseListFilters(new URLSearchParams(params.toString()));
  const searchTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (searchTimer.current !== null)
        window.clearTimeout(searchTimer.current);
    },
    [],
  );
  const resource = useResource(
    () =>
      section === 'refunds'
        ? Promise.all([
            getMyBookings(
              filters,
              false,
              dashboardScenario(new URLSearchParams(params.toString())),
            ),
            getMyBookings(
              filters,
              true,
              dashboardScenario(new URLSearchParams(params.toString())),
            ),
          ]).then((groups) =>
            groups
              .flat()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          )
        : getMyBookings(
            filters,
            section === 'history',
            dashboardScenario(new URLSearchParams(params.toString())),
          ),
    section + params.toString(),
  );
  const rows =
    resource.data?.filter(
      (b) => section !== 'refunds' || b.refundStatus !== 'none' || b.canCancel,
    ) || [];
  const pages = Math.max(1, Math.ceil(rows.length / 5)),
    page = Math.min(filters.page, pages);
  function update(key: string, value: string) {
    const p = new URLSearchParams(window.location.search);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== 'page') p.delete('page');
    router.replace(`?${p}`, { scroll: false });
  }
  return (
    <>
      <form className="usr-filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          {t('Kategori')}
          <select
            aria-label={t('Kategori')}
            value={filters.category}
            onChange={(e) => update('category', e.target.value)}
          >
            <option value="">{t('Semua kategori')}</option>
            <option value="hotel">Hotel</option>
            <option value="home">Home Rental</option>
            <option value="car">Car Rental</option>
          </select>
        </label>
        <label>
          {t('Status reservasi')}
          <select
            aria-label={t('Status reservasi')}
            value={filters.status}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="">{t('Semua status')}</option>
            {[
              'requested',
              'awaiting_payment',
              'confirmed',
              'completed',
              'cancelled',
              'expired',
              'rejected',
            ].map((s) => (
              <option key={s} value={s}>
                {t(
                  s === 'requested'
                    ? 'Menunggu mitra'
                    : s === 'awaiting_payment'
                      ? 'Menunggu pembayaran'
                      : s === 'confirmed'
                        ? 'Terkonfirmasi'
                        : s === 'completed'
                          ? 'Selesai'
                          : s === 'cancelled'
                            ? 'Dibatalkan'
                            : s === 'expired'
                              ? 'Kedaluwarsa'
                              : 'Ditolak',
                )}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('Dasar periode')}
          <select
            aria-label={t('Dasar periode')}
            value={filters.dateKind}
            onChange={(e) => update('dateKind', e.target.value)}
          >
            <option value="service">{t('Tanggal mulai layanan')}</option>
            <option value="created">{t('Tanggal dibuat')}</option>
          </select>
        </label>
        <label>
          {t('Dari tanggal')}
          <input
            type="date"
            value={filters.from}
            onChange={(e) => update('from', e.target.value)}
          />
        </label>
        <label>
          {t('Sampai tanggal')}
          <input
            type="date"
            value={filters.to}
            onChange={(e) => update('to', e.target.value)}
          />
        </label>
        <label>
          {t('Cari pesanan')}
          <input
            type="search"
            placeholder={t('Nama properti atau kode')}
            defaultValue={filters.keyword}
            onChange={(e) => {
              const value = e.currentTarget.value;
              if (searchTimer.current !== null)
                window.clearTimeout(searchTimer.current);
              searchTimer.current = window.setTimeout(
                () => update('keyword', value),
                300,
              );
            }}
          />
        </label>
      </form>
      <button
        className="usr-button secondary mb-4"
        disabled={resource.loading}
        onClick={resource.reload}
      >
        {t('Periksa status')}
      </button>
      <ResourceState {...resource} retry={resource.reload} />
      {!resource.loading &&
        !resource.error &&
        (!rows.length ? (
          <Empty
            title={
              section === 'history'
                ? 'Belum ada riwayat perjalanan'
                : section === 'refunds'
                  ? 'Belum ada pembatalan atau refund'
                  : 'Belum ada pesanan aktif'
            }
          />
        ) : (
          <>
            <p className="usr-muted">
              {rows.length} {t('pesanan ditemukan')}
            </p>
            <div className="usr-list">
              {rows.slice((page - 1) * 5, page * 5).map((b) => (
                <article className="usr-card" key={b.id}>
                  <div className="usr-card-heading">
                    <span className="usr-booking-photo">
                      <Image
                        src={`/images/${b.image}.jpg`}
                        alt=""
                        fill
                        sizes="72px"
                      />
                    </span>
                    <div>
                      <span className="usr-eyebrow">
                        {b.category === 'home'
                          ? 'Home Rental'
                          : b.category === 'car'
                            ? 'Car Rental'
                            : 'Hotel'}{' '}
                        · {b.id}
                      </span>
                      <h3>{b.title}</h3>
                      <p>{b.subtitle}</p>
                    </div>
                  </div>
                  <div className="usr-badges">
                    <span>{t(dashboardStatus(b))}</span>
                    <span>{t(dashboardPayment(b))}</span>
                    {b.refundStatus !== 'none' && (
                      <span>{t(dashboardRefund(b))}</span>
                    )}
                  </div>
                  <p className="usr-dates">
                    <CalendarDays size={17} />
                    {b.start.replace('T', ' ')} — {b.end.replace('T', ' ')} ·{' '}
                    {b.zone}
                  </p>
                  <div className="usr-card-bottom">
                    <div>
                      <span className="usr-muted">{t('Total transaksi')}</span>
                      <strong>{money(b.total)}</strong>
                    </div>
                    <Link className="usr-button" href={b.href}>
                      {t(
                        b.canInvoice
                          ? 'Detail & invoice booking'
                          : 'Lihat detail pesanan',
                      )}
                      <ArrowUpRight size={17} />
                    </Link>
                  </div>
                  {b.canInvoice && (
                    <div className="mt-4">
                      <DashboardInvoice id={b.id} />
                    </div>
                  )}
                  {section === 'refunds' && (
                    <>
                      <p>
                        {t('Estimasi refund')}:{' '}
                        <strong>{money(b.refundAmount)}</strong> ·{' '}
                        {t(dashboardRefund(b))}
                      </p>
                      {b.canCancel && (
                        <CancellationPanel
                          id={b.id}
                          onComplete={resource.reload}
                        />
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
            <nav className="usr-pagination" aria-label={t('Halaman pesanan')}>
              <button
                disabled={page <= 1}
                onClick={() => update('page', String(page - 1))}
              >
                {t('Sebelumnya')}
              </button>
              <span>
                {page} / {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => update('page', String(page + 1))}
              >
                {t('Berikutnya')}
              </button>
            </nav>
          </>
        ))}
    </>
  );
}
