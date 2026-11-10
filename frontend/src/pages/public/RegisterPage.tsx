import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { Shield, User, Mail, Lock, Phone } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FBFBFC]">
      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] p-8 rounded-2xl border border-[#E2E5E8] shadow-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#245B78] flex items-center justify-center mx-auto mb-4 text-white shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#202428] tracking-tight">Registrasi Akun Warga</h1>
          <p className="text-xs text-[#596168] mt-1.5 leading-relaxed">
            Bergabung dengan jaringan pelaporan dan kesiapsiagaan bencana SENTRAVAX.
          </p>
        </div>

        <form className="space-y-3.5" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-medium text-[#202428] mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#737C83] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Nama Anda"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E5E8] text-[#202428] placeholder-[#929292] text-sm focus:outline-none focus:border-[#245B78]"
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-medium text-[#202428] mb-1">Nomor WhatsApp atau Telepon</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#737C83] absolute left-3 top-3" />
              <input
                type="tel"
                placeholder="08123456789"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E5E8] text-[#202428] placeholder-[#929292] text-sm focus:outline-none focus:border-[#245B78]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#202428] mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#737C83] absolute left-3 top-3" />
              <input
                type="password"
                placeholder="Minimal 8 karakter"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E5E8] text-[#202428] placeholder-[#929292] text-sm focus:outline-none focus:border-[#245B78]"
              />
            </div>
          </div>

          <Link
            to={PATHS.USER.DASHBOARD}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#245B78] hover:bg-[#1D4B64] text-white font-semibold text-sm transition-all pt-2"
          >
            Daftar Akun Baru
          </Link>
        </form>

        <div className="text-center text-xs text-[#596168] pt-2 border-t border-[#E2E5E8]">
          Sudah memiliki akun terdaftar?{' '}
          <Link to={PATHS.PUBLIC.LOGIN} className="text-[#245B78] hover:text-[#1D4B64] font-semibold">
            Masuk disini
          </Link>
        </div>
      </div>
    </div>
  );
};
