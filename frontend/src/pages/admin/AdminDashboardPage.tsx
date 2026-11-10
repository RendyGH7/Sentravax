import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { 
  Users, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  ChevronRight,
  ShieldCheck,
  FileCheck2,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminDashboardPage: React.FC = () => {
  const [reports, setReports] = useState([
    {
      id: 'REP-104',
      type: 'Banjir Luapan Sungai',
      location: 'Kel. Rawa Terate, Cakung, Jakarta Timur',
      time: '12 menit lalu',
      reporter: 'Budi Santoso',
      status: 'pending',
    },
    {
      id: 'REP-105',
      type: 'Pohon Tumbang dan Kabel Putus',
      location: 'Jl. Pemuda No. 45, Rawamangun',
      time: '28 menit lalu',
      reporter: 'Siti Rahma',
      status: 'pending',
    },
  ]);

  const handleVerify = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success(`Laporan ${id} berhasil diverifikasi dan dipublikasikan ke peta.`);
  };

  const handleReject = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.info(`Laporan ${id} ditolak sebagai data tidak valid.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / System Health (Pure Black & Grey) */}
      <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="text-xs font-mono uppercase text-[#10B981] font-bold">
              Kondisi Infrastruktur: Optimal (Uptime 99.8%)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
            Konsol Manajemen Administrasi SENTRAVAX
          </h1>
          <p className="text-xs sm:text-sm text-[#D4D4D4]">
            Sistem pengawasan terpadu untuk moderasi pelaporan masyarakat, kurasi bencana resmi, dan kesehatan konektor data BMKG.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#D4D4D4] bg-[#212121] px-4 py-2.5 rounded-xl border border-[#2C2C2C] self-start md:self-auto shadow-xs">
          <Cpu className="w-4 h-4 text-[#10B981]" />
          <span>PostgreSQL 18 + PostGIS Terhubung</span>
        </div>
      </div>

      {/* 4 Metric Cards (Grey & Black with Strong Gold, Emerald, & Coral - ZERO BLUE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2.5 shadow-xs hover:border-[#383838] transition-all">
          <div className="flex items-center justify-between text-xs text-[#8A8A8A] font-semibold">
            <span>Total Pengguna Terdaftar</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#FFFFFF]">18.642</div>
          <p className="text-xs text-[#10B981] font-bold flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" /> +8.4% bulan ini
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2.5 shadow-xs hover:border-[#383838] transition-all">
          <div className="flex items-center justify-between text-xs text-[#8A8A8A] font-semibold">
            <span>Kejadian Bencana Terkurasi</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-[#EF4444] flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#FFFFFF]">14</div>
          <p className="text-xs text-[#F87171] font-mono font-medium">
            3 status tanggap darurat aktif
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2.5 shadow-xs hover:border-[#383838] transition-all">
          <div className="flex items-center justify-between text-xs text-[#8A8A8A] font-semibold">
            <span>Antrean Verifikasi Laporan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-[#F59E0B] flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F59E0B]">{reports.length}</div>
          <p className="text-xs text-[#FBBF24] font-mono font-medium">
            Memerlukan tinjauan operator
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2.5 shadow-xs hover:border-[#383838] transition-all">
          <div className="flex items-center justify-between text-xs text-[#8A8A8A] font-semibold">
            <span>Peringatan Dini Sistem</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-[#10B981] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#FFFFFF]">3</div>
          <p className="text-xs text-[#10B981] font-mono font-medium">
            Diseminasi CAP terdistribusi
          </p>
        </div>
      </div>

      {/* Moderation Queue Table (Neutral Grey & Black) */}
      <div className="rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#2C2C2C] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#FFFFFF]">Antrean Verifikasi Laporan Masuk</h2>
            <p className="text-xs text-[#D4D4D4] mt-0.5">
              Laporan warga sebelum dipublikasikan ke peta publik dan diolah ke dalam risk engine.
            </p>
          </div>
          <Link
            to={PATHS.ADMIN.REPORTS}
            className="text-xs font-bold text-[#F59E0B] hover:text-[#D97706] flex items-center gap-1"
          >
            Buka Semua Antrean <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8A8A8A] space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#10B981] mx-auto" />
            <p className="text-sm font-semibold text-[#D4D4D4]">Seluruh antrean laporan telah diverifikasi. Tidak ada data pending.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2C2C2C]">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#212121] transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-[#212121] text-[#F59E0B] border border-amber-500/30">
                      {rep.id}
                    </span>
                    <span className="text-xs text-[#8A8A8A] flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" /> {rep.time}
                    </span>
                    <span className="text-xs text-[#D4D4D4] font-mono">oleh {rep.reporter}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">{rep.type}</h3>
                  <p className="text-xs text-[#D4D4D4]">Lokasi: {rep.location}</p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleVerify(rep.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(rep.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-[#FDA4AF] border border-rose-500/40 text-xs font-bold transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
