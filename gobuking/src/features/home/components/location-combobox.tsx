'use client';
import { useI18n } from '@/components/i18n/locale-provider';
import { useEffect, useId, useRef, useState } from 'react';
import { MapPin, Plane, ChevronDown, LoaderCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { AIRPORTS, LOCATIONS, type LocationOption } from '../lib/search';
export function LocationCombobox({
  value,
  onChange,
  label,
  error,
  airport = false,
  id,
}: {
  value: string;
  onChange: (id: string) => void;
  label: string;
  error?: string;
  airport?: boolean;
  id: string;
}) {
  const { t } = useI18n();
  const options: readonly LocationOption[] = airport ? AIRPORTS : LOCATIONS;
  const selected = options.find((o) => o.id === value);
  const [text, setText] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const query = useDebounce(text);
  const filtered = options.filter(
    (o) =>
      !query ||
      o.label.toLowerCase().includes(query.toLowerCase()) ||
      o.detail.toLowerCase().includes(query.toLowerCase()) ||
      t(o.detail).toLowerCase().includes(query.toLowerCase()),
  );
  const searching = text !== query;
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  function select(option: LocationOption) {
    onChange(option.id);
    setText(option.label);
    setOpen(false);
    setActive(-1);
  }
  return (
    <div className="search-field relative" ref={root}>
      <label htmlFor={id} className="field-label">
        {airport ? <Plane size={16} /> : <MapPin size={16} />} {t(label)}
      </label>
      <div className="location-control">
        <input
          id={id}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            open && active >= 0 ? `${listId}-${active}` : undefined
          }
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={airport ? t('Pilih bandara') : t('Mau pergi ke mana?')}
          value={text}
          onFocus={() => {
            setOpen(true);
            setActive(-1);
          }}
          onChange={(e) => {
            setText(e.target.value);
            onChange('');
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, filtered.length - 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            }
            if (e.key === 'Enter' && open) {
              e.preventDefault();
              if (filtered[active]) select(filtered[active]);
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              setOpen(false);
            }
            if (e.key === 'Tab') setOpen(false);
          }}
        />
        <ChevronDown
          size={15}
          className="shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {t(error)}
        </p>
      )}
      {open && (
        <div
          className="location-options"
          role="listbox"
          id={listId}
          aria-label={t('Pilihan {0}', { '0': label })}
        >
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {airport ? t('Bandara Indonesia') : t('Jelajahi destinasi')}
          </p>
          {searching ? (
            <p role="status" className="flex items-center gap-2 p-3 text-sm">
              <LoaderCircle className="size-4 animate-spin" />
              {t(' Mencari lokasi\u2026 ')}
            </p>
          ) : filtered.length ? (
            filtered.map((option, i) => (
              <div
                key={option.id}
                role="option"
                id={`${listId}-${i}`}
                aria-selected={value === option.id}
                className={`flex cursor-pointer gap-3 rounded-lg p-3 ${i === active ? 'bg-secondary' : 'hover:bg-muted'}`}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => select(option)}
              >
                <MapPin size={18} className="mt-1 shrink-0 text-primary" />
                <div>
                  <div className="text-sm font-semibold">
                    {t(option.label)}{' '}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                      {t(option.type)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t(option.detail)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p role="status" className="p-3 text-sm">
              {t('Lokasi belum ditemukan. Coba kota lain. ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
