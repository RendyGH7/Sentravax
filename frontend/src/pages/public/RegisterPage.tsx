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
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden bg-black text-white">
      {/* Background Cinematic Atmosphere */}
      <img
        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=85&w=2560"
        alt="Atmospheric Satellite Earth & Sensor Telemetry Network"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-25 scale-105 pointer-events-none select-none"
        loading="eager"
      />

      {/* Multi-layered dark cinematic gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/85 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/30 via-black/90 to-black pointer-events-none" />

      {/* Subtle ambient glowing spots */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-gradient-to-b from-[#0e2218]/95 via-[#081710]/95 to-[#040c08] border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-2xl space-y-6 relative overflow-hidden">
          {/* Top radiant edge */}
          <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center mx-auto mb-3 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/40">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Registrasi Akun Warga</h1>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Bergabung dengan jaringan pelaporan mandiri dan kesiapsiagaan bencana SENTRAVAX.
            </p>
          </div>

          {errorMessage && (
            <ErrorMessage
              message={errorMessage}
              theme="dark"
            />
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-200">Nama Lengkap</label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06120b] border-2 border-emerald-500/35 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-200">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06120b] border-2 border-emerald-500/35 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-200">Nomor WhatsApp / Telepon (Opsional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06120b] border-2 border-emerald-500/35 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-200">Kata Sandi (Minimal 8 karakter)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06120b] border-2 border-emerald-500/35 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition-all font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs sm:text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] disabled:opacity-50 cursor-pointer"
              >
                <span>{isSubmitting ? 'Mendaftarkan Akun...' : 'Daftar Akun Warga'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </form>

          <div className="text-center text-xs text-neutral-300 pt-3 border-t border-emerald-500/30">
            Sudah memiliki akun terdaftar?{' '}
            <Link to={PATHS.PUBLIC.LOGIN} className="text-emerald-400 hover:text-emerald-300 font-black hover:underline transition-colors">
              Masuk disini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
