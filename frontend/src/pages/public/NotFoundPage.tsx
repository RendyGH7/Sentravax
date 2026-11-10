import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>
      <span className="text-xs font-mono text-rose-400 uppercase tracking-widest mb-1">
        Error 404 • Halaman Tidak Ditemukan
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Koordinat Halaman Tidak Terdeteksi
      </h1>
      <p className="text-slate-400 max-w-md text-sm mb-8">
        Halaman atau rute yang Anda tuju tidak terdaftar dalam sistem arsitektur SENTRAVAX. Silakan kembali ke beranda utama.
      </p>
      <div className="flex items-center gap-3">
        <Link
          to={PATHS.PUBLIC.HOME}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
        >
          <Home className="w-4 h-4" />
          Beranda Utama
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Halaman Sebelumnya
        </button>
      </div>
    </div>
  );
};

