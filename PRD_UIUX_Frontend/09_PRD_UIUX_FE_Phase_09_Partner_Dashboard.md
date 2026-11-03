# PRD UI UX dan Frontend Phase 09 Partner Dashboard

| Atribut | Isi |
|---|---|
| Versi dan tanggal | 1.0 — 28 Oktober 2026 |
| Status | Draft desain dan frontend untuk review |
| Fokus | Website responsif, interaksi, komponen, data adapter dan pengujian frontend |
| Acuan bisnis | [PRD Phase 09 Partner Dashboard](../PRD_Per_Phase/09_PRD_Phase_09_Partner_Dashboard.md) |
| Acuan lintas fase | [Design system dan kontrak frontend](00_Design_System_dan_Kontrak_Frontend.md) |
| Indeks | [Paket UI UX dan Frontend](00_Index_UIUX_Frontend.md) |

## 1. Tujuan dan batas pekerjaan

Memungkinkan mitra mengelola penjualan dan pemenuhan layanan secara mandiri dalam organisasinya.

Dokumen ini memperinci lapisan UI/UX dan frontend atas baseline bisnis. Hasil yang diminta adalah spesifikasi untuk implementasi; dokumen ini tidak berarti aplikasi atau desain Figma telah dibuat. Phase merupakan paket modul, bukan urutan yang menunda fondasi dashboard sampai paling akhir.

**Aktor:** Partner Owner; Operations; Finance dengan assignment listing.

P0 frontend mencakup layar, navigasi, komponen, state, validasi kenyamanan, data adapter, fixture, respons error dan test UI. Kebenaran stok, harga, persetujuan, pembayaran, ownership dan izin tetap berasal dari layanan backend. Implementasi server, database, webhook, supplier booking, dan transfer dana di luar pekerjaan frontend. Backend yang belum tersedia dapat diganti mock di lingkungan demo berlabel; hal itu tidak memenuhi gate produk live.

Batas layanan tetap: Flights pencarian saja, venue inquiry/quote/request, hotel/home/car booking sesuai baseline. **Di luar MVP:** Channel manager produksi, property accounting penuh, housekeeping, co-host split payout, API fleet, partner ads.

## 2. Peta layar dan route usulan

Route merupakan kontrak navigasi frontend usulan, bukan endpoint API final. Route bersama dipakai satu implementasi dengan view model sesuai jenis produk. Slug/ID privat tidak menjadi bukti hak akses.

| Route | Layar | Hierarki konten | CTA utama |
|---|---|---|---|
| `/partner` | Ringkasan | Org switch → KPI → action queues → operational today | Buka antrean |
| `/partner/business` | Usaha | Profile → verification → contracts → masked bank | Ajukan perubahan |
| `/partner/listings` | Listing | Category/status filters → listing table → wizard/preview | Tambah listing |
| `/partner/inventory` | Kalender | Resource selector → date grid → bulk preview → validation | Terapkan perubahan |
| `/partner/reservations` | Reservasi | Status/category filters → table → decision drawer | Tinjau request |
| `/partner/operations` | Operasional | Day/category views → assignment → handover checklist | Catat layanan |
| `/partner/inquiries` | Venue CRM | SLA/PIC queue → lead → quote editor/version diff | Kirim penawaran |
| `/partner/customers` | Pelanggan | Scoped search → masked table → own transaction history | Lihat riwayat |
| `/partner/finance` | Keuangan | Period → sales/deductions/eligible/paid → statement | Unduh statement |
| `/partner/reviews` | Ulasan | Review inbox → reply/report | Balas |
| `/partner/team` | Tim | Role/listing assignments → invite/revoke | Undang staf |
| `/partner/support` | Bantuan | Tickets → thread → activity log | Buat tiket |

## 3. Layout dan perilaku responsive

