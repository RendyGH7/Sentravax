import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { Shield, Mail, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F9FAFB]">
      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] p-8 rounded-3xl border border-[#E5E7EB] shadow-md">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#047857] flex items-center justify-center mx-auto mb-4 text-white shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Atur Ulang Kata Sandi</h1>
          <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
            Masukkan email terdaftar untuk menerima tautan instruksi pemulihan kata sandi akun Anda.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="email"
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#047857]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-sm transition-all shadow-xs"
          >
            Kirim Tautan Pemulihan
          </button>
        </form>

        <div className="text-center text-xs text-[#4B5563] pt-2 border-t border-[#E5E7EB]">
          <Link to={PATHS.PUBLIC.LOGIN} className="inline-flex items-center gap-1.5 text-[#047857] hover:text-[#065F46] font-bold">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
};
