import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Activity } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const PublicDisastersPage: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <AreaPlaceholder
        area="PUBLIC"
        title="Katalog Kejadian Bencana"
        description="Pusat informasi riwayat dan status terkini seluruh kejadian bencana di wilayah Republik Indonesia yang dihimpun dari sumber data otoritatif nasional dan internasional."
        route={PATHS.PUBLIC.DISASTERS}
        icon={Activity}
        features={[
          'Daftar kejadian gempa bumi terkini (Data realtime BMKG)',
          'Riwayat anomali hidrometeorologi dan banjir musiman',
          'Status aktivitas gunung berapi aktif (PVMBG/MAGMA)',
          'Filter rentang tanggal, magnitudo, dan dampak wilayah'
        ]}
        ctaLink={PATHS.PUBLIC.MAP}
        ctaText="Buka Peta Kejadian"
      />
    </div>
  );
};

