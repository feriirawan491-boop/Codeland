import {
  Accessibility,
  AirVent,
  Bath,
  BedDouble,
  ArrowUpDown,
  BrushCleaning,
  Cctv,
  ConciergeBell,
  Flower2,
  HandHeart,
  HandPlatter,
  KeyRound,
  Layers,
  Luggage,
  ParkingCircle,
  Shirt,
  ShowerHead,
  AlarmSmoke,
  Sparkles,
  Sun,
  Trees,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wind,
  Coffee,
  type LucideIcon,
} from 'lucide-react';
import type { FacilityIcon as FacilityIconName } from '../lib/facilities';
import type { HotelAmenity } from '../lib/types';
export const AMENITY_ICONS: Record<HotelAmenity, FacilityIconName> = {
  pool: 'pool',
  wifi: 'wifi',
  spa: 'spa',
  restaurant: 'restaurant',
  parking: 'parking',
  accessible: 'accessible',
};
const icons: Record<FacilityIconName, LucideIcon> = {
  pool: Waves,
  wifi: Wifi,
  spa: Flower2,
  restaurant: Utensils,
  parking: ParkingCircle,
  accessible: Accessibility,
  bed: BedDouble,
  bath: Bath,
  air: AirVent,
  tv: Tv,
  coffee: Coffee,
  safe: KeyRound,
  shower: ShowerHead,
  towels: Layers,
  hairdryer: Wind,
  reception: ConciergeBell,
  cleaning: BrushCleaning,
  laundry: Shirt,
  luggage: Luggage,
  security: Cctv,
  smoke: AlarmSmoke,
  garden: Trees,
  sun: Sun,
  breakfast: Coffee,
  roomservice: HandPlatter,
  massage: HandHeart,
  lift: ArrowUpDown,
};
export function FacilityIcon({
  name,
  size = 20,
  className,
}: {
  name: FacilityIconName;
  size?: number;
  className?: string;
}) {
  const Icon = icons[name] ?? Sparkles;
  return (
    <Icon
      size={size}
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    />
  );
}
