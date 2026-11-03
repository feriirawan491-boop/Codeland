# PRD Phase 04 Flights

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

Menyediakan hasil penerbangan domestik yang nyata untuk sekali jalan dan pulang pergi.

Phase 04 adalah nomor paket scope sesuai urutan permintaan pengguna, bukan urutan pembangunan yang mengharuskan semua fase sebelumnya selesai. Kapabilitas fondasi yang disebut pada dependensi harus tersedia sebelum pilot. Dokumen ini menurunkan baseline general; pilihan yang masih usulan tidak berubah menjadi keputusan final hanya karena diperinci.

**Aktor:** Pengunjung; supplier penerbangan; Platform Operations.

**Di luar P0:** PNR, pembayaran tiket, issuance, e-ticket, seat/baggage add-on, check-in, flight refund/reschedule, bundling.

## 2. Navigasi dan layar

1. Form rute.
2. Pilih tanggal dan penumpang.
3. Hasil.
4. Filter/sort.
5. Pilih berangkat/pulang.
6. Detail itinerary.
7. Informasi search-only.

Pada mobile, filter/rincian dapat memakai panel tetapi field wajib, status, dan CTA utama tetap terbaca. URL dan state mempertahankan konteks saat kembali; layar privat tidak diindeks. Loading, kosong, error, tidak berizin, serta resource tidak aktif memiliki tampilan terpisah.

## 3. Perjalanan utama

1. Pilih sekali jalan/pulang pergi.
2. Isi rute/tanggal/penumpang.
3. Kirim search.
4. Lihat hasil supplier.
5. Filter dan pilih kombinasi valid.
6. Baca itinerary dan cakupan layanan.

## 4. Spesifikasi fitur dan acceptance criteria

Setiap ID mempertahankan keterlacakan ke PRD General. Skenario acceptance berikut wajib dilengkapi happy path, validasi field, dan kontrol akses pada QA. Tidak ada penghilangan P0 melalui penyembunyian tombol saja.

### FLT-01 Form pencarian

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin mengisi rute dan jenis perjalanan agar pencarian sesuai itinerary.
- **Perilaku produk:** Sekali jalan/pulang pergi, asal/tujuan, tanggal, dewasa/anak/bayi, kelas kabin.
- **Acceptance FLT-01-AC01:** Dengan mode sekali jalan, ketika search dikirim, return_date tidak ikut; berpindah ke pulang pergi mewajibkan tanggal pulang.

### FLT-02 Validasi

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin mengetahui kesalahan rute dan penumpang sebelum search agar tidak membuang waktu.
- **Perilaku produk:** Bandara asal berbeda dari tujuan, tanggal pulang valid, batas usia/jumlah penumpang mengikuti supplier.
- **Acceptance FLT-02-AC01:** Dengan asal dan tujuan bandara sama, ketika submit, search ditolak sebelum memanggil supplier; aturan bayi mengikuti konfigurasi supplier.

### FLT-03 Live search

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin mendapat jadwal dan harga supplier nyata agar hasil dapat digunakan sebagai acuan.
- **Perilaku produk:** Jadwal dan harga berasal dari supplier resmi; cakupan awal domestik Indonesia sebagai usulan.
- **Acceptance FLT-03-AC01:** Dengan rute pilot yang disepakati, ketika search dijalankan, respons memuat identitas offer dan waktu pengambilan dari supplier; data dummy tidak lolos penerimaan.

### FLT-04 Hasil dan filter

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin membandingkan durasi, transit dan total biaya agar dapat memilih penerbangan.
- **Perilaku produk:** Maskapai, waktu lokal dan zona waktu, durasi, transit, kelas, harga total penumpang; filter maskapai/transit/jam dan sort harga/durasi.
- **Acceptance FLT-04-AC01:** Dengan dua penumpang dan harga per orang, ketika hasil ditampilkan, total kedua penumpang menjadi harga utama; filter transit tidak menyembunyikan segmen.

### FLT-05 Detail itinerary

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin membaca setiap segmen dan ketentuan bagasi agar memahami perjalanan.
- **Perilaku produk:** Segmen, bandara, pergantian hari, bagasi yang diberikan supplier, ketentuan tarif, timestamp/masa berlaku penawaran.
- **Acceptance FLT-05-AC01:** Dengan penerbangan lintas zona dan tiba esok hari, ketika detail dibuka, jam lokal, label zona dan +1 hari tepat; durasi tidak dihitung dari selisih jam lokal mentah.

### FLT-06 Pulang pergi

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin memilih kombinasi pulang pergi yang valid agar harga tidak menyesatkan.
- **Perilaku produk:** Harga kombinasi berangkat-pulang diperoleh dari supplier; tidak menjumlahkan penawaran terpisah yang belum kompatibel.
- **Acceptance FLT-06-AC01:** Dengan offer pulang pergi tertentu, ketika segmen pulang diganti, sistem menggunakan kombinasi dan total supplier yang kompatibel, bukan sekadar menjumlahkan kartu.

### FLT-07 Kejelasan cakupan

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin mengetahui batas layanan pencarian agar tidak mengira tiket sudah dipesan.
- **Perilaku produk:** Halaman detail menyatakan pencarian saja; tidak meminta pembayaran atau menerbitkan konfirmasi tiket.
- **Acceptance FLT-07-AC01:** Dengan offer terpilih, ketika membuka detail, tidak ada pembayaran, konfirmasi booking, atau klaim kursi terjamin.

