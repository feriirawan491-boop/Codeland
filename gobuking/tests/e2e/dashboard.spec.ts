import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function account(page: Page) {
  await page.goto('/account/bookings');
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await page.getByLabel('Nama lengkap', { exact: true }).fill('Rani Dashboard');
  await page
    .getByLabel('Email akun', { exact: true })
    .fill('rani-dashboard@example.com');
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
    page.getByRole('heading', { name: 'Pesanan saya', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Belum ada pesanan aktif' }),
  ).toBeVisible();
}
async function examples(page: Page) {
  await page
    .getByText('Coba aktivitas dashboard demo', { exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Tambahkan aktivitas contoh', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Tambahkan aktivitas contoh',
      exact: true,
    }),
  ).toBeEnabled({ timeout: 40000 });
  await expect(page.locator('.usr-list .usr-card')).toHaveCount(3);
}
test('empty account, source bookings, history filters, invoice detail, and partial cancellation', async ({
  page,
}) => {
  await account(page);
  await examples(page);
  await expect(page.locator('main')).not.toContainText('Flight');
  await page.getByLabel('Kategori', { exact: true }).selectOption('car');
  await expect(page.locator('.usr-list .usr-card')).toHaveCount(1);
  await page.goto('/account/history');
  await expect(page.locator('.usr-list .usr-card')).toHaveCount(2);
  await page.getByLabel('Dasar periode').selectOption('created');
  await expect(page).toHaveURL(/dateKind=created/);
  await page.goto('/account/refunds');
  const partial = page.locator('.usr-card').filter({
    has: page.getByText('Reservasi demo terkonfirmasi', { exact: true }),
  });
  await partial
    .getByRole('button', { name: 'Tinjau pembatalan', exact: true })
    .click();
  await expect(
    partial.getByText('Estimasi pembatalan', { exact: true }),
  ).toBeVisible();
  await partial
    .getByLabel('Alasan pembatalan')
    .fill('Rencana perjalanan telah berubah');
  await partial.getByRole('checkbox').check();
  await partial
    .getByRole('button', { name: 'Konfirmasi pembatalan', exact: true })
    .click();
  await expect(page.locator('main')).toContainText(
    'Pengembalian dana diproses',
  );
});
test('profile contact verifies before changing, review waits for moderation, support retains failed upload', async ({
  page,
}) => {
  await account(page);
  await examples(page);
  await page.goto('/account/profile');
  await page
    .getByLabel('Kontak baru', { exact: true })
    .fill('rani-new@example.com');
  await page
    .getByRole('button', { name: 'Kirim kode verifikasi demo' })
    .click();
  await expect(
    page.locator('dd').filter({ hasText: 'rani-dashboard@example.com' }),
  ).toBeVisible();
  await page.getByLabel('Kode OTP demo', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Verifikasi kontak baru' }).click();
  await expect(
    page.locator('dd').filter({ hasText: 'rani-new@example.com' }),
  ).toBeVisible();
  await page.goto('/account/reviews');
  await page.getByRole('radio').nth(8).check();
  await page
    .getByLabel('Judul ulasan', { exact: true })
    .fill('Pengalaman menginap nyaman');
  await page
    .getByLabel('Ceritakan pengalaman Anda')
    .fill('Kamar bersih dan staf sangat membantu selama menginap.');
  await page
    .getByRole('button', { name: 'Kirim ulasan untuk moderasi' })
    .click();
  await expect(
    page.getByText('Menunggu moderasi', { exact: true }),
  ).toBeVisible();
  await page.goto('/account/support');
  await page.getByLabel('Subjek tiket').fill('Bantuan informasi perjalanan');
  await page
    .getByLabel('Pesan Anda')
    .fill('Mohon bantu meninjau kebutuhan perjalanan dan reservasi saya.');
  await page.getByLabel('Lampiran privat (opsional)').setInputFiles({
    name: 'bad.exe',
    mimeType: 'application/x-msdownload',
    buffer: Buffer.from('invalid'),
  });
  await page.getByRole('button', { name: 'Kirim tiket', exact: true }).click();
  await expect(page.locator('main [role=alert]')).toBeVisible();
  await expect(page.getByLabel('Pesan Anda')).toHaveValue(
    'Mohon bantu meninjau kebutuhan perjalanan dan reservasi saya.',
  );
  await page.getByLabel('Lampiran privat (opsional)').setInputFiles([]);
  await page.getByRole('button', { name: 'Kirim tiket', exact: true }).click();
  await expect(page).toHaveURL(/account\/support\/TICKET-/);
  await expect(
    page.getByRole('heading', { name: 'Bantuan informasi perjalanan' }),
  ).toBeVisible();
  await page.getByText('Simulasi layanan bantuan', { exact: true }).click();
  await page.getByRole('button', { name: 'Simulasikan balasan CS' }).click();
  await expect(
    page.getByText('Menunggu balasan Anda', { exact: true }),
  ).toBeVisible();
});
test('responsive dashboard navigation and accessibility, privacy ticket, revoked session gate', async ({
  page,
}) => {
  await account(page);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
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
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Menu akun', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Keamanan & privasi', exact: true })
    .click();
  await page.getByLabel('Jenis permintaan').selectOption('privacy_delete');
  await page
    .getByLabel('Detail permintaan')
    .fill('Saya mengajukan permintaan peninjauan penghapusan data pribadi.');
  await page
    .getByRole('button', { name: 'Ajukan permintaan verifikasi' })
    .click();
  await expect(page).toHaveURL(/account\/support\/TICKET-/);
  await expect(
    page.getByText('Menunggu verifikasi permintaan data', { exact: true }),
  ).toBeVisible();
  await page.goto('/account/security');
  await page
    .getByRole('button', { name: 'Keluar dari sesi ini', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Konfirmasi cabut sesi', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Masuk ke dashboard Anda' }),
  ).toBeVisible();
});

test('saved list, inquiry quotes, English screens and direct invoice download', async ({
  page,
}) => {
  await account(page);
  await examples(page);
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', {
      name: 'Unduh invoice booking/reservasi',
      exact: true,
    })
    .click();
  expect((await download).suggestedFilename()).toMatch(
    /^invoice-GB-DEMO-.*pdf$/,
  );
  await page.goto('/account/inquiries');
  await expect(page.locator('.usr-list .usr-card')).toHaveCount(1);
  await expect(page.locator('main')).toContainText('Versi penawaran');
  await page.goto('/hotels/seruni-resort-spa');
  const save = page.getByRole('button', { name: /Simpan/ }).first();
  await save.click();
  await page.goto('/account/saved');
  await expect(
    page.getByRole('heading', { name: 'Seruni Resort & Spa', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Hapus dari favorit' }).click();
  await expect(
    page.getByRole('heading', { name: 'Belum ada properti tersimpan' }),
  ).toBeVisible();
  await page
    .context()
    .addCookies([
      { name: 'gobuking-locale', value: 'en', url: 'http://127.0.0.1:3000' },
    ]);
  await page.goto('/account/bookings');
  await expect(
    page.getByRole('heading', { name: 'My bookings', exact: true }),
  ).toBeVisible();
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await expect(page.locator('.usr-list .usr-card')).toHaveCount(3);
  if (test.info().project.name === 'mobile')
    await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: test.info().outputPath('dashboard-english.png'),
    fullPage: true,
  });
});
