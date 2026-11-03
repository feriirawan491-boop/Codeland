# Gobuking — Phase 01–10 Travel, User, Partner & Super Admin

Homepage frontend lokal berdasarkan PRD Phase 01 dan PRD UI/UX Frontend Phase 01. Revisi visual mengikuti pola navigasi dan penemuan Booking.com dengan identitas Gobuking. Primary memakai token `blue-600`, header/hero `blue-950`, dan surface `blue-50` dari Tailwind. Fase berikutnya dikerjakan hanya setelah instruksi lanjutan.

## Menjalankan

Diperlukan Node.js 22.13+ (disarankan Node.js 24).

```sh
cd gobuking
npm ci
npm run dev
```

Buka http://localhost:3000. Server hanya bind ke loopback. Jika berada di dalam folder `gobuking`, langsung jalankan `npm run dev`.

Production lokal:

```sh
npm run build
npm start
```

Hentikan dev server dengan Ctrl+C sebelum memakai port yang sama untuk production. Build memakai Webpack untuk kompatibilitas sandbox lokal; development memakai Turbopack.

## Cakupan yang tersedia

- Homepage dengan Bebas Neue 400 untuk headline dan Plus Jakarta Sans 400/500/600/700/800 untuk UI, seluruhnya lokal. Enam tab layanan, hero, pencarian dominan, penawaran, destinasi, jenis akomodasi, pilihan editorial, kemitraan, bantuan, dan footer.
- Enam pencarian dengan parameter berbeda: penginapan, penerbangan sekali jalan/pulang pergi, MICE, wedding, dan rental mobil dengan interval jam.
- Autocomplete ID lokasi dengan debounce 300 ms dan keyboard; teks yang diedit membatalkan ID lama.
- React Hook Form + Zod: validasi tanggal, tamu dan usia anak hotel, bandara, peserta, area/jam rental.
- Draft antar-tab, pemulihan URL, halaman ringkasan serah-terima untuk setiap kategori.
- Properti favorit di localStorage: hanya ID publik, tanpa token/PII. Favorit digabung tanpa duplikasi saat login ke akun demo; penyimpanan akun hanya pada tab lokal.
- Dialog syarat promo, detail properti contoh, informasi akun, dan halaman publik bantuan/mitra/ketentuan/privasi.
- Loading skeleton, empty, error + retry, gambar gagal, toast, serta fallback 404.

## Batas fase

Ini **UI demo-ready**. Konten listing, harga, fasilitas, dan promo adalah fixture sintetis; foto ilustrasi disimpan lokal dari Unsplash. Tidak ada klaim ketersediaan nyata, backend bisnis, OTP nyata, CMS, live flight supplier, booking nyata, pembayaran nyata, inquiry aktif, atau dashboard. Server Components Next.js dipakai untuk rendering, bukan implementasi backend bisnis.

Route `/wedding`, dan `/cars` saat ini hanya **serah-terima parameter Phase 1**. Route ini akan diganti implementasi modul pada fase terkait. Konten demo tidak menjadi fallback diam-diam untuk API produksi.

## Struktur

- `src/app/`: pages, layout, metadata, dan route handoff.
- `src/components/ui/`: primitives shadcn-style berbasis Radix, CVA, dan Tailwind.
- `src/components/layout/`: public header/footer.
- `src/features/home/components/`: interaksi dan section homepage.
- `src/features/home/lib/`: fixture adapter dan kontrak pencarian.
- `src/features/account/`: login/daftar OTP lokal, sesi akun demo, dan akses akun di header/checkout.
- `src/hooks/`: debounce dan browser saved store.
- `src/lib/constants.ts`: navigasi, perusahaan, dan konten informasi publik.
- `src/app/globals.css`: tokens, responsive layouts, focus, reduced motion.
- `tests/e2e/`: browser task flows, viewport matrix, axe scan.

