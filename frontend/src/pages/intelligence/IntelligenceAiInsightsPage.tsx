import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { BrainCircuit } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const IntelligenceAiInsightsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="INTELLIGENCE"
        title="AI Proactive Intelligence & Rekomendasi"
        description="Mesin inferensi prediktif yang menggabungkan deret waktu cuaca, tren deformasi seismik, dan anomali geospasial untuk menghasilkan rekomendasi mitigasi preventif sebelum bencana memuncak."
        route={PATHS.INTELLIGENCE.AI_INSIGHTS}
        icon={BrainCircuit}
        features={[
          'Deteksi dini anomali pola cuaca ekstrem 48 jam sebelum kejadian',
          'Rekomendasi taktis pembukaan bendungan & pengerukan sedimentasi sungai',
          'Saran pra-evakuasi populasi rentan (lansia, anak-anak, fasilitas RS)',
          'Tingkat kepercayaan inferensi (Confidence Score) & transparansi bukti'
        ]}
        ctaLink={PATHS.INTELLIGENCE.ALERT_OPERATIONS}
        ctaText="Diseminasi ke Operasi Peringatan"
      />
    </div>
  );
};