Desktop: shell dengan sidebar 240 px, topbar 64 px, area kerja fleksibel; ringkasan maksimal empat KPI per baris. Tablet: sidebar collapsed/drawer. Mobile: navigasi drawer dan kartu ringkas untuk antrean; detail terbuka sebagai halaman atau drawer penuh. Tabel keuangan tetap tabel semantik dalam region scroll berlabel, dengan kolom identitas/status utama terlihat dan akses detail untuk seluruh kolom. Tidak menghilangkan angka penting demi layar kecil.

Breakpoint usulan: compact <768 px, medium 768–1023 px, wide ≥1024 px. Uji minimal 360, 768, 1024 dan 1440 px serta reflow 320 CSS px. Layout merespons ruang konten, bukan nama perangkat. Pada zoom 200–400%, konten utama dapat dioperasikan; tabel/peta dua dimensi memakai region khusus.

## 4. Wireframe struktural

Contoh berikut menetapkan urutan informasi, bukan mockup visual final.

```text
[Header / konteks layanan atau organisasi]
[Profile]
[verification]
[contracts]
[masked bank]
[Feedback status / bantuan kontekstual]
```

Urutan baca mobile mengikuti prioritas yang sama. Komponen tabel dan panel split boleh direstrukturisasi, tetapi status, total, syarat serta CTA tidak boleh kehilangan konteks.

## 5. Spesifikasi frontend per fitur

ID bisnis dipertahankan untuk mapping. AC berakhiran FE adalah kriteria yang dapat diuji pada browser dengan adapter nyata atau fixture terkontrol. AC bisnis yang membutuhkan server tetap menjadi dependensi dan tidak diklaim lolos oleh mock UI.

### PTR-01 Profil, dokumen, rekening, perjanjian

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin mengelola profil dan dokumen usaha agar proses verifikasi serta pembayaran tepat.

**Scope produk:** Data sensitif dibatasi; perubahan rekening harus diverifikasi ulang.

**Komponen:** `BusinessProfileWizard`. **Interaksi:** Profil, dokumen, rekening masked dan status review.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-01-FE01:** Owner dapat ajukan rekening; Operations tidak mendapat edit control dan respons forbidden tetap ditangani.

**AC PTR-01-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-02 Listing dan multi-property

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin mengelola listing per properti agar informasi produk tetap akurat.

**Scope produk:** CRUD sesuai kategori, validasi kelengkapan, preview, submit review.

**Komponen:** `ListingWizard + ListingTable`. **Interaksi:** Langkah per kategori, draft, preview, submit review.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-02-FE01:** Form hotel berbeda dari kendaraan; error summary menaut ke field kurang; publish bukan toggle bebas mitra.

**AC PTR-02-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-03 Kalender dan tarif

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin memperbarui kalender dan tarif agar stok yang dijual sesuai kondisi operasional.

**Scope produk:** Ubah per tanggal/rentang, bulk update sederhana, stok, stop sell, rate plan, buffer.

**Komponen:** `InventoryCalendar + BulkEditPreview`. **Interaksi:** Resource/date range dan per-field diff; Apply setelah preview.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-03-FE01:** Konflik stok menampilkan sel spesifik; baris sukses/gagal batch jelas tanpa mengulang yang sudah sukses.

**AC PTR-03-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-04 Reservasi

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin memutuskan request serta membaca reservasi agar layanan dapat disiapkan.

**Scope produk:** Detail yang diperlukan, accept/reject request, instruksi layanan, jadwal kedatangan/serah terima.

**Komponen:** `PartnerReservationTable + DecisionDialog`. **Interaksi:** Filter, drawer detail, approve/reject beralasan.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-04-FE01:** Respons conflict akibat staf lain memutuskan menutup dialog lama dan memuat ulang status terbaru.

**AC PTR-04-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-05 Status pemenuhan

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin mencatat pemenuhan atau no-show agar fakta layanan dapat direkonsiliasi.

**Scope produk:** Check-in/out, pickup/return, no-show beserta bukti, permintaan pembatalan oleh mitra.

**Komponen:** `ServiceOperationsBoard`. **Interaksi:** Kedatangan/checkout/pickup/return/no-show sesuai kategori.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-05-FE01:** No-show belum eligible tidak aktif dengan alasan; checklist gagal simpan tetap dapat diperbaiki.

