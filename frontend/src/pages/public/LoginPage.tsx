import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
import { Shield, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../lib/api-error';
import { ErrorMessage } from '../../components/shared/ErrorMessage';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Silakan lengkapi alamat email dan kata sandi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const user = await login({ email, password });
      toast.success(`Selamat datang kembali, ${user.name}!`);

      // Route based on destination or user role (only if destination is permitted for role)
      const isPathAllowedForRole = (role: string, path: string): boolean => {
        if (role === 'admin') return path.startsWith('/admin');
        if (role === 'intelligence') return path.startsWith('/intelligence-center');
        if (role === 'user') return path.startsWith('/user');
        return false;
      };

      if (fromLocation && isPathAllowedForRole(user.role, fromLocation)) {
        navigate(fromLocation, { replace: true });
        return;
      }

      if (user.role === 'admin') {
        navigate(PATHS.ADMIN.DASHBOARD, { replace: true });
      } else if (user.role === 'intelligence') {
        navigate(PATHS.INTELLIGENCE.OVERVIEW, { replace: true });
      } else {
        navigate(PATHS.USER.DASHBOARD, { replace: true });
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Gagal melakukan autentikasi.');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDevAccount = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('Sentravax2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F9FAFB]">
      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] p-8 rounded-3xl border border-[#E5E7EB] shadow-md">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#047857] flex items-center justify-center mx-auto mb-3 text-white shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Masuk ke SENTRAVAX</h1>
          <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
            Akses terintegrasi portal warga, konsol admin, dan intelijen geospasial.
          </p>
        </div>

        {/* Development Quick Fill Presets */}
        <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
            <span className="flex items-center gap-1 font-bold text-[#111827]">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" /> Akun Pengujian Development:
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleSelectDevAccount('user@sentravax.id')}
              className="px-2 py-1.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#ECFDF5] hover:border-[#A7F3D0] text-[#111827] font-semibold transition-colors"
            >
              Warga
            </button>
            <button
              type="button"
              onClick={() => handleSelectDevAccount('intelligence@sentravax.go.id')}
              className="px-2 py-1.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-amber-50 hover:border-amber-200 text-[#111827] font-semibold transition-colors"
            >
              Intelijen
            </button>
            <button
              type="button"
              onClick={() => handleSelectDevAccount('admin@sentravax.go.id')}
              className="px-2 py-1.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-neutral-100 hover:border-neutral-300 text-[#111827] font-semibold transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        {errorMessage && (
          <ErrorMessage
            message={errorMessage}
            theme="light"
          />
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Alamat Email Terdaftar</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#111827]">Kata Sandi</label>
              <Link to={PATHS.PUBLIC.FORGOT_PASSWORD} className="text-xs text-[#047857] hover:text-[#065F46] font-semibold">
                Lupa sandi?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-sm transition-all shadow-xs disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Memproses Masuk...' : 'Masuk ke Akun'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-[#4B5563] pt-2 border-t border-[#E5E7EB]">
          Belum punya akun warga?{' '}
          <Link to={PATHS.PUBLIC.REGISTER} className="text-[#047857] hover:text-[#065F46] font-bold">
            Daftar akun warga baru
          </Link>
        </div>
      </div>
    </div>
  );
};
