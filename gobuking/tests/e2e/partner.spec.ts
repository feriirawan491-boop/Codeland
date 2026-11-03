import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function setup(page: Page) {
  await page.goto('/partner');
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await page.getByLabel('Nama lengkap', { exact: true }).fill('Rani Partner');
  await page
    .getByLabel('Email akun', { exact: true })
    .fill('partner-owner@example.com');
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
  await page.getByText('Jelajahi workspace contoh', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Aktifkan workspace mitra demo', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Ringkasan', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.ptr-kpi')).toHaveCount(4);
}
async function examples(page: Page) {
  await page.getByText('Simulasi aktivitas usaha', { exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Tambahkan aktivitas mitra contoh',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Tambahkan aktivitas mitra contoh',
      exact: true,
    }),
  ).toBeEnabled({ timeout: 30000 });
  await expect(
    page.getByText('Aktivitas contoh siap ditinjau.', { exact: true }),
  ).toBeVisible();
}
test('partner roles, organization isolation, listing validation and calendar preview', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/partner/listings');
  await page
    .getByRole('button', { name: 'Tambah listing', exact: true })
    .click();
  await page
    .getByLabel('Nama listing', { exact: true })
    .fill('Listing Draft Test');
  await page
    .getByRole('button', { name: 'Simpan draft listing', exact: true })
    .click();
  const card = page.locator('.ptr-card').filter({
    has: page.getByRole('heading', {
      name: 'Listing Draft Test',
      exact: true,
    }),
  });
  await card
    .getByRole('button', { name: 'Ajukan review listing', exact: true })
    .click();
  await expect(page.locator('main [role=alert]')).toContainText('Lengkapi');
  await page.goto('/partner/business');
  const options = await page.locator('#partner-org option').allTextContents();
  const ops = options.find(
    (v) => v.includes('Nusa Hospitality') && v.includes('Operations'),
  )!;
  await page
    .getByLabel('Organisasi / persona demo', { exact: true })
    .selectOption({ label: ops });
  await expect(
    page.getByRole('button', {
      name: 'Ajukan perubahan rekening',
      exact: true,
    }),
  ).toHaveCount(0);
  await page.goto('/partner/team');
  await expect(page.locator('main [role=alert]')).toContainText('izin');
  const owner = options.find(
    (v) => v.includes('Nusa Hospitality') && v.includes('Owner'),
  )!;
  await page
    .getByLabel('Organisasi / persona demo', { exact: true })
    .selectOption({ label: owner });
  await page.goto('/partner/inventory');
  await page.getByLabel('Dari tanggal', { exact: true }).fill('2099-12-10');
  await page
    .getByLabel('Sampai tanggal (inklusif)', { exact: true })
    .fill('2099-12-12');
  await page
    .getByRole('button', { name: 'Preview dampak perubahan', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Preview perubahan kalender',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Konfirmasi perubahan kalender', exact: true })
    .click();
  await expect(
    page.getByText('Kalender dan tarif berhasil diperbarui.', { exact: true }),
  ).toBeVisible();
});
test('source bookings, CRM version draft, finance CSV, team revoke and support', async ({
  page,
}) => {
  await setup(page);
  await examples(page);
  await page.goto('/partner/reservations');
  await expect(page.locator('.ptr-reservation')).toHaveCount(4);
  await page.goto('/partner/inquiries');
  await page.getByText('Susun draft penawaran baru', { exact: true }).click();
  await page.getByLabel('Nilai item (IDR)', { exact: true }).fill('7500000');
  await page
    .getByRole('button', { name: 'Simpan draft penawaran', exact: true })
    .click();
  await expect(
    page.getByText('Draft siap ditinjau', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Kirim penawaran baru', exact: true })
    .click();
  await expect(
    page.getByText('Penawaran baru dikirim. Versi sebelumnya hanya baca.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto('/partner/finance');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Unduh statement CSV' }).click();
  expect((await download).suggestedFilename()).toContain('statement-');
  await page.goto('/partner/support');
  await page.getByLabel('Subjek tiket').fill('Perlu peninjauan stok');
  await page
    .getByLabel('Kronologi masalah')
    .fill('Stok listing perlu ditinjau bersama tim platform.');
  await page
    .getByRole('button', { name: 'Kirim tiket mitra', exact: true })
    .click();
  await expect(
    page.locator('summary').filter({ hasText: 'Perlu peninjauan stok' }),
  ).toBeVisible();
  await page.goto('/partner/team');
  const ops = page.locator('section.ptr-card').filter({
    has: page.getByRole('heading', {
      name: 'Nadia · Operations demo',
      exact: true,
    }),
  });
  await ops
    .getByRole('button', { name: 'Cabut akses staf', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Konfirmasi cabut akses', exact: true })
    .click();
  await expect(ops).toContainText('Dicabut');
});
test('responsive private workspace, keyboard drawer, English and accessibility', async ({
  page,
}) => {
  await setup(page);
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  const result = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.getByLabel('Bahasa', { exact: true }).selectOption('en');
  await expect(
    page.getByRole('heading', { name: 'Overview', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Partner menu', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Business', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Business profile', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('partner-mobile.png'),
    fullPage: true,
  });
});
