import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Compass } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const PublicPreparednessPage: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <AreaPlaceholder
        area="PUBLIC"
        title="Panduan Kesiapsiagaan & Tanggap Darurat"
        description="Panduan terstruktur dan praktis untuk masyarakat sebelum, saat, dan sesudah terjadinya bencana alam spesifik di lingkungan keluarga dan komunitas."
        route={PATHS.PUBLIC.PREPAREDNESS}
        icon={Compass}
        features={[
          'Checklist Tas Siaga Bencana (Grab Bag) keluarga',
          'SOP evakuasi mandiri gempa bumi dan tsunami',
          'Nomor kontak darurat nasional (BNPB, Basarnas, Polisi, Ambulans)',
          'Simulasi mandiri respon 10 menit pertama saat sirene berbunyi'
        ]}
        ctaLink={PATHS.PUBLIC.EDUCATION}
        ctaText="Pelajari Modul Edukasi"
      />
    </div>
  );
};

