# PRD Phase 05 MICE

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

Menghasilkan inquiry meeting/event yang sesuai kapasitas dan dapat ditindaklanjuti menjadi permintaan kontrak.

Phase 05 adalah nomor paket scope sesuai urutan permintaan pengguna, bukan urutan pembangunan yang mengharuskan semua fase sebelumnya selesai. Kapabilitas fondasi yang disebut pada dependensi harus tersedia sebelum pilot. Dokumen ini menurunkan baseline general; pilihan yang masih usulan tidak berubah menjadi keputusan final hanya karena diperinci.

**Aktor:** Penyelenggara perusahaan; Venue Sales; CS.

**Di luar P0:** DP/termin gateway, kontrak digital, instant event booking, inquiry multi-venue, room block otomatis.

## 2. Navigasi dan layar

1. Search venue.
2. Filter kapasitas/layout.
3. Detail ruang.
4. Paket.
5. Inquiry.
6. Penawaran.
7. Permintaan booking.

Pada mobile, filter/rincian dapat memakai panel tetapi field wajib, status, dan CTA utama tetap terbaca. URL dan state mempertahankan konteks saat kembali; layar privat tidak diindeks. Loading, kosong, error, tidak berizin, serta resource tidak aktif memiliki tampilan terpisah.

## 3. Perjalanan utama

1. Cari venue berdasarkan peserta/layout.
2. Baca ruang dan paket.
3. Kirim inquiry dan verifikasi kontak.
4. PIC klarifikasi.
5. Quote terkirim.
6. Login untuk request atas quote.
7. Follow-up kontrak di luar platform.

## 4. Spesifikasi fitur dan acceptance criteria

Setiap ID mempertahankan keterlacakan ke PRD General. Skenario acceptance berikut wajib dilengkapi happy path, validasi field, dan kontrol akses pada QA. Tidak ada penghilangan P0 melalui penyembunyian tombol saja.

### MIC-01 Search venue

- **Prioritas:** P0.
- **User story:** Sebagai penyelenggara acara, saya ingin mencari ruang sesuai waktu dan peserta agar dapat menyusun shortlist.
- **Perilaku produk:** Kota, tanggal/jam atau tanggal fleksibel, peserta, jenis acara, layout.
- **Acceptance MIC-01-AC01:** Dengan 100 peserta dan layout classroom, ketika search, ruang theater 150 tetapi classroom 80 tidak dianggap cocok.

### MIC-02 Filter

- **Prioritas:** P0.
- **User story:** Sebagai penyelenggara acara, saya ingin menyaring kapasitas menurut layout agar ruang benar-benar memuat peserta.
- **Perilaku produk:** Kapasitas per layout, ruang indoor/outdoor, AV, Wi-Fi, parkir, katering, aksesibilitas, rentang harga jika dapat dibandingkan.
- **Acceptance MIC-02-AC01:** Dengan filter AV aktif, ketika hasil tampil, ruang tanpa fasilitas AV terkonfirmasi tidak dimasukkan; harga per peserta tidak disortir seolah harga per hari.

### MIC-03 Detail ruang

- **Prioritas:** P0.
- **User story:** Sebagai penyelenggara acara, saya ingin melihat detail setiap ruang agar tidak bergantung pada informasi venue umum.
- **Perilaku produk:** Venue induk, ruang, luas, foto, layout, kapasitas tiap layout, fasilitas, kebijakan penggunaan.
- **Acceptance MIC-03-AC01:** Dengan venue memiliki dua ruang, ketika ruang dipilih, luas dan kapasitas mengikuti ruang tersebut, bukan total venue.

### MIC-04 Paket

- **Prioritas:** P0.
- **User story:** Sebagai penyelenggara acara, saya ingin memahami basis harga paket agar dapat memperkirakan anggaran acara.
- **Perilaku produk:** Per jam/hari/peserta, minimum peserta, durasi, isi paket, pajak/biaya, label harga indikatif atau penawaran.
- **Acceptance MIC-04-AC01:** Dengan paket minimum 50 peserta dan tarif per peserta, ketika jumlah 40, sistem menjelaskan minimum dan basis biaya; tidak menyebut total 40 peserta sebagai harga final.

### MIC-05 Inquiry

- **Prioritas:** P0.
- **User story:** Sebagai penyelenggara acara, saya ingin mengirim kebutuhan terstruktur agar mitra dapat membuat penawaran yang relevan.
- **Perilaku produk:** Nama, kontak terverifikasi, perusahaan, tanggal/waktu, peserta, layout, budget opsional, kebutuhan kamar/AV/katering, catatan.
- **Acceptance MIC-05-AC01:** Dengan kontak belum diverifikasi, ketika form dikirim, lead belum masuk antrean aktif sebelum verifikasi; retry submit tidak menggandakan inquiry.

### MIC-06 Penanganan lead

- **Prioritas:** P0.
- **User story:** Sebagai penyelenggara acara, saya ingin melacak respons dan revisi quote agar tindak lanjut dapat diaudit.
- **Perilaku produk:** Nomor inquiry, PIC mitra, SLA, riwayat respons, penawaran versi, lampiran aman.
- **Acceptance MIC-06-AC01:** Dengan quote versi 2 terkirim, ketika tautan versi 1 diterima, sistem menolak penerimaan versi lama dan menawarkan versi terbaru.

