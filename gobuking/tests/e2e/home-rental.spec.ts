import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const query =
  'locationId=bali&start=2099-12-10&end=2099-12-12&adults=2&children=0';
test('home results paginate, search and remain accessible', async ({
  page,
}) => {
  await page.goto(`/homes?${query}`);
  await expect(page.locator('.home-result-card')).toHaveCount(6);
  await page
    .getByRole('button', { name: 'Halaman berikutnya', exact: true })
    .click();
  await expect(page.locator('.home-result-card')).toHaveCount(2);
  await page
    .getByRole('searchbox', { name: 'Cari nama hunian', exact: true })
    .fill('Nala');
  await expect(page.locator('.home-result-card')).toHaveCount(1);
  await expect(page).not.toHaveURL(/page=2/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(scan.violations).toEqual([]);
});
test('entire-home checkout requires account and rules, pays directly and downloads invoice', async ({
  page,
}) => {
  await page.goto(`/homes/villa-nala-ubud?${query}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Villa Nala Ubud',
  );
  const reserve = page.getByRole('button', {
    name: 'Pesan seluruh hunian',
    exact: true,
  });
  if (await reserve.isVisible()) await reserve.click();
  else
    await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await expect(page).toHaveURL(/\/checkout\/home\//);
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await page.getByLabel('Nama lengkap', { exact: true }).fill('Rental Guest');
  await page
    .getByLabel('Email akun', { exact: true })
    .fill('rental@example.com');
  await page
    .getByLabel('Nomor telepon akun', { exact: true })
    .fill('081234567890');
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Lanjut daftar', exact: true })
    .click();
  await page.getByLabel('Kode OTP demo', { exact: true }).fill('123456');
  await page
    .getByRole('button', { name: 'Daftar & lanjutkan', exact: true })
    .click();
  await expect(
    page.getByLabel('Nama lengkap pemesan', { exact: true }),
  ).toHaveValue('Rental Guest');
  await page.getByRole('radio', { name: 'QRIS demo', exact: true }).check();
  for (const checkbox of await page.getByRole('checkbox').all())
    await checkbox.check();
  await page
    .getByRole('button', { name: 'Lanjut ke pembayaran demo', exact: true })
    .click();
  await expect(page).toHaveURL(/\/bookings\/GB-DEMO-/);
  await expect(page.getByText('SIMULASI — JANGAN TRANSFER UANG')).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Simulasikan pembayaran berhasil',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Instruksi kedatangan', exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', {
      name: 'Unduh invoice booking/reservasi',
      exact: true,
    })
    .first()
    .click();
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('home detail supports English, responsive layouts, calendar blocks and error states', async ({
  page,
}, testInfo) => {
  await page.goto(`/homes/villa-nala-ubud?${query}`);
  await page.getByRole('button', { name: 'Pilih bahasa', exact: true }).click();
  await page.getByRole('button', { name: /English Bahasa Inggris/ }).click();
  await expect(
    page.getByRole('heading', {
      name: 'An entire home, all yours.',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'House rules', exact: true }),
  ).toBeVisible();
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow at ${width}`,
    ).toBe(true);
  }
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.screenshot({
    path: `/tmp/gobuking-home-rental-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.goto(`/homes?${query}&scenario=empty`);
  await expect(
    page.getByRole('heading', {
      name: 'No homes match your search',
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(`/homes?${query}&view=map&scenario=map_error`);
  await expect(
    page.getByText(
      'The map could not load. Home listings are still available.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.goto(`/homes/villa-nala-ubud?${query}&scenario=inactive`);
  await expect(
    page.getByText('This property is inactive or unavailable.', {
      exact: true,
    }),
  ).toBeVisible();
});
