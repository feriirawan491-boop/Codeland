# PRD UI UX dan Frontend Phase 10 Super Admin

| Atribut | Isi |
|---|---|
| Versi dan tanggal | 1.0 — 28 Oktober 2026 |
| Status | Draft desain dan frontend untuk review |
| Fokus | Website responsif, interaksi, komponen, data adapter dan pengujian frontend |
| Acuan bisnis | [PRD Phase 10 Super Admin](../PRD_Per_Phase/10_PRD_Phase_10_Super_Admin.md) |
| Acuan lintas fase | [Design system dan kontrak frontend](00_Design_System_dan_Kontrak_Frontend.md) |
| Indeks | [Paket UI UX dan Frontend](00_Index_UIUX_Frontend.md) |

## 1. Tujuan dan batas pekerjaan

Mengendalikan kualitas mitra, transaksi, layanan pelanggan dan keuangan dengan pemisahan kewenangan.

Dokumen ini memperinci lapisan UI/UX dan frontend atas baseline bisnis. Hasil yang diminta adalah spesifikasi untuk implementasi; dokumen ini tidak berarti aplikasi atau desain Figma telah dibuat. Phase merupakan paket modul, bukan urutan yang menunda fondasi dashboard sampai paling akhir.

**Aktor:** Content/Partnership; Operations/CS; Finance Maker/Checker; Super Admin.

P0 frontend mencakup layar, navigasi, komponen, state, validasi kenyamanan, data adapter, fixture, respons error dan test UI. Kebenaran stok, harga, persetujuan, pembayaran, ownership dan izin tetap berasal dari layanan backend. Implementasi server, database, webhook, supplier booking, dan transfer dana di luar pekerjaan frontend. Backend yang belum tersedia dapat diganti mock di lingkungan demo berlabel; hal itu tidak memenuhi gate produk live.

Batas layanan tetap: Flights pencarian saja, venue inquiry/quote/request, hotel/home/car booking sesuai baseline. **Di luar MVP:** ERP penuh, akuntansi pajak otomatis, payout API, fraud ML, A/B testing platform, otomatisasi tiket flight.

## 2. Peta layar dan route usulan

Route merupakan kontrak navigasi frontend usulan, bukan endpoint API final. Route bersama dipakai satu implementasi dengan view model sesuai jenis produk. Slug/ID privat tidak menjadi bukti hak akses.

| Route | Layar | Hierarki konten | CTA utama |
|---|---|---|---|
| `/admin` | Ringkasan | Global filters → KPIs → aged exceptions → queues | Tinjau kasus |
| `/admin/partners` | Verifikasi mitra | Queue → evidence/checklist → decision | Tinjau pengajuan |
| `/admin/catalog` | Moderasi listing | Queue → content preview → diff/resource mapping → decision | Moderasi |
| `/admin/reservations` | Reservasi | Filters → table → timeline/exception drawer | Tinjau transaksi |
| `/admin/venue-crm` | Venue CRM | SLA filters → owner queue → quote/request detail | Assign PIC |
| `/admin/customers` | Pelanggan | Limited profile → transactions/cases → account action | Buka kasus |
| `/admin/payments` | Pembayaran | Gateway facts → mismatch → refund preview/review | Tinjau refund |
| `/admin/settlements` | Settlement | Eligible/held → batch preview → approval → transfer proof | Tinjau batch |
| `/admin/support` | Dukungan | Queue → case workspace → internal/customer notes | Tindak lanjuti |
| `/admin/cms` | CMS dan promo | Draft → preview/schedule → policy/discount fields → publish | Publish |
| `/admin/reports` | Laporan | Date type/zone → metrics → detail table → export | Ekspor |
| `/admin/settings` | Pengaturan | Config version → before/after → effective date → review | Ajukan perubahan |
| `/admin/moderation` | Konten dan ulasan | Report context → policy → decision history | Putuskan |
| `/admin/integrations` | Integrasi | Provider health → last checked → sanitized event log | Periksa status |
| `/admin/access` | Akses dan audit | Staff/roles → permissions → audit explorer | Kelola akses |

## 3. Layout dan perilaku responsive