### MIC-07 Permintaan booking

- **Prioritas:** P0.
- **User story:** Sebagai penyelenggara acara, saya ingin mengajukan penawaran menjadi permintaan booking agar mitra memeriksa kesepakatan final.
- **Perilaku produk:** Pelanggan memilih penawaran yang berlaku lalu mengajukan permintaan booking setelah login; status tetap menunggu kesepakatan final.
- **Acceptance MIC-07-AC01:** Dengan quote kedaluwarsa atau resource sudah diblokir, ketika request booking, sistem meminta validasi ulang; tidak mengunci ruang atau menerima uang.

## 5. Data dan validasi

Data minimum spesifik modul: venue_id; space_id; layout; capacity_by_layout; event_start/end dan zona; tanggal_fleksibel; participants; company; verified_contact; budget opsional; AV/catering/kamar; quote_version; valid_until.

Field wajib dibedakan dari opsional pada form. Validasi dilakukan di client untuk kenyamanan dan di server sebagai otoritas. ID resource harus valid dan berstatus sesuai tindakan; harga/status dari browser tidak dipercaya. Jika suatu field hanya berlaku pada mode tertentu, field tersebut tidak diwajibkan pada mode lain. File privat mengikuti kontrol akses dan batas tipe/ukuran yang disepakati, bukan URL publik permanen.

Snapshot transaksi/penawaran memuat konteks saat persetujuan. Perubahan master data tidak mengubah transaksi lama. Detail kontrak data dan format error diturunkan ke SRS/API setelah review engineering; field konseptual di sini bukan skema database final.

## 6. Status dan aturan khusus

Inquiry, quote dan venue booking request mengikuti status terpisah pada kontrak bersama. Lead tidak menahan stok. Inquiry closed_won harus memiliki bukti hasil follow-up, bukan hanya klik quote; nilai pipeline tetap bukan GMV.

Perubahan tersimpan memiliki ID, waktu, aktor dan jejak audit sesuai tingkat risikonya. Kontrak bersama mengatur booking, hold, payment, refund, payout dan inquiry. Halaman konfirmasi wajib menggunakan status otoritatif. Input invalid tidak membuang draft; resource berubah/tidak aktif saat submit diperiksa ulang sebelum tindakan dijalankan.

## 7. Dependensi dan ownership

Phase 09 Venue CRM dan katalog ruang, Phase 10 SLA dan moderasi, Phase 08 tracking/claim inquiry. Berbagi resource venue dengan Wedding.

Product Owner menyetujui scope serta kebijakan. BA menjaga mapping ID dan keputusan; UX memvalidasi prototipe; Engineering menetapkan kontrak dan keandalan; QA menyediakan bukti AC; Operations/Finance/mitra memvalidasi proses yang menjadi kewenangannya. Owner implementasi teknis final mengikuti penugasan proyek, bukan diasumsikan sudah tersedia.

## 8. Notifikasi, error dan akses

Notifikasi transaksi dikirim setelah fakta backend tersimpan. Tidak mengirim status confirmed untuk request atau quote. Gagal kirim email tidak membatalkan fakta transaksi; retry aman dan delivery log diperlukan. Inquiry/booking/payment/payout menggunakan jenis pesan berbeda; penerbangan search-only tidak memicu email konfirmasi tiket.

Server memeriksa hak akses per objek dan konteks sesi. Pengunjung hanya membaca data publik; pelanggan hanya aktivitas sendiri; mitra dibatasi organisasi dan assignment; admin dibatasi role. Error tidak menampilkan data organisasi lain, dokumen privat, token, atau rincian pembayaran sensitif.

## 9. Pengukuran keberhasilan

inquiry_verified; first_response; quote_sent; venue_request_submitted. SLA first response usulan satu hari kerja perlu keputusan Operations; conversion = request valid ÷ inquiry quoted.

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

Kapasitas salah: matrix layout; quote usang: versi dan expiry; lead terbengkalai: PIC dan overdue; benturan wedding: kalender ruang bersama.

Keputusan general yang memengaruhi fase: **D-06, D-12, D-15**. Rinciannya pada decision log PRD General. Sampai diputuskan, gunakan baseline untuk estimasi dan sandbox; jangan mengaktifkan kebijakan keuangan/kontrak yang belum disetujui. Risiko provider dicatat sebagai blocker dengan PIC, bukan diam-diam mengurangi scope.

## 13. Pengembangan setelah MVP

Daftar lanjutan: DP/termin gateway, kontrak digital, instant event booking, inquiry multi-venue, room block otomatis. Perubahan menjadi P0 memerlukan dampak terhadap UX, data, kontrak mitra, integrasi, UAT, biaya dan jadwal. Tidak ada janji bahwa semua kapabilitas tersebut tersedia hanya karena arsitektur disebut siap integrasi.

## 14. Referensi

Acuan langsung adalah PRD General v1.0 beserta sumber resmi pada bagian 25. Dokumen ini menyatakan rancangan Gobuking, bukan kebijakan atau arsitektur internal kompetitor. [Kembali ke indeks](00_Index_Phase.md).
