# PRD Phase 06 Wedding Venue

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

Membandingkan venue dan paket wedding dengan cakupan biaya yang dapat dipahami sebelum mengajukan permintaan.

Phase 06 adalah nomor paket scope sesuai urutan permintaan pengguna, bukan urutan pembangunan yang mengharuskan semua fase sebelumnya selesai. Kapabilitas fondasi yang disebut pada dependensi harus tersedia sebelum pilot. Dokumen ini menurunkan baseline general; pilihan yang masih usulan tidak berubah menjadi keputusan final hanya karena diperinci.

**Aktor:** Pasangan/perencana acara; Venue Sales; CS.

**Di luar P0:** Online DP/termin, vendor marketplace katering/dekorasi, undangan digital, seat plan, kontrak digital.

## 2. Navigasi dan layar

1. Pencarian.
2. Detail dan galeri.
3. Kapasitas.
4. Paket.
5. Inquiry/site visit.
6. Booking request.
7. Tracking penawaran.

Pada mobile, filter/rincian dapat memakai panel tetapi field wajib, status, dan CTA utama tetap terbaca. URL dan state mempertahankan konteks saat kembali; layar privat tidak diindeks. Loading, kosong, error, tidak berizin, serta resource tidak aktif memiliki tampilan terpisah.

## 3. Perjalanan utama

1. Cari venue.
2. Bandingkan kapasitas dan paket.
3. Baca galeri/aturan.
4. Kirim inquiry/site visit.
5. Terima quote.
6. Login dan ajukan booking.
7. Mitra meninjau untuk kontrak di luar platform.

## 4. Spesifikasi fitur dan acceptance criteria

Setiap ID mempertahankan keterlacakan ke PRD General. Skenario acceptance berikut wajib dilengkapi happy path, validasi field, dan kontrol akses pada QA. Tidak ada penghilangan P0 melalui penyembunyian tombol saja.

### WED-01 Search dan filter

- **Prioritas:** P0.
- **User story:** Sebagai perencana wedding, saya ingin mencari venue sesuai jumlah tamu dan format agar pilihan relevan.
- **Perilaku produk:** Lokasi, tanggal/fleksibel, jumlah tamu, indoor/outdoor, tipe venue, paket dan budget.
- **Acceptance WED-01-AC01:** Dengan pencarian 500 tamu duduk, ketika hasil difilter, kapasitas 500 standing tidak dianggap memenuhi duduk 500.

### WED-02 Detail dan galeri

- **Prioritas:** P0.
- **User story:** Sebagai perencana wedding, saya ingin melihat area acara serta batas penggunaannya agar dapat menilai kesesuaian.
- **Perilaku produk:** Foto, area acara, kapasitas duduk/berdiri, fasilitas, parkir, akses, batas jam dan kebisingan.
- **Acceptance WED-02-AC01:** Dengan foto ruang A, ketika galeri ruang B dibuka, foto ditandai area yang tepat; batas jam dan akses tamu tetap terlihat.

### WED-03 Paket

- **Prioritas:** P0.
- **User story:** Sebagai perencana wedding, saya ingin membandingkan cakupan paket agar mengetahui kebutuhan yang belum termasuk.
- **Perilaku produk:** Sewa venue saja atau paket; basis harga, minimum tamu, katering/dekorasi bila termasuk, overtime serta pengecualian.
- **Acceptance WED-03-AC01:** Dengan paket venue-only, ketika detail dibuka, katering/dekorasi dinyatakan tidak termasuk; harga mulai tidak disajikan sebagai harga seluruh acara.

### WED-04 Inquiry

- **Prioritas:** P0.
- **User story:** Sebagai perencana wedding, saya ingin mengirim tanggal alternatif dan kebutuhan site visit agar mitra menindaklanjuti secara tepat.
- **Perilaku produk:** Kontak terverifikasi, tanggal alternatif, jumlah tamu, jenis acara, paket, kebutuhan tambahan, rencana site visit.
- **Acceptance WED-04-AC01:** Dengan tanggal fleksibel dan budget kosong, ketika inquiry disubmit dengan kontak valid, inquiry diterima; tanggal alternatif dan permintaan site visit tersimpan.

### WED-05 Booking form

- **Prioritas:** P0.
- **User story:** Sebagai perencana wedding, saya ingin mengajukan paket dan tanggal melalui akun agar permintaan dapat dilacak.
- **Perilaku produk:** Paket/tanggal/jumlah tamu, referensi penawaran jika ada, persetujuan ketentuan; menghasilkan permintaan, bukan otomatis reservasi.
- **Acceptance WED-05-AC01:** Dengan user anonim mengisi booking form, ketika lanjut, login mempertahankan paket/tanggal/tamu; hasil submit berstatus submitted dan bukan confirmed.

### WED-06 Tracking

