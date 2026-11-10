import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { FileCheck2 } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const AdminReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="ADMIN"
        title="Moderasi & Verifikasi Laporan Warga"
        description="Pusat validasi laporan kebencanaan yang diajukan oleh masyarakat umum sebelum dipublikasikan ke peta publik dan diintegrasikan ke dalam model risiko spasial."
        route={PATHS.ADMIN.REPORTS}
        icon={FileCheck2}
        features={[
          'Antrean laporan berurutan berdasarkan timestamp & tingkat urgensi',
          'Inspeksi foto bukti, koordinat geospasial, dan deskripsi dampak',
          'Aksi 1-klik: Setujui (Publish), Butuh Bukti Tambahan, atau Tolak (Spam)',
          'Korelasi otomatis dengan sensor stasiun cuaca terdekat'
        ]}
        ctaLink={PATHS.ADMIN.DISASTERS}
        ctaText="Kelola Data Kejadian Bencana"
      />
    </div>
  );
};

