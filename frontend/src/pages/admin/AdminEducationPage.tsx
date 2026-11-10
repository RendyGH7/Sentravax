import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { BookOpen } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const AdminEducationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="ADMIN"
        title="Manajemen Konten & Literasi Edukasi"
        description="Kelola materi literasi kebencanaan publik, modul panduan kesiapsiagaan keluarga, infografis tanggap darurat, dan materi kuis kesiapsiagaan masyarakat."
        route={PATHS.ADMIN.EDUCATION}
        icon={BookOpen}
        features={[
          'Editor materi artikel edukasi mitigasi kebencanaan',
          'Pengelolaan kategori bahaya (Geologis, Hidrometeorologis, Vulkanik)',
          'Unggah infografis, video simulasi, dan lampiran panduan SOP',
          'Statistik pembacaan modul dan keterlibatan masyarakat'
        ]}
        ctaLink={PATHS.ADMIN.DASHBOARD}
        ctaText="Kembali ke Dashboard Admin"
      />
    </div>
  );
};

