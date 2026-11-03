# Venue core — Phase 05 MICE

Status: **frontend demo-ready**. Seluruh venue, kapasitas, harga, kontak PIC mitra, OTP, response target dan quote adalah simulasi. Tidak ada email atau pesan yang dikirim, kontrak ditandatangani, ruang dikunci, pembayaran, invoice transaksi venue, ataupun klaim reservasi confirmed.

## Kapabilitas yang tersedia

- MIC-01/02: kota, tanggal/jam atau fleksibel, peserta, jenis acara dan layout; kapasitas per ruang/per layout; fasilitas hanya dianggap tersedia jika `true`, bukan `null`; filter harga dibatasi satu basis (jam/hari/peserta).
- MIC-03/04: room selector, luas/foto per ruang, matrix layout, fasilitas berikon, paket dan inklusi/eksklusi, minimum peserta, pajak dan layanan. Estimate memakai minimum paket dan dilabeli indikatif, bukan harga final.
- MIC-05: satu ruang per inquiry, kontak/perusahaan, budget opsional, kamar/AV/katering/catatan, consent, lampiran terbatas. Draft belum masuk antrean aktif sebelum verifikasi kode demo 123456. ID command menjaga retry tab yang sama dari duplikasi.
- MIC-06: referensi inquiry, PIC, target satu hari kerja **hanya contoh** (SLA Operations belum diputuskan), timeline, versi quote, expiry dan snapshot. Versi lama read-only. Lampiran diakses melalui adapter yang memeriksa pemilik; tidak ada URL publik permanen.
- MIC-07: login dengan email PIC terverifikasi diperlukan untuk submit quote terbaru, valid, dengan tanggal pasti dan resource tersedia. Consent eksplisit. `submitted` → `under_review`/`follow_up_required`/`accepted_for_contract`; terakhir ditulis **Lanjut kesepakatan kontrak**, bukan reservasi confirmed. `closed_won` tidak disimpulkan dari klik quote/request.

## Batas dan kebutuhan backend

Provider/data produksi belum tersedia. Backend perlu mengimplementasikan operasi `searchMeetingSpaces`, `getMeetingSpace`, `createInquiry`, `verifyInquiryContact`, `getQuoteVersions`, `submitVenueRequest`, upload/download privat, update kebutuhan dan status tindak lanjut. Envelope backend memerlukan requestId/serverTime, version, validUntil, fieldErrors, retryAfter, capabilities dan audit actor/org. Adapter frontend saat ini memakai fixture lokal terpisah dari komponen, bukan endpoint atau otorisasi produksi.

Kontak dan record inquiry disimpan di **sessionStorage tab**, tanpa PII di URL/localStorage. Guest mempunyai akses demo pada tab pembuat; setelah claim/request, akun pemilik wajib cocok. Login akun lain ditolak, logout membersihkan view privat, dan auth diperiksa ulang saat commit. Ini simulasi perilaku UI; sessionStorage dan capability browser **tidak dapat menggantikan otorisasi object-level di server**. Claim lintas perangkat/token email produksi belum tersedia (Phase 08).

File contoh: maksimal 3 PDF/JPEG/PNG, masing-masing 5 MB; MIME dan signature dasar diperiksa. Konten hanya berada di memori tab, dibersihkan saat pergantian akun/reload; metadata tetap ada pada record. Tidak ada upload jaringan, public file URL atau retensi file produksi. Produksi memerlukan antivirus, private storage, signed URL singkat, ownership per objek, kuota dan aturan retensi.

Unknown mutation disimulasikan dengan menyimpan fakta lalu melempar UNKNOWN. UI menghentikan submit ulang dan meminta **Periksa status pengiriman**; command ID menjadi referensi rekonsiliasi. Jaminan idempotency lintas tab/aktor tetap tugas backend.

`resourceId` dan blok operasional disimpan di core venue yang dapat dipakai Wedding (Phase 06). Inquiry, quote dan venue request tidak menambah hold. Fixture mempunyai contoh blok agenda lain; simulator block/unblock mengubah resource ruang bersama. Kalender produksi, final allocation dan benturan antarpengguna harus diperiksa server. Tidak ada modul Wedding, CRM authoring Phase 09 atau dashboard operasi Phase 10 yang diklaim selesai pada fase ini.

## QA dan penggunaan

Routes: `/mice`, `/mice/[slug]`, `/mice/[slug]/inquiry`, `/account/inquiries/[id]`; semuanya noindex pada demo. Pilih `cendana-hall` untuk theater 150/classroom 80, atau `meranti-boardroom` untuk kapasitas lebih kecil. Harga Full Day Meeting minimum 50 peserta memperagakan kasus 40 peserta.

Skenario URL: ready/loading/empty/error/timeout/rate_limited/unauthorized/forbidden/inactive/blocked/mutation_timeout. 429 memperagakan retryAfter 3 detik; delay demo dipercepat. Panel **Simulasi Venue Sales** adalah alat QA yang tampak jelas, bukan izin pelanggan untuk mengubah quote mitra di produksi. Backend akan memerlukan pemisahan role pelanggan/Venue Sales/CS beserta assignment dan organisasi.

Unit mencakup schema/URL, matrix kapasitas, fasilitas unknown, harga/basis/minimum, verifikasi, deduplikasi, quote stale/expiry, block bersama, ownership, logout saat commit, unknown result, tanggal fleksibel, snapshot, dan attachment. Browser mencakup happy path, error utama, auth handoff, keyboard/dialog, layout responsif dan axe; bukan sertifikasi WCAG atau pengganti pengujian pembaca layar manual.

## Foto ilustrasi

Disimpan lokal dari Unsplash; hanya ilustrasi, bukan dokumentasi venue sintetis:

- https://images.unsplash.com/photo-1497366811353-6870744d04b2
- https://images.unsplash.com/photo-1517502884422-41eaead166d4
- https://images.unsplash.com/photo-1511578314322-379afb476865

## Gate integrated/pilot

Masih dibutuhkan: katalog mitra published/approved, validasi kapasitas oleh venue, email OTP sungguhan dan delivery log, CRM/PIC/assignment, SLA dan jam kerja Operations, consent/privasi/retensi yang direview, storage file privat, kalender ruang otoritatif, idempotency/audit backend, monitoring serta UAT Product dan Venue Operations. Demo tidak memenuhi gate data live/produksi.