**AC PTR-05-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-06 Venue CRM

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin menangani inquiry dan quote agar prospek venue tidak hilang.

**Scope produk:** Antrean inquiry, assignment, respons, penawaran terstruktur/lampiran, masa berlaku, alasan hasil.

**Komponen:** `LeadQueue + QuoteEditor`. **Interaksi:** Assignment PIC, quote lines, expiry dan version diff.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-06-FE01:** Versi lama baca-saja; simpan draft dan kirim penawaran adalah dua tindakan berbeda.

**AC PTR-06-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-07 Customer management

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin membaca data pelanggan terkait usaha sendiri agar dapat melayani tanpa membuka data mitra lain.

**Scope produk:** Kontak dan riwayat pelanggan terkait organisasi sendiri, catatan layanan; tanpa ekspor massal PII secara default.

**Komponen:** `ScopedCustomerDirectory`. **Interaksi:** Kontak masked dan transaksi organisasi sendiri.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-07-FE01:** Switch organisasi mengosongkan data lama sebelum fetch; tabel tidak menampilkan direktori pelanggan global.

**AC PTR-07-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-08 Laporan usaha

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin mencocokkan hak pembayaran dengan statement agar memahami potongan serta payout.

**Scope produk:** Penjualan bruto, pembatalan, komisi/potongan, refund, estimasi hak mitra, payout aktual.

**Komponen:** `PartnerStatement + ExportRequest`. **Interaksi:** Bruto/potongan/hak/payout dibedakan; periode eksplisit.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-08-FE01:** Statement fixture refund setelah payout menampilkan adjustment sebagai baris baru, bukan menghapus payout lama.

**AC PTR-08-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-09 Ulasan

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin membalas dan melaporkan ulasan agar dapat menanggapi masukan secara wajar.

**Scope produk:** Membalas atau melaporkan pelanggaran; tidak mengubah skor/menghapus ulasan sepihak.

**Komponen:** `PartnerReviewInbox`. **Interaksi:** Balas/laporkan dengan pedoman.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-09-FE01:** Tidak ada kontrol edit skor/hapus ulasan; reply gagal mempertahankan draft.

**AC PTR-09-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-10 Staf dan izin

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin mengelola akses staf agar hanya petugas yang tepat dapat bertindak.

**Scope produk:** Owner mengundang staf, membatasi organisasi/listing, mencabut sesi saat akses dinonaktifkan.

**Komponen:** `TeamAccessTable`. **Interaksi:** Undang staf, role, listing assignment dan revoke.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-10-FE01:** Sebelum revoke ada konfirmasi; canManageTeam false menyembunyikan kontrol dan forbidden memuat ulang izin.

**AC PTR-10-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-11 Bantuan

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin mengeskalasi masalah dan memeriksa aktivitas agar dapat menelusuri perubahan.

**Scope produk:** Tiket dengan platform, notifikasi, histori perubahan, eskalasi stok/reservasi.

**Komponen:** `PartnerSupport + ActivityLog`. **Interaksi:** Tiket dan audit baca-saja per organisasi.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-11-FE01:** Detail audit memuat aktor/waktu/resource yang diizinkan, tanpa secret.

**AC PTR-11-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### PTR-12 Keluar/penangguhan

**Kebutuhan pengguna:** Sebagai staf mitra berizin, saya ingin menutup penjualan dengan tertib agar kewajiban reservasi lama tetap terselesaikan.

**Scope produk:** Menutup penjualan baru; booking confirmed dan penyelesaian hak/kewajiban tetap ditangani.

**Komponen:** `PartnerClosurePanel`. **Interaksi:** Close/suspend request dengan daftar kewajiban tersisa.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC PTR-12-FE01:** Konfirmasi menjelaskan booking existing tetap dilayani; tidak menulis semua booking dibatalkan.

**AC PTR-12-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

## 6. Form, field dan validation behavior

