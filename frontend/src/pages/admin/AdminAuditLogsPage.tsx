import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { ScrollText } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const AdminAuditLogsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="ADMIN"
        title="Jejak Audit & Log Keamanan Sistem"
        description="Rekaman kronologis aksi administrator, perubahan status laporan, rilis peringatan darurat, dan upaya otentikasi untuk menjaga akuntabilitas platform."
        route={PATHS.ADMIN.AUDIT_LOGS}
        icon={ScrollText}
        features={[
          'Pencatatan identitas aktor, IP address, user-agent, dan timestamp',
          'Riwayat perubahan status entitas data (sebelum vs sesudah diubah)',
          'Filter log berdasarkan modul (Auth, Laporan, Peringatan, Sistem)',
          'Ekspor arsip log keamanan berformat CSV / JSON terenkripsi'
        ]}
        ctaLink={PATHS.ADMIN.DASHBOARD}
        ctaText="Kembali ke Dashboard Admin"
      />
    </div>
  );
};

