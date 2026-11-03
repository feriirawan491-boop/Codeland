import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const query =
  'locationId=jakarta&start=2099-12-10&end=2099-12-10&startTime=09%3A00&endTime=17%3A00&participants=50&layout=theater&eventType=meeting';
async function fillInquiry(page: Page, scenario = 'ready', flexible = false) {
  await page.goto(
    `/mice/cendana-hall/inquiry?${flexible ? 'locationId=jakarta&flexible=true&participants=50&layout=theater&eventType=meeting' : query}&packageId=cendana-hall-full&scenario=${scenario}`,
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Ceritakan kebutuhan acara Anda.',
  );
  await page.getByLabel('Nama PIC', { exact: false }).fill('Event Organiser');
  await page
    .getByLabel('Perusahaan / organisasi', { exact: false })
    .fill('Sample Company');
  await page
    .getByLabel('Email PIC', { exact: false })
    .fill('event@example.com');
  await page
    .getByLabel('Nomor telepon PIC', { exact: false })
    .fill('081234567890');
  await page
    .getByRole('checkbox', { name: /Saya menyetujui penggunaan data kontak/ })
    .check();
  await page
    .getByRole('button', { name: 'Lanjut verifikasi email', exact: true })
    .click();
}
async function verifyInquiry(page: Page) {
  await expect(
    page.getByRole('heading', {
      name: 'Verifikasi email PIC terlebih dahulu',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel('Kode verifikasi inquiry demo', { exact: true })
    .fill('123456');
  await page
    .getByRole('button', { name: 'Verifikasi & kirim inquiry', exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/inquiries\/INQ-DEMO-/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Rencana acara Anda, terpantau.',
  );
}
async function register(page: Page) {
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await page
    .getByLabel('Nama lengkap', { exact: true })
    .fill('Event Organiser');
  await page
    .getByLabel('Email akun', { exact: true })
    .fill('event@example.com');
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
test('MICE matches layout capacity, filters confirmed AV and compares a single price basis', async ({
  page,
}, testInfo) => {
  await page.goto(
    `/mice?${query.replace('participants=50', 'participants=100').replace('layout=theater', 'layout=classroom')}`,
  );
  await expect(page.locator('.venue-space-card')).toHaveCount(4);
  await expect(
    page.getByRole('link', { name: 'Cendana Hall', exact: true }),
  ).toHaveCount(0);
  if (testInfo.project.name === 'mobile')
    await page.getByRole('button', { name: 'Filter', exact: true }).click();
  const filters =
    testInfo.project.name === 'mobile'
      ? page.getByRole('dialog')
      : page.locator('.venue-desktop-filters');
  await filters
    .getByRole('checkbox', { name: 'Peralatan audio visual', exact: true })
    .check();
  await filters
    .getByRole('combobox', { name: 'Basis harga paket', exact: true })
    .selectOption('hour');
  if (testInfo.project.name === 'mobile')
    await page
      .getByRole('button', { name: 'Terapkan filter', exact: true })
      .click();
  await page
    .getByRole('combobox', { name: 'Urutkan', exact: true })
    .selectOption('price');
  await expect(page).toHaveURL(/basis=hour/);
  await expect(page.locator('.venue-space-card')).toHaveCount(3);
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page
    .getByRole('link', { name: /^Lihat ruang / })
    .first()
    .click();
  await page
    .getByRole('link', { name: 'Kembali ke hasil ruang', exact: true })
    .click();
  await expect(page).toHaveURL(/basis=hour/);
  await expect(page).toHaveURL(/sort=price/);
});
test('space selection changes room capacity, minimums are explicit and gallery works', async ({
  page,
}) => {
  await page.goto(
    `/mice/cendana-hall?${query.replace('participants=50', 'participants=40')}`,
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Cendana Hall',
  );
  await expect(
    page.getByText(
      'Peserta di bawah minimum. Estimasi memakai minimum 50 peserta.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Buka foto 1', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page
    .getByRole('combobox', { name: 'Pilih ruang di venue ini', exact: true })
    .selectOption('meranti-boardroom');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Meranti Boardroom',
  );
  await expect(
    page.getByRole('row').filter({ hasText: 'Theater' }),
  ).toContainText('24 peserta');
  await expect(
    page.getByRole('link', { name: 'Kirim inquiry', exact: true }),
  ).toHaveCount(0);
});
test('verified inquiry tracks quote revisions, requires login, submits request without payment and follows contract', async ({
  page,
}) => {
  await fillInquiry(page);
  await verifyInquiry(page);
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
  await page
    .getByRole('combobox', { name: 'Versi penawaran', exact: true })
    .selectOption('1');
  await expect(
    page.getByText('Versi ini sudah digantikan', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Tinjau versi 2', exact: true })
    .click();
  await register(page);
  await page
    .getByRole('checkbox', { name: /Saya menyetujui ketentuan penawaran ini/ })
    .check();
  await page
    .getByRole('button', { name: 'Ajukan permintaan booking', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Permintaan terkirim', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /bayar|pembayaran/i }),
  ).toHaveCount(0);
  if (
    !(await page
      .getByRole('button', { name: 'Simulasikan lanjut kontrak', exact: true })
      .isVisible())
  )
    await page.getByText('Simulasi Venue Sales', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Simulasikan lanjut kontrak', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Lanjut kesepakatan kontrak',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Belum ada reservasi venue terkonfirmasi. Kesepakatan final dan kontrak ditindaklanjuti bersama PIC di luar platform.',
      { exact: true },
    ),
  ).toBeVisible();
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(scan.violations).toEqual([]);
});
test('unknown submission is reconciled before retry and flexible enquiry can be verified', async ({
  page,
}) => {
  await fillInquiry(page, 'mutation_timeout');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Hasil pengiriman belum diketahui.',
  );
  await expect(
    page.getByRole('button', { name: 'Lanjut verifikasi email', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Periksa status pengiriman', exact: true })
    .click();
  await verifyInquiry(page);
  await expect(
    page.getByText('Email PIC terverifikasi', { exact: true }),
  ).toBeVisible();
});
test('English MICE pages reflow and distinguish empty results, errors and private access', async ({
  page,
}, testInfo) => {
  await page.goto(`/mice?${query}`);
  await page.getByRole('button', { name: 'Pilih bahasa', exact: true }).click();
  await page.getByRole('button', { name: /English Bahasa Inggris/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Memorable meetings start here.',
  );
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow at ${width}`,
    ).toBe(true);
  }
  await page.screenshot({
    path: `/tmp/gobuking-mice-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.goto(`/mice?${query}&scenario=empty`);
  await expect(
    page.getByRole('heading', {
      name: 'No rooms match your search',
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(`/mice?${query}&scenario=timeout`);
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'The venue search timed out.',
  );
  await page.goto('/account/inquiries/INQ-DEMO-FOREIGN');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'The enquiry was not found in this browser tab.',
  );
});

test('flexible dates need revalidation, expired or blocked quotes cannot submit, and logout clears private details', async ({
  page,
}) => {
  await fillInquiry(page, 'ready', true);
  await verifyInquiry(page);
  await page.getByText('Simulasi Venue Sales', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Kirim penawaran demo', exact: true })
    .click();
  await register(page);
  await expect(
    page.getByRole('button', {
      name: 'Ajukan permintaan booking',
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Perbarui kebutuhan acara', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('checkbox', {
      name: 'Tanggal acara saya fleksibel',
      exact: true,
    })
    .uncheck();
  await dialog.locator('#event-start').fill('2099-12-10');
  await dialog.locator('#event-end').fill('2099-12-10');
  await dialog
    .getByRole('button', { name: 'Perbarui kebutuhan', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page.getByText('Simulasi Venue Sales', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Kirim revisi penawaran demo', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Penawaran versi 2', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Simulasikan quote kedaluwarsa', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Ajukan permintaan booking',
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Kirim revisi penawaran demo', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Blokir ruang bersama', exact: true })
    .click();
  await page
    .getByRole('checkbox', { name: /Saya menyetujui ketentuan penawaran ini/ })
    .check();
  await page
    .getByRole('button', { name: 'Ajukan permintaan booking', exact: true })
    .click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Ruang sedang diblokir.',
  );
  await page
    .getByRole('button', { name: 'Lepas blokir ruang', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Ajukan permintaan booking', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Permintaan terkirim', exact: true }),
  ).toBeVisible();
  const trigger = page.getByRole('button', { name: 'Akun saya', exact: true });
  if (!(await trigger.isVisible()))
    await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
  await trigger.click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Masuk untuk mengajukan permintaan',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('Sample Company', { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('heading', { name: 'Penawaran versi 3', exact: true }),
  ).toHaveCount(0);
});