### FLT-08 Gangguan supplier

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin membedakan gangguan dari hasil kosong agar dapat memilih retry atau mengganti rute.
- **Perilaku produk:** Timeout dan harga tak tersedia dibedakan dari hasil kosong; retry dan ubah pencarian tersedia.
- **Acceptance FLT-08-AC01:** Dengan supplier timeout, ketika batas waktu tercapai, tampil gangguan dan retry; respons kosong yang valid tampil hasil tidak ditemukan sebagai kondisi berbeda.

## 5. Data dan validasi

Data minimum spesifik modul: airport_id asal/tujuan; departure/return_date; adults/children/infants; cabin; supplier_offer_id; segments; timezone tiap bandara; total_price IDR; baggage; expires_at bila disediakan; fetched_at.

Field wajib dibedakan dari opsional pada form. Validasi dilakukan di client untuk kenyamanan dan di server sebagai otoritas. ID resource harus valid dan berstatus sesuai tindakan; harga/status dari browser tidak dipercaya. Jika suatu field hanya berlaku pada mode tertentu, field tersebut tidak diwajibkan pada mode lain. File privat mengikuti kontrol akses dan batas tipe/ukuran yang disepakati, bukan URL publik permanen.

Snapshot transaksi/penawaran memuat konteks saat persetujuan. Perubahan master data tidak mengubah transaksi lama. Detail kontrak data dan format error diturunkan ke SRS/API setelah review engineering; field konseptual di sini bukan skema database final.

## 6. Status dan aturan khusus

Search: idle → loading → results/empty/error. Offer: fresh → expired/unavailable. Jika expiry tidak diberikan, tampil fetched_at dan harga dapat berubah; jangan menciptakan jaminan harga. Batas timeout usulan 30 detik mengikuti kontrak bersama.

Perubahan tersimpan memiliki ID, waktu, aktor dan jejak audit sesuai tingkat risikonya. Kontrak bersama mengatur booking, hold, payment, refund, payout dan inquiry. Halaman konfirmasi wajib menggunakan status otoritatif. Input invalid tidak membuang draft; resource berubah/tidak aktif saat submit diperiksa ulang sebelum tindakan dijalankan.

## 7. Dependensi dan ownership

Kontrak supplier yang mengizinkan search-only, airport mapping, kredensial server dan kuota. Phase 10 monitoring; tidak bergantung pada gateway untuk scope P0.

Product Owner menyetujui scope serta kebijakan. BA menjaga mapping ID dan keputusan; UX memvalidasi prototipe; Engineering menetapkan kontrak dan keandalan; QA menyediakan bukti AC; Operations/Finance/mitra memvalidasi proses yang menjadi kewenangannya. Owner implementasi teknis final mengikuti penugasan proyek, bukan diasumsikan sudah tersedia.

## 8. Notifikasi, error dan akses

Notifikasi transaksi dikirim setelah fakta backend tersimpan. Tidak mengirim status confirmed untuk request atau quote. Gagal kirim email tidak membatalkan fakta transaksi; retry aman dan delivery log diperlukan. Inquiry/booking/payment/payout menggunakan jenis pesan berbeda; penerbangan search-only tidak memicu email konfirmasi tiket.

Server memeriksa hak akses per objek dan konteks sesi. Pengunjung hanya membaca data publik; pelanggan hanya aktivitas sendiri; mitra dibatasi organisasi dan assignment; admin dibatasi role. Error tidak menampilkan data organisasi lain, dokumen privat, token, atau rincian pembayaran sensitif.

## 9. Pengukuran keberhasilan

flight_search_started; supplier_response; flight_offer_viewed; flight_search_failed. Success = respons valid ÷ search terkirim; latency p95 dan kuota per supplier dipantau Engineering.

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

Supplier tidak tersedia: blok gate scope lengkap dan catat rilis bertahap; kuota mahal: throttle/cache berizin; harga basi: timestamp dan refresh; secret hanya di server.

Keputusan general yang memengaruhi fase: **D-01, D-07**. Rinciannya pada decision log PRD General. Sampai diputuskan, gunakan baseline untuk estimasi dan sandbox; jangan mengaktifkan kebijakan keuangan/kontrak yang belum disetujui. Risiko provider dicatat sebagai blocker dengan PIC, bukan diam-diam mengurangi scope.

## 13. Pengembangan setelah MVP

Daftar lanjutan: PNR, pembayaran tiket, issuance, e-ticket, seat/baggage add-on, check-in, flight refund/reschedule, bundling. Perubahan menjadi P0 memerlukan dampak terhadap UX, data, kontrak mitra, integrasi, UAT, biaya dan jadwal. Tidak ada janji bahwa semua kapabilitas tersebut tersedia hanya karena arsitektur disebut siap integrasi.

## 14. Referensi

Acuan langsung adalah PRD General v1.0 beserta sumber resmi pada bagian 25. Dokumen ini menyatakan rancangan Gobuking, bukan kebijakan atau arsitektur internal kompetitor. [Kembali ke indeks](00_Index_Phase.md).
