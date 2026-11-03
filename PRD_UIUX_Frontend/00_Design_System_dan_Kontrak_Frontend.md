# Design System dan Kontrak Frontend Gobuking

Versi 1.0 — 28 Oktober 2026. Draft usulan UI/UX dan frontend untuk [10 fase](00_Index_UIUX_Frontend.md), berdasarkan [PRD General](../PRD_General_Gobuking_MVP_v1.0.md) dan [kontrak bisnis](../PRD_Per_Phase/00_Kontrak_Lintas_Phase.md).

## 1. Batas tanggung jawab

Output paket ini adalah spesifikasi Markdown. Tidak mencakup kode aplikasi, backend, desain Figma, penyediaan API, deployment atau pengujian produk yang belum dibuat. Rancangan dipakai sebagai acuan tahap desain dan implementasi frontend berikutnya.

| Frontend dalam scope | Kontrak/dependensi layanan, di luar implementasi frontend |
|---|---|
| Form, validasi kenyamanan, render harga/status | Validasi otoritatif, harga/komisi/pajak, stok dan snapshot |
| Route guard dan capability-based controls | Autentikasi/otorisasi server dan isolasi tenant |
| Request UI, pending/error/conflict, polling status | Hold atomik, idempotensi, lifecycle booking |
| Hosted payment launch dan status page | Verifikasi pembayaran, webhook, refund dan transfer |
| Tabel laporan dan preview berdasarkan respons | Ledger, eligibility payout dan pengakuan pendapatan |
| Mock adapter untuk desain/demo/test | Data supplier nyata, verifikasi mitra dan layanan live |

Label readiness: **design-specified**, **UI demo-ready**, **API-integrated**, dan **product-live-ready** adalah status berbeda. Lulus fixture UI tidak membuktikan pembayaran/stock/security backend lulus. UI tanpa backend dapat diuji melalui mock adapter; mode ini terlihat pada lingkungan demo, bukan ditampilkan sebagai transaksi nyata kepada pelanggan.

## 2. Arah visual dan token usulan

Identitas Gobuking memakai pencarian yang dominan, hierarki harga jelas, konten terbaca, dan navigasi konsisten. Gunakan aset berizin; warna/merek/teks kompetitor tidak disalin. Berikut titik awal untuk review brand, bukan keputusan final klien.

| Token | Nilai usulan | Pemakaian |
|---|---|---|
| brand.primary | #0F766E | CTA utama dan state terpilih, teks putih setelah contrast check |
| brand.primaryHover | #115E59 | Hover CTA utama |
| text.primary | #0F172A | Judul dan isi utama |
| text.secondary | #475569 | Keterangan dan label sekunder |
| surface.base / subtle | #FFFFFF / #F8FAFC | Konten dan latar halaman |
| border.default | #CBD5E1 | Pemisah; control boundary yang butuh kontras memakai token lebih gelap |
| border.control | #64748B | Batas input interaktif bila diperlukan untuk kontras |
| semantic.success / warning / danger | #166534 / #92400E / #B91C1C | Status disertai teks dan ikon; bukan warna saja |
| focus.ring | #1D4ED8 | Fokus 2 px ditambah offset, diuji terhadap latar |
| spacing | 4, 8, 12, 16, 24, 32, 48, 64 px | Grid konsisten |
| radius | 8 px input, 12 px card/dialog | Tidak mencampur radius tanpa alasan |
| typography | System sans-serif; body 16/24, label 14/20, h1 32/40 desktop dan 28/36 mobile | Angka harga 24/32; tabel dapat 14/20 tanpa mengurangi readability |
| control size | Input/button utama ≥44 px tinggi | Target sentuh usulan produk; ikon kecil memakai hit area memadai |
| motion | 120–200 ms, reduced-motion supported | Transisi keadaan, bukan animasi wajib untuk mengerti status |

