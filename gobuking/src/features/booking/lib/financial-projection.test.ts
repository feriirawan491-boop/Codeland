import { expect, it } from 'vitest';
import { financialProjection, snapshotSubsidy } from './financial-projection';

it('keeps platform-funded discounts out of partner deductions and prorates funding after refund', () => {
  expect(
    financialProjection({
      paid: 900000,
      refund: 0,
      commissionBps: 1000,
      platformSubsidy: 100000,
    }),
  ).toEqual({
    netCash: 900000,
    funding: 100000,
    commission: 100000,
    entitlement: 900000,
    platformNet: 0,
  });
  expect(
    financialProjection({
      paid: 900000,
      refund: 450000,
      commissionBps: 1000,
      platformSubsidy: 100000,
    }),
  ).toEqual({
    netCash: 450000,
    funding: 50000,
    commission: 50000,
    entitlement: 450000,
    platformNet: 0,
  });
  expect(
    financialProjection({
      paid: 900000,
      refund: 900000,
      commissionBps: 1000,
      platformSubsidy: 100000,
    }).entitlement,
  ).toBe(0);
});
it('counts rental promotion units and excludes partner-funded discounts from platform subsidy', () => {
  expect(
    snapshotSubsidy({
      promotion: { fundedBy: 'platform', discount: 10000 },
      units: 3,
    }),
  ).toBe(30000);
  expect(
    snapshotSubsidy({
      promotion: { fundedBy: 'partner', discount: 10000 },
      units: 3,
    }),
  ).toBe(0);
});
