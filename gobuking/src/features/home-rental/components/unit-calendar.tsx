'use client';
import { useInventoryRevision } from '@/hooks/use-inventory-revision';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { useI18n } from '@/components/i18n/locale-provider';
import { homeAdapter } from '../lib/adapter';
import { homeParams } from '../lib/query';
import { shiftDate } from '@/features/booking/lib/inventory';
import type { CalendarDay, HomeProperty, HomeQuery } from '../lib/types';
import type { HotelScenario } from '@/features/hotel/lib/types';
const REASONS: Record<CalendarDay['reason'], string> = {
  available: 'Tersedia',
  past: 'Tanggal lewat',
  lead: 'Batas waktu pemesanan',
  owner: 'Blok pemilik',
  buffer: 'Jeda pembersihan',
  reserved: 'Sudah dipesan',
};
function monthDate(month: string, offset: number) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
export function UnitCalendar({
  home,
  query,
  scenario,
  onChange,
}: {
  home: HomeProperty;
  query: HomeQuery;
  scenario: HotelScenario;
  onChange: (query: HomeQuery) => void;
}) {
  const { t, locale } = useI18n();
  const [month, setMonth] = useState(query.start.slice(0, 7));
  const [choosingEnd, setChoosingEnd] = useState(false);
  const [notice, setNotice] = useState('');
  const [response, setResponse] = useState<{
    key: string;
    days?: CalendarDay[];
    error?: string;
  }>();
  const inventoryRevision = useInventoryRevision();
  const key = `${inventoryRevision}:${home.id}:${month}:${scenario}:${homeParams(query)}`;
  useEffect(() => {
    const controller = new AbortController();
    homeAdapter
      .getUnitCalendar(
        home,
        `${month}-01`,
        `${monthDate(month, 2)}-01`,
        scenario,
        controller.signal,
      )
      .then((days) => setResponse({ key, days }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error: error.message });
      });
    return () => controller.abort();
  }, [home, month, scenario, key]);
  const days = response?.key === key ? response.days : undefined;
  function choose(date: string) {
    setNotice('');
    if (!choosingEnd || date <= query.start) {
      onChange({ ...query, start: date, end: '' });
      setChoosingEnd(true);
    } else {
      onChange({ ...query, end: date });
      setChoosingEnd(false);
    }
  }
  function renderMonth(offset: number) {
    const current = monthDate(month, offset),
      first = new Date(`${current}-01T12:00:00Z`),
      padding = (first.getUTCDay() + 6) % 7,
      last = new Date(
        Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
      ).getUTCDate();
    return (
      <div
        className={`home-calendar-month ${offset ? 'second-month' : ''}`}
        key={current}
      >
        <h4>
          {new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          }).format(first)}
        </h4>
        <div className="home-weekdays" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) =>
            new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
              weekday: 'short',
              timeZone: 'UTC',
            }).format(new Date(Date.UTC(2026, 9, 26 + i))),
          ).map((day, index) => (
            <span key={index}>{day}</span>
          ))}
        </div>
        <div className="home-date-grid">
          {Array.from({ length: padding }, (_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: last }, (_, i) => {
            const date = `${current}-${String(i + 1).padStart(2, '0')}`,
              day = days?.find((day) => day.date === date),
              selected = query.start === date || query.end === date,
              range =
                query.start &&
                query.end &&
                date > query.start &&
                date < query.end;
            const label = new Intl.DateTimeFormat(
              locale === 'en' ? 'en-GB' : 'id-ID',
              {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              },
            ).format(new Date(`${date}T12:00:00Z`));
            return (
              <button
                type="button"
                key={date}
                disabled={!day?.available}
                title={t(REASONS[day?.reason ?? 'reserved'])}
                aria-label={`${label} · ${t(REASONS[day?.reason ?? 'reserved'])}`}
                aria-pressed={selected}
                className={`${selected ? 'selected' : ''} ${range ? 'in-range' : ''} reason-${day?.reason ?? 'loading'}`}
                onClick={() => choose(date)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <section id="home-calendar" className="hotel-detail-section">
      <div className="section-heading">
        <div>
          <h2>{t('Pilih tanggal menginap')}</h2>
          <p>{t('Kalender satu hunian penuh, bukan per kamar.')}</p>
        </div>
        <CalendarDays size={24} className="text-blue-600" />
      </div>
      <div className="home-calendar-inputs">
        <label>
          <span>{t('Check-in')}</span>
          <DateInput
            aria-label={t('Tanggal check-in hunian')}
            value={query.start}
            empty={!query.start}
            onChange={(e) => {
              onChange({ ...query, start: e.target.value });
              if (e.target.value) setMonth(e.target.value.slice(0, 7));
            }}
          />
        </label>
        <label>
          <span>{t('Check-out')}</span>
          <DateInput
            aria-label={t('Tanggal check-out hunian')}
            value={query.end}
            empty={!query.end}
            min={
              query.start ? shiftDate(query.start, home.minNights) : undefined
            }
            onChange={(e) => onChange({ ...query, end: e.target.value })}
          />
        </label>
      </div>
      <div className="home-calendar-box" aria-busy={!days && !response?.error}>
        <div className="home-calendar-navigation">
          <Button
            size="icon"
            variant="ghost"
            aria-label={t('Bulan sebelumnya')}
            onClick={() => setMonth(monthDate(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <span aria-live="polite">
            {t(
              choosingEnd
                ? 'Pilih tanggal check-out'
                : 'Pilih tanggal check-in',
            )}
          </span>
          <Button
            size="icon"
            variant="ghost"
            aria-label={t('Bulan berikutnya')}
            onClick={() => setMonth(monthDate(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        {response?.key === key && response.error ? (
          <p role="alert" className="field-error">
            {t(response.error)}
          </p>
        ) : (
          <div className="home-calendar-months">{[0, 1].map(renderMonth)}</div>
        )}
        <div className="home-calendar-legend">
          {(['available', 'owner', 'buffer', 'reserved'] as const).map(
            (reason) => (
              <span key={reason}>
                <i className={`reason-${reason}`} />
                {t(REASONS[reason])}
              </span>
            ),
          )}
        </div>
      </div>
      <p className="home-calendar-policy">
        {t(
          'Minimum {min} malam · Pesan paling lambat {lead} hari sebelumnya · Jeda pembersihan {buffer} malam',
          {
            min: home.minNights,
            lead: home.leadDays,
            buffer: home.bufferNights,
          },
        )}
      </p>
      {notice && <p role="status">{t(notice)}</p>}
    </section>
  );
}
