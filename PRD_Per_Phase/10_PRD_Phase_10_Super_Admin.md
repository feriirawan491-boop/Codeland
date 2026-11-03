# PRD Phase 10 Super Admin

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

Mengendalikan kualitas mitra, transaksi, layanan pelanggan dan keuangan dengan pemisahan kewenangan.

Phase 10 adalah nomor paket scope sesuai urutan permintaan pengguna, bukan urutan pembangunan yang mengharuskan semua fase sebelumnya selesai. Kapabilitas fondasi yang disebut pada dependensi harus tersedia sebelum pilot. Dokumen ini menurunkan baseline general; pilihan yang masih usulan tidak berubah menjadi keputusan final hanya karena diperinci.

**Aktor:** Content/Partnership; Operations/CS; Finance Maker/Checker; Super Admin.

**Di luar P0:** ERP penuh, akuntansi pajak otomatis, payout API, fraud ML, A/B testing platform, otomatisasi tiket flight.

## 2. Navigasi dan layar

1. Ringkasan.
2. Mitra.
3. Katalog.
4. Reservasi.
5. Venue CRM.
6. Pelanggan.
7. Pembayaran.
8. Settlement.
9. Laporan.
10. CMS.
11. Dukungan.
12. Integrasi.
13. Akses/audit.

Pada mobile, filter/rincian dapat memakai panel tetapi field wajib, status, dan CTA utama tetap terbaca. URL dan state mempertahankan konteks saat kembali; layar privat tidak diindeks. Loading, kosong, error, tidak berizin, serta resource tidak aktif memiliki tampilan terpisah.

## 3. Perjalanan utama

1. Tinjau onboarding/listing.
2. Aktivasi sesuai syarat.
3. Pantau reservasi dan overdue.
4. Tangani exception.
5. Rekonsiliasi uang.
6. Setujui refund/payout dengan kontrol.
7. Terbitkan statement.
8. Review kualitas mitra.

## 4. Spesifikasi fitur dan acceptance criteria

Setiap ID mempertahankan keterlacakan ke PRD General. Skenario acceptance berikut wajib dilengkapi happy path, validasi field, dan kontrol akses pada QA. Tidak ada penghilangan P0 melalui penyembunyian tombol saja.

### ADM-01 Verifikasi mitra

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin memverifikasi mitra agar hanya usaha yang memenuhi syarat dapat bertransaksi.
- **Perilaku produk:** Review dokumen, PIC, rekening, kontrak, approve/reject/revision dan alasan.
- **Acceptance ADM-01-AC01:** Dengan rekening belum tervalidasi dan kontrak kosong, ketika aktivasi transaksi diminta, ditolak dengan daftar syarat; approval diberi aktor/tanggal/bukti.

### ADM-02 Moderasi listing

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin meninjau listing agar katalog publik akurat dan tidak menggandakan inventori.
- **Perilaku produk:** Kelengkapan kategori, duplikasi, foto, lokasi, kebijakan, kapasitas; publish/suspend dengan audit.
- **Acceptance ADM-02-AC01:** Dengan listing duplikat villa pada dua kategori, ketika moderasi, reviewer mengaitkan resource stok bersama atau menolak publish; foto privat tidak masuk katalog publik.

### ADM-03 Kontrol reservasi

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin menelusuri booking dan pengecualian agar pelanggan mendapat penyelesaian yang benar.
- **Perilaku produk:** Search lintas layanan, detail/timeline, pengecualian, pembatalan, no-show, tindakan koreksi berizin.
- **Acceptance ADM-03-AC01:** Dengan payment sukses tetapi booking exception, ketika antrean dibuka, case punya pemilik dan langkah refund/rebooking; admin tidak mengirim voucher palsu.

### ADM-04 Venue CRM

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin mengawasi SLA venue agar prospek memiliki PIC serta tindak lanjut.
- **Perilaku produk:** SLA, overdue queue, PIC, penawaran, permintaan booking dan hasil tindak lanjut.
- **Acceptance ADM-04-AC01:** Dengan inquiry lewat SLA, ketika antrean dibuka, PIC dan durasi keterlambatan terlihat; mengganti PIC tidak mereset waktu masuk.