Tidak memasang tabel, chart, virtualisasi, atau dashboard yang belum digunakan di Phase 1. Storybook, TanStack Table, Recharts, serta Motion dapat ditambahkan saat ada kebutuhan komponen terkait.

## Memeriksa

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
npm run test:e2e
```

E2E memerlukan server lokal aktif dan Google Chrome terpasang. Playwright menguji desktop dan emulasi mobile. Screenshot tersimpan di `test-results/` (diabaikan Git). Axe merupakan pemeriksaan otomatis; tidak dianggap sertifikasi WCAG atau pengganti review pembaca layar manual.

## State untuk review

- `/?scenario=loading`: pemuatan konten selama 1,8 detik.
- `/?scenario=empty`: konten editorial kosong; search tetap aktif.
- `/?scenario=error`: error konten; tombol Coba lagi memulihkan fixture ready.
- `/?service=flight`: tab penerbangan aktif (juga `hotel`, `home`, `mice`, `wedding`, `car`).

## Phase 02 Hotel

- `/hotels`: hasil pencarian, filter total menginap termasuk pajak, fasilitas, kelas bintang, skor ulasan, sarapan, pembatalan; debounce pencarian nama, sort, pagination, filter mobile dengan tombol Terapkan, dan URL yang dapat dibagikan.
- Peta Leaflet + OpenStreetMap dan daftar tersinkron. Peta memerlukan koneksi internet; kegagalan tile tidak menghilangkan daftar hotel.
- `/hotels/seruni-resort-spa`: galeri, fasilitas, aturan, ulasan contoh tanpa jumlah total ulasan, tipe kamar dan tarif, kapasitas dan stok seluruh malam. Semua tarif pada tipe kamar memakai stok yang sama.
- Checkout: wajib login/daftar akun demo dengan OTP simulasi `123456`, pemilihan VA/QRIS sebelum membuat pesanan, React Hook Form + Zod, persetujuan perubahan harga, penyegaran quote kedaluwarsa, dan ringkasan pajak/biaya.
- Booking demo: seluruh hotel langsung ke pembayaran tanpa persetujuan mitra (revisi alur pengguna), status reservasi/pembayaran/refund terpisah, invoice PDF booking/reservasi hanya sesudah pembayaran simulasi berhasil, pembatalan dan estimasi refund. Alat simulasi pembayaran tersedia pada halaman status.
- Pilihan kamar dan status demo tersimpan di **sessionStorage tab ini**. Profil akun demo (nama, email, nomor telepon) dan sesi login disimpan di sessionStorage selama tab terbuka dengan persetujuan saat daftar. Snapshot nama pemesan, email tujuan invoice, dan nama tamu utama disimpan dalam pesanan demo untuk invoice; nomor telepon dan catatan permintaan khusus tidak disalin ke pesanan. Data tidak dimasukkan ke URL atau log. Pesanan menyimpan ID akun pemilik dan metode pembayaran. Ini bukan autentikasi/OTP/gateway maupun inventori produksi. Menutup tab akan mengakhiri penyimpanan demo.
- Bahasa Indonesia dan English mengikuti pilihan bahasa global. Tidak ada pengiriman email atau pembayaran sungguhan.

Skenario: buka `/hotels?scenario=empty`, `error`, `loading`, `sold_out`, `unauthorized`, `forbidden`, `rate_limited`, atau `timeout`. Gunakan `/hotels?view=map&scenario=map_error` untuk peta gagal. Pada detail gunakan `?scenario=price_changed` atau `?scenario=quote_expired`, pilih tarif lalu checkout. Kontrol skenario tersedia di bagian bawah daftar dan detail.

Integrasi produksi berikutnya memerlukan API hotel/inventori, quote dan idempotensi di server, autentikasi OTP nyata, pembayaran terverifikasi server, webhook, refund, dan email. Penyimpanan serta kontrol frontend ini tidak memberi jaminan keamanan, konsistensi antar-tab, atau alokasi stok produksi. Keputusan bisnis PRD yang belum disepakati tetap terbuka. Phase berikutnya menunggu instruksi pengguna.

Referensi implementasi: [Next.js](https://nextjs.org/docs), [shadcn/ui](https://ui.shadcn.com/docs), [Tailwind](https://tailwindcss.com/docs), [Lucide](https://lucide.dev/guide/react).

## Referensi revisi visual

Pola konten mengikuti [Booking.com](https://www.booking.com/): kategori layanan, pencarian, offers, trending destinations, dan browse by property type. Homepage langsung memunculkan verifikasi robot saat peninjauan; struktur konten diperiksa melalui halaman resmi yang terindeks. Palet menggunakan variabel bawaan [Tailwind colors](https://tailwindcss.com/docs/colors), bukan warna navy kustom sebelumnya.

## Penyempurnaan layout dan spacing

Header putih, hero biru muda dengan foto asimetris, dan kartu pencarian mandiri memberi identitas Gobuking sendiri. Kategori layanan berada di dalam kartu; mobile menampilkan enam kategori dalam grid. Field utama serta tombol Cari menggunakan token tinggi 52 px, jarak label 8 px, gap form 12–16 px, dan padding kartu 28 px (20 px mobile). Kartu destinasi memakai satu foto utama tinggi dan empat foto pendamping.

## Bahasa Indonesia dan English

Pemilih bahasa pada header tersedia di desktop dan mobile. Default adalah Bahasa Indonesia; preferensi disimpan selama satu tahun pada cookie `gobuking-locale` dengan `SameSite=Lax`. Server dan komponen interaktif memakai locale yang sama. Pergantian bahasa memperbarui tampilan tanpa memuat ulang seluruh halaman dan mempertahankan draft pencarian, tab aktif, URL, serta favorit.

Terjemahan mencakup navigasi, homepage, konten contoh, enam form pencarian, validasi, dialog, toast, label aksesibilitas, halaman informasi, penawaran, 404, dan ringkasan pencarian. Judul/description halaman serta atribut `html lang` mengikuti bahasa. Mata uang tetap IDR; format angka dan tanggal ringkasan menyesuaikan locale `id-ID` atau `en-GB`. Kalender native mengikuti kemampuan bahasa browser/perangkat.

Konfigurasi berada di `src/lib/i18n/config.ts`; kamus English di `src/lib/i18n/en.json` menggunakan teks Indonesia sebagai kunci. `createTranslator` menangani interpolasi, fallback, dan whitespace inline. `getI18n` membaca preferensi pada Server Components; `LocaleProvider` menyediakan locale untuk komponen interaktif. Tidak memakai layanan penerjemahan eksternal. Penambahan bahasa ini mengikuti instruksi pengguna terbaru, melengkapi baseline PRD Phase 1.

Revisi alur Hotel: belum login → Masuk; belum terdaftar → Daftar; sesudah verifikasi → data pemesan terisi dari akun → isi data tamu → pilih VA/QRIS → instruksi pembayaran. Tidak ada langkah persetujuan mitra. Konfirmasi dan invoice reservasi tetap memerlukan hasil pembayaran simulasi berhasil. Login/daftar tersedia dari header; keluar akun memblokir checkout dan akses pesanan sampai masuk kembali. Ini simulasi frontend; kontrol akses/idempotensi produksi harus ditegakkan server.

## Invoice booking/reservasi

Setelah pembayaran simulasi berhasil dan reservasi terkonfirmasi, adapter menerbitkan satu nomor invoice dan mencatat simulasi email otomatis ke **email pemesan pada saat checkout**, bukan email sesi yang berubah sesudahnya. Invoice dapat diunduh manual sebagai PDF A4 berisi data pemesan/tamu, hotel/kamar, tanggal, jumlah tamu, subtotal, pajak, biaya layanan, total dibayar, metode pembayaran, status reservasi, serta refund bila ada. PDF diberi label DEMO dan bukan bukti transaksi nyata/faktur pajak.

Pengiriman email **belum nyata**: tidak ada SMTP/API email atau backend/gateway produksi. UI menampilkan tujuan, status simulasi, pratinjau email dan lampiran, serta simulasi kirim ulang. Alat demo dapat mensimulasikan email gagal; kegagalan ini tidak membatalkan reservasi atau menghalangi unduh PDF. Invoice hanya diterbitkan sekali untuk satu pembayaran, tetap tersedia sebagai catatan pembayaran sesudah pembatalan/refund, dan tidak diterbitkan untuk pembayaran pending/gagal/terlambat yang masuk penanganan. Pesanan demo lama yang sudah dibayar diperbarui saat dibuka; nama tamu yang sebelumnya tidak tersimpan ditampilkan sebagai belum tercatat.

Untuk email otomatis sungguhan dibutuhkan backend dengan verifikasi pembayaran, outbox email idempoten, penyimpanan invoice, provider email dan kredensial pengirim yang dikonfigurasi. Tidak ada klaim email berhasil terkirim dari adapter lokal.

## Phase 03 — Home Rental

Buka http://localhost:3000/homes. Tersedia pencarian, filter konfigurasi ruang/fasilitas/aturan, urutan harga total, pagination, peta perkiraan, galeri, pengelola demo, tempat tidur, kalender per unit, dan ulasan tanpa jumlah ulasan.

Sesuai revisi pengguna, seluruh hunian memakai **pembayaran langsung tanpa persetujuan host**. Login/daftar diperlukan sebelum checkout. Biaya kebersihan dibebankan sekali per kunjungan; tambahan opsional, pajak, dan biaya layanan masuk total online. Deposit terpisah dibayar kepada pengelola dan tidak masuk total gateway. Aturan rumah dan deposit memerlukan persetujuan sebelum pembayaran.

Kalender memeriksa kapasitas, minimum/maksimum malam, lead time menurut zona hunian, blok pemilik, buffer pembersihan, dan reservasi aktif. Seruni Garden Residence berbagi resource dengan suite Hotel Seruni sehingga stok lokal tidak bisa dijual dua kali lewat modul berbeda. Hold kedaluwarsa/cancel melepaskan stok. Idempotency mencegah duplikasi submit pada tab yang sama.

Reservasi terkonfirmasi setelah simulasi pembayaran sukses. Invoice PDF dapat diunduh manual; email tetap simulasi. Instruksi kedatangan demo diperiksa kepemilikannya dan hanya terbuka setelah konfirmasi. Fixture publik hanya berisi area perkiraan, tanpa alamat rinci atau kode akses. Ketentuan hunian/deposit disalin ke reservasi agar perubahan data listing tidak mengganti kesepakatan pesanan.

Route: `/homes`, `/homes/[slug]`, `/checkout/home/[draftId]`, `/bookings/[bookingId]`. Modul berada di `src/features/home-rental`; media, pembayaran, data tamu, inventori, invoice dan status memakai komponen bersama. Bahasa Indonesia/Inggris tersedia.

Batas produksi: autentikasi, ketersediaan, locking inventori lintas pengguna/perangkat, pembayaran, email, alamat privat dan verifikasi host masih memerlukan backend/provider nyata. Data dan proteksi demo di browser bukan pengganti otorisasi server.

## Phase 04 — Flights (pencarian saja)

Buka http://localhost:3000/flights. Form mendukung sekali jalan/pulang pergi, swap bandara, tanggal, dewasa/anak/bayi dan ekonomi/bisnis. Hasil dapat difilter berdasarkan maskapai demo, transit dan jam lokal serta diurutkan harga/durasi. Harga utama adalah total semua penumpang termasuk pajak/biaya.

Pulang pergi memilih berangkat, kemudian pasangan pulang yang kompatibel dari provider. Mengganti berangkat menghapus pilihan pulang. Total kombinasi berasal dari satu offer supplier demo, tanpa menjumlahkan kartu terpisah. URL menyimpan konteks filter/sort/halaman/pilihan untuk Back dan deep-link.

Detail menampilkan setiap segmen, transit, waktu lokal beserta WIB/WITA dan zona IANA, pergantian hari, bagasi nullable, ketentuan tarif, ID supplier, fetchedAt dan expiry bila tersedia. Expired/unavailable, hasil kosong, timeout, offline dan rate-limit memiliki recovery tersendiri. Tidak ada checkout, pembayaran, PNR, e-ticket, atau konfirmasi tiket.

Route: `/flights`, `/flights/results`, `/flights/offers/[offerId]`. Handoff lama dari homepage ke `/flights?…` langsung menampilkan hasil. Modul `src/features/flights` memakai adapter dengan provider fixture terpisah. Lihat [kontrak integrasi](src/features/flights/CONTRACT.md).

**Status integrasi: frontend demo, bukan supplier live.** Data penerbangan sintetis berlabel Gobuking Flight Sandbox. Nama maskapai, jadwal, harga, bagasi dan aturan penumpang adalah contoh. FLT-03 acceptance data nyata belum terpenuhi; dibutuhkan kontrak supplier resmi, kredensial di server dan backend validasi/kuota/monitoring sebelum pilot. Harga demo tidak dapat digunakan membeli tiket.

## Phase 05 — MICE

Buka http://localhost:3000/mice. Cari ruang menurut kota, tanggal/jam atau fleksibel, peserta, layout, jenis acara, indoor/outdoor dan fasilitas terverifikasi. Kapasitas dicocokkan per layout ruang, bukan total venue. Basis harga jam/hari/peserta dipisahkan; minimum peserta, pajak/layanan, inklusi/eksklusi dan estimasi indikatif terlihat pada paket.

Alur: pilih ruang/paket → data perusahaan dan kebutuhan → verifikasi email demo → inquiry aktif → penawaran/revisi PIC demo → login dengan email PIC → submit quote terbaru → tindak lanjut kontrak. Penawaran lama/expired, ruang diblokir, tanggal fleksibel dan sesi tidak berizin ditangani. Inquiry dan request tidak mengunci ruang atau menerima uang. Status Lanjut kesepakatan kontrak bukan reservasi confirmed.

Route `/account/inquiries/[id]` menyediakan timeline, PIC, versi penawaran, expiry, lampiran sementara dan review permintaan. Panel Simulasi Venue Sales digunakan untuk QA, bukan dashboard mitra produksi. Kontak tetap pada tab lokal; logout/akun berbeda membersihkan view privat. Lampiran PDF/JPEG/PNG maksimal 5 MB per file hanya disimpan sementara di memori, bukan diunggah.

Core `src/features/venue` menyediakan model resource bersama untuk Wedding berikutnya. Detail kontrak, batas integrasi dan sumber foto ada di [handoff Venue core](src/features/venue/CONTRACT.md). OTP/email, CRM, katalog dan kalender mitra, berkas privat, SLA, otorisasi/idempotency lintas pengguna dan kontrak sungguhan masih memerlukan backend serta validasi operasional. Tidak ada transaksi nyata pada demo ini.

## Phase 06 — Wedding Venue

Buka `http://localhost:3000/wedding`. Pencarian memakai kapasitas duduk/berdiri terpisah, pilihan area, paket venue-only/inklusif/kustom, minimum tamu dan estimasi total dengan pajak, layanan serta overtime. Detail mencakup galeri berlabel area, fasilitas berupa poin, akses, parkir dan batas jam.

