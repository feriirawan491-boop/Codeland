# PRD General Gobuking MVP

| Atribut | Isi |
|---|---|
| Produk | Gobuking |
| Domain produk | gobuking.com |
| Versi dokumen | 1.0 |
| Tanggal | 28 Oktober 2026 |
| Status | Draft untuk review bisnis, produk, desain, dan engineering |
| Jenis dokumen | Product Requirements Document tingkat general |
| Pemilik keputusan | Pemilik bisnis Gobuking atau Product Owner yang ditunjuk |
| Pembaca | Klien, Project Manager, Business Analyst, UX/UI Designer, Engineering, QA, Operasional, Finance, dan tim kemitraan |

## 1. Ringkasan produk

Gobuking adalah platform Online Travel Agency dan marketplace venue untuk pasar Indonesia. Pelanggan dapat menemukan hotel, home rental, penerbangan, rental mobil, venue MICE, dan wedding venue melalui satu platform. Mitra menyediakan serta memenuhi layanan, sedangkan Gobuking menyediakan distribusi, pengalaman pemesanan, pengelolaan transaksi, dan dukungan operasional.

Pengalaman pencarian dan pemesanan menggunakan Booking.com sebagai acuan utama untuk kemudahan navigasi, keterbacaan informasi, filter, peta, pilihan tarif, dan transparansi harga. Traveloka menjadi acuan penerbangan dan transaksi perjalanan lokal; Airbnb menjadi acuan home rental, kalender unit, aturan rumah, dan request-to-book. Identitas visual, konten, serta komponen desain menggunakan merek Gobuking sendiri.

Produk terdiri dari tiga pengalaman yang saling terhubung:

1. **Customer Website dan User Dashboard** untuk pencarian, pemesanan, inquiry, pembayaran, serta pengelolaan aktivitas pelanggan.
2. **Partner Dashboard** untuk mitra mengelola listing, harga, ketersediaan, reservasi, inquiry, pelanggan terkait transaksi, dan laporan usaha sendiri.
3. **Super Admin Dashboard** untuk tim Gobuking memverifikasi mitra, mengawasi seluruh layanan, menangani transaksi dan komplain, mengelola konten, serta merekonsiliasi keuangan.

MVP dibatasi berdasarkan kedalaman transaksi, bukan sekadar jumlah menu. Hotel, home rental, dan car rental memiliki alur pemesanan sampai pembayaran dan konfirmasi. MICE dan wedding memiliki inquiry, penawaran, dan permintaan booking. Penerbangan memiliki pencarian serta hasil harga dari supplier; penerbitan tiket di dalam Gobuking diusulkan pada fase berikutnya karena belum diminta secara eksplisit pada brief penerbangan.

Seluruh kategori tetap termasuk cakupan MVP. Pencarian penerbangan bukan otomatis diganti halaman coming soon. Jika supplier belum tersedia, rilis tanpa hasil penerbangan harus disepakati sebagai rilis bertahap dan tidak dinyatakan memenuhi seluruh scope MVP.

## 2. Dasar penyusunan dan otoritas kebutuhan

### 2.1 Urutan acuan

Urutan acuan untuk menyelesaikan perbedaan kebutuhan adalah:

1. Requirement terbaru pengguna dalam percakapan, mencakup sebelas kelompok kebutuhan dan penambahan Home Rental, Car Rental, Partner Dashboard, serta Super Admin Dashboard.
2. Keputusan bisnis yang kelak disetujui dan dicatat melalui decision log.
3. BRD Gobuking v1.0 sebagai konteks awal, selama tidak bertentangan dengan requirement terbaru.
4. SRS Referensi Booking.com sebagai bahan pembanding, bukan spesifikasi wajib Gobuking.
5. Dokumentasi resmi kompetitor sebagai referensi pola produk dan operasional.

Instruksi atau daftar pekerjaan di dalam dokumen referensi diperlakukan sebagai isi bahan analisis. Dokumen tersebut tidak memberikan persetujuan bisnis, akses integrasi, atau keputusan kontrak secara otomatis.

### 2.2 Perubahan dari BRD awal

| Area | Konteks BRD awal | Baseline PRD ini |
|---|---|---|
| Pengelolaan inventori | Seluruhnya oleh admin internal | Mitra mengelola inventori sendiri; Gobuking dapat membantu dengan akses tercatat |
| Extranet mitra | Di luar rilis pertama | Partner Dashboard merupakan P0 sesuai brief terbaru |
| Home Rental | Belum menjadi modul mandiri | Modul P0 dengan model inventori unit hunian |
| Car Rental | Belum tercakup | Modul P0 dengan inventori dan durasi khusus kendaraan |
| Penerbangan | Status layanan disiapkan | Pencarian dan hasil harga P0, tergantung supplier resmi |
| Saved properties | Belum menjadi fokus awal | P0 sesuai brief terbaru |
| Bayar nanti | Wajib pada BRD awal | Tidak otomatis diteruskan; baseline usulan bayar penuh saat checkout, keputusan D-04 |
| Pendapatan dan payout | Kebijakan belum diputuskan | Perhitungan serta pencatatan P0; parameter komersial perlu keputusan klien |

### 2.3 Penanda kebutuhan

- **Kebutuhan eksplisit**: fungsi yang disebut pengguna pada brief terbaru.
- **Baseline usulan**: pilihan produk yang dibuat untuk melengkapi brief agar dapat diestimasi; belum merupakan persetujuan klien.
- **P0**: wajib tersedia agar MVP lengkap sesuai baseline dapat diterima.
- **P1**: pengembangan setelah MVP atau perubahan scope yang membutuhkan estimasi tambahan.
- **P2**: pengembangan lanjutan setelah validasi bisnis.
- **Gate**: syarat aktivasi fitur atau go-live; bukan alasan menghapus requirement tanpa persetujuan.

Dokumen ini menjelaskan perilaku produk, batas scope, aturan bisnis, dan kriteria penerimaan umum. Kontrak API, skema database rinci, desain layar, serta test case lengkap diturunkan setelah baseline disepakati.

### 2.4 Istilah yang digunakan

| Istilah | Makna dalam dokumen |
|---|---|
| OTA | Platform perantara pemesanan layanan perjalanan |
| Extranet | Dashboard yang digunakan mitra untuk mengelola usaha di platform |
| PMS | Sistem pengelolaan operasional dan reservasi properti |
| Channel manager | Sistem penghubung distribusi harga, stok, dan reservasi ke beberapa kanal penjualan |
| Rate plan | Pilihan tarif dengan ketentuan makan, pembayaran, dan pembatalan tertentu |
| Hold | Pencadangan stok sementara yang memiliki batas waktu |
| Request-to-book | Permintaan reservasi yang memerlukan persetujuan sebelum menjadi booking final |
| Settlement dan payout | Perhitungan penyelesaian hak/kewajiban, lalu pembayaran hak mitra |
| Maker-checker | Pembuatan dan persetujuan transaksi keuangan oleh dua aktor berbeda |
| Tenant | Lingkup organisasi mitra yang datanya harus terpisah dari organisasi lain |
| MICE | Meetings, Incentives, Conferences, and Exhibitions; kebutuhan venue acara bisnis |
| UAT | Pengujian penerimaan oleh perwakilan pengguna dan pemilik proses bisnis |

## 3. Masalah dan tujuan

### 3.1 Masalah yang diselesaikan

Pelanggan membutuhkan proses pencarian yang mudah, harga yang dapat dibandingkan, kejelasan ketentuan, dan kepastian status pemesanan. Penyelenggara acara membutuhkan informasi kapasitas dan paket venue yang terstruktur sebelum meminta penawaran. Mitra membutuhkan kanal penjualan dengan kontrol atas produk dan ketersediaan. Tim Gobuking membutuhkan pengawasan lintas mitra tanpa harus memasukkan seluruh perubahan inventori secara manual.

### 3.2 Tujuan MVP

| ID | Tujuan | Bukti keberhasilan |
|---|---|---|
| OBJ-01 | Pelanggan dapat menemukan layanan yang relevan tanpa dipaksa login | Pencarian, filter, detail, dan peta publik dapat digunakan pada perangkat mobile dan desktop |
| OBJ-02 | Hotel, home rental, dan car rental dapat ditransaksikan secara konsisten | Booking, pembayaran, konfirmasi, dan pembatalan memiliki status serta jejak yang benar |
| OBJ-03 | Mitra dapat menjalankan operasional listing sendiri | Mitra dapat memperbarui harga/stok, menerima reservasi, dan melihat hak pembayarannya |
| OBJ-04 | Venue menghasilkan prospek yang dapat ditindaklanjuti | Inquiry memiliki pemilik, batas respons, penawaran, dan status yang bisa dilacak |
| OBJ-05 | Pelanggan memperoleh hasil pencarian penerbangan yang nyata | Hasil berasal dari supplier yang disetujui dan menampilkan harga serta itinerary yang relevan |
| OBJ-06 | Tim Gobuking mengendalikan operasional dan keuangan | Tersedia antrean pengecualian, rekonsiliasi, refund, payout, serta audit tindakan |

Target volume booking, nilai transaksi, inquiry, dan target bisnis enam bulan ditetapkan pemilik bisnis setelah inventori, pemasaran, dan biaya akuisisi dapat diestimasi. Target teknis usulan tercantum pada bagian 18.

## 4. Model bisnis dan pembagian tanggung jawab

### 4.1 Pihak dalam ekosistem

| Pihak | Tanggung jawab utama | Hubungan pendapatan |
|---|---|---|
| Vendor pengembang | Membangun, menguji, menyerahkan, dan memelihara aplikasi sesuai kontrak | Biaya pengembangan/maintenance; tidak otomatis menerima komisi booking |
| Operator Gobuking | Kemitraan, pemasaran, platform, CS, transaksi, dan pengawasan | Komisi atau margin sesuai perjanjian mitra |
| Mitra hotel/home/venue/rental | Menyediakan layanan, data produk, ketersediaan, dan pemenuhan reservasi | Hak pembayaran atas layanan setelah potongan yang disepakati |
| Supplier penerbangan | Menyediakan jadwal, harga, dan kemampuan layanan sesuai kontrak API | Biaya atau pembagian pendapatan menurut kontrak supplier |
| Penyedia pembayaran | Memproses pembayaran/refund dan menyediakan status transaksi | Biaya pemrosesan sesuai kontrak |

Pengelolaan listing tidak memindahkan pengelolaan fisik properti atau armada kepada Gobuking. Siapa yang berwenang mewakili pemilik harus ditentukan pada proses onboarding.

### 4.2 Baseline komersial usulan

Untuk MVP transaksi hotel, home rental, dan car rental, usulan baseline adalah pelanggan membayar penuh melalui satu payment gateway yang dikontrak Gobuking. Hak mitra dibayarkan setelah layanan selesai dan rekonsiliasi terpenuhi, menggunakan batch mingguan dengan proses maker-checker. Jadwal tersebut merupakan usulan Gobuking, bukan aturan yang disalin dari kompetitor.

Model pendapatan usulan adalah komisi persentase per kontrak mitra pada satu dasar nilai yang didefinisikan Finance. Besaran, komponen dasar komisi, pajak, biaya gateway, serta penanggung diskon belum dianggap final. Tidak ada nilai komisi default yang diam-diam diterapkan ketika kontrak belum diisi.

