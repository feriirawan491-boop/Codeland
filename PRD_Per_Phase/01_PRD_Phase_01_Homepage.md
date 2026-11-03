# PRD Phase 01 Homepage

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

Menemukan layanan yang tepat tanpa login dan meneruskan konteks pencarian ke modul terkait.

Phase 01 adalah nomor paket scope sesuai urutan permintaan pengguna, bukan urutan pembangunan yang mengharuskan semua fase sebelumnya selesai. Kapabilitas fondasi yang disebut pada dependensi harus tersedia sebelum pilot. Dokumen ini menurunkan baseline general; pilihan yang masih usulan tidak berubah menjadi keputusan final hanya karena diperinci.

**Aktor:** Pengunjung; Content Admin.

**Di luar P0:** Personalisasi, loyalty, sponsored ranking, dan pencarian lintas produk dalam satu hasil.

## 2. Navigasi dan layar

1. Header dan navigasi.
2. Tab pencarian.
3. Destinasi unggulan.
4. Special deals.
5. Pilihan properti/venue.
6. Bantuan dan footer.

Pada mobile, filter/rincian dapat memakai panel tetapi field wajib, status, dan CTA utama tetap terbaca. URL dan state mempertahankan konteks saat kembali; layar privat tidak diindeks. Loading, kosong, error, tidak berizin, serta resource tidak aktif memiliki tampilan terpisah.

## 3. Perjalanan utama

1. Buka beranda.
2. Pilih salah satu dari enam layanan.
3. Lengkapi parameter.
4. Validasi sesuai kategori.
5. Buka hasil dengan parameter yang sama.
6. Kembali tanpa kehilangan input.

## 4. Spesifikasi fitur dan acceptance criteria

Setiap ID mempertahankan keterlacakan ke PRD General. Skenario acceptance berikut wajib dilengkapi happy path, validasi field, dan kontrol akses pada QA. Tidak ada penghilangan P0 melalui penyembunyian tombol saja.

### HOME-01 Pencarian bertab

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin memilih pencarian sesuai layanan agar tidak mengisi form yang salah.
- **Perilaku produk:** Enam kategori memiliki form, validasi, dan tujuan hasil masing-masing.
- **Acceptance HOME-01-AC01:** Dengan tab Hotel aktif dan tanggal terisi, ketika berpindah ke Car Rental, tampil field jam/pickup; parameter kamar tidak dikirim ke endpoint rental.

### HOME-02 Destinasi unggulan

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin membuka destinasi unggulan agar cepat menemukan area perjalanan.
- **Perilaku produk:** CMS mengatur kota, foto, urutan, dan tautan kategori; tujuan tanpa inventori tidak menjanjikan stok.
- **Acceptance HOME-02-AC01:** Dengan destinasi berisi listing suspended, ketika kartu destinasi dibuka, hasil hanya memuat listing publik aktif dan tidak menjanjikan jumlah stok palsu.

### HOME-03 Special deals

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin memahami promo dan masa berlakunya agar mengetahui penawaran yang bisa dipakai.
- **Perilaku produk:** Hanya promo aktif yang memenuhi periode dan aturan tampil; label menjelaskan dasar diskon.
- **Acceptance HOME-03-AC01:** Dengan promo melewati akhir periode, ketika homepage dimuat, promo tidak tampil walau cache lama masih ada; tautan langsung menjelaskan promo berakhir.

### HOME-04 Konten unggulan

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin menjelajahi pilihan kurasi agar mendapat titik awal pencarian.
- **Perilaku produk:** Hotel, home, venue, dan rental pilihan berdasarkan kurasi transparan; tidak mengaku hasil personalisasi.
- **Acceptance HOME-04-AC01:** Dengan pilihan editorial, ketika kartu ditampilkan, label menyebut pilihan Gobuking dan bukan rekomendasi personal; gambar gagal memakai placeholder.

### HOME-05 Navigasi publik

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin membaca katalog tanpa akun agar dapat membandingkan sebelum berkomitmen.
- **Perilaku produk:** Browse, bantuan, dan informasi mitra dapat diakses tanpa akun.
- **Acceptance HOME-05-AC01:** Dengan sesi anonim, ketika membuka hasil/detail/bantuan, tidak muncul penghalang login; CTA akun tetap pilihan sukarela.

### HOME-06 Pencarian lokasi

- **Prioritas:** P0.
- **User story:** Sebagai pengunjung, saya ingin memilih lokasi yang tepat agar hasil tidak tertukar antara kota, bandara dan properti.
- **Perilaku produk:** Autocomplete membedakan kota, area, properti, dan bandara sesuai kategori.
- **Acceptance HOME-06-AC01:** Dengan input Jakarta pada tab Flights, ketika memilih saran, sistem mengirim ID bandara/kota supplier yang sesuai dan bukan ID properti.

