# PRD Phase 03 Home Rental

| Atribut | Baseline |
|---|---|
| Versi dan tanggal | 1.0 — 28 Oktober 2026 |
| Status | Draft spesifik untuk review; bukan persetujuan komersial |
| Produk | Gobuking MVP |
| Prioritas | Seluruh requirement P0 kecuali bagian lanjutan |
| Acuan | [PRD General v1.0](../PRD_General_Gobuking_MVP_v1.0.md) |
| Kontrol bersama | [Kontrak lintas fase](00_Kontrak_Lintas_Phase.md) |
| Rencana fase | [Indeks dan dependency plan](00_Index_Phase.md) |

## 1. Outcome dan batas fase

Menyewakan satu hunian penuh dengan kalender unit dan aturan rumah yang jelas.

Phase 03 adalah nomor paket scope sesuai urutan permintaan pengguna, bukan urutan pembangunan yang mengharuskan semua fase sebelumnya selesai. Kapabilitas fondasi yang disebut pada dependensi harus tersedia sebelum pilot. Dokumen ini menurunkan baseline general; pilihan yang masih usulan tidak berubah menjadi keputusan final hanya karena diperinci.

**Aktor:** Pengunjung; pelanggan; host/pengelola; CS.

**Di luar P0:** Private/shared room, sewa tahunan, sewa rumah induk dan kamar bersamaan, co-host lanjutan, iCal serta sewa bulanan.

## 2. Navigasi dan layar

1. Pencarian.
2. Daftar/peta.
3. Detail hunian.
4. Kalender.
5. Aturan rumah.
6. Request/checkout.
7. Instruksi kedatangan.
8. Ulasan.

Pada mobile, filter/rincian dapat memakai panel tetapi field wajib, status, dan CTA utama tetap terbaca. URL dan state mempertahankan konteks saat kembali; layar privat tidak diindeks. Loading, kosong, error, tidak berizin, serta resource tidak aktif memiliki tampilan terpisah.

## 3. Perjalanan utama

1. Cari unit penuh.
2. Baca fasilitas dan aturan.
3. Pilih tanggal/tamu.
4. Login dan ajukan request.
5. Mitra verifikasi kalender.
6. Approval dan bayar.
7. Voucher serta instruksi check-in.
8. Selesai dan ulasan.

## 4. Spesifikasi fitur dan acceptance criteria

Setiap ID mempertahankan keterlacakan ke PRD General. Skenario acceptance berikut wajib dilengkapi happy path, validasi field, dan kontrol akses pada QA. Tidak ada penghilangan P0 melalui penyembunyian tombol saja.

### HMR-01 Search dan filter

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin mencari hunian sesuai jumlah tamu dan ruang agar rombongan nyaman.
- **Perilaku produk:** Destinasi, tanggal, tamu, harga, kamar tidur, tempat tidur, kamar mandi, dapur, kolam, parkir, aturan relevan.
- **Acceptance HMR-01-AC01:** Dengan hunian kapasitas enam tamu, ketika pencarian tujuh tamu, unit tidak muncul sebagai tersedia dan checkout langsung juga ditolak.

### HMR-02 Model unit

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin mengetahui ruang yang disewa agar tidak mengira kamar sebagai seluruh rumah.
- **Perilaku produk:** MVP menyewakan rumah/villa/apartemen satu unit penuh; tipe privasi dijelaskan eksplisit.
- **Acceptance HMR-02-AC01:** Dengan seluruh villa disewakan, ketika detail dibuka, label seluruh unit jelas; form mitra menolak konfigurasi kamar individual aktif pada resource sama.

### HMR-03 Detail hunian

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin membaca konfigurasi dan aturan hunian agar sesuai kebutuhan menginap.
- **Perilaku produk:** Galeri, fasilitas, konfigurasi ruang, kapasitas maksimal, aturan rumah, check-in, biaya kebersihan jika ada.
- **Acceptance HMR-03-AC01:** Dengan biaya kebersihan tetap per kunjungan, ketika durasi berubah dari dua menjadi tiga malam, biaya itu tidak ikut dikalikan jumlah malam.

### HMR-04 Kalender

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin memilih tanggal yang memenuhi kalender dan buffer agar request dapat dilayani.
- **Perilaku produk:** Unit tersedia/tidak tersedia per malam, minimum menginap, lead time, buffer pembersihan, blok pemilik.
- **Acceptance HMR-04-AC01:** Dengan check-out tanggal 10 dan buffer satu malam, ketika tamu lain meminta check-in tanggal 10, tanggal itu tidak tersedia; perubahan buffer tidak membatalkan confirmed lama.