Inquiry mendukung tanggal alternatif, anggaran opsional dan permintaan site visit dengan verifikasi kontak. Permintaan booking memerlukan akun, mempertahankan konteks paket/tanggal, dan dapat diajukan sebelum quote final. Tracking menampilkan versi/masa berlaku quote, pembaruan penawaran, status permintaan dan tindak lanjut PIC. Tidak ada pembayaran, penguncian tanggal atau reservasi otomatis dalam Phase 06. OTP demo `123456`; seluruh data dan respons mitra masih lokal.

Kontrak implementasi dan batas integrasi produksi: [Wedding CONTRACT](src/features/wedding/CONTRACT.md).

## Phase 07 — Car Rental

Buka `http://127.0.0.1:3000/cars`. Pilih dengan pengemudi atau lepas kunci, kota/area dan interval tanggal/jam. Hasil dapat difilter berdasarkan kelas, kursi, bagasi, transmisi, penyedia dan total harga. Detail memisahkan paket 12/24 jam, BBM/tol/parkir, overtime, pengantaran, deposit dan syarat kelayakan.

Pengajuan memerlukan akun; pembayaran dibuka setelah verifikasi dan alokasi mitra. Status mencakup persetujuan/kedaluwarsa, pembayaran, invoice PDF, usulan kendaraan pengganti dengan persetujuan, checklist pickup/return dan pemeriksaan kondisi. Deposit dan biaya tambahan tetap terpisah, tanpa tagihan otomatis. Simulasi Operations tersedia untuk mencoba perjalanan status; OTP `123456`. Semua data, pembayaran dan email masih demo lokal.

