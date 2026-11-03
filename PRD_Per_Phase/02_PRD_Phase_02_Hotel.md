# PRD Phase 02 Hotel

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

Memesan kamar dengan harga dan ketersediaan yang konsisten sampai konfirmasi.

Phase 02 adalah nomor paket scope sesuai urutan permintaan pengguna, bukan urutan pembangunan yang mengharuskan semua fase sebelumnya selesai. Kapabilitas fondasi yang disebut pada dependensi harus tersedia sebelum pilot. Dokumen ini menurunkan baseline general; pilihan yang masih usulan tidak berubah menjadi keputusan final hanya karena diperinci.

**Aktor:** Pengunjung; pelanggan; Partner Operations; CS.

**Di luar P0:** Campuran tipe kamar dalam satu order, bayar di properti, bayar nanti, channel manager produksi, reschedule otomatis.

## 2. Navigasi dan layar

1. Pencarian.
2. Hasil dan filter.
3. Peta.
4. Detail hotel.
5. Kamar dan tarif.
6. Checkout.
7. Pembayaran.
8. Konfirmasi.
9. Ulasan.

Pada mobile, filter/rincian dapat memakai panel tetapi field wajib, status, dan CTA utama tetap terbaca. URL dan state mempertahankan konteks saat kembali; layar privat tidak diindeks. Loading, kosong, error, tidak berizin, serta resource tidak aktif memiliki tampilan terpisah.

## 3. Perjalanan utama

1. Cari hotel.
2. Filter dan bandingkan.
3. Pilih satu tipe kamar/rate plan dan jumlah.
4. Login saat checkout.
5. Isi tamu.
6. Recheck harga/stok dan hold.
7. Bayar untuk instant atau tunggu approval request.
8. Terima voucher.
9. Check-in/out dan ulasan.

## 4. Spesifikasi fitur dan acceptance criteria

Setiap ID mempertahankan keterlacakan ke PRD General. Skenario acceptance berikut wajib dilengkapi happy path, validasi field, dan kontrol akses pada QA. Tidak ada penghilangan P0 melalui penyembunyian tombol saja.

### HTL-01 Search

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin mencari kamar sesuai tanggal dan komposisi tamu agar pilihan dapat menampung rombongan.
- **Perilaku produk:** Destinasi/properti, check-in/out, dewasa, anak beserta usia, jumlah kamar; checkout setelah check-in.
- **Acceptance HTL-01-AC01:** Dengan dua anak tetapi hanya satu usia terisi, ketika search dikirim, validasi menunjuk anak yang belum memiliki usia dan input lain tetap tersimpan.

### HTL-02 Filter dan sort

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin menyaring dan mengurutkan berdasarkan total biaya agar perbandingan adil.
- **Perilaku produk:** Harga total, skor ulasan, bintang, fasilitas, tipe properti, sarapan, kebijakan batal; sort harga/skor/relevansi dasar.
- **Acceptance HTL-02-AC01:** Dengan dua hotel memiliki pajak berbeda, ketika sort harga terendah, urutan memakai total seluruh masa menginap sesuai konteks, bukan harga dasar malam pertama.

### HTL-03 Listing cards

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin melihat ringkasan hotel agar dapat memilih detail yang relevan.
- **Perilaku produk:** Foto, nama, area/jarak berlabel, kelas bintang bila valid, skor dan jumlah ulasan, total harga, kebijakan utama.
- **Acceptance HTL-03-AC01:** Dengan hotel tanpa ulasan, ketika card ditampilkan, tampil Belum ada ulasan; kelas bintang tidak digunakan sebagai skor tamu.

### HTL-04 Peta

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin membandingkan lokasi dan harga di peta agar sesuai kebutuhan perjalanan.
- **Perilaku produk:** Pin harga dan kartu tersinkron pada dataset/filter yang sama; list tetap berfungsi bila peta gagal.
- **Acceptance HTL-04-AC01:** Dengan filter bebas batal aktif, ketika peta dibuka, pin hanya berasal dari hasil yang lolos filter; gagal provider peta tetap menyisakan daftar.

### HTL-05 Detail properti

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin membaca fasilitas dan aturan hotel agar mengetahui kondisi menginap.
- **Perilaku produk:** Galeri, deskripsi, lokasi, fasilitas, aturan anak, check-in/out, aksesibilitas yang dinyatakan mitra.
- **Acceptance HTL-05-AC01:** Dengan hotel memiliki jam check-in berbeda, ketika membuka detail, aturan lokasi tersebut tampil dan tidak digantikan default situs.

### HTL-06 Kamar dan rate plan

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin memilih kamar dan ketentuan tarif agar memahami manfaat serta risiko pembatalan.
- **Perilaku produk:** Kapasitas, tempat tidur, fasilitas, pilihan makan, pembatalan, harga, stok dan jumlah kamar per pilihan.
- **Acceptance HTL-06-AC01:** Dengan stok lima kamar dan dua rate plan, ketika masing-masing dipilih oleh pelanggan berbeda, total hold/confirmed tidak boleh melampaui lima.

### HTL-07 Validasi ketersediaan

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin memeriksa seluruh malam menginap agar kamar benar-benar tersedia.
- **Perilaku produk:** Periksa semua malam, okupansi, stok bersama antar-rate-plan, dan stop sell sebelum membuat hold.
- **Acceptance HTL-07-AC01:** Dengan stok nol pada malam kedua dari tiga malam, ketika checkout dimulai, booking tidak diteruskan dan tanggal alternatif dapat dicari.

