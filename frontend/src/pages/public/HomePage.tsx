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
      {/* Hero Section (Replaced generic blue with strong, grounded Forest Emerald & Terracotta) */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4 sm:pt-8">
        {/* Soft natural ambient background without blue tint */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-50/70 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-amber-50/60 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Left Column: Typography & CTAs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
            <span>Platform Intelijen Bencana dan Kesiapsiagaan Mandiri</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111827] leading-[1.12]">
              Tetap Tenang.
              <span className="block text-[#047857]">Tetap Siaga.</span>
              <span className="block text-[#C2410C]">Tanggap Bersama SENTRAVAX.</span>
            </h1>
          </div>

          <div className="space-y-2 pt-1">
            <h2 className="text-base sm:text-lg font-bold text-[#111827]">
              Prediksi Risiko Bencana. Laporkan Kejadian Nyata.
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed max-w-xl font-normal">
              Integrasi analisis spasial multi-hazard dan pelaporan partisipatif masyarakat untuk menjaga keselamatan warga, keluarga, dan ketangguhan komunitas di seluruh Nusantara.
            </p>
          </div>

          {/* Feature Tag Pills (Strong organic tones, zero AI-slop blue) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857]">
              <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
              Analisis Prediktif Spasial
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FFF7ED] border border-[#FED7AA] text-[#C2410C]">
              <span className="w-2 h-2 rounded-full bg-[#C2410C]"></span>
              Pelaporan Warga Real-Time
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FEFCE8] border border-[#FEF08A] text-[#A16207]">
              <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
              Peringatan Dini Multi-Hazard
            </span>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-3">
            <Link
              to={PATHS.USER.CREATE_REPORT}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-sm transition-all shadow-sm active:scale-98"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>Laporkan Kejadian</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              to={PATHS.PUBLIC.MAP}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F3F4F6] text-[#111827] border border-[#D1D5DB] font-bold text-sm transition-all shadow-xs"
            >
              <Map className="w-4 h-4 text-[#047857]" />
              <span>Buka Peta Risiko</span>
            </Link>
          </div>

          {/* Real-Time Monitoring Pill */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs">
              <div className="flex -space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#047857] border-2 border-white"></span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#C2410C] border-2 border-white"></span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#D97706] border-2 border-white"></span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#111827] block">Pemantauan Geospasial Aktif</span>
                <span className="text-[#6B7280] text-[11px] font-medium">Terhubung ke 38 provinsi di Indonesia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean App Preview Mockup */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-sm rounded-3xl bg-[#FFFFFF] border border-[#D1D5DB] p-5 shadow-lg space-y-4">
            {/* Phone Top Header */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#047857] text-white flex items-center justify-center font-bold shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-[#111827]">SENTRAVAX Mobile</span>
              </div>
              <span className="text-[10px] font-mono text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full font-bold">
                TERVERIFIKASI
              </span>
            </div>

            {/* Mockup Map Area */}
            <div className="rounded-2xl bg-gradient-to-b from-[#ECFDF5] to-[#FFFFFF] border border-[#A7F3D0] p-5 text-center space-y-3 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-[#047857] text-white flex items-center justify-center mx-auto shadow-sm">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">Status Wilayah Anda: Aman</h3>
                <p className="text-[11px] text-[#4B5563] mt-1 leading-relaxed">
                  Radius pantau 5 km, tidak ada indikasi anomali curah hujan ekstrem atau deformasi tanah.
                </p>
              </div>

              {/* Quick Status Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#A7F3D0] text-[10px] font-mono">
                <div className="p-2 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
                  <span className="text-[#6B7280] block font-semibold">BMKG</span>
                  <span className="font-bold text-[#047857]">Normal</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
                  <span className="text-[#6B7280] block font-semibold">Sungai</span>
                  <span className="font-bold text-[#047857]">Stabil</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
                  <span className="text-[#6B7280] block font-semibold">Posko</span>
                  <span className="font-bold text-[#C2410C]">Siaga</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons in Mockup */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to={PATHS.USER.CREATE_REPORT}
                className="p-3.5 rounded-xl bg-[#F9FAFB] hover:bg-[#ECFDF5] border border-[#E5E7EB] hover:border-[#A7F3D0] flex flex-col items-center justify-center gap-1.5 text-center transition-all group"
              >
                <SendHorizontal className="w-4 h-4 text-[#047857] group-hover:scale-110 transition-transform" />
                <span className="font-bold text-[#111827] text-[11px]">Kirim Laporan</span>
              </Link>
              <Link
                to={PATHS.PUBLIC.WARNINGS}
                className="p-3.5 rounded-xl bg-[#F9FAFB] hover:bg-[#FFF7ED] border border-[#E5E7EB] hover:border-[#FED7AA] flex flex-col items-center justify-center gap-1.5 text-center transition-all group"
              >
                <BellRing className="w-4 h-4 text-[#C2410C] group-hover:scale-110 transition-transform" />
                <span className="font-bold text-[#111827] text-[11px]">Peringatan Dini</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / 3 Langkah Kesiapsiagaan */}
      <section className="space-y-8 pt-8 border-t border-[#E5E7EB]">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#047857] font-bold">
            Alur Layanan Publik
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Bagaimana SENTRAVAX Membantu Anda
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] max-w-xl mx-auto font-normal">
            Dirancang sederhana agar informasi darurat dapat diakses cepat dalam kondisi apapun.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs hover:border-[#A7F3D0] transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#047857] flex items-center justify-center font-extrabold text-sm border border-[#A7F3D0]">
              1
            </div>
            <h3 className="text-base font-bold text-[#111827]">Pantau Peta Risiko</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Buka peta interaktif terbuka untuk melihat zonasi bahaya, status cuaca, dan posko pengungsian tanpa harus membuat akun.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs hover:border-[#FED7AA] transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center font-extrabold text-sm border border-[#FED7AA]">
              2
            </div>
            <h3 className="text-base font-bold text-[#111827]">Tetapkan Wilayah Domisili</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Masuk ke Portal Warga untuk mengaktifkan pemantauan radius tempat tinggal Anda dan keluarga secara otomatis.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs hover:border-[#FEF08A] transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEFCE8] text-[#A16207] flex items-center justify-center font-extrabold text-sm border border-[#FEF08A]">
              3
            </div>
            <h3 className="text-base font-bold text-[#111827]">Terima dan Bagikan Laporan</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Dapatkan peringatan resmi sebelum bencana memuncak, serta kirim laporan lapangan terverifikasi untuk membantu sesama warga.
            </p>
          </div>
        </div>
      </section>

      {/* Four Area Navigation Matrix (Zero blue!) */}
      <section className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
            Empat Area Terintegrasi dalam Satu Platform
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] max-w-xl mx-auto">
            Dirancang khusus untuk warga, relawan, administrator wilayah, dan analis kebencanaan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Public */}
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#047857] transition-all flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#047857] font-bold">Area Publik</span>
              <h3 className="text-base font-bold text-[#111827] mt-1">Website Publik</h3>
              <p className="text-xs text-[#4B5563] mt-2 leading-relaxed">
                Akses bebas tanpa login untuk edukasi, informasi bencana resmi, dan peta risiko masyarakat.
              </p>
            </div>
            <Link to={PATHS.PUBLIC.MAP} className="text-xs font-bold text-[#047857] hover:text-[#065F46] flex items-center gap-1">
              Jelajahi Publik <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: User */}
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#C2410C] transition-all flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#C2410C] font-bold">Area Warga</span>
              <h3 className="text-base font-bold text-[#111827] mt-1">Portal Warga</h3>
              <p className="text-xs text-[#4B5563] mt-2 leading-relaxed">
                Pelaporan bencana warga, pemantauan radius tempat tinggal, dan notifikasi siaga personal.
              </p>
            </div>
            <Link to={PATHS.USER.DASHBOARD} className="text-xs font-bold text-[#C2410C] hover:text-[#9A3412] flex items-center gap-1">
              Buka Portal Warga <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Admin */}
          <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-[#F5F5F5] flex flex-col justify-between space-y-4 shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#212121] text-[#F59E0B] border border-[#383838] flex items-center justify-center mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#F59E0B] font-bold">Area Konsol</span>
              <h3 className="text-base font-bold text-[#F5F5F5] mt-1">Admin Dashboard</h3>
              <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">
                Manajemen akun pengguna, verifikasi laporan warga, data kejadian resmi, dan audit log.
              </p>
            </div>
            <Link to={PATHS.ADMIN.DASHBOARD} className="text-xs font-bold text-[#F59E0B] hover:text-[#D97706] flex items-center gap-1">
              Akses Admin <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Intelligence */}
          <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-[#F5F5F5] flex flex-col justify-between space-y-4 shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#212121] text-[#10B981] border border-[#383838] flex items-center justify-center mb-3">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#10B981] font-bold">Area Komando</span>
              <h3 className="text-base font-bold text-[#F5F5F5] mt-1">Intelligence Center</h3>
              <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">
                Analisis geospasial multi-hazard, AI proactive insight, dan diseminasi operasi peringatan dini.
              </p>
            </div>
            <Link to={PATHS.INTELLIGENCE.OVERVIEW} className="text-xs font-bold text-[#10B981] hover:text-[#059669] flex items-center gap-1">
              Buka Komando <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
