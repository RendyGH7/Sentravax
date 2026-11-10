import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Radio } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const IntelligenceOverviewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="INTELLIGENCE"
        title="Ringkasan Operasi Intelijen Bencana"
        description="Dasbor komando terpusat bagi analis dan operator untuk memantau situasi geodinamika nasional secara real-time, mengidentifikasi anomali multi-hazard, dan mengawasi eskalasi risiko bencana."
        route={PATHS.INTELLIGENCE.OVERVIEW}
        icon={Radio}
        features={[
          'Matriks situasi nasional: Indeks ancaman aktif 38 provinsi',
          'Sinyal deteksi dini geofisika & hidrometeorologi terpadu',
          'Status kalkulasi Risk Engine PostGIS secara berkala',
          'Ringkasan insight proaktif rekomendasi mitigasi AI'
        ]}
        ctaLink={PATHS.INTELLIGENCE.MAP}
        ctaText="Buka Peta Geospasial Multi-Bahaya"
      />
    </div>
  );
};