### HTL-08 Metode booking

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin mengetahui mode konfirmasi agar memahami kapan booking menjadi pasti.
- **Perilaku produk:** Mode instant hanya untuk inventori terjamin; properti lain memakai request-to-book.
- **Acceptance HTL-08-AC01:** Dengan mode request, ketika permintaan disubmit, status pending_partner dan tidak ada tagihan; approval baru membuka jendela bayar.

### HTL-09 Ulasan

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin membaca ulasan tamu agar dapat menilai pengalaman sebelumnya.
- **Perilaku produk:** Skor 1–10, jumlah, teks, kategori opsional, sortir; bintang properti terpisah dari skor tamu.
- **Acceptance HTL-09-AC01:** Dengan booking belum completed, ketika mencoba menulis ulasan lewat request langsung, ditolak; completed eligible hanya dapat satu ulasan.

## 5. Data dan validasi

Data minimum spesifik modul: destinasi wajib; check_in < check_out; jumlah kamar/dewasa positif; usia setiap anak; room_type_id; rate_plan_id; quantity; harga per malam; pajak/biaya; kebijakan snapshot; inventory_resource_id.

Field wajib dibedakan dari opsional pada form. Validasi dilakukan di client untuk kenyamanan dan di server sebagai otoritas. ID resource harus valid dan berstatus sesuai tindakan; harga/status dari browser tidak dipercaya. Jika suatu field hanya berlaku pada mode tertentu, field tersebut tidak diwajibkan pada mode lain. File privat mengikuti kontrol akses dan batas tipe/ukuran yang disepakati, bukan URL publik permanen.

Snapshot transaksi/penawaran memuat konteks saat persetujuan. Perubahan master data tidak mengubah transaksi lama. Detail kontrak data dan format error diturunkan ke SRS/API setelah review engineering; field konseptual di sini bukan skema database final.

## 6. Status dan aturan khusus

Gunakan lifecycle booking pada kontrak bersama. Tanggal malam memakai [check-in, check-out); malam check-out tidak dihitung. Jumlah kamar mengonsumsi stok pada setiap malam. Permintaan khusus tidak menjamin pemenuhan.

Perubahan tersimpan memiliki ID, waktu, aktor dan jejak audit sesuai tingkat risikonya. Kontrak bersama mengatur booking, hold, payment, refund, payout dan inquiry. Halaman konfirmasi wajib menggunakan status otoritatif. Input invalid tidak membuang draft; resource berubah/tidak aktif saat submit diperiksa ulang sebelum tindakan dijalankan.

## 7. Dependensi dan ownership

Phase 09 mengelola kamar/rate plan/stok; Phase 10 publish dan Finance; Phase 08 identitas/pesanan. Booking bersama BKG-01–14 wajib sudah siap sebelum transaksi.

Product Owner menyetujui scope serta kebijakan. BA menjaga mapping ID dan keputusan; UX memvalidasi prototipe; Engineering menetapkan kontrak dan keandalan; QA menyediakan bukti AC; Operations/Finance/mitra memvalidasi proses yang menjadi kewenangannya. Owner implementasi teknis final mengikuti penugasan proyek, bukan diasumsikan sudah tersedia.

## 8. Notifikasi, error dan akses

Notifikasi transaksi dikirim setelah fakta backend tersimpan. Tidak mengirim status confirmed untuk request atau quote. Gagal kirim email tidak membatalkan fakta transaksi; retry aman dan delivery log diperlukan. Inquiry/booking/payment/payout menggunakan jenis pesan berbeda; penerbangan search-only tidak memicu email konfirmasi tiket.

Server memeriksa hak akses per objek dan konteks sesi. Pengunjung hanya membaca data publik; pelanggan hanya aktivitas sendiri; mitra dibatasi organisasi dan assignment; admin dibatasi role. Error tidak menampilkan data organisasi lain, dokumen privat, token, atau rincian pembayaran sensitif.

## 9. Pengukuran keberhasilan

search_submitted; listing_viewed; rate_selected; checkout_started; booking_confirmed. Conversion = confirmed dan paid ÷ checkout unik per cohort; overbooking dilaporkan terpisah, pemilik Product/Operations.

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

Overbooking lintas kanal: alokasi khusus/request; harga berubah: recheck dan persetujuan ulang; klaim fasilitas tidak sesuai: moderasi dan tiket dengan bukti.

Keputusan general yang memengaruhi fase: **D-03, D-04, D-05, D-08, D-09**. Rinciannya pada decision log PRD General. Sampai diputuskan, gunakan baseline untuk estimasi dan sandbox; jangan mengaktifkan kebijakan keuangan/kontrak yang belum disetujui. Risiko provider dicatat sebagai blocker dengan PIC, bukan diam-diam mengurangi scope.

## 13. Pengembangan setelah MVP

Daftar lanjutan: Campuran tipe kamar dalam satu order, bayar di properti, bayar nanti, channel manager produksi, reschedule otomatis. Perubahan menjadi P0 memerlukan dampak terhadap UX, data, kontrak mitra, integrasi, UAT, biaya dan jadwal. Tidak ada janji bahwa semua kapabilitas tersebut tersedia hanya karena arsitektur disebut siap integrasi.

## 14. Referensi

Acuan langsung adalah PRD General v1.0 beserta sumber resmi pada bagian 25. Dokumen ini menyatakan rancangan Gobuking, bukan kebijakan atau arsitektur internal kompetitor. [Kembali ke indeks](00_Index_Phase.md).
