import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { LayoutDashboard } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const UserDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="USER"
        title="Ringkasan Portal Warga"
        description="Dasbor terintegrasi untuk masyarakat mengawasi potensi ancaman bencana di radius domisili, memantau status laporan mandiri, dan menerima peringatan darurat real-time."
        route={PATHS.USER.DASHBOARD}
        icon={LayoutDashboard}
        features={[
          'Status risiko terkini radius tempat tinggal (Safe / Advisory / Warning)',
          'Riwayat ringkas laporan warga terkirim & status verifikasi',
          'Akses cepat tombol panik / pelaporan darurat 1-klik',
          'Daftar kontak posko tanggap bencana terdekat'
        ]}
        ctaLink={PATHS.USER.CREATE_REPORT}
        ctaText="Buat Laporan Kejadian Sekarang"
      />
    </div>
  );
};

