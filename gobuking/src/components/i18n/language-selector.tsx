'use client';
import { useState } from 'react';
import { Globe2, Check, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useI18n } from './locale-provider';
export function LanguageSelector() {
  const { locale, t, changeLocale, pending } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="language-trigger"
          aria-label={t('Pilih bahasa')}
          aria-busy={pending}
        >
          <Globe2 size={17} />
          <span>{locale.toUpperCase()}</span>
          <ChevronDown size={13} className="hidden sm:block" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64"
        aria-label={t('Bahasa / Language')}
      >
        <h2 className="mb-3 text-sm font-bold">{t('Pilih bahasa')}</h2>
        {(
          [
            { id: 'id', name: 'Bahasa Indonesia', detail: 'Indonesian' },
            { id: 'en', name: 'English', detail: 'Bahasa Inggris' },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={locale === option.id}
            lang={option.id}
            className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-blue-50"
            onClick={() => {
              changeLocale(option.id);
              setOpen(false);
            }}
          >
            <span>
              <span className="block text-sm font-semibold">{option.name}</span>
              <span className="text-xs text-muted-foreground">
                {option.detail}
              </span>
            </span>
            {locale === option.id && <Check className="size-4 text-primary" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
