import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
import { Shield, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../lib/api-error';
import { ErrorMessage } from '../../components/shared/ErrorMessage';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Harap isi nama lengkap, email, dan kata sandi.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Kata sandi minimal harus 8 karakter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const user = await register({
        name,
        email,
        password,
        phone: phone.trim() || undefined,
      });

      toast.success(`Akun warga berhasil dibuat! Selamat datang, ${user.name}.`);
      navigate(PATHS.USER.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Gagal melakukan pendaftaran akun.');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F9FAFB]">
      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] p-8 rounded-3xl border border-[#E5E7EB] shadow-md">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#047857] flex items-center justify-center mx-auto mb-3 text-white shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Registrasi Akun Warga</h1>
          <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
            Bergabung dengan jaringan pelaporan mandiri dan kesiapsiagaan bencana SENTRAVAX.
          </p>
        </div>

        {errorMessage && (
          <ErrorMessage
            message={errorMessage}
            theme="light"
          />
        )}

        <form className="space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#047857]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#047857]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Nomor WhatsApp atau Telepon (Opsional)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#047857]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Kata Sandi (Minimal 8 karakter)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#047857]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-sm transition-all shadow-xs pt-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Mendaftarkan Akun...' : 'Daftar Akun Baru'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[#4B5563] pt-2 border-t border-[#E5E7EB]">
          Sudah memiliki akun terdaftar?{' '}
          <Link to={PATHS.PUBLIC.LOGIN} className="text-[#047857] hover:text-[#065F46] font-bold">
            Masuk disini
          </Link>
        </div>
      </div>
    </div>
  );
};
