# PRD Phase 07 Car Rental

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

Memesan kendaraan sesuai kelayakan, durasi, wilayah dan kapasitas armada.

Phase 07 adalah nomor paket scope sesuai urutan permintaan pengguna, bukan urutan pembangunan yang mengharuskan semua fase sebelumnya selesai. Kapabilitas fondasi yang disebut pada dependensi harus tersedia sebelum pilot. Dokumen ini menurunkan baseline general; pilihan yang masih usulan tidak berubah menjadi keputusan final hanya karena diperinci.

**Aktor:** Penyewa; Rental Operations; pengemudi; CS.

**Di luar P0:** One-way beda area, penagihan overtime otomatis, deposit gateway, telematika, API fleet, instant booking.

## 2. Navigasi dan layar

1. Dengan/tanpa pengemudi.
2. Search.
3. Hasil/filter.
4. Detail paket/syarat.
5. Booking request.
6. Pembayaran.
7. Voucher.
8. Pickup/return.

Pada mobile, filter/rincian dapat memakai panel tetapi field wajib, status, dan CTA utama tetap terbaca. URL dan state mempertahankan konteks saat kembali; layar privat tidak diindeks. Loading, kosong, error, tidak berizin, serta resource tidak aktif memiliki tampilan terpisah.

## 3. Perjalanan utama

1. Pilih mode dan jadwal.
2. Baca syarat serta total.
3. Login dan ajukan.
4. Mitra verifikasi kelayakan/alokasi.
5. Approval.
6. Bayar.
7. Terima voucher.
8. Pickup dan checklist.
9. Return dan penyelesaian.

## 4. Spesifikasi fitur dan acceptance criteria

Setiap ID mempertahankan keterlacakan ke PRD General. Skenario acceptance berikut wajib dilengkapi happy path, validasi field, dan kontrol akses pada QA. Tidak ada penghilangan P0 melalui penyembunyian tombol saja.

### CAR-01 Mode layanan

- **Prioritas:** P0.
- **User story:** Sebagai penyewa, saya ingin memilih layanan dengan atau tanpa pengemudi agar sesuai kebutuhan berkendara.
- **Perilaku produk:** Dengan pengemudi dan tanpa pengemudi; hanya paket yang disediakan mitra yang tampil.
- **Acceptance CAR-01-AC01:** Dengan mitra hanya menyediakan lepas kunci, ketika filter dengan driver aktif, produknya tidak tampil sebagai tersedia.

### CAR-02 Search

- **Prioritas:** P0.
- **User story:** Sebagai penyewa, saya ingin menentukan interval dan lokasi agar durasi serta area layanan tepat.
- **Perilaku produk:** Kota, lokasi ambil/kembali, tanggal/jam mulai-akhir, durasi; MVP kembali pada area yang sama.
- **Acceptance CAR-02-AC01:** Dengan waktu kembali sebelum mulai atau area berbeda, ketika submit, validasi menolak; interval 25 jam lepas kunci ditagih menurut aturan pembulatan paket yang ditampilkan.

### CAR-03 Filter dan hasil

- **Prioritas:** P0.
- **User story:** Sebagai penyewa, saya ingin membandingkan kapasitas dan harga kendaraan agar sesuai rombongan serta bagasi.
- **Perilaku produk:** Kelas/model kendaraan, transmisi, kursi, bagasi, pengemudi, penyedia, total harga.
- **Acceptance CAR-03-AC01:** Dengan filter tujuh kursi, ketika card dibuka, kapasitas penumpang dan bagasi tampil terpisah; harga merupakan total durasi.

### CAR-04 Detail paket

- **Prioritas:** P0.
- **User story:** Sebagai penyewa, saya ingin memahami isi paket dan pengecualian agar biaya pemakaian tidak mengejutkan.
- **Perilaku produk:** Durasi inklusif, area layanan, BBM/tol/parkir, overtime, pengantaran, deposit, ketentuan perlindungan dari mitra.
- **Acceptance CAR-04-AC01:** Dengan paket driver 12 jam, ketika dibandingkan dengan lepas kunci 24 jam, durasi dan komponen BBM/tol berbeda secara eksplisit.

### CAR-05 Persyaratan

- **Prioritas:** P0.
- **User story:** Sebagai penyewa, saya ingin mengetahui syarat kelayakan sebelum bayar agar tidak membayar layanan yang tidak dapat digunakan.
- **Perilaku produk:** Usia/SIM/identitas sesuai kebijakan mitra, batas pengajuan, cara verifikasi, alasan penolakan.
- **Acceptance CAR-05-AC01:** Dengan syarat penyewa tidak terpenuhi, ketika mitra menolak request, tidak ada tagihan dan alasan yang aman diterima pelanggan.

### CAR-06 Inventori

- **Prioritas:** P0.
- **User story:** Sebagai penyewa, saya ingin mendapat kendaraan yang teralokasi agar pesanan tidak bertabrakan dengan maintenance atau penyewa lain.
- **Perilaku produk:** Unit armada internal, kelas kendaraan, blok maintenance, durasi layanan, buffer serah terima.
- **Acceptance CAR-06-AC01:** Dengan unit maintenance atau overlap buffer, ketika approval dicoba, alokasi ditolak; assignment driver juga diperiksa konflik waktunya.

### CAR-07 Request dan pembayaran

