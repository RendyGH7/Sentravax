import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Info } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const PublicAboutPage: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <AreaPlaceholder
        area="PUBLIC"
        title="Tentang Platform SENTRAVAX"
        description="SENTRAVAX (Sistem Terintegrasi Intelijen Resiko & Peringatan Dini) dikembangkan untuk menghadirkan kedaulatan data geospasial mitigasi bencana di Indonesia melalui kolaborasi sains, teknologi AI, dan masyarakat."
        route={PATHS.PUBLIC.ABOUT}
        icon={Info}
        features={[
          'Visi Zero-Casualty dalam manajemen bencana terpadu',
          'Arsitektur teknologi: React 19, Laravel 13, PostgreSQL & PostGIS',
          'Prinsip keterbukaan data dan transparansi sumber otoritatif',
          'Pedoman etika AI intelijen kebencanaan dan anti-hallucination'
        ]}
        ctaLink={PATHS.PUBLIC.HOME}
        ctaText="Kembali ke Beranda"
      />
    </div>
  );
};