Perubahan menjadi model harga net, bayar di properti, bayar nanti, atau payout sebelum layanan selesai memerlukan evaluasi dampak harga, risiko, refund, dan rekonsiliasi. Menerima pembayaran melalui platform tidak dengan sendirinya menentukan model kontrak atau pengakuan pendapatan akuntansi.

### 4.3 Hubungan usaha dengan mitra

Sebelum listing menerima pembayaran, mitra harus memiliki perjanjian aktif, rekening tervalidasi, kebijakan harga/pembatalan, PIC operasional, dan pembagian tanggung jawab overbooking atau kegagalan layanan. Kesepakatan juga menetapkan siapa menanggung diskon, kapan hak pembayaran menjadi eligible, serta penanganan perselisihan.

MVP menyediakan pencatatan dokumen dan persetujuan perjanjian; penandatanganan elektronik terintegrasi bukan P0. Perubahan rekening dan kebijakan komersial harus melalui verifikasi serta berlaku prospektif, dengan versi lama tetap melekat pada transaksi sebelumnya.

## 5. Pengguna dan hak akses

| Aktor | Kebutuhan | Batas akses |
|---|---|---|
| Pengunjung | Menjelajah, mencari, membandingkan, mengirim inquiry | Tidak melihat data transaksi privat |
| Pelanggan terdaftar | Checkout, membayar, melihat pesanan, menyimpan properti, mengulas | Hanya akun dan aktivitas sendiri |
| Partner Owner | Mengelola usaha, listing, staf, rekening, dan laporan | Hanya organisasi mitra serta listing yang menjadi haknya |
| Partner Operations | Memperbarui kalender, menangani booking/inquiry, layanan tamu | Listing yang ditugaskan; tidak mengubah rekening atau komisi |
| Partner Finance | Rekonsiliasi, statement, dan status payout | Data keuangan organisasi sendiri, akses tamu terbatas |
| Platform Operations/CS | Menangani booking, inquiry, kasus, dan eskalasi | Sesuai penugasan; tidak menyetujui payout sendiri |
| Platform Content/Partnership | Verifikasi mitra dan moderasi listing | Tidak mengubah status pembayaran atau mengeksekusi refund |
| Platform Finance | Rekonsiliasi, refund, payout, dan laporan | Hak maker atau checker terpisah |
| Super Admin | Konfigurasi platform, peran, kebijakan, dan akses darurat | Akses berisiko tetap diaudit; tidak melewati kontrol Finance secara diam-diam |

Satu organisasi mitra dapat mengelola beberapa properti dan kategori layanan. Menu disesuaikan kategori dan izin. Akun mitra hotel tidak otomatis memiliki akses supplier penerbangan. Pengguna yang sekaligus menjadi pelanggan dan staf mitra berpindah konteks dengan jelas.

## 6. Ruang lingkup dan batas MVP

### 6.1 Matriks kedalaman layanan

| Layanan | Pencarian dan detail P0 | Hasil tindakan P0 | Dependensi utama | Pengembangan P1 |
|---|---|---|---|---|
| Hotel | Destinasi, tanggal, tamu, kamar, filter, peta, tarif, ulasan | Instant booking atau request-to-book, bayar penuh, voucher | Inventori mitra dan gateway | Channel manager, campuran tipe kamar, reschedule otomatis |
| Home Rental | Destinasi, tanggal, tamu, rumah/villa/apartemen satu unit penuh, fasilitas, peta | Request-to-book atau instant booking yang memenuhi syarat, bayar penuh, voucher | Kalender unit dan aturan mitra | Private/shared room, co-host lanjutan, sewa bulanan |
| Flights | Sekali jalan/pulang pergi, bandara, tanggal, penumpang, kelas, harga dan itinerary | Melihat detail pilihan penerbangan; belum menerima pembayaran tiket | Supplier live search berizin | Booking, PNR, issuance, tiket, ancillaries, refund/reschedule supplier |
| MICE | Venue, ruang, lokasi, kapasitas per layout, fasilitas, paket | Inquiry, penawaran, permintaan booking yang dilacak | Tim venue dan SLA respons | DP online, kontrak digital, room block |
| Wedding | Venue, galeri, kapasitas, paket, harga beserta basisnya | Inquiry, penawaran, permintaan booking yang dilacak | Tim venue dan SLA respons | DP/termin online, kontrak digital |
| Car Rental | Kota, tanggal/jam, durasi, dengan/tanpa pengemudi, kendaraan dan penyedia | Request-to-book, bayar penuh setelah persetujuan, voucher | Kalender armada dan kemampuan mitra | Instant booking bersyarat, API fleet/supplier, one-way rental |

### 6.2 Cakupan bersama

P0 mencakup website responsif, login pelanggan saat checkout, akun, saved properties, notifikasi email, Partner Dashboard, Super Admin Dashboard, CMS dasar, dukungan pelanggan berbasis tiket, laporan dasar, refund, dan payout terkontrol. Integrasi pembayaran harus bekerja di sandbox; transaksi uang nyata hanya diaktifkan setelah gate produksi terpenuhi.

Enam kategori tampil pada navigasi utama. Venue menggunakan bahasa CTA inquiry/permintaan booking, sementara penerbangan search-only menampilkan penjelasan bahwa pembelian tiket belum tersedia di Gobuking. Tidak ada tombol pembayaran yang berakhir pada flow yang belum didukung.

### 6.3 Batas yang disengaja

MVP tidak mencakup aplikasi native, multi-currency, multi-language, loyalty bertingkat, wallet, pinjaman/PayLater, multi-product cart, dynamic package flight+hotel, tiket penerbangan internal, AI pricing, marketplace asuransi, manajemen housekeeping lengkap, telematika kendaraan, penjualan rumah, atau sewa hunian tahunan.

Baseline satu pesanan adalah satu mitra, satu listing/produk, dan satu rentang layanan. Hotel mendukung beberapa kamar dari satu tipe dan satu rate plan dalam satu pesanan; campuran tipe kamar/tarif dilakukan sebagai pesanan terpisah. Batas ini harus terlihat sebelum checkout. Integrasi channel manager produksi bersifat P1 kecuali disepakati sebagai ketergantungan mitra peluncuran.

## 7. Struktur navigasi dan submenu

### 7.1 Website pelanggan

| Menu utama | Halaman atau submenu P0 |
|---|---|
| Beranda | Tab pencarian enam layanan, destinasi unggulan, penawaran, pilihan hotel/home, venue pilihan, cara kerja |
| Hotel | Hasil pencarian, filter/sort, tampilan daftar/peta, detail properti, kamar dan tarif, ulasan |
| Home Rental | Hasil pencarian, daftar/peta, detail unit, kalender, fasilitas, aturan rumah, profil pengelola ringkas |
| Flights | Form pencarian, hasil berangkat/pulang, filter/sort, detail itinerary, ketentuan harga |
| MICE | Daftar venue, detail ruang, kapasitas per layout, paket, formulir inquiry |
| Wedding | Daftar venue, detail, galeri, paket, inquiry dan permintaan booking |
| Car Rental | Pilih dengan/tanpa pengemudi, hasil, detail penyedia/kendaraan/paket, permintaan booking |
| Penawaran | Promo aktif, syarat, periode, produk yang memenuhi ketentuan |
| Bantuan | FAQ, cara memesan, kebijakan umum, tiket bantuan, kontak |
| Jadi Mitra | Informasi kerja sama, pendaftaran, status pengajuan, login mitra |
| Akun Saya | Pesanan, riwayat, inquiry/penawaran, properti tersimpan, profil, keamanan, bantuan |
| Footer | Tentang Gobuking, syarat layanan, privasi, kebijakan pembatalan, kontak perusahaan |

### 7.2 Partner Dashboard

| Menu | Submenu P0 |
|---|---|
| Ringkasan | Booking masuk, kedatangan/pengambilan hari ini, inquiry, stok rendah, estimasi hak mitra |
| Usaha Saya | Profil usaha, dokumen verifikasi, perjanjian, PIC, rekening |
| Listing | Hotel, Home Rental, MICE, Wedding, Car Rental sesuai jenis usaha; draft, review, aktif, ditangguhkan |
| Harga dan Ketersediaan | Kalender, stok/alokasi, tarif, rate plan, stop sell, minimum durasi, tanggal khusus |
| Reservasi | Semua, perlu respons, menunggu bayar, terkonfirmasi, berjalan, selesai, dibatalkan, no-show |
| Inquiry dan Penawaran | MICE/Wedding, penugasan PIC, detail kebutuhan, lampiran, versi penawaran, permintaan booking |
| Operasional | Kedatangan/keberangkatan; pengambilan/pengembalian dan penugasan kendaraan/pengemudi |
| Pelanggan | Kontak dan riwayat transaksi yang terkait usaha sendiri; tanpa direktori seluruh pengguna |
| Ulasan | Ulasan terpublikasi, balasan, laporan pelanggaran |
| Keuangan | Penjualan, komisi/potongan, refund terkait, statement, saldo eligible, riwayat payout, ekspor |
| Tim dan Akses | Undang staf, peran, assignment listing, nonaktifkan akses |
| Bantuan dan Aktivitas | Tiket dukungan, notifikasi, riwayat tindakan organisasi |

Menu kendaraan menampilkan armada, kelas kendaraan, kalender maintenance, paket dengan/tanpa pengemudi, dan assignment. Menu venue menampilkan ruang, layout, kapasitas, paket, dan kalender acara. Menu penginapan menampilkan kamar atau unit hunian. Penerbangan dikelola melalui supplier dan platform, bukan CRUD tarif oleh mitra hotel.

### 7.3 Super Admin Dashboard

| Menu | Submenu P0 |
|---|---|
| Ringkasan Platform | Funnel, booking, inquiry, GMV, estimasi pendapatan platform, alert operasional |
| Mitra | Pengajuan, verifikasi, organisasi, kontrak/komisi, rekening, penugasan PIC, penangguhan |
| Katalog | Moderasi listing enam kategori yang relevan, taksonomi, duplikasi, kelengkapan konten |
| Reservasi | Semua layanan transaksional, pencarian, detail, timeline, exception queue, pembatalan/no-show |
| Venue CRM | Inquiry, SLA, PIC, penawaran, permintaan booking, alasan menang/kalah |
| Pelanggan | Profil terbatas, transaksi, tiket, pembatasan akun, permintaan data |
| Pembayaran | Transaksi gateway, webhook, pembayaran belum cocok, rekonsiliasi, refund |
| Settlement Mitra | Hak mitra, batch payout, maker-checker, bukti transfer, status gagal, statement |
| Laporan | Penjualan, GMV, komisi, refund, payout, performa mitra, inquiry, ekspor |
| CMS dan Promosi | Banner, destinasi, penawaran, halaman bantuan/kebijakan, SEO metadata |
| Ulasan dan Konten | Moderasi, laporan pelanggaran, balasan mitra |
| Dukungan | Tiket, eskalasi, kasus overbooking, relokasi, gangguan layanan |
| Integrasi | Status supplier penerbangan, gateway, email/OTP, peta, log kegagalan tersanitasi |
| Konfigurasi dan Akses | Role, staf, kebijakan default, SLA, wilayah/waktu, feature flags, audit |

