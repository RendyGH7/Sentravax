import React from 'react';
import { AreaPlaceholder } from '../../components/shared/AreaPlaceholder';
import { Settings } from 'lucide-react';
import { PATHS } from '../../app/router/paths';

export const UserSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AreaPlaceholder
        area="USER"
        title="Pengaturan Profil & Preferensi Notifikasi"
        description="Kelola informasi akun pengguna, kontak darurat keluarga, dan preferensi saluran notifikasi (Email, WhatsApp, Push Notification)."
        route={PATHS.USER.SETTINGS}
        icon={Settings}
        features={[
          'Pembaruan identitas profil & nomor kontak darurat',
          'Pengaturan saluran penerimaan notifikasi bencana',
          'Ubah kata sandi dan pengaturan keamanan sesi akun',
          'Pilihan bahasa antarmuka dan preferensi tema tampilan'
        ]}
        ctaLink={PATHS.USER.DASHBOARD}
        ctaText="Kembali ke Dashboard Warga"
      />
    </div>
  );
};

