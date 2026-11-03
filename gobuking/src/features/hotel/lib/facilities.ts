import type { Hotel } from './types';
export type FacilityIcon =
  | 'pool'
  | 'wifi'
  | 'spa'
  | 'restaurant'
  | 'parking'
  | 'accessible'
  | 'bed'
  | 'bath'
  | 'air'
  | 'tv'
  | 'coffee'
  | 'safe'
  | 'shower'
  | 'towels'
  | 'hairdryer'
  | 'reception'
  | 'cleaning'
  | 'laundry'
  | 'luggage'
  | 'security'
  | 'smoke'
  | 'garden'
  | 'sun'
  | 'breakfast'
  | 'roomservice'
  | 'massage'
  | 'lift';
export type FacilityStatus = 'included' | 'extra' | 'rate' | 'request';
export type FacilityItem = {
  icon: FacilityIcon;
  title: string;
  description: string;
  status: FacilityStatus;
};
export type FacilityGroup = {
  id: string;
  icon: FacilityIcon;
  title: string;
  description: string;
  items: FacilityItem[];
};
const item = (
  icon: FacilityIcon,
  title: string,
  description: string,
  status: FacilityStatus = 'included',
): FacilityItem => ({ icon, title, description, status });
// Synthetic property details, consistent with the amenity flags used by filters.
// A production API must supply property-level detail and cost policies explicitly.
export function getHotelFacilities(hotel: Hotel): FacilityGroup[] {
  const groups: FacilityGroup[] = [
    {
      id: 'room',
      icon: 'bed',
      title: 'Kenyamanan kamar',
      description: 'Perlengkapan untuk waktu istirahat yang lebih nyaman.',
      items: [
        item(
          'air',
          'AC dalam kamar',
          'Pengaturan suhu tersedia di setiap kamar demo.',
        ),
        item(
          'bed',
          'Tempat tidur & linen',
          'Jenis tempat tidur mengikuti tipe kamar yang Anda pilih.',
        ),
        item(
          'tv',
          'TV layar datar',
          'Pilihan saluran hiburan untuk menemani waktu bersantai.',
        ),
        item(
          'coffee',
          'Ketel & perlengkapan minum',
          'Ketel listrik, cangkir, serta teh dan kopi di kamar.',
        ),
        item(
          'safe',
          'Brankas pribadi',
          'Penyimpanan barang kecil di dalam kamar.',
        ),
      ],
    },
    {
      id: 'bathroom',
      icon: 'bath',
      title: 'Kamar mandi',
      description: 'Kamar mandi pribadi dengan kebutuhan dasar menginap.',
      items: [
        item(
          'shower',
          'Shower air panas & dingin',
          'Kamar mandi pribadi tersedia pada seluruh tipe kamar.',
        ),
        item(
          'towels',
          'Handuk & perlengkapan mandi',
          'Handuk bersih, sabun, dan sampo disediakan.',
        ),
        item(
          'hairdryer',
          'Pengering rambut',
          'Tanyakan ketersediaan kepada resepsionis saat menginap.',
          'request',
        ),
      ],
    },
    {
      id: 'service',
      icon: 'reception',
      title: 'Layanan tamu',
      description: 'Bantuan selama kedatangan dan masa menginap.',
      items: [
        item(
          'reception',
          'Resepsionis 24 jam',
          'Bantuan tamu tersedia sepanjang hari; waktu check-in tetap mengikuti aturan hotel.',
        ),
        item(
          'luggage',
          'Penitipan bagasi',
          'Penitipan sebelum check-in atau setelah check-out mengikuti kapasitas penyimpanan.',
          'request',
        ),
        item(
          'cleaning',
          'Housekeeping harian',
          'Pembersihan kamar dilakukan sesuai jadwal layanan hotel.',
        ),
        item(
          'laundry',
          'Laundry & setrika',
          'Layanan pencucian dan penyetrikaan dihitung terpisah.',
          'extra',
        ),
      ],
    },
    {
      id: 'safety',
      icon: 'security',
      title: 'Keamanan & kenyamanan umum',
      description: 'Fasilitas bersama untuk mendukung masa menginap.',
      items: [
        item(
          'security',
          'Keamanan area properti',
          'Petugas keamanan dan CCTV tersedia di area publik, bukan di ruang privat.',
        ),
        item(
          'smoke',
          'Detektor asap',
          'Perlengkapan keselamatan tersedia di area properti demo.',
        ),
        item(
          'bed',
          'Pilihan kamar bebas rokok',
          'Konfirmasikan pilihan kamar bebas rokok sebelum kedatangan.',
          'request',
        ),
      ],
    },
  ];
  if (hotel.amenities.includes('wifi'))
    groups.splice(2, 0, {
      id: 'internet',
      icon: 'wifi',
      title: 'Internet & konektivitas',
      description: 'Tetap terhubung selama perjalanan Anda.',
      items: [
        item(
          'wifi',
          'Wi-Fi di kamar',
          'Akses internet nirkabel tersedia pada seluruh tipe kamar.',
        ),
        item(
          'wifi',
          'Wi-Fi di area publik',
          'Jaringan tersedia di lobi dan area bersama. Kecepatan dapat berbeda menurut lokasi.',
        ),
      ],
    });
  if (hotel.amenities.includes('restaurant'))
    groups.push({
      id: 'dining',
      icon: 'restaurant',
      title: 'Makanan & minuman',
      description: 'Pilihan bersantap dengan ketentuan tarif yang jelas.',
      items: [
        item(
          'restaurant',
          'Restoran di properti',
          'Pilihan menu tersedia sesuai jam operasional restoran.',
          'extra',
        ),
        item(
          'breakfast',
          'Pilihan sarapan',
          'Termasuk hanya pada tarif bertanda sarapan; periksa pilihan tarif kamar.',
          'rate',
        ),
        item(
          'roomservice',
          'Layanan makan ke kamar',
          'Menu, jam layanan, dan biaya pemesanan mengikuti ketentuan hotel.',
          'extra',
        ),
        item(
          'restaurant',
          'Kebutuhan makanan khusus',
          'Sampaikan alergi atau preferensi makanan; pemenuhannya perlu konfirmasi.',
          'request',
        ),
      ],
    });
  if (
    !hotel.amenities.includes('restaurant') &&
    hotel.rooms.some((room) => room.rates.some((rate) => rate.breakfast))
  )
    groups.push({
      id: 'dining',
      icon: 'breakfast',
      title: 'Makanan & minuman',
      description: 'Pilihan bersantap dengan ketentuan tarif yang jelas.',
      items: [
        item(
          'breakfast',
          'Pilihan sarapan',
          'Termasuk hanya pada tarif bertanda sarapan; periksa pilihan tarif kamar.',
          'rate',
        ),
      ],
    });
  if (hotel.amenities.includes('pool'))
    groups.push({
      id: 'pool',
      icon: 'pool',
      title: 'Kolam renang & area santai',
      description: 'Ruang untuk bersantai di sela perjalanan.',
      items: [
        item(
          'pool',
          'Kolam renang outdoor',
          'Akses kolam untuk tamu yang menginap mengikuti jam operasional.',
        ),
        item(
          'sun',
          'Kursi santai di tepi kolam',
          'Dapat digunakan sesuai ketersediaan; tidak dapat dipesan terlebih dahulu.',
        ),
        item(
          'towels',
          'Handuk kolam',
          'Pengambilan dan pengembalian mengikuti prosedur area kolam.',
        ),
        item(
          'garden',
          'Area duduk terbuka',
          'Area bersama untuk beristirahat dan menikmati suasana properti.',
        ),
      ],
    });
  if (hotel.amenities.includes('spa'))
    groups.push({
      id: 'wellness',
      icon: 'spa',
      title: 'Spa & relaksasi',
      description: 'Lengkapi waktu istirahat dengan perawatan pilihan.',
      items: [
        item(
          'spa',
          'Layanan spa',
          'Pilihan perawatan mengikuti menu dan jadwal terapis.',
          'extra',
        ),
        item(
          'massage',
          'Pijat & perawatan tubuh',
          'Reservasi terpisah diperlukan; harga tidak termasuk tarif kamar.',
          'extra',
        ),
      ],
    });
  if (hotel.amenities.includes('parking'))
    groups.push({
      id: 'parking',
      icon: 'parking',
      title: 'Parkir & kedatangan',
      description: 'Informasi untuk Anda yang datang dengan kendaraan.',
      items: [
        item(
          'parking',
          'Area parkir di properti',
          'Tempat parkir mengikuti kapasitas; konfirmasikan biaya dan kebutuhan reservasi.',
          'request',
        ),
        item(
          'luggage',
          'Bantuan saat kedatangan',
          'Bantuan membawa barang dapat diminta kepada petugas.',
          'request',
        ),
      ],
    });
  if (hotel.amenities.includes('accessible'))
    groups.push({
      id: 'accessibility',
      icon: 'accessible',
      title: 'Aksesibilitas',
      description:
        'Pastikan kebutuhan akses Anda dikonfirmasi sebelum memesan.',
      items: [
        item(
          'accessible',
          'Akses kursi roda di area umum',
          'Akses tersedia di area publik tertentu; tanyakan jalur dan lebar pintu kepada mitra.',
        ),
        item(
          'lift',
          'Bantuan akses ke kamar',
          'Kamar aksesibel, lift, dan kamar mandi khusus perlu dikonfirmasi per tipe kamar.',
          'request',
        ),
        item(
          'reception',
          'Bantuan kebutuhan akses',
          'Sampaikan kebutuhan mobilitas saat memesan agar mitra dapat mengonfirmasi kesesuaiannya.',
          'request',
        ),
      ],
    });
  return groups;
}