## 8. Prinsip pengalaman pengguna

1. Pengunjung bebas mencari dan membaca detail tanpa login. Login diwajibkan ketika mulai checkout atau mengirim permintaan booking yang mengikat akun. Login sukarela untuk akun/properti tersimpan tidak menghalangi browsing.
2. Search bar mengikuti kategori: tamu dan kamar untuk hotel; jumlah tamu untuk home; rute dan penumpang untuk flights; peserta/layout untuk MICE; tamu/paket untuk wedding; lokasi serta jam untuk kendaraan.
3. Harga hasil bertanggal menampilkan total untuk konteks pencarian beserta unit pembanding yang jelas. Harga tanpa tanggal diberi label indikatif, bukan janji ketersediaan.
4. Tamu melihat kebijakan pembatalan, metode konfirmasi, biaya wajib, dan komponen yang dibayar terpisah sebelum menyetujui transaksi.
5. Daftar dan peta memakai filter yang sama. Pada mobile, filter serta peta dapat dibuka sebagai panel tanpa kehilangan hasil.
6. Input dan pilihan dipertahankan ketika login, kembali ke hasil, atau terjadi kegagalan validasi. Perubahan harga membutuhkan persetujuan ulang.
7. Loading, hasil kosong, listing penuh, mitra belum merespons, pembayaran pending, dan kegagalan supplier memiliki pesan serta tindakan lanjutan yang spesifik.
8. Tombol membedakan tindakan: “Pesan”, “Ajukan booking”, “Kirim inquiry”, “Bayar”, dan “Lihat penerbangan”. Tidak menyamakan pengiriman formulir dengan konfirmasi layanan.
9. Tidak menampilkan ulasan, diskon, sisa stok, atau aktivitas pelanggan yang dibuat-buat. Label sponsor, jika kelak ada, harus dibedakan dari rekomendasi organik.
10. Branding, warna, ikon, foto, dan teks Gobuking dibuat sendiri. Kesamaan dengan kompetitor berfokus pada pola interaksi yang mudah dipahami; keputusan visual rinci melalui review prototipe.

## 9. Kebutuhan modul layanan

Seluruh ID di bagian ini adalah ID PRD baru, bukan pengganti langsung ID SRS lama. Kecuali disebut P1, kebutuhan pada tabel merupakan P0.

### 9.1 Homepage dan penemuan

| ID | Kebutuhan | Perilaku yang diharapkan |
|---|---|---|
| HOME-01 | Pencarian bertab | Enam kategori memiliki form, validasi, dan tujuan hasil masing-masing |
| HOME-02 | Destinasi unggulan | CMS mengatur kota, foto, urutan, dan tautan kategori; tujuan tanpa inventori tidak menjanjikan stok |
| HOME-03 | Special deals | Hanya promo aktif yang memenuhi periode dan aturan tampil; label menjelaskan dasar diskon |
| HOME-04 | Konten unggulan | Hotel, home, venue, dan rental pilihan berdasarkan kurasi transparan; tidak mengaku hasil personalisasi |
| HOME-05 | Navigasi publik | Browse, bantuan, dan informasi mitra dapat diakses tanpa akun |
| HOME-06 | Pencarian lokasi | Autocomplete membedakan kota, area, properti, dan bandara sesuai kategori |

Penerimaan utama: mengganti tab tidak menggunakan field kategori lain; melakukan pencarian tanpa akun berhasil; banner tidak menautkan ke listing ditangguhkan.

### 9.2 Hotel

| ID | Kebutuhan | Perilaku yang diharapkan |
|---|---|---|
| HTL-01 | Search | Destinasi/properti, check-in/out, dewasa, anak beserta usia, jumlah kamar; checkout setelah check-in |
| HTL-02 | Filter dan sort | Harga total, skor ulasan, bintang, fasilitas, tipe properti, sarapan, kebijakan batal; sort harga/skor/relevansi dasar |
| HTL-03 | Listing cards | Foto, nama, area/jarak berlabel, kelas bintang bila valid, skor dan jumlah ulasan, total harga, kebijakan utama |
| HTL-04 | Peta | Pin harga dan kartu tersinkron pada dataset/filter yang sama; list tetap berfungsi bila peta gagal |
| HTL-05 | Detail properti | Galeri, deskripsi, lokasi, fasilitas, aturan anak, check-in/out, aksesibilitas yang dinyatakan mitra |
| HTL-06 | Kamar dan rate plan | Kapasitas, tempat tidur, fasilitas, pilihan makan, pembatalan, harga, stok dan jumlah kamar per pilihan |
| HTL-07 | Validasi ketersediaan | Periksa semua malam, okupansi, stok bersama antar-rate-plan, dan stop sell sebelum membuat hold |
| HTL-08 | Metode booking | Mode instant hanya untuk inventori terjamin; properti lain memakai request-to-book |
| HTL-09 | Ulasan | Skor 1–10, jumlah, teks, kategori opsional, sortir; bintang properti terpisah dari skor tamu |

Baseline satu pesanan memakai satu tipe kamar dan satu rate plan; beberapa kamar pada pilihan tersebut diperbolehkan jika stok dan kapasitas mencukupi. Permintaan khusus tidak dianggap jaminan pemenuhan.

Penerimaan utama: tiga malam memerlukan stok pada ketiga malam; dua rate plan dari stok lima kamar tidak menghasilkan sepuluh kamar; total harga berubah konsisten ketika jumlah kamar/tamu berubah.

### 9.3 Home Rental

| ID | Kebutuhan | Perilaku yang diharapkan |
|---|---|---|
| HMR-01 | Search dan filter | Destinasi, tanggal, tamu, harga, kamar tidur, tempat tidur, kamar mandi, dapur, kolam, parkir, aturan relevan |
| HMR-02 | Model unit | MVP menyewakan rumah/villa/apartemen satu unit penuh; tipe privasi dijelaskan eksplisit |
| HMR-03 | Detail hunian | Galeri, fasilitas, konfigurasi ruang, kapasitas maksimal, aturan rumah, check-in, biaya kebersihan jika ada |
| HMR-04 | Kalender | Unit tersedia/tidak tersedia per malam, minimum menginap, lead time, buffer pembersihan, blok pemilik |
| HMR-05 | Pengelola dan lokasi | Nama pengelola/mitra, status verifikasi yang akurat, area perkiraan publik; alamat rinci sesuai kebijakan akses |
| HMR-06 | Booking | Request-to-book default; instant dapat diaktifkan setelah verifikasi keandalan inventori |
| HMR-07 | Harga dan kebijakan | Total menginap, biaya wajib, biaya tambahan yang dipilih, deposit terpisah, kebijakan batal |
| HMR-08 | Ulasan dan simpan | Ulasan terverifikasi dan saved properties menggunakan kapabilitas bersama |

Villa yang muncul pada Hotel dan Home Rental harus memiliki sumber inventori yang sama. MVP tidak menjual bersamaan satu rumah penuh dan kamar di dalam rumah yang sama; konfigurasi saling bergantung tersebut ditunda sampai tersedia kontrol inventori yang memadai.

Penerimaan utama: satu unit tidak dapat dikonfirmasi untuk rentang malam yang bertabrakan; buffer pembersihan mengurangi tanggal yang dapat dipesan; harga kebersihan tidak muncul mendadak setelah checkout.

### 9.4 Flights

| ID | Kebutuhan | Perilaku yang diharapkan |
|---|---|---|
| FLT-01 | Form pencarian | Sekali jalan/pulang pergi, asal/tujuan, tanggal, dewasa/anak/bayi, kelas kabin |
| FLT-02 | Validasi | Bandara asal berbeda dari tujuan, tanggal pulang valid, batas usia/jumlah penumpang mengikuti supplier |
| FLT-03 | Live search | Jadwal dan harga berasal dari supplier resmi; cakupan awal domestik Indonesia sebagai usulan |
| FLT-04 | Hasil dan filter | Maskapai, waktu lokal dan zona waktu, durasi, transit, kelas, harga total penumpang; filter maskapai/transit/jam dan sort harga/durasi |
| FLT-05 | Detail itinerary | Segmen, bandara, pergantian hari, bagasi yang diberikan supplier, ketentuan tarif, timestamp/masa berlaku penawaran |
| FLT-06 | Pulang pergi | Harga kombinasi berangkat-pulang diperoleh dari supplier; tidak menjumlahkan penawaran terpisah yang belum kompatibel |
| FLT-07 | Kejelasan cakupan | Halaman detail menyatakan pencarian saja; tidak meminta pembayaran atau menerbitkan konfirmasi tiket |
| FLT-08 | Gangguan supplier | Timeout dan harga tak tersedia dibedakan dari hasil kosong; retry dan ubah pencarian tersedia |

Jika supplier hanya mengizinkan pencarian untuk kanal yang juga menerbitkan tiket, kecocokan kontrak menjadi gate pemilihan supplier. Redirect ke supplier merupakan alternatif hanya jika kontrak mendukung dan klien menyetujuinya. Ketiadaan supplier bukan dasar menggunakan hasil statis seolah harga nyata.

**P1 penerbangan** mencakup repricing, data penumpang, pemesanan supplier, PNR, batas pembayaran, payment, ticket issuance, e-ticket, refund/reschedule, dan penanganan gagal terbit. Pembayaran berhasil tidak boleh dianggap bukti tiket telah terbit.

Penerimaan utama P0: hasil nyata untuk rute uji disepakati, format pulang pergi benar, gangguan supplier tertangani, dan tidak ada tombol pembelian yang menyesatkan.

### 9.5 MICE

| ID | Kebutuhan | Perilaku yang diharapkan |
|---|---|---|
| MIC-01 | Search venue | Kota, tanggal/jam atau tanggal fleksibel, peserta, jenis acara, layout |
| MIC-02 | Filter | Kapasitas per layout, ruang indoor/outdoor, AV, Wi-Fi, parkir, katering, aksesibilitas, rentang harga jika dapat dibandingkan |
| MIC-03 | Detail ruang | Venue induk, ruang, luas, foto, layout, kapasitas tiap layout, fasilitas, kebijakan penggunaan |
| MIC-04 | Paket | Per jam/hari/peserta, minimum peserta, durasi, isi paket, pajak/biaya, label harga indikatif atau penawaran |
| MIC-05 | Inquiry | Nama, kontak terverifikasi, perusahaan, tanggal/waktu, peserta, layout, budget opsional, kebutuhan kamar/AV/katering, catatan |
| MIC-06 | Penanganan lead | Nomor inquiry, PIC mitra, SLA, riwayat respons, penawaran versi, lampiran aman |
| MIC-07 | Permintaan booking | Pelanggan memilih penawaran yang berlaku lalu mengajukan permintaan booking setelah login; status tetap menunggu kesepakatan final |

Kapasitas dihitung per ruang dan layout, bukan satu angka kapasitas properti. Tanggal yang tampak kosong belum merupakan jaminan venue tersedia sampai mitra memverifikasi. Satu inquiry ditujukan ke satu mitra/venue; pengiriman massal ke banyak venue merupakan P1.

