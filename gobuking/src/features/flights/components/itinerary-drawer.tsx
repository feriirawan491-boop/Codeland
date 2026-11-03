'use client';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { FlightOffer, FlightQuery } from '../lib/types';
import { FlightTimeline } from './flight-leg';
import { FlightPrice, SearchOnlyNotice, SourceStamp } from './shared';
export function ItineraryDrawer({
  offer,
  query,
}: {
  offer: FlightOffer;
  query: FlightQuery;
}) {
  const { t } = useI18n();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {t('Rincian penerbangan')}
        </Button>
      </DialogTrigger>
      <DialogContent className="flight-itinerary-dialog">
        <DialogTitle className="text-xl font-bold pr-8">
          {t('Rincian itinerary')}
        </DialogTitle>
        <DialogDescription className="mt-2 mb-5">
          {t('Periksa setiap segmen, waktu lokal, dan bagasi.')}
        </DialogDescription>
        <SearchOnlyNotice />
        <FlightTimeline leg={offer.outbound} label="Penerbangan berangkat" />
        {offer.inbound && (
          <FlightTimeline leg={offer.inbound} label="Penerbangan pulang" />
        )}
        <FlightPrice offer={offer} query={query} />
        <SourceStamp offer={offer} />
      </DialogContent>
    </Dialog>
  );
}
