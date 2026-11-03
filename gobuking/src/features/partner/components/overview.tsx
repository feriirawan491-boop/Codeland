'use client';
import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardList,
  MessageSquare,
  Building2,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import type { partnerAdapter } from '../lib/adapter';
import { money } from './shared';
export function PartnerOverview({
  data,
}: {
  data: Awaited<ReturnType<typeof partnerAdapter.getWorkspace>>;
}) {
  const { t } = useI18n();
  const active = data.reservations.filter((b) =>
      ['confirmed', 'in_use'].includes(b.status),
    ),
    requests = data.reservations.filter((b) => b.status === 'requested'),
    inquiries = data.inquiries.filter(
      (i) => !['closed_lost', 'closed_won', 'withdrawn'].includes(i.status),
    );
  return (
    <>
      <div className="ptr-kpis">
        {[
          {
            label: 'Listing aktif',
            value: data.listings.filter((l) => l.status === 'published').length,
            icon: Building2,
          },
          {
            label: 'Reservasi terkonfirmasi',
            value: active.length,
            icon: CalendarCheck,
          },
          {
            label: 'Request perlu ditinjau',
            value: requests.length,
            icon: ClipboardList,
          },
          {
            label: 'Inquiry aktif',
            value: inquiries.length,
            icon: MessageSquare,
          },
        ].map((v) => (
          <div className="ptr-kpi" key={v.label}>
            <v.icon size={19} />
            <span>{t(v.label)}</span>
            <strong>{v.value}</strong>
          </div>
        ))}
      </div>
      <div className="ptr-grid">
        <section className="ptr-card">
          <span className="ptr-eyebrow">{t('PRIORITAS TIM')}</span>
          <h2>{t('Siap untuk langkah berikutnya')}</h2>
          <p>
            {t(
              'Tinjau antrean dan siapkan layanan pelanggan dari satu tempat.',
            )}
          </p>
          {data.context.capabilities.includes('reservation') && (
            <Link
              className="ptr-queue"
              href="/partner/reservations?status=requested"
            >
              <div>
                <strong>{t('Request rental')}</strong>
                <small>{t('Periksa kelayakan dan alokasi kendaraan')}</small>
              </div>
              <span>
                {requests.length}
                <ArrowUpRight size={17} />
              </span>
            </Link>
          )}
          {data.context.capabilities.includes('crm') && (
            <Link className="ptr-queue" href="/partner/inquiries">
              <div>
                <strong>{t('Venue CRM')}</strong>
                <small>
                  {t('Respons inquiry dan kirim penawaran terbaru')}
                </small>
              </div>
              <span>
                {inquiries.length}
                <ArrowUpRight size={17} />
              </span>
            </Link>
          )}
          {data.context.capabilities.includes('finance') && (
            <Link className="ptr-queue" href="/partner/finance">
              <div>
                <strong>{t('Statement & payout')}</strong>
                <small>{t('Cocokkan penjualan, refund, dan hak mitra')}</small>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          )}
        </section>
        <section className="ptr-card">
          <span className="ptr-eyebrow">{t('PERSIAPAN LAYANAN')}</span>
          <h2>{t('Reservasi mendatang')}</h2>
          {active.length ? (
            active.slice(0, 4).map((b) => (
              <div className="ptr-upcoming" key={b.id}>
                <strong>{b.name}</strong>
                <p>
                  {b.start.replace('T', ' ')} · {b.zone}
                </p>
                <small>
                  {b.id} · {money(b.total)}
                </small>
              </div>
            ))
          ) : (
            <p>{t('Belum ada layanan terkonfirmasi pada assignment ini.')}</p>
          )}
          {data.context.capabilities.includes('operation') && (
            <Link className="ptr-text-button" href="/partner/operations">
              {t('Buka operasional')}
              <ArrowUpRight size={16} />
            </Link>
          )}
        </section>
      </div>
    </>
  );
}