Desktop: shell dengan sidebar 240 px, topbar 64 px, area kerja fleksibel; ringkasan maksimal empat KPI per baris. Tablet: sidebar collapsed/drawer. Mobile: navigasi drawer dan kartu ringkas untuk antrean; detail terbuka sebagai halaman atau drawer penuh. Tabel keuangan tetap tabel semantik dalam region scroll berlabel, dengan kolom identitas/status utama terlihat dan akses detail untuk seluruh kolom. Tidak menghilangkan angka penting demi layar kecil.

Breakpoint usulan: compact <768 px, medium 768–1023 px, wide ≥1024 px. Uji minimal 360, 768, 1024 dan 1440 px serta reflow 320 CSS px. Layout merespons ruang konten, bukan nama perangkat. Pada zoom 200–400%, konten utama dapat dioperasikan; tabel/peta dua dimensi memakai region khusus.

## 4. Wireframe struktural

Contoh berikut menetapkan urutan informasi, bukan mockup visual final.

```text
[Header / konteks layanan atau organisasi]
[Queue]
[evidence/checklist]
[decision]
[Feedback status / bantuan kontekstual]
```

Urutan baca mobile mengikuti prioritas yang sama. Komponen tabel dan panel split boleh direstrukturisasi, tetapi status, total, syarat serta CTA tidak boleh kehilangan konteks.

## 5. Spesifikasi frontend per fitur

ID bisnis dipertahankan untuk mapping. AC berakhiran FE adalah kriteria yang dapat diuji pada browser dengan adapter nyata atau fixture terkontrol. AC bisnis yang membutuhkan server tetap menjadi dependensi dan tidak diklaim lolos oleh mock UI.

### ADM-01 Verifikasi mitra

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin memverifikasi mitra agar hanya usaha yang memenuhi syarat dapat bertransaksi.

**Scope produk:** Review dokumen, PIC, rekening, kontrak, approve/reject/revision dan alasan.

**Komponen:** `VerificationQueue + EvidenceViewer`. **Interaksi:** Dokumen terbatas, checklist, alasan approve/reject/revision.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-01-FE01:** Rekening/kontrak kurang menghasilkan blocker checklist; approve pending tidak optimistically menampilkan approved.

**AC ADM-01-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-02 Moderasi listing

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin meninjau listing agar katalog publik akurat dan tidak menggandakan inventori.

**Scope produk:** Kelengkapan kategori, duplikasi, foto, lokasi, kebijakan, kapasitas; publish/suspend dengan audit.

**Komponen:** `ListingModerationWorkspace`. **Interaksi:** Konten preview, resource mapping dan keputusan beralasan.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-02-FE01:** Duplicate resource warning fixture ditampilkan sebelum publish; foto privat tidak dipreview sebagai foto publik.

**AC ADM-02-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-03 Kontrol reservasi

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin menelusuri booking dan pengecualian agar pelanggan mendapat penyelesaian yang benar.

**Scope produk:** Search lintas layanan, detail/timeline, pengecualian, pembatalan, no-show, tindakan koreksi berizin.

**Komponen:** `ReservationExceptionQueue`. **Interaksi:** Severity, age, owner, timeline dan action drawer.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-03-FE01:** Payment succeeded+booking exception menampilkan dua badge berbeda dan tindakan review bukan voucher sukses.

**AC ADM-03-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-04 Venue CRM

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin mengawasi SLA venue agar prospek memiliki PIC serta tindak lanjut.

**Scope produk:** SLA, overdue queue, PIC, penawaran, permintaan booking dan hasil tindak lanjut.

**Komponen:** `VenueSLAQueue`. **Interaksi:** Overdue/PIC/quote/request dengan filter.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-04-FE01:** Assignment baru tidak mengubah tampilan waktu masuk/aging dari data sumber.

**AC ADM-04-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-05 Pembayaran dan refund

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin merekonsiliasi pembayaran dan refund agar uang masuk serta keluar dapat dibuktikan.

**Scope produk:** Rekonsiliasi gateway, selisih, approval refund, retry aman dan bukti hasil.

