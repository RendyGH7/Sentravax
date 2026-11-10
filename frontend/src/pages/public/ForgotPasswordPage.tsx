import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { Shield, Mail, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FBFBFC]">
      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] p-8 rounded-2xl border border-[#E2E5E8] shadow-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#245B78] flex items-center justify-center mx-auto mb-4 text-white shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#202428] tracking-tight">Atur Ulang Kata Sandi</h1>
          <p className="text-xs text-[#596168] mt-1.5 leading-relaxed">
            Masukkan email terdaftar untuk menerima tautan instruksi pemulihan kata sandi akun Anda.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-medium text-[#202428] mb-1">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#737C83] absolute left-3 top-3" />
              <input
                type="email"
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E5E8] text-[#202428] placeholder-[#929292] text-sm focus:outline-none focus:border-[#245B78]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-[#245B78] hover:bg-[#1D4B64] text-white font-semibold text-sm transition-colors"
          >
            Kirim Tautan Pemulihan
          </button>
        </form>

        <div className="text-center text-xs text-[#596168] pt-2 border-t border-[#E2E5E8]">
          <Link to={PATHS.PUBLIC.LOGIN} className="inline-flex items-center gap-1.5 text-[#245B78] hover:text-[#1D4B64] font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
};
