import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { Shield, Mail, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../lib/api-error';
import { authService } from '../../lib/auth-service';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage('Silakan masukkan alamat email Anda.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Format alamat email tidak valid.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await authService.forgotPassword(cleanEmail);
      setIsSubmitted(true);
      toast.success('Permintaan pemulihan kata sandi berhasil dikirim.');
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Terjadi kendala saat memproses permintaan pemulihan.');
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
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-gradient-to-b from-[#0e2218]/95 via-[#081710]/95 to-[#040c08] border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-2xl space-y-6 relative overflow-hidden">
          {/* Top radiant edge */}
          <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <h1 className="text-2xl font-black text-white tracking-tight">
                Instruksi Pemulihan Terkirim
              </h1>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Jika alamat email <strong className="text-emerald-400">{email}</strong> terdaftar di sistem kami,
                tautan pemulihan kata sandi telah dikirimkan ke kotak masuk Anda.
              </p>

              <div className="p-4 rounded-2xl bg-[#06160e] border border-emerald-500/30 text-xs text-emerald-300 text-left leading-relaxed flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Demi keamanan akun Anda, tautan pemulihan berlaku selama <strong>60 menit</strong>.
                  Periksa juga folder <em>Spam</em> atau <em>Junk</em> jika tidak menemukannya di kotak masuk utama.
                </span>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                    setErrorMessage(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-emerald-500/40 hover:bg-[#0c2e1c] text-neutral-200 font-bold text-xs transition-all cursor-pointer"
                >
                  Kirim Ulang atau Gunakan Email Lain
                </button>

                <Link
                  to={PATHS.PUBLIC.LOGIN}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs text-center transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4 text-black" />
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center mx-auto mb-3 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/40">
                  <Shield className="w-6 h-6 text-black" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Lupa Kata Sandi</h1>
                <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                  Masukkan email akun SENTRAVAX Anda untuk menerima tautan instruksi pemulihan kata sandi.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-300 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-bold text-neutral-200">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="nama@email.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06120b] border-2 border-emerald-500/35 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50 transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs sm:text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Kirim Tautan Pemulihan</span>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-neutral-300 pt-3 border-t border-emerald-500/30">
                <Link to={PATHS.PUBLIC.LOGIN} className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-black hover:underline transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
