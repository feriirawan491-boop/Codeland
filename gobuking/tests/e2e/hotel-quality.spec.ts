import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const query =
  'locationId=bali&start=2099-12-10&end=2099-12-12&adults=2&rooms=1';
test('hotel gallery, room replacement, mobile filter and map selection', async ({
  page,
}, info) => {
  await page.route('https://*.tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  await page.goto(`/hotels?${query}&view=map`);
  await expect(page.locator('.hotel-map-pin')).toHaveCount(8);
  await page.locator('.hotel-map-pin').first().focus();
  await page.locator('.hotel-map-pin').first().press('Enter');
  await expect(page.locator('.hotel-result-card.is-selected')).toHaveCount(1);
  await page.goto(`/hotels?${query}&page=2`);
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Filter', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Termasuk sarapan', { exact: true }).check();
    await expect(page).not.toHaveURL(/breakfast=true/);
    await dialog
      .getByRole('button', { name: 'Terapkan filter', exact: true })
      .click();
  } else await page.getByLabel('Termasuk sarapan', { exact: true }).check();
  await expect(page).toHaveURL(/breakfast=true/);
  await expect(page).not.toHaveURL(/page=2/);
  await page.goto(`/hotels/seruni-resort-spa?${query}`);
  await page.getByRole('button', { name: 'Buka foto 4', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByRole('button', { name: 'Foto berikutnya', exact: true })
    .click();
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Pilih tarif', exact: true })
    .first()
    .click();
  await page
    .getByRole('button', { name: 'Pilih tarif', exact: true })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toContainText(
    'Ganti pilihan kamar atau tarif?',
  );
  await page
    .getByRole('button', { name: 'Ganti pilihan', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Jumlah kamar', exact: true })
    .selectOption('2');
  await expect(
    page.getByRole('button', { name: 'Tarif dipilih', exact: true }),
  ).toHaveCount(1);
  const a11y = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(a11y.violations).toEqual([]);
  await page.screenshot({
    path: `test-results/hotel-detail-${info.project.name}.png`,
    fullPage: true,
  });
});
test('English Hotel content and viewport widths', async ({ page, context }) => {
  await context.addCookies([
    { name: 'gobuking-locale', value: 'en', domain: '127.0.0.1', path: '/' },
  ]);
  await page.goto(`/hotels?${query}`);
  await expect(
    page.getByRole('heading', {
      name: 'Find a place to stay in Bali',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('searchbox', { name: 'Search hotel name', exact: true }),
  ).toBeVisible();
  await page.goto(`/hotels/seruni-resort-spa?${query}`);
  await expect(
    page.getByRole('heading', {
      name: 'Choose your room and rate',
      exact: true,
    }),
  ).toBeVisible();
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
