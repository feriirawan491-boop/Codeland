# PRD UI UX dan Frontend Phase 07 Car Rental

| Atribut | Isi |
|---|---|
| Versi dan tanggal | 1.0 — 28 Oktober 2026 |
| Status | Draft desain dan frontend untuk review |
| Fokus | Website responsif, interaksi, komponen, data adapter dan pengujian frontend |
| Acuan bisnis | [PRD Phase 07 Car Rental](../PRD_Per_Phase/07_PRD_Phase_07_Car_Rental.md) |
| Acuan lintas fase | [Design system dan kontrak frontend](00_Design_System_dan_Kontrak_Frontend.md) |
| Indeks | [Paket UI UX dan Frontend](00_Index_UIUX_Frontend.md) |

## 1. Tujuan dan batas pekerjaan

Memesan kendaraan sesuai kelayakan, durasi, wilayah dan kapasitas armada.

Dokumen ini memperinci lapisan UI/UX dan frontend atas baseline bisnis. Hasil yang diminta adalah spesifikasi untuk implementasi; dokumen ini tidak berarti aplikasi atau desain Figma telah dibuat. Phase merupakan paket modul, bukan urutan yang menunda fondasi dashboard sampai paling akhir.

**Aktor:** Penyewa; Rental Operations; pengemudi; CS.

P0 frontend mencakup layar, navigasi, komponen, state, validasi kenyamanan, data adapter, fixture, respons error dan test UI. Kebenaran stok, harga, persetujuan, pembayaran, ownership dan izin tetap berasal dari layanan backend. Implementasi server, database, webhook, supplier booking, dan transfer dana di luar pekerjaan frontend. Backend yang belum tersedia dapat diganti mock di lingkungan demo berlabel; hal itu tidak memenuhi gate produk live.

Batas layanan tetap: Flights pencarian saja, venue inquiry/quote/request, hotel/home/car booking sesuai baseline. **Di luar MVP:** One-way beda area, penagihan overtime otomatis, deposit gateway, telematika, API fleet, instant booking.

## 2. Peta layar dan route usulan

Route merupakan kontrak navigasi frontend usulan, bukan endpoint API final. Route bersama dipakai satu implementasi dengan view model sesuai jenis produk. Slug/ID privat tidak menjadi bukti hak akses.

| Route | Layar | Hierarki konten | CTA utama |
|---|---|---|---|
| `/cars` | Pencarian rental | Mode tabs → city/area → date-time → search | Cari mobil |
| `/cars/results` | Hasil rental | Mode summary → filters → vehicle/package/provider cards | Lihat paket |
| `/cars/:offerId` | Detail rental | Vehicle → duration/area → includes/excludes → eligibility → deposit → total | Ajukan booking |
| `/checkout/car/:draftId` | Request rental | Contact/renter → requirements → pickup → quote → review | Ajukan booking |

## 3. Layout dan perilaku responsive

Desktop: container maksimal 1280 px, gutter 24–32 px. Search/result memakai sidebar filter 280 px dan area hasil fleksibel; detail/checkout memakai konten sekitar dua pertiga dan panel ringkasan sepertiga bila relevan. Tablet: filter menjadi drawer; detail panel turun setelah konten utama. Mobile: satu kolom, gutter 16 px, card stack, satu bulan kalender, sticky CTA berisi total serta tindakan. Sticky action memperhitungkan safe area dan tidak menutup error/fokus.

Breakpoint usulan: compact <768 px, medium 768–1023 px, wide ≥1024 px. Uji minimal 360, 768, 1024 dan 1440 px serta reflow 320 CSS px. Layout merespons ruang konten, bukan nama perangkat. Pada zoom 200–400%, konten utama dapat dioperasikan; tabel/peta dua dimensi memakai region khusus.

## 4. Wireframe struktural

Contoh berikut menetapkan urutan informasi, bukan mockup visual final.

```text
[Header / konteks layanan atau organisasi]
[Mode summary]
[filters]
[vehicle/package/provider cards]
[Feedback status / bantuan kontekstual]
```

Urutan baca mobile mengikuti prioritas yang sama. Komponen tabel dan panel split boleh direstrukturisasi, tetapi status, total, syarat serta CTA tidak boleh kehilangan konteks.

## 5. Spesifikasi frontend per fitur

ID bisnis dipertahankan untuk mapping. AC berakhiran FE adalah kriteria yang dapat diuji pada browser dengan adapter nyata atau fixture terkontrol. AC bisnis yang membutuhkan server tetap menjadi dependensi dan tidak diklaim lolos oleh mock UI.

### CAR-01 Mode layanan

**Kebutuhan pengguna:** Sebagai penyewa, saya ingin memilih layanan dengan atau tanpa pengemudi agar sesuai kebutuhan berkendara.

**Scope produk:** Dengan pengemudi dan tanpa pengemudi; hanya paket yang disediakan mitra yang tampil.

