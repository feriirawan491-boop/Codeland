# Phase 04 Flights — frontend handoff

Mode saat ini: **demo-ready, search-only**. Belum terintegrasi supplier live. UI tidak menerbitkan PNR, tiket, invoice penerbangan, pembayaran, atau konfirmasi reservasi. Provider fixture terpisah dari komponen, melalui `FlightProvider` dan `createFlightAdapter`.

## Kontrak yang dibutuhkan untuk integrasi

- Layanan server memvalidasi rute, tanggal, penumpang, konfigurasi usia/jumlah, kelas, status offer, dan izin supplier. Kredensial/kuota berada di server.
- `searchFlightOffers`: query asal/tujuan, tanggal lokal, tipe perjalanan, penumpang, kelas; mengembalikan satu envelope dengan requestId, fetchedAt, serverTime, mode, source dan data offers.
- `getFlightOffer`: ID offer supplier harus diperiksa bersama konteks query; 404/unavailable berbeda dari hasil kosong.
- `getCompatibleReturnOffers`: kelompok outbound dan kombinasi return yang benar-benar kompatibel, dengan ID dan total kombinasi dari supplier. UI tidak menggabungkan harga dua tiket terpisah.
- `refreshFlightSearch`: pencarian ulang eksplisit. Harga baru tidak dianggap transaksi atau kursi terjamin.
- Setiap segmen memiliki bandara dan zona IANA, departureAt/arrivalAt sebagai instant ISO dengan offset/UTC, nomor penerbangan, carrier, kelas, dan bagasi nullable.
- `total` adalah total semua penumpang termasuk pajak/biaya. Breakdown harus cocok dengan total. Provider fixture memperagakan tarif berbeda menurut kategori penumpang; angka/usia/batas ini **bukan kebijakan maskapai**.
- `expiresAt` boleh null. Jika null UI menampilkan waktu pengambilan dan harga dapat berubah, tanpa menciptakan expiry atau jaminan harga.
- Error aman: VALIDATION, TIMEOUT, UNAVAILABLE, OFFLINE, 401, 403, 404, 429 (`retryAfter` detik), SUPPLIER. Provider harus menghormati abort/deadline server; adapter UI membatalkan request usang.

## Demo dan QA

Skenario URL `scenario`: ready/loading/empty/timeout/rate_limited/offline/unavailable/expired/no_expiry/error/unauthorized/forbidden/inactive. Timeout/loading dipercepat untuk QA; bukan simulasi latency supplier riil. Retry 429 mengikuti retryAfter 3 detik pada fixture. Cache baca dibatasi 20 konteks, 60 detik; key mencakup rute, tanggal, semua kategori penumpang, kelas, mode, locale dan scenario. Refresh tidak memakai cache lama. Tidak ada PII pada cache/URL.

Form mempertahankan field yang sedang diedit; sekali jalan mengabaikan tanggal pulang. Form hasil dan filter terpisah. Draft filter mobile hanya diterapkan saat tombol ditekan. Filter, urutan, halaman, outbound, selected disimpan pada URL publik; perubahan outbound menghapus selected. Back mengembalikan konteks. Harga/durasi/zone tidak dihitung dari label tampilan.

Unit: validasi sebelum provider, serialisasi, total seluruh penumpang, zona dan +1 hari, transit, unknown baggage, kompatibilitas, same-day return, error/expiry, cache dan abort. E2E: pencarian, swap, filter, pagination, pemilihan pulang pergi, detail, back, retry, throttle, bahasa dan responsive/axe. Axe bukan sertifikasi WCAG atau pengganti pemeriksaan pembaca layar manual.

## Gate produk yang belum terpenuhi

FLT-03-AC01 (data nyata) **belum terpenuhi**. Supplier resmi, kontrak search-only, rute pilot, kredensial sandbox/produksi, airport mapping, aturan penumpang, kuota/cache berizin, SLA, monitoring latency/errors dan UAT diperlukan sebelum integrated/pilot. Penanggung jawab integrasi perlu ditetapkan pemilik proyek. Tidak ada klaim bahwa fixture memenuhi acceptance live.
