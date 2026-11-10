import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Bell } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const UserNotificationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="USER"
        title="Pusat Notifikasi & Riwayat Siaga"
        description="Pemberitahuan peringatan personal dan pembaruan berkala status laporan bencana Anda yang dikirimkan oleh sistem intelijen SENTRAVAX."
        route={PATHS.USER.NOTIFICATIONS}
        icon={Bell}
        features={[
          'Notifikasi peringatan dini berbasis lokasi pantauan aktif',
          'Pembaruan status verifikasi laporan yang diajukan pengguna',
          'Pemberitahuan panduan evakuasi darurat mendadak',
          'Tandai sudah dibaca & filter tingkat urgensi (Kritis / Waspada)'
        ]}
        ctaLink={PATHS.USER.DASHBOARD}
        ctaText="Kembali ke Dashboard Warga"
      />
    </div>
  );
};

