import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const query =
  'locationId=jakarta&start=2099-12-10&end=2099-12-10&startTime=09%3A00&endTime=17%3A00&participants=100&layout=seated';
async function register(page: Page) {
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await page.getByLabel('Nama lengkap', { exact: true }).fill('Wedding Couple');
  await page
    .getByLabel('Email akun', { exact: true })
    .fill('couple@example.com');
  await page
    .getByLabel('Nomor telepon akun', { exact: true })
    .fill('081234567890');
  await page.getByRole('checkbox').filter({ visible: true }).last().check();
  await page
    .getByRole('button', { name: 'Lanjut daftar', exact: true })
    .click();
  await page.getByLabel('Kode OTP demo', { exact: true }).fill('123456');
  await page
    .getByRole('button', { name: 'Daftar & lanjutkan', exact: true })
    .click();
}
test('Wedding capacity, filters and back navigation preserve the event context', async ({
  page,
}, info) => {
  await page.goto(
    `/wedding?${query.replace('participants=100', 'participants=500')}`,
  );
  await expect(page.locator('.wedding-result-card')).toHaveCount(1);
  await page
    .getByLabel('Format tamu', { exact: true })
    .selectOption('standing');
  await page
    .getByRole('button', { name: 'Cari venue pernikahan', exact: true })
    .click();
  await expect(page.locator('.wedding-result-card')).toHaveCount(2);
  if (info.project.name === 'mobile')
    await page.getByRole('button', { name: 'Filter', exact: true }).click();
  const filters =
    info.project.name === 'mobile'
      ? page.getByRole('dialog')
      : page.locator('.venue-desktop-filters');
  await filters.getByRole('radio', { name: 'Outdoor', exact: true }).check();
  if (info.project.name === 'mobile')
    await page
      .getByRole('button', { name: 'Terapkan filter', exact: true })
      .click();
  await expect(page.locator('.wedding-result-card')).toHaveCount(1);
  await page
    .getByRole('link', { name: 'Lihat venue Asmara Garden', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Asmara Garden',
  );
  await page
    .getByRole('link', { name: 'Kembali ke Wedding Venue', exact: true })
    .click();
  await expect(page).toHaveURL(/setting=outdoor/);
  await expect(page).toHaveURL(/layout=standing/);
  await expect(page.locator('#wedding-participants')).toHaveValue('500');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('Wedding detail labels gallery areas, capacities, exclusions and venue hours', async ({
  page,
}) => {
  await page.goto(`/wedding/asmara-grand?${query}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Asmara Grand Ballroom',
  );
  await expect(
    page.getByText('Duduk hingga 650 tamu', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Berdiri hingga 900 tamu', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Jam operasional 08:00–22:00', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText('Tidak termasuk', { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Buka foto area 1', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByRole('button', { name: 'Foto berikutnya', exact: true })
    .click();
  await expect(
    page.getByRole('dialog').getByText('2 / 3', { exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Buka foto area 1', exact: true }),
  ).toBeFocused();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('Wedding flexible inquiry preserves alternatives and site visit request without requiring a budget', async ({
  page,
}) => {
  await page.goto(
    '/wedding/asmara-grand/inquiry?locationId=jakarta&flexible=true&participants=100&layout=seated&packageId=asmara-grand-wedding-venue',
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Mari rencanakan momen Anda.',
  );
  await page.getByLabel('Nama kontak', { exact: true }).fill('Wedding Couple');
  await page
    .getByLabel('Email kontak', { exact: true })
    .fill('couple@example.com');
  await page
    .getByLabel('Nomor telepon kontak', { exact: true })
    .fill('081234567890');
  await page
    .getByLabel('Tanggal alternatif 1', { exact: true })
    .fill('2099-12-11');
  await page
    .getByRole('checkbox', {
      name: 'Saya ingin mengunjungi venue terlebih dahulu',
      exact: true,
    })
    .check();
  await page
    .getByLabel('Preferensi tanggal kunjungan (opsional)', { exact: true })
    .fill('2099-12-01');
  await page
    .getByRole('checkbox', { name: /Saya menyetujui penggunaan kontak/ })
    .check();
  await page
    .getByRole('button', { name: 'Lanjut verifikasi email', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Verifikasi email kontak terlebih dahulu',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel('Kode verifikasi inquiry demo', { exact: true })
    .fill('123456');
  await page
    .getByRole('button', { name: 'Verifikasi & kirim inquiry', exact: true })
    .click();
  await expect(page).toHaveURL(
    /\/account\/inquiries\/INQ-DEMO-.*service=wedding/,
  );
  await expect(
    page.getByText('Diminta, menunggu konfirmasi PIC', { exact: false }),
  ).toBeVisible();
  await expect(page.getByText('2099-12-11', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Tanggal fleksibel', { exact: false }).first(),
  ).toBeVisible();
});
test('Wedding direct request retains package through registration and submits without payment or date hold', async ({
  page,
}) => {
  await page.goto(
    `/wedding/asmara-grand/request?${query}&packageId=asmara-grand-wedding-intimate`,
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Tinjau permintaan pernikahan Anda.',
  );
  await register(page);
  await expect(
    page.getByText('Mengajukan sebagai Wedding Couple', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Paket pilihan', { exact: true })).toHaveValue(
    'asmara-grand-wedding-intimate',
  );
  await expect(page.locator('#wedding-start')).toHaveValue('2099-12-10');
  await page.getByRole('checkbox', { name: /Saya memahami isi paket/ }).check();
  await page
    .getByRole('button', { name: 'Ajukan permintaan booking', exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/inquiries\/INQ-DEMO-/);
  await expect(
    page.getByRole('heading', {
      name: 'Permintaan terkirim',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Mengacu paket pilihan; harga final menunggu penawaran', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Belum ada reservasi venue terkonfirmasi.', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Bayar|Unduh voucher|Unduh invoice/ }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole('heading', {
      name: 'Permintaan terkirim',
      exact: true,
    }),
  ).toBeVisible();
});
test('Wedding English layout stays within viewport and blocked dates cannot be submitted', async ({
  page,
}) => {
  await page.goto(`/wedding/asmara-grand/request?${query}&scenario=blocked`);
  await register(page);
  await expect(
    page.getByRole('button', {
      name: 'Ajukan permintaan booking',
      exact: true,
    }),
  ).toBeDisabled();
  await page.goto('/wedding');
  await page.getByRole('button', { name: 'Pilih bahasa', exact: true }).click();
  await page.getByRole('button', { name: /English Bahasa Inggris/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'A special place for your story.',
  );
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(
    page.getByRole('button', { name: 'Search wedding venues', exact: true }),
  ).toBeVisible();
});

test('Wedding quote versions stay read-only when old or expired and support an update request', async ({
  page,
}) => {
  await page.goto(
    `/wedding/asmara-grand/inquiry?${query}&packageId=asmara-grand-wedding-venue`,
  );
  await page.getByLabel('Nama kontak', { exact: true }).fill('Wedding Couple');
  await page
    .getByLabel('Email kontak', { exact: true })
    .fill('couple@example.com');
  await page
    .getByLabel('Nomor telepon kontak', { exact: true })
    .fill('081234567890');
  await page
    .getByRole('checkbox', { name: /Saya menyetujui penggunaan kontak/ })
    .check();
  await page
    .getByRole('button', { name: 'Lanjut verifikasi email', exact: true })
    .click();
  await page
    .getByLabel('Kode verifikasi inquiry demo', { exact: true })
    .fill('123456');
  await page
    .getByRole('button', { name: 'Verifikasi & kirim inquiry', exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/inquiries\/INQ-DEMO-/);
  await page.getByText('Simulasi Venue Sales', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Kirim penawaran demo', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Penawaran versi 1', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Kirim revisi penawaran demo', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Penawaran versi 2', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Perbandingan dengan versi 1', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Versi penawaran', exact: true })
    .selectOption('1');
  await expect(
    page.getByText('Versi ini sudah digantikan', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Tinjau versi 2', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Simulasikan quote kedaluwarsa', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Minta pembaruan penawaran', exact: true })
    .click();
  await expect(
    page.getByText('Pembaruan penawaran diminta kepada PIC demo', {
      exact: true,
    }),
  ).toBeVisible();
  await register(page);
  await expect(
    page.getByRole('button', {
      name: 'Ajukan permintaan booking',
      exact: true,
    }),
  ).toBeDisabled();
});
