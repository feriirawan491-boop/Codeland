import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function setup(page: Page, examples = true) {
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await page.getByLabel('Nama lengkap', { exact: true }).fill('Admin Tester');
  await page
    .getByLabel('Email akun', { exact: true })
    .fill('admin-tester@example.com');
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
  await page
    .getByRole('button', { name: 'Aktifkan workspace admin demo', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Ringkasan', exact: true }),
  ).toBeVisible();
  if (examples) {
    await page.getByText('Simulasi antrean platform', { exact: true }).click();
    await page
      .getByRole('button', {
        name: 'Tambahkan antrean admin contoh',
        exact: true,
      })
      .click();
    await expect(
      page.getByText('Antrean admin contoh siap ditinjau.', { exact: true }),
    ).toBeVisible({ timeout: 35000 });
  }
}
async function persona(page: Page, role: string) {
  const select = page.getByLabel('Aktor platform / persona demo', {
    exact: true,
  });
  const options = await select.locator('option').allTextContents();
  await select.selectOption({ label: options.find((v) => v.includes(role))! });
}
const file = {
  name: 'proof.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4 private demo evidence'),
};
test('partner verification blockers, evidence, catalog duplicate resource and permission boundaries', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/admin/partners');
  const incomplete = page.locator('article.ptr-card').filter({
    has: page.getByRole('heading', {
      name: 'Usaha Baru · Belum lengkap',
      exact: true,
    }),
  });
  await expect(incomplete).toContainText('Syarat aktivasi belum lengkap');
  const ready = page.locator('article.ptr-card').filter({
    has: page.getByRole('heading', {
      name: 'Lentera Stay · Pengajuan demo',
      exact: true,
    }),
  });
  await ready
    .getByRole('button', { name: 'Tinjau verifikasi', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('PIC dan profil diperiksa').check();
  await dialog.getByLabel('Dokumen usaha valid').check();
  await dialog.getByLabel('Rekening tervalidasi').check();
  await dialog.getByLabel('Perjanjian disetujui dan diperiksa').check();
  await dialog.getByLabel('Lampiran privat (opsional)').setInputFiles(file);
  await dialog
    .getByLabel('Catatan pemeriksaan')
    .fill('Seluruh bukti pengajuan telah diperiksa dengan lengkap.');
  await dialog
    .getByRole('button', { name: 'Simpan checklist & bukti' })
    .click();
  await expect(
    dialog.getByText('Checklist verifikasi tersimpan.', { exact: true }),
  ).toBeVisible();
  await dialog
    .getByLabel('Alasan keputusan')
    .fill('Aktivasi disetujui setelah dokumen dan rekening diverifikasi.');
  await dialog
    .getByRole('button', { name: 'Konfirmasi keputusan verifikasi' })
    .click();
  await expect(
    dialog.getByText('Keputusan verifikasi tercatat.', { exact: true }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Tutup dialog' }).click();
  await expect(ready).toContainText('Aktif');
  await page.goto('/admin/catalog');
  const duplicate = page.locator('article.ptr-card').filter({
    has: page.getByRole('heading', {
      name: 'Villa Nala · Duplikasi demo',
      exact: true,
    }),
  });
  await duplicate.getByRole('button', { name: 'Moderasi listing' }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'Peringatan duplikasi inventori',
  );
  await page
    .getByRole('dialog')
    .getByLabel('Resource bersama (bila duplikat)')
    .selectOption('PTR-HOME-NALA');
  await page
    .getByRole('dialog')
    .getByLabel('Alasan keputusan')
    .fill('Duplikasi ditautkan pada satu inventori villa yang sama.');
  await page.getByRole('dialog').getByRole('checkbox').check();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Konfirmasi moderasi listing' })
    .click();
  await expect(
    page
      .getByRole('dialog')
      .getByText('Keputusan katalog tercatat.', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Tutup dialog' })
    .click();
  await persona(page, 'Operations');
  await page.goto('/admin/settings');
  await expect(page.locator('main [role=alert]')).toContainText('izin');
});
test('maker/checker payout evidence remains pending until reconciled and reaches partner statement', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/admin/settlements');
  await page
    .getByRole('button', { name: 'Preview batch payout', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Eligibility payout', exact: true }),
  ).toBeVisible();
  await page
    .getByLabel('Alasan pembuatan batch')
    .fill('Batch berisi hak mitra yang sudah lolos pemeriksaan.');
  await page
    .getByRole('button', { name: 'Buat batch untuk checker', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Tidak dapat menyetujui batch sendiri',
      exact: true,
    }),
  ).toBeDisabled();
  await persona(page, 'Finance Checker');
  await page
    .getByLabel('Alasan keputusan')
    .fill('Pemeriksa terpisah telah mencocokkan hak dan rekening.');
  await page
    .getByRole('button', { name: 'Konfirmasi keputusan batch', exact: true })
    .click();
  await expect(
    page.getByText('Disetujui · belum ditransfer', { exact: true }),
  ).toBeVisible();
  await persona(page, 'Finance Maker');
  await page
    .getByLabel('Referensi transfer unik')
    .fill('BANK-TRANSFER-ADMIN-001');
  await page.getByLabel('Lampiran privat (opsional)').setInputFiles(file);
  await page
    .getByLabel('Catatan transfer')
    .fill('Bukti transfer demo dicatat untuk pemeriksaan terpisah.');
  await page
    .getByRole('button', { name: 'Catat bukti transfer demo', exact: true })
    .click();
  await expect(
    page.getByText('Bukti tercatat · menunggu rekonsiliasi', { exact: true }),
  ).toBeVisible();
  await persona(page, 'Finance Checker');
  await page.getByLabel('Event ID transfer').fill('PAYOUT-EVENT-ADMIN-001');
  await page
    .getByLabel('Alasan rekonsiliasi')
    .fill('Referensi dan bukti transfer cocok pada pemeriksaan demo.');
  await page
    .getByRole('button', {
      name: 'Rekonsiliasi hasil transfer demo',
      exact: true,
    })
    .click();
  await expect(
    page.getByText('Paid · direkonsiliasi', { exact: true }),
  ).toBeVisible();
  await page.goto('/partner/finance');
  await expect(page.locator('main')).toContainText('BATCH-');
});
test('scheduled CMS draft/publish, negative review policy, secret sanitization and report export', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/admin/cms');
  await page.getByLabel('Judul konten').fill('Banner perjalanan pilihan');
  await page
    .getByLabel('Isi konten')
    .fill(
      'Temukan inspirasi perjalanan baru melalui pilihan layanan Gobuking.',
    );
  await page
    .getByLabel('Awal jadwal (waktu lokal zona)')
    .fill('2020-01-01T09:00');
  await page
    .getByLabel('Akhir jadwal (waktu lokal zona)')
    .fill('2099-12-31T23:00');
  await page
    .getByRole('button', { name: 'Simpan draft CMS', exact: true })
    .click();
  await expect(
    page.getByText('DRAFT · Belum publik', { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel('Alasan publikasi')
    .fill('Konten dan periode publikasi telah ditinjau oleh editor.');
  await page
    .getByRole('button', { name: 'Konfirmasi publikasi CMS', exact: true })
    .click();
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'Banner perjalanan pilihan',
      exact: true,
    }),
  ).toBeVisible();
  await page.goto('/admin/moderation');
  await page.getByLabel('Keputusan moderasi').selectOption('retain');
  await page
    .getByLabel('Alasan berdasarkan pedoman')
    .fill('Ulasan negatif tidak melanggar pedoman sehingga dipertahankan.');
  await page
    .getByRole('button', { name: 'Konfirmasi keputusan moderasi', exact: true })
    .click();
  await expect(page.getByText('published', { exact: true })).toBeVisible();
  await page.goto('/admin/integrations');
  await page
    .getByRole('button', { name: 'Simulasikan gangguan', exact: true })
    .first()
    .click();
  await expect(page.locator('main')).toContainText('[REDACTED]');
  await expect(page.locator('main')).not.toContainText('DEMO_PRIVATE_SECRET');
  await page.goto('/admin/reports');
  await expect(
    page.getByText('GMV bukan pendapatan platform.', { exact: false }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Ekspor laporan CSV', exact: true })
    .click();
  expect((await download).suggestedFilename()).toContain('platform-report');
});
test('admin responsive keyboard drawer, English labels and accessible financial controls', async ({
  page,
}) => {
  await setup(page, false);
  await expect(page.locator('.ptr-kpi')).toHaveCount(4);
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
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
  await page.getByRole('button', { name: 'Admin menu', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Integrations', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Integrations', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('admin-mobile.png'),
    fullPage: true,
  });
});
