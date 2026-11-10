import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { MapPin } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const UserRegionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="USER"
        title="Wilayah Pantauan Saya (Watchlist)"
        description="Tetapkan area-area prioritas (misalnya rumah, kantor, domisili orang tua) untuk menerima peringatan dini otomatis ketika timbul anomali risiko di area tersebut."
        route={PATHS.USER.REGIONS}
        icon={MapPin}
        features={[
          'Penetapan radius geofence pemantauan (1 km hingga 25 km)',
          'Notifikasi khusus jika curah hujan ekstrem melewati ambang batas',
          'Pemantauan status ketinggian muka air sungai terdekat',
          'Multi-lokasi pantauan dalam satu akun warga terpadu'
        ]}
        ctaLink={PATHS.USER.DASHBOARD}
        ctaText="Kembali ke Dashboard Warga"
      />
    </div>
  );
};

