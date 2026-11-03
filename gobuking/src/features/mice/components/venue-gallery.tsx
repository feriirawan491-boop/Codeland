'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Images, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
export function VenueGallery({
  name,
  images,
}: {
  name: string;
  images: string[];
}) {
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  return (
    <>
      <div className="venue-gallery">
        {images.map((image, i) => (
          <button
            type="button"
            key={`${image}-${i}`}
            onClick={() => setActive(i)}
            aria-label={t('Buka foto {number}', { number: i + 1 })}
          >
            <Image
              src={`/images/${image}.jpg`}
              fill
              priority={i === 0}
              sizes={
                i === 0
                  ? '(max-width:767px) 100vw, 65vw'
                  : '(max-width:767px) 50vw, 30vw'
              }
              alt={t('Ilustrasi ruang {name}', { name })}
              className="object-cover"
            />
            {i === images.length - 1 && (
              <span>
                <Images size={16} />
                {t('Lihat foto')}
              </span>
            )}
          </button>
        ))}
      </div>
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogTitle className="text-xl font-bold pr-8">{name}</DialogTitle>
          <DialogDescription className="mt-2">
            {t('Foto ilustrasi ruang demo, bukan dokumentasi venue nyata.')}
          </DialogDescription>
          <div className="relative aspect-video my-5 overflow-hidden rounded-xl">
            <Image
              src={`/images/${images[active ?? 0]}.jpg`}
              fill
              sizes="900px"
              alt={t('Ilustrasi ruang {name}', { name })}
              className="object-cover"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              aria-label={t('Foto sebelumnya')}
              onClick={() =>
                setActive((i) => ((i ?? 0) - 1 + images.length) % images.length)
              }
            >
              <ChevronLeft />
            </Button>
            <span>
              {(active ?? 0) + 1} / {images.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('Foto berikutnya')}
              onClick={() => setActive((i) => ((i ?? 0) + 1) % images.length)}
            >
              <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
