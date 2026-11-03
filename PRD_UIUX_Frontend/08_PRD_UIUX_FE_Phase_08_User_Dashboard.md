# PRD UI UX dan Frontend Phase 08 User Dashboard

| Atribut | Isi |
|---|---|
| Versi dan tanggal | 1.0 — 28 Oktober 2026 |
| Status | Draft desain dan frontend untuk review |
| Fokus | Website responsif, interaksi, komponen, data adapter dan pengujian frontend |
| Acuan bisnis | [PRD Phase 08 User Dashboard](../PRD_Per_Phase/08_PRD_Phase_08_User_Dashboard.md) |
| Acuan lintas fase | [Design system dan kontrak frontend](00_Design_System_dan_Kontrak_Frontend.md) |
| Indeks | [Paket UI UX dan Frontend](00_Index_UIUX_Frontend.md) |

## 1. Tujuan dan batas pekerjaan

Memberi pelanggan kontrol atas pesanan dan aktivitas sendiri tanpa harus selalu menghubungi CS.

Dokumen ini memperinci lapisan UI/UX dan frontend atas baseline bisnis. Hasil yang diminta adalah spesifikasi untuk implementasi; dokumen ini tidak berarti aplikasi atau desain Figma telah dibuat. Phase merupakan paket modul, bukan urutan yang menunda fondasi dashboard sampai paling akhir.

**Aktor:** Pelanggan terautentikasi; CS melalui hak platform.

P0 frontend mencakup layar, navigasi, komponen, state, validasi kenyamanan, data adapter, fixture, respons error dan test UI. Kebenaran stok, harga, persetujuan, pembayaran, ownership dan izin tetap berasal dari layanan backend. Implementasi server, database, webhook, supplier booking, dan transfer dana di luar pekerjaan frontend. Backend yang belum tersedia dapat diganti mock di lingkungan demo berlabel; hal itu tidak memenuhi gate produk live.

Batas layanan tetap: Flights pencarian saja, venue inquiry/quote/request, hotel/home/car booking sesuai baseline. **Di luar MVP:** Wallet, saved cards, loyalty, sharing wishlist, riwayat pencarian flight lintas perangkat, reschedule otomatis.

## 2. Peta layar dan route usulan

Route merupakan kontrak navigasi frontend usulan, bukan endpoint API final. Route bersama dipakai satu implementasi dengan view model sesuai jenis produk. Slug/ID privat tidak menjadi bukti hak akses.

| Route | Layar | Hierarki konten | CTA utama |
|---|---|---|---|
| `/account/bookings` | Pesanan | Category/status filters → booking cards → pagination | Lihat detail |
| `/bookings/:bookingId` | Detail pesanan | Status → action panel → service detail → financial timeline → support | Tindakan eligible |
| `/account/history` | Riwayat | Jenis tanggal/periode → status → hasil | Lihat transaksi |
| `/account/inquiries` | Inquiry | Lead cards → quote/version/status | Lihat penawaran |
| `/account/saved` | Tersimpan | Category filters → saved grid → inactive labels | Lihat properti |
| `/account/profile` | Profil | Identity → verified contacts → preferences | Simpan |
| `/account/security` | Keamanan | Sessions → revoke → privacy requests | Cabut sesi |
| `/account/reviews` | Ulasan | Eligible/completed tabs → composer → moderation status | Kirim ulasan |
| `/account/support` | Bantuan | Ticket list → new form → thread | Buat tiket |

## 3. Layout dan perilaku responsive

Desktop: shell dengan sidebar 240 px, topbar 64 px, area kerja fleksibel; ringkasan maksimal empat KPI per baris. Tablet: sidebar collapsed/drawer. Mobile: navigasi drawer dan kartu ringkas untuk antrean; detail terbuka sebagai halaman atau drawer penuh. Tabel keuangan tetap tabel semantik dalam region scroll berlabel, dengan kolom identitas/status utama terlihat dan akses detail untuk seluruh kolom. Tidak menghilangkan angka penting demi layar kecil.

Breakpoint usulan: compact <768 px, medium 768–1023 px, wide ≥1024 px. Uji minimal 360, 768, 1024 dan 1440 px serta reflow 320 CSS px. Layout merespons ruang konten, bukan nama perangkat. Pada zoom 200–400%, konten utama dapat dioperasikan; tabel/peta dua dimensi memakai region khusus.

## 4. Wireframe struktural

Contoh berikut menetapkan urutan informasi, bukan mockup visual final.

```text
[Header / konteks layanan atau organisasi]
[Status]
[action panel]
[service detail]
[financial timeline]
[support]
[Feedback status / bantuan kontekstual]
```

Urutan baca mobile mengikuti prioritas yang sama. Komponen tabel dan panel split boleh direstrukturisasi, tetapi status, total, syarat serta CTA tidak boleh kehilangan konteks.

## 5. Spesifikasi frontend per fitur

