import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function selectRoom(page: Page) {
  await page.goto(
    '/hotels/savana-ubud-retreat?locationId=bali&start=2099-12-10&end=2099-12-12&adults=2&rooms=1',
  );
  await page
    .getByRole('button', { name: 'Pilih tarif', exact: true })
    .first()
    .click();
  const desktop = page.getByRole('button', {
    name: 'Lanjut ke checkout demo',
    exact: true,
  });
  if (await desktop.isVisible()) await desktop.click();
  else
    await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await expect(page).toHaveURL(/\/checkout\/hotel\//);
}
async function logOut(page: Page) {
  const trigger = page.getByRole('button', { name: 'Akun saya', exact: true });
  if (!(await trigger.isVisible()))
    await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
  await trigger.click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
}
test('registration is mandatory, account prefill survives sign-out/login, QRIS opens without partner approval', async ({
  page,
}, info) => {
  await selectRoom(page);
  await expect(
    page.getByRole('heading', { name: 'Masuk untuk memesan', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#guest-name')).toHaveCount(0);
  await page.getByLabel('Email akun', { exact: true }).fill('new@example.com');
  await page.getByRole('button', { name: 'Lanjut masuk', exact: true }).click();
  await expect(page.locator('.account-error[role=alert]')).toContainText(
    'Email belum terdaftar',
  );
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await page.getByLabel('Nama lengkap', { exact: true }).fill('Pelanggan Baru');
  await page
    .getByLabel('Nomor telepon akun', { exact: true })
    .fill('081234567890');
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Lanjut daftar', exact: true })
    .click();
  await page.getByLabel('Kode OTP demo', { exact: true }).fill('000000');
  await page
    .getByRole('button', { name: 'Daftar & lanjutkan', exact: true })
    .click();
  await expect(page.locator('.account-error[role=alert]')).toContainText(
    'Kode demo belum sesuai',
  );
  await page.getByLabel('Kode OTP demo', { exact: true }).fill('123456');
  await page
    .getByRole('button', { name: 'Daftar & lanjutkan', exact: true })
    .click();
  await expect(page.locator('#guest-name')).toHaveValue('Pelanggan Baru');
  await expect(page.locator('#guest-email')).toHaveValue('new@example.com');
  await logOut(page);
  await expect(page.locator('#guest-name')).toHaveCount(0);
  await page.getByLabel('Email akun', { exact: true }).fill('new@example.com');
  await page.getByRole('button', { name: 'Lanjut masuk', exact: true }).click();
  await page.getByLabel('Kode OTP demo', { exact: true }).fill('123456');
  await page
    .getByRole('button', { name: 'Masuk ke akun demo', exact: true })
    .click();
  await expect(page.locator('#guest-phone')).toHaveValue('081234567890');
  await page.getByRole('radio', { name: 'QRIS demo', exact: true }).check();
  await page.getByRole('checkbox').check();
  const a11y = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(a11y.violations).toEqual([]);
  await page.screenshot({
    path: `test-results/checkout-account-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Lanjut ke pembayaran demo', exact: true })
    .click();
  await expect(page).toHaveURL(/\/bookings\/GB-DEMO-/);
  await expect(
    page.getByText('DEMO-QRIS — NO PAYMENT CODE', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.booking-domain-statuses')).toContainText(
    'Menunggu pembayaran',
  );
  await expect(
    page.getByRole('button', { name: /Simulasikan mitra/ }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText('DEMO-QRIS — NO PAYMENT CODE', { exact: true }),
  ).toBeVisible();
});
test('English account registration and login gates are accessible', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'gobuking-locale', value: 'en', domain: '127.0.0.1', path: '/' },
  ]);
  await page.goto('/bookings/non-existent-booking');
  await expect(
    page.getByRole('heading', { name: 'Sign in to book', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Create an account to book',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel('Full name', { exact: true })).toBeVisible();
  const a11y = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(a11y.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