Jika ruang yang sama dijual sebagai MICE dan wedding, keduanya menggunakan resource serta kalender operasional yang sama. Mitra dapat mencatat blok acara yang sudah disepakati di luar platform; inquiry dan permintaan yang belum final tidak otomatis memblokir ruang. Tanggal tetap harus diperiksa ulang sebelum penawaran atau tindak lanjut kontrak.

### 9.6 Wedding Venue

| ID | Kebutuhan | Perilaku yang diharapkan |
|---|---|---|
| WED-01 | Search dan filter | Lokasi, tanggal/fleksibel, jumlah tamu, indoor/outdoor, tipe venue, paket dan budget |
| WED-02 | Detail dan galeri | Foto, area acara, kapasitas duduk/berdiri, fasilitas, parkir, akses, batas jam dan kebisingan |
| WED-03 | Paket | Sewa venue saja atau paket; basis harga, minimum tamu, katering/dekorasi bila termasuk, overtime serta pengecualian |
| WED-04 | Inquiry | Kontak terverifikasi, tanggal alternatif, jumlah tamu, jenis acara, paket, kebutuhan tambahan, rencana site visit |
| WED-05 | Booking form | Paket/tanggal/jumlah tamu, referensi penawaran jika ada, persetujuan ketentuan; menghasilkan permintaan, bukan otomatis reservasi |
| WED-06 | Tracking | Inquiry, respons, penawaran terbaru, masa berlaku, revisi, permintaan booking, hasil tindak lanjut |

Penerimaan venue: form menghasilkan nomor referensi dan email; mitra yang benar menerima lead; penawaran lama tidak dapat diterima setelah diganti atau kedaluwarsa; UI tidak menyatakan tanggal terkunci hanya karena formulir terkirim.

### 9.7 Car Rental

| ID | Kebutuhan | Perilaku yang diharapkan |
|---|---|---|
| CAR-01 | Mode layanan | Dengan pengemudi dan tanpa pengemudi; hanya paket yang disediakan mitra yang tampil |
| CAR-02 | Search | Kota, lokasi ambil/kembali, tanggal/jam mulai-akhir, durasi; MVP kembali pada area yang sama |
| CAR-03 | Filter dan hasil | Kelas/model kendaraan, transmisi, kursi, bagasi, pengemudi, penyedia, total harga |
| CAR-04 | Detail paket | Durasi inklusif, area layanan, BBM/tol/parkir, overtime, pengantaran, deposit, ketentuan perlindungan dari mitra |
| CAR-05 | Persyaratan | Usia/SIM/identitas sesuai kebijakan mitra, batas pengajuan, cara verifikasi, alasan penolakan |
| CAR-06 | Inventori | Unit armada internal, kelas kendaraan, blok maintenance, durasi layanan, buffer serah terima |
| CAR-07 | Request dan pembayaran | Mitra memverifikasi kelayakan serta alokasi; pelanggan membayar setelah disetujui dalam batas waktu |
| CAR-08 | Pemenuhan | Assignment kendaraan dan pengemudi, kontak layanan menjelang mulai, checklist serah terima/pengembalian, status selesai |

Kendaraan lepas kunci memakai interval 24 jam; paket dengan pengemudi memakai durasi/area yang didefinisikan pada produk. Sistem tidak menyamakan semua istilah “per hari”. Biaya yang dapat dihitung sebelum transaksi harus masuk rincian; biaya pemakaian yang belum diketahui dijelaskan terpisah.

Assignment unit kendaraan maupun pengemudi harus bebas konflik waktu. Jika dijual berdasarkan kelas, persetujuan mitra tetap menjamin kapasitas kelas yang cukup, dan unit spesifik wajib ditetapkan sebelum layanan. Penggantian model di luar ketentuan “atau setara” yang telah disepakati membutuhkan persetujuan pelanggan.

Baseline deposit kerusakan ditangani mitra secara terpisah, dinyatakan sebelum permintaan dan tidak dihitung sebagai pendapatan Gobuking. Pengumpulan/pengembalian deposit melalui platform adalah P1. MVP tidak mengizinkan penagihan tambahan otomatis tanpa persetujuan pelanggan.

Penerimaan utama: dua pesanan tidak mendapat unit yang sama pada waktu bertabrakan termasuk buffer; paket dengan/tanpa pengemudi menunjukkan ketentuan berbeda; penolakan kelayakan sebelum bayar tidak menghasilkan tagihan.

## 10. Booking dan pembayaran bersama

### 10.1 Akun dan checkout

| ID | Kebutuhan P0 |
|---|---|
| BKG-01 | Login/daftar menggunakan OTP email sebagai baseline; autentikasi mempertahankan pilihan produk dan parameter pencarian |
| BKG-02 | Form kontak pemesan dan data pengguna layanan dipisahkan; nama, email, telepon, tamu/penyewa, kebutuhan khusus sesuai kategori |
| BKG-03 | Ringkasan produk, jadwal, peserta, harga, pembatalan, mode konfirmasi, dan syarat ditampilkan sebelum submit |
| BKG-04 | Harga, inventori, status listing/mitra, serta versi penawaran diperiksa ulang di server; perubahan memerlukan persetujuan ulang |
| BKG-05 | Hold stok dibuat secara konsisten dengan waktu kedaluwarsa yang terlihat; masa hold dan tagihan harus selaras |
| BKG-06 | Untuk request-to-book, permintaan dan tentative hold dibuat sebelum pembayaran; mitra menyetujui/menolak dalam SLA |
| BKG-07 | Setelah persetujuan, stok tetap dicadangkan untuk jendela pembayaran; bila habis waktu, status dan stok diperbarui |
| BKG-08 | Hosted checkout gateway menyediakan VA dan QRIS pada MVP; e-wallet/kartu diaktifkan jika kontrak dan pengujian mendukung |
| BKG-09 | Status bayar ditentukan dari verifikasi server/gateway, bukan halaman redirect browser atau bukti transfer pelanggan saja |
| BKG-10 | Konfirmasi akhir mensyaratkan inventori teralokasi, persetujuan yang diperlukan, dan pembayaran berhasil |
| BKG-11 | Halaman konfirmasi, nomor booking, voucher, serta email dikirim hanya sesuai status yang benar; email pending berbeda dari confirmed |
| BKG-12 | Pelanggan dapat mengajukan pembatalan, melihat estimasi biaya/refund, dan mengikuti status; CS menangani pengecualian |
| BKG-13 | Permintaan ubah jadwal melalui tiket/CS pada MVP; perubahan otomatis dengan selisih harga adalah P1 |
| BKG-14 | Tidak ada pesanan, penerimaan uang, voucher, atau pengembalian stok ganda akibat klik ulang/retry/event duplikat |

Hotel/home instant booking menggunakan stok yang dijamin sehingga tidak menunggu persetujuan manual setelah bayar. Car rental dan properti request-to-book menunggu persetujuan sebelum membuka pembayaran. Jika alokasi gagal setelah pembayaran terverifikasi, pelanggan melihat status penanganan dan kasus masuk exception queue, bukan konfirmasi palsu.

### 10.2 Pemisahan status

| Objek | Status produk | Makna |
|---|---|---|
| Booking | draft, pending_partner, awaiting_payment, confirmed, in_service, completed, rejected, expired, cancelled, no_show, exception | Posisi reservasi dan pemenuhan layanan |
| Payment attempt | created, pending, succeeded, failed, expired | Posisi satu percobaan pembayaran |
| Refund | requested, under_review, approved, processing, succeeded, failed, rejected | Proses pengembalian uang, terpisah dari pembatalan booking |
| Payout item/batch | not_eligible, eligible, under_review, approved, processing, paid, failed, held | Penyelesaian hak mitra |
| Inquiry | new, assigned, in_discussion, quoted, closed_won, closed_lost, withdrawn | Proses prospek venue |
| Quote | draft, sent, accepted, rejected, expired, superseded | Versi penawaran venue |
| Venue booking request | submitted, under_review, follow_up_required, accepted_for_contract, rejected, withdrawn, expired | Permintaan yang belum menjadi reservasi berbayar platform |

Pembatalan booking tidak otomatis berarti refund sudah selesai. Payout tidak otomatis terjadi ketika payment succeeded. Untuk pembatalan setelah pembayaran, booking berstatus cancelled sementara payment tetap memiliki fakta succeeded dan refund dicatat pada objek terpisah.

### 10.3 Transisi dan kegagalan penting

| Kejadian | Perilaku yang wajib |
|---|---|
| Mitra menolak atau melewati SLA | Request rejected/expired, tentative hold dilepas, pelanggan diberi tahu; tidak membuka pembayaran |
| Pelanggan tidak membayar tepat waktu | Booking expired, hold dilepas setelah sinkronisasi status gateway |
| Pembayaran datang sesudah expiry | Jangan otomatis confirmed; periksa ulang stok dan persetujuan, lalu tangani refund atau rebooking dengan persetujuan pelanggan |
| Browser ditutup setelah membayar | Status tetap diselesaikan melalui backend; pelanggan dapat membuka pesanan kembali |
| Webhook duplikat/tidak berurutan | Verifikasi dan deduplikasi; status final tidak diturunkan oleh event lama |
| Supplier/mitra timeout setelah request | Rekonsiliasi status sebelum retry agar tidak terjadi booking ganda |
| Dua pembayaran berhasil | Satu booking saja; kelebihan pembayaran masuk antrean pengembalian |
| Email gagal | Booking tetap valid; retry pengiriman dan akses voucher di dashboard |
| Mitra membatalkan layanan confirmed | Eskalasi CS, alternatif atau refund, pencatatan penanggung biaya menurut kontrak |

### 10.4 Batas waktu usulan

Parameter awal usulan: hold checkout 15 menit, respons request hotel/home maksimal 24 jam, respons car rental maksimal 4 jam operasional, pembayaran setelah approval maksimal 60 menit. Ini bukan angka kebijakan kompetitor dan belum final.

Deadline efektif tidak boleh melewati batas mulai layanan atau cut-off mitra. Parameter harus disesuaikan kemampuan gateway; metode pembayaran yang masa berlakunya tidak dapat diselaraskan tidak diaktifkan pada flow tersebut. Tidak ada hold berulang tanpa batas untuk menguasai stok.

## 11. User Dashboard

| ID | Submenu | Fungsi P0 |
|---|---|---|
| USR-01 | Pesanan Saya | Booking aktif dipisah berdasarkan hotel, home, car; filter status dan jadwal |
| USR-02 | Detail Pesanan | Produk, mitra, data pemesan, harga, timeline, pembayaran, voucher, kebijakan dan bantuan |
| USR-03 | Riwayat | Selesai, batal, ditolak, expired; tanggal layanan dibedakan dari tanggal pemesanan |
| USR-04 | Inquiry dan Penawaran | Tracking inquiry venue, versi quote, respons, permintaan booking, tindak lanjut |
| USR-05 | Properti Tersimpan | Simpan/hapus hotel, home, MICE, wedding; listing nonaktif diberi status, harga diperiksa saat dibuka |
| USR-06 | Profil | Nama, email/telepon terverifikasi, preferensi dasar; perubahan kontak memerlukan verifikasi |
| USR-07 | Pembatalan dan Refund | Estimasi biaya, persetujuan pembatalan, alasan, tracking refund |
| USR-08 | Ulasan Saya | Tulis ulasan atas transaksi eligible, lihat status moderasi dan balasan |
| USR-09 | Keamanan dan Privasi | Kelola sesi, logout, kanal permintaan akses/koreksi/penghapusan data sesuai kebijakan retensi |
| USR-10 | Bantuan | Tiket terkait transaksi/inquiry, lampiran aman, timeline dan respons CS |

