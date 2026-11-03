'use client';
import { useI18n } from '@/components/i18n/locale-provider';
import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as Tabs from '@radix-ui/react-tabs';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDays,
  UsersRound,
  ChevronDown,
  Search,
  Minus,
  Plus,
  ArrowRight,
  LoaderCircle,
  Info,
  Compass,
} from 'lucide-react';
import { SERVICES, type ServiceId } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DEFAULT_SEARCH,
  localDate,
  restoreSearch,
  searchSchema,
  serializeSearch,
  type SearchValues,
} from '../lib/search';
import { LocationCombobox } from './location-combobox';
import { Hero } from './hero';
function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-5 py-3">
      <div>
        <p className="text-sm font-semibold">{t(label)}</p>
        <p className="text-xs text-muted-foreground">{t(hint)}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t('Kurangi {0}', { '0': t(label) })}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus />
        </Button>
        <span
          className="w-5 text-center text-sm tabular-nums"
          aria-live="polite"
        >
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t('Tambah {0}', { '0': t(label) })}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
export function SearchPanel() {
  const query = useSearchParams();
  const chosen =
    SERVICES.find((s) => s.id === query.get('service'))?.id ?? 'hotel';
  return (
    <SearchPanelInner
      key={query.toString()}
      chosen={chosen}
      initial={{
        ...restoreSearch(new URLSearchParams(query.toString())),
        ...(chosen === 'wedding' && !query.has('layout')
          ? { layout: 'seated' as const }
          : {}),
      }}
    />
  );
}
function SearchPanelInner({
  chosen,
  initial,
}: {
  chosen: ServiceId;
  initial: SearchValues;
}) {
  const { t } = useI18n();
  const [active, setActive] = useState<ServiceId>(chosen);
  const [drafts, setDrafts] = useState<
    Partial<Record<ServiceId, SearchValues>>
  >({ [chosen]: initial });
  return (
    <section
      id="search"
      aria-label={t('Pencarian layanan')}
      className="search-experience scroll-mt-5"
    >
      <Tabs.Root
        value={active}
        onValueChange={(v) => setActive(v as ServiceId)}
      >
        <Hero />
        <div className="search-panel-backdrop">
          <div className="search-panel page-container">
            <div className="search-panel-heading">
              <div>
                <h2>{t('Rencanakan perjalanan Anda')}</h2>
                <p>{t('Pilih layanan dan temukan yang sesuai untuk Anda.')}</p>
              </div>
              <span className="search-panel-note">
                <Compass size={16} />
                {t('Satu tempat, banyak rencana')}
              </span>
            </div>
            <div className="service-navigation">
              <Tabs.List
                aria-label={t('Pilih layanan')}
                className="service-tabs"
              >
                {SERVICES.map((s) => (
                  <Tabs.Trigger key={s.id} value={s.id} className="service-tab">
                    <s.icon size={21} strokeWidth={1.7} />
                    <span>{t(s.label)}</span>
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </div>
            {SERVICES.map((service) => (
              <Tabs.Content
                key={service.id}
                value={service.id}
                className="search-tab-content"
              >
                <SearchForm
                  service={service.id}
                  initial={
                    drafts[service.id] ?? {
                      ...DEFAULT_SEARCH,
                      layout: service.id === 'wedding' ? 'seated' : 'theater',
                    }
                  }
                  saveDraft={(values) => {
                    setDrafts((previous) => ({
                      ...previous,
                      [service.id]: values,
                    }));
                  }}
                />
              </Tabs.Content>
            ))}
          </div>
        </div>
      </Tabs.Root>
    </section>
  );
}
export function SearchForm({
  service,
  initial,
  saveDraft,
}: {
  service: ServiceId;
  initial: SearchValues;
  saveDraft: (values: SearchValues) => void;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const isFlight = service === 'flight';
  const venue = service === 'mice' || service === 'wedding';
  const isCar = service === 'car';
  const stay = service === 'hotel' || service === 'home';
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema(service)),
    defaultValues: initial,
    mode: 'onSubmit',
    shouldFocusError: false,
    reValidateMode: 'onChange',
  });
  const watched = useWatch({ control });
  const values = {
    ...initial,
    ...watched,
    childAges: watched.childAges?.map((age) => age ?? '') ?? initial.childAges,
  };
  const [guestOpen, setGuestOpen] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const hasEnd = stay || isCar || (isFlight && values.trip === 'roundtrip');
  const setCount = (
    key: 'adults' | 'children' | 'rooms' | 'infants',
    v: number,
  ) => {
    setValue(key, v, { shouldValidate: true });
    if (key === 'children')
      setValue(
        'childAges',
        Array.from({ length: v }, (_, i) => values.childAges[i] ?? ''),
      );
  };
  function persist() {
    saveDraft(getValues());
  }
  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    void handleSubmit(
      async (data) => {
        saveDraft(data);
        await new Promise((resolve) => setTimeout(resolve, 200));
        router.push(serializeSearch(service, data));
      },
      () => requestAnimationFrame(() => errorRef.current?.focus()),
    )(event);
  };
  return (
    <form
      onSubmit={onSubmit}
      onChange={persist}
      onBlur={persist}
      noValidate
      aria-label={t('Pencarian {0}', {
        '0': t(SERVICES.find((s) => s.id === service)?.label),
      })}
    >
      {(isFlight || isCar || venue) && (
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          {isFlight && (
            <>
              <fieldset className="flex gap-5">
                <legend className="sr-only">{t('Jenis perjalanan')}</legend>
                <label className="choice-label">
                  <input type="radio" value="oneway" {...register('trip')} />
                  {t('Sekali jalan ')}
                </label>
                <label className="choice-label">
                  <input type="radio" value="roundtrip" {...register('trip')} />
                  {t('Pulang pergi ')}
                </label>
              </fieldset>
              <label className="flex items-center gap-2">
                {t('Kelas')}{' '}
                <select
                  {...register('cabin')}
                  className="rounded-md border border-border p-2"
                >
                  <option value="economy">{t('Ekonomi')}</option>
                  <option value="business">{t('Bisnis')}</option>
                </select>
              </label>
            </>
          )}
          {isCar && (
            <fieldset className="flex gap-5">
              <legend className="sr-only">{t('Mode rental')}</legend>
              <label className="choice-label">
                <input type="radio" value="driver" {...register('mode')} />
                {t('Dengan pengemudi ')}
              </label>
              <label className="choice-label">
                <input type="radio" value="self" {...register('mode')} />
                {t('Lepas kunci ')}
              </label>
            </fieldset>
          )}
          {venue && (
            <label className="choice-label">
              <input type="checkbox" {...register('flexible')} />
              {t('Tanggal saya fleksibel ')}
            </label>
          )}
        </div>
      )}
      {Object.keys(errors).length > 0 && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-semibold">{t('Periksa kembali pencarian Anda')}</p>
          <ul className="mt-1 list-inside list-disc">
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>
                <a href={`#${service}-${key}`} className="underline">
                  {t(error?.message)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div
        className={`search-fields ${isFlight ? 'flight-fields' : ''} ${isFlight && hasEnd ? 'flight-roundtrip' : ''} ${venue && values.flexible ? 'flexible-fields' : ''} ${isCar ? 'car-fields' : ''}`}
      >
        <LocationCombobox
          key={`${service}-origin`}
          id={`${service}-locationId`}
          value={values.locationId}
          onChange={(id) => {
            setValue('locationId', id, { shouldValidate: !!errors.locationId });
            saveDraft({ ...getValues(), locationId: id });
          }}
          label={
            isFlight
              ? t('Dari')
              : isCar
                ? t('Kota pengambilan')
                : venue
                  ? t('Lokasi acara')
                  : t('Destinasi')
          }
          airport={isFlight}
          error={errors.locationId?.message}
        />
        {isFlight && (
          <LocationCombobox
            id={`${service}-destinationId`}
            value={values.destinationId}
            onChange={(id) => {
              setValue('destinationId', id, {
                shouldValidate: !!errors.destinationId,
              });
              saveDraft({ ...getValues(), destinationId: id });
            }}
            label={t('Ke')}
            airport
            error={errors.destinationId?.message}
          />
        )}
        {!(venue && values.flexible) && (
          <div className="search-field">
            <label className="field-label" htmlFor={`${service}-start`}>
              <CalendarDays size={16} />
              {stay
                ? t('Check-in')
                : isFlight
                  ? t('Berangkat')
                  : isCar
                    ? t('Tanggal ambil')
                    : t('Tanggal acara')}
            </label>
            <DateInput
              id={`${service}-start`}
              empty={!values.start}
              lang={locale}
              min={localDate()}
              {...register('start')}
              aria-invalid={!!errors.start}
              aria-describedby={
                errors.start ? `${service}-start-error` : undefined
              }
            />
            {errors.start && (
              <p id={`${service}-start-error`} className="field-error">
                {t(errors.start.message)}
              </p>
            )}
          </div>
        )}
        {hasEnd && (
          <div className="search-field">
            <label className="field-label" htmlFor={`${service}-end`}>
              <CalendarDays size={16} />
              {stay
                ? t('Check-out')
                : isFlight
                  ? t('Pulang')
                  : t('Tanggal kembali')}
            </label>
            <DateInput
              id={`${service}-end`}
              empty={!values.end}
              lang={locale}
              min={values.start || localDate()}
              {...register('end')}
              aria-invalid={!!errors.end}
              aria-describedby={errors.end ? `${service}-end-error` : undefined}
            />
            {errors.end && (
              <p id={`${service}-end-error`} className="field-error">
                {t(errors.end.message)}
              </p>
            )}
          </div>
        )}
        {(stay || isFlight) && (
          <div className="search-field">
            <span className="field-label" id={`${service}-guest-label`}>
              <UsersRound size={16} />
              {isFlight ? t('Penumpang') : t('Tamu & kamar')}
            </span>
            <Popover
              open={guestOpen}
              onOpenChange={(open) => {
                setGuestOpen(open);
                persist();
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id={`${service}-childAges`}
                  aria-labelledby={`${service}-guest-label ${service}-guest-summary`}
                  className="flex min-h-9 w-full items-center justify-between gap-2 text-left text-sm font-medium"
                >
                  <span id={`${service}-guest-summary`}>
                    {t(
                      (isFlight
                        ? values.adults + values.children + values.infants
                        : values.adults + values.children) === 1
                        ? isFlight
                          ? '1 penumpang'
                          : '1 tamu'
                        : isFlight
                          ? '{count} penumpang'
                          : '{count} tamu',
                      {
                        count:
                          values.adults +
                          values.children +
                          (isFlight ? values.infants : 0),
                      },
                    )}
                    {service === 'hotel' && (
                      <>
                        {' '}
                        ·{' '}
                        {t(values.rooms === 1 ? '1 kamar' : '{count} kamar', {
                          count: values.rooms,
                        })}
                      </>
                    )}
                  </span>
                  <ChevronDown size={15} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" aria-label={t('Atur tamu')}>
                <Counter
                  label={t('Dewasa')}
                  hint={
                    isFlight ? t('Kategori demo') : t('Usia 18 tahun ke atas')
                  }
                  value={values.adults}
                  min={1}
                  max={16}
                  onChange={(v) => setCount('adults', v)}
                />
                <Counter
                  label={t('Anak')}
                  hint={
                    isFlight ? t('Kategori demo') : t('Usia di bawah 18 tahun')
                  }
                  value={values.children}
                  min={0}
                  max={8}
                  onChange={(v) => setCount('children', v)}
                />
                {isFlight && (
                  <Counter
                    label={t('Bayi')}
                    hint={t('Kategori demo, tanpa kursi')}
                    value={values.infants}
                    min={0}
                    max={4}
                    onChange={(v) => setCount('infants', v)}
                  />
                )}{' '}
                {stay && (
                  <>
                    {service === 'hotel' && (
                      <Counter
                        label={t('Kamar')}
                        hint={t('Jumlah kamar')}
                        value={values.rooms}
                        min={1}
                        max={8}
                        onChange={(v) => setCount('rooms', v)}
                      />
                    )}
                    {Array.from({ length: values.children }, (_, i) => (
                      <label
                        key={i}
                        className="mb-3 flex items-center justify-between gap-3 text-sm"
                      >
                        {t('Usia anak {count}', { count: i + 1 })}
                        <select
                          {...register(`childAges.${i}`)}
                          className="min-h-11 rounded-md border border-border px-3"
                        >
                          <option value="">{t('Pilih usia')}</option>
                          {Array.from({ length: 18 }, (_, age) => (
                            <option value={String(age)} key={age}>
                              {t('{count} tahun', { count: age })}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </>
                )}
                {errors.childAges && (
                  <p className="field-error">{t(errors.childAges.message)}</p>
                )}
                {errors.infants && (
                  <p className="field-error">{t(errors.infants.message)}</p>
                )}
                {isFlight && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t(
                      'Aturan usia dan jumlah penumpang final mengikuti supplier pada Phase 4. ',
                    )}
                  </p>
                )}
                <Button
                  type="button"
                  className="mt-2 w-full"
                  onClick={() => {
                    setGuestOpen(false);
                    persist();
                  }}
                >
                  {t('Selesai ')}
                </Button>
              </PopoverContent>
            </Popover>
            {errors.childAges && (
              <p className="field-error">
                {t('Lengkapi usia anak melalui pilihan tamu. ')}
              </p>
            )}
          </div>
        )}
        {venue && (
          <>
            <div className="search-field">
              <label
                className="field-label"
                htmlFor={`${service}-participants`}
              >
                <UsersRound size={16} />
                {service === 'wedding' ? t('Jumlah tamu') : t('Jumlah peserta')}
              </label>
              <input
                id={`${service}-participants`}
                type="number"
                min={1}
                max={10000}
                {...register('participants', { valueAsNumber: true })}
                aria-invalid={!!errors.participants}
              />
              {errors.participants && (
                <p className="field-error">{t(errors.participants.message)}</p>
              )}
            </div>
            <div className="search-field">
              <label className="field-label" htmlFor={`${service}-layout`}>
                {t('Tata ruang ')}
              </label>
              <select id={`${service}-layout`} {...register('layout')}>
                {service === 'mice' ? (
                  <>
                    <option value="theater">{t('Theater')}</option>
                    <option value="classroom">{t('Classroom')}</option>
                    <option value="banquet">{t('Banquet')}</option>
                  </>
                ) : (
                  <>
                    <option value="seated">{t('Duduk')}</option>
                    <option value="standing">{t('Berdiri')}</option>
                  </>
                )}
              </select>
            </div>
          </>
        )}
        <Button type="submit" className="search-submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Search size={19} />
          )}
          <span>{isSubmitting ? t('Menyiapkan\u2026') : t('Cari')}</span>
          <ArrowRight className="search-arrow" />
        </Button>
      </div>
      {isCar && (
        <div className="rental-additional-fields">
          <label className="additional-field">
            {t('Jam ambil ')}
            <input
              id={`${service}-startTime`}
              type="time"
              {...register('startTime')}
              aria-invalid={!!errors.startTime}
            />
            {errors.startTime && (
              <span className="field-error">{t(errors.startTime.message)}</span>
            )}
          </label>
          <label className="additional-field">
            {t('Jam kembali ')}
            <input
              id={`${service}-endTime`}
              type="time"
              {...register('endTime')}
              aria-invalid={!!errors.endTime}
            />
            {errors.endTime && (
              <span className="field-error">{t(errors.endTime.message)}</span>
            )}
          </label>
          <label className="additional-field">
            {t('Area ambil & kembali ')}
            <input
              id={`${service}-pickup`}
              placeholder={t('Contoh: Bandara Ngurah Rai')}
              {...register('pickup')}
              aria-invalid={!!errors.pickup}
            />
            {errors.pickup && (
              <span className="field-error">{t(errors.pickup.message)}</span>
            )}
          </label>
        </div>
      )}
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {isFlight
          ? t('Pencarian penerbangan saja. Pembelian tiket belum tersedia.')
          : venue
            ? t(
                'Temukan venue untuk inquiry. Tanggal belum terkunci sebelum kesepakatan dengan mitra.',
              )
            : isCar
              ? t(
                  'Pengembalian pada area yang sama. Ketentuan durasi mengikuti paket mitra.',
                )
              : t(
                  'Rencanakan perjalanan Anda. Jelajahi pilihan tanpa perlu masuk akun.',
                )}
      </p>
    </form>
  );
}
