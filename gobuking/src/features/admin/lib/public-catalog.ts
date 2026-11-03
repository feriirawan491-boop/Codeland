import type { PartnerListing } from '@/features/partner/lib/types';
import { LOCATIONS } from '@/features/home/lib/search';
import {
  approvedCatalog,
  saveApprovedCatalog,
  PUBLIC_ASSETS,
} from '@/features/catalog/lib/public-state';
import { AdminError } from './store';
export function publishCatalog(
  l: PartnerListing,
  locationId: string,
  image: string,
) {
  if (
    !LOCATIONS.some((v) => v.id === locationId) ||
    !PUBLIC_ASSETS.some((v) => v === image)
  )
    throw new AdminError(
      'VALIDATION',
      'Pilih lokasi katalog dan aset foto publik yang sah.',
    );
  if (!l.sourceId)
    throw new AdminError('VALIDATION', 'Source listing belum terdaftar.');
  saveApprovedCatalog([
    ...approvedCatalog().filter((v) => v.listingId !== l.id),
    {
      listingId: l.id,
      orgId: l.orgId,
      category: l.category,
      sourceId: l.sourceId,
      resourceId: l.resourceId,
      name: l.name.split(' · ')[0],
      address: l.address,
      description: l.description,
      capacity: l.capacity,
      image,
      stock: l.stock,
      price: l.price,
      slug: l.sourceId.startsWith('custom-')
        ? l.sourceId
        : (l.publicPath?.split('/').at(-1) ?? l.sourceId),
      locationId,
      zone:
        locationId === 'bali' || locationId === 'lombok'
          ? 'Asia/Makassar'
          : 'Asia/Jakarta',
      buffer: l.buffer,
      minStay: l.minStay,
      version: l.version + 1,
    },
  ]);
}
