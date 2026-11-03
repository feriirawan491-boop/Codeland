import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function location(
  page: import('@playwright/test').Page,
  id: string,
  label: string,
) {
  await page.locator(`#${id}`).click();
  await page.getByRole('option', { name: label, exact: false }).click();
}
test('hotel search preserves draft across tabs and navigation', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await location(page, 'hotel-locationId', 'Bali Destinasi');
  await page.locator('#hotel-start').fill('2099-12-10');
  await page.locator('#hotel-end').fill('2099-12-12');
  await page.getByRole('tab', { name: 'Rental Mobil', exact: true }).click();
  await expect(page.getByLabel('Jam ambil', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Hotel', exact: true }).click();
  await expect(page.locator('#hotel-locationId')).toHaveValue('Bali');
  await expect(page.locator('#hotel-start')).toHaveValue('2099-12-10');
  await page.getByRole('button', { name: 'Cari', exact: true }).click();
  await expect(page).toHaveURL(/\/hotels\?/);
  await expect(
    page.getByRole('heading', {
      name: 'Temukan tempat menginap di Bali',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Ubah pencarian' }).click();
  await expect(page).toHaveURL(/\/\?service=hotel/);
  await expect(page.locator('#hotel-locationId')).toHaveValue('Bali');
  await expect(page.locator('#hotel-end')).toHaveValue('2099-12-12');
});
test('homepage service cards open demo listings without filling the search form', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.getByRole('region', {
    name: 'Jelajahi layanan Gobuking',
  });
  await expect(section.getByRole('link')).toHaveCount(6);

  for (const [label, path, image] of [
    ['Hotel', '/hotels?locationId=bali', '/images/hotel.jpg'],
    ['Home Rental', '/homes?locationId=bali', '/images/villa.jpg'],
    [
      'Penerbangan',
      '/flights?locationId=CGK&destinationId=DPS',
      '/images/flight-demo.svg',
    ],
    [
      'MICE',
      '/mice?locationId=bali&flexible=true',
      '/images/mice-conference.jpg',
    ],
    [
      'Wedding',
      '/wedding?locationId=bali&flexible=true',
      '/images/wedding-garden.jpg',
    ],
    [
      'Rental Mobil',
      '/cars?locationId=bali&pickupArea=central',
      '/images/car-city.jpg',
    ],
  ] as const) {
    const card = section.getByRole('link', { name: new RegExp(label) });
    await expect(card).toHaveAttribute(
      'href',
      new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );
    await expect(card.locator('img')).toHaveAttribute(
      'src',
      new RegExp(
        image.endsWith('.svg')
          ? image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          : encodeURIComponent(image),
      ),
    );
  }

  await section.getByRole('link', { name: /Hotel/ }).click();
  await expect(page).toHaveURL(/\/hotels\?locationId=bali/);
  await expect(
    page.getByRole('heading', {
      name: 'Temukan tempat menginap di Bali',
      exact: true,
    }),
  ).toBeVisible();
});
test('validation, flight category and flexible venue search', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cari', exact: true }).click();
  await expect(
    page.getByRole('form', { name: 'Pencarian Hotel' }).getByRole('alert'),
  ).toContainText('Pilih lokasi');
  await page.getByRole('tab', { name: 'Penerbangan', exact: true }).click();
  await location(page, 'flight-locationId', 'Jakarta (CGK)');
  await location(page, 'flight-destinationId', 'Bali (DPS)');
  await page.locator('#flight-start').fill('2099-12-10');
  await page.getByRole('button', { name: 'Cari', exact: true }).click();
  await expect(page).toHaveURL(/\/flights\?/);
  expect(new URL(page.url()).searchParams.has('end')).toBe(false);
  expect(new URL(page.url()).searchParams.has('rooms')).toBe(false);
  await page.goto('/?service=mice');
  await expect(
    page.getByRole('tab', { name: 'MICE', exact: true }),
  ).toHaveAttribute('data-state', 'active');
  await location(page, 'mice-locationId', 'Jakarta Kota');
  await page.getByLabel('Tanggal saya fleksibel').check();
  await page.getByRole('button', { name: 'Cari', exact: true }).click();
  await expect(page).toHaveURL(/\/mice\?/);
  expect(new URL(page.url()).searchParams.get('flexible')).toBe('true');
});
test('saved listings, offer dialog and local persistence', async ({ page }) => {
  await page.goto('/');
  const save = page.getByRole('button', {
    name: 'Simpan Seruni Resort & Spa',
    exact: true,
  });
  await save.click();
  await expect(
    page.getByRole('button', {
      name: 'Hapus Seruni Resort & Spa dari tersimpan',
    }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page
    .getByRole('button', { name: 'Tersimpan (1)', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Seruni Resort & Spa', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Villa Nala Ubud', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Lihat syarat penawaran' })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toContainText('belum merupakan promo');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('content error recovery, empty state and responsive accessibility', async ({
  page,
}, testInfo) => {
  await page.goto('/?scenario=error');
  await expect(
    page.getByRole('heading', { name: 'Inspirasi sedang dalam perjalanan.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Seruni Resort & Spa', exact: true }),
  ).toBeVisible();
  await page.goto('/?scenario=empty');
  await expect(
    page.getByRole('heading', { name: 'Destinasi pilihan segera hadir.' }),
  ).toBeVisible();
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Seruni Resort & Spa', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `test-results/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('home, wedding, rental and child ages respect category contracts', async ({
  page,
}) => {
  await page.goto('/?service=home');
  await location(page, 'home-locationId', 'Bali Destinasi');
  await page.locator('#home-start').fill('2099-12-10');
  await page.locator('#home-end').fill('2099-12-12');
  await page.getByRole('button', { name: 'Cari', exact: true }).click();
  await expect(page).toHaveURL(/\/homes\?/);
  expect(new URL(page.url()).searchParams.has('rooms')).toBe(false);
  await page.goto('/?service=wedding');
  await location(page, 'wedding-locationId', 'Bandung Kota');
  await page.getByLabel('Tanggal saya fleksibel').check();
  await expect(page.locator('#wedding-layout')).toHaveValue('seated');
  await page.getByRole('button', { name: 'Cari', exact: true }).click();
  await expect(page).toHaveURL(/\/wedding\?/);
  await page.goto('/?service=car');
  await location(page, 'car-locationId', 'Bali Destinasi');
  await page.locator('#car-start').fill('2099-12-10');
  await page.locator('#car-end').fill('2099-12-12');
  await page.getByLabel('Area ambil & kembali').fill('Bandara Ngurah Rai');
  await page.getByLabel('Lepas kunci', { exact: true }).check();
  await page.getByRole('button', { name: 'Cari', exact: true }).click();
  await expect(page).toHaveURL(/\/cars\?/);
  const query = new URL(page.url()).searchParams;
  expect(query.get('mode')).toBe('self');
  expect(query.get('pickup')).toBe('Bandara Ngurah Rai');
  expect(query.has('rooms')).toBe(false);
  await page.goto('/');
  await page.getByRole('button', { name: /Tamu & kamar/ }).click();
  await page.getByRole('button', { name: 'Tambah Anak', exact: true }).click();
  await page.getByLabel('Usia anak 1').selectOption('7');
  await page.getByRole('button', { name: 'Selesai', exact: true }).click();
  await page.getByRole('tab', { name: 'MICE', exact: true }).click();
  await page.getByRole('tab', { name: 'Hotel', exact: true }).click();
  await page.getByRole('button', { name: /Tamu & kamar/ }).click();
  await expect(page.getByLabel('Usia anak 1')).toHaveValue('7');
});

test('viewport matrix and keyboard navigation remain usable', async ({
  page,
}) => {
  await page.goto('/');
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole('button', { name: 'Cari', exact: true }),
    ).toBeVisible();
  }
  await page.getByRole('tab', { name: 'Hotel', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('tab', { name: 'Home Rental', exact: true }),
  ).toHaveAttribute('data-state', 'active');
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('tab', { name: 'Penerbangan', exact: true }),
  ).toHaveAttribute('data-state', 'active');
  await page.getByRole('combobox', { name: 'Dari', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('#flight-locationId')).toHaveValue('Jakarta (CGK)');
});
