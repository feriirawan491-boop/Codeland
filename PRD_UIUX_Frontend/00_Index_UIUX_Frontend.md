# Indeks PRD UI UX dan Frontend Gobuking

Versi 1.0 — 28 Oktober 2026. Paket spesifikasi UI/UX dan frontend, diturunkan dari PRD bisnis per fase. Dokumen lama dipertahankan. Tidak ada kode aplikasi atau desain visual final yang diklaim sudah dibuat.

## 1. Dokumen per fase

| Phase | Modul | Dokumen |
|---|---|---|
| 01 | Homepage | [PRD UI UX dan Frontend](01_PRD_UIUX_FE_Phase_01_Homepage.md) |
| 02 | Hotel | [PRD UI UX dan Frontend](02_PRD_UIUX_FE_Phase_02_Hotel.md) |
| 03 | Home Rental | [PRD UI UX dan Frontend](03_PRD_UIUX_FE_Phase_03_Home_Rental.md) |
| 04 | Flights | [PRD UI UX dan Frontend](04_PRD_UIUX_FE_Phase_04_Flights.md) |
| 05 | MICE | [PRD UI UX dan Frontend](05_PRD_UIUX_FE_Phase_05_MICE.md) |
| 06 | Wedding Venue | [PRD UI UX dan Frontend](06_PRD_UIUX_FE_Phase_06_Wedding_Venue.md) |
| 07 | Car Rental | [PRD UI UX dan Frontend](07_PRD_UIUX_FE_Phase_07_Car_Rental.md) |
| 08 | User Dashboard | [PRD UI UX dan Frontend](08_PRD_UIUX_FE_Phase_08_User_Dashboard.md) |
| 09 | Partner Dashboard | [PRD UI UX dan Frontend](09_PRD_UIUX_FE_Phase_09_Partner_Dashboard.md) |
| 10 | Super Admin | [PRD UI UX dan Frontend](10_PRD_UIUX_FE_Phase_10_Super_Admin.md) |

Baca [Design System dan Kontrak Frontend](00_Design_System_dan_Kontrak_Frontend.md) bersama PRD modul. Paket menguraikan 86 fitur bisnis menjadi komponen, interaksi dan 172 acceptance criteria frontend, ditambah route inventory, responsive rules, state, adapter, fixture dan rencana test.

## 2. Cara menggunakan dokumen

1. Product/BA memeriksa konsistensi batas MVP dengan PRD General dan phase bisnis.
2. Designer membuat wireframe/high-fidelity dan prototype berdasarkan screen inventory, hierarki, komponen dan state; review visual final tetap diperlukan.
3. Frontend menetapkan struktur proyek, routing dan stack, lalu membuat shared primitives serta adapter.
4. Backend menyediakan fakta dan kontrak layanan. Sampai tersedia, frontend menggunakan fixture terkontrol untuk demo dan test.
5. QA menguji AC-FE serta keadaan lintas fase. UAT transaksi nyata memerlukan backend dan provider yang memenuhi gate produk.

## 3. Urutan pengerjaan frontend

| Gelombang | Paket kerja | Hasil yang dapat direview |
|---|---|---|
| FE-0 | Token, route map, view model, role/capability context dan fixture harness | Shared contract dan screen inventory disepakati |
| FE-1 | Public/customer/partner/admin shell, identity UI; Homepage | Navigation responsif, auth handoff mock, CMS content adapter |
| FE-2 | Hotel + checkout/status bersama; irisan User/Partner/Admin | Pencarian sampai status booking pada fixture, seluruh kegagalan penting |
| FE-3 | Home dan Car + kalender/unit/paket UI | Flow request/approval/payment view; armada serta status operasional |
| FE-4 | MICE/Wedding inquiry/quote/request; Flights search | Kapasitas/paket/quote berversi dan itinerary/search-only |
| FE-5 | Dashboard lengkap, finance views, reporting dan akses | Seluruh route/role/state, test responsive/a11y, contract gap register |
| FE-6 | Adapter API yang tersedia, QA dan handoff | Label readiness yang benar: demo-ready vs API-integrated |

Fase ini mengatur urutan dependensi frontend, bukan janji kalender/biaya. Tidak menunda seluruh fondasi Partner/Admin sampai akhir. Finansial UI menampilkan preview dan keputusan layanan tanpa mengimplementasikan ledger/transfer di browser.

## 4. Hasil dan batas penerimaan

Masing-masing PRD memuat tujuan, route/layar, responsive layout, wireframe struktural, detail per fitur, form, state/cache/URL, data adapter, error states, aksesibilitas, struktur frontend, dependensi, pengukuran serta test/DoD. P0 bisnis tetap dipertahankan dengan depth sebelumnya: Flights search-only; MICE/Wedding inquiry/quote/request; Hotel/Home/Car transaksi sesuai layanan.

ID bisnis dipertahankan; suffix FE01/FE02 hanya menandai acceptance frontend, bukan bukti server sudah aman atau transaksi berhasil. Parameter visual, polling dan stack merupakan usulan untuk review. Semua keputusan komersial terbuka tetap berada pada [PRD General](../PRD_General_Gobuking_MVP_v1.0.md).
