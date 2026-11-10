import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { PlusCircle } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const UserCreateReportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="USER"
        title="Formulir Pelaporan Bencana Mandiri"
        description="Laporkan situasi darurat atau potensi ancaman bencana di lingkungan sekitar Anda secara real-time disertai titik koordinat GPS dan bukti dokumentasi visual."
        route={PATHS.USER.CREATE_REPORT}
        icon={PlusCircle}
        features={[
          'Deteksi otomatis koordinat GPS perangkat pelapor',
          'Pilihan jenis bencana (Banjir, Longsor, Gempa, Cuaca Ekstrem)',
          'Unggah foto bukti dengan metadata geotagging',
          'Indikator dampak (ketinggian air, kerusakan infrastruktur, korban)'
        ]}
        ctaLink={PATHS.USER.REPORTS}
        ctaText="Kembali ke Laporan Saya"
      />
    </div>
  );
};

