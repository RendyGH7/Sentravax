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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F9FAFB]">
      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] p-8 rounded-3xl border border-[#E5E7EB] shadow-md">
        {isSubmitted ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center mx-auto text-[#047857] shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Instruksi Pemulihan Terkirim
            </h1>

            <p className="text-sm text-[#4B5563] leading-relaxed">
              Jika alamat email <strong className="text-[#111827]">{email}</strong> terdaftar di sistem kami,
              tautan pemulihan kata sandi telah dikirimkan ke kotak masuk Anda.
            </p>

            <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] text-left leading-relaxed flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
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
                className="w-full py-2.5 px-4 rounded-xl border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] font-semibold text-xs transition-all"
              >
                Kirim Ulang atau Gunakan Email Lain
              </button>

              <Link
                to={PATHS.PUBLIC.LOGIN}
                className="w-full py-2.5 px-4 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-xs text-center transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#047857] flex items-center justify-center mx-auto mb-3 text-white shadow-sm">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Lupa Kata Sandi</h1>
              <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                Masukkan email akun SENTRAVAX Anda untuk menerima tautan instruksi pemulihan kata sandi.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-[#111827] mb-1">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] disabled:bg-[#F3F4F6] disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#065F46] disabled:bg-[#9CA3AF] text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Kirim Tautan Pemulihan</span>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-[#4B5563] pt-2 border-t border-[#E5E7EB]">
              <Link to={PATHS.PUBLIC.LOGIN} className="inline-flex items-center gap-1.5 text-[#047857] hover:text-[#065F46] font-bold">
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
