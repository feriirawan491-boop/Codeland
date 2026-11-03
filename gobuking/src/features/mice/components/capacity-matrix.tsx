'use client';
import { CheckCircle2, Info } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { LAYOUT_LABELS } from '@/features/venue/lib/config';
import type {
  EventLayout,
  EventQuery,
  VenueSpace,
} from '@/features/venue/lib/types';
import { LAYOUT_ICONS } from './shared';
export function CapacityMatrix({
  space,
  query,
}: {
  space: VenueSpace;
  query: EventQuery;
}) {
  const { t } = useI18n();
  return (
    <section id="venue-capacity" className="venue-detail-section">
      <h2>{t('Tata ruang & kapasitas')}</h2>
      <p>
        {t('Kapasitas berikut berlaku untuk ruang ini, bukan total venue.')}
      </p>
      <div className="venue-capacity-table">
        <table>
          <caption className="sr-only">
            {t('Kapasitas {name} per layout', { name: space.name })}
          </caption>
          <thead>
            <tr>
              <th scope="col">{t('Layout')}</th>
              <th scope="col">{t('Kapasitas')}</th>
              <th scope="col">{t('Kesesuaian')}</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(LAYOUT_LABELS) as EventLayout[]).map((layout) => {
              const Icon = LAYOUT_ICONS[layout],
                capacity = space.capacity[layout];
              const fits = capacity !== null && capacity >= query.participants;
              return (
                <tr
                  key={layout}
                  className={query.layout === layout ? 'selected' : ''}
                >
                  <th scope="row">
                    <span>
                      <Icon size={20} />
                      {LAYOUT_LABELS[layout]}
                    </span>
                  </th>
                  <td>
                    {capacity === null
                      ? t('Belum terverifikasi')
                      : t('{count} peserta', { count: capacity })}
                  </td>
                  <td className={fits ? 'fits' : 'does-not-fit'}>
                    {fits ? <CheckCircle2 size={15} /> : <Info size={15} />}
                    <span>
                      {t(
                        capacity === null
                          ? 'Perlu konfirmasi'
                          : fits
                            ? 'Sesuai'
                            : 'Tidak cukup',
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
