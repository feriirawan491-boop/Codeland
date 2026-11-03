# PRD Phase 08 User Dashboard

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

Memberi pelanggan kontrol atas pesanan dan aktivitas sendiri tanpa harus selalu menghubungi CS.

Phase 08 adalah nomor paket scope sesuai urutan permintaan pengguna, bukan urutan pembangunan yang mengharuskan semua fase sebelumnya selesai. Kapabilitas fondasi yang disebut pada dependensi harus tersedia sebelum pilot. Dokumen ini menurunkan baseline general; pilihan yang masih usulan tidak berubah menjadi keputusan final hanya karena diperinci.

**Aktor:** Pelanggan terautentikasi; CS melalui hak platform.

**Di luar P0:** Wallet, saved cards, loyalty, sharing wishlist, riwayat pencarian flight lintas perangkat, reschedule otomatis.

## 2. Navigasi dan layar

1. Pesanan.
2. Detail.
3. Riwayat.
4. Inquiry/quote.
5. Properti tersimpan.
6. Profil.
7. Refund.
8. Ulasan.
9. Keamanan.
10. Bantuan.

Pada mobile, filter/rincian dapat memakai panel tetapi field wajib, status, dan CTA utama tetap terbaca. URL dan state mempertahankan konteks saat kembali; layar privat tidak diindeks. Loading, kosong, error, tidak berizin, serta resource tidak aktif memiliki tampilan terpisah.

## 3. Perjalanan utama

1. Login OTP.
2. Pilih kategori/status pesanan.
3. Buka detail.
4. Bayar/resend/batal sesuai eligibility.
5. Ikuti refund atau bantuan.
6. Kelola inquiry/saved/profil.
7. Logout.

## 4. Spesifikasi fitur dan acceptance criteria

Setiap ID mempertahankan keterlacakan ke PRD General. Skenario acceptance berikut wajib dilengkapi happy path, validasi field, dan kontrol akses pada QA. Tidak ada penghilangan P0 melalui penyembunyian tombol saja.

### USR-01 Pesanan Saya

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin melihat pesanan aktif per kategori agar tahu layanan yang akan datang.
- **Perilaku produk:** Booking aktif dipisah berdasarkan hotel, home, car; filter status dan jadwal.
- **Acceptance USR-01-AC01:** Dengan akun tanpa booking, ketika dashboard dibuka, tampil empty state dan tautan pencarian; hasil flight search-only tidak dibuat menjadi pesanan palsu.

### USR-02 Detail Pesanan

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin membaca status dan voucher resmi agar memahami tindakan berikutnya.
- **Perilaku produk:** Produk, mitra, data pemesan, harga, timeline, pembayaran, voucher, kebijakan dan bantuan.
- **Acceptance USR-02-AC01:** Dengan booking pending, ketika detail dibuka, voucher final belum tersedia; setelah server confirmed, voucher dapat diunduh tanpa menunggu email.

### USR-03 Riwayat

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin mencari transaksi terdahulu agar dapat memeriksa riwayat perjalanan.
- **Perilaku produk:** Selesai, batal, ditolak, expired; tanggal layanan dibedakan dari tanggal pemesanan.
- **Acceptance USR-03-AC01:** Dengan booking tanggal dibuat berbeda dari tanggal layanan, ketika filter riwayat dipilih, label periode jelas dan hasil memakai jenis tanggal yang dipilih.

### USR-04 Inquiry dan Penawaran

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin mengakses inquiry dan quote milik sendiri agar tindak lanjut venue mudah.
- **Perilaku produk:** Tracking inquiry venue, versi quote, respons, permintaan booking, tindak lanjut.
- **Acceptance USR-04-AC01:** Dengan inquiry anonim ber-email sama tetapi belum diverifikasi, ketika akun mengklaim inquiry, akses ditolak sampai token/kontak diverifikasi.

### USR-05 Properti Tersimpan

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin menyimpan properti agar dapat kembali membandingkannya.
- **Perilaku produk:** Simpan/hapus hotel, home, MICE, wedding; listing nonaktif diberi status, harga diperiksa saat dibuka.
- **Acceptance USR-05-AC01:** Dengan properti saved kemudian suspended, ketika daftar dibuka, item diberi status tidak tersedia dan CTA bayar dinonaktifkan.

### USR-06 Profil

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin memperbarui kontak terverifikasi agar notifikasi diterima pihak yang benar.
- **Perilaku produk:** Nama, email/telepon terverifikasi, preferensi dasar; perubahan kontak memerlukan verifikasi.
- **Acceptance USR-06-AC01:** Dengan email baru diajukan, ketika verifikasi belum selesai, email lama tetap menjadi identitas aktif; booking lama tidak berpindah ke akun lain.

### USR-07 Pembatalan dan Refund

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin melihat biaya pembatalan dan progres refund agar mengetahui hak serta uang yang belum kembali.
- **Perilaku produk:** Estimasi biaya, persetujuan pembatalan, alasan, tracking refund.
- **Acceptance USR-07-AC01:** Dengan pembatalan menghasilkan refund sebagian, ketika pelanggan mengonfirmasi, biaya serta nilai refund snapshot tampil dan status processing tidak ditulis uang sudah kembali.

### USR-08 Ulasan Saya

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin menulis ulasan atas layanan eligible agar pengalaman dapat membantu pengguna lain.
- **Perilaku produk:** Tulis ulasan atas transaksi eligible, lihat status moderasi dan balasan.
- **Acceptance USR-08-AC01:** Dengan booking completed lebih dari jendela usulan 90 hari, ketika menulis review, ditolak; review yang pending tidak langsung mengubah skor publik.

