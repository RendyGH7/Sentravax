import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { ScrollWordTitle } from '../../components/shared/ScrollWordTitle';
import { 
  Shield, 
  Map, 
  Activity, 
  Radio, 
  PhoneCall, 
  Database, 
  Cpu, 
  Compass, 
  HeartHandshake,
  Layers
} from 'lucide-react';

export const PublicAboutPage: React.FC = () => {
  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-neutral-100">
      {/* 1. TOP HEADER & HOTLINE BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold">
              ARSITEKTUR & FITUR PLATFORM
            </span>
          </div>
          <ScrollWordTitle
            as="h1"
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
          >
            Tentang SENTRAVAX
          </ScrollWordTitle>
          <p className="text-xs text-neutral-400 mt-0.5">
            Platform intelijen geospasial & kesiapsiagaan bencana multi-hazard berbasis sains dan data terbuka.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={PATHS.PUBLIC.MAP}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Peta Interaktif</span>
          </Link>
          <Link
            to={PATHS.PUBLIC.REPORT}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Lapor Bencana</span>
          </Link>
        </div>
      </div>

      {/* 2. EMERGENCY SPEED-DIAL HOTLINE */}
      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2 text-rose-300 font-bold">
          <PhoneCall className="w-4 h-4 text-rose-400" />
          <span>Hotline Darurat Nasional (Bebas Pulsa):</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { num: '117', label: 'BNPB (Bencana)' },
            { num: '115', label: 'Basarnas (SAR)' },
            { num: '118', label: 'Ambulans' },
            { num: '113', label: 'Damkar' },
            { num: '110', label: 'Polisi' },
          ].map((h) => (
            <a
              key={h.num}
              href={`tel:${h.num}`}
              className="px-3 py-1.5 rounded-lg bg-[#141414] border border-rose-500/40 hover:bg-rose-950/40 text-rose-300 text-xs font-bold transition-colors shadow-2xs"
            >
              {h.num} <span className="font-normal text-neutral-400">({h.label})</span>
            </a>
          ))}
        </div>
      </div>

      {/* 3. CAPABILITIES GRID (FEATURE-DENSE) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Kemampuan & Fitur Utama
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Emergency Zero-Barrier</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Pelaporan kejadian darurat publik tanpa hambatan login, dilengkapi deteksi GPS instan dan clustering spasial otomatis.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-950/60 text-blue-400 flex items-center justify-center font-bold border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">PostGIS Spatial Engine</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Kalkulasi radius ancaman 25 km, spatial buffering, dan korelasi jarak presisi menggunakan geometri geospasial PostgreSQL.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center font-bold border border-amber-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">CAP Inbound & Broadcast</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Penerimaan dan diseminasi peringatan berstandar Common Alerting Protocol (ITU-T X.1303) dengan deduplikasi in-app.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-950/60 text-purple-400 flex items-center justify-center font-bold border border-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">AI Proactive Insights</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Sintesis bukti bahaya multi-sumber dengan skor keyakinan transparan (High 0.9, Medium 0.7, Low 0.4) dan fallback deterministik.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">SIAGA PERSONAL Warga</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Checklist 13 tas siaga BNPB, rencana darurat keluarga dengan titik kumpul privat, dan pemantauan multi-lokasi.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-rose-950/60 text-rose-400 flex items-center justify-center font-bold border border-rose-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Verified Shelter Registry</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Direktori shelter dan titik kumpul tervalidasi BPBD dengan kapasitas, fasilitas sanitasi, dan aksesibilitas lansia.
            </p>
          </div>
        </div>
      </div>

      {/* 4. DATA SOURCES & PROVENANCE TABLE */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Sumber Data & Provenance Otoritatif
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0d0d0d] border border-[#262626] space-y-1">
            <span className="font-bold text-white block">BMKG TEWS</span>
            <span className="text-[11px] text-neutral-400">Gempa bumi otomatis & cuaca ekstrem real-time.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0d0d0d] border border-[#262626] space-y-1">
            <span className="font-bold text-white block">BNPB Geoportal</span>
            <span className="text-[11px] text-neutral-400">Katalog historis bencana & panduan mitigasi resmi.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0d0d0d] border border-[#262626] space-y-1">
            <span className="font-bold text-white block">NASA FIRMS</span>
            <span className="text-[11px] text-neutral-400">Deteksi titik panas satelit MODIS/VIIRS.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0d0d0d] border border-[#262626] space-y-1">
            <span className="font-bold text-white block">Posko & Relawan</span>
            <span className="text-[11px] text-neutral-400">Laporan terverifikasi warga dari lapangan.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
