# PRD UI UX dan Frontend Phase 02 Hotel

| Atribut | Isi |
|---|---|
| Versi dan tanggal | 1.0 — 28 Oktober 2026 |
| Status | Draft desain dan frontend untuk review |
| Fokus | Website responsif, interaksi, komponen, data adapter dan pengujian frontend |
| Acuan bisnis | [PRD Phase 02 Hotel](../PRD_Per_Phase/02_PRD_Phase_02_Hotel.md) |
| Acuan lintas fase | [Design system dan kontrak frontend](00_Design_System_dan_Kontrak_Frontend.md) |
| Indeks | [Paket UI UX dan Frontend](00_Index_UIUX_Frontend.md) |

## 1. Tujuan dan batas pekerjaan

Memesan kamar dengan harga dan ketersediaan yang konsisten sampai konfirmasi.

Dokumen ini memperinci lapisan UI/UX dan frontend atas baseline bisnis. Hasil yang diminta adalah spesifikasi untuk implementasi; dokumen ini tidak berarti aplikasi atau desain Figma telah dibuat. Phase merupakan paket modul, bukan urutan yang menunda fondasi dashboard sampai paling akhir.

**Aktor:** Pengunjung; pelanggan; Partner Operations; CS.

P0 frontend mencakup layar, navigasi, komponen, state, validasi kenyamanan, data adapter, fixture, respons error dan test UI. Kebenaran stok, harga, persetujuan, pembayaran, ownership dan izin tetap berasal dari layanan backend. Implementasi server, database, webhook, supplier booking, dan transfer dana di luar pekerjaan frontend. Backend yang belum tersedia dapat diganti mock di lingkungan demo berlabel; hal itu tidak memenuhi gate produk live.

Batas layanan tetap: Flights pencarian saja, venue inquiry/quote/request, hotel/home/car booking sesuai baseline. **Di luar MVP:** Campuran tipe kamar dalam satu order, bayar di properti, bayar nanti, channel manager produksi, reschedule otomatis.

## 2. Peta layar dan route usulan

Route merupakan kontrak navigasi frontend usulan, bukan endpoint API final. Route bersama dipakai satu implementasi dengan view model sesuai jenis produk. Slug/ID privat tidak menjadi bukti hak akses.

| Route | Layar | Hierarki konten | CTA utama |
|---|---|---|---|
| `/hotels` | Hasil hotel | Search summary → toolbar → filter kiri + result list kanan → pagination | Lihat kamar |
| `/hotels/:slug` | Detail hotel | Judul/skor → galeri → anchor → overview → kamar/tarif → fasilitas → ulasan → aturan | Pilih kamar |
| `/checkout/hotel/:draftId` | Checkout hotel | Stepper → kontak/tamu kiri + ringkasan harga kanan → consent → tindakan | Bayar / Ajukan booking |
| `/bookings/:bookingId` | Status hotel | Status banner → timeline → produk → price breakdown → voucher/bantuan | Lihat status |

## 3. Layout dan perilaku responsive

Desktop: container maksimal 1280 px, gutter 24–32 px. Search/result memakai sidebar filter 280 px dan area hasil fleksibel; detail/checkout memakai konten sekitar dua pertiga dan panel ringkasan sepertiga bila relevan. Tablet: filter menjadi drawer; detail panel turun setelah konten utama. Mobile: satu kolom, gutter 16 px, card stack, satu bulan kalender, sticky CTA berisi total serta tindakan. Sticky action memperhitungkan safe area dan tidak menutup error/fokus.

Breakpoint usulan: compact <768 px, medium 768–1023 px, wide ≥1024 px. Uji minimal 360, 768, 1024 dan 1440 px serta reflow 320 CSS px. Layout merespons ruang konten, bukan nama perangkat. Pada zoom 200–400%, konten utama dapat dioperasikan; tabel/peta dua dimensi memakai region khusus.

## 4. Wireframe struktural

Contoh berikut menetapkan urutan informasi, bukan mockup visual final.

```text
[Header / konteks layanan atau organisasi]
[Judul/skor]
[galeri]
[anchor]
[overview]
[kamar/tarif]
[fasilitas]
[ulasan]
[aturan]
[Feedback status / bantuan kontekstual]
```

Urutan baca mobile mengikuti prioritas yang sama. Komponen tabel dan panel split boleh direstrukturisasi, tetapi status, total, syarat serta CTA tidak boleh kehilangan konteks.

## 5. Spesifikasi frontend per fitur

ID bisnis dipertahankan untuk mapping. AC berakhiran FE adalah kriteria yang dapat diuji pada browser dengan adapter nyata atau fixture terkontrol. AC bisnis yang membutuhkan server tetap menjadi dependensi dan tidak diklaim lolos oleh mock UI.

### HTL-01 Search

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin mencari kamar sesuai tanggal dan komposisi tamu agar pilihan dapat menampung rombongan.