## 5. Data dan validasi

Data minimum spesifik modul: destinasi_id wajib sesuai tab; tanggal mulai/akhir sesuai layanan; tamu/penumpang/peserta bilangan valid; kategori tujuan; banner_id dan periode; posisi konten; status publish.

Field wajib dibedakan dari opsional pada form. Validasi dilakukan di client untuk kenyamanan dan di server sebagai otoritas. ID resource harus valid dan berstatus sesuai tindakan; harga/status dari browser tidak dipercaya. Jika suatu field hanya berlaku pada mode tertentu, field tersebut tidak diwajibkan pada mode lain. File privat mengikuti kontrol akses dan batas tipe/ukuran yang disepakati, bukan URL publik permanen.

Snapshot transaksi/penawaran memuat konteks saat persetujuan. Perubahan master data tidak mengubah transaksi lama. Detail kontrak data dan format error diturunkan ke SRS/API setelah review engineering; field konseptual di sini bukan skema database final.

## 6. Status dan aturan khusus

CMS draft → scheduled/published → expired/unpublished. Kegagalan satu blok editorial tidak mematikan search bar.

Perubahan tersimpan memiliki ID, waktu, aktor dan jejak audit sesuai tingkat risikonya. Kontrak bersama mengatur booking, hold, payment, refund, payout dan inquiry. Halaman konfirmasi wajib menggunakan status otoritatif. Input invalid tidak membuang draft; resource berubah/tidak aktif saat submit diperiksa ulang sebelum tindakan dijalankan.

## 7. Dependensi dan ownership

Fondasi katalog lokasi, CMS dari Phase 10, dan kontrak pencarian Phase 02–07. UI dapat dibangun dengan fixture staging; penerimaan produksi tetap memerlukan data nyata.

Product Owner menyetujui scope serta kebijakan. BA menjaga mapping ID dan keputusan; UX memvalidasi prototipe; Engineering menetapkan kontrak dan keandalan; QA menyediakan bukti AC; Operations/Finance/mitra memvalidasi proses yang menjadi kewenangannya. Owner implementasi teknis final mengikuti penugasan proyek, bukan diasumsikan sudah tersedia.

## 8. Notifikasi, error dan akses

Notifikasi transaksi dikirim setelah fakta backend tersimpan. Tidak mengirim status confirmed untuk request atau quote. Gagal kirim email tidak membatalkan fakta transaksi; retry aman dan delivery log diperlukan. Inquiry/booking/payment/payout menggunakan jenis pesan berbeda; penerbangan search-only tidak memicu email konfirmasi tiket.

Server memeriksa hak akses per objek dan konteks sesi. Pengunjung hanya membaca data publik; pelanggan hanya aktivitas sendiri; mitra dibatasi organisasi dan assignment; admin dibatasi role. Error tidak menampilkan data organisasi lain, dokumen privat, token, atau rincian pembayaran sensitif.

## 9. Pengukuran keberhasilan

search_submitted; homepage_tab_changed; destination_clicked; deal_clicked; CTR kartu = klik unik ÷ impresi kartu. Segmentasi perangkat/kategori; pemilik Product.

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

Konten kedaluwarsa: validasi status saat baca; deep-link rusak: verifikasi tujuan saat publish; form mobile padat: progressive disclosure tanpa menyembunyikan field wajib.

Keputusan general yang memengaruhi fase: **D-01, D-12, D-14**. Rinciannya pada decision log PRD General. Sampai diputuskan, gunakan baseline untuk estimasi dan sandbox; jangan mengaktifkan kebijakan keuangan/kontrak yang belum disetujui. Risiko provider dicatat sebagai blocker dengan PIC, bukan diam-diam mengurangi scope.

## 13. Pengembangan setelah MVP

Daftar lanjutan: Personalisasi, loyalty, sponsored ranking, dan pencarian lintas produk dalam satu hasil. Perubahan menjadi P0 memerlukan dampak terhadap UX, data, kontrak mitra, integrasi, UAT, biaya dan jadwal. Tidak ada janji bahwa semua kapabilitas tersebut tersedia hanya karena arsitektur disebut siap integrasi.

## 14. Referensi

Acuan langsung adalah PRD General v1.0 beserta sumber resmi pada bagian 25. Dokumen ini menyatakan rancangan Gobuking, bukan kebijakan atau arsitektur internal kompetitor. [Kembali ke indeks](00_Index_Phase.md).