Saved properties anonim dapat disimpan lokal pada perangkat; sinkronisasi ke akun terjadi setelah login sukarela atau saat checkout. P0 tidak mewajibkan login hanya untuk membaca listing. Car favorit, wishlist kolaboratif, serta riwayat pencarian penerbangan lintas perangkat merupakan P1.

Inquiry publik menggunakan email terverifikasi atau tautan verifikasi tanpa mewajibkan pembuatan akun. Inquiry dapat diklaim ke dashboard hanya setelah kecocokan kontak diverifikasi. Permintaan booking venue memerlukan login seperti checkout.

## 12. Partner Dashboard dan lifecycle mitra

### 12.1 Onboarding

Alur mitra: daftar organisasi → pilih kategori usaha → isi profil/dokumen/PIC/rekening → review tim Gobuking → perbaikan bila diperlukan → perjanjian aktif → listing dikirim review → listing published → transaksi diaktifkan setelah syarat terpenuhi.

Status mitra adalah draft, submitted, under_review, needs_revision, approved, suspended, atau closed. Status listing dikelola terpisah: draft, submitted, needs_revision, published, unpublished, suspended. Mitra approved belum tentu memiliki listing published atau izin menerima pembayaran.

### 12.2 Kebutuhan fungsional

| ID | Kapabilitas P0 | Kontrol utama |
|---|---|---|
| PTR-01 | Profil, dokumen, rekening, perjanjian | Data sensitif dibatasi; perubahan rekening harus diverifikasi ulang |
| PTR-02 | Listing dan multi-property | CRUD sesuai kategori, validasi kelengkapan, preview, submit review |
| PTR-03 | Kalender dan tarif | Ubah per tanggal/rentang, bulk update sederhana, stok, stop sell, rate plan, buffer |
| PTR-04 | Reservasi | Detail yang diperlukan, accept/reject request, instruksi layanan, jadwal kedatangan/serah terima |
| PTR-05 | Status pemenuhan | Check-in/out, pickup/return, no-show beserta bukti, permintaan pembatalan oleh mitra |
| PTR-06 | Venue CRM | Antrean inquiry, assignment, respons, penawaran terstruktur/lampiran, masa berlaku, alasan hasil |
| PTR-07 | Customer management | Kontak dan riwayat pelanggan terkait organisasi sendiri, catatan layanan; tanpa ekspor massal PII secara default |
| PTR-08 | Laporan usaha | Penjualan bruto, pembatalan, komisi/potongan, refund, estimasi hak mitra, payout aktual |
| PTR-09 | Ulasan | Membalas atau melaporkan pelanggaran; tidak mengubah skor/menghapus ulasan sepihak |
| PTR-10 | Staf dan izin | Owner mengundang staf, membatasi organisasi/listing, mencabut sesi saat akses dinonaktifkan |
| PTR-11 | Bantuan | Tiket dengan platform, notifikasi, histori perubahan, eskalasi stok/reservasi |
| PTR-12 | Keluar/penangguhan | Menutup penjualan baru; booking confirmed dan penyelesaian hak/kewajiban tetap ditangani |

Perubahan konten material seperti lokasi, pemilik, rekening, dan kapasitas perlu review sesuai jenis perubahan. Update harga/stok oleh mitra berwenang dapat berlaku langsung untuk transaksi baru. Setiap perubahan menyimpan aktor, waktu, nilai sebelum/sesudah, dan sumber perubahan.

### 12.3 Cara pengelolaan inventori

Baseline P0 adalah extranet manual oleh mitra dan bantuan admin yang tercatat. Untuk setiap listing, ditentukan sumber utama stok/harga, PIC, waktu pembaruan terakhir, dan mode instant/request. Jika nantinya terhubung channel manager, field yang dikelola konektor tidak boleh sekaligus bebas ditimpa lewat extranet tanpa aturan prioritas.

Integrasi channel manager/PMS produksi P1 tidak menghapus tanggung jawab P0 untuk menjaga stok akurat. Mitra yang menjual di banyak kanal harus memiliki alokasi khusus yang disepakati atau memakai request-to-book sampai koneksi terverifikasi.

## 13. Super Admin dan operasional platform

| ID | Kapabilitas P0 | Perilaku yang diharapkan |
|---|---|---|
| ADM-01 | Verifikasi mitra | Review dokumen, PIC, rekening, kontrak, approve/reject/revision dan alasan |
| ADM-02 | Moderasi listing | Kelengkapan kategori, duplikasi, foto, lokasi, kebijakan, kapasitas; publish/suspend dengan audit |
| ADM-03 | Kontrol reservasi | Search lintas layanan, detail/timeline, pengecualian, pembatalan, no-show, tindakan koreksi berizin |
| ADM-04 | Venue CRM | SLA, overdue queue, PIC, penawaran, permintaan booking dan hasil tindak lanjut |
| ADM-05 | Pembayaran dan refund | Rekonsiliasi gateway, selisih, approval refund, retry aman dan bukti hasil |
| ADM-06 | Payout | Hitung eligibility, tahan item sengketa, buat batch, persetujuan berbeda aktor, catat transfer dan retry |
| ADM-07 | Customer support | Tiket, lampiran, riwayat, eskalasi, overbooking/relokasi, alasan penyelesaian |
| ADM-08 | CMS dan promo | Banner, destinasi, konten bantuan/kebijakan, SEO, promo dasar per listing/periode |
| ADM-09 | Revenue reports | GMV, penjualan bersih pembatalan/refund, estimasi komisi, hak mitra, biaya, payout, piutang/kewajiban terkait |
| ADM-10 | Konfigurasi | Peran, SLA, cut-off, kebijakan default, master data, feature flags per kategori |
| ADM-11 | Ulasan dan risiko | Antrean moderasi, alasan keputusan, laporan penyalahgunaan, pembatasan akun/listing |
| ADM-12 | Audit dan integrasi | Log tindakan, pengiriman notifikasi, kesehatan konektor, exception queue tanpa membocorkan secret |

Admin tidak mengedit pembayaran menjadi berhasil berdasarkan permintaan pelanggan. Koreksi manual memerlukan bukti rekonsiliasi, hak khusus, alasan, dan audit. Secret integrasi tidak ditampilkan pada layar log atau ekspor umum.

Revenue report merupakan laporan operasional produk, bukan pengganti sistem akuntansi resmi. Pengakuan pendapatan, faktur, serta perlakuan pajak ditetapkan Finance dan diturunkan ke spesifikasi keuangan.

## 14. Aturan bisnis lintas modul

| ID | Aturan baseline P0 |
|---|---|
| BR-01 | Bahasa Indonesia, mata uang IDR, wilayah layanan awal Indonesia. Waktu layanan mengikuti zona waktu lokasi; backend menyimpan waktu yang dapat dikonversi dengan benar |
| BR-02 | Hanya mitra yang disetujui, listing published, dan produk dengan harga/kebijakan valid yang dapat menerima pesanan |
| BR-03 | Ketersediaan dihitung dari stok dikurangi alokasi confirmed, hold aktif, dan blok operasional; rate plan bukan stok tambahan |
| BR-04 | Semua biaya wajib yang dapat diketahui masuk total sebelum pembayaran. Deposit atau biaya pemakaian terpisah memiliki label dan penanggung yang jelas |
| BR-05 | Harga, ketentuan batal, pajak/biaya, komisi, dan kontrak disimpan sebagai snapshot pada transaksi; perubahan berikutnya tidak mengubah booking lama |
| BR-06 | Mode request tidak membuka pembayaran sampai persetujuan mitra serta stok tersedia; penolakan sebelum bayar tidak menimbulkan refund fiktif |
| BR-07 | Inquiry/quote/permintaan booking venue tidak dianggap reservasi berbayar atau jaminan penguncian tanggal |
| BR-08 | Batas pembatalan memakai tanggal/jam dan zona waktu layanan; nominal estimasi ditampilkan sebelum pelanggan mengonfirmasi pembatalan |
| BR-09 | No-show dilaporkan oleh mitra setelah waktu layanan relevan, dengan bukti dan review sesuai kebijakan; tidak ditetapkan hanya karena pelanggan belum membuka aplikasi |
| BR-10 | Refund tidak boleh melebihi jumlah yang dibayar dan belum direfund; refund sebagian mempertahankan rincian per komponen |
| BR-11 | Eligibility payout mempertimbangkan layanan selesai, pembayaran terverifikasi, masa review, refund/sengketa, dan kontrak; tidak sama dengan uang diterima gateway |
| BR-12 | Mitra yang sudah menerima payout tetap memiliki proses penyesuaian bila refund disetujui kemudian; tidak menghapus jejak transaksi lama |
| BR-13 | Ulasan hanya untuk pelanggan dengan layanan completed, satu per booking; jendela usulan 90 hari, skor 1–10, rata-rata sederhana seluruh ulasan published yang eligible |
| BR-14 | Subskor opsional tidak otomatis menentukan skor keseluruhan; listing tanpa ulasan menampilkan “Belum ada ulasan” |
| BR-15 | Moderasi ulasan berdasarkan pedoman yang berlaku untuk ulasan positif maupun negatif; mitra hanya dapat membalas/melaporkan |
| BR-16 | Diskon memiliki sumber pembiayaan, periode, batas, dan dasar pembanding yang benar; MVP tidak menumpuk beberapa promo secara otomatis |
| BR-17 | Akses pelanggan mitra dibatasi transaksi organisasi sendiri; satu ID yang ditebak atau URL yang diubah tidak membuka organisasi lain |
| BR-18 | Penangguhan listing menghentikan penjualan baru, bukan menghilangkan kewajiban atas booking yang sudah confirmed |
| BR-19 | Konfirmasi, pembatalan, pengembalian stok, refund, dan payout harus aman terhadap proses ulang |
| BR-20 | Status selesai perlu sinyal operasional/checklist serta rekonsiliasi kasus; pergantian tanggal saja tidak otomatis membuka payout tanpa kontrol |

Kebijakan ulasan di atas adalah usulan Gobuking. Kebijakan kompetitor berbeda dan tidak otomatis diadopsi, termasuk ulasan dua arah Airbnb. Batas no-show, pengecualian refund, retensi data, serta tanggung jawab sengketa harus disetujui sebelum transaksi nyata.

## 15. Alur utama dari awal sampai akhir

### 15.1 Pelanggan memesan hotel secara instan

1. Pengunjung mencari destinasi, tanggal, tamu, dan kamar tanpa login.
2. Memfilter hasil, menggunakan peta, membuka detail, memilih satu tipe kamar/rate plan.
3. Memulai checkout, login OTP, mengisi kontak serta tamu.
4. Sistem memeriksa harga/stok terbaru dan membuat hold.
5. Pelanggan menyetujui rincian lalu membayar melalui gateway.
6. Sistem memverifikasi pembayaran dan alokasi, menetapkan confirmed, serta mengirim voucher.
7. Mitra melihat reservasi dan menjalankan check-in/out.
8. Layanan completed; pelanggan dapat mengulas dan transaksi masuk pemeriksaan settlement.

