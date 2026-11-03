'use client';
import {
  Plane,
  ArrowRight,
  Clock3,
  Luggage,
  Backpack,
  Info,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { FLIGHT_AIRLINES } from '../lib/config';
import {
  airportTime,
  airportDate,
  arrivalDayOffset,
  elapsedMinutes,
  legDuration,
} from '../lib/time';
import type { FlightLeg as Leg } from '../lib/types';
import { Duration } from './shared';
export function AirlineBadge({ id, name }: { id: string; name: string }) {
  const airline = FLIGHT_AIRLINES.find((a) => a.id === id);
  return (
    <span className="flight-airline">
      <span
        className={`flight-airline-mark ${airline?.color ?? 'blue'}`}
        aria-hidden="true"
      >
        {airline?.code ?? <Plane size={16} />}
      </span>
      <span>
        {name}
        <small>DEMO</small>
      </span>
    </span>
  );
}
export function LegOverview({ leg, label }: { leg: Leg; label: string }) {
  const { t } = useI18n();
  const first = leg.segments[0],
    last = leg.segments.at(-1)!,
    offset = arrivalDayOffset(leg);
  return (
    <div className="flight-leg-overview">
      <span className="flight-leg-label">{t(label)}</span>
      <div className="flight-leg-main">
        <AirlineBadge id={first.airlineId} name={first.airline} />
        <div className="flight-time">
          <strong>{airportTime(first.departureAt, first.origin)}</strong>
          <span>
            {first.origin.id} · {first.origin.zoneLabel}
          </span>
        </div>
        <div className="flight-line">
          <small>
            <Duration minutes={legDuration(leg)} />
          </small>
          <div>
            <i />
            <Plane size={15} />
          </div>
          <small>
            {leg.segments.length === 1
              ? t('Langsung')
              : t('{count} transit', { count: leg.segments.length - 1 })}
            {leg.segments.length > 1 ? ` · ${first.destination.id}` : ''}
          </small>
        </div>
        <div className="flight-time">
          <strong>
            {airportTime(last.arrivalAt, last.destination)}
            {offset > 0 && <sup>+{offset}</sup>}
          </strong>
          <span>
            {last.destination.id} · {last.destination.zoneLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
export function FlightTimeline({ leg, label }: { leg: Leg; label: string }) {
  const { t, locale } = useI18n();
  const date = (instant: string, airport: Leg['segments'][number]['origin']) =>
    new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: airport.zone,
    }).format(new Date(instant));
  return (
    <section className="flight-timeline">
      <div className="flight-section-heading">
        <h2>{t(label)}</h2>
        <span>
          <Clock3 size={16} />
          <Duration minutes={legDuration(leg)} />
        </span>
      </div>
      {leg.segments.map((segment, index) => {
        const before = leg.segments[index - 1];
        const dayOffset = Math.round(
          (Date.parse(airportDate(segment.arrivalAt, segment.destination)) -
            Date.parse(airportDate(segment.departureAt, segment.origin))) /
            86400000,
        );
        return (
          <div key={segment.id}>
            {before && (
              <div className="flight-layover">
                <Clock3 size={18} />
                <div>
                  <strong>
                    {t('Transit di {airport}', {
                      airport: segment.origin.city,
                    })}{' '}
                    ·{' '}
                    <Duration
                      minutes={elapsedMinutes(
                        before.arrivalAt,
                        segment.departureAt,
                      )}
                    />
                  </strong>
                  <span>
                    {segment.origin.name} ({segment.origin.id})
                  </span>
                </div>
              </div>
            )}
            <article className="flight-segment">
              <AirlineBadge
                id={segment.airlineId}
                name={`${segment.airline} · ${segment.number}`}
              />
              <div className="flight-segment-route">
                <div>
                  <Plane size={18} />
                  <strong>
                    {airportTime(segment.departureAt, segment.origin)}{' '}
                    <span>{segment.origin.zoneLabel}</span>
                  </strong>
                  <div>
                    <h3>
                      {segment.origin.city} ({segment.origin.id})
                    </h3>
                    <p>{segment.origin.name}</p>
                    <small>
                      {date(segment.departureAt, segment.origin)} ·{' '}
                      {segment.origin.zone}
                    </small>
                  </div>
                </div>
                <p className="flight-segment-duration">
                  <Duration
                    minutes={elapsedMinutes(
                      segment.departureAt,
                      segment.arrivalAt,
                    )}
                  />{' '}
                  · {t(segment.cabin === 'business' ? 'Bisnis' : 'Ekonomi')}
                </p>
                <div>
                  <ArrowRight size={18} />
                  <strong>
                    {airportTime(segment.arrivalAt, segment.destination)}{' '}
                    <span>{segment.destination.zoneLabel}</span>
                    {dayOffset > 0 && (
                      <sup>
                        +{dayOffset} {t('hari')}
                      </sup>
                    )}
                  </strong>
                  <div>
                    <h3>
                      {segment.destination.city} ({segment.destination.id})
                    </h3>
                    <p>{segment.destination.name}</p>
                    <small>
                      {date(segment.arrivalAt, segment.destination)} ·{' '}
                      {segment.destination.zone}
                    </small>
                  </div>
                </div>
              </div>
              <div className="flight-baggage">
                <span>
                  <Luggage size={17} />
                  {t('Bagasi tercatat')}:{' '}
                  <strong>
                    {t(segment.checkedBaggage ?? 'Belum tersedia')}
                  </strong>
                </span>
                <span>
                  <Backpack size={17} />
                  {t('Bagasi kabin')}:{' '}
                  <strong>{t(segment.cabinBaggage ?? 'Belum tersedia')}</strong>
                </span>
              </div>
              {(!segment.checkedBaggage || !segment.cabinBaggage) && (
                <p className="flight-inline-note">
                  <Info size={15} />
                  {t(
                    'Informasi bagasi belum diberikan; jangan diasumsikan termasuk tarif.',
                  )}
                </p>
              )}
            </article>
          </div>
        );
      })}
    </section>
  );
}
