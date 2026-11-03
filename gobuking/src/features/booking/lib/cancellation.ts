export type CancellationPolicy = {
  id: string;
  label: string;
  feePercent: number;
  freeUntil?: string;
  lateFeePercent?: number;
};
export type CancellationPreview = {
  id: string;
  bookingId: string;
  version: string;
  total: number;
  paid: number;
  fee: number;
  refund: number;
  policy: string;
  feePercent: number;
  expiresAt: string;
  serverTime: string;
  eligible: boolean;
  reason: string | null;
};
export type CancellationSnapshot = Omit<
  CancellationPreview,
  'eligible' | 'expiresAt'
> & { requestedAt: string; customerReason: string };
export function calculateCancellation(input: {
  id: string;
  status: string;
  paid: boolean;
  total: number;
  policy: CancellationPolicy;
  now?: number;
}): CancellationPreview {
  const now = input.now ?? Date.now();
  const feePercent =
    input.policy.freeUntil && now > Date.parse(input.policy.freeUntil)
      ? (input.policy.lateFeePercent ?? input.policy.feePercent)
      : input.policy.feePercent;
  const eligible = ['confirmed', 'awaiting_payment'].includes(input.status);
  const paid = input.paid ? input.total : 0;
  const fee = Math.round((paid * feePercent) / 100);
  return {
    id: `CANCEL-${input.id}`,
    bookingId: input.id,
    version: `${input.id}:${input.status}:${paid}:${feePercent}:${input.policy.id}`,
    total: input.total,
    paid,
    fee,
    refund: paid - fee,
    policy: input.policy.label,
    feePercent,
    expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
    serverTime: new Date(now).toISOString(),
    eligible,
    reason: eligible
      ? null
      : 'Status pesanan ini tidak mengizinkan pembatalan mandiri.',
  };
}
