import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { Shield, Map, AlertTriangle, Radio, Users, ChevronRight, Activity } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0C1A24] to-[#070A13] border border-cyan-500/20 p-8 sm:p-12 lg:p-16 text-center space-y-6 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-cyan-500/10 blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          MULTI-HAZARD DISASTER INTELLIGENCE PLATFORM
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Sistem Deteksi Dini & Kesiapsiagaan Bencana Indonesia
        </h1>

        <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          SENTRAVAX mengintegrasikan data sensor BMKG, citra satelit, machine learning risk engine, dan pelaporan masyarakat untuk melindungi nyawa dan mempercepat respon tanggap darurat.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to={PATHS.PUBLIC.MAP}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Map className="w-4 h-4" />
            Buka Peta Risiko Terbuka
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            to={PATHS.PUBLIC.WARNINGS}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-medium text-sm transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Peringatan Dini Terkini
          </Link>
        </div>
      </section>

      {/* Four Area Navigation Matrix */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Empat Pilar Arsitektur Terintegrasi</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            SENTRAVAX dirancang untuk empat peran pemangku kepentingan dalam satu kesatuan platform yang aman.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Public */}
          <div className="p-6 rounded-xl bg-[#0B1320] border border-cyan-500/20 hover:border-cyan-500/40 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold">Area A</span>
              <h3 className="text-base font-bold text-white mt-1">Website Publik</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Akses bebas tanpa login untuk edukasi, informasi bencana resmi, dan kesiapsiagaan warga.
              </p>
            </div>
            <Link to={PATHS.PUBLIC.MAP} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-4">
              Jelajahi Publik <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: User */}
          <div className="p-6 rounded-xl bg-[#0B1320] border border-blue-500/20 hover:border-blue-500/40 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase text-blue-400 font-semibold">Area B</span>
              <h3 className="text-base font-bold text-white mt-1">Portal Warga</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Pelaporan bencana warga, pemantauan radius wilayah tempat tinggal, dan notifikasi personal.
              </p>
            </div>
            <Link to={PATHS.USER.DASHBOARD} className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-4">
              Masuk Portal <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Admin */}
          <div className="p-6 rounded-xl bg-[#0B1320] border border-amber-500/20 hover:border-amber-500/40 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold">Area C</span>
              <h3 className="text-base font-bold text-white mt-1">Admin Dashboard</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Manajemen pengguna, verifikasi laporan warga, data kejadian resmi, audit log, dan edukasi.
              </p>
            </div>
            <Link to={PATHS.ADMIN.DASHBOARD} className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-4">
              Akses Admin <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Intelligence */}
          <div className="p-6 rounded-xl bg-[#0B1320] border border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">Area D</span>
              <h3 className="text-base font-bold text-white mt-1">Intelligence Center</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Analisis geospasial multi-hazard, AI proactive insight, dan diseminasi operasi peringatan dini.
              </p>
            </div>
            <Link to={PATHS.INTELLIGENCE.OVERVIEW} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-4">
              Buka Command <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
