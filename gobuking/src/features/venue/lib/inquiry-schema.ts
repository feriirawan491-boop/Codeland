import { weddingRequirementsSchema } from '@/features/wedding/lib/query';
import { z } from 'zod';
import { eventSchema } from './query';
export const inquiryContactSchema = z.object({
  name: z.string().trim().min(2, 'Isi nama PIC minimal 2 karakter.').max(100),
  email: z
    .email('Masukkan email yang valid.')
    .transform((v) => v.trim().toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{8,20}$/, 'Masukkan nomor telepon yang valid.'),
  company: z
    .string()
    .trim()
    .min(2, 'Isi nama perusahaan atau organisasi.')
    .max(150),
});
export const inquiryNeedsSchema = z.object({
  av: z.boolean(),
  catering: z.boolean(),
  rooms: z
    .number({ error: 'Isi kebutuhan kamar dengan angka.' })
    .int()
    .min(0)
    .max(100, 'Maksimal 100 kamar pada demo ini.'),
  budget: z
    .number({ error: 'Isi anggaran dengan angka.' })
    .positive('Anggaran harus lebih dari nol.')
    .max(10000000000)
    .optional(),
  notes: z.string().trim().max(2000, 'Catatan maksimal 2.000 karakter.'),
});
export const inquiryInputSchema = z
  .object({
    service: z.enum(['mice', 'wedding']),
    spaceId: z.string().min(1),
    packageId: z.string().min(1),
    event: eventSchema,
    contact: inquiryContactSchema.extend({
      company: z.string().trim().max(150),
    }),
    wedding: weddingRequirementsSchema.optional(),
    needs: inquiryNeedsSchema,
    consent: z
      .boolean()
      .refine((v) => v, 'Setujui penggunaan data untuk tindak lanjut inquiry.'),
  })
  .superRefine((value, ctx) => {
    if (value.service === 'mice' && value.contact.company.length < 2)
      ctx.addIssue({
        code: 'custom',
        path: ['contact', 'company'],
        message: 'Isi nama perusahaan atau organisasi.',
      });
    if (value.service === 'wedding') {
      if (!value.wedding)
        ctx.addIssue({
          code: 'custom',
          path: ['wedding'],
          message: 'Lengkapi kebutuhan pernikahan.',
        });
      if (!['banquet', 'standing'].includes(value.event.layout))
        ctx.addIssue({
          code: 'custom',
          path: ['event', 'layout'],
          message: 'Pilih format tamu duduk atau berdiri.',
        });
      if (
        value.wedding?.alternativeDates.includes(value.event.start) &&
        !value.event.flexible
      )
        ctx.addIssue({
          code: 'custom',
          path: ['wedding', 'alternativeDates'],
          message: 'Tanggal alternatif harus berbeda dari tanggal utama.',
        });
    }
  });
