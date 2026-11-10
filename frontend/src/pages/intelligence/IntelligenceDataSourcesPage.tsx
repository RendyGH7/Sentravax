import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Satellite } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const IntelligenceDataSourcesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="INTELLIGENCE"
        title="Aliran Data Telemetri & Satelit"
        description="Monitor status feed data mentah yang mengalir ke sistem SENTRAVAX, mulai dari seismometer BMKG, radar citra cuaca, satelit multispektral, hingga pelaporan warga."
        route={PATHS.INTELLIGENCE.DATA_SOURCES}
        icon={Satellite}
        features={[
          'Pemeriksaan pipeline data ingestion & status buffer redis/queue',
          'Peta lokasi stasiun pengamatan BMKG & sensor cuaca terhubung',
          'Status data kesegaran per sumber: FRESH, DELAYED, atau STALE',
          'Diagnostik latensi API eksternal dan tingkat error rate'
        ]}
        ctaLink={PATHS.INTELLIGENCE.EVENTS}
        ctaText="Korelasi Kejadian Bencana"
      />
    </div>
  );
};

