'use client';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedListings } from '@/hooks/use-saved-listings';
import { useI18n } from '@/components/i18n/locale-provider';
export function SavePropertyButton({ id }: { id: string }) {
  const { saved, update } = useSavedListings(),
    { t } = useI18n(),
    active = saved.includes(id);
  return (
    <Button
      variant="outline"
      aria-pressed={active}
      onClick={() =>
        update(active ? saved.filter((v) => v !== id) : [...saved, id])
      }
    >
      <Heart size={18} fill={active ? 'currentColor' : 'none'} />
      {t(active ? 'Tersimpan' : 'Simpan properti')}
    </Button>
  );
}
