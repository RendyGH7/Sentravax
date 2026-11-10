import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FBFBFC]">
      <div className="max-w-md w-full space-y-7 bg-[#FFFFFF] p-8 rounded-2xl border border-[#E2E5E8] shadow-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#245B78] flex items-center justify-center mx-auto mb-4 text-white shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#202428] tracking-tight">Masuk ke SENTRAVAX</h1>
          <p className="text-xs text-[#596168] mt-1.5 leading-relaxed">
            Akses portal pelaporan warga, pemantauan wilayah, dan otorisasi sistem.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-[#EAF1F5] border border-[#D0DFE7] text-xs text-[#245B78]">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <UserCheck className="w-4 h-4 text-[#245B78]" />
            <span>Arsitektur Multi-Peran Terpadu</span>
          </div>
          <p className="text-[#596168] text-[11px] leading-relaxed">
            Satu sistem autentikasi melayani peran Warga, Operator, Analis, dan Administrator. Anda dapat menguji akses area di bawah ini.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-medium text-[#202428] mb-1">Alamat Email Terdaftar</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#737C83] absolute left-3 top-3" />
              <input
                type="email"
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E5E8] text-[#202428] placeholder-[#929292] text-sm focus:outline-none focus:border-[#245B78] focus:ring-1 focus:ring-[#245B78]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#202428]">Kata Sandi</label>
              <Link to={PATHS.PUBLIC.FORGOT_PASSWORD} className="text-xs text-[#245B78] hover:text-[#1D4B64] font-medium">
                Lupa sandi?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#737C83] absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E5E8] text-[#202428] placeholder-[#929292] text-sm focus:outline-none focus:border-[#245B78] focus:ring-1 focus:ring-[#245B78]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to={PATHS.USER.DASHBOARD}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#245B78] hover:bg-[#1D4B64] text-white font-semibold text-sm transition-all"
            >
              <span>Masuk sebagai Warga</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={PATHS.ADMIN.DASHBOARD}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#F5F6F7] hover:bg-[#EAECEE] text-[#202428] border border-[#E2E5E8] text-xs font-medium transition-all"
            >
              <span>Masuk ke Konsol Admin</span>
            </Link>

            <Link
              to={PATHS.INTELLIGENCE.OVERVIEW}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#111111] hover:bg-[#191919] text-[#F2F2F2] text-xs font-medium transition-all"
            >
              <span>Masuk ke Intelligence Center</span>
            </Link>
          </div>
        </form>

        <div className="text-center text-xs text-[#596168] pt-2 border-t border-[#E2E5E8]">
          Belum punya akun?{' '}
          <Link to={PATHS.PUBLIC.REGISTER} className="text-[#245B78] hover:text-[#1D4B64] font-semibold">
            Daftar akun warga
          </Link>
        </div>
      </div>
    </div>
  );
};