### USR-09 Keamanan dan Privasi

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin mencabut sesi dan mengajukan permintaan data agar dapat mengendalikan akses akun.
- **Perilaku produk:** Kelola sesi, logout, kanal permintaan akses/koreksi/penghapusan data sesuai kebijakan retensi.
- **Acceptance USR-09-AC01:** Dengan sesi perangkat lain dicabut, ketika token lama digunakan, akses privat ditolak; permintaan hapus data menghasilkan tiket verifikasi dan bukan penghapusan transaksi langsung.

### USR-10 Bantuan

- **Prioritas:** P0.
- **User story:** Sebagai pelanggan, saya ingin mengirim tiket terkait transaksi agar masalah ditangani dengan konteks lengkap.
- **Perilaku produk:** Tiket terkait transaksi/inquiry, lampiran aman, timeline dan respons CS.
- **Acceptance USR-10-AC01:** Dengan tiket milik user lain, ketika URL/ID ditebak, data dan lampiran tetap tidak dapat diakses; kegagalan upload tidak menghapus isi form.

## 5. Data dan validasi

Data minimum spesifik modul: account_id dari sesi; booking_id; status dan timeline; payment/refund terpisah; inquiry_claim_token; saved_listing_id; verified_contact; review eligibility; ticket_id; lampiran privat.

Field wajib dibedakan dari opsional pada form. Validasi dilakukan di client untuk kenyamanan dan di server sebagai otoritas. ID resource harus valid dan berstatus sesuai tindakan; harga/status dari browser tidak dipercaya. Jika suatu field hanya berlaku pada mode tertentu, field tersebut tidak diwajibkan pada mode lain. File privat mengikuti kontrol akses dan batas tipe/ukuran yang disepakati, bukan URL publik permanen.

Snapshot transaksi/penawaran memuat konteks saat persetujuan. Perubahan master data tidak mengubah transaksi lama. Detail kontrak data dan format error diturunkan ke SRS/API setelah review engineering; field konseptual di sini bukan skema database final.

## 6. Status dan aturan khusus

Akses server selalu memeriksa ownership. Form login tidak menghilangkan konteks checkout. Pembatalan mengikuti izin/status dan kebijakan transaksi, bukan default terbaru. Session expiry meminta login ulang tanpa membocorkan detail.

Perubahan tersimpan memiliki ID, waktu, aktor dan jejak audit sesuai tingkat risikonya. Kontrak bersama mengatur booking, hold, payment, refund, payout dan inquiry. Halaman konfirmasi wajib menggunakan status otoritatif. Input invalid tidak membuang draft; resource berubah/tidak aktif saat submit diperiksa ulang sebelum tindakan dijalankan.

## 7. Dependensi dan ownership

Kontrak identitas dan ownership dibuat pada fondasi; data dari Phase 02–07, tiket dari Phase 10. Tidak membangun ledger kedua untuk dashboard.

Product Owner menyetujui scope serta kebijakan. BA menjaga mapping ID dan keputusan; UX memvalidasi prototipe; Engineering menetapkan kontrak dan keandalan; QA menyediakan bukti AC; Operations/Finance/mitra memvalidasi proses yang menjadi kewenangannya. Owner implementasi teknis final mengikuti penugasan proyek, bukan diasumsikan sudah tersedia.

## 8. Notifikasi, error dan akses

Notifikasi transaksi dikirim setelah fakta backend tersimpan. Tidak mengirim status confirmed untuk request atau quote. Gagal kirim email tidak membatalkan fakta transaksi; retry aman dan delivery log diperlukan. Inquiry/booking/payment/payout menggunakan jenis pesan berbeda; penerbangan search-only tidak memicu email konfirmasi tiket.

Server memeriksa hak akses per objek dan konteks sesi. Pengunjung hanya membaca data publik; pelanggan hanya aktivitas sendiri; mitra dibatasi organisasi dan assignment; admin dibatasi role. Error tidak menampilkan data organisasi lain, dokumen privat, token, atau rincian pembayaran sensitif.

## 9. Pengukuran keberhasilan

dashboard_viewed; voucher_downloaded; cancellation_requested; inquiry_claimed; saved_listing_changed; support_created. Self-service completion = aksi eligible selesai tanpa CS ÷ aksi eligible dimulai; pemilik Product/CS.

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

IDOR: cek ownership; salah klaim email: verifikasi; status keuangan menyesatkan: pisahkan objek; kehilangan konteks OTP: simpan draft aman.

Keputusan general yang memengaruhi fase: **D-04, D-09, D-12, D-15**. Rinciannya pada decision log PRD General. Sampai diputuskan, gunakan baseline untuk estimasi dan sandbox; jangan mengaktifkan kebijakan keuangan/kontrak yang belum disetujui. Risiko provider dicatat sebagai blocker dengan PIC, bukan diam-diam mengurangi scope.

## 13. Pengembangan setelah MVP

Daftar lanjutan: Wallet, saved cards, loyalty, sharing wishlist, riwayat pencarian flight lintas perangkat, reschedule otomatis. Perubahan menjadi P0 memerlukan dampak terhadap UX, data, kontrak mitra, integrasi, UAT, biaya dan jadwal. Tidak ada janji bahwa semua kapabilitas tersebut tersedia hanya karena arsitektur disebut siap integrasi.

## 14. Referensi

Acuan langsung adalah PRD General v1.0 beserta sumber resmi pada bagian 25. Dokumen ini menyatakan rancangan Gobuking, bukan kebijakan atau arsitektur internal kompetitor. [Kembali ke indeks](00_Index_Phase.md).
