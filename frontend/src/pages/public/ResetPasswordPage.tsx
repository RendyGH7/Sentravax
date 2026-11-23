import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../lib/api-error';
import { authService } from '../../lib/auth-service';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLinkInvalid = !token.trim() || !email.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setErrorMessage('Kata sandi baru minimal harus 8 karakter.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await authService.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setIsSuccess(true);
      toast.success('Kata sandi berhasil diperbarui.');
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Gagal memperbarui kata sandi. Tautan mungkin telah kedaluwarsa atau tidak valid.');
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

          {isLinkInvalid ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500/40 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>

              <h1 className="text-2xl font-black text-white tracking-tight">
                Tautan Pemulihan Tidak Valid
              </h1>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Tautan pemulihan kata sandi tidak memiliki parameter token atau alamat email yang valid, atau format tautan rusak.
              </p>

              <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/30 text-xs text-amber-300 text-left leading-relaxed">
                Silakan ajukan permintaan pemulihan kata sandi baru untuk mendapatkan tautan verifikasi yang aktif.
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  to={PATHS.PUBLIC.FORGOT_PASSWORD}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs text-center transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  Minta Tautan Pemulihan Baru
                </Link>
                <Link
                  to={PATHS.PUBLIC.LOGIN}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-emerald-500/40 hover:bg-[#0c2e1c] text-neutral-200 font-bold text-xs text-center transition-all"
                >
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <h1 className="text-2xl font-black text-white tracking-tight">
                Kata Sandi Berhasil Diperbarui
              </h1>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Kata sandi akun Anda telah berhasil diatur ulang. Demi keamanan akun, seluruh token otorisasi perangkat lain telah dicabut.
              </p>

              <div className="p-3.5 rounded-xl bg-[#06160e] border border-emerald-500/30 text-xs text-emerald-300 text-left leading-relaxed">
                Silakan masuk kembali menggunakan kata sandi baru Anda untuk melanjutkan aktivitas di portal SENTRAVAX.
              </div>

              <div className="pt-2">
                <Link
                  to={PATHS.PUBLIC.LOGIN}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs sm:text-sm text-center transition-all shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
                >
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center mx-auto mb-3 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/40">
                  <Lock className="w-6 h-6 text-black" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Atur Kata Sandi Baru</h1>
                <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                  Menetapkan kata sandi baru untuk akun <strong className="text-emerald-400">{email}</strong>.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-300 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <div className="flex-1">
                    <p>{errorMessage}</p>
                    {errorMessage.toLowerCase().includes('token') && (
                      <Link
                        to={PATHS.PUBLIC.FORGOT_PASSWORD}
                        className="text-emerald-400 underline font-black mt-1 inline-block"
                      >
                        Minta tautan baru &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-200">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Minimal 8 karakter"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#06120b] border-2 border-emerald-500/35 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-200">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                    <input
                      type={showConfirmation ? 'text' : 'password'}
                      value={passwordConfirmation}
                      onChange={(e) => {
                        setPasswordConfirmation(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Ulangi kata sandi baru"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#06120b] border-2 border-emerald-500/35 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmation(!showConfirmation)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                    >
                      {showConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#06140e] rounded-xl border border-emerald-500/30 text-[11px] text-neutral-300 space-y-1">
                  <p className="font-bold text-white">Ketentuan Kata Sandi:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li className={password.length >= 8 ? 'text-emerald-400 font-bold' : ''}>
                      Minimal 8 karakter
                    </li>
                    <li className={password && password === passwordConfirmation ? 'text-emerald-400 font-bold' : ''}>
                      Konfirmasi kata sandi harus identik
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs sm:text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Menyimpan Kata Sandi...</span>
                    </>
                  ) : (
                    <span>Simpan Kata Sandi Baru</span>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-neutral-300 pt-3 border-t border-emerald-500/30">
                <Link to={PATHS.PUBLIC.LOGIN} className="text-emerald-400 hover:text-emerald-300 font-black hover:underline transition-colors">
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
