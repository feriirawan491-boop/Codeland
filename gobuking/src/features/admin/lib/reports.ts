import { financialProjection } from '@/features/booking/lib/financial-projection';
import { adminBookings } from './sources';
import { guardedAdmin, readAdminStore } from './store';
import { readPartnerStore } from '@/features/partner/lib/store';
import type { AdminBooking } from './types';
export function revenueMetrics(rows: AdminBooking[], payout = 0) {
  const paid = rows.filter((b) => b.paid > 0),
    gmv = paid.reduce((n, b) => n + b.paid, 0),
    refundReserved = paid.reduce((n, b) => n + b.refund, 0),
    netSales = gmv - refundReserved,
    projections = paid.map((b) =>
      financialProjection({
        paid: b.paid,
        refund: b.refund,
        commissionBps: b.commissionBps,
        platformSubsidy: b.platformSubsidy,
      }),
    ),
    grossCommission = projections.reduce((n, p) => n + p.commission, 0),
    promoCost = projections.reduce((n, p) => n + p.funding, 0),
    commission = grossCommission - promoCost,
    partnerEntitlement = projections.reduce((n, p) => n + p.entitlement, 0);
  return {
    gmv,
    grossCommission,
    promoCost,
    refundReserved,
    netSales,
    commission,
    partnerEntitlement,
    payout,
    partnerPayable: partnerEntitlement - payout,
    cancellations: rows.filter((b) => b.status === 'cancelled').length,
  };
}
export async function adminReport(
  start: string,
  end: string,
  dateKind: 'created' | 'service',
  zone: string,
) {
  const ctx = await guardedAdmin('reports');
  const format = (iso: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso));
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    start > end ||
    !['UTC', 'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'].includes(zone)
  )
    throw new Error('Pilih periode dan zona laporan yang valid.');
  const rows = adminBookings(ctx).filter((b) => {
    const date = dateKind === 'service' ? b.start : format(b.createdAt);
    return date >= start && date <= end;
  });
  const partner = readPartnerStore(),
    payouts = partner.payouts
      .filter(
        (p) =>
          (ctx.actor.orgIds === 'all' || ctx.actor.orgIds.includes(p.orgId)) &&
          format(p.at) >= start &&
          format(p.at) <= end,
      )
      .reduce((n, p) => n + p.amount, 0);
  const gateway = readAdminStore().gateway.filter(
    (g) => g.kind === 'payment' && g.status === 'mismatch',
  );
  return {
    rows,
    ...revenueMetrics(rows, payouts),
    unreconciled: gateway.length,
    zone,
    dateKind,
    start,
    end,
  };
}
export function reportCsv(data: Awaited<ReturnType<typeof adminReport>>) {
  const header = [
    'ID',
    'Layanan',
    'Status reservasi',
    'Status pembayaran',
    'GMV IDR',
    'Refund dicadangkan IDR',
    'Komisi bps',
    'Tanggal dibuat UTC',
  ];
  return (
    '\uFEFF' +
    [
      header,
      ...data.rows.map((b) => [
        b.id,
        b.category,
        b.status,
        b.payment,
        b.paid,
        b.refund,
        b.commissionBps,
        b.createdAt,
      ]),
    ]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
  );
}
