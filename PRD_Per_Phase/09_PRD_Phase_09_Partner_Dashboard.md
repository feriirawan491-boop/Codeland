# PRD Phase 09 Partner Dashboard

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

Memungkinkan mitra mengelola penjualan dan pemenuhan layanan secara mandiri dalam organisasinya.

Phase 09 adalah nomor paket scope sesuai urutan permintaan pengguna, bukan urutan pembangunan yang mengharuskan semua fase sebelumnya selesai. Kapabilitas fondasi yang disebut pada dependensi harus tersedia sebelum pilot. Dokumen ini menurunkan baseline general; pilihan yang masih usulan tidak berubah menjadi keputusan final hanya karena diperinci.

**Aktor:** Partner Owner; Operations; Finance dengan assignment listing.

**Di luar P0:** Channel manager produksi, property accounting penuh, housekeeping, co-host split payout, API fleet, partner ads.

## 2. Navigasi dan layar

1. Ringkasan.
2. Usaha.
3. Listing.
4. Tarif/kalender.
5. Reservasi.
6. Operasional.
7. Venue CRM.
8. Pelanggan.
9. Ulasan.
10. Keuangan.
11. Tim.
12. Bantuan.

Pada mobile, filter/rincian dapat memakai panel tetapi field wajib, status, dan CTA utama tetap terbaca. URL dan state mempertahankan konteks saat kembali; layar privat tidak diindeks. Loading, kosong, error, tidak berizin, serta resource tidak aktif memiliki tampilan terpisah.

## 3. Perjalanan utama

1. Daftar organisasi.
2. Lengkapi dokumen dan kontrak.
3. Review platform.
4. Buat listing dan submit.
5. Publish setelah approval.
6. Kelola harga/stok.
7. Tangani transaksi/inquiry.
8. Layani pelanggan.
9. Cocokkan statement/payout.

## 4. Spesifikasi fitur dan acceptance criteria

Setiap ID mempertahankan keterlacakan ke PRD General. Skenario acceptance berikut wajib dilengkapi happy path, validasi field, dan kontrol akses pada QA. Tidak ada penghilangan P0 melalui penyembunyian tombol saja.

### PTR-01 Profil, dokumen, rekening, perjanjian

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin mengelola profil dan dokumen usaha agar proses verifikasi serta pembayaran tepat.
- **Perilaku produk:** Data sensitif dibatasi; perubahan rekening harus diverifikasi ulang.
- **Acceptance PTR-01-AC01:** Dengan staf Operations, ketika mencoba mengubah rekening, server menolak; rekening baru dari Owner masuk verifikasi tanpa mengubah rekening transaksi historis.

### PTR-02 Listing dan multi-property

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin mengelola listing per properti agar informasi produk tetap akurat.
- **Perilaku produk:** CRUD sesuai kategori, validasi kelengkapan, preview, submit review.
- **Acceptance PTR-02-AC01:** Dengan listing belum lengkap, ketika submit review, sistem menyebut field kurang per kategori; status approved organisasi tidak otomatis publish listing.

### PTR-03 Kalender dan tarif

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin memperbarui kalender dan tarif agar stok yang dijual sesuai kondisi operasional.
- **Perilaku produk:** Ubah per tanggal/rentang, bulk update sederhana, stok, stop sell, rate plan, buffer.
- **Acceptance PTR-03-AC01:** Dengan stok lebih kecil dari confirmed+hold, ketika bulk update disimpan, baris konflik ditolak dengan preview dampak; confirmed tidak dibatalkan diam-diam.

### PTR-04 Reservasi

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin memutuskan request serta membaca reservasi agar layanan dapat disiapkan.
- **Perilaku produk:** Detail yang diperlukan, accept/reject request, instruksi layanan, jadwal kedatangan/serah terima.
- **Acceptance PTR-04-AC01:** Dengan dua staf memutuskan request yang sama, ketika aksi bersamaan, hanya satu transisi sah diterima dan aktor lain melihat status terbaru.