Seluruh kombinasi teks/latar dan control/fokus diuji kontras sebelum final. Target normal text 4,5:1, teks besar 3:1 dan indikator kontrol penting 3:1 terhadap warna sekitarnya sesuai penerapan WCAG. Token usulan tidak dianggap sudah lolos hanya karena dicantumkan. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## 3. Shell dan responsive rules

Public shell: header logo, enam kategori, bantuan, akun; footer kebijakan/kontak. Customer shell: navigasi pesanan, inquiry, saved, profil dan bantuan. Partner shell: org switch yang jelas, sidebar berdasarkan kategori/permission, topbar notifikasi. Admin shell: konteks platform dan role; tidak bercampur dengan mitra tanpa mode bantuan yang dinyatakan serta diaudit layanan.

Container public maksimal 1280 px; gutter compact 16, medium 24, wide 32 px. Breakpoints compact <768, medium 768–1023, wide ≥1024 px. Overlay tidak bertumpuk tanpa pengelolaan fokus. Pada mobile prioritaskan status, total, ketentuan serta tindakan; diagram/peta dapat menjadi panel sekunder. Tidak ada scroll horizontal seluruh halaman pada 360 px; tabel dua dimensi boleh scroll dalam region berlabel.

## 4. Komponen bersama dan kontrak interaksi

| Komponen | Variants/data | State dan aturan |
|---|---|---|
| Button | primary, secondary, tertiary, danger; icon+text | default/hover/focus/pressed/disabled/pending; pending mempertahankan lebar dan label |
| TextField/Select | label, required, hint, error | Label permanen; error terhubung aria-describedby; tidak memakai placeholder sebagai label |
| LocationCombobox | option id/type/label/secondaryLabel | Arrow untuk pilihan, Enter commit, Escape tutup; teks berubah membatalkan selected ID |
| DateRangePicker | local dates, disabledDates, min/max, timezone | Keyboard calendar dan alternatif input tanggal; alasan disabled; satu bulan mobile dua bulan desktop |
| Guest/PassengerPicker | counts, ages, rules | Stepper berlabel; minimum/maksimum diberi alasan; usia anak tidak hilang saat popover ditutup |
| FilterPanel | draft/applied values, count dan reset | Apply eksplisit pada mobile; Reset tidak menghapus form pencarian utama |
| Dialog/Drawer | title, description, trigger, actions | Fokus masuk, Tab terbatas di modal, Escape tutup kecuali proses harus diselesaikan dengan penjelasan; restore trigger setelah tutup |
| Gallery | images, alt, area labels | Dimensi stabil, lazy load nonhero, placeholder gagal; keyboard dan close jelas |
| PriceSummary | total, currency, unit, breakdown, quoteId | Angka dari sumber quote; null ≠ nol; deposit dan pipeline terpisah |
| StatusBadge/Timeline | domain, status, timestamp | Label berbeda untuk booking/payment/refund/payout; tidak satu warna hijau untuk semua sukses |
| DataTable | columns, row id, sort/filter/page | Table semantik, header sort berlabel, selected state jelas; server pagination bila dataset besar |
| DocumentUpload | accept, maxSize, progress, errors | Validasi kenyamanan, preview aman, remove/retry; secret dan verifikasi file milik layanan |
| ConfirmationDialog | object, action, consequence, amount/version | Destructive action tidak aktif tanpa syarat; sukses dari respons server |
| Toast + InlineAlert | severity, action, lifetime | Toast untuk feedback singkat; transaksi penting tetap mempunyai status persisten |
| Skeleton/Empty/Error | scope, retry, next step | Empty valid dibedakan dari error; retry tidak menghapus konteks |