**Komponen:** `PaymentReconciliation + RefundDialog`. **Interaksi:** Fakta gateway, selisih, sisa refundable dan review.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-05-FE01:** Input melebihi sisa menampilkan error; respons pending tetap pending setelah menutup dialog.

**AC ADM-05-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-06 Payout

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin mengelola payout dengan pemeriksa terpisah agar hak mitra dibayar tepat sekali.

**Scope produk:** Hitung eligibility, tahan item sengketa, buat batch, persetujuan berbeda aktor, catat transfer dan retry.

**Komponen:** `PayoutBatchWorkspace`. **Interaksi:** Preview item, maker/checker, approval, bukti transfer dan status.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-06-FE01:** Maker sendiri melihat Tidak dapat menyetujui batch sendiri; klik dua kali tidak menghasilkan dua request aktif.

**AC ADM-06-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-07 Customer support

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin menangani tiket dan relokasi agar kegagalan layanan terselesaikan.

**Scope produk:** Tiket, lampiran, riwayat, eskalasi, overbooking/relokasi, alasan penyelesaian.

**Komponen:** `SupportCaseWorkspace`. **Interaksi:** Kasus, prioritas, owner, catatan, lampiran dan opsi solusi.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-07-FE01:** Catatan internal diberi label dan tidak masuk preview pesan pelanggan.

**AC ADM-07-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-08 CMS dan promo

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin mengelola CMS serta promo agar informasi publik tepat periode dan dasar harga.

**Scope produk:** Banner, destinasi, konten bantuan/kebijakan, SEO, promo dasar per listing/periode.

**Komponen:** `CMSEditor + PromotionScheduler`. **Interaksi:** Preview, schedule, dasar diskon/penanggung dan publish.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-08-FE01:** Periode tidak valid memblok submit; preview draft memakai label agar tidak dianggap publik.

**AC ADM-08-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-09 Revenue reports

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin membaca metrik keuangan terpisah agar GMV tidak dianggap pendapatan platform.

**Scope produk:** GMV, penjualan bersih pembatalan/refund, estimasi komisi, hak mitra, biaya, payout, piutang/kewajiban terkait.

**Komponen:** `RevenueDashboard + ReportFilters`. **Interaksi:** Metrik terpisah, jenis tanggal/zona/periode dan ekspor.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-09-FE01:** Fixture GMV 1 juta/komisi 150 ribu menampilkan angka pada kartu yang tepat; pipeline bukan revenue.

**AC ADM-09-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-10 Konfigurasi

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin mengubah konfigurasi secara berversi agar dampak kebijakan dapat ditelusuri.

**Scope produk:** Peran, SLA, cut-off, kebijakan default, master data, feature flags per kategori.

**Komponen:** `PlatformSettings + PolicyDiff`. **Interaksi:** Before/after, effective date dan konfirmasi perubahan.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-10-FE01:** Unsaved changes guard aktif; sukses memakai versi baru dari adapter bukan menulis ulang booking lama.

**AC ADM-10-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-11 Ulasan dan risiko

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin memoderasi konten berdasarkan pedoman agar penilaian tidak bias terhadap ulasan negatif.

**Scope produk:** Antrean moderasi, alasan keputusan, laporan penyalahgunaan, pembatasan akun/listing.

**Komponen:** `ContentModerationQueue`. **Interaksi:** Konten asli, alasan laporan, pedoman dan decision history.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-11-FE01:** Ulasan negatif tanpa pelanggaran dapat dipertahankan; alasan keputusan wajib sebelum submit.

**AC ADM-11-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### ADM-12 Audit dan integrasi

**Kebutuhan pengguna:** Sebagai staf platform berizin, saya ingin memantau integrasi serta audit agar kegagalan dapat ditangani tanpa membocorkan data sensitif.

**Scope produk:** Log tindakan, pengiriman notifikasi, kesehatan konektor, exception queue tanpa membocorkan secret.

**Komponen:** `IntegrationHealth + AuditExplorer`. **Interaksi:** Status konektor, last check, correlation ID dan log sanitized.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC ADM-12-FE01:** Token pada fixture tersanitasi tidak dapat disalin; replay membutuhkan capability dan konfirmasi berizin.

