# Indeks PRD Per Phase Gobuking MVP

Versi 1.0 — 28 Oktober 2026. Status draft turunan [PRD General v1.0](../PRD_General_Gobuking_MVP_v1.0.md).

Paket ini berisi sepuluh PRD spesifik mengikuti urutan modul yang diminta, satu kontrak shared dan indeks delivery. Nomor phase mengidentifikasi scope, sedangkan urutan implementasi mengikuti dependensi. Seluruh P0 tetap MVP; nomor Phase 10 tidak berarti fondasi admin baru dibangun terakhir.

## 1. Daftar dokumen

| Phase | Modul | PRD |
|---|---|---|
| 01 | Homepage | [Buka PRD](01_PRD_Phase_01_Homepage.md) |
| 02 | Hotel | [Buka PRD](02_PRD_Phase_02_Hotel.md) |
| 03 | Home Rental | [Buka PRD](03_PRD_Phase_03_Home_Rental.md) |
| 04 | Flights | [Buka PRD](04_PRD_Phase_04_Flights.md) |
| 05 | MICE | [Buka PRD](05_PRD_Phase_05_MICE.md) |
| 06 | Wedding Venue | [Buka PRD](06_PRD_Phase_06_Wedding_Venue.md) |
| 07 | Car Rental | [Buka PRD](07_PRD_Phase_07_Car_Rental.md) |
| 08 | User Dashboard | [Buka PRD](08_PRD_Phase_08_User_Dashboard.md) |
| 09 | Partner Dashboard | [Buka PRD](09_PRD_Phase_09_Partner_Dashboard.md) |
| 10 | Super Admin | [Buka PRD](10_PRD_Phase_10_Super_Admin.md) |

[Kontrak Lintas Phase](00_Kontrak_Lintas_Phase.md) mengikat seluruh paket: booking, pembayaran, status, aturan bisnis, ownership komponen dan acceptance kegagalan. Baca bersama PRD modul agar tidak membangun status/ledger ganda.

## 2. Urutan implementasi yang disarankan

| Gelombang | Bagian fase yang dikerjakan | Entry gate | Exit gate |
|---|---|---|---|
| G0 — scope dan kontrak | Semua fase: prototipe, model komersial, kontrak data dan supplier | Sponsor/PIC tersedia | Baseline D-01–15 dan pemilik blocker tercatat; keputusan yang menghalangi desain diselesaikan |
| G1 — fondasi | Phase 08 identitas; Phase 09 organisasi/listing/calendar; Phase 10 verification/CMS/audit; Phase 01 shell | Model role dan katalog disepakati | Dua mitra uji terisolasi, publish dan harga/stok berjalan, login dapat dipakai checkout |
| G2 — transaksi pertama | Phase 02 lengkap, core hold/payment, irisan Phase 08/09/10 untuk booking/refund/settlement | Gateway sandbox dan inventori pilot | Booking sampai refund/payout dapat ditelusuri; failure path lulus |
| G3 — perluasan produk | Phase 03 dan 07; irisan dashboard serta Finance terkait | Core transaksi stabil dan kebijakan unit/armada | Unit/buffer/driver tidak konflik, request/approval/payment/pemenuhan lulus |
| G4 — venue dan flight | Phase 05/06 inquiry/quote, Phase 04 supplier search; dashboard terkait | Ruang/layout dan supplier siap | Quote/request tidak disamakan confirmed; hasil flight nyata dan failure path benar |
| G5 — penyelesaian dan pilot | Seluruh Phase 01–10, laporan, UX, operasional dan monitoring | Seluruh P0 terintegrasi | UAT per modul/shared, security/restore, pelatihan, gate uang nyata dan sign-off |

G4 dapat dimulai bersama G2/G3 setelah fondasi relevan siap. Aktivasi enam kategori bergantung pada data dan konektor nyata. Tidak ada janji kalender atau jumlah sprint sebelum kapasitas tim dan integrasi diestimasi.

## 3. Definisi batas yang dipertahankan

- Hotel/Home/Car: booking, payment dan konfirmasi; request-to-book sesuai modul.
- Flights: live search P0; PNR/payment/issuance P1.
- MICE/Wedding: inquiry, quote dan permintaan booking P0; DP/termin/kontrak digital P1.
- Mitra mengelola inventori lewat extranet; bantuan admin diaudit. Channel manager produksi P1.
- Pembayaran penuh gateway, komisi dan payout mingguan manual adalah baseline usulan, bukan keputusan komersial final.
- Fitur shared dihitung sekali; seluruh AC modul dan CORE-AC harus punya bukti pengujian yang relevan.

## 4. Pembagian kerja dan estimasi

BA menurunkan setiap ID fitur menjadi backlog dan acceptance test; Designer menyiapkan prototipe state; Engineering memperkirakan frontend/backend/integrasi; QA menilai data uji dan risiko; Operations/Finance memvalidasi SOP. PM menyusun sprint setelah dependensi diketahui, mencatat blocker, dan mengelola perubahan scope.

Setiap backlog item menyimpan: ID PRD, pemilik, role pengguna, precondition, perubahan state/data, AC, dependensi, ukuran estimasi, risiko, dan bukti uji. Penyelesaian frontend dengan data dummy tidak dianggap penyelesaian integrasi produksi.

## 5. Persetujuan dan referensi

PRD General tetap sumber keputusan D-01–15, model bisnis dan referensi benchmark. Sepuluh dokumen ini memperinci perilaku tanpa mengganti pilihan komersial terbuka. Jika terjadi konflik, catat dan selesaikan dengan Product Owner sebelum acceptance; jangan diam-diam mengubah general atau menurunkan P0 menjadi P1.

Versi pertama belum merupakan estimasi final atau kontrak delivery. Pemilik bisnis menerima scope; Product menerima UX/fitur; Operations/mitra menerima proses layanan; Finance menerima uang/refund/payout; Engineering/QA menerima bukti kualitas sesuai peran.