Data spesifik modul: organization_id/membership; dokumen/rekening berversi; listing/category/resource; room/unit/space/vehicle; rate plan; calendar version; booking; quote; assignment; financial statement; staff role.

Field wajib memakai label teks; hint unit/tanggal/kapasitas diletakkan sebelum input. Validasi setelah blur atau submit, lalu diperbarui saat koreksi. Saat submit invalid, fokus ke error summary dengan tautan field pertama. Error server mengikat field yang dikenali; error lain tampil pada form summary. Isi valid tetap tersimpan dalam memori form.

Tanggal layanan memakai tanggal lokal dan zona resource. Flight menampilkan zona masing-masing segmen; rental memerlukan jam. Nilai uang dikirim dari input terstruktur/quote, bukan parsing teks Rp. Tampilan IDR menggunakan format lokal, sementara perhitungan final dan pembulatan milik quote backend. Nilai belum tersedia bukan Rp0. Null bagasi/kapasitas/fasilitas tidak boleh disimpulkan tersedia.

Schema per mode menyembunyikan sekaligus mengabaikan field yang tidak berlaku. Field autocomplete wajib memiliki selected ID sebelum submit. Input teks lokasi yang berubah menghapus ID pilihan lama. Usia/jumlah/kapasitas positif mengikuti rule konfigurasi, tidak hardcode kebijakan supplier yang belum disepakati.

## 7. State frontend dan URL

| Jenis state | Penyimpanan | Aturan |
|---|---|---|
| Pencarian/filter/sort/page | URL query bertipe dan tervalidasi | Hanya parameter publik; perubahan filter reset page; Back memulihkan konteks |
| Popover, dialog, fokus, draft filter mobile | State komponen | Tidak membuat fetch mahal pada setiap perubahan draft filter |
| Data hasil/detail/status | Query cache melalui adapter | Key mencakup layanan, parameter, locale serta konteks user/org bila privat |
| Form, draft request, pilihan sebelum login | Memori sesi terkontrol | Jangan simpan identitas/dokumen/PII di URL atau localStorage; handoff auth memakai draft ID aman bila tersedia |
| Saved anonim | Storage lokal khusus ID publik | Tanpa token/PII; dapat dihapus dan dideduplikasi saat merge |
| Izin dan action eligibility | Context dari layanan | UI guard hanya kenyamanan; forbidden tetap ditangani dan data privat dibersihkan |

State domain yang perlu ditampilkan: Mitra dan listing memiliki lifecycle terpisah. Sumber stok ditentukan per listing; update manual berizin berlaku pada transaksi baru. Perubahan material melalui review; bantuan admin selalu mencatat aktor platform dan alasan. Multi-property tetap terisolasi per assignment.

Respons terlambat tidak menimpa query terbaru; batalkan request yang tidak relevan atau abaikan dengan request sequence. Switch organisasi/logout membersihkan cache privat dan draft sensitif. Timer expiry memakai server time/expiryAt sebagai acuan, disinkronkan saat tab kembali aktif; timer lokal tidak mengubah status domain menjadi sukses/gagal definitif.

## 8. Data adapter dan kebutuhan kontrak

Operasi adapter usulan: `getPartnerContext, saveBusinessDraft, submitVerification, saveListingDraft, submitListingReview, previewCalendarChange, applyCalendarChange, decideRequest, recordService, sendQuote, getStatement, manageMembership`. Ini adalah interface frontend, bukan instruksi membangun backend atau janji endpoint sudah tersedia. Data yang tidak tersedia harus diminta melalui contract issue, bukan dibuat sebagai fakta oleh komponen.

Envelope minimal: data bertipe, requestId/correlationId, fetchedAt/serverTime, pagination atau cursor untuk list, capabilities untuk tindakan privat, serta version/quoteId/expiryAt pada data yang memerlukannya. Error terstruktur membawa code, message aman, fieldErrors, retryAfter, dan latestVersion bila conflict. Gunakan adapter terpisah antara fixture dan API; komponen tidak mengimpor fixture langsung.

