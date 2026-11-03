'use client';
import PropertyMap from '@/components/property/property-map';
import type { HotelResult } from '../lib/types';
export default function HotelMap({
  results,
  ...props
}: {
  results: HotelResult[];
  selected: string | null;
  onSelect: (id: string) => void;
  failed?: boolean;
}) {
  return (
    <PropertyMap
      results={results.map(({ hotel, quote }) => ({
        id: hotel.id,
        name: hotel.name,
        coordinates: hotel.coordinates,
        total: quote.total,
      }))}
      {...props}
    />
  );
}
