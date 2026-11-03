import { z } from 'zod';
export const businessSchema = z.object({
  name: z.string().trim().min(3, 'Nama usaha minimal 3 karakter.').max(100),
  email: z.email('Masukkan email usaha yang valid.'),
  phone: z.string().regex(/^\+?[\d\s()-]{8,20}$/, 'Nomor telepon tidak valid.'),
  address: z.string().trim().min(10, 'Alamat minimal 10 karakter.').max(300),
});
export const listingSchema = z.object({
  category: z.enum(['hotel', 'home', 'car', 'mice', 'wedding']),
  name: z.string().trim().max(100),
  address: z.string().trim().max(300),
  description: z.string().trim().max(1500),
  capacity: z.number().int().min(0).max(10000),
  facilities: z.array(z.string().max(80)).max(30),
  price: z.number().int().min(0).max(1e10),
  stock: z.number().int().min(0).max(10000),
  minStay: z.number().int().min(1).max(60),
  buffer: z.number().int().min(0).max(1440),
  ratePlan: z.string().max(80),
});
export const calendarSchema = z
  .object({
    start: z.iso.date(),
    end: z.iso.date(),
    stock: z.number().int().min(0).max(10000),
    price: z.number().int().min(1).max(1e10),
    stopSell: z.boolean(),
    minStay: z.number().int().min(1).max(60),
    buffer: z.number().int().min(0).max(1440),
    ratePlan: z.string().trim().min(2).max(80),
  })
  .refine(
    (v) => v.start <= v.end,
    'Tanggal akhir harus sama atau setelah tanggal awal.',
  );
export const quoteSchema = z.object({
  lines: z
    .array(
      z.object({
        label: z.string().trim().min(3).max(100),
        amount: z.number().int().positive().max(1e10),
      }),
    )
    .min(1)
    .max(20),
  tax: z.number().int().min(0).max(1e10),
  serviceFee: z.number().int().min(0).max(1e10),
  validUntil: z
    .string()
    .refine(
      (v) => Number.isFinite(Date.parse(v)) && Date.parse(v) > Date.now(),
      'Masa berlaku harus di masa mendatang.',
    ),
  terms: z.string().trim().min(20, 'Ketentuan minimal 20 karakter.').max(2000),
});
export const reasonSchema = z
  .string()
  .trim()
  .min(10, 'Alasan minimal 10 karakter.')
  .max(1000);
export const memberSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email('Email staf tidak valid.'),
  role: z.enum(['operations', 'finance']),
  listingIds: z
    .array(z.string())
    .min(1, 'Pilih minimal satu assignment listing.'),
});
