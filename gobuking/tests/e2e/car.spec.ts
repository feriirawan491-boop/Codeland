import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
const query =
  'locationId=jakarta&pickupArea=central&returnArea=central&start=2099-12-10&end=2099-12-11&startTime=09%3A00&endTime=10%3A00&mode=self';
async function register(page: Page) {
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await page
    .getByLabel('Nama lengkap', { exact: true })
    .fill('Rental Customer');
  await page
    .getByLabel('Email akun', { exact: true })
    .fill('renter@example.com');
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
async function checkout(
  page: Page,
  mode = 'self',
  scenario = 'ready',
  kind = 'mpv',
  alreadyRegistered = false,
) {
  await page.goto(
    `/cars/jakarta-${kind}-${mode}?${query.replace('mode=self', `mode=${mode}`)}&scenario=${scenario}`,
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    kind === 'suv' ? 'Adventure SUV' : 'Family MPV',
  );
  await page
    .getByRole('button', { name: 'Ajukan rental', exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/checkout\/car\/CAR-DRAFT-/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Siapkan perjalanan Anda.',
  );
  if (!alreadyRegistered) await register(page);
  await page
    .getByLabel('Rincian titik pengambilan (wajib)', { exact: true })
    .fill('Lobby Hotel Jakarta');
  if (mode === 'self')
    await page
      .getByRole('checkbox', {
        name: 'Saya memiliki SIM A yang masih berlaku untuk periode rental.',
        exact: true,
      })
      .check();
  await page
    .getByRole('checkbox', {
      name: /Saya memahami usia, identitas, dan dokumen/,
    })
    .check();
  await page
    .getByRole('checkbox', { name: /Saya menyetujui total estimasi/ })
    .check();
}
async function submit(page: Page) {
  await page
    .getByRole('button', { name: 'Kirim permintaan rental', exact: true })
    .click();
  await expect(page).toHaveURL(/\/bookings\/CAR-DEMO-/);
  await expect(
    page.getByRole('heading', {
      name: 'Menunggu verifikasi mitra',
      exact: true,
    }),
  ).toBeVisible();
}
async function ops(page: Page) {
  const d = page.locator('details.car-demo-tools');
  if ((await d.getAttribute('open')) === null)
    await page.getByText('Simulasi Rental Operations', { exact: true }).click();
}
async function approve(page: Page) {
  await ops(page);
  await page
    .getByRole('button', { name: 'Simulasikan persetujuan mitra', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Disetujui · Menunggu pembayaran',
      exact: true,
    }),
  ).toBeVisible();
}
async function pay(page: Page) {
  await page.getByRole('radio', { name: 'QRIS', exact: true }).check();
  await page
    .getByRole('button', { name: 'Buka pembayaran demo', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'QRIS Demo', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Simulasikan pembayaran berhasil',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Reservasi rental terkonfirmasi',
      exact: true,
    }),
  ).toBeVisible();
}
test('Car search validates intervals and same-area return, switches compatible modes and preserves result filters', async ({
  page,
}, info) => {
  await page.goto('/cars');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Pergi lebih jauh. Senyaman rencana Anda.',
  );
  await page.locator('#car-start').fill('2099-12-10');
  await page.locator('#car-end').fill('2099-12-09');
  await page.getByRole('button', { name: 'Cari mobil', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Waktu kembali harus setelah pengambilan',
  );
  await page.locator('#car-end').fill('2099-12-11');
  await page.locator('#car-returnArea').selectOption('airport');
  await page.getByRole('button', { name: 'Cari mobil', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Pengembalian harus pada area yang sama',
  );
  await page.locator('#car-returnArea').selectOption('central');
  await page
    .getByRole('radio', { name: 'Tanpa pengemudi', exact: true })
    .check();
  await page.getByRole('button', { name: 'Cari mobil', exact: true }).click();
  await expect(page.locator('.car-result-card')).toHaveCount(4);
  if (info.project.name === 'mobile')
    await page.getByRole('button', { name: 'Filter', exact: true }).click();
  const filters =
    info.project.name === 'mobile'
      ? page.getByRole('dialog')
      : page.locator('.car-desktop-filters');
  await filters
    .getByRole('combobox', { name: 'Minimal kursi penumpang', exact: true })
    .selectOption('7');
  if (info.project.name === 'mobile')
    await page
      .getByRole('button', { name: 'Terapkan filter', exact: true })
      .click();
  await expect(page.locator('.car-result-card')).toHaveCount(1);
  await expect(
    page.locator('.car-result-card').getByText('7 kursi', { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.car-result-card').getByText('3 koper', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Lihat paket Family MPV', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Family MPV',
  );
  await page
    .getByRole('link', { name: 'Kembali ke hasil mobil', exact: true })
    .click();
  await expect(page).toHaveURL(/seats=7/);
  await expect(page.locator('#car-end')).toHaveValue('2099-12-11');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('Car 25-hour self-drive request requires approval, separates deposit, pays and downloads an invoice then completes handover', async ({
  page,
}) => {
  await checkout(page);
  await expect(
    page
      .getByText('25 jam · 2 × paket 24 jam', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await submit(page);
  await expect(
    page.getByRole('button', { name: 'Buka pembayaran demo', exact: true }),
  ).toHaveCount(0);
  await approve(page);
  await pay(page);
  const pending = page.waitForEvent('download');
  await page
    .getByRole('button', {
      name: 'Unduh invoice booking/reservasi',
      exact: true,
    })
    .click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/^INV-CAR-DEMO-.*\.pdf$/);
  const document = await PDFDocument.load(
    await fs.readFile((await download.path())!),
  );
  expect(document.getPageCount()).toBeGreaterThan(0);
  await page
    .getByRole('button', { name: 'Usulkan kendaraan pengganti', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Tinjau perubahan kendaraan',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Catat serah terima demo', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Tinjau & setujui pengganti', exact: true })
    .click();
  await page
    .getByRole('button', {
      name: 'Saya setuju dengan kendaraan pengganti',
      exact: true,
    })
    .click();
  await expect(
    page.locator('.car-booking-summary').getByText('5 kursi', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Reservasi rental terkonfirmasi',
      exact: true,
    }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Catat serah terima demo', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Kendaraan sedang digunakan',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Ajukan pemeriksaan kondisi', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Catat pengembalian demo', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Rental selesai', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Pemeriksaan kondisi diminta',
      exact: true,
    }),
  ).toBeDisabled();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('Car driver conflicts prevent approval and expired approvals never confirm late payments', async ({
  page,
}) => {
  await checkout(page, 'driver');
  await submit(page);
  await ops(page);
  await page
    .getByRole('button', { name: 'Simulasikan konflik pengemudi', exact: true })
    .click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Pengemudi memiliki penugasan lain',
  );
  await approve(page);
  await page
    .getByRole('button', {
      name: 'Simulasikan pembayaran kedaluwarsa',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Batas pembayaran berakhir',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Buka pembayaran demo', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', {
      name: 'Simulasikan pembayaran terlambat',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Perlu pemeriksaan pembayaran',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Unduh invoice booking/reservasi',
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Refund dalam pemeriksaan', { exact: true }),
  ).toBeVisible();
});
test('Car unknown result requires reconciliation, private booking clears on logout and requires the owner', async ({
  page,
}) => {
  await checkout(page, 'self', 'mutation_timeout');
  await page
    .getByRole('button', { name: 'Kirim permintaan rental', exact: true })
    .click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Hasil pengiriman belum diketahui',
  );
  await expect(
    page.getByRole('button', { name: 'Kirim permintaan rental', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Periksa status pengiriman', exact: true })
    .click();
  await expect(page).toHaveURL(/\/bookings\/CAR-DEMO-/);
  const url = page.url();
  const menu = page.getByRole('button', { name: 'Buka menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name: 'Akun saya', exact: true }).click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('heading', {
      name: 'Masuk untuk mengajukan permintaan',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Lobby Hotel Jakarta', { exact: false }),
  ).toHaveCount(0);
  await page.goto(url);
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await page.getByLabel('Nama lengkap', { exact: true }).fill('Other Renter');
  await page
    .getByLabel('Email akun', { exact: true })
    .fill('other@example.com');
  await page
    .getByLabel('Nomor telepon akun', { exact: true })
    .fill('081234567891');
  await page.getByRole('checkbox').filter({ visible: true }).last().check();
  await page
    .getByRole('button', { name: 'Lanjut daftar', exact: true })
    .click();
  await page.getByLabel('Kode OTP demo', { exact: true }).fill('123456');
  await page
    .getByRole('button', { name: 'Daftar & lanjutkan', exact: true })
    .click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Anda tidak memiliki akses',
  );
  await expect(
    page.getByText('Lobby Hotel Jakarta', { exact: false }),
  ).toHaveCount(0);
});
test('Car document policy rejects invalid files, repricing requires review and expired estimates can be refreshed', async ({
  page,
}) => {
  await checkout(page, 'self', 'ready', 'suv');
  await page.locator('input[type=file]').setInputFiles({
    name: 'document.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('sample'),
  });
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Gunakan PDF, JPEG, atau PNG',
  );
  await page.locator('input[type=file]').setInputFiles({
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 sample only'),
  });
  await page.getByText('Alat skenario demo', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Simulasikan perubahan harga', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Kirim permintaan rental', exact: true })
    .click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Harga berubah',
  );
  await page
    .getByRole('button', { name: 'Tinjau estimasi terbaru', exact: true })
    .click();
  await expect(
    page.getByRole('checkbox', { name: /Saya menyetujui total estimasi/ }),
  ).not.toBeChecked();
  await page
    .getByRole('checkbox', { name: /Saya menyetujui total estimasi/ })
    .check();
  await submit(page);
});
test('Car English pages reflow and distinguish empty, maintenance and provider failures', async ({
  page,
}) => {
  await page.goto(`/cars/results?${query}&scenario=maintenance`);
  await expect(page.locator('.car-result-card').first()).toContainText(
    'Armada sedang dalam perawatan.',
  );
  await page.goto(`/cars/results?${query}&scenario=empty`);
  await expect(
    page.getByRole('heading', {
      name: 'Belum ada mobil yang sesuai',
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(`/cars/results?${query}&scenario=error`);
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Layanan rental sedang terganggu',
  );
  await page.goto(`/cars/results?${query}`);
  await page.getByRole('button', { name: 'Pilih bahasa', exact: true }).click();
  await page.getByRole('button', { name: /English Bahasa Inggris/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Go further. Travel your way.',
  );
  await expect(
    page.getByRole('button', { name: 'Search cars', exact: true }),
  ).toBeVisible();
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('Car rejection and maintenance keep payment closed with clear customer reasons', async ({
  page,
}) => {
  await checkout(page, 'driver');
  await submit(page);
  await ops(page);
  await page
    .getByRole('button', {
      name: 'Simulasikan penolakan kelayakan',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Permintaan ditolak', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Persyaratan verifikasi mitra belum terpenuhi. Tidak ada tagihan pembayaran.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Buka pembayaran demo', exact: true }),
  ).toHaveCount(0);
  await checkout(page, 'self', 'ready', 'mpv', true);
  await submit(page);
  await ops(page);
  await page
    .getByRole('button', {
      name: 'Simulasikan maintenance armada',
      exact: true,
    })
    .click();
  await page
    .getByRole('button', { name: 'Simulasikan persetujuan mitra', exact: true })
    .click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Armada belum tersedia pada interval dan buffer ini.',
  );
  await expect(
    page.getByRole('heading', {
      name: 'Menunggu verifikasi mitra',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Buka pembayaran demo', exact: true }),
  ).toHaveCount(0);
});
