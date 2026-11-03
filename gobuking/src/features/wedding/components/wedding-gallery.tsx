'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Images, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
export function WeddingGallery({
  name,
  photos,
}: {
  name: string;
  photos: { image: string; area: string }[];
}) {
  const { t } = useI18n();
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [active, setActive] = useState<number | null>(null),
    [failed, setFailed] = useState<string[]>([]);
  const render = (image: string, area: string, priority = false) =>
    failed.includes(image) ? (
      <span className="wedding-image-fallback">
        <ImageOff size={28} />
        {t('Foto belum tersedia')}
        <small>{t(area)}</small>
      </span>
    ) : (
      <Image
        src={`/images/${image}.jpg`}
        fill
        priority={priority}
        alt={t('Ilustrasi {area}', { area: t(area) })}
        sizes="(max-width:767px) 95vw, 65vw"
        className="object-cover"
        onError={() => setFailed((values) => [...new Set([...values, image])])}
      />
    );
  return (
    <>
      <div className="wedding-gallery">
        {photos.map((photo, i) => (
          <button
            key={`${photo.image}-${i}`}
            type="button"
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setActive(i);
            }}
            aria-label={t('Buka foto area {number}', { number: i + 1 })}
          >
            {render(photo.image, photo.area, i === 0)}
            <span className="wedding-photo-caption">
              {t(photo.area)}
              {i === photos.length - 1 && <Images size={17} />}
            </span>
          </button>
        ))}
      </div>
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent
          className="max-w-4xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <DialogTitle className="text-xl font-bold pr-8">{name}</DialogTitle>
          <DialogDescription className="mt-2">
            {t('Foto ilustrasi berlabel area, bukan dokumentasi venue nyata.')}
          </DialogDescription>
          <div className="relative aspect-video overflow-hidden rounded-xl my-5">
            {render(photos[active ?? 0].image, photos[active ?? 0].area)}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t(photos[active ?? 0].area)}
          </p>
          <div className="flex items-center justify-between">
            <Button
              size="icon"
              variant="outline"
              aria-label={t('Foto sebelumnya')}
              onClick={() =>
                setActive(
                  (value) => ((value ?? 0) - 1 + photos.length) % photos.length,
                )
              }
            >
              <ChevronLeft />
            </Button>
            <span>
              {(active ?? 0) + 1} / {photos.length}
            </span>
            <Button
              size="icon"
              variant="outline"
              aria-label={t('Foto berikutnya')}
              onClick={() =>
                setActive((value) => ((value ?? 0) + 1) % photos.length)
              }
            >
              <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