**Komponen:** `RentalModeTabs`. **Interaksi:** Pilih Dengan pengemudi/Tanpa pengemudi; form mengikuti mode.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC CAR-01-FE01:** Switch mode mengosongkan paket tidak kompatibel dan memberi ringkasan ketentuan baru.

**AC CAR-01-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### CAR-02 Search

**Kebutuhan pengguna:** Sebagai penyewa, saya ingin menentukan interval dan lokasi agar durasi serta area layanan tepat.

**Scope produk:** Kota, lokasi ambil/kembali, tanggal/jam mulai-akhir, durasi; MVP kembali pada area yang sama.

**Komponen:** `RentalDateTimeForm`. **Interaksi:** Lokasi, tanggal/jam ambil/kembali dan zona.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC CAR-02-FE01:** Akhir sebelum mulai menampilkan validasi; durasi tampil dari interval dan unit paket dengan label eksplisit.

**AC CAR-02-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### CAR-03 Filter dan hasil

**Kebutuhan pengguna:** Sebagai penyewa, saya ingin membandingkan kapasitas dan harga kendaraan agar sesuai rombongan serta bagasi.

**Scope produk:** Kelas/model kendaraan, transmisi, kursi, bagasi, pengemudi, penyedia, total harga.

**Komponen:** `VehicleResultCard + Filters`. **Interaksi:** Kursi, bagasi, transmisi, penyedia, total dan durasi.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC CAR-03-FE01:** Label tujuh kursi tidak memakai angka kapasitas bagasi; total quote adalah harga utama.

**AC CAR-03-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### CAR-04 Detail paket

**Kebutuhan pengguna:** Sebagai penyewa, saya ingin memahami isi paket dan pengecualian agar biaya pemakaian tidak mengejutkan.

**Scope produk:** Durasi inklusif, area layanan, BBM/tol/parkir, overtime, pengantaran, deposit, ketentuan perlindungan dari mitra.

**Komponen:** `RentalPackageDetails`. **Interaksi:** Durasi 12/24 jam, area, BBM/tol/parkir/overtime.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC CAR-04-FE01:** Membandingkan paket driver vs lepas kunci tetap menunjukkan unit durasi masing-masing.

**AC CAR-04-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### CAR-05 Persyaratan

**Kebutuhan pengguna:** Sebagai penyewa, saya ingin mengetahui syarat kelayakan sebelum bayar agar tidak membayar layanan yang tidak dapat digunakan.

**Scope produk:** Usia/SIM/identitas sesuai kebijakan mitra, batas pengajuan, cara verifikasi, alasan penolakan.

**Komponen:** `RenterRequirementsChecklist`. **Interaksi:** Syarat usia/SIM/identitas dan mekanisme verifikasi; upload jika diminta.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC CAR-05-FE01:** Dokumen invalid tipe/ukuran ditolak client dengan alasan; tidak ada permintaan dokumen default berlebihan.

**AC CAR-05-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### CAR-06 Inventori

**Kebutuhan pengguna:** Sebagai penyewa, saya ingin mendapat kendaraan yang teralokasi agar pesanan tidak bertabrakan dengan maintenance atau penyewa lain.

**Scope produk:** Unit armada internal, kelas kendaraan, blok maintenance, durasi layanan, buffer serah terima.

**Komponen:** `FleetAvailabilityNotice`. **Interaksi:** Pelanggan melihat kelas/availability; unit internal hanya di role mitra.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC CAR-06-FE01:** Mock maintenance/unavailable tidak menampilkan tombol Bayar; tidak membocorkan nomor internal armada.

**AC CAR-06-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### CAR-07 Request dan pembayaran

**Kebutuhan pengguna:** Sebagai penyewa, saya ingin membayar setelah permintaan disetujui agar ada kepastian layanan dari mitra.

**Scope produk:** Mitra memverifikasi kelayakan serta alokasi; pelanggan membayar setelah disetujui dalam batas waktu.

**Komponen:** `RentalRequestCheckout`. **Interaksi:** Ajukan→approval→bayar, total dan deposit terpisah.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC CAR-07-FE01:** Payment expired menampilkan periksa status/ubah pilihan; tidak memperbarui status menjadi confirmed dari timer lokal.

**AC CAR-07-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

### CAR-08 Pemenuhan

**Kebutuhan pengguna:** Sebagai penyewa, saya ingin mengikuti serah terima dan pengembalian agar kondisi serta tanggung jawab tercatat.

**Scope produk:** Assignment kendaraan dan pengemudi, kontak layanan menjelang mulai, checklist serah terima/pengembalian, status selesai.

**Komponen:** `RentalVoucher + HandoverChecklist`. **Interaksi:** Informasi pickup/return dan pengemudi sesuai hak akses; view checklist.

**State dan feedback:** skeleton sesuai geometri saat fetch; isi tervalidasi saat ready; error lokal dengan retry; aksi simpan/submit memiliki pending state dan tidak menghapus draft saat gagal. Untuk view baca, tidak ada mutation saat sekadar membuka komponen.

