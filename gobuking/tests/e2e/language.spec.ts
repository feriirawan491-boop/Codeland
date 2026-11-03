import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function english(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Pilih bahasa', exact: true }).click();
  await page.getByRole('button', { name: /English Bahasa Inggris/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByRole('heading', { name: 'Plan your journey', exact: true }),
  ).toBeVisible();
}
test('switch language without losing search draft, persist and return to Indonesian', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#hotel-locationId').click();
  await page
    .getByRole('option', { name: 'Bali Destinasi', exact: false })
    .click();
  await page.locator('#hotel-start').fill('2099-12-10');
  await page.locator('#hotel-end').fill('2099-12-12');
  await english(page);
  await expect(page.locator('#hotel-locationId')).toHaveValue('Bali');
  await expect(page.locator('#hotel-start')).toHaveValue('2099-12-10');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Find a place to stay in Bali',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/10 Dec 2099/).first()).toBeVisible();
  await page.getByRole('link', { name: 'Edit search', exact: true }).click();
  await expect(page).toHaveURL(/\/\?service=hotel/);
  await expect(page.locator('#hotel-end')).toHaveValue('2099-12-12');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByRole('heading', { name: 'Plan your journey', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose language', exact: true })
    .click();
  await page
    .getByRole('button', { name: /Bahasa Indonesia Indonesian/ })
    .click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  await expect(
    page.getByRole('heading', {
      name: 'Rencanakan perjalanan Anda',
      exact: true,
    }),
  ).toBeVisible();
});
test('English validation, forms, server pages, currency and accessibility', async ({
  page,
}) => {
  await page.goto('/');
  await english(page);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(
    page
      .getByRole('form', { name: 'Hotels search', exact: true })
      .getByRole('alert'),
  ).toContainText('Choose a location');
  await expect(
    page
      .getByRole('form', { name: 'Hotels search', exact: true })
      .getByRole('alert'),
  ).toContainText('Select a start date.');
  await page.getByRole('tab', { name: 'Flights', exact: true }).click();
  await expect(page.getByLabel('One way', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'From', exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Car rentals', exact: true }).click();
  await expect(
    page.getByLabel('Pickup & return area', { exact: true }),
  ).toBeVisible();
  await page.goto('/info/help');
  await expect(
    page.getByRole('heading', { name: 'How can we help?', exact: true }),
  ).toBeVisible();
  await page.goto('/offers');
  await expect(
    page.getByRole('heading', {
      name: 'Offers for your next adventure.',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'View offer terms', exact: true })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toContainText('cannot be redeemed');
  await page.keyboard.press('Escape');
  await page.goto('/');
  await expect(page.getByText('IDR 1,250,000', { exact: true })).toBeVisible();
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
});
