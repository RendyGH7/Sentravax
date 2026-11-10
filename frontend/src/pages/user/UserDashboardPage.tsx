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
      <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2E5E8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#28734D]"></span>
            <span className="text-xs font-mono uppercase text-[#28734D] font-semibold">
              Kondisi Wilayah Pantauan: Aman
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#202428] tracking-tight">
            Selamat Datang di Portal Warga
          </h1>
          <p className="text-xs sm:text-sm text-[#596168]">
            Wilayah utama terdaftar: Tanjung Priok, Jakarta Utara (Radius 5 km). Tidak ada anomali cuaca ekstrem terdeteksi saat ini.
          </p>
        </div>

        <Link
          to={PATHS.USER.CREATE_REPORT}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#245B78] hover:bg-[#1D4B64] text-white font-semibold text-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Laporan Baru</span>
        </Link>
      </div>

      {/* Metric Highlights (Real structure, clean light cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E2E5E8] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#596168]">
            <span>Laporan Diajukan</span>
            <FileText className="w-4 h-4 text-[#245B78]" />
          </div>
          <div className="text-2xl font-bold text-[#202428]">2</div>
          <p className="text-[11px] text-[#28734D] flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> 1 Terverifikasi BPBD
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E2E5E8] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#596168]">
            <span>Wilayah Dipantau</span>
            <MapPin className="w-4 h-4 text-[#245B78]" />
          </div>
          <div className="text-2xl font-bold text-[#202428]">1</div>
          <p className="text-[11px] text-[#596168]">
            Radius aktif 5 km dari koordinat rumah
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E2E5E8] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#596168]">
            <span>Peringatan Darurat Aktif</span>
            <AlertCircle className="w-4 h-4 text-[#8A5A13]" />
          </div>
          <div className="text-2xl font-bold text-[#202428]">0</div>
          <p className="text-[11px] text-[#596168]">
            Tidak ada instruksi evakuasi aktif
          </p>
        </div>
      </div>

      {/* Recent Reports Table / List */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2E5E8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E5E8] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#202428]">Riwayat Laporan Terakhir Anda</h2>
            <p className="text-xs text-[#596168] mt-0.5">
              Laporan masyarakat diverifikasi oleh petugas posko sebelum ditampilkan di peta publik.
            </p>
          </div>
          <Link
            to={PATHS.USER.REPORTS}
            className="text-xs font-semibold text-[#245B78] hover:text-[#1D4B64] flex items-center gap-1"
          >
            Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-[#E2E5E8]">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F5F6F7] transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EAF1F5] text-[#245B78]">
                  Genangan Air
                </span>
                <span className="text-xs text-[#737C83] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Kemarin, 16.40 WIB
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#202428]">
                Genangan air setinggi 20 cm di Jl. Enggano akibat hujan deras
              </h3>
              <p className="text-xs text-[#596168]">
                Lokasi: Tanjung Priok, Jakarta Utara. Air berangsur surut dalam 45 menit.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EAF5EF] text-[#28734D] border border-[#C2E2D0]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Terverifikasi
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F5F6F7] transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5F6F7] text-[#596168]">
                  Pohon Tumbang
                </span>
                <span className="text-xs text-[#737C83] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 04 Nov 2026, 09.15 WIB
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#202428]">
                Pohon peneduh tumbang menghalangi sebagian badan jalan
              </h3>
              <p className="text-xs text-[#596168]">
                Lokasi: Jl. Swasembada Barat, Jakarta Utara. Petugas PPSU telah menangani pembersihan.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EAF5EF] text-[#28734D] border border-[#C2E2D0]">
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
