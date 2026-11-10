import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { BookOpen } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const PublicEducationPage: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <AreaPlaceholder
        area="PUBLIC"
        title="Literasi Kebencanaan & Modul Edukasi"
        description="Ruang belajar terbuka untuk meningkatkan kesadaran publik mengenai dinamika kebencanaan geologis dan hidrometeorologis di wilayah Nusantara."
        route={PATHS.PUBLIC.EDUCATION}
        icon={BookOpen}
        features={[
          'Modul pengenalan sesar aktif & lempeng tektonik Indonesia',
          'Infografis ramah anak mengenai banjir dan tanah longsor',
          'Video edukasi penyelamatan diri dan pertolongan pertama',
          'Kuis pemahaman kesiapsiagaan komunitas (Fase 4)'
        ]}
        ctaLink={PATHS.PUBLIC.ABOUT}
        ctaText="Tentang Platform SENTRAVAX"
      />
    </div>
  );
};

