export function financialProjection(input: {
  paid: number;
  refund: number;
  commissionBps: number;
  platformSubsidy?: number;
}) {
  const netCash = Math.max(0, input.paid - input.refund),
    funding =
      input.paid > 0
        ? Math.round(((input.platformSubsidy ?? 0) * netCash) / input.paid)
        : 0,
    commission = Math.round(
      ((netCash + funding) * input.commissionBps) / 10000,
    ),
    entitlement = netCash + funding - commission;
  return {
    netCash,
    funding,
    commission,
    entitlement,
    platformNet: commission - funding,
  };
}
export function snapshotSubsidy(quote: {
  promotion?: { fundedBy: string; discount: number };
  units?: number;
}) {
  return quote.promotion?.fundedBy === 'platform'
    ? quote.promotion.discount * (quote.units ?? 1)
    : 0;
}
