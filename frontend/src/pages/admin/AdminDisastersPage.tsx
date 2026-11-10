import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Flame } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const AdminDisastersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="ADMIN"
        title="Manajemen Data Kejadian Bencana"
        description="Pusat kurasi master data kejadian bencana (Disaster Events) yang tercatat resmi dalam sistem SENTRAVAX dengan integrasi relasi poligon wilayah terdampak."
        route={PATHS.ADMIN.DISASTERS}
        icon={Flame}
        features={[
          'Manajemen CRUD kejadian bencana (Gempa, Tsunami, Banjir, Erupsi)',
          'Pembaruan status tanggap darurat (Siaga, Tanggap Darurat, Pemulihan)',
          'Rekapitulasi korban terdampak, kerusakan fasilitas, & titik pengungsian',
          'Penautan laporan warga yang terverifikasi ke entitas bencana induk'
        ]}
        ctaLink={PATHS.ADMIN.ALERTS}
        ctaText="Kelola Peringatan Dini"
      />
    </div>
  );
};