**Scope produk:** Destinasi/properti, check-in/out, dewasa, anak beserta usia, jumlah kamar; checkout setelah check-in.

**Komponen:** `StaySearchForm`. **Interaksi:** Tanggal range, guest stepper dan usia anak; ringkasan collapsed setelah search.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC HTL-01-FE01:** Checkout sebelum check-in menampilkan error field dan fokus ke tanggal tanpa menghapus tamu.

**AC HTL-01-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### HTL-02 Filter dan sort

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin menyaring dan mengurutkan berdasarkan total biaya agar perbandingan adil.

**Scope produk:** Harga total, skor ulasan, bintang, fasilitas, tipe properti, sarapan, kebijakan batal; sort harga/skor/relevansi dasar.

**Komponen:** `FilterSidebar + SortSelect`. **Interaksi:** Desktop filter langsung; mobile draft filter dengan Terapkan/Reset.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC HTL-02-FE01:** Mengubah filter mereset page ke 1; browser Back memulihkan filter dan scroll hasil sebelumnya.

**AC HTL-02-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### HTL-03 Listing cards

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin melihat ringkasan hotel agar dapat memilih detail yang relevan.

**Scope produk:** Foto, nama, area/jarak berlabel, kelas bintang bila valid, skor dan jumlah ulasan, total harga, kebijakan utama.

**Komponen:** `HotelResultCard`. **Interaksi:** Area foto, identitas, fasilitas utama, skor, total biaya, CTA detail.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC HTL-03-FE01:** Fixture tanpa review menampilkan Belum ada ulasan dan tidak mengubah bintang menjadi skor.

**AC HTL-03-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### HTL-04 Peta

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin membandingkan lokasi dan harga di peta agar sesuai kebutuhan perjalanan.

**Scope produk:** Pin harga dan kartu tersinkron pada dataset/filter yang sama; list tetap berfungsi bila peta gagal.

**Komponen:** `ResultsMapPanel`. **Interaksi:** Toggle daftar/peta; pin terpilih menyorot kartu berdasar listingId.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC HTL-04-FE01:** Memilih pin mengaktifkan kartu tepat; provider gagal menampilkan fallback daftar dan tombol Coba lagi.

**AC HTL-04-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### HTL-05 Detail properti

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin membaca fasilitas dan aturan hotel agar mengetahui kondisi menginap.

**Scope produk:** Galeri, deskripsi, lokasi, fasilitas, aturan anak, check-in/out, aksesibilitas yang dinyatakan mitra.

**Komponen:** `HotelDetail + PhotoGallery`. **Interaksi:** Anchor overview/kamar/fasilitas/ulasan/aturan; sticky CTA menuju kamar.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC HTL-05-FE01:** Sticky bar tidak menutup judul anchor; galeri modal dapat ditutup dan fokus kembali ke thumbnail.

**AC HTL-05-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### HTL-06 Kamar dan rate plan

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin memilih kamar dan ketentuan tarif agar memahami manfaat serta risiko pembatalan.

**Scope produk:** Kapasitas, tempat tidur, fasilitas, pilihan makan, pembatalan, harga, stok dan jumlah kamar per pilihan.

**Komponen:** `RoomRateTable`. **Interaksi:** Desktop tabel kamar/tarif; mobile kelompok kartu; quantity per pilihan.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC HTL-06-FE01:** Hanya satu roomType/ratePlan dapat aktif; memilih tarif lain meminta mengganti pilihan dan ringkasan total ikut diperbarui dari quote.

**AC HTL-06-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### HTL-07 Validasi ketersediaan

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin memeriksa seluruh malam menginap agar kamar benar-benar tersedia.

**Scope produk:** Periksa semua malam, okupansi, stok bersama antar-rate-plan, dan stop sell sebelum membuat hold.

**Komponen:** `AvailabilityFeedback`. **Interaksi:** Tampilkan pemeriksaan ulang, stock conflict dan perubahan quote.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC HTL-07-FE01:** Saat fixture conflict, tombol lanjut berhenti dan tampil Ubah tanggal tanpa halaman sukses.

**AC HTL-07-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### HTL-08 Metode booking

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin mengetahui mode konfirmasi agar memahami kapan booking menjadi pasti.

**Scope produk:** Mode instant hanya untuk inventori terjamin; properti lain memakai request-to-book.

**Komponen:** `BookingModeSummary + CheckoutShell`. **Interaksi:** Instant menuju payment intent; request memakai Ajukan booking dan status menunggu.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC HTL-08-FE01:** Setelah request accepted di fixture, UI baru menawarkan bayar; pending_partner tidak menampilkan Bayar.

**AC HTL-08-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### HTL-09 Ulasan

**Kebutuhan pengguna:** Sebagai pelanggan, saya ingin membaca ulasan tamu agar dapat menilai pengalaman sebelumnya.

**Scope produk:** Skor 1–10, jumlah, teks, kategori opsional, sortir; bintang properti terpisah dari skor tamu.