### ADM-05 Pembayaran dan refund

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin merekonsiliasi pembayaran dan refund agar uang masuk serta keluar dapat dibuktikan.
- **Perilaku produk:** Rekonsiliasi gateway, selisih, approval refund, retry aman dan bukti hasil.
- **Acceptance ADM-05-AC01:** Dengan refund melebihi sisa pembayaran atau webhook duplikat, ketika diproses, jumlah lebih ditolak dan event sama tidak membuat financial entry kedua.

### ADM-06 Payout

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin mengelola payout dengan pemeriksa terpisah agar hak mitra dibayar tepat sekali.
- **Perilaku produk:** Hitung eligibility, tahan item sengketa, buat batch, persetujuan berbeda aktor, catat transfer dan retry.
- **Acceptance ADM-06-AC01:** Dengan maker membuat batch, ketika maker sendiri approve, ditolak; hanya transfer bereferensi/bukti valid yang direkonsiliasi menjadi paid.

### ADM-07 Customer support

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin menangani tiket dan relokasi agar kegagalan layanan terselesaikan.
- **Perilaku produk:** Tiket, lampiran, riwayat, eskalasi, overbooking/relokasi, alasan penyelesaian.
- **Acceptance ADM-07-AC01:** Dengan komplain overbooking, ketika CS membuat kasus, alternatif/relokasi/refund serta penanggung biaya tercatat; dokumen kasus terbatas izin.

### ADM-08 CMS dan promo

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin mengelola CMS serta promo agar informasi publik tepat periode dan dasar harga.
- **Perilaku produk:** Banner, destinasi, konten bantuan/kebijakan, SEO, promo dasar per listing/periode.
- **Acceptance ADM-08-AC01:** Dengan promo berakhir pada waktu lokal tertentu, ketika publish schedule dieksekusi, konten tidak tampil setelah batas; dasar diskon dan penanggung biaya wajib.

### ADM-09 Revenue reports

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin membaca metrik keuangan terpisah agar GMV tidak dianggap pendapatan platform.
- **Perilaku produk:** GMV, penjualan bersih pembatalan/refund, estimasi komisi, hak mitra, biaya, payout, piutang/kewajiban terkait.
- **Acceptance ADM-09-AC01:** Dengan kas masuk Rp1 juta dan komisi ilustrasi Rp150 ribu, ketika laporan dibuka, GMV dan pendapatan platform tidak ditukar; pipeline venue tidak ditambahkan ke GMV.

### ADM-10 Konfigurasi

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin mengubah konfigurasi secara berversi agar dampak kebijakan dapat ditelusuri.
- **Perilaku produk:** Peran, SLA, cut-off, kebijakan default, master data, feature flags per kategori.
- **Acceptance ADM-10-AC01:** Dengan SLA diubah, ketika tersimpan, nilai baru berversi dan pengaruh terhadap kasus berjalan eksplisit; tidak mengubah policy snapshot booking lama.

### ADM-11 Ulasan dan risiko

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin memoderasi konten berdasarkan pedoman agar penilaian tidak bias terhadap ulasan negatif.
- **Perilaku produk:** Antrean moderasi, alasan keputusan, laporan penyalahgunaan, pembatasan akun/listing.
- **Acceptance ADM-11-AC01:** Dengan review dilaporkan mitra, ketika moderator memutuskan, alasan berbasis pedoman dan jejak keputusan tersedia; ulasan negatif tidak otomatis dihapus.

### ADM-12 Audit dan integrasi

- **Prioritas:** P0.
- **User story:** Sebagai staf platform berizin, saya ingin memantau integrasi serta audit agar kegagalan dapat ditangani tanpa membocorkan data sensitif.
- **Perilaku produk:** Log tindakan, pengiriman notifikasi, kesehatan konektor, exception queue tanpa membocorkan secret.
- **Acceptance ADM-12-AC01:** Dengan integrasi gagal, ketika log dibuka, correlation ID dan error tersanitasi tersedia tanpa token/kartu lengkap; replay perubahan uang memerlukan izin dan deduplikasi.

## 5. Data dan validasi

Data minimum spesifik modul: role scope; verification evidence; contract/commission version; listing review; booking timeline; gateway event; refund; settlement item/batch; case owner; CMS schedule; audit correlation.

