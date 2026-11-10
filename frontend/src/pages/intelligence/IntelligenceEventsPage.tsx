import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { ListFilter } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const IntelligenceEventsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="INTELLIGENCE"
        title="Korelasi & Pengelompokan Kejadian Bencana"
        description="Pusat analisis pengelompokan kejadian berantai (cascading disasters) seperti gempa bumi yang memicu likuifaksi atau tsunami, dan hujan lebat berdurasi panjang pemicu banjir bandang."
        route={PATHS.INTELLIGENCE.EVENTS}
        icon={ListFilter}
        features={[
          'Pohon silsilah korelasi multihazard primer dan sekunder',
          'Timeline kronologi perkembangan eskalasi ancaman bencana',
          'Penautan bukti satelit Sentinel dengan laporan lapangan warga',
          'Pencatatan penutupan status tanggap darurat pasca kejadian'
        ]}
        ctaLink={PATHS.INTELLIGENCE.ALERT_OPERATIONS}
        ctaText="Operasi Penyiaran Peringatan Dini"
      />
    </div>
  );
};