**AC CAR-08-FE01:** Assignment berubah di mock memicu refresh ringkasan; penggantian di luar setara memunculkan permintaan persetujuan.

**AC CAR-08-FE02:** Saat komponen dijalankan dengan keyboard dan fixture ready/error, fokus tetap terlihat, label serta pesan status terbaca, dan tidak ada aksi penting yang hanya tersedia melalui hover.

## 6. Form, field dan validation behavior

Data spesifik modul: city; pickup/return_area; start/end datetime dan zona; service_mode; vehicle_class/unit; seats/baggage/transmission; package_duration; buffer; driver assignment; eligibility; deposit; item biaya.

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

State domain yang perlu ditampilkan: Request default. Interval kendaraan [start,end) ditambah buffer; stok kelas mengurangi kapasitas terhadap hold dan reservasi. Unit pasti sebelum layanan; driver wajib untuk mode dengan pengemudi. Deposit terpisah di mitra dan tidak menjadi revenue platform.

Respons terlambat tidak menimpa query terbaru; batalkan request yang tidak relevan atau abaikan dengan request sequence. Switch organisasi/logout membersihkan cache privat dan draft sensitif. Timer expiry memakai server time/expiryAt sebagai acuan, disinkronkan saat tab kembali aktif; timer lokal tidak mengubah status domain menjadi sukses/gagal definitif.

## 8. Data adapter dan kebutuhan kontrak

Operasi adapter usulan: `searchRentalOffers, getRentalOffer, getEligibilityRequirements, previewRentalQuote, createRentalRequest, getBookingStatus`. Ini adalah interface frontend, bukan instruksi membangun backend atau janji endpoint sudah tersedia. Data yang tidak tersedia harus diminta melalui contract issue, bukan dibuat sebagai fakta oleh komponen.

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

Usulan struktur: route/page sebagai composition, feature components di modul `car`, shared UI primitives terpisah dari domain, data adapter dan schema view model di layer contract. Pemilihan framework/package/version mengikuti repository dan keputusan engineering; PRD ini tidak mewajibkan instalasi tertentu.

Shell dan komponen umum dipakai ulang, sedangkan form pencarian, model harga, serta kalender/itinerary spesifik kategori tidak dipaksa menjadi satu komponen penuh conditional. Route privat tidak mengirim data sensitif ke bundle statis. Map, editor besar, PDF viewer dan chart dimuat sesuai kebutuhan; gambar memiliki ukuran/aspect-ratio dan responsive sources agar layout stabil.

## 12. Dependensi dan handoff

Phase 09 armada/driver/maintenance, Phase 10 verifikasi/Finance, Phase 08 checkout dan pesanan; kontrak transaksi bersama.

Keputusan bisnis yang tetap terbuka: D-04, D-09, D-11. UX menyediakan screen inventory, wireframe/high-fidelity yang direview, komponen beserta seluruh state dan prototype task. Frontend menyediakan routes, adapter, fixtures, form/state, test dan demo. Backend/platform menyediakan contract dan fakta domain; dalam scope saat ini hanya kebutuhannya yang didokumentasikan. PM mengelola contract issue dan perubahan scope, bukan meminta frontend meniru keberhasilan server.

## 13. Pengukuran dan performa

car_request_submitted; eligibility_decided; car_booking_confirmed; vehicle_assigned; pickup_completed; return_completed. Pantau konflik, pickup gagal, response time dan refund, pemilik Rental Operations.

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

Seluruh 8 ID fitur memiliki komponen, state serta AC frontend; seluruh route dapat dibuka langsung; form invalid, timeout dan akses ditolak tertangani; layout mobile/desktop dan keyboard diuji; tidak ada secret/PII pada URL/fixture publik/log; demo mode jelas; kontrak belum tersedia tercatat; tidak ada klaim go-live bila hanya fixture. UI tidak mengubah status domain sendiri. Handoff menyertakan daftar route, fixture scenario, hasil test dan batas integrasi.

Risiko domain dari baseline: Deposit sengketa: nilai/penerima/syarat terlihat; armada tak cukup: approval mengikat alokasi; driver ganda: validasi interval; biaya tambahan: persetujuan terpisah. Mitigasi frontend adalah kejelasan status/copy, validasi kenyamanan, view model, recovery serta error handling; kontrol stok, uang dan akses final tetap kebutuhan backend.

## 16. Referensi

[PRD bisnis modul](../PRD_Per_Phase/07_PRD_Phase_07_Car_Rental.md), [PRD General](../PRD_General_Gobuking_MVP_v1.0.md) dan [standar UI/UX bersama](00_Design_System_dan_Kontrak_Frontend.md). Pola kompetitor mengikuti benchmark yang telah didokumentasikan; layar dan komponen di sini adalah rancangan Gobuking yang diusulkan, bukan salinan implementasi internal kompetitor.