Kontrak fitur, skenario, dan batas produksi: [Car Rental CONTRACT](src/features/car/CONTRACT.md).

## Phase 08 — User Dashboard

Open http://127.0.0.1:3000/account/bookings and register/sign in with demo OTP `123456`. The account area includes active bookings, history, inquiry/quotes, saved properties, verified contact changes, cancellation/refund previews, reviews, sessions/privacy requests and support tickets. Paid eligible bookings offer PDF invoice downloads. Fresh accounts start empty; use the explicit sample-activity control to explore local scenarios.

Details and production integration boundaries: [Dashboard contract](src/features/dashboard/CONTRACT.md).

## Phase 09 — Partner Dashboard

Open http://127.0.0.1:3000/partner. Register/sign in using demo OTP `123456`, then create an organization draft or explicitly activate the partner demo workspace. Two demo organizations and Owner, Operations, Finance personas demonstrate listing assignments and organization isolation. The twelve screens cover business verification, listings, calendar/rates, reservations, operations, Venue CRM, customers, reviews, financial statements, team and support.

Use **Tambahkan aktivitas mitra contoh** to create customer-source bookings and inquiries. Bank changes remain pending verification; publishing new listings and real Finance approvals remain Phase 10 integrations. [Partner contract and limits](src/features/partner/CONTRACT.md).

## Phase 10 — Super Admin

Akses lokal: http://127.0.0.1:3000/admin. Masuk/daftar dengan OTP demo `123456`, lalu pilih **Aktifkan workspace admin demo**. Tombol simulasi antrean menambahkan contoh operasional secara eksplisit. Persona demo tersedia untuk Super Admin, Content/Partnership, Operations/CS, Finance Maker, dan Finance Checker.

Lima belas area mencakup verifikasi mitra, moderasi katalog, reservasi/exception, Venue CRM, pelanggan, refund, settlement/payout, dukungan, CMS/promo, laporan, kebijakan platform, moderasi ulasan, integrasi, serta akses/audit. Transaksi tetap menggunakan sumber data fase sebelumnya. Payout dan refund memerlukan aktor pemeriksa berbeda; status paid memerlukan bukti dan rekonsiliasi. CMS memiliki periode tayang dan kebijakan baru tidak mengubah snapshot reservasi lama.

Seluruh operasi adalah simulasi frontend dalam sesi browser yang sama. Tidak ada transfer dana, gateway, email, ataupun otorisasi server produksi. Berkas privat tersimpan di memori dan perlu diunggah ulang setelah reload. Lihat [kontrak Phase 10](src/features/admin/CONTRACT.md).
