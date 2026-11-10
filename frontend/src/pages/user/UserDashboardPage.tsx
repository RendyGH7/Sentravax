import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { 
  PlusCircle, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText,
  ChevronRight
} from 'lucide-react';

export const UserDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Welcome & Alert Banner */}
      <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="text-xs font-mono uppercase text-[#047857] font-bold">
              Kondisi Wilayah Pantauan: Aman
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
            Selamat Datang di Portal Warga
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563]">
            Wilayah utama terdaftar: Tanjung Priok, Jakarta Utara (Radius 5 km). Tidak ada anomali cuaca ekstrem terdeteksi saat ini.
          </p>
        </div>

        <Link
          to={PATHS.USER.CREATE_REPORT}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-xs transition-all shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Laporan Baru</span>
        </Link>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-2 shadow-xs hover:border-[#A7F3D0] transition-all">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>Laporan Diajukan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#047857] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#111827]">2</div>
          <p className="text-xs text-[#047857] flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> 1 Terverifikasi BPBD
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-2 shadow-xs hover:border-[#A7F3D0] transition-all">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>Wilayah Dipantau</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#047857] flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#111827]">1</div>
          <p className="text-xs text-[#6B7280]">
            Radius aktif 5 km dari koordinat rumah
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-2 shadow-xs hover:border-[#FED7AA] transition-all">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>Peringatan Darurat Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#111827]">0</div>
          <p className="text-xs text-[#6B7280]">
            Tidak ada instruksi evakuasi aktif
          </p>
        </div>
      </div>

      {/* Recent Reports Table / List */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Riwayat Laporan Terakhir Anda</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Laporan masyarakat diverifikasi oleh petugas posko sebelum ditampilkan di peta publik.
            </p>
          </div>
          <Link
            to={PATHS.USER.REPORTS}
            className="text-xs font-bold text-[#047857] hover:text-[#065F46] flex items-center gap-1"
          >
            Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-[#E5E7EB]">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB] transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                  Genangan Air
                </span>
                <span className="text-xs text-[#6B7280] flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" /> Kemarin, 16.40 WIB
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#111827]">
                Genangan air setinggi 20 cm di Jl. Enggano akibat hujan deras
              </h3>
              <p className="text-xs text-[#4B5563]">
                Lokasi: Tanjung Priok, Jakarta Utara. Air berangsur surut dalam 45 menit.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Terverifikasi
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB] transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                  Pohon Tumbang
                </span>
                <span className="text-xs text-[#6B7280] flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" /> 04 Nov 2026, 09.15 WIB
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#111827]">
                Pohon peneduh tumbang menghalangi sebagian badan jalan
              </h3>
              <p className="text-xs text-[#4B5563]">
                Lokasi: Jl. Swasembada Barat, Jakarta Utara. Petugas PPSU telah menangani pembersihan.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Selesai Ditangani
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