ID bisnis dipertahankan untuk mapping. AC berakhiran FE adalah kriteria yang dapat diuji pada browser dengan adapter nyata atau fixture terkontrol. AC bisnis yang membutuhkan server tetap menjadi dependensi dan tidak diklaim lolos oleh mock UI.

### USR-01 Pesanan Saya

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin melihat pesanan aktif per kategori agar tahu layanan yang akan datang.

**Scope produk:** Booking aktif dipisah berdasarkan hotel, home, car; filter status dan jadwal.

**Komponen:** `BookingList + CategoryTabs`. **Interaksi:** Kategori hotel/home/car dan filter status; pagination.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC USR-01-FE01:** Empty state punya CTA cari; Flights search-only tidak muncul sebagai booking.

**AC USR-01-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### USR-02 Detail Pesanan

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin membaca status dan voucher resmi agar memahami tindakan berikutnya.

**Scope produk:** Produk, mitra, data pemesan, harga, timeline, pembayaran, voucher, kebijakan dan bantuan.

**Komponen:** `BookingDetail + StatusTimeline`. **Interaksi:** Ringkasan, tindakan eligible, voucher, payment dan refund.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC USR-02-FE01:** Pada payment pending label Menunggu pembayaran; voucher hanya bila canDownloadVoucher dari adapter true.

**AC USR-02-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### USR-03 Riwayat

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin mencari transaksi terdahulu agar dapat memeriksa riwayat perjalanan.

**Scope produk:** Selesai, batal, ditolak, expired; tanggal layanan dibedakan dari tanggal pemesanan.

**Komponen:** `BookingHistoryFilters`. **Interaksi:** Tanggal booking vs layanan dijelaskan; status terminal.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC USR-03-FE01:** Mengganti tipe tanggal mereset page dan label periode berubah konsisten.

**AC USR-03-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### USR-04 Inquiry dan Penawaran

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin mengakses inquiry dan quote milik sendiri agar tindak lanjut venue mudah.

**Scope produk:** Tracking inquiry venue, versi quote, respons, permintaan booking, tindak lanjut.

**Komponen:** `InquiryInbox + ClaimDialog`. **Interaksi:** Kontak diverifikasi sebelum mengklaim; quote tampil versi.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC USR-04-FE01:** Claim gagal tidak membuka isi inquiry; hanya pesan dan verifikasi ulang.

**AC USR-04-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### USR-05 Properti Tersimpan

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin menyimpan properti agar dapat kembali membandingkannya.

**Scope produk:** Simpan/hapus hotel, home, MICE, wedding; listing nonaktif diberi status, harga diperiksa saat dibuka.

**Komponen:** `SavedPropertiesGrid`. **Interaksi:** Simpan/hapus/merge dengan status listing nonaktif.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC USR-05-FE01:** Suspended listing tetap dapat dihapus dari saved tetapi CTA booking tidak tersedia.

**AC USR-05-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### USR-06 Profil

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin memperbarui kontak terverifikasi agar notifikasi diterima pihak yang benar.

**Scope produk:** Nama, email/telepon terverifikasi, preferensi dasar; perubahan kontak memerlukan verifikasi.

**Komponen:** `ProfileForm + ContactVerification`. **Interaksi:** Edit nama/preferensi; email baru status menunggu verifikasi.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC USR-06-FE01:** Email lama tetap label Terverifikasi sampai adapter menyatakan perpindahan selesai.

**AC USR-06-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### USR-07 Pembatalan dan Refund

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin melihat biaya pembatalan dan progres refund agar mengetahui hak serta uang yang belum kembali.

**Scope produk:** Estimasi biaya, persetujuan pembatalan, alasan, tracking refund.

**Komponen:** `CancellationPreview + RefundTracker`. **Interaksi:** Preview nominal/biaya/versi lalu konfirmasi terpisah.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC USR-07-FE01:** Perubahan refund preview saat confirm menuntut review ulang; tidak menampilkan sukses uang kembali sebelum status succeeded.

**AC USR-07-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### USR-08 Ulasan Saya

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin menulis ulasan atas layanan eligible agar pengalaman dapat membantu pengguna lain.

**Scope produk:** Tulis ulasan atas transaksi eligible, lihat status moderasi dan balasan.

**Komponen:** `ReviewComposer`. **Interaksi:** Rating radio 1–10, subskor opsional dan teks.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC USR-08-FE01:** Rating bisa dipilih keyboard; eligibility false menampilkan alasan bukan form aktif.

**AC USR-08-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### USR-09 Keamanan dan Privasi

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin mencabut sesi dan mengajukan permintaan data agar dapat mengendalikan akses akun.

**Scope produk:** Kelola sesi, logout, kanal permintaan akses/koreksi/penghapusan data sesuai kebijakan retensi.

**Komponen:** `SessionList + PrivacyRequest`. **Interaksi:** Revoke sesi dan tiket akses/koreksi/hapus data.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC USR-09-FE01:** Logout menghapus cache privat; URL lama memunculkan login dan tidak menampilkan data pengguna sebelumnya.