Hanya aksi ringan seperti saved boleh optimistic dengan rollback. Booking, approve/reject, publish, cancellation, refund, payout dan perubahan rekening menunggu hasil authoritative. Respons timeout pada mutation memakai state Hasil belum diketahui dan tindakan Periksa status, bukan auto-retry buta. Idempotency/correlation ID diteruskan jika kontrak backend mendukung; frontend menghindari double-click tetapi tidak menjamin exactly-once sendiri.

## 9. Skenario loading, kosong dan error

| Skenario | Tampilan dan tindakan |
|---|---|
| Initial loading | Skeleton bentuk konten; judul/konteks tetap terlihat; aria-busy pada region |
| Refetch/filter | Pertahankan konteks pencarian; tandai sedang diperbarui; nonaktifkan CTA yang berisiko memakai quote lama |
| Empty valid | Tidak ada hasil/pesanan sesuai filter; Ubah pencarian/Reset filter atau CTA modul yang relevan |
| Provider/offline | Jelaskan gangguan dan Coba lagi; jangan tampilkan seolah tidak ada inventori |
| Validation error | Field error dan summary; draft tidak hilang |
| 401 / sesi berakhir | Login ulang, simpan konteks nonsensitif; clear data privat saat identitas berubah |
| 403 | Tidak punya akses; tidak menampilkan konten lama dari cache |
| 404 / nonaktif | Resource tidak tersedia dengan jalur kembali; jangan menampilkan transaksi akun lain |
| 409 / versi berubah | Ambil state/quote terbaru; tampilkan perubahan sebelum pengguna menyetujui ulang |
| 429 | Hormati retryAfter, countdown yang aksesibel tanpa pengumuman setiap detik |
| Mutation timeout | Hasil belum diketahui; periksa status dengan ID korelasi sebelum mengulang |

Contoh microcopy bersama: “Harga telah berubah. Tinjau rincian terbaru sebelum melanjutkan.”; “Permintaan terkirim. Anda belum memiliki reservasi terkonfirmasi.”; “Status pembayaran sedang diperiksa.” Gunakan hanya pada konteks yang sesuai; flight search-only tidak menampilkan pesan pembayaran.

## 10. Aksesibilitas dan konten

Terapkan shared design contract: heading terurut, landmark, skip link, label permanen, status teks+ikon, dialog focus trap dan restore, combobox keyboard, alternatif kalender input tanggal, serta alternatif daftar untuk peta. Grafik menyediakan ringkasan angka/tabel. Uji pembaca layar pada happy path dan error utama; pemeriksaan otomatis saja belum membuktikan kesesuaian WCAG.

Satu layar memiliki satu CTA utama yang sesuai eligibility. Tindakan berisiko menampilkan konteks resource, dampak, nominal/versi bila relevan, dan konfirmasi. Tidak menggunakan toast sebagai satu-satunya bukti hasil transaksi. Instruksi, label dan harga menggunakan bahasa Indonesia serta unit yang eksplisit.

## 11. Arsitektur frontend dan batas modul

Usulan struktur: route/page sebagai composition, feature components di modul `ptr`, shared UI primitives terpisah dari domain, data adapter dan schema view model di layer contract. Pemilihan framework/package/version mengikuti repository dan keputusan engineering; PRD ini tidak mewajibkan instalasi tertentu.

Shell dan komponen umum dipakai ulang, sedangkan form pencarian, model harga, serta kalender/itinerary spesifik kategori tidak dipaksa menjadi satu komponen penuh conditional. Route privat tidak mengirim data sensitif ke bundle statis. Map, editor besar, PDF viewer dan chart dimuat sesuai kebutuhan; gambar memiliki ukuran/aspect-ratio dan responsive sources agar layout stabil.

## 12. Dependensi dan handoff

Phase 10 verifikasi/publish dan Finance; fondasi organisasi/peran sebelum seluruh produk; Phase 02–07 sebagai konsumen stok dan penghasil request. Dasbor penuh diselesaikan bertahap, bukan ditunggu sampai fase kesembilan.

