import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Users } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const AdminUsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="ADMIN"
        title="Manajemen Pengguna & Otorisasi Peran"
        description="Pengelolaan akun pengguna lintas peran: Warga (user), Operator tanggap darurat (operator), Analis risiko (analyst), Administrator wilayah (admin), hingga Super Admin."
        route={PATHS.ADMIN.USERS}
        icon={Users}
        features={[
          'Daftar akun terdaftar dengan filter peran (Role-Based Access Control)',
          'Verifikasi identitas relawan dan nomor kontak darurat resmi',
          'Penugasan hak akses modul intelijen dan command center',
          'Aksi kunci/suspend akun pelanggar integritas data laporan'
        ]}
        ctaLink={PATHS.ADMIN.DASHBOARD}
        ctaText="Kembali ke Dashboard Admin"
      />
    </div>
  );
};

