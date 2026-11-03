'use client';
import Link from 'next/link';
import { ArrowRight, Check, Clock3 } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import type { FlightOffer, FlightQuery, FlightScenario } from '../lib/types';
import { flightLink } from '../lib/query';
import { LegOverview } from './flight-leg';
import { FlightPrice, offerExpired, useFlightClock } from './shared';
import { ItineraryDrawer } from './itinerary-drawer';
export function FlightOfferCard({
  offer,
  query,
  scenario,
  step,
  selected,
  onSelect,
  context,
}: {
  offer: FlightOffer;
  query: FlightQuery;
  scenario: FlightScenario;
  step: 'oneway' | 'outbound' | 'inbound';
  selected?: boolean;
  onSelect?: () => void;
  context: Record<string, string>;
}) {
  const { t } = useI18n();
  const now = useFlightClock();
  const expired = offerExpired(offer, now);
  return (
    <article className={`flight-offer-card ${selected ? 'is-selected' : ''}`}>
      <div className="flight-offer-route">
        <LegOverview
          leg={step === 'inbound' ? offer.inbound! : offer.outbound}
          label={
            step === 'inbound' ? 'Penerbangan pulang' : 'Penerbangan berangkat'
          }
        />
        {step === 'outbound' && (
          <p className="flight-combination-note">
            {t(
              'Harga kombinasi pulang pergi. Pilih berangkat untuk melihat pasangan yang kompatibel.',
            )}
          </p>
        )}
        <div className="flight-card-meta">
          <ItineraryDrawer offer={offer} query={query} />
          {expired ? (
            <span className="flight-expired">
              <Clock3 size={14} />
              {t('Penawaran kedaluwarsa')}
            </span>
          ) : (
            <span>
              {t(query.cabin === 'business' ? 'Bisnis' : 'Ekonomi')} ·{' '}
              {t('Data simulasi')}
            </span>
          )}
        </div>
      </div>
      <div className="flight-card-action">
        <FlightPrice offer={offer} query={query} />
        {step === 'oneway' ? (
          <Button asChild>
            <Link
              href={flightLink(
                `/flights/offers/${offer.id}`,
                query,
                scenario,
                context,
              )}
            >
              {t('Lihat itinerary')}
              <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button
            onClick={onSelect}
            disabled={expired}
            variant={selected ? 'secondary' : 'default'}
          >
            {selected ? <Check /> : <ArrowRight />}
            {t(
              selected
                ? 'Dipilih'
                : step === 'outbound'
                  ? 'Pilih berangkat'
                  : 'Pilih pulang',
            )}
          </Button>
        )}
      </div>
    </article>
  );
}
