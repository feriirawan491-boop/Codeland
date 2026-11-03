import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import AxeBuilder from '@axe-core/playwright';
const query =
  'locationId=bali&start=2099-12-10&end=2099-12-12&adults=2&children=0&rooms=1';
async function checkout(
  page: Page,
  slug = 'seruni-resort-spa',
  scenario = 'ready',
) {
  await page.goto(`/hotels/${slug}?${query}&scenario=${scenario}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page
    .getByRole('button', { name: 'Pilih tarif', exact: true })
    .first()
    .click();
  const desktopAction = page.getByRole('button', {
    name: 'Lanjut ke checkout demo',
    exact: true,
  });
  if (await desktopAction.isVisible()) await desktopAction.click();
  else
    await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await expect(page).toHaveURL(/\/checkout\/hotel\//);
  await expect(
    page.getByRole('heading', { name: 'Siapkan perjalanan Anda.' }),
  ).toBeVisible();
}
async function guest(page: Page, qris = false) {
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await page.getByLabel('Nama lengkap', { exact: true }).fill('Tamu Demo');
  await page
    .getByLabel('Email akun', { exact: true })
    .fill('guest@example.com');
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
  ).toHaveValue('Tamu Demo');
  await page
    .getByLabel('Nama tamu utama', { exact: true })
    .fill('Tamu Utama 李');
  if (qris)
    await page.getByRole('radio', { name: 'QRIS demo', exact: true }).check();
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Lanjut ke pembayaran demo', exact: true })
    .click();
  await expect(page).toHaveURL(/\/bookings\/GB-DEMO-/);
  await expect(page.getByText('SIMULASI — JANGAN TRANSFER UANG')).toBeVisible();
}
test('hotel results filters, pagination, map failure and accessible layout', async ({
  page,
}, testInfo) => {
  await page.goto(`/hotels?${query}`);
  await expect(page.locator('.hotel-result-card')).toHaveCount(6);
  await page
    .getByRole('button', { name: 'Halaman berikutnya', exact: true })
    .click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('.hotel-result-card')).toHaveCount(2);
  await page
    .getByRole('combobox', { name: 'Urutkan', exact: true })
    .selectOption('price');
  await expect(page).not.toHaveURL(/page=2/);
  await page
    .getByRole('searchbox', { name: 'Cari nama hotel', exact: true })
    .fill('Seruni');
  await expect(page.locator('.hotel-result-card')).toHaveCount(1);
  await page.goto(`/hotels?${query}&view=map&scenario=map_error`);
  await expect(
    page.getByText('Peta belum dapat dimuat. Daftar hotel tetap tersedia.'),
  ).toBeVisible();
  await expect(page.locator('.hotel-result-card')).toHaveCount(8);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({
    path: `test-results/hotel-results-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
test('instant hotel demo checkout, verified payment, invoice and refund', async ({
  page,
}, testInfo) => {
  await checkout(page);
  await guest(page);
  await expect(
    page.getByRole('button', {
      name: 'Unduh invoice booking/reservasi',
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.getByText('SIMULASI — JANGAN TRANSFER UANG')).toBeVisible();

  await page
    .getByRole('button', {
      name: 'Simulasikan pembayaran berhasil',
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole('button', {
        name: 'Unduh invoice booking/reservasi',
        exact: true,
      })
      .first(),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page
    .getByRole('button', {
      name: 'Unduh invoice booking/reservasi',
      exact: true,
    })
    .first()
    .click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(
    /^invoice-booking-reservasi-GB-DEMO-.*\.pdf$/,
  );
  const file = testInfo.outputPath('booking-invoice.pdf');
  await download.saveAs(file);
  const document = await PDFDocument.load(await readFile(file));
  expect(document.getPageCount()).toBeGreaterThan(0);
  expect(document.getTitle()).toContain(
    new URL(page.url()).pathname.split('/').pop(),
  );
  await expect(page.locator('main')).not.toContainText(/voucher/i);
  await expect(
    page.getByText('Simulasi email tercatat', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Lihat contoh email', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('guest@example.com');
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', {
      name: 'Simulasikan email invoice gagal',
      exact: true,
    })
    .click();
  await expect(
    page.getByText('Simulasi email gagal', { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('button', {
        name: 'Unduh invoice booking/reservasi',
        exact: true,
      })
      .first(),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Simulasikan kirim ulang email', exact: true })
    .click();
  await expect(
    page.getByText('Simulasi email tercatat', { exact: true }),
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({
    path: `test-results/hotel-booking-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Ajukan pembatalan demo', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Tinjau pembatalan', exact: true })
    .click();
  await page.getByLabel('Alasan pembatalan').fill('Rencana perjalanan berubah');
  await page.getByRole('dialog').getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Konfirmasi pembatalan', exact: true })
    .click();
  await expect(page.locator('.booking-domain-statuses')).toContainText(
    'Pesanan dibatalkan',
  );
  await expect(page.locator('.booking-domain-statuses')).toContainText(
    'Pembayaran demo diterima',
  );
  await expect(page.locator('.booking-domain-statuses')).toContainText(
    'Pengembalian dana diproses',
  );
  await expect(
    page
      .getByRole('button', {
        name: 'Unduh invoice booking/reservasi',
        exact: true,
      })
      .first(),
  ).toBeVisible();
});
test('all hotels open payment directly and late payment never issues an invoice', async ({
  page,
}) => {
  await checkout(page, 'savana-ubud-retreat');
  await guest(page, true);
  await expect(
    page.getByRole('button', {
      name: 'Buka instruksi pembayaran demo',
      exact: true,
    }),
  ).toHaveCount(0);

  await page
    .getByRole('button', { name: 'Simulasikan kedaluwarsa', exact: true })
    .click();
  await page
    .getByRole('button', {
      name: 'Simulasikan pembayaran terlambat',
      exact: true,
    })
    .click();
  await expect(page.locator('.booking-domain-statuses')).toContainText(
    'Reservasi sedang ditangani',
  );
  await expect(
    page.getByRole('button', {
      name: 'Unduh invoice booking/reservasi',
      exact: true,
    }),
  ).toHaveCount(0);
});
test('repricing and quote expiry require review before checkout', async ({
  page,
}) => {
  await checkout(page, 'seruni-resort-spa', 'price_changed');
  await expect(
    page.getByRole('heading', { name: 'Harga telah berubah', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Setujui harga terbaru', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Harga telah berubah', exact: true }),
  ).toHaveCount(0);
  await checkout(page, 'seruni-resort-spa', 'quote_expired');
  await expect(
    page.getByRole('heading', { name: 'Penawaran kedaluwarsa', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Perbarui penawaran', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Penawaran kedaluwarsa', exact: true }),
  ).toHaveCount(0);
});
