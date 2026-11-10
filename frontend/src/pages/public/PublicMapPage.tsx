import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Map } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const PublicMapPage: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <AreaPlaceholder
        area="PUBLIC"
        title="Peta Interaktif Kesiapsiagaan Publik"
        description="Visualisasi risiko geospasial terbuka untuk warga seluruh Indonesia. Menampilkan zonasi ancaman bencana, lokasi posko evakuasi, dan status peringatan dini aktif tanpa batasan login."
        route={PATHS.PUBLIC.MAP}
        icon={Map}
        features={[
          'Peta tematik multi-hazard (Banjir, Gempa, Cuaca Ekstrem)',
          'Filter status risiko wilayah per provinsi & kabupaten',
          'Titik posko pengungsian & fasilitas darurat terdekat',
          'Pencarian alamat dan rute evakuasi teraman (Fase 4)'
        ]}
        ctaLink={PATHS.PUBLIC.WARNINGS}
        ctaText="Lihat Peringatan Dini Terkini"
      />
    </div>
  );
};

