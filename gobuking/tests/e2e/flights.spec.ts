import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const query =
  'locationId=CGK&destinationId=DPS&start=2099-12-10&trip=oneway&adults=2&children=0&infants=0&cabin=economy';
test('flight search validates airports, swaps route and omits return date for one way', async ({
  page,
}) => {
  await page.goto('/flights');
  await page
    .getByRole('button', { name: 'Tukar bandara asal dan tujuan', exact: true })
    .click();
  await expect(page.locator('#flight-locationId')).toHaveValue('Bali (DPS)');
  await expect(page.locator('#flight-destinationId')).toHaveValue(
    'Jakarta (CGK)',
  );
  await page.getByLabel('Pulang pergi', { exact: true }).check();
  await page.locator('#flight-start').fill('2099-12-10');
  await page.locator('#flight-end').fill('2099-12-14');
  await page.getByLabel('Sekali jalan', { exact: true }).check();
  await page
    .getByRole('button', { name: 'Cari penerbangan', exact: true })
    .click();
  await expect(page).toHaveURL(/\/flights\/results\?/);
  expect(new URL(page.url()).searchParams.has('end')).toBe(false);
  expect(new URL(page.url()).searchParams.get('locationId')).toBe('DPS');
  await expect(page.locator('.flight-offer-card')).toHaveCount(5);
  await page.goto(
    `/flights/results?${query.replace('destinationId=DPS', 'destinationId=CGK')}`,
  );
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Bandara tujuan harus berbeda dari asal.',
  );
  await expect(page.locator('.flight-offer-card')).toHaveCount(0);
});
test('results filter, paginate and show full timeline with local zones and unknown baggage', async ({
  page,
}, testInfo) => {
  await page.goto(`/flights/results?${query}`);
  await expect(page.locator('.flight-offer-card')).toHaveCount(5);
  await page
    .getByRole('button', { name: 'Halaman berikutnya', exact: true })
    .click();
  await expect(page.locator('.flight-offer-card')).toHaveCount(3);
  if (testInfo.project.name === 'mobile')
    await page.getByRole('button', { name: 'Filter', exact: true }).click();
  const filters =
    testInfo.project.name === 'mobile'
      ? page.getByRole('dialog')
      : page.locator('.flight-desktop-filters');
  await filters.getByRole('radio', { name: 'Langsung', exact: true }).check();
  if (testInfo.project.name === 'mobile')
    await page
      .getByRole('button', { name: 'Terapkan filter', exact: true })
      .click();
  await expect(page).not.toHaveURL(/page=2/);
  await expect(page.locator('.flight-offer-card')).toHaveCount(5);
  await page
    .getByRole('combobox', { name: 'Urutkan', exact: true })
    .selectOption('duration');
  await page
    .getByRole('link', { name: 'Lihat itinerary', exact: true })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Itinerary penerbangan Anda',
  );
  await expect(page.locator('.flight-segment')).toHaveCount(1);
  await expect(
    page.getByText('Asia/Jakarta', { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('Asia/Makassar', { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /bayar|pesan tiket/i }),
  ).toHaveCount(0);
  await page
    .getByRole('link', { name: 'Kembali ke hasil', exact: true })
    .click();
  await expect(page).toHaveURL(/stops=direct/);
  await expect(page).toHaveURL(/sort=duration/);
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(scan.violations).toEqual([]);
});
test('roundtrip clears incompatible return and displays one supplier-priced combination', async ({
  page,
}) => {
  await page.goto(
    `/flights/results?${query.replace('trip=oneway', 'trip=roundtrip')}&end=2099-12-14`,
  );
  await page
    .getByRole('button', { name: 'Pilih berangkat', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: 'Pilih pulang', exact: true }),
  ).toHaveCount(2);
  await page
    .getByRole('button', { name: 'Pilih pulang', exact: true })
    .last()
    .click();
  await expect(
    page.getByText('Kombinasi perjalanan Anda', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Lihat itinerary', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Penerbangan pulang', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Kembali ke hasil', exact: true })
    .click();
  await expect(page).toHaveURL(/selected=/);
  await page
    .getByRole('button', { name: 'Ganti berangkat', exact: true })
    .click();
  await expect(
    page.getByText('Kombinasi perjalanan Anda', { exact: true }),
  ).toHaveCount(0);
  await expect(page).not.toHaveURL(/selected=/);
  await page
    .getByRole('button', { name: 'Pilih berangkat', exact: true })
    .nth(1)
    .click();
  await expect(
    page.getByRole('button', { name: 'Pilih pulang', exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByText('Kombinasi perjalanan Anda', { exact: true }),
  ).toHaveCount(0);
});
test('supplier states stay distinct, retry respects throttling and English reflows', async ({
  page,
}, testInfo) => {
  await page.goto(`/flights/results?${query}&scenario=empty`);
  await expect(
    page.getByRole('heading', {
      name: 'Belum ada penerbangan untuk pencarian ini',
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(`/flights/results?${query}&scenario=timeout`);
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Pencarian melewati batas waktu.',
  );
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
  await expect(page.locator('.flight-offer-card')).toHaveCount(5);
  await page.goto(`/flights/results?${query}&scenario=rate_limited`);
  await expect(
    page.getByRole('button', { name: /Coba lagi dalam/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Coba lagi', exact: true }),
  ).toBeEnabled({ timeout: 10000 });
  await page.getByRole('button', { name: 'Pilih bahasa', exact: true }).click();
  await page.getByRole('button', { name: /English Bahasa Inggris/ }).click();
  await page.goto(`/flights/results?${query}&scenario=no_expiry`);
  await expect(
    page.getByText('No expiry provided. Prices may change.', { exact: true }),
  ).toBeVisible();
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow ${width}`,
    ).toBe(true);
  }
  await page.screenshot({
    path: `/tmp/gobuking-flights-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.goto(`/flights/results?${query}&scenario=expired`);
  await page
    .getByRole('link', { name: 'View itinerary', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Offer expired', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Refresh offer', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Offer expired', exact: true }),
  ).toHaveCount(0);
});

test('itinerary drawer restores focus, unknown baggage stays explicit and overnight arrivals show next day', async ({
  page,
}) => {
  await page.goto(
    `/flights/results?${query}&airlines=aruna&departure=afternoon`,
  );
  await expect(page.locator('.flight-offer-card')).toHaveCount(1);
  const trigger = page.getByRole('button', {
    name: 'Rincian penerbangan',
    exact: true,
  });
  await trigger.click();
  await expect(
    page.getByRole('dialog').getByText('Belum tersedia', { exact: true }),
  ).toHaveCount(2);
  await expect(
    page
      .getByRole('dialog')
      .getByText(
        'Informasi bagasi belum diberikan; jangan diasumsikan termasuk tarif.',
        { exact: true },
      ),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.goto(`/flights/results?${query}&airlines=nusa&departure=evening`);
  await expect(page.locator('.flight-offer-card')).toHaveCount(1);
  await page
    .getByRole('link', { name: 'Lihat itinerary', exact: true })
    .click();
  await expect(page.locator('.flight-segment sup')).toContainText('+1 hari');
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.goto(`/flights/results?${query}&scenario=forbidden`);
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Anda tidak memiliki akses ke hasil ini.',
  );
  await expect(page.locator('.flight-offer-card')).toHaveCount(0);
});
