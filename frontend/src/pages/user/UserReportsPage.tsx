import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { FileText } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const UserReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="USER"
        title="Daftar Laporan Bencana Warga"
        description="Kelola dan pantau seluruh laporan kejadian bencana yang telah Anda ajukan ke sistem SENTRAVAX. Laporan Anda diverifikasi oleh operator sebelum didiseminasikan."
        route={PATHS.USER.REPORTS}
        icon={FileText}
        features={[
          'Pelacakan status verifikasi (Menunggu / Terverifikasi / Ditolak)',
          'Riwayat foto/bukti geospasial yang diunggah warga',
          'Feedback & tindak lanjut dari petugas BPBD/Operator',
          'Export bukti laporan untuk bantuan tanggap darurat'
        ]}
        ctaLink={PATHS.USER.CREATE_REPORT}
        ctaText="Kirim Laporan Baru"
      />
    </div>
  );
};

