import { financialProjection } from '@/features/booking/lib/financial-projection';
import {
  guarded,
  ownListings,
  readPartnerStore,
  savePartnerStore,
  recordActivity,
  PartnerError,
  knownCommand,
  markCommand,
} from './store';
import { sourceReservations } from './sources';
export type StatementLine = {
  id: string;
  at: string;
  reference: string;
  kind: 'sale' | 'refund' | 'payout';
  gross: number;
  deduction: number;
  entitlement: number;
  payout: number;
  funding?: number;
};
export async function partnerStatement(start: string, end: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    start > end
  )
    throw new PartnerError('VALIDATION', 'Periode statement tidak valid.');
  const ctx = await guarded('finance'),
    s = readPartnerStore(),
    bookings = sourceReservations(ctx);
  const lines: StatementLine[] = bookings
    .filter((b) => b.payment === 'succeeded')
    .flatMap((b) => {
      const initialFinance = financialProjection({
          paid: b.total,
          refund: 0,
          commissionBps: b.commissionBps,
          platformSubsidy: b.platformSubsidy,
        }),
        currentFinance = financialProjection({
          paid: b.total,
          refund: b.refund,
          commissionBps: b.commissionBps,
          platformSubsidy: b.platformSubsidy,
        });
      const commission = initialFinance.commission;
      const rows: StatementLine[] = [
        {
          id: `SALE-${b.id}`,
          at: b.createdAt,
          reference: b.id,
          kind: 'sale',
          gross: b.total,
          deduction: commission,
          entitlement: initialFinance.entitlement,
          funding: initialFinance.funding,
          payout: 0,
        },
      ];
      if (b.refund > 0) {
        const refundCommission =
          initialFinance.commission - currentFinance.commission;
        rows.push({
          id: `REFUND-${b.id}`,
          at: b.refundAt ?? b.createdAt,
          reference: b.id,
          kind: 'refund',
          gross: -b.refund,
          deduction: -refundCommission,
          entitlement: currentFinance.entitlement - initialFinance.entitlement,
          funding: currentFinance.funding - initialFinance.funding,
          payout: 0,
        });
      }
      return rows;
    });
  for (const p of s.payouts.filter((p) => p.orgId === ctx.organization.id)) {
    const allowed = ownListings(ctx).map((l) => l.id);
    const visibleAmount = p.allocations
      ? p.allocations
          .filter((a) => allowed.includes(a.listingId))
          .reduce((n, a) => n + a.amount, 0)
      : ctx.membership.role === 'owner'
        ? p.amount
        : 0;
    if (!visibleAmount) continue;
    lines.push({
      id: p.id,
      reference: p.id,
      at: p.at,
      kind: 'payout',
      gross: 0,
      deduction: 0,
      entitlement: 0,
      payout: visibleAmount,
    });
  }
  const period = lines
      .filter((l) => l.at.slice(0, 10) >= start && l.at.slice(0, 10) <= end)
      .sort((a, b) => a.at.localeCompare(b.at)),
    opening = lines
      .filter((l) => l.at.slice(0, 10) < start)
      .reduce((n, l) => n + l.entitlement - l.payout, 0);
  return {
    start,
    end,
    lines: period,
    opening,
    gross: period.reduce((n, l) => n + l.gross, 0),
    grossSales: period
      .filter((l) => l.kind === 'sale')
      .reduce((n, l) => n + l.gross, 0),
    refunds: -period
      .filter((l) => l.kind === 'refund')
      .reduce((n, l) => n + l.gross, 0),
    cancellations: bookings.filter(
      (b) =>
        b.status === 'cancelled' &&
        (b.refundAt ?? b.createdAt).slice(0, 10) >= start &&
        (b.refundAt ?? b.createdAt).slice(0, 10) <= end,
    ).length,
    funding: period.reduce((n, l) => n + (l.funding ?? 0), 0),
    deductions: period.reduce((n, l) => n + l.deduction, 0),
    entitlement: period.reduce((n, l) => n + l.entitlement, 0),
    paid: period.reduce((n, l) => n + l.payout, 0),
    closing: opening + period.reduce((n, l) => n + l.entitlement - l.payout, 0),
    policy:
      'Komisi contoh 10%; pengembalian komisi mengikuti proporsi refund. Belum menjadi ketentuan komersial.',
  };
}
export async function simulatePartnerPayout(commandId: string) {
  const before = await guarded('finance');
  if (before.membership.role !== 'owner')
    throw new PartnerError(
      '403',
      'Simulasi payout hanya tersedia untuk Owner demo.',
    );
  const statement = await partnerStatement('2000-01-01', '2100-01-01');
  const ctx = await guarded('finance'),
    s = readPartnerStore();
  if (ctx.sessionKey !== before.sessionKey)
    throw new PartnerError('409', 'Konteks berubah. Muat ulang statement.');
  if (knownCommand(s, ctx, commandId, 'payout')) return;
  const facts = sourceReservations(ctx).filter(
    (b) => b.payment === 'succeeded',
  );
  const currentClosing =
    facts.reduce(
      (n, b) =>
        n +
        financialProjection({
          paid: b.total,
          refund: b.refund,
          commissionBps: b.commissionBps,
          platformSubsidy: b.platformSubsidy,
        }).entitlement,
      0,
    ) -
    s.payouts
      .filter((p) => p.orgId === ctx.organization.id)
      .reduce((n, p) => n + p.amount, 0);
  if (currentClosing !== statement.closing)
    throw new PartnerError(
      '409',
      'Fakta keuangan berubah. Muat ulang statement sebelum mencatat payout.',
    );
  const allocations = ownListings(ctx).map((l) => ({
    listingId: l.id,
    amount:
      facts
        .filter((b) => b.listingId === l.id)
        .reduce(
          (n, b) =>
            n +
            financialProjection({
              paid: b.total,
              refund: b.refund,
              commissionBps: b.commissionBps,
              platformSubsidy: b.platformSubsidy,
            }).entitlement,
          0,
        ) -
      s.payouts
        .filter((p) => p.orgId === ctx.organization.id)
        .reduce(
          (n, p) =>
            n +
            (p.allocations
              ?.filter((a) => a.listingId === l.id)
              .reduce((x, a) => x + a.amount, 0) ?? 0),
          0,
        ),
  }));
  if (statement.closing <= 0 || !ctx.organization.bank)
    throw new PartnerError(
      'VALIDATION',
      'Tidak ada estimasi hak positif atau rekening terverifikasi.',
    );
  s.payouts.push({
    id: `PAYOUT-${crypto.randomUUID().slice(0, 8)}`,
    orgId: ctx.organization.id,
    amount: statement.closing,
    at: new Date().toISOString(),
    bankVersion: ctx.organization.bank.version,
    bankLast4: ctx.organization.bank.last4,
    allocations,
  });
  recordActivity(
    s,
    ctx,
    'Payout simulasi dicatat; tidak ada transfer dana nyata',
    ctx.organization.id,
  );
  markCommand(s, ctx, commandId, 'payout');
  savePartnerStore(s);
}
export function statementCsv(
  statement: Awaited<ReturnType<typeof partnerStatement>>,
) {
  const quote = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return (
    '\uFEFF' +
    [
      [
        'Tanggal',
        'Referensi',
        'Jenis',
        'Bruto IDR',
        'Pendanaan promo IDR',
        'Potongan IDR',
        'Hak mitra IDR',
        'Payout IDR',
      ],
      ...statement.lines.map((l) => [
        l.at,
        l.reference,
        l.kind,
        l.gross,
        l.funding ?? 0,
        l.deduction,
        l.entitlement,
        l.payout,
      ]),
    ]
      .map((row) => row.map(quote).join(','))
      .join('\r\n')
  );
}