**Komponen:** `ReviewList + RatingSummary`. **Interaksi:** Skor keseluruhan terpisah bintang; urutan review dikontrol.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC HTL-09-FE01:** Mengganti urutan review menampilkan loading lokal dan tidak mereset pilihan kamar.

**AC HTL-09-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

## 6. Form, field dan validation behavior

Data spesifik modul: destinasi wajib; check_in < check_out; jumlah kamar/dewasa positif; usia setiap anak; room_type_id; rate_plan_id; quantity; harga per malam; pajak/biaya; kebijakan snapshot; inventory_resource_id.

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

State domain yang perlu ditampilkan: Gunakan lifecycle booking pada kontrak bersama. Tanggal malam memakai [check-in, check-out); malam check-out tidak dihitung. Jumlah kamar mengonsumsi stok pada setiap malam. Permintaan khusus tidak menjamin pemenuhan.

Respons terlambat tidak menimpa query terbaru; batalkan request yang tidak relevan atau abaikan dengan request sequence. Switch organisasi/logout membersihkan cache privat dan draft sensitif. Timer expiry memakai server time/expiryAt sebagai acuan, disinkronkan saat tab kembali aktif; timer lokal tidak mengubah status domain menjadi sukses/gagal definitif.

## 8. Data adapter dan kebutuhan kontrak

Operasi adapter usulan: `searchHotels, getHotel, getRoomRates, previewBooking, createBookingRequest, startPayment, getBookingStatus, listReviews`. Ini adalah interface frontend, bukan instruksi membangun backend atau janji endpoint sudah tersedia. Data yang tidak tersedia harus diminta melalui contract issue, bukan dibuat sebagai fakta oleh komponen.

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

Usulan struktur: route/page sebagai composition, feature components di modul `htl`, shared UI primitives terpisah dari domain, data adapter dan schema view model di layer contract. Pemilihan framework/package/version mengikuti repository dan keputusan engineering; PRD ini tidak mewajibkan instalasi tertentu.

Shell dan komponen umum dipakai ulang, sedangkan form pencarian, model harga, serta kalender/itinerary spesifik kategori tidak dipaksa menjadi satu komponen penuh conditional. Route privat tidak mengirim data sensitif ke bundle statis. Map, editor besar, PDF viewer dan chart dimuat sesuai kebutuhan; gambar memiliki ukuran/aspect-ratio dan responsive sources agar layout stabil.

## 12. Dependensi dan handoff

Phase 09 mengelola kamar/rate plan/stok; Phase 10 publish dan Finance; Phase 08 identitas/pesanan. Booking bersama BKG-01–14 wajib sudah siap sebelum transaksi.

Keputusan bisnis yang tetap terbuka: D-03, D-04, D-05, D-08, D-09. UX menyediakan screen inventory, wireframe/high-fidelity yang direview, komponen beserta seluruh state dan prototype task. Frontend menyediakan routes, adapter, fixtures, form/state, test dan demo. Backend/platform menyediakan contract dan fakta domain; dalam scope saat ini hanya kebutuhannya yang didokumentasikan. PM mengelola contract issue dan perubahan scope, bukan meminta frontend meniru keberhasilan server.

## 13. Pengukuran dan performa

search_submitted; listing_viewed; rate_selected; checkout_started; booking_confirmed. Conversion = confirmed dan paid ÷ checkout unik per cohort; overbooking dilaporkan terpisah, pemilik Product/Operations.

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

Seluruh 9 ID fitur memiliki komponen, state serta AC frontend; seluruh route dapat dibuka langsung; form invalid, timeout dan akses ditolak tertangani; layout mobile/desktop dan keyboard diuji; tidak ada secret/PII pada URL/fixture publik/log; demo mode jelas; kontrak belum tersedia tercatat; tidak ada klaim go-live bila hanya fixture. UI tidak mengubah status domain sendiri. Handoff menyertakan daftar route, fixture scenario, hasil test dan batas integrasi.

Risiko domain dari baseline: Overbooking lintas kanal: alokasi khusus/request; harga berubah: recheck dan persetujuan ulang; klaim fasilitas tidak sesuai: moderasi dan tiket dengan bukti. Mitigasi frontend adalah kejelasan status/copy, validasi kenyamanan, view model, recovery serta error handling; kontrol stok, uang dan akses final tetap kebutuhan backend.

## 16. Referensi

[PRD bisnis modul](../PRD_Per_Phase/02_PRD_Phase_02_Hotel.md), [PRD General](../PRD_General_Gobuking_MVP_v1.0.md) dan [standar UI/UX bersama](00_Design_System_dan_Kontrak_Frontend.md). Pola kompetitor mengikuti benchmark yang telah didokumentasikan; layar dan komponen di sini adalah rancangan Gobuking yang diusulkan, bukan salinan implementasi internal kompetitor.