### HMR-05 Pengelola dan lokasi

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin mengetahui pengelola dan area lokasi agar yakin sebelum memesan.
- **Perilaku produk:** Nama pengelola/mitra, status verifikasi yang akurat, area perkiraan publik; alamat rinci sesuai kebijakan akses.
- **Acceptance HMR-05-AC01:** Dengan sesi anonim, ketika listing dibuka, lokasi mengikuti kebijakan publik dan data alamat privat tidak bocor dalam respons tersembunyi.

### HMR-06 Booking

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin mengajukan pemesanan dengan proses persetujuan yang jelas agar tidak salah menganggap confirmed.
- **Perilaku produk:** Request-to-book default; instant dapat diaktifkan setelah verifikasi keandalan inventori.
- **Acceptance HMR-06-AC01:** Dengan unit terdaftar juga pada Hotel, ketika request menahan unit di Home Rental, stok Hotel pada resource sama ikut berkurang.

### HMR-07 Harga dan kebijakan

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin melihat biaya keseluruhan dan deposit agar dapat menyiapkan anggaran.
- **Perilaku produk:** Total menginap, biaya wajib, biaya tambahan yang dipilih, deposit terpisah, kebijakan batal.
- **Acceptance HMR-07-AC01:** Dengan deposit terpisah, ketika checkout dibuka, nilai dan penerima deposit tampil terpisah dari total bayar gateway; tidak dicatat sebagai revenue platform.

### HMR-08 Ulasan dan simpan

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin menyimpan hunian dan membaca ulasan agar dapat membandingkan pilihan.
- **Perilaku produk:** Ulasan terverifikasi dan saved properties menggunakan kapabilitas bersama.
- **Acceptance HMR-08-AC01:** Dengan saved lokal lalu login, ketika sinkronisasi, unit yang sama hanya muncul sekali; ulasan mengikuti eligibility kontrak bersama.

## 5. Data dan validasi

Data minimum spesifik modul: home_unit_id; tipe hunian; kategori privasi entire-unit; jumlah kamar tidur/tempat tidur/kamar mandi; kapasitas; check_in/out; buffer; minimum_malam; lead_time; cleaning_fee; aturan rumah; pengelola; lokasi publik dan alamat privat.

Field wajib dibedakan dari opsional pada form. Validasi dilakukan di client untuk kenyamanan dan di server sebagai otoritas. ID resource harus valid dan berstatus sesuai tindakan; harga/status dari browser tidak dipercaya. Jika suatu field hanya berlaku pada mode tertentu, field tersebut tidak diwajibkan pada mode lain. File privat mengikuti kontrol akses dan batas tipe/ukuran yang disepakati, bukan URL publik permanen.

Snapshot transaksi/penawaran memuat konteks saat persetujuan. Perubahan master data tidak mengubah transaksi lama. Detail kontrak data dan format error diturunkan ke SRS/API setelah review engineering; field konseptual di sini bukan skema database final.

## 6. Status dan aturan khusus

Request default; instant hanya setelah verifikasi sumber stok. Kalender unit tunggal bebas overlap dan menghormati blok pemilik serta buffer. Aturan rumah serta biaya disimpan pada booking snapshot.

Perubahan tersimpan memiliki ID, waktu, aktor dan jejak audit sesuai tingkat risikonya. Kontrak bersama mengatur booking, hold, payment, refund, payout dan inquiry. Halaman konfirmasi wajib menggunakan status otoritatif. Input invalid tidak membuang draft; resource berubah/tidak aktif saat submit diperiksa ulang sebelum tindakan dijalankan.

## 7. Dependensi dan ownership

Phase 09 kalender unit, Phase 10 verifikasi host/publish, Phase 08 akun. Berbagi booking/payment dengan Hotel tanpa menggandakan inventori.

Product Owner menyetujui scope serta kebijakan. BA menjaga mapping ID dan keputusan; UX memvalidasi prototipe; Engineering menetapkan kontrak dan keandalan; QA menyediakan bukti AC; Operations/Finance/mitra memvalidasi proses yang menjadi kewenangannya. Owner implementasi teknis final mengikuti penugasan proyek, bukan diasumsikan sudah tersedia.

## 8. Notifikasi, error dan akses

