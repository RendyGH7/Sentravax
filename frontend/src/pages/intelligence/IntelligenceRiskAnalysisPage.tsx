import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { ActivitySquare } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const IntelligenceRiskAnalysisPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="INTELLIGENCE"
        title="Mesin Analisis Risiko Kebencanaan"
        description="Komputasi multi-kriteria berbasis rumus standar BNPB/UNDRR: Risk = (Hazard × Vulnerability) / Capacity yang dihitung otomatis pada geometri wilayah administratif."
        route={PATHS.INTELLIGENCE.RISK_ANALYSIS}
        icon={ActivitySquare}
        features={[
          'Parameter bobot ancaman, kerentanan, dan indeks kapasitas wilayah',
          'Simulasi skenario bahaya (Skenario gempa M7.2, banjir 24 jam)',
          'Estimasi estimasi korban jiwa, pengungsi, dan kerugian material',
          'Tabel ranking risiko prioritas per kabupaten/kota'
        ]}
        ctaLink={PATHS.INTELLIGENCE.AI_INSIGHTS}
        ctaText="Pelajari AI Proactive Insights"
      />
    </div>
  );
};

