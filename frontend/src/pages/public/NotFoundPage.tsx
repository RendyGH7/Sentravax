import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-[#FFFFFF]">
      <div className="w-14 h-14 rounded-2xl bg-[#FDECEC] border border-[#F6C6C4] flex items-center justify-center text-[#B33A35] mb-5">
        <AlertCircle className="w-7 h-7" />
      </div>
      <span className="text-xs font-mono text-[#B33A35] uppercase tracking-wider font-semibold mb-1">
        Status 404: Halaman Tidak Ditemukan
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#202428] mb-2 tracking-tight">
        Koordinat Halaman Tidak Terdaftar
      </h1>
      <p className="text-[#596168] max-w-md text-xs sm:text-sm mb-6 leading-relaxed">
        Tautan atau rute yang Anda tuju tidak tersedia dalam direktori SENTRAVAX. Silakan kembali ke beranda utama untuk melanjutkan navigasi.
      </p>
      <div className="flex items-center gap-3">
        <Link
          to={PATHS.PUBLIC.HOME}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#245B78] hover:bg-[#1D4B64] text-white font-semibold text-xs transition-colors"
        >
          <Home className="w-4 h-4" />
          Beranda Utama
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5F6F7] hover:bg-[#EAECEE] text-[#202428] border border-[#E2E5E8] text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Halaman Sebelumnya
        </button>
      </div>
    </div>
  );
};
