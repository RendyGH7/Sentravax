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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F9FAFB]">
      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] p-8 rounded-3xl border border-[#E5E7EB] shadow-md">
        {isLinkInvalid ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center mx-auto text-[#DC2626] shadow-xs">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Tautan Pemulihan Tidak Valid
            </h1>

            <p className="text-sm text-[#4B5563] leading-relaxed">
              Tautan pemulihan kata sandi tidak memiliki parameter token atau alamat email yang valid, atau format tautan rusak.
            </p>

            <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] text-left leading-relaxed">
              Silakan ajukan permintaan pemulihan kata sandi baru untuk mendapatkan tautan verifikasi yang aktif.
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                to={PATHS.PUBLIC.FORGOT_PASSWORD}
                className="w-full py-2.5 px-4 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-xs text-center transition-all shadow-xs"
              >
                Minta Tautan Pemulihan Baru
              </Link>
              <Link
                to={PATHS.PUBLIC.LOGIN}
                className="w-full py-2.5 px-4 rounded-xl border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] font-semibold text-xs text-center transition-all"
              >
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center mx-auto text-[#047857] shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Kata Sandi Berhasil Diperbarui
            </h1>

            <p className="text-sm text-[#4B5563] leading-relaxed">
              Kata sandi akun Anda telah berhasil diatur ulang. Demi keamanan akun, seluruh token otorisasi perangkat lain telah dicabut.
            </p>

            <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] text-left leading-relaxed">
              Silakan masuk kembali menggunakan kata sandi baru Anda untuk melanjutkan aktivitas di portal SENTRAVAX.
            </div>

            <div className="pt-2">
              <Link
                to={PATHS.PUBLIC.LOGIN}
                className="w-full py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-sm text-center transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#047857] flex items-center justify-center mx-auto mb-3 text-white shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Atur Kata Sandi Baru</h1>
              <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                Menetapkan kata sandi baru untuk akun <strong className="text-[#111827]">{email}</strong>.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                <div className="flex-1">
                  <p>{errorMessage}</p>
                  {errorMessage.toLowerCase().includes('token') && (
                    <Link
                      to={PATHS.PUBLIC.FORGOT_PASSWORD}
                      className="text-[#047857] underline font-bold mt-1 inline-block"
                    >
                      Minta tautan baru &rarr;
                    </Link>
                  )}
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] disabled:bg-[#F3F4F6] disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#6B7280] hover:text-[#111827]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] disabled:bg-[#F3F4F6] disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(!showConfirmation)}
                    className="absolute right-3 top-2.5 text-[#6B7280] hover:text-[#111827]"
                  >
                    {showConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-1">
                <p className="font-semibold text-[#111827]">Ketentuan Kata Sandi:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li className={password.length >= 8 ? 'text-[#047857] font-medium' : ''}>
                    Minimal 8 karakter
                  </li>
                  <li className={password && password === passwordConfirmation ? 'text-[#047857] font-medium' : ''}>
                    Konfirmasi kata sandi harus identik
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#065F46] disabled:bg-[#9CA3AF] text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Kata Sandi...</span>
                  </>
                ) : (
                  <span>Simpan Kata Sandi Baru</span>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-[#4B5563] pt-2 border-t border-[#E5E7EB]">
              <Link to={PATHS.PUBLIC.LOGIN} className="text-[#047857] hover:text-[#065F46] font-bold">
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
