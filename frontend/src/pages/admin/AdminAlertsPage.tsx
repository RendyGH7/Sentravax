import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { AlertTriangle } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const AdminAlertsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="ADMIN"
        title="Pusat Peringatan Dini Sistem"
        description="Kelola publikasi peringatan resmi sistem ke masyarakat, pantau tingkat keterbacaan, dan atur waktu kedaluwarsa (expiration) pesan siaga."
        route={PATHS.ADMIN.ALERTS}
        icon={AlertTriangle}
        features={[
          'Penyusunan rilis buletin peringatan darurat nasional & daerah',
          'Penetapan level urgensi: Info (1), Waspada (2), Siaga (3), Kritis (4)',
          'Jadwal penyiaran dan audit pesan terkirim ke kanal notifikasi',
          'Riwayat peringatan yang telah kedaluwarsa atau dibatalkan'
        ]}
        ctaLink={PATHS.ADMIN.DASHBOARD}
        ctaText="Kembali ke Dashboard Admin"
      />
    </div>
  );
};

