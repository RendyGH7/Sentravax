import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Database } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const AdminDataSourcesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="ADMIN"
        title="Sumber Data & Konektor API"
        description="Pantau status koneksi, frekuensi polling, latensi, dan kredensial API dari lembaga sumber data resmi yang diintegrasikan ke SENTRAVAX."
        route={PATHS.ADMIN.DATA_SOURCES}
        icon={Database}
        features={[
          'Status konektor feed BMKG (Gempabumi Realtime & Prakiraan Cuaca)',
          'Integrasi feed PVMBG / MAGMA Indonesia (Aktivitas Gunung Api)',
          'Konektor satelit Copernicus / Sentinel & OpenStreetMap tiles',
          'Riwayat latensi pengambilan data dan penanganan kegagalan koneksi'
        ]}
        ctaLink={PATHS.ADMIN.AUDIT_LOGS}
        ctaText="Periksa Log Audit Sistem"
      />
    </div>
  );
};