Notifikasi transaksi dikirim setelah fakta backend tersimpan. Tidak mengirim status confirmed untuk request atau quote. Gagal kirim email tidak membatalkan fakta transaksi; retry aman dan delivery log diperlukan. Inquiry/booking/payment/payout menggunakan jenis pesan berbeda; penerbangan search-only tidak memicu email konfirmasi tiket.

Server memeriksa hak akses per objek dan konteks sesi. Pengunjung hanya membaca data publik; pelanggan hanya aktivitas sendiri; mitra dibatasi organisasi dan assignment; admin dibatasi role. Error tidak menampilkan data organisasi lain, dokumen privat, token, atau rincian pembayaran sensitif.

## 9. Pengukuran keberhasilan

home_detail_viewed; house_rules_viewed; request_submitted; partner_decided; booking_confirmed. Acceptance rate = approved ÷ request valid; response time dan pembatalan host dipantau Operations.

Event tidak memuat dokumen identitas, email lengkap atau secret. Event keuangan bersumber dari backend dengan deduplikasi. Target angka bisnis ditetapkan setelah pilot; target teknis mengikuti NFR general dan profil uji yang disepakati.

## 10. Paket delivery fase

| Increment | Hasil | Bukti keluar |
|---|---|---|
| A — desain dan kontrak | Prototipe layar, field, permission, state dan keputusan relevan | Review Product/BA/UX dan kontrak antar-modul |
| B — jalur utama | Fitur P0 menggunakan data staging terkontrol dan integrasi sandbox yang relevan | Demo lintas aktor sampai outcome modul |
| C — pengecualian dan kontrol | Validasi, akses, retry, konkurensi dan audit sesuai relevansi | AC dan failure path lulus, defect kritis ditutup |
| D — pilot | Data nyata, operator terlatih, alert dan SOP tersedia | UAT pengguna/mitra/platform dan gate produksi |

Tidak ada durasi atau biaya yang dianggap disepakati. Estimasi dilakukan per fitur setelah provider, kebijakan dan kapasitas tim diketahui. Fitur shared dihitung sekali oleh owner platform dan direferensikan modul konsumennya.

## 11. UAT dan definition of done

- Jalankan seluruh acceptance pada bagian 4 dengan identitas dan data pilot yang relevan.
- Uji mobile 360 px dan desktop, keyboard/fokus, input invalid, back navigation, loading, kosong dan gangguan provider.
- Untuk tindakan privat, uji akses ID objek milik akun/organisasi lain melalui request langsung, bukan hanya menu UI.
- Untuk perubahan stok/uang, uji request ulang, dua aktor bersamaan, expiry, event terlambat dan rekonsiliasi.
- Angka dashboard dan notifikasi harus cocok dengan fakta sumber; tidak ada dummy di lingkungan pelanggan.
- Bukti QA, UAT, runbook, migrasi data relevan dan monitoring disertakan; tidak ada defect kritis uang, inventori atau akses terbuka.

Fase selesai secara produk setelah Product Owner dan pemilik operasional terkait menerima hasil. Go-live uang nyata tetap mengikuti gate lintas fase, bukan hanya demo UI.

## 12. Risiko dan keputusan terbuka

Alamat privat bocor: pisahkan field akses; overlap villa/kamar: satu sumber inventori; host lambat: SLA, expiry hold, dan eskalasi.

Keputusan general yang memengaruhi fase: **D-04, D-08, D-09, D-10**. Rinciannya pada decision log PRD General. Sampai diputuskan, gunakan baseline untuk estimasi dan sandbox; jangan mengaktifkan kebijakan keuangan/kontrak yang belum disetujui. Risiko provider dicatat sebagai blocker dengan PIC, bukan diam-diam mengurangi scope.

## 13. Pengembangan setelah MVP

Daftar lanjutan: Private/shared room, sewa tahunan, sewa rumah induk dan kamar bersamaan, co-host lanjutan, iCal serta sewa bulanan. Perubahan menjadi P0 memerlukan dampak terhadap UX, data, kontrak mitra, integrasi, UAT, biaya dan jadwal. Tidak ada janji bahwa semua kapabilitas tersebut tersedia hanya karena arsitektur disebut siap integrasi.

## 14. Referensi

Acuan langsung adalah PRD General v1.0 beserta sumber resmi pada bagian 25. Dokumen ini menyatakan rancangan Gobuking, bukan kebijakan atau arsitektur internal kompetitor. [Kembali ke indeks](00_Index_Phase.md).