### PTR-05 Status pemenuhan

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin mencatat pemenuhan atau no-show agar fakta layanan dapat direkonsiliasi.
- **Perilaku produk:** Check-in/out, pickup/return, no-show beserta bukti, permintaan pembatalan oleh mitra.
- **Acceptance PTR-05-AC01:** Dengan waktu mulai layanan belum lewat, ketika no-show dilaporkan, ditolak; bukti dan review diperlukan sesuai kebijakan.

### PTR-06 Venue CRM

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin menangani inquiry dan quote agar prospek venue tidak hilang.
- **Perilaku produk:** Antrean inquiry, assignment, respons, penawaran terstruktur/lampiran, masa berlaku, alasan hasil.
- **Acceptance PTR-06-AC01:** Dengan quote versi baru, ketika dikirim, versi lama superseded; hanya PIC berizin dapat mengakses lampiran organisasi.

### PTR-07 Customer management

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin membaca data pelanggan terkait usaha sendiri agar dapat melayani tanpa membuka data mitra lain.
- **Perilaku produk:** Kontak dan riwayat pelanggan terkait organisasi sendiri, catatan layanan; tanpa ekspor massal PII secara default.
- **Acceptance PTR-07-AC01:** Dengan pelanggan pernah bertransaksi di mitra lain, ketika profil dibuka, hanya riwayat organisasi saat ini terlihat; ekspor PII massal tidak terbuka default.

### PTR-08 Laporan usaha

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin mencocokkan hak pembayaran dengan statement agar memahami potongan serta payout.
- **Perilaku produk:** Penjualan bruto, pembatalan, komisi/potongan, refund, estimasi hak mitra, payout aktual.
- **Acceptance PTR-08-AC01:** Dengan refund pada transaksi sudah payout, ketika statement dibuat, penyesuaian muncul sebagai item baru dan total periode tetap dapat direkonsiliasi.

### PTR-09 Ulasan

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin membalas dan melaporkan ulasan agar dapat menanggapi masukan secara wajar.
- **Perilaku produk:** Membalas atau melaporkan pelanggaran; tidak mengubah skor/menghapus ulasan sepihak.
- **Acceptance PTR-09-AC01:** Dengan ulasan negatif, ketika mitra ingin menghapus, hanya balas/laporkan tersedia; skor tidak dapat diedit.

### PTR-10 Staf dan izin

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin mengelola akses staf agar hanya petugas yang tepat dapat bertindak.
- **Perilaku produk:** Owner mengundang staf, membatasi organisasi/listing, mencabut sesi saat akses dinonaktifkan.
- **Acceptance PTR-10-AC01:** Dengan staf dicabut assignment, ketika memakai sesi aktif ke listing lama, akses server ditolak tanpa menunggu logout manual.

### PTR-11 Bantuan

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin mengeskalasi masalah dan memeriksa aktivitas agar dapat menelusuri perubahan.
- **Perilaku produk:** Tiket dengan platform, notifikasi, histori perubahan, eskalasi stok/reservasi.
- **Acceptance PTR-11-AC01:** Dengan inventory stale, ketika tiket dibuat, resource dan timeline relevan terlampir tanpa secret supplier; audit hanya dapat dibaca sesuai izin.

### PTR-12 Keluar/penangguhan

- **Prioritas:** P0.
- **User story:** Sebagai staf mitra berizin, saya ingin menutup penjualan dengan tertib agar kewajiban reservasi lama tetap terselesaikan.
- **Perilaku produk:** Menutup penjualan baru; booking confirmed dan penyelesaian hak/kewajiban tetap ditangani.
- **Acceptance PTR-12-AC01:** Dengan organisasi suspended, ketika listing dicari publik, penjualan baru berhenti; reservasi lama dan hak pembayaran tetap dalam penanganan.

## 5. Data dan validasi

Data minimum spesifik modul: organization_id/membership; dokumen/rekening berversi; listing/category/resource; room/unit/space/vehicle; rate plan; calendar version; booking; quote; assignment; financial statement; staff role.

Field wajib dibedakan dari opsional pada form. Validasi dilakukan di client untuk kenyamanan dan di server sebagai otoritas. ID resource harus valid dan berstatus sesuai tindakan; harga/status dari browser tidak dipercaya. Jika suatu field hanya berlaku pada mode tertentu, field tersebut tidak diwajibkan pada mode lain. File privat mengikuti kontrol akses dan batas tipe/ukuran yang disepakati, bukan URL publik permanen.

