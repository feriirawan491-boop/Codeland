# Kontrak Lintas Phase Gobuking MVP

Versi 1.0 — 28 Oktober 2026. Draft turunan [PRD General](../PRD_General_Gobuking_MVP_v1.0.md). Berlaku untuk seluruh [paket fase](00_Index_Phase.md). ID BKG dan BR tetap mengacu sumber general.

## 1. Ownership komponen shared

| Komponen | Owner paket | Konsumen |
|---|---|---|
| Identitas pelanggan, ownership, saved, review | Phase 08 | Phase 01–07 |
| Organisasi, role mitra, resource/calendar/rate | Phase 09 | Phase 02,03,05,06,07 |
| Booking/hold/payment/refund engine | Platform core; direview bersama Phase 02,08,09,10 | Hotel, Home, Car |
| Katalog publish, CMS, verification dan master data | Phase 10 dan authoring Phase 09 | Seluruh discovery |
| Inquiry/quote/venue request | Shared venue core Phase 05, authoring Phase 09, pengawasan Phase 10 | Phase 06 dan 08 |
| Gateway, financial entries, settlement/payout | Platform core dan Finance Phase 10 | Phase 02,03,07,08,09 |
| Email, storage, peta, audit, monitoring | Platform core | Seluruh paket sesuai kebutuhan |
| Flight supplier connector | Phase 04, operasi Phase 10 | Phase 01 |

Platform core adalah workstream implementasi, bukan dokumen produk kesebelas atau tambahan scope di luar general. Fondasi ini dibangun lebih awal; dashboard final diselesaikan sesuai milestone. Tidak ada penghitungan fitur shared berulang pada estimasi tiap modul.

## 2. Booking dan pembayaran bersama

### 2.1 Akun dan checkout

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

### 2.2 Pemisahan status

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

### 2.3 Transisi dan kegagalan penting

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

### 2.4 Batas waktu usulan

Parameter awal usulan: hold checkout 15 menit, respons request hotel/home maksimal 24 jam, respons car rental maksimal 4 jam operasional, pembayaran setelah approval maksimal 60 menit. Ini bukan angka kebijakan kompetitor dan belum final.

Deadline efektif tidak boleh melewati batas mulai layanan atau cut-off mitra. Parameter harus disesuaikan kemampuan gateway; metode pembayaran yang masa berlakunya tidak dapat diselaraskan tidak diaktifkan pada flow tersebut. Tidak ada hold berulang tanpa batas untuk menguasai stok.

## 3. Aturan bisnis lintas modul

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


## 4. Matriks transisi dan tindakan

| Kondisi awal | Pemicu dan aktor | Syarat | Hasil |
|---|---|---|---|
| draft | Checkout instant oleh pelanggan | Listing aktif, harga disetujui, stok valid | awaiting_payment dan hold atomik |
| draft | Submit request pelanggan | Listing request aktif, cut-off valid | pending_partner dan tentative hold terbatas |
| pending_partner | Approve mitra | Hak listing, stok masih teralokasi, belum deadline | awaiting_payment dan jendela bayar |
| pending_partner | Reject mitra/timeout sistem | Alasan atau deadline tervalidasi | rejected/expired, hold dilepas sekali |
| awaiting_payment | Payment verified backend | Nominal/mata uang cocok, stok dan approval valid | confirmed, financial entry dan voucher sekali |
| awaiting_payment | Deadline | Cek status gateway sebelum melepas | expired atau rekonsiliasi exception |
| confirmed | Mulai layanan oleh mitra | Waktu dan bukti layanan relevan | in_service |
| in_service | Selesai layanan mitra | Checklist, outstanding kasus ditinjau | completed; eligibility review bukan otomatis paid |
| confirmed | No-show diajukan mitra | Waktu mulai telah lewat, bukti, review | no_show setelah keputusan berizin |
| confirmed | Cancel pelanggan/mitra | Kebijakan snapshot, izin dan preview biaya | cancelled; refund objek terpisah |
| payment succeeded terlambat | Event gateway | Booking expired/stok mungkin habis | exception, recheck atau refund/rebook dengan persetujuan |

