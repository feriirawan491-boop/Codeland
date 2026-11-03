'use client';
import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatRupiah } from '@/lib/utils';
import { Button } from '@/components/ui/button';
export type MapProperty = {
  id: string;
  name: string;
  coordinates: [number, number];
  total: number;
};
export default function PropertyMap({
  results,
  selected,
  onSelect,
  failed = false,
  kind = 'hotel',
}: {
  results: MapProperty[];
  selected: string | null;
  onSelect: (id: string) => void;
  failed?: boolean;
  kind?: 'hotel' | 'home';
}) {
  const { t, locale } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const [networkError, setNetworkError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const callback = useRef(onSelect);
  useEffect(() => {
    callback.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!root.current || failed) return;
    const map = L.map(root.current, { scrollWheelZoom: false }).setView(
      results[0]?.coordinates ?? [-8.65, 115.2],
      10,
    );
    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      },
    ).addTo(map);
    tiles.on('tileerror', () => setNetworkError(true));
    const markers: L.Marker[] = [];
    for (const result of results) {
      const label = document.createElement('button');
      label.type = 'button';
      label.className = `hotel-map-pin ${selected === result.id ? 'selected' : ''}`;
      label.textContent = formatRupiah(result.total, locale);
      label.setAttribute(
        'aria-label',
        `${result.name}: ${formatRupiah(result.total, locale)}`,
      );
      label.addEventListener('click', () => callback.current(result.id));
      const marker = L.marker(result.coordinates, {
        icon: L.divIcon({
          html: label,
          className: 'hotel-pin-wrapper',
          iconSize: [135, 40],
          iconAnchor: [67, 20],
        }),
        keyboard: false,
      }).addTo(map);
      markers.push(marker);
    }
    if (markers.length > 1)
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
    return () => {
      map.remove();
    };
  }, [results, locale, selected, failed, attempt]);
  return (
    <section
      className="hotel-map-section"
      aria-label={t(kind === 'home' ? 'Peta hunian' : 'Peta hotel')}
    >
      <p>
        {t(
          kind === 'home'
            ? 'Pin menunjukkan area perkiraan hunian, bukan alamat rinci.'
            : 'Pin menampilkan total menginap. Lokasi properti demo bersifat ilustratif.',
        )}
      </p>
      {failed ? (
        <div className="hotel-feedback">
          <p>
            {t(
              kind === 'home'
                ? 'Peta belum dapat dimuat. Daftar hunian tetap tersedia.'
                : 'Peta belum dapat dimuat. Daftar hotel tetap tersedia.',
            )}
          </p>
        </div>
      ) : (
        <div ref={root} className="hotel-map-canvas" />
      )}
      {networkError && !failed && (
        <div className="hotel-map-warning" role="status">
          {t(
            'Latar peta belum dapat dimuat. Pin dan daftar tetap dapat dipilih.',
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setNetworkError(false);
              setAttempt((a) => a + 1);
            }}
          >
            {t('Muat ulang peta')}
          </Button>
        </div>
      )}
    </section>
  );
}