- **Prioritas:** P0.
- **User story:** Sebagai perencana wedding, saya ingin melacak penawaran terbaru agar tidak menyetujui harga atau syarat yang sudah diganti.
- **Perilaku produk:** Inquiry, respons, penawaran terbaru, masa berlaku, revisi, permintaan booking, hasil tindak lanjut.
- **Acceptance WED-06-AC01:** Dengan quote direvisi, ketika user melihat tracking, versi terbaru, masa berlaku dan perubahan dapat dibaca; quote accepted tetap tidak menghasilkan voucher atau catatan pembayaran.

## 5. Data dan validasi

Data minimum spesifik modul: venue/space_id; seated/standing_capacity; tanggal utama/alternatif; jumlah tamu; indoor/outdoor; package_id; minimum_guest; basis harga; inclusions/exclusions; overtime; verified_contact; quote_version.

Field wajib dibedakan dari opsional pada form. Validasi dilakukan di client untuk kenyamanan dan di server sebagai otoritas. ID resource harus valid dan berstatus sesuai tindakan; harga/status dari browser tidak dipercaya. Jika suatu field hanya berlaku pada mode tertentu, field tersebut tidak diwajibkan pada mode lain. File privat mengikuti kontrol akses dan batas tipe/ukuran yang disepakati, bukan URL publik permanen.

Snapshot transaksi/penawaran memuat konteks saat persetujuan. Perubahan master data tidak mengubah transaksi lama. Detail kontrak data dan format error diturunkan ke SRS/API setelah review engineering; field konseptual di sini bukan skema database final.

## 6. Status dan aturan khusus

Site visit dicatat sebagai kebutuhan/follow-up, bukan reservasi appointment otomatis. Kalender kosong belum berarti tanggal dijamin. Ruang yang diblokir acara eksternal tidak otomatis membuka request final tanpa pengecekan mitra.

Perubahan tersimpan memiliki ID, waktu, aktor dan jejak audit sesuai tingkat risikonya. Kontrak bersama mengatur booking, hold, payment, refund, payout dan inquiry. Halaman konfirmasi wajib menggunakan status otoritatif. Input invalid tidak membuang draft; resource berubah/tidak aktif saat submit diperiksa ulang sebelum tindakan dijalankan.

## 7. Dependensi dan ownership

Phase 09 ruang/paket/CRM, Phase 10 moderasi/SLA, Phase 08 tracking. Gunakan resource kalender yang sama dengan MICE untuk ruang identik.

Product Owner menyetujui scope serta kebijakan. BA menjaga mapping ID dan keputusan; UX memvalidasi prototipe; Engineering menetapkan kontrak dan keandalan; QA menyediakan bukti AC; Operations/Finance/mitra memvalidasi proses yang menjadi kewenangannya. Owner implementasi teknis final mengikuti penugasan proyek, bukan diasumsikan sudah tersedia.

## 8. Notifikasi, error dan akses

Notifikasi transaksi dikirim setelah fakta backend tersimpan. Tidak mengirim status confirmed untuk request atau quote. Gagal kirim email tidak membatalkan fakta transaksi; retry aman dan delivery log diperlukan. Inquiry/booking/payment/payout menggunakan jenis pesan berbeda; penerbangan search-only tidak memicu email konfirmasi tiket.

Server memeriksa hak akses per objek dan konteks sesi. Pengunjung hanya membaca data publik; pelanggan hanya aktivitas sendiri; mitra dibatasi organisasi dan assignment; admin dibatasi role. Error tidak menampilkan data organisasi lain, dokumen privat, token, atau rincian pembayaran sensitif.

## 9. Pengukuran keberhasilan

wedding_inquiry_verified; package_viewed; quote_sent; venue_request_submitted; followup_outcome. Pipeline dan alasan lost dipantau Venue Sales; tidak dicampur GMV.

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

Paket ambigu: inclusions/exclusions wajib; tanggal ganda: resource bersama; ekspektasi confirmed: CTA permintaan eksplisit dan status accepted_for_contract.

Keputusan general yang memengaruhi fase: **D-06, D-12, D-15**. Rinciannya pada decision log PRD General. Sampai diputuskan, gunakan baseline untuk estimasi dan sandbox; jangan mengaktifkan kebijakan keuangan/kontrak yang belum disetujui. Risiko provider dicatat sebagai blocker dengan PIC, bukan diam-diam mengurangi scope.

## 13. Pengembangan setelah MVP

Daftar lanjutan: Online DP/termin, vendor marketplace katering/dekorasi, undangan digital, seat plan, kontrak digital. Perubahan menjadi P0 memerlukan dampak terhadap UX, data, kontrak mitra, integrasi, UAT, biaya dan jadwal. Tidak ada janji bahwa semua kapabilitas tersebut tersedia hanya karena arsitektur disebut siap integrasi.

## 14. Referensi

Acuan langsung adalah PRD General v1.0 beserta sumber resmi pada bagian 25. Dokumen ini menyatakan rancangan Gobuking, bukan kebijakan atau arsitektur internal kompetitor. [Kembali ke indeks](00_Index_Phase.md).
