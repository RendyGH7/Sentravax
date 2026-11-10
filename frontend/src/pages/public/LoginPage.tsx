import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#0B1320] p-8 rounded-2xl border border-white/10 shadow-2xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Masuk ke SENTRAVAX</h2>
          <p className="text-xs text-slate-400 mt-2">
            Akses portal pelaporan warga, pantauan wilayah, dan otorisasi sistem.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-300">
          <div className="flex items-center gap-2 font-mono font-semibold mb-1">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Fase 2: Mockup Autentikasi Siap</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Integrasi autentikasi cookie-based Sanctum akan dikaitkan pada Fase 3. Anda dapat langsung menavigasi ke seluruh area melalui tombol di bawah.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Terdaftar</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">Kata Sandi</label>
              <Link to={PATHS.PUBLIC.FORGOT_PASSWORD} className="text-xs text-cyan-400 hover:text-cyan-300">
                Lupa sandi?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to={PATHS.USER.DASHBOARD}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-md shadow-cyan-500/20 transition-all"
            >
              <span>Masuk sebagai Warga</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={PATHS.ADMIN.DASHBOARD}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all"
            >
              <span>Masuk sebagai Admin</span>
            </Link>

            <Link
              to={PATHS.INTELLIGENCE.OVERVIEW}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all"
            >
              <span>Masuk sebagai Analyst</span>
            </Link>
          </div>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/10">
          Belum punya akun?{' '}
          <Link to={PATHS.PUBLIC.REGISTER} className="text-cyan-400 hover:text-cyan-300 font-medium">
            Daftar sekarang
          </Link>
        </div>
      </div>
    </div>
  );
};

