import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
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
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & HOTLINE BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-mono uppercase text-[#047857] font-bold">
              ARSITEKTUR & FITUR PLATFORM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Tentang SENTRAVAX
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Platform intelijen geospasial & kesiapsiagaan bencana multi-hazard berbasis sains dan data terbuka.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={PATHS.PUBLIC.MAP}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Peta Interaktif</span>
          </Link>
          <Link
            to={PATHS.PUBLIC.REPORT}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Lapor Bencana</span>
          </Link>
        </div>
      </div>

      {/* 2. EMERGENCY SPEED-DIAL HOTLINE */}
      <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#991B1B] text-xs font-bold">
          <PhoneCall className="w-4 h-4 text-[#DC2626]" />
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
              className="px-3 py-1.5 rounded-lg bg-white border border-[#FCA5A5] hover:bg-[#FEE2E2] text-[#991B1B] text-xs font-bold transition-colors shadow-2xs"
            >
              {h.num} <span className="font-normal text-gray-600">({h.label})</span>
            </a>
          ))}
        </div>
      </div>

      {/* 3. CAPABILITIES GRID (FEATURE-DENSE) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
          Kemampuan & Fitur Utama
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#047857] flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">Emergency Zero-Barrier</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Pelaporan kejadian darurat publik tanpa hambatan login, dilengkapi deteksi GPS instan dan clustering spasial otomatis.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">PostGIS Spatial Engine</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Kalkulasi radius ancaman 25 km, spatial buffering, dan korelasi jarak presisi menggunakan geometri geospasial PostgreSQL.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center font-bold">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">CAP Inbound & Broadcast</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Penerimaan dan diseminasi peringatan berstandar Common Alerting Protocol (ITU-T X.1303) dengan deduplikasi in-app.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#FAF5FF] text-[#7E22CE] flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">AI Proactive Insights</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Sintesis bukti bahaya multi-sumber dengan skor keyakinan transparan (High 0.9, Medium 0.7, Low 0.4) dan fallback deterministik.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">SIAGA PERSONAL Warga</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Checklist 13 tas siaga BNPB, rencana darurat keluarga dengan titik kumpul privat, dan pemantauan multi-lokasi.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">Verified Shelter Registry</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Direktori shelter dan titik kumpul tervalidasi BPBD dengan kapasitas, fasilitas sanitasi, dan aksesibilitas lansia.
            </p>
          </div>
        </div>
      </div>

      {/* 4. DATA SOURCES & PROVENANCE TABLE */}
      <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-[#047857]" />
          Sumber Data & Provenance Otoritatif
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="font-bold text-gray-900 block">BMKG TEWS</span>
            <span className="text-[11px] text-gray-500">Gempa bumi otomatis & cuaca ekstrem real-time.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="font-bold text-gray-900 block">BNPB Geoportal</span>
            <span className="text-[11px] text-gray-500">Katalog historis bencana & panduan mitigasi resmi.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="font-bold text-gray-900 block">NASA FIRMS</span>
            <span className="text-[11px] text-gray-500">Deteksi titik panas satelit MODIS/VIIRS.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="font-bold text-gray-900 block">Posko & Relawan</span>
            <span className="text-[11px] text-gray-500">Laporan terverifikasi warga dari lapangan.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
