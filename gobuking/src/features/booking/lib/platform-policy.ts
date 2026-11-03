export type BookingPlatformPolicy = { version: number; commissionBps: number };
export const DEFAULT_PLATFORM_POLICY = {
  version: 1,
  commissionBps: 1000,
  venueSlaHours: 24,
  cutoffHour: 17,
  refundReviewHours: 48,
  effectiveAt: '2000-01-01T00:00:00.000Z',
  scope: 'future_only' as const,
  categories: { hotel: true, home: true, car: true, mice: true, wedding: true },
  note: 'Baseline demo',
};
const KEY = 'gobuking:public-platform-policy:v1';
export function effectivePlatformPolicy() {
  try {
    const values =
      typeof window === 'undefined'
        ? []
        : (JSON.parse(
            sessionStorage.getItem(KEY) ?? '[]',
          ) as (typeof DEFAULT_PLATFORM_POLICY)[]);
    return (
      values
        .filter((v) => Date.parse(v.effectiveAt) <= Date.now())
        .sort((a, b) => b.version - a.version)[0] ?? DEFAULT_PLATFORM_POLICY
    );
  } catch {
    return DEFAULT_PLATFORM_POLICY;
  }
}
export function publishPolicyVersions(value: unknown) {
  sessionStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new Event('gobuking:platform-policy-changed'));
}
export function capturePlatformPolicy(): BookingPlatformPolicy {
  const v = effectivePlatformPolicy();
  return { version: v.version, commissionBps: v.commissionBps };
}