Field wajib dibedakan dari opsional pada form. Validasi dilakukan di client untuk kenyamanan dan di server sebagai otoritas. ID resource harus valid dan berstatus sesuai tindakan; harga/status dari browser tidak dipercaya. Jika suatu field hanya berlaku pada mode tertentu, field tersebut tidak diwajibkan pada mode lain. File privat mengikuti kontrol akses dan batas tipe/ukuran yang disepakati, bukan URL publik permanen.

Snapshot transaksi/penawaran memuat konteks saat persetujuan. Perubahan master data tidak mengubah transaksi lama. Detail kontrak data dan format error diturunkan ke SRS/API setelah review engineering; field konseptual di sini bukan skema database final.

## 6. Status dan aturan khusus

Finance maker/checker terpisah termasuk saat akun Super Admin. Akses darurat dicatat dan tidak menghapus kewajiban approval keuangan. Koreksi uang memakai bukti serta adjustment, bukan edit transaksi historis. Suspend tidak menghapus confirmed dan payable.

Perubahan tersimpan memiliki ID, waktu, aktor dan jejak audit sesuai tingkat risikonya. Kontrak bersama mengatur booking, hold, payment, refund, payout dan inquiry. Halaman konfirmasi wajib menggunakan status otoritatif. Input invalid tidak membuang draft; resource berubah/tidak aktif saat submit diperiksa ulang sebelum tindakan dijalankan.

## 7. Dependensi dan ownership

Fondasi identitas organisasi, event pembayaran dan financial entries; dukungan dasar disiapkan sebelum layanan menerima transaksi. Seluruh Phase 01–09 terhubung setelah modul aktif.

Product Owner menyetujui scope serta kebijakan. BA menjaga mapping ID dan keputusan; UX memvalidasi prototipe; Engineering menetapkan kontrak dan keandalan; QA menyediakan bukti AC; Operations/Finance/mitra memvalidasi proses yang menjadi kewenangannya. Owner implementasi teknis final mengikuti penugasan proyek, bukan diasumsikan sudah tersedia.

## 8. Notifikasi, error dan akses

Notifikasi transaksi dikirim setelah fakta backend tersimpan. Tidak mengirim status confirmed untuk request atau quote. Gagal kirim email tidak membatalkan fakta transaksi; retry aman dan delivery log diperlukan. Inquiry/booking/payment/payout menggunakan jenis pesan berbeda; penerbangan search-only tidak memicu email konfirmasi tiket.

Server memeriksa hak akses per objek dan konteks sesi. Pengunjung hanya membaca data publik; pelanggan hanya aktivitas sendiri; mitra dibatasi organisasi dan assignment; admin dibatasi role. Error tidak menampilkan data organisasi lain, dokumen privat, token, atau rincian pembayaran sensitif.

## 9. Pengukuran keberhasilan

partner_verified; listing_moderated; reconciliation_case_created; refund_approved; payout_recorded; integration_failed. Pantau outstanding, SLA kasus, mismatch aged dan payout gagal; Finance/Operations.

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

Payout ganda: item unik dan rekonsiliasi; penyalahgunaan akses: segregation dan audit; laporan palsu: satu sumber financial entries; restore: cek ulang status gateway sebelum replay.

Keputusan general yang memengaruhi fase: **D-03, D-05, D-06, D-07, D-09, D-13, D-15**. Rinciannya pada decision log PRD General. Sampai diputuskan, gunakan baseline untuk estimasi dan sandbox; jangan mengaktifkan kebijakan keuangan/kontrak yang belum disetujui. Risiko provider dicatat sebagai blocker dengan PIC, bukan diam-diam mengurangi scope.

## 13. Pengembangan setelah MVP

Daftar lanjutan: ERP penuh, akuntansi pajak otomatis, payout API, fraud ML, A/B testing platform, otomatisasi tiket flight. Perubahan menjadi P0 memerlukan dampak terhadap UX, data, kontrak mitra, integrasi, UAT, biaya dan jadwal. Tidak ada janji bahwa semua kapabilitas tersebut tersedia hanya karena arsitektur disebut siap integrasi.

## 14. Referensi

Acuan langsung adalah PRD General v1.0 beserta sumber resmi pada bagian 25. Dokumen ini menyatakan rancangan Gobuking, bukan kebijakan atau arsitektur internal kompetitor. [Kembali ke indeks](00_Index_Phase.md).