**AC ADM-12-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

## 6. Form, field dan validation behavior

Data spesifik modul: role scope; verification evidence; contract/commission version; listing review; booking timeline; gateway event; refund; settlement item/batch; case owner; CMS schedule; audit correlation.

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

State domain yang perlu ditampilkan: Finance maker/checker terpisah termasuk saat akun Super Admin. Akses darurat dicatat dan tidak menghapus kewajiban approval keuangan. Koreksi uang memakai bukti serta adjustment, bukan edit transaksi historis. Suspend tidak menghapus confirmed dan payable.

Respons terlambat tidak menimpa query terbaru; batalkan request yang tidak relevan atau abaikan dengan request sequence. Switch organisasi/logout membersihkan cache privat dan draft sensitif. Timer expiry memakai server time/expiryAt sebagai acuan, disinkronkan saat tab kembali aktif; timer lokal tidak mengubah status domain menjadi sukses/gagal definitif.

## 8. Data adapter dan kebutuhan kontrak

Operasi adapter usulan: `getPlatformContext, decideVerification, decideListingReview, listExceptions, assignCase, previewRefund, submitRefundReview, previewPayoutBatch, approvePayoutBatch, recordTransferEvidence, publishCMS, getReports, updatePolicy, listAudit`. Ini adalah interface frontend, bukan instruksi membangun backend atau janji endpoint sudah tersedia. Data yang tidak tersedia harus diminta melalui contract issue, bukan dibuat sebagai fakta oleh komponen.

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

Usulan struktur: route/page sebagai composition, feature components di modul `adm`, shared UI primitives terpisah dari domain, data adapter dan schema view model di layer contract. Pemilihan framework/package/version mengikuti repository dan keputusan engineering; PRD ini tidak mewajibkan instalasi tertentu.

Shell dan komponen umum dipakai ulang, sedangkan form pencarian, model harga, serta kalender/itinerary spesifik kategori tidak dipaksa menjadi satu komponen penuh conditional. Route privat tidak mengirim data sensitif ke bundle statis. Map, editor besar, PDF viewer dan chart dimuat sesuai kebutuhan; gambar memiliki ukuran/aspect-ratio dan responsive sources agar layout stabil.

## 12. Dependensi dan handoff

Fondasi identitas organisasi, event pembayaran dan financial entries; dukungan dasar disiapkan sebelum layanan menerima transaksi. Seluruh Phase 01–09 terhubung setelah modul aktif.

Keputusan bisnis yang tetap terbuka: D-03, D-05, D-06, D-07, D-09, D-13, D-15. UX menyediakan screen inventory, wireframe/high-fidelity yang direview, komponen beserta seluruh state dan prototype task. Frontend menyediakan routes, adapter, fixtures, form/state, test dan demo. Backend/platform menyediakan contract dan fakta domain; dalam scope saat ini hanya kebutuhannya yang didokumentasikan. PM mengelola contract issue dan perubahan scope, bukan meminta frontend meniru keberhasilan server.

## 13. Pengukuran dan performa

partner_verified; listing_moderated; reconciliation_case_created; refund_approved; payout_recorded; integration_failed. Pantau outstanding, SLA kasus, mismatch aged dan payout gagal; Finance/Operations.

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

Risiko domain dari baseline: Payout ganda: item unik dan rekonsiliasi; penyalahgunaan akses: segregation dan audit; laporan palsu: satu sumber financial entries; restore: cek ulang status gateway sebelum replay. Mitigasi frontend adalah kejelasan status/copy, validasi kenyamanan, view model, recovery serta error handling; kontrol stok, uang dan akses final tetap kebutuhan backend.

## 16. Referensi

[PRD bisnis modul](../PRD_Per_Phase/10_PRD_Phase_10_Super_Admin.md), [PRD General](../PRD_General_Gobuking_MVP_v1.0.md) dan [standar UI/UX bersama](00_Design_System_dan_Kontrak_Frontend.md). Pola kompetitor mengikuti benchmark yang telah didokumentasikan; layar dan komponen di sini adalah rancangan Gobuking yang diusulkan, bukan salinan implementasi internal kompetitor.