Snapshot transaksi/penawaran memuat konteks saat persetujuan. Perubahan master data tidak mengubah transaksi lama. Detail kontrak data dan format error diturunkan ke SRS/API setelah review engineering; field konseptual di sini bukan skema database final.

## 6. Status dan aturan khusus

Mitra dan listing memiliki lifecycle terpisah. Sumber stok ditentukan per listing; update manual berizin berlaku pada transaksi baru. Perubahan material melalui review; bantuan admin selalu mencatat aktor platform dan alasan. Multi-property tetap terisolasi per assignment.

Perubahan tersimpan memiliki ID, waktu, aktor dan jejak audit sesuai tingkat risikonya. Kontrak bersama mengatur booking, hold, payment, refund, payout dan inquiry. Halaman konfirmasi wajib menggunakan status otoritatif. Input invalid tidak membuang draft; resource berubah/tidak aktif saat submit diperiksa ulang sebelum tindakan dijalankan.

## 7. Dependensi dan ownership

Phase 10 verifikasi/publish dan Finance; fondasi organisasi/peran sebelum seluruh produk; Phase 02–07 sebagai konsumen stok dan penghasil request. Dasbor penuh diselesaikan bertahap, bukan ditunggu sampai fase kesembilan.

Product Owner menyetujui scope serta kebijakan. BA menjaga mapping ID dan keputusan; UX memvalidasi prototipe; Engineering menetapkan kontrak dan keandalan; QA menyediakan bukti AC; Operations/Finance/mitra memvalidasi proses yang menjadi kewenangannya. Owner implementasi teknis final mengikuti penugasan proyek, bukan diasumsikan sudah tersedia.

## 8. Notifikasi, error dan akses

Notifikasi transaksi dikirim setelah fakta backend tersimpan. Tidak mengirim status confirmed untuk request atau quote. Gagal kirim email tidak membatalkan fakta transaksi; retry aman dan delivery log diperlukan. Inquiry/booking/payment/payout menggunakan jenis pesan berbeda; penerbangan search-only tidak memicu email konfirmasi tiket.

Server memeriksa hak akses per objek dan konteks sesi. Pengunjung hanya membaca data publik; pelanggan hanya aktivitas sendiri; mitra dibatasi organisasi dan assignment; admin dibatasi role. Error tidak menampilkan data organisasi lain, dokumen privat, token, atau rincian pembayaran sensitif.

## 9. Pengukuran keberhasilan

partner_submitted; listing_submitted; calendar_updated; request_decided; service_completed; statement_viewed. Pantau waktu onboarding, kelengkapan listing, response SLA, stok stale dan pembatalan mitra; Partnership/Operations.

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

Konflik sumber stok: field ownership; data antar-mitra bocor: tenant+assignment; laporan tidak cocok: satu ledger; bulk update salah: preview dan audit.

Keputusan general yang memengaruhi fase: **D-02, D-03, D-05, D-08, D-14**. Rinciannya pada decision log PRD General. Sampai diputuskan, gunakan baseline untuk estimasi dan sandbox; jangan mengaktifkan kebijakan keuangan/kontrak yang belum disetujui. Risiko provider dicatat sebagai blocker dengan PIC, bukan diam-diam mengurangi scope.

## 13. Pengembangan setelah MVP

Daftar lanjutan: Channel manager produksi, property accounting penuh, housekeeping, co-host split payout, API fleet, partner ads. Perubahan menjadi P0 memerlukan dampak terhadap UX, data, kontrak mitra, integrasi, UAT, biaya dan jadwal. Tidak ada janji bahwa semua kapabilitas tersebut tersedia hanya karena arsitektur disebut siap integrasi.

## 14. Referensi

Acuan langsung adalah PRD General v1.0 beserta sumber resmi pada bagian 25. Dokumen ini menyatakan rancangan Gobuking, bukan kebijakan atau arsitektur internal kompetitor. [Kembali ke indeks](00_Index_Phase.md).
