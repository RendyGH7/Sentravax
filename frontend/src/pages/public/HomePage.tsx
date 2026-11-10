import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { 
  Shield, 
  Map, 
  ChevronRight, 
  Activity, 
  Radio, 
  Users, 
  SendHorizontal, 
  BellRing
} from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-20 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section (Modeled after Reference 4: KALmap Clean Layout) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4 sm:pt-8">
        {/* Left Column: Typography & CTAs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF1F5] border border-[#D0DFE7] text-[#245B78] text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[#28734D]"></span>
            <span>Platform Intelijen Bencana dan Kesiapsiagaan Mandiri</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#202428] leading-[1.12]">
              Tetap Tenang.
              <span className="block text-[#245B78]">Tetap Aman.</span>
              <span className="block text-[#8A5A13]">Siaga Bersama SENTRAVAX.</span>
            </h1>
          </div>

          <div className="space-y-2 pt-1">
            <h2 className="text-base sm:text-lg font-semibold text-[#245B78]">
              Prediksi Risiko Bencana. Laporkan Kejadian Nyata.
            </h2>
            <p className="text-sm sm:text-base text-[#596168] leading-relaxed max-w-xl">
              Integrasi analisis spasial multi-hazard dan pelaporan partisipatif masyarakat untuk menjaga keselamatan warga, keluarga, dan ketangguhan komunitas di seluruh Nusantara.
            </p>
          </div>

          {/* Feature Tag Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F5F6F7] border border-[#E2E5E8] text-[#333B42]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#245B78]"></span>
              Analisis Prediktif Spasial
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F5F6F7] border border-[#E2E5E8] text-[#333B42]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#28734D]"></span>
              Pelaporan Warga Real-Time
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F5F6F7] border border-[#E2E5E8] text-[#333B42]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8A5A13]"></span>
              Peringatan Dini Multi-Hazard
            </span>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              to={PATHS.USER.CREATE_REPORT}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#245B78] hover:bg-[#1D4B64] text-white font-semibold text-sm transition-all shadow-xs"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>Laporkan Kejadian</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              to={PATHS.PUBLIC.MAP}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F6F7] text-[#245B78] border border-[#D0DFE7] font-semibold text-sm transition-colors"
            >
              <Map className="w-4 h-4" />
              <span>Buka Peta Risiko</span>
            </Link>
          </div>

          {/* Real-Time Monitoring Pill */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#F5F6F7] border border-[#E2E5E8]">
              <div className="flex -space-x-1">
                <span className="w-3 h-3 rounded-full bg-[#245B78]"></span>
                <span className="w-3 h-3 rounded-full bg-[#28734D]"></span>
                <span className="w-3 h-3 rounded-full bg-[#8A5A13]"></span>
              </div>
              <div className="text-xs">
                <span className="font-semibold text-[#202428] block">Pemantauan Geospasial Aktif</span>
                <span className="text-[#596168] text-[11px]">Terhubung ke 38 provinsi di Indonesia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean App Preview Mockup (Adapted from KALmap style) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-sm rounded-3xl bg-[#FFFFFF] border border-[#E2E5E8] p-5 shadow-lg space-y-4">
            {/* Phone Top Header */}
            <div className="flex items-center justify-between border-b border-[#E2E5E8] pb-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#245B78] text-white flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-[#202428]">SENTRAVAX Mobile</span>
              </div>
              <span className="text-[10px] font-mono text-[#28734D] bg-[#EAF1F5] px-2 py-0.5 rounded font-semibold">
                TERVERIFIKASI
              </span>
            </div>

            {/* Mockup Map Area */}
            <div className="rounded-2xl bg-[#F0F4F7] border border-[#D5E1E8] p-4 text-center space-y-3 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#245B78] text-white flex items-center justify-center mx-auto shadow-sm">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#202428]">Status Wilayah Anda: Aman</h3>
                <p className="text-[11px] text-[#596168] mt-1">
                  Radius pantau 5 km, tidak ada indikasi anomali curah hujan ekstrem atau deformasi tanah.
                </p>
              </div>

              {/* Quick Status Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D5E1E8] text-[10px] font-mono">
                <div className="p-1.5 rounded bg-white border border-[#E2E5E8]">
                  <span className="text-[#737C83] block">BMKG</span>
                  <span className="font-semibold text-[#28734D]">Normal</span>
                </div>
                <div className="p-1.5 rounded bg-white border border-[#E2E5E8]">
                  <span className="text-[#737C83] block">Sungai</span>
                  <span className="font-semibold text-[#28734D]">Stabil</span>
                </div>
                <div className="p-1.5 rounded bg-white border border-[#E2E5E8]">
                  <span className="text-[#737C83] block">Evakuasi</span>
                  <span className="font-semibold text-[#245B78]">Tersedia</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons in Mockup */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to={PATHS.USER.CREATE_REPORT}
                className="p-3 rounded-xl bg-[#F5F6F7] hover:bg-[#EAECEE] border border-[#E2E5E8] flex flex-col items-center justify-center gap-1.5 text-center transition-colors"
              >
                <SendHorizontal className="w-4 h-4 text-[#245B78]" />
                <span className="font-medium text-[#202428] text-[11px]">Kirim Laporan</span>
              </Link>
              <Link
                to={PATHS.PUBLIC.WARNINGS}
                className="p-3 rounded-xl bg-[#F5F6F7] hover:bg-[#EAECEE] border border-[#E2E5E8] flex flex-col items-center justify-center gap-1.5 text-center transition-colors"
              >
                <BellRing className="w-4 h-4 text-[#8A5A13]" />
                <span className="font-medium text-[#202428] text-[11px]">Peringatan Dini</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / 3 Langkah Kesiapsiagaan (Clean, minimal, crafted) */}
      <section className="space-y-8 pt-8 border-t border-[#E2E5E8]">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#245B78] font-semibold">
            Alur Layanan Publik
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#202428] tracking-tight">
            Bagaimana SENTRAVAX Membantu Anda
          </h2>
          <p className="text-xs sm:text-sm text-[#596168] max-w-xl mx-auto">
            Dirancang sederhana agar informasi darurat dapat diakses cepat dalam kondisi apapun.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2E5E8] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF1F5] text-[#245B78] flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-base font-bold text-[#202428]">Pantau Peta Risiko</h3>
            <p className="text-xs text-[#596168] leading-relaxed">
              Buka peta interaktif terbuka untuk melihat zonasi bahaya, status cuaca, dan posko pengungsian tanpa harus membuat akun.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2E5E8] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF1F5] text-[#245B78] flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-base font-bold text-[#202428]">Tetapkan Wilayah Domisili</h3>
            <p className="text-xs text-[#596168] leading-relaxed">
              Masuk ke Portal Warga untuk mengaktifkan pemantauan radius tempat tinggal Anda dan keluarga secara otomatis.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2E5E8] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF1F5] text-[#245B78] flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-base font-bold text-[#202428]">Terima dan Bagikan Laporan</h3>
            <p className="text-xs text-[#596168] leading-relaxed">
              Dapatkan peringatan resmi sebelum bencana memuncak, serta kirim laporan lapangan terverifikasi untuk membantu sesama warga.
            </p>
          </div>
        </div>
      </section>

      {/* Four Area Navigation Matrix (Clean, elegant, purposeful) */}
      <section className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-[#202428] tracking-tight">
            Empat Area Terintegrasi dalam Satu Platform
          </h2>
          <p className="text-xs sm:text-sm text-[#596168] max-w-xl mx-auto">
            Dirancang khusus untuk warga, relawan, administrator wilayah, dan analis kebencanaan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Public */}
          <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#E2E5E8] hover:border-[#245B78] transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#EAF1F5] text-[#245B78] flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#245B78] font-semibold">Area Publik</span>
              <h3 className="text-base font-bold text-[#202428] mt-1">Website Publik</h3>
              <p className="text-xs text-[#596168] mt-2 leading-relaxed">
                Akses bebas tanpa login untuk edukasi, informasi bencana resmi, dan peta risiko masyarakat.
              </p>
            </div>
            <Link to={PATHS.PUBLIC.MAP} className="text-xs font-semibold text-[#245B78] hover:text-[#1D4B64] flex items-center gap-1">
              Jelajahi Publik <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: User */}
          <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#E2E5E8] hover:border-[#245B78] transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#EAF1F5] text-[#245B78] flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#245B78] font-semibold">Area Warga</span>
              <h3 className="text-base font-bold text-[#202428] mt-1">Portal Warga</h3>
              <p className="text-xs text-[#596168] mt-2 leading-relaxed">
                Pelaporan bencana warga, pemantauan radius tempat tinggal, dan notifikasi siaga personal.
              </p>
            </div>
            <Link to={PATHS.USER.DASHBOARD} className="text-xs font-semibold text-[#245B78] hover:text-[#1D4B64] flex items-center gap-1">
              Buka Portal Warga <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Admin */}
          <div className="p-6 rounded-xl bg-[#191919] border border-[#343434] text-[#F2F2F2] flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#222222] text-[#D2A45E] border border-[#343434] flex items-center justify-center mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#D2A45E] font-semibold">Area Konsol</span>
              <h3 className="text-base font-bold text-[#F2F2F2] mt-1">Admin Dashboard</h3>
              <p className="text-xs text-[#B8B8B8] mt-2 leading-relaxed">
                Manajemen akun pengguna, verifikasi laporan warga, data kejadian resmi, dan audit log.
              </p>
            </div>
            <Link to={PATHS.ADMIN.DASHBOARD} className="text-xs font-semibold text-[#A9C2D1] hover:text-white flex items-center gap-1">
              Akses Admin <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Intelligence */}
          <div className="p-6 rounded-xl bg-[#191919] border border-[#343434] text-[#F2F2F2] flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#222222] text-[#70A987] border border-[#343434] flex items-center justify-center mb-3">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#70A987] font-semibold">Area Komando</span>
              <h3 className="text-base font-bold text-[#F2F2F2] mt-1">Intelligence Center</h3>
              <p className="text-xs text-[#B8B8B8] mt-2 leading-relaxed">
                Analisis geospasial multi-hazard, AI proactive insight, dan diseminasi operasi peringatan dini.
              </p>
            </div>
            <Link to={PATHS.INTELLIGENCE.OVERVIEW} className="text-xs font-semibold text-[#A9C2D1] hover:text-white flex items-center gap-1">
              Buka Komando <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
