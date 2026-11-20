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
  KeyRound,
  Eye,
  EyeOff,
  Save, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  HeartHandshake,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const UserSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [role] = useState(user?.role || 'user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

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
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMsg || 'Gagal memperbarui profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.current_password = 'Kata sandi saat ini wajib diisi.';
    }

    if (!newPassword) {
      errors.password = 'Kata sandi baru wajib diisi.';
    } else if (newPassword.length < 8) {
      errors.password = 'Kata sandi baru minimal harus terdiri dari 8 karakter.';
    } else if (newPassword === currentPassword) {
      errors.password = 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.';
    }

    if (!confirmPassword) {
      errors.password_confirmation = 'Konfirmasi kata sandi baru wajib diisi.';
    } else if (newPassword !== confirmPassword) {
      errors.password_confirmation = 'Konfirmasi kata sandi baru tidak cocok.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setIsChangingPassword(true);

    try {
      const response = await userService.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      toast.success(response.message || 'Kata sandi berhasil diperbarui.');
      // Clear password input values upon successful update
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (err: unknown) {
      console.error('Failed to change password:', err);
      const errorObj = err as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            errors?: Record<string, string[] | string>;
          };
        };
      };

      if (errorObj.response?.status === 422 && errorObj.response?.data?.errors) {
        const serverErrors: Record<string, string> = {};
        Object.entries(errorObj.response.data.errors).forEach(([field, msgs]) => {
          if (Array.isArray(msgs) && msgs.length > 0) {
            serverErrors[field] = msgs[0];
          } else if (typeof msgs === 'string') {
            serverErrors[field] = msgs;
          }
        });
        setPasswordErrors(serverErrors);
        toast.error(errorObj.response?.data?.message || 'Validasi kata sandi gagal.');
      } else if (errorObj.response?.status === 429) {
        toast.error('Terlalu banyak percobaan ganti kata sandi. Silakan tunggu 1 menit.');
      } else {
        toast.error(errorObj.response?.data?.message || 'Gagal memperbarui kata sandi. Pastikan koneksi stabil.');
      }
    } finally {
      setIsChangingPassword(false);
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
        {/* Left Column: Profile & Security Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
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
                    disabled={isLoading || isSubmitting}
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form
            onSubmit={handleChangePassword}
            className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#047857]" />
                <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
                  Ubah Kata Sandi Akun
                </h2>
              </div>
              <span className="text-[11px] text-[#6B7280]">
                Minimal 8 karakter
              </span>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordErrors.current_password) {
                        setPasswordErrors((prev) => ({ ...prev, current_password: '' }));
                      }
                    }}
                    required
                    disabled={isChangingPassword}
                    placeholder="Masukkan kata sandi saat ini"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#FFFFFF] border text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 transition-all disabled:bg-[#F9FAFB] ${
                      passwordErrors.current_password
                        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                        : 'border-[#E5E7EB] focus:border-[#047857] focus:ring-[#047857]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-[#9CA3AF] hover:text-[#374151] focus:outline-none"
                    aria-label={showCurrentPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.current_password && (
                  <p className="text-[11px] font-medium text-[#EF4444]">{passwordErrors.current_password}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordErrors.password) {
                        setPasswordErrors((prev) => ({ ...prev, password: '' }));
                      }
                    }}
                    required
                    disabled={isChangingPassword}
                    placeholder="Minimal 8 karakter kombinasi aman"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#FFFFFF] border text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 transition-all disabled:bg-[#F9FAFB] ${
                      passwordErrors.password
                        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                        : 'border-[#E5E7EB] focus:border-[#047857] focus:ring-[#047857]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-[#9CA3AF] hover:text-[#374151] focus:outline-none"
                    aria-label={showNewPassword ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.password && (
                  <p className="text-[11px] font-medium text-[#EF4444]">{passwordErrors.password}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordErrors.password_confirmation) {
                        setPasswordErrors((prev) => ({ ...prev, password_confirmation: '' }));
                      }
                    }}
                    required
                    disabled={isChangingPassword}
                    placeholder="Ulangi kata sandi baru Anda"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#FFFFFF] border text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 transition-all disabled:bg-[#F9FAFB] ${
                      passwordErrors.password_confirmation
                        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                        : 'border-[#E5E7EB] focus:border-[#047857] focus:ring-[#047857]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-[#9CA3AF] hover:text-[#374151] focus:outline-none"
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.password_confirmation && (
                  <p className="text-[11px] font-medium text-[#EF4444]">{passwordErrors.password_confirmation}</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <span className="text-[11px] text-[#6B7280]">
                Sesi saat ini akan tetap aktif secara aman.
              </span>
              <button
                type="submit"
                disabled={isChangingPassword || isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Perbarui Kata Sandi</span>
                  </>
                )}
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