**AC USR-09-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### USR-10 Bantuan

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin mengirim tiket terkait transaksi agar masalah ditangani dengan konteks lengkap.

**Scope produk:** Tiket terkait transaksi/inquiry, lampiran aman, timeline dan respons CS.

**Komponen:** `SupportTicketForm + Thread`. **Interaksi:** Pilih booking/inquiry, pesan, file dan timeline.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC USR-10-FE01:** Upload gagal tidak menghapus isi pesan; retry tidak menghasilkan dua tiket pada fixture idempotent.

**AC USR-10-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

## 6. Form, field dan validation behavior

Data spesifik modul: account_id dari sesi; booking_id; status dan timeline; payment/refund terpisah; inquiry_claim_token; saved_listing_id; verified_contact; review eligibility; ticket_id; lampiran privat.

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

State domain yang perlu ditampilkan: Akses server selalu memeriksa ownership. Form login tidak menghilangkan konteks checkout. Pembatalan mengikuti izin/status dan kebijakan transaksi, bukan default terbaru. Session expiry meminta login ulang tanpa membocorkan detail.

Respons terlambat tidak menimpa query terbaru; batalkan request yang tidak relevan atau abaikan dengan request sequence. Switch organisasi/logout membersihkan cache privat dan draft sensitif. Timer expiry memakai server time/expiryAt sebagai acuan, disinkronkan saat tab kembali aktif; timer lokal tidak mengubah status domain menjadi sukses/gagal definitif.

## 8. Data adapter dan kebutuhan kontrak

Operasi adapter usulan: `getMyBookings, getMyBooking, claimInquiry, listSaved, updateProfile, previewCancellation, requestCancellation, listSessions, revokeSession, submitReview, createSupportTicket`. Ini adalah interface frontend, bukan instruksi membangun backend atau janji endpoint sudah tersedia. Data yang tidak tersedia harus diminta melalui contract issue, bukan dibuat sebagai fakta oleh komponen.

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

Usulan struktur: route/page sebagai composition, feature components di modul `usr`, shared UI primitives terpisah dari domain, data adapter dan schema view model di layer contract. Pemilihan framework/package/version mengikuti repository dan keputusan engineering; PRD ini tidak mewajibkan instalasi tertentu.

Shell dan komponen umum dipakai ulang, sedangkan form pencarian, model harga, serta kalender/itinerary spesifik kategori tidak dipaksa menjadi satu komponen penuh conditional. Route privat tidak mengirim data sensitif ke bundle statis. Map, editor besar, PDF viewer dan chart dimuat sesuai kebutuhan; gambar memiliki ukuran/aspect-ratio dan responsive sources agar layout stabil.

## 12. Dependensi dan handoff

Kontrak identitas dan ownership dibuat pada fondasi; data dari Phase 02–07, tiket dari Phase 10. Tidak membangun ledger kedua untuk dashboard.

Keputusan bisnis yang tetap terbuka: D-04, D-09, D-12, D-15. UX menyediakan screen inventory, wireframe/high-fidelity yang direview, komponen beserta seluruh state dan prototype task. Frontend menyediakan routes, adapter, fixtures, form/state, test dan demo. Backend/platform menyediakan contract dan fakta domain; dalam scope saat ini hanya kebutuhannya yang didokumentasikan. PM mengelola contract issue dan perubahan scope, bukan meminta frontend meniru keberhasilan server.

## 13. Pengukuran dan performa

dashboard_viewed; voucher_downloaded; cancellation_requested; inquiry_claimed; saved_listing_changed; support_created. Self-service completion = aksi eligible selesai tanpa CS ÷ aksi eligible dimulai; pemilik Product/CS.

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

Seluruh 10 ID fitur memiliki komponen, state serta AC frontend; seluruh route dapat dibuka langsung; form invalid, timeout dan akses ditolak tertangani; layout mobile/desktop dan keyboard diuji; tidak ada secret/PII pada URL/fixture publik/log; demo mode jelas; kontrak belum tersedia tercatat; tidak ada klaim go-live bila hanya fixture. UI tidak mengubah status domain sendiri. Handoff menyertakan daftar route, fixture scenario, hasil test dan batas integrasi.

Risiko domain dari baseline: IDOR: cek ownership; salah klaim email: verifikasi; status keuangan menyesatkan: pisahkan objek; kehilangan konteks OTP: simpan draft aman. Mitigasi frontend adalah kejelasan status/copy, validasi kenyamanan, view model, recovery serta error handling; kontrol stok, uang dan akses final tetap kebutuhan backend.

## 16. Referensi

[PRD bisnis modul](../PRD_Per_Phase/08_PRD_Phase_08_User_Dashboard.md), [PRD General](../PRD_General_Gobuking_MVP_v1.0.md) dan [standar UI/UX bersama](00_Design_System_dan_Kontrak_Frontend.md). Pola kompetitor mengikuti benchmark yang telah didokumentasikan; layar dan komponen di sini adalah rancangan Gobuking yang diusulkan, bukan salinan implementasi internal kompetitor.
