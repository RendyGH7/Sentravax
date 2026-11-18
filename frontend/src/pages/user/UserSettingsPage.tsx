import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
import { userService } from '../../services/user-service';
import { 
  Settings, 
  User as UserIcon, 
  Mail, 
  ShieldCheck, 
  Bell, 
  Lock, 
  Save, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  HeartHandshake
} from 'lucide-react';
import { toast } from 'sonner';

export const UserSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [role] = useState(user?.role || 'user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const prof = await userService.getProfile();
        if (isMounted) {
          setName(prof.name);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama pengguna tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await userService.updateProfile({ name: name.trim() });
      setName(updated.name);
      toast.success('Profil berhasil diperbarui.');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-[#E5E7EB]">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#047857]" />
          Pengaturan Akun & Profil Warga
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Kelola profil identitas Anda, kendalikan privasi data kesiapsiagaan, dan navigasikan preferensi notifikasi bahaya.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <form
            onSubmit={handleUpdateProfile}
            className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
                Informasi Akun Warga
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Peran: {role.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-xs font-medium text-[#111827] focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857] disabled:bg-[#F9FAFB]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider">
                  Alamat Surel (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-medium text-[#6B7280] cursor-not-allowed"
                  />
                </div>
                <span className="text-[11px] text-[#9CA3AF]">
                  Surel digunakan sebagai kredensial autentikasi utama dan tidak dapat diubah sembarangan.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>

          {/* Privacy & Role Boundary Notice */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#047857]" />
              Kebijakan Privasi & Batasan Data Warga
            </h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              SENTRAVAX menjamin data rencana kesiapsiagaan keluarga (titik kumpul, catatan evakuasi, nomor kontak kerabat) bersifat privat dan hanya dapat diakses oleh akun Anda. Data tersebut tidak pernah disebarkan ke publik tanpa izin eksplisit.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] text-[#374151]">
              <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#047857] flex-shrink-0" />
                <span>Enkripsi kata sandi standar Argon2/Bcrypt</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#047857] flex-shrink-0" />
                <span>Isolasi hak akses multi-role (RBAC)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Navigation Links */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Pusat Kendali Terkait
            </h3>

            <div className="space-y-2">
              <Link
                to={PATHS.USER.NOTIFICATIONS}
                className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#047857] hover:bg-[#F0FDF4] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#047857] flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#047857]">
                      Preferensi Notifikasi
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">Ambang batas & saluran</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#047857] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to={PATHS.USER.SIAGA}
                className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#047857] hover:bg-[#F0FDF4] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#1D4ED8]">
                      Rencana Siaga Keluarga
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">Titik kumpul & kontak darurat</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#1D4ED8] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to={PATHS.USER.REGIONS}
                className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#047857] hover:bg-[#F0FDF4] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#D97706]">
                      Wilayah Pantauan
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">Multi-location monitoring</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#D97706] group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