- **Prioritas:** P0.
- **User story:** Sebagai penyewa, saya ingin membayar setelah permintaan disetujui agar ada kepastian layanan dari mitra.
- **Perilaku produk:** Mitra memverifikasi kelayakan serta alokasi; pelanggan membayar setelah disetujui dalam batas waktu.
- **Acceptance CAR-07-AC01:** Dengan approval valid tetapi pembayaran kedaluwarsa, ketika mencoba bayar tautan lama, status diperiksa ulang dan tidak mengonfirmasi unit yang telah dilepas.

### CAR-08 Pemenuhan

- **Prioritas:** P0.
- **User story:** Sebagai penyewa, saya ingin mengikuti serah terima dan pengembalian agar kondisi serta tanggung jawab tercatat.
- **Perilaku produk:** Assignment kendaraan dan pengemudi, kontak layanan menjelang mulai, checklist serah terima/pengembalian, status selesai.
- **Acceptance CAR-08-AC01:** Dengan kendaraan diganti di luar ketentuan atau setara, ketika assignment diubah, diperlukan persetujuan pelanggan; return checklist dan sengketa terpisah dari tagihan otomatis.

## 5. Data dan validasi

Data minimum spesifik modul: city; pickup/return_area; start/end datetime dan zona; service_mode; vehicle_class/unit; seats/baggage/transmission; package_duration; buffer; driver assignment; eligibility; deposit; item biaya.

Field wajib dibedakan dari opsional pada form. Validasi dilakukan di client untuk kenyamanan dan di server sebagai otoritas. ID resource harus valid dan berstatus sesuai tindakan; harga/status dari browser tidak dipercaya. Jika suatu field hanya berlaku pada mode tertentu, field tersebut tidak diwajibkan pada mode lain. File privat mengikuti kontrol akses dan batas tipe/ukuran yang disepakati, bukan URL publik permanen.

Snapshot transaksi/penawaran memuat konteks saat persetujuan. Perubahan master data tidak mengubah transaksi lama. Detail kontrak data dan format error diturunkan ke SRS/API setelah review engineering; field konseptual di sini bukan skema database final.

## 6. Status dan aturan khusus

Request default. Interval kendaraan [start,end) ditambah buffer; stok kelas mengurangi kapasitas terhadap hold dan reservasi. Unit pasti sebelum layanan; driver wajib untuk mode dengan pengemudi. Deposit terpisah di mitra dan tidak menjadi revenue platform.

Perubahan tersimpan memiliki ID, waktu, aktor dan jejak audit sesuai tingkat risikonya. Kontrak bersama mengatur booking, hold, payment, refund, payout dan inquiry. Halaman konfirmasi wajib menggunakan status otoritatif. Input invalid tidak membuang draft; resource berubah/tidak aktif saat submit diperiksa ulang sebelum tindakan dijalankan.

## 7. Dependensi dan ownership

Phase 09 armada/driver/maintenance, Phase 10 verifikasi/Finance, Phase 08 checkout dan pesanan; kontrak transaksi bersama.

Product Owner menyetujui scope serta kebijakan. BA menjaga mapping ID dan keputusan; UX memvalidasi prototipe; Engineering menetapkan kontrak dan keandalan; QA menyediakan bukti AC; Operations/Finance/mitra memvalidasi proses yang menjadi kewenangannya. Owner implementasi teknis final mengikuti penugasan proyek, bukan diasumsikan sudah tersedia.

## 8. Notifikasi, error dan akses

Notifikasi transaksi dikirim setelah fakta backend tersimpan. Tidak mengirim status confirmed untuk request atau quote. Gagal kirim email tidak membatalkan fakta transaksi; retry aman dan delivery log diperlukan. Inquiry/booking/payment/payout menggunakan jenis pesan berbeda; penerbangan search-only tidak memicu email konfirmasi tiket.

Server memeriksa hak akses per objek dan konteks sesi. Pengunjung hanya membaca data publik; pelanggan hanya aktivitas sendiri; mitra dibatasi organisasi dan assignment; admin dibatasi role. Error tidak menampilkan data organisasi lain, dokumen privat, token, atau rincian pembayaran sensitif.

## 9. Pengukuran keberhasilan

car_request_submitted; eligibility_decided; car_booking_confirmed; vehicle_assigned; pickup_completed; return_completed. Pantau konflik, pickup gagal, response time dan refund, pemilik Rental Operations.

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

Deposit sengketa: nilai/penerima/syarat terlihat; armada tak cukup: approval mengikat alokasi; driver ganda: validasi interval; biaya tambahan: persetujuan terpisah.

Keputusan general yang memengaruhi fase: **D-04, D-09, D-11**. Rinciannya pada decision log PRD General. Sampai diputuskan, gunakan baseline untuk estimasi dan sandbox; jangan mengaktifkan kebijakan keuangan/kontrak yang belum disetujui. Risiko provider dicatat sebagai blocker dengan PIC, bukan diam-diam mengurangi scope.

## 13. Pengembangan setelah MVP

Daftar lanjutan: One-way beda area, penagihan overtime otomatis, deposit gateway, telematika, API fleet, instant booking. Perubahan menjadi P0 memerlukan dampak terhadap UX, data, kontrak mitra, integrasi, UAT, biaya dan jadwal. Tidak ada janji bahwa semua kapabilitas tersebut tersedia hanya karena arsitektur disebut siap integrasi.

## 14. Referensi

Acuan langsung adalah PRD General v1.0 beserta sumber resmi pada bagian 25. Dokumen ini menyatakan rancangan Gobuking, bukan kebijakan atau arsitektur internal kompetitor. [Kembali ke indeks](00_Index_Phase.md).
