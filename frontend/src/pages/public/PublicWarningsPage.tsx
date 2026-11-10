import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { AlertTriangle } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const PublicWarningsPage: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <AreaPlaceholder
        area="PUBLIC"
        title="Peringatan Dini Resmi (Early Warnings)"
        description="Pemberitahuan peringatan resmi dengan tingkat urgensi bertingkat (Informasi, Waspada, Siaga, Kritis) untuk mitigasi dan langkah tanggap darurat warga sedini mungkin."
        route={PATHS.PUBLIC.WARNINGS}
        icon={AlertTriangle}
        features={[
          'Peringatan cuaca ekstrem dan potensi banjir 24-72 jam ke depan',
          'Peringatan dini tsunami dan gempa berkekuatan signifikan',
          'Instruksi mitigasi keselamatan langsung dari otoritas resmi',
          'Indikator kejernihan status kesegaran (Live / Fresh / Stale)'
        ]}
        ctaLink={PATHS.PUBLIC.PREPAREDNESS}
        ctaText="Panduan Kesiapsiagaan Warga"
      />
    </div>
  );
};