Keputusan bisnis yang tetap terbuka: D-02, D-03, D-05, D-08, D-14. UX menyediakan screen inventory, wireframe/high-fidelity yang direview, komponen beserta seluruh state dan prototype task. Frontend menyediakan routes, adapter, fixtures, form/state, test dan demo. Backend/platform menyediakan contract dan fakta domain; dalam scope saat ini hanya kebutuhannya yang didokumentasikan. PM mengelola contract issue dan perubahan scope, bukan meminta frontend meniru keberhasilan server.

## 13. Pengukuran dan performa

partner_submitted; listing_submitted; calendar_updated; request_decided; service_completed; statement_viewed. Pantau waktu onboarding, kelengkapan listing, response SLA, stok stale dan pembatalan mitra; Partnership/Operations.

Frontend merekam interaksi seperti view, klik dan submit intent tanpa PII. Event financial/booking confirmed dari layanan tidak diduplikasi sebagai konfirmasi palsu akibat render komponen. Target usulan LCP p75 ≤2,5 detik dan layout stabil diuji menurut shared contract; p95 supplier/gateway bukan jaminan frontend. Ukur route awal dan lazy load pada profil perangkat/jaringan yang dicatat.

## 14. Rencana implementasi dan test frontend

| Tahap | Deliverable | Penerimaan frontend |
|---|---|---|
| A — UX | Screen inventory, alur, wireframe, field rules, state dan prototype | Seluruh ID fitur terpetakan dan task utama dapat diikuti |
| B — UI system | Token, shell, shared primitives, komponen domain | Variants, responsive, keyboard dan copy direview |
| C — route dan adapter | Route, query schema, form, mocks, navigasi | Reload/deep-link/Back, loading/error dan fixture mode berjalan |
| D — integrasi UI | Adapter API bila tersedia, conflict/permission handling | Contract test UI lulus; gap backend dicatat, bukan ditutup mock |
| E — QA dan handoff | Component/integration/E2E UI, screenshot matrix, catatan batas | AC frontend lulus; status integrated terpisah dari demo-ready |

Test minimum: unit schema/URL serialization yang berisiko, component untuk kontrol kompleks, integration untuk stale response/cache clearing, E2E task utama dan kegagalan kritis, visual regression pada breakpoints, keyboard serta screen-reader smoke. Pengujian uang/stok/otorisasi server berada pada tim pemiliknya; frontend hanya memverifikasi respons yang ditampilkan dan kontrol yang dipakai.

## 15. Definition of done dan risiko

Seluruh 12 ID fitur memiliki komponen, state serta AC frontend; seluruh route dapat dibuka langsung; form invalid, timeout dan akses ditolak tertangani; layout mobile/desktop dan keyboard diuji; tidak ada secret/PII pada URL/fixture publik/log; demo mode jelas; kontrak belum tersedia tercatat; tidak ada klaim go-live bila hanya fixture. UI tidak mengubah status domain sendiri. Handoff menyertakan daftar route, fixture scenario, hasil test dan batas integrasi.

Risiko domain dari baseline: Konflik sumber stok: field ownership; data antar-mitra bocor: tenant+assignment; laporan tidak cocok: satu ledger; bulk update salah: preview dan audit. Mitigasi frontend adalah kejelasan status/copy, validasi kenyamanan, view model, recovery serta error handling; kontrol stok, uang dan akses final tetap kebutuhan backend.

## 16. Referensi

[PRD bisnis modul](../PRD_Per_Phase/09_PRD_Phase_09_Partner_Dashboard.md), [PRD General](../PRD_General_Gobuking_MVP_v1.0.md) dan [standar UI/UX bersama](00_Design_System_dan_Kontrak_Frontend.md). Pola kompetitor mengikuti benchmark yang telah didokumentasikan; layar dan komponen di sini adalah rancangan Gobuking yang diusulkan, bukan salinan implementasi internal kompetitor.
