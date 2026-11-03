'use client';
import Link from 'next/link';
import {
  ArrowUpRight,
  ShieldCheck,
  ClipboardCheck,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import type { AdminWorkspace } from '../lib/adapter';
import { money, Badge } from './shared';
import { revenueMetrics } from '../lib/reports';
export function AdminOverview({ data }: { data: AdminWorkspace }) {
  const { t } = useI18n(),
    metrics = revenueMetrics(data.bookings),
    finance = data.ctx.capabilities.includes('reports'),
    exceptions = data.bookings.filter((b) => b.status === 'exception');
  return (
    <>
      <div className="adm-overview-banner">
        <div>
          <span className="ptr-eyebrow">{t('PLATFORM CONTROL CENTER')}</span>
          <h2>{t('Kendali yang jelas. Layanan yang terjaga.')}</h2>
          <p>
            {t(
              'Pantau antrean, tangani pengecualian, dan telusuri setiap keputusan.',
            )}
          </p>
        </div>
        <ShieldCheck size={48} />
      </div>
      <div className="ptr-kpis">
        {(finance
          ? [
              {
                label: 'GMV pembayaran',
                value: money(metrics.gmv),
                icon: Wallet,
              },
              {
                label: 'Estimasi komisi platform',
                value: money(metrics.commission),
                icon: Wallet,
              },
              {
                label: 'Kasus aktif',
                value: data.ctx.capabilities.includes('support')
                  ? data.cases.filter((c) => c.status !== 'resolved').length
                  : '—',
                icon: TriangleAlert,
              },
              {
                label: 'Refund menunggu review',
                value: data.refunds.filter((r) => r.status === 'requested')
                  .length,
                icon: ClipboardCheck,
              },
            ]
          : [
              {
                label: 'Mitra perlu review',
                value: data.ctx.capabilities.includes('verify')
                  ? data.partners.filter((o) => o.status === 'under_review')
                      .length
                  : '—',
                icon: ShieldCheck,
              },
              {
                label: 'Listing perlu moderasi',
                value: data.ctx.capabilities.includes('catalog')
                  ? data.listings.filter((l) => l.status === 'under_review')
                      .length
                  : '—',
                icon: ClipboardCheck,
              },
              {
                label: 'Reservasi exception',
                value: data.ctx.capabilities.includes('reservation')
                  ? exceptions.length
                  : '—',
                icon: TriangleAlert,
              },
              {
                label: 'Tiket perlu ditangani',
                value: data.ctx.capabilities.includes('support')
                  ? data.tickets.filter((t) => t.status !== 'closed').length
                  : '—',
                icon: ClipboardCheck,
              },
            ]
        ).map((v) => (
          <div className="ptr-kpi" key={v.label}>
            <v.icon size={19} />
            <span>{t(v.label)}</span>
            <strong>{v.value}</strong>
          </div>
        ))}
      </div>
      <div className="ptr-grid">
        <section className="ptr-card">
          <span className="ptr-eyebrow">{t('ANTREAN PRIORITAS')}</span>
          <h2>{t('Tindakan yang menunggu tim')}</h2>
          {[
            {
              label: 'Verifikasi mitra',
              href: '/admin/partners?status=under_review',
              cap: 'verify',
              amount: data.partners.filter((o) => o.status === 'under_review')
                .length,
            },
            {
              label: 'Reservasi & exception',
              href: '/admin/reservations?status=exception',
              cap: 'reservation',
              amount: exceptions.length,
            },
            {
              label: 'Pembayaran & refund',
              href: '/admin/payments',
              cap: 'refund_request',
              amount: data.refunds.filter((v) => v.status === 'requested')
                .length,
            },
            {
              label: 'Settlement & payout',
              href: '/admin/settlements',
              cap: 'payout_make',
              amount: data.batches.filter((v) => v.status === 'review').length,
            },
          ]
            .filter(
              (v) =>
                data.ctx.capabilities.some((c) => c === v.cap) ||
                (v.cap === 'refund_request' &&
                  data.ctx.capabilities.includes('refund_approve')) ||
                (v.cap === 'payout_make' &&
                  data.ctx.capabilities.includes('payout_approve')),
            )
            .map((v) => (
              <Link className="ptr-queue" href={v.href} key={v.href}>
                <strong>{t(v.label)}</strong>
                <span>
                  {v.amount}
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            ))}
        </section>
        <section className="ptr-card">
          <span className="ptr-eyebrow">{t('KUALITAS & KONTROL')}</span>
          <h2>{t('Satu sumber, status yang terpisah')}</h2>
          <p>
            {t(
              'Pembayaran berhasil belum selalu berarti reservasi terkonfirmasi. Setiap exception memerlukan pemilik dan langkah penyelesaian.',
            )}
          </p>
          <div className="ptr-badges">
            <Badge>{t('Maker ≠ Checker')}</Badge>
            <Badge>{t('Bukti sebelum paid')}</Badge>
            <Badge>{t('Audit setiap keputusan')}</Badge>
          </div>
          <p className="ptr-muted">
            {t(
              'Demo lokal. Verifikasi provider dan transfer dana nyata memerlukan integrasi produksi.',
            )}
          </p>
        </section>
      </div>
    </>
  );
}
