import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { useAuth } from '../../app/context/useAuth';
import { Shield, Lock, Mail, ArrowRight, KeyRound, Radio, Activity, AlertTriangle } from 'lucide-react';
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
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden bg-black text-white">
      {/* Background Cinematic Atmosphere: Atmospheric Earth Telemetry */}
      <img
        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=85&w=2560"
        alt="Atmospheric Satellite Earth & Sensor Telemetry Network"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-30 scale-105 pointer-events-none select-none"
        loading="eager"
      />

      {/* Multi-layered dark cinematic gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/80 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/30 via-black/85 to-black pointer-events-none" />

      {/* Subtle ambient glowing spots */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container: Split Two-Column Grid */}
      <div className="max-w-6xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Column: Graphic Showcase & Mission Hub */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-6 select-none">
          {/* Status Badge */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-black tracking-wider uppercase bg-emerald-950/90 border-2 border-emerald-500/60 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>SISTEM PERTAHANAN KEBENCANAAN NASIONAL</span>
            </div>
          </div>

          {/* Monumental Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
              Satu Akses Terpadu.
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.55)]">
                Kesiapsiagaan Cepat Menyelamatkan Jiwa.
              </span>
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed max-w-xl font-normal">
              Platform terintegrasi yang menghubungkan telemetri sensor multi-ancaman BMKG, BNPB, dan PVMBG dengan jutaan keluarga di 34 provinsi Indonesia.
            </p>
          </div>

          {/* Interactive Graphic Hub Module */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c2419]/90 via-[#071710]/95 to-[#040d09] border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)] space-y-4 relative overflow-hidden backdrop-blur-xl">
            {/* Top Telemetry Beacon Row */}
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3 text-xs font-mono">
              <span className="text-emerald-300 font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                STATUS: RADAR AKTIF 24/7
              </span>
              <span className="text-neutral-400 text-[11px]">
                LATENSI: &lt; 3.2 DETIK
              </span>
            </div>

            {/* 3 Graphic Value Highlight Cards */}
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-[#06150e] border-2 border-emerald-500/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Portal Warga Siaga 72 Jam</h4>
                  <p className="text-[11px] text-neutral-300 leading-relaxed mt-0.5">
                    Kalkulator ransum mandiri, jalur evakuasi shelter terdekat yang ramah lansia, dan pelaporan darurat instan.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#06150e] border-2 border-amber-500/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Konsol Intelijen &amp; Operasi CAP</h4>
                  <p className="text-[11px] text-neutral-300 leading-relaxed mt-0.5">
                    Diseminasi peringatan dini berstandar Common Alerting Protocol v1.2 langsung ke ponsel masyarakat.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#06150e] border-2 border-blue-500/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Validasi Otoritatif Bebas Hoaks</h4>
                  <p className="text-[11px] text-neutral-300 leading-relaxed mt-0.5">
                    Integrasi sensor seismik BMKG, data bencana BNPB, dan aktivitas gunung api PVMBG secara presisi.
                  </p>
                </div>
              </div>
            </div>

            {/* Endorsement Footnote */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span>JARINGAN DATA RESMI:</span>
              <span className="text-emerald-400 font-bold">BMKG • BNPB • BASARNAS • PVMBG</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sleek Glassmorphic Login Form Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-gradient-to-b from-[#0e2218]/95 via-[#081710]/95 to-[#040c08] border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-2xl space-y-6 relative overflow-hidden">
            {/* Top decorative radiant edge */}
            <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            {/* Form Header */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center mx-auto mb-3 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/40">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Masuk ke SENTRAVAX</h2>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Akses terintegrasi portal warga, konsol admin, dan intelijen geospasial.
              </p>
            </div>

            {/* Development Quick Fill Presets */}
            <div className="p-3.5 rounded-2xl bg-[#06140e] border-2 border-emerald-500/40 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Akun Pengujian Development:
                </span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                  1-KLIK
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectDevAccount('user@sentravax.id')}
                  className="px-2.5 py-2 rounded-xl border-2 border-emerald-500/60 bg-[#0a2618] hover:bg-[#0f3824] text-emerald-300 font-black transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer text-center"
                >
                  Warga
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDevAccount('intelligence@sentravax.go.id')}
                  className="px-2.5 py-2 rounded-xl border-2 border-amber-500/60 bg-[#291703] hover:bg-[#3d2305] text-amber-300 font-black transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer text-center"
                >
                  Intelijen
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDevAccount('admin@sentravax.go.id')}
                  className="px-2.5 py-2 rounded-xl border-2 border-indigo-500/60 bg-[#13172e] hover:bg-[#1a2245] text-indigo-300 font-black transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] cursor-pointer text-center"
                >
                  Admin
                </button>
              </div>
            </div>

            {errorMessage && (
              <ErrorMessage
                message={errorMessage}
                theme="dark"
              />
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-200">Alamat Email Terdaftar</label>
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
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-200">Kata Sandi</label>
                  <Link to={PATHS.PUBLIC.FORGOT_PASSWORD} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-colors">
                    Lupa sandi?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
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
                  <span>{isSubmitting ? 'Memproses Masuk...' : 'Masuk ke Akun'}</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              </div>
            </form>

            <div className="text-center text-xs text-neutral-300 pt-3 border-t border-emerald-500/30">
              Belum punya akun warga?{' '}
              <Link to={PATHS.PUBLIC.REGISTER} className="text-emerald-400 hover:text-emerald-300 font-black hover:underline transition-colors">
                Daftar akun warga baru
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
