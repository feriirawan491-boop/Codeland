import {
  BedDouble,
  House,
  Plane,
  Presentation,
  Heart,
  CarFront,
} from 'lucide-react';
export const COMPANY = {
  name: 'Gobuking',
  tagline: 'Setiap perjalanan, punya cerita.',
  locale: 'id-ID',
  currency: 'IDR',
} as const;
export const SERVICES = [
  {
    id: 'hotel',
    label: 'Hotel',
    icon: BedDouble,
    path: '/hotels',
    location: 'Kota, area, atau nama hotel',
    phase: 2,
  },
  {
    id: 'home',
    label: 'Home Rental',
    icon: House,
    path: '/homes',
    location: 'Kota, area, atau nama hunian',
    phase: 3,
  },
  {
    id: 'flight',
    label: 'Penerbangan',
    icon: Plane,
    path: '/flights',
    location: 'Bandara keberangkatan',
    phase: 4,
  },
  {
    id: 'mice',
    label: 'MICE',
    icon: Presentation,
    path: '/mice',
    location: 'Kota atau nama venue',
    phase: 5,
  },
  {
    id: 'wedding',
    label: 'Wedding',
    icon: Heart,
    path: '/wedding',
    location: 'Kota atau nama venue',
    phase: 6,
  },
  {
    id: 'car',
    label: 'Rental Mobil',
    icon: CarFront,
    path: '/cars',
    location: 'Kota pengambilan',
    phase: 7,
  },
] as const;
export type ServiceId = (typeof SERVICES)[number]['id'];
export const INFO_PAGES = {
  help: {
    title: 'Ada yang bisa kami bantu?',
    intro: 'Temukan jawaban untuk merencanakan perjalanan Anda.',
    sections: [
      [
        'Bagaimana cara mencari layanan?',
        'Pilih kategori di beranda, tentukan lokasi dan jadwal, kemudian tekan Cari. Anda dapat menjelajah tanpa membuat akun.',
      ],
      [
        'Apakah saya sudah bisa melakukan pemesanan?',
        'Versi lokal ini merupakan demo frontend. Hotel dan Home Rental mencakup pemesanan dan pembayaran langsung. Flights hanya pencarian. MICE dan Wedding mencakup inquiry serta permintaan. Car Rental mencakup verifikasi mitra, pembayaran setelah persetujuan, dan serah terima demo.',
      ],
      [
        'Apa perbedaan layanan venue dan penginapan?',
        'MICE menyediakan inquiry, penawaran versi, dan permintaan kontrak demo. Wedding juga memakai inquiry dan permintaan. Hotel dan Home Rental memakai pembayaran langsung. Rental mobil memerlukan verifikasi dan persetujuan mitra sebelum pembayaran.',
      ],
      [
        'Bagaimana dengan tiket penerbangan?',
        'Scope MVP penerbangan adalah pencarian jadwal dan harga dari supplier. Pembelian dan penerbitan tiket belum termasuk.',
      ],
    ],
  },
  partner: {
    title: 'Tumbuh bersama Gobuking.',
    intro:
      'Satu tempat untuk memperkenalkan usaha Anda kepada lebih banyak penjelajah.',
    sections: [
      [
        'Untuk beragam usaha',
        'Hotel, villa, apartemen, venue acara, dan penyedia rental mobil merupakan kategori kemitraan Gobuking.',
      ],
      [
        'Kelola usaha secara mandiri',
        'Partner Dashboard pada Phase 9 direncanakan untuk mengelola listing, ketersediaan, reservasi, inquiry, serta laporan.',
      ],
      [
        'Pendaftaran belum dibuka',
        'Phase 1 berfokus pada beranda. Form pendaftaran mitra akan tersedia setelah alur onboarding diimplementasikan.',
      ],
    ],
  },
  about: {
    title: 'Perjalanan baik dimulai di sini.',
    intro:
      'Gobuking mempertemukan rencana perjalanan dengan tempat dan pengalaman di Indonesia.',
    sections: [
      [
        'Enam layanan, satu tujuan',
        'Temukan hotel, hunian, penerbangan, ruang pertemuan, venue pernikahan, dan rental mobil.',
      ],
      [
        'Tentang versi ini',
        'Website lokal ini mencakup Phase 01–07, Hotel, Home Rental, Flights, MICE, Wedding Venue dan Car Rental. Seluruh properti, harga, serta pembayaran menggunakan data simulasi dan tidak dapat ditransaksikan.',
      ],
    ],
  },
  privacy: {
    title: 'Privasi dalam demo lokal',
    intro: 'Anda dapat mencoba beranda tanpa membuat akun.',
    sections: [
      [
        'Data yang tersimpan',
        'Hanya ID properti contoh yang Anda simpan disimpan pada browser ini. Form pencarian menggunakan parameter publik pada URL.',
      ],
      [
        'Kontrol Anda',
        'Hapus properti tersimpan melalui tombol hati atau hapus data situs pada pengaturan browser. Jangan masukkan dokumen atau informasi sensitif dalam demo.',
      ],
      [
        'Kebijakan produksi',
        'Ketentuan privasi, retensi, dan pemrosesan data untuk layanan produksi perlu ditinjau dan disetujui sebelum peluncuran.',
      ],
    ],
  },
  terms: {
    title: 'Ketentuan demo',
    intro:
      'Gunakan versi lokal untuk meninjau beranda dan alur Hotel dan Home Rental dari pencarian sampai status pesanan demo, serta pencarian Flights tanpa pembelian tiket.',
    sections: [
      [
        'Tanpa transaksi nyata',
        'Demo ini tidak menerima pembayaran, menjamin ketersediaan, atau menerbitkan konfirmasi reservasi.',
      ],
      [
        'Konten ilustrasi',
        'Nama listing, harga, dan promo merupakan data sintetis untuk kebutuhan review UI. Foto merupakan ilustrasi, bukan dokumentasi properti yang disebut.',
      ],
      [
        'Kebijakan pembatalan',
        'Kebijakan akan ditampilkan per tarif atau paket pada fase transaksi. Ketentuan komersial produksi belum ditetapkan.',
      ],
    ],
  },
} as const;