Dialog dan combobox mengikuti pola [WAI APG Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) dan [WAI APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). Target sentuh produk 44 px adalah pilihan desain; ketentuan minimum WCAG AA memiliki batas dan pengecualian tersendiri, dijelaskan pada [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## 5. Status dan microcopy

| Domain/status | Label UI | Aksi umum bila diizinkan layanan |
|---|---|---|
| booking pending_partner | Menunggu persetujuan mitra | Lihat detail / tarik permintaan jika eligible |
| booking awaiting_payment | Menunggu pembayaran | Bayar / periksa status |
| booking confirmed | Reservasi terkonfirmasi | Voucher / bantuan / batal jika eligible |
| booking exception | Reservasi sedang ditangani | Lihat penanganan / bantuan |
| payment pending | Pembayaran sedang diperiksa | Periksa status |
| payment succeeded | Pembayaran diterima | Bukan otomatis bukti booking confirmed |
| refund processing | Pengembalian dana diproses | Lihat progres |
| refund succeeded | Pengembalian dana selesai | Lihat rincian |
| payout eligible | Siap ditinjau untuk payout | Belum dana dibayarkan |
| payout paid | Payout tercatat dibayarkan | Lihat statement/bukti sesuai izin |
| quote accepted | Penawaran diterima | Bukan jaminan tanggal venue |
| request accepted_for_contract | Lanjut kesepakatan kontrak | Follow-up tanpa pembayaran platform |

Status lain memakai mapping bisnis lengkap dan fallback Status belum dikenali dengan refresh/bantuan, bukan default confirmed. Status badge selalu diberi konteks domain. Jangan menyebut “aman dibayar”, “pasti tersedia”, “terverifikasi” atau “gratis batal” tanpa field sumber dan ketentuan yang mendukung.

## 6. Kontrak data usulan

Operasi pada PRD modul adalah interface adapter frontend; endpoint/method HTTP serta auth mechanism disepakati terpisah. View model minimal hasil transaksi:

```ts
type Action = { enabled: boolean; reason?: string };
type QuoteView = {
  quoteId: string; version: string; currency: 'IDR';
  totalAmount: number; breakdown: Array<{code: string; label: string; amount: number}>;
  expiresAt?: string; serverTime: string;
};
type BookingView = {
  id: string; category: 'hotel' | 'home' | 'car';
  bookingStatus: string; paymentStatus?: string; refundStatus?: string;
  quote: QuoteView;
  actions: Record<string, Action>;
};
type UIError = {
  code: string; message: string; requestId?: string;
  fieldErrors?: Record<string, string>; retryAfter?: number; latestVersion?: string;
};
```

Contoh tipe ini mengungkap field yang dibutuhkan tampilan, bukan domain schema final. Total berasal dari layanan; frontend tidak menyimpulkan paid/eligible dari total atau timestamp. Revisi quote harus menampilkan nilai lama/baru dan membutuhkan persetujuan ulang bila berdampak pada tindakan pelanggan.

Capabilities hanya mengatur pengalaman UI. Perlindungan data membutuhkan pemeriksaan layanan; menghilangkan tombol bukan kontrol keamanan final. Token, gateway secret dan supplier secret tidak boleh berada di bundle/browser atau fixture. Strategi sesi/cookie harus disepakati bersama backend; localStorage tidak dipakai untuk token atau dokumen sensitif.

## 7. Fetch, cache dan mutation

Query key mencakup parameter pencarian dan konteks privat. Abort/sequence guard mencegah respons lama menimpa hasil baru; AbortController adalah salah satu mekanisme platform untuk membatalkan request yang didukung. [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

Usulan polling status saat halaman booking/payment aktif setiap 5 detik pada menit pertama lalu 15 detik, berhenti pada status terminal atau instruksi layanan, jeda saat tab tidak terlihat dan refresh saat aktif. Interval menyesuaikan kuota serta retryAfter; bukan pemaksaan provider. UI tidak mengeksekusi ulang create-payment atau transfer karena polling.

Mutation kritis menampilkan pending, menahan duplicate submit, mempertahankan draft, lalu membaca state sumber. Timeout berarti hasil belum diketahui; periksa status sebelum retry. Optimistic hanya untuk saved/preferensi ringan dengan rollback. Bulk edit calendar menampilkan preview, versi, hasil per item dan conflict; backend menentukan atomic/partial behavior pada kontrak, UI tidak boleh menganggap semuanya berhasil.

## 8. Mock dan matriks fixture wajib

Setiap adapter mempunyai fixture deterministic dan scenario switch untuk staging/demo. Jangan campurkan fixture sebagai fallback diam-diam ketika API produksi gagal. Fixture menggunakan nama/dokumen sintetis, tanpa PII nyata.

| Scenario | Modul minimum |
|---|---|
| ready, loading, empty, offline, 401/403/404/429/500 | Semua modul yang melakukan operasi terkait |
| stale response, query berubah, request aborted | Semua discovery dan tabel dengan search |
| sold_out, price_changed, quote_expired | Hotel/Home/Car dan quote venue |
| request_pending/approved/rejected/expired | Hotel/Home/Car serta venue request dengan domain status berbeda |
| payment pending/succeeded/failed/late/unknown | Checkout/status Hotel/Home/Car dan dashboard |
| old_quote/superseded/accepted_for_contract | MICE/Wedding dan CRM |
| supplier_timeout/no_results/offer_expired | Flights |
| organization_changed/role_revoked/version_conflict | Partner dan Super Admin |
| refund_partial/processing/failed; payout maker_denied/held/paid | Dashboard pelanggan/mitra/admin sesuai akses |

## 9. Performance, aksesibilitas dan QA

Target awal dari general: LCP p75 ≤2,5 detik pada profil uji tercatat. Usulan tambahan UI: CLS ≤0,1 dan INP p75 ≤200 ms sebagai sasaran proyek, perlu validasi budget engineering. Ini target desain, bukan hasil pengukuran aplikasi. Reservasi ukuran gambar, lazy-load map/editor/chart, code-split route, dan pagination membantu memenuhi budget.

Uji visual minimal 360/768/1024/1440 px, reflow 320 CSS px, zoom 200–400%, focus/keyboard, reduced motion, long text, format tanggal/zona, pembaca layar dan koneksi lambat. Periksa input invalid, pending, error, conflict dan empty selain happy path. Bandingkan layout pada snapshot fixture stabil; test tidak menganggap isi screenshot sebagai satu-satunya bukti aksesibilitas.

Readiness frontend mensyaratkan route inventory, state/component coverage, fixtures, schema validation, navigation reload/Back, contract adapter tests, screenshots dan task walkthrough. Keandalan backend, sertifikasi supplier, verifikasi uang serta isolasi database bukan hasil test frontend.

## 10. Decision log desain dan integrasi

| ID | Keputusan terbuka | Usulan / pemilik |
|---|---|---|
| UX-D01 | Brand, font dan token final | Token pada bagian 2; klien/Brand/UX |
| UX-D02 | Stack frontend dan routing | Ikuti repository/tim; Engineering, sebelum implementasi |
| UX-D03 | API view model dan error contract | Adapter pada tiap modul; Frontend+Backend |
| UX-D04 | Auth handoff dan sesi | Draft ID aman, clear cache saat konteks berubah; Frontend+Backend/Security |
| UX-D05 | Lokasi privat dan PII | Public model tidak memuat data privat; Product/Privacy |
| UX-D06 | Browser/device matrix dan performance budget | Viewport bagian 9, perangkat/jaringan pilot; QA/Engineering |
| UX-D07 | Demo vs produksi | Mock label untuk demo, API-integrated diuji terpisah; PM/Product |

Sumber teknis di atas diperiksa pada 28 Oktober 2026. Seluruh parameter baru adalah usulan desain/engineering; tidak mengubah D-01–15 pada PRD General. Dokumen ini melengkapi requirement produk dengan batas frontend yang dapat diuji.
