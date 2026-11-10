import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { SendHorizontal } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const IntelligenceAlertOperationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="INTELLIGENCE"
        title="Operasi & Diseminasi Peringatan Dini"
        description="Ruang kendali penyiaran peringatan resmi secara multi-kanal kepada BPBD setempat, aparat penyelamat, dan aplikasi publik warga dengan tingkat prioritas tinggi."
        route={PATHS.INTELLIGENCE.ALERT_OPERATIONS}
        icon={SendHorizontal}
        features={[
          'Simulator pembagian radius siaga geofence poligon',
          'Template rilis CAP (Common Alerting Protocol) standar internasional',
          'Penyiaran multi-kanal: Push Notifications, SMS Gateway, Sirene BPBD',
          'Metrik konfirmasi penerimaan pesan oleh warga di zona bahaya'
        ]}
        ctaLink={PATHS.INTELLIGENCE.OVERVIEW}
        ctaText="Kembali ke Ringkasan Intelijen"
      />
    </div>
  );
};

