import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { LayoutDashboard } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const AdminDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="ADMIN"
        title="Pusat Kendali Administrasi Sistem"
        description="Pusat monitoring kesehatan sistem, rekapitulasi data pengguna, antrean verifikasi laporan warga, dan efektivitas diseminasi peringatan dini SENTRAVAX secara nasional."
        route={PATHS.ADMIN.DASHBOARD}
        icon={LayoutDashboard}
        features={[
          'Metrik agregat pengguna aktif, laporan masuk, dan status kejadian',
          'Status sinkronisasi PostgreSQL 18 + PostGIS geodatabase',
          'Indikator beban API backend Laravel 13 & uptime layanan',
          'Akses cepat moderasi laporan darurat berkategori kritis'
        ]}
        ctaLink={PATHS.ADMIN.REPORTS}
        ctaText="Buka Antrean Verifikasi Laporan"
      />
    </div>
  );
};