State terminal tidak dibuka ulang dengan edit bebas. Koreksi memakai aksi khusus, alasan dan histori; rebooking menghasilkan referensi baru yang terkait kasus lama. Completion bukan izin mengabaikan sengketa untuk payout.

## 5. Acceptance keandalan bersama

| ID | Skenario | Hasil wajib |
|---|---|---|
| CORE-AC01 | Dua request stok terakhir bersamaan | Alokasi final maksimal sebesar stok; aktor kalah mendapat hasil dapat ditindaklanjuti |
| CORE-AC02 | Redirect sukses tanpa bukti gateway | Tidak menjadi paid/confirmed |
| CORE-AC03 | Event sukses sama dikirim tiga kali | Satu fakta pembayaran, satu konfirmasi, tidak ada tiga hak mitra |
| CORE-AC04 | Event pending datang sesudah succeeded | Fakta succeeded tidak diturunkan |
| CORE-AC05 | Uang diterima setelah booking expired | Tidak mengonfirmasi resource yang sudah dijual; kasus punya PIC dan opsi penyelesaian |
| CORE-AC06 | Refund parsial berulang | Total refund tidak melebihi saldo refundable; concurrency tidak melewati batas |
| CORE-AC07 | Batch payout retry setelah timeout transfer | Cek referensi bank sebelum mengeksekusi ulang; tidak membayar dua kali |
| CORE-AC08 | Email gagal sesudah confirmed | Voucher dashboard tetap dapat diakses; retry email tidak membuat booking baru |
| CORE-AC09 | Kebijakan harga/komisi diganti | Booking lama memakai snapshot sebelumnya dan laporan tetap dapat ditelusuri |
| CORE-AC10 | Resource ruang digunakan MICE dan Wedding | Blok operasional bersama; inquiry belum final tidak menjanjikan penguncian tanggal |
| CORE-AC11 | Restore backup | Rekonsiliasi provider dan event sebelum replay; uang/alokasi tidak digandakan |

## 6. Standar akses, data dan kualitas

Terapkan NFR-01–15 dari general: responsif, target aksesibilitas WCAG 2.2 AA, otorisasi objek server, MFA staf, verifikasi webhook, file publik/privat terpisah, audit tersanitasi, monitoring dan uji restore. Target performa usulan: p95 search inventori lokal ≤3 detik pada 100 pengguna aktif dan dataset pilot; flight timeout usulan 30 detik diukur terpisah; availability 99,5%, RPO ≤1 jam, RTO ≤8 jam perlu validasi engineering/biaya. LCP p75 target ≤2,5 detik pada profil uji disepakati.

Parameter baru usulan untuk detail QA: OTP berlaku 5 menit, maksimal 5 percobaan per challenge, jeda kirim ulang 60 detik; batas file privat 10 MB per file PDF/JPG/PNG, scan dan sanitasi wajib sebelum akses. Angka ini belum keputusan klien dan harus dapat dikonfigurasi serta dikonfirmasi Product/Security sebelum produksi. Jangan meminta identitas sensitif jika tidak diperlukan untuk layanan/kontrak.

Nominal IDR dan pembulatan harus ditetapkan Finance serta sama pada tampilan, gateway, refund dan statement. Periode laporan menyebut jenis tanggal dan zona waktunya; pipeline, GMV, komisi, hak mitra serta payout adalah metrik berbeda. Snapshot biaya/pajak bersifat transaksi, bukan pembacaan ulang master terbaru.

## 7. Gate uang nyata dan scope lengkap

Scope enam kategori tetap mengikuti general. Kontrak supplier flight search-only serta akses produksi wajib untuk menyatakan flight P0 selesai; coming soon bukan pengganti live search. Venue P0 tidak menerima DP atau menerbitkan voucher berbayar. Hotel/home/car memerlukan gateway teruji, kebijakan D-03–05 dan D-09 final, mitra valid serta SOP exception. Semua fitur dapat dikembangkan di sandbox sambil keputusan bisnis berjalan.

Client sign-off mencakup baseline, UAT, PIC operasional, Finance maker/checker, monitoring serta rollback. Perubahan scope membutuhkan decision log dan estimasi dampak, bukan menganggap semua fase sudah disetujui karena dokumen diterbitkan.