### 15.2 Pelanggan memesan home atau mobil melalui persetujuan

1. Pengunjung mencari dan membaca detail, aturan, total harga, serta syarat.
2. Login saat mengajukan booking; sistem membuat pending_partner dan tentative hold dengan batas.
3. Mitra menilai ketersediaan dan persyaratan, lalu menyetujui atau menolak.
4. Setelah approval, sistem membuka pembayaran dengan deadline efektif.
5. Pelanggan membayar; backend memverifikasi lalu mengonfirmasi.
6. Mitra memberikan instruksi kedatangan atau pickup dan menjalankan layanan.
7. Jika permintaan ditolak/kedaluwarsa, hold dilepas dan pelanggan menerima alasan/status.

### 15.3 Pelanggan mencari penerbangan

1. Memilih sekali jalan/pulang pergi, bandara, tanggal, dan penumpang.
2. Sistem mengirim pencarian ke supplier lalu menampilkan hasil yang sesuai.
3. Pelanggan memfilter, memilih itinerary, dan membaca detail serta ketentuan harga.
4. MVP berhenti pada detail pencarian dengan cakupan search-only yang jelas; tidak membuat booking/PNR atau menerima uang penerbangan.

### 15.4 Pelanggan mengajukan MICE atau wedding

1. Mencari venue berdasarkan lokasi, waktu, kapasitas, dan kebutuhan.
2. Mengirim inquiry publik dengan kontak terverifikasi; sistem memberikan nomor referensi.
3. Mitra/PIC menindaklanjuti, melengkapi kebutuhan, dan mengirim penawaran berversi.
4. Pelanggan login ketika mengajukan permintaan booking atas paket/penawaran.
5. Mitra memverifikasi tanggal, ruang, dan syarat; hasil dapat accepted_for_contract atau membutuhkan tindak lanjut.
6. Kesepakatan/kontrak dan pembayaran venue belum diproses sebagai transaksi platform pada MVP. Tim mencatat hasil tindak lanjut serta bukti bila diizinkan, dengan label “ditangani di luar platform”.

Nilai penawaran venue merupakan pipeline, bukan GMV terbayar atau pendapatan Gobuking. Penawaran accepted tidak otomatis mengubah kalender menjadi reservasi final. Monetisasi venue sebelum tersedia pembayaran online memerlukan skema komersial tersendiri pada keputusan D-06.

### 15.5 Settlement dan refund

1. Sistem mencocokkan booking, pembayaran, pemenuhan, pembatalan, dan refund.
2. Finance meninjau selisih serta item eligible berdasarkan kontrak.
3. Maker membuat batch payout; checker berbeda menyetujui.
4. Transfer dilakukan manual melalui kanal perusahaan pada MVP; referensi dan bukti dicatat, bukan sekadar menekan tombol “paid”.
5. Mitra melihat statement serta hasil payout. Transfer gagal tetap menjadi kewajiban dan dapat diproses ulang secara aman.
6. Refund yang terjadi setelah payout menghasilkan penyesuaian yang disetujui, bukan perubahan riwayat.

## 16. Data inti dan hubungan antarlayanan

| Kelompok | Entitas konseptual | Hal yang perlu dipertahankan |
|---|---|---|
| Identitas | User, PartnerOrganization, Membership, Role, ListingAssignment | Pemisahan akun pelanggan dan lingkup mitra |
| Kemitraan | Verification, ContractVersion, CommissionRule, BankAccountVersion | Riwayat persetujuan dan ketentuan berlaku |
| Katalog | Listing, Location, Facility, Media, PolicyVersion | Kategori, kepemilikan, moderasi |
| Penginapan | Property, RoomType, HomeUnit, RatePlan, InventoryCalendar | Stok dan sumber inventori yang sama untuk listing ganda |
| Venue | Venue, Space, LayoutCapacity, Package, EventCalendar | Kapasitas per layout dan benturan resource |
| Kendaraan | RentalProvider, VehicleClass, VehicleUnit, RentalPackage, FleetCalendar, Assignment | Interval jam, maintenance, kendaraan/pengemudi |
| Penerbangan | Supplier, SearchRequest, Offer, Itinerary, Segment | ID supplier, masa berlaku, harga, zona waktu; bukan inventori manual |
| Transaksi | Booking, BookingItem, InventoryHold, PriceSnapshot, StatusHistory | Satu order satu mitra/produk, harga historis, expiry |
| Keuangan | PaymentAttempt, Refund, FinancialEntry, SettlementItem, PayoutBatch | Hubungan uang masuk/keluar, deduplikasi, penyesuaian |
| Venue CRM | Inquiry, QuoteVersion, VenueBookingRequest, FollowUp | Pemisahan prospek dari transaksi terbayar |
| Pengalaman | SavedListing, Review, Reply, SupportTicket, Notification | Eligibility dan kontrol akses |
| Audit | AuditEvent, IntegrationEvent, ReconciliationCase | Aktor, waktu, sebab, status, korelasi transaksi |

Daftar ini bukan skema database final. Poin desain wajib adalah tenant organisasi, versi kebijakan, inventory resource bersama, snapshot harga, dan pemisahan status keuangan dari reservasi. Menggabungkan semua produk ke satu kolom “property” tanpa model khusus tidak memenuhi kebutuhan.

### 16.1 Definisi nilai laporan

- **Nilai booking bruto**: harga produk dan komponen transaksi menurut snapshot; laporan harus menyatakan apakah termasuk pajak dan biaya.
- **GMV terbayar**: nilai produk transaksi dengan pembayaran sukses dalam definisi periode yang disepakati; refund dilaporkan terpisah dan menghasilkan metrik net yang jelas.
- **Pendapatan platform estimasi**: komisi/biaya layanan yang menjadi hak Gobuking menurut kontrak, terpisah dari total uang pelanggan.
- **Hak mitra**: komponen yang menjadi hak mitra setelah potongan dan penyesuaian yang disetujui.
- **Payout**: uang yang benar-benar dibayarkan kepada mitra, bukan seluruh hak yang masih pending.
- **Pipeline venue**: nilai penawaran terbuka; tidak dijumlahkan sebagai GMV atau kas masuk.

Contoh ilustrasi tanpa pajak/biaya lain: pelanggan membayar Rp1.000.000, komisi 15% atas seluruh nilai tersebut menghasilkan hak platform Rp150.000 dan hak mitra Rp850.000. Biaya gateway Rp10.000 yang ditanggung platform mengurangi margin kontribusi menjadi Rp140.000, bukan mengubah GMV menjadi Rp140.000. Angka dan perlakuan aktual ditetapkan Finance.

## 17. Integrasi eksternal

| ID | Integrasi | Scope P0 dan data | Gate/keterbatasan |
|---|---|---|---|
| INT-01 | Payment gateway lokal | Create payment, hosted checkout, status server, webhook, expiry, refund/status, rekonsiliasi | Kontrak, metode tersedia, kredensial, pengujian uang masuk/refund; bukan bukti screenshot |
| INT-02 | Email dan OTP | Login, verifikasi kontak, pending request, approval, payment, voucher, inquiry, refund, payout | Domain pengirim terverifikasi, batas percobaan, retry, delivery log |
| INT-03 | Peta/geocoding | Lokasi, pin, autocomplete yang relevan | Lisensi/key, kuota, fallback daftar, aturan alamat privat |
| INT-04 | Supplier flight search | Bandara, jadwal, harga, itinerary, aturan tarif/bagasi sesuai API | Hak akses, model search-only diperbolehkan, kontrak dan cakupan domestik; data nyata untuk acceptance |
| INT-05 | Media/document storage | Foto, dokumen verifikasi, quote dan bukti operasional | Pemisahan publik/privat, scan/validasi file, akses terbatas |
| INT-06 | Analytics dan monitoring | Funnel, error, antrean, konektor dan transaksi | Tidak mengirim PII sensitif ke event analitik |
| INT-07 | Import inventori awal | CSV/template terkontrol untuk data yang disediakan klien | Mapping, validasi, deduplikasi, hak konten, preview; bukan scraping otomatis |

### 17.1 Integrasi mitra lanjutan P1

Channel manager/PMS mencakup mapping properti/kamar/rate plan, harga, stok, restrictions, reservasi baru/perubahan/pembatalan, dan acknowledgement. Integrasi bukan hanya mengirim email booking. Setiap konektor memerlukan onboarding, kredensial, pengujian, serta aturan sumber data utama.

API publik kompetitor tidak otomatis tersedia untuk Gobuking; membaca dokumentasinya tidak berarti memiliki hak menjual inventori atau menghubungkan seluruh mitra. Pemilihan konektor mengikuti sistem yang benar-benar dipakai mitra peluncuran.

iCal untuk home dapat ditambahkan sebagai bantuan pemblokiran tanggal, bukan pengganti sinkronisasi tarif dan reservasi penuh. Pembaruan berkala serta delay harus dinyatakan; iCal saja tidak menjadi dasar jaminan instant booking lintas kanal.

### 17.2 Keandalan koneksi

Integrasi yang mengubah transaksi memerlukan identitas request/event unik, retry terkontrol, pengecekan hasil, dan rekonsiliasi. Provider timeout tidak boleh diterjemahkan otomatis sebagai gagal definitif. Data cache pencarian harus diperiksa kembali sebelum transaksi. Monitoring menampilkan kegagalan yang perlu ditindaklanjuti beserta pemiliknya.

## 18. Kebutuhan nonfungsional

Angka berikut adalah target awal usulan untuk estimasi, bukan SLA kompetitor. Profil beban, biaya, serta dukungan tim perlu divalidasi sebelum menjadi komitmen kontrak.

| ID | Area | Target atau kriteria usulan |
|---|---|---|
| NFR-01 | Responsif | Alur utama nyaman pada viewport 360 px hingga desktop; diuji pada browser mobile/desktop yang disepakati |
| NFR-02 | Kecepatan halaman | LCP p75 ≤2,5 detik pada halaman katalog dengan profil perangkat/jaringan uji disepakati; gambar dioptimalkan |
| NFR-03 | Respons pencarian | P95 pencarian inventori lokal ≤3 detik pada baseline 100 pengguna aktif bersamaan dan dataset pilot; supplier flight diukur terpisah dengan timeout maksimum usulan 30 detik |
| NFR-04 | Ketersediaan | Target aplikasi bulanan 99,5%; dampak supplier eksternal dipantau terpisah dan tetap memiliki fallback |
| NFR-05 | Konsistensi | Uji konkurensi tidak menghasilkan double allocation dalam inventori yang dikendalikan Gobuking; selisih lintas kanal masuk proses operasional |
| NFR-06 | Keamanan akses | TLS, autentikasi, otorisasi server, isolasi tenant/listing, rate limit OTP, MFA staf mitra dan platform, pembatasan ekspor |
| NFR-07 | Pembayaran | Gunakan halaman/token penyedia; Gobuking tidak menyimpan nomor kartu lengkap atau CVV; verifikasi event dan rekonsiliasi |
| NFR-08 | Privasi | Pengumpulan minimum, persetujuan relevan, akses dokumen terbatas, retensi per kategori, permintaan data melalui tiket dengan verifikasi |
| NFR-09 | Audit | Perubahan harga/stok, akses istimewa, kebijakan, rekening, refund dan payout tercatat; tidak dapat diedit oleh pengguna dashboard biasa |
| NFR-10 | Pemulihan | Backup dan uji restore; target usulan RPO ≤1 jam dan RTO ≤8 jam, diselaraskan biaya serta rekonsiliasi ulang pembayaran pascarestore |
| NFR-11 | Aksesibilitas | Target WCAG 2.2 AA pada alur utama: keyboard, label, fokus, kontras, error, serta alternatif peta; tidak mengandalkan warna saja |
| NFR-12 | Observabilitas | Korelasi booking/payment/refund/payout, alert mismatch dan antrean lewat SLA, log tanpa secret/PII berlebihan |
| NFR-13 | SEO | URL detail yang stabil, metadata, sitemap listing publik aktif; halaman privat/noindex tidak membocorkan transaksi |
| NFR-14 | Dokumen dan file | Validasi tipe/ukuran, kontrol akses, tautan privat terbatas, sanitasi konten yang ditampilkan |
| NFR-15 | Notifikasi | Notifikasi transaksi diantrekan, retry terukur, delivery log dan resend; target antrean internal <1 menit pada kondisi normal |

Target aksesibilitas mengacu pada [WCAG 2.2 dari W3C](https://www.w3.org/TR/WCAG22/). Rincian privasi, perpajakan, terms, dan retensi final harus melalui review pihak klien yang bertanggung jawab sebelum produksi.

## 19. Analytics dan KPI

| Metrik | Definisi | Segmentasi/pemilik |
|---|---|---|
| Search-to-detail | Sesi pencarian yang membuka detail ÷ sesi pencarian | Kategori, perangkat, kota; Product |
| Checkout conversion | Booking confirmed dengan payment succeeded ÷ checkout unik dalam cohort waktu yang sama | Hotel/home/car, instant/request; Product |
| Request acceptance | Request disetujui ÷ request valid yang membutuhkan respons | Mitra, kategori; Partnership |
| Partner response time | Waktu respons pertama dan keputusan sejak request diterima | Jam kalender/operasional didefinisikan; Operations |
| Payment success | Percobaan bayar sukses ÷ percobaan bayar valid | Metode/provider; Finance |
| Booking mismatch | Payment sukses tanpa booking confirmed melewati batas penanganan | Kategori/alasan; Operations dan Finance |
| Inquiry response SLA | Inquiry dijawab dalam SLA ÷ inquiry valid | MICE/wedding/mitra; Venue Operations |
| Quote conversion | Permintaan booking valid ÷ inquiry yang memiliki quote terkirim | Venue/kategori; Sales |
| Flight search success | Search mendapat respons valid ÷ search supplier yang dikirim | Rute/provider; Product dan Engineering |
| GMV dan pendapatan | Menurut definisi bagian 16, tanggal booking/bayar/layanan dilabeli | Kategori/mitra/periode; Finance |
| Refund dan payout | Nilai, jumlah, durasi, kegagalan serta outstanding | Mitra/metode; Finance |
| Kualitas layanan | Pembatalan mitra, overbooking, tiket per booking, skor ulasan | Mitra/kategori; Operations |

Event minimum: search_submitted, search_results_viewed, listing_viewed, filter_applied, checkout_started, request_submitted, partner_decided, payment_started, payment_verified, booking_confirmed, cancellation_requested, refund_completed, inquiry_submitted, quote_sent, venue_request_submitted, payout_recorded.

Event transaksional menggunakan fakta backend dan identitas deduplikasi. Dashboard memisahkan layanan search-only, inquiry, dan transaksi agar conversion serta revenue tidak bercampur. Target persentase bisnis ditetapkan setelah baseline pilot; tidak menganggap angka usulan dokumen lama sebagai KPI yang sudah disetujui.

## 20. Strategi delivery dan dependensi

### 20.1 Urutan pembangunan yang disarankan

| Tahap | Hasil | Syarat keluar |
|---|---|---|
| A. Penyelarasan | Scope, keputusan komersial, daftar mitra/supplier, prototipe alur utama | Baseline dan gate disepakati, PIC keputusan tersedia |
| B. Fondasi | Identitas, organisasi/peran, katalog, CMS, moderasi, kalender dan harga | Isolasi tenant, publish, dan inventori diuji |
| C. Transaksi inti | Hotel lalu home/car, request/hold, gateway, email, dashboard user/mitra | Happy path dan failure path uang/stok lulus |
| D. Venue dan flights | Inquiry/quote/request venue, live flight search | SLA dan status tepat; supplier uji valid |
| E. Operasi dan keuangan | Refund, payout, laporan, dukungan, audit | Rekonsiliasi dan maker-checker berhasil |
| F. UAT dan pilot | Pengujian peran, keamanan, beban, pemulihan, pelatihan dan runbook | Gate peluncuran dipenuhi dan owner menyetujui |

Tahap adalah urutan dependensi, bukan janji waktu. Sebagian pekerjaan dapat berjalan bersamaan setelah kontrak data jelas. Estimasi kalender/biaya dibuat setelah engineering memeriksa kapasitas tim, prototipe, provider, dan kebijakan final.

### 20.2 Gate peluncuran

1. Mitra pilot terverifikasi dan memiliki produk, harga, stok, kebijakan, serta PIC yang benar untuk setiap kategori terkait.
2. Model pendapatan, basis komisi, refund, no-show, payout, penanggung biaya, serta terms disetujui sebelum menerima uang nyata.
3. Payment gateway produksi, email/domain, peta, dan supplier penerbangan lolos pengujian serta kredensial aktif sesuai scope.
4. Tim CS/operasi/Finance memiliki antrean, jam kerja, eskalasi, SOP gangguan, dan pengganti PIC.
5. UAT, isolasi tenant, konkurensi inventori, uang ganda, rekonsiliasi, backup/restore, serta monitoring lulus.
6. Pelatihan mitra dan data migrasi selesai; tidak ada harga, stok, ulasan, atau hasil flight dummy di lingkungan pelanggan.
7. Kategori yang belum siap hanya dapat dikeluarkan dari peluncuran melalui persetujuan scope bertahap yang tercatat. Status keseluruhan MVP tetap menunjukkan requirement yang belum selesai.

### 20.3 Roadmap setelah MVP

- **P1**: booking dan issuance flight; payment DP/termin venue; channel manager/PMS terpilih; payout API; reschedule otomatis; private room; iCal; kupon lanjutan; instant car rental setelah inventori teruji.
- **P2**: aplikasi native, multi-bahasa/mata uang, loyalty, bundling perjalanan, room block acara, kolaborasi wishlist, rekomendasi personal, partner analytics lanjutan.

## 21. Kriteria penerimaan dan skenario UAT

| ID | Skenario | Hasil minimum yang dapat diterima |
|---|---|---|
| UAT-01 | Browse tanpa login | Enam kategori, search, filter/detail yang tersedia dapat dibuka tanpa dipaksa membuat akun |
| UAT-02 | Login saat checkout | Pilihan produk, tanggal, tamu dan harga tidak hilang; harga diperiksa ulang sebelum bayar |
| UAT-03 | Hotel multi-night/multi-room | Stok seluruh malam dan jumlah kamar benar; rate plan berbagi stok tidak dihitung ganda |
| UAT-04 | Kompetisi stok terakhir | Dua pelanggan bersamaan tidak mendapat alokasi final pada unit/stok yang sama |
| UAT-05 | Home buffer | Blok pemilik, minimum malam, dan buffer memengaruhi ketersediaan; listing ganda memakai stok yang sama |
| UAT-06 | Request approve/reject/timeout | Approval membuka pembayaran, rejection/timeout melepas hold, semua pihak melihat status yang sama |
| UAT-07 | Car rental | Kedua mode tersedia pada produk pilot; interval, buffer, kelayakan, assignment, dan serah terima benar |
| UAT-08 | Gateway sukses/pending/gagal | Hasil backend menentukan status; redirect saja tidak dapat membuat confirmed |
| UAT-09 | Webhook duplikat dan late payment | Tidak ada booking/pencatatan uang/voucher ganda; pembayaran terlambat masuk prosedur yang benar |
| UAT-10 | Konfirmasi dan email | Voucher hanya saat memenuhi syarat; gagal email tidak menghapus booking; resend aman |
| UAT-11 | Batal, no-show, refund | Kebijakan snapshot berlaku; refund sebagian/penuh benar; pembatalan dan uang kembali dibedakan |
| UAT-12 | Venue inquiry/quote/request | Lead terkirim ke mitra benar, versi quote terlacak, request tidak mengaku reservasi final |
| UAT-13 | Penerbangan | Rute sekali jalan/pulang pergi mengembalikan hasil supplier nyata; harga/tanggal/penumpang benar; timeout jelas |
| UAT-14 | Akun pelanggan | Pesanan, riwayat, inquiry, profil, properti tersimpan, ulasan, dan bantuan dapat digunakan |
| UAT-15 | Mitra mandiri | Mitra membuat listing, memperbaiki review, mengatur stok/tarif, menangani booking, dan melihat laporan sendiri |
| UAT-16 | Isolasi akses | Mitra A tidak dapat membaca/mengubah listing, pelanggan, booking atau laporan mitra B melalui UI maupun request langsung |
| UAT-17 | Settlement | Nilai pelanggan, komisi, refund, hak mitra dan payout cocok; maker tidak menyetujui batch sendiri |
| UAT-18 | Rekening dan penangguhan | Rekening baru membutuhkan verifikasi; suspend menghentikan pesanan baru tanpa menghapus kewajiban lama |
| UAT-19 | Kualitas UI | Mobile/desktop, keyboard, error/empty/loading, total harga, filter/peta, dan alur kembali sesuai prototipe |
| UAT-20 | Pemulihan dan monitoring | Restore diuji, kasus selisih ditemukan, alert memiliki PIC, log tidak membocorkan data sensitif |

Definition of Done: P0 terpenuhi atau pengecualian scope tercatat; tidak ada defect kritis terbuka pada uang, inventori, akses, atau pemenuhan; bukti UAT tersedia; dokumentasi operasi dan pelatihan selesai; deployment/rollback serta monitoring siap. Persetujuan UAT dilakukan Product Owner bersama perwakilan mitra, Operations, dan Finance sesuai area.

## 22. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi dan pemilik |
|---|---|---|
| “Exactly like Booking.com” ditafsirkan sebagai seluruh fitur kompetitor | Scope dan estimasi tidak terkendali | Baseline P0/P1, prototipe, serta change log; PM/Product Owner |
| Dashboard mitra tidak sinkron dengan model internal lama | Duplikasi input dan konflik stok | Sumber utama data, tenant, role, dan bantuan admin terkontrol; BA/Engineering |
| Enam kategori memiliki kedalaman transaksi berbeda | Pelanggan mengira semua bisa langsung dibeli | CTA dan status khusus, matrix scope, UAT per kategori; Product/UX |
| Supplier flight belum dikontrak | Requirement live search tidak tercapai | Seleksi dan bukti akses di tahap A; rilis bertahap hanya dengan perubahan scope; Partnership |
| Payment integration ready ditafsirkan sebatas tombol | MVP tidak siap bertransaksi | Sandbox end-to-end serta gate produksi; PM/Finance/Engineering |
| Overbooking lintas kanal/manual | Gagal melayani tamu | Alokasi khusus, request-to-book, audit stok, SOP relokasi; Mitra/Operations |
| Hold/request mengunci stok terlalu lama | Hilang penjualan dan penyalahgunaan | TTL, cut-off, batas request, expiry terpantau; Product/Engineering |
| Komisi/pajak/penanggung promo belum jelas | Hak mitra dan laporan salah | Kontrak berversi dan keputusan sebelum live; Finance |
| Inquiry venue tidak ditindaklanjuti | Prospek hilang | PIC, SLA, reminder dan overdue queue; Venue Operations |
| Verifikasi penyewa/deposit mobil tidak jelas | Sengketa atau kegagalan pickup | Syarat terlihat, approval sebelum bayar, proses deposit eksplisit; Mitra rental/Operations |
| Tenant atau dokumen bocor | Kerugian pelanggan dan bisnis | Otorisasi objek, akses minimum, uji isolasi, audit; Engineering/Security |
| Volume payout/refund melebihi kapasitas manual | Pembayaran mitra terlambat | Batas pilot, antrean, statement, maker-checker, rencana otomatisasi; Finance |

## 23. Decision log untuk persetujuan bisnis

Keputusan berikut masih terbuka. Baseline usulan memungkinkan desain dan estimasi awal, tetapi tidak boleh dibaca sebagai persetujuan menjalankan transaksi uang nyata.

| ID | Keputusan | Baseline usulan | Pemilik dan batas keputusan |
|---|---|---|---|
| D-01 | Scope MVP enam kategori | Seluruh kategori sesuai kedalaman bagian 6; flight search-only; venue request/inquiry | Product Owner, sebelum sign-off estimasi |
| D-02 | Operator bisnis dan kontrak mitra | Operator Gobuking berbeda dari vendor pengembang; mitra mandiri melalui extranet | Pemilik bisnis, sebelum desain onboarding final |
| D-03 | Pendapatan | Komisi persentase per kontrak; besaran dan basis ditentukan Finance | Pemilik bisnis/Finance, sebelum desain keuangan final dan live |
| D-04 | Pembayaran pelanggan | Bayar penuh melalui gateway untuk hotel/home/car; bayar nanti dan bayar di properti P1 | Pemilik bisnis/Finance, sebelum desain checkout final |
| D-05 | Payout | Setelah layanan selesai dan review; batch mingguan, transfer manual dengan maker-checker | Finance, sebelum transaksi nyata |
| D-06 | Venue | Inquiry/quote/request P0; DP/termin P1; monetisasi lead/kontrak eksternal belum diasumsikan | Pemilik bisnis/Venue Operations, sebelum kontrak venue |
| D-07 | Supplier penerbangan | Satu supplier domestik yang mengizinkan search-only; issuance P1 | Partnership/Product Owner, sebelum implementasi konektor |
| D-08 | Stok dan konektivitas | Extranet P0; alokasi khusus/request untuk mitra multikanal; konektor produksi P1 | Operations/mitra/Engineering, sebelum aktivasi listing |
| D-09 | Refund, no-show, kegagalan layanan | Per-rate-plan/paket, snapshot, review kasus, pembagian biaya tertulis | Operations/Finance, sebelum pembayaran produksi |
| D-10 | Home rental | Entire-unit jangka pendek; tanpa penjualan kamar dan rumah induk bersamaan | Product Owner/Partnership, sebelum desain katalog |
| D-11 | Car rental | Dua mode, request-to-book, area kembali sama, deposit terpisah di mitra | Product Owner/mitra rental, sebelum pilot |
| D-12 | Login dan notifikasi | OTP email; email transaksi P0; SMS/WhatsApp bukan dependensi awal | Product Owner, sebelum desain autentikasi |
| D-13 | Target dan kapasitas | Target bisnis mengikuti inventori/pemasaran; NFR usulan divalidasi engineering | Pemilik bisnis/Engineering, sebelum komitmen SLA |
| D-14 | Konten awal dan hak pakai | Import hanya dari data yang disediakan dan diizinkan klien | Tim konten/klien, sebelum migrasi |
| D-15 | Kebijakan dan operasi | Review terms, privasi/retensi, perpajakan, jam CS, serta eskalasi | Pemilik bisnis/Finance/pihak legal, sebelum produksi |

Perubahan keputusan harus mencatat tanggal, pemilik, alasan, dampak scope/biaya/jadwal, dan versi PRD/SRS yang terdampak. Tidak ada persetujuan yang diasumsikan hanya karena baseline ditulis di dokumen ini.

## 24. Keterlacakan brief ke PRD

| No. brief | Requirement pengguna | Cakupan PRD | Catatan |
|---|---|---|---|
| 1 | Homepage, pencarian, destinasi, deals, browse tanpa login | HOME-01–06, bagian 7–8 | Tab diperluas menjadi enam kategori |
| 2 | Hotel search, filter, cards, detail/kamar, map, reviews | HTL-01–09 | Rate plan dan inventori ditambahkan agar dapat ditransaksikan |
| 3 | Flights one-way/return, rute/tanggal, penumpang, harga | FLT-01–08 | P0 live search; ticketing bukan asumsi tersembunyi |
| 4 | MICE venues/rooms, capacity/facility filter, inquiry | MIC-01–07 | Kapasitas per ruang/layout; CRM dan quote sebagai pendukung |
| 5 | Wedding listing, kapasitas/paket, galeri, inquiry/booking form | WED-01–06 | Booking form adalah permintaan dengan status jelas |
| 6 | Home Rental referensi Airbnb | HMR-01–08 | Entire unit sebagai baseline MVP; kalender dan aturan khusus |
| 7 | Car Rental | CAR-01–08 | Dua mode, ketentuan rental, approval dan inventori armada |
| 8 | Checkout login, guest details, payment ready, confirmation/email | BKG-01–14 | Sandbox lengkap dan gate produksi, bukan sekadar placeholder |
| 9 | My bookings, history, profile, saved properties | USR-01–10 | Tambahan tracking inquiry, refund, ulasan, bantuan |
| 10 | Admin Mitra, properties/bookings/revenue/customer management | PTR-01–12, bagian 7.2 | Organisasi multi-property, izin staf, data pelanggan terbatas |
| 11 | Super Admin penyedia Gobuking | ADM-01–12, bagian 7.3 | Kemitraan, moderasi, transaksi, Finance, CMS, akses dan audit |

## 25. Referensi dan penggunaan benchmark

### 25.1 Dokumen proyek

1. [BRD Gobuking v1.0](/Users/indoteksaft/Downloads/BRD_Gobuking_v1.0.docx): konteks bisnis awal, masalah, risiko, dan keputusan terbuka. Perubahan terhadap brief terbaru dijelaskan pada bagian 2.
2. [SRS Referensi Booking.com](/Users/indoteksaft/Downloads/SRS_Referensi_Bookingcom.docx): bahan pembanding yang membedakan observasi dan inferensi. SRS Gobuking v1.0 yang disebut dalam referensi belum tersedia untuk pemeriksaan silang.

### 25.2 Sumber resmi yang diperiksa

Seluruh sumber berikut diperiksa pada 28 Oktober 2026. Penggunaan sumber berfokus pada pola produk yang terdokumentasi, bukan klaim mengetahui arsitektur internal atau SLA kompetitor.

| Ref | Sumber | Temuan yang digunakan dan adaptasi Gobuking |
|---|---|---|
| R-01 | [Booking.com How we work](https://www.booking.com/content/how_we_work.en-gb.html) | Marketplace penyedia layanan, pencarian/sort, komisi, ulasan, pembayaran dan pengecualian; Gobuking menetapkan kebijakannya sendiri |
| R-02 | [Booking.com Partner FAQ](https://join.booking.com/faq.html) | Pendaftaran listing, kalender/harga, instant/request, komisi; menjadi acuan onboarding dan extranet |
| R-03 | [Booking.com Connectivity APIs](https://developers.booking.com/connectivity/docs) | Pertukaran reservasi, harga, ketersediaan, serta koneksi tambahan; menjadi acuan batas integrasi mitra |
| R-04 | [Booking.com Rates and Availability](https://developers.booking.com/connectivity/docs/ari) | Inventori berbeda dari availability sesuai pencarian; menguatkan model kamar/tarif/tanggal |
| R-05 | [Traveloka TERA](https://tera.traveloka.com/partner/) | Mitra mengelola data kamar, harga, stok dan reservasi; menjadi acuan submenu partner |
| R-06 | [Traveloka API Hub](https://developer.connect.traveloka.com/) | Sinkronisasi inventori/harga, konten, mapping, pengujian, dan reservasi; koneksi memerlukan proses resmi |
| R-07 | [Traveloka Flight Help](https://www.traveloka.com/en-id/help/flight) | Pencarian dan tiket memiliki proses pascapemesanan seperti perubahan/refund; modul flight tidak disamakan dengan hotel |
| R-08 | [Traveloka e-ticket issuance](https://www.traveloka.com/en-id/help/flight/flight-managing-booking/flight-booking-information/eticket-issuance/why-havent-i-received-my-e-ticket) | Ada proses verifikasi pembayaran dan penerbitan tiket; menjadi dasar pemisahan status payment dan issuance pada P1 |
| R-09 | [Traveloka Car Rental](https://www.traveloka.com/en-id/car-rental) | Layanan dengan/tanpa pengemudi serta perbedaan durasi dan komponen biaya; ketentuan Gobuking mengikuti paket mitra sendiri |
| R-10 | [Airbnb Types of places](https://www.airbnb.com/help/article/5) | Jenis ruang berbeda; MVP Gobuking membatasi pada entire-unit agar model stok jelas |
| R-11 | [Airbnb Booking requests and Instant Book](https://www.airbnb.com/help/article/85) | Pemesanan instan berbeda dari permintaan persetujuan; Gobuking memilih alur approval sebelum membuka pembayaran |
| R-12 | [Airbnb Co-host permissions](https://www.airbnb.co.uk/help/article/1534) | Akses listing, kalender, komunikasi, dan keuangan dapat berbeda; diadaptasi sebagai role dan assignment mitra |
| R-13 | [Airbnb Calendar sync](https://www.airbnb.com/help/article/99) | Kalender eksternal diperbarui berkala; iCal bukan jaminan stok seketika dan ditetapkan P1 |
| R-14 | [Marriott Meetings RFP](https://www.marriott.com/meeting-event-hotels/how-to-book/rfp.mi) | Venue membutuhkan tanggal, peserta, ruang, layout, dan respons penawaran; melengkapi acuan khusus MICE yang tidak cukup diwakili OTA akomodasi |
| R-15 | [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Acuan target aksesibilitas alur utama |

Tidak ada persentase komisi, jadwal payout, SLA, algoritma ranking, atau kebijakan kompetitor yang otomatis dijadikan aturan Gobuking. Kapabilitas di atas merupakan rancangan produk untuk brief ini dan harus diterjemahkan ke backlog serta SRS setelah baseline disepakati.
