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
  FileCheck2
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
      {/* Top Banner / System Health (Based on Aether Analytics Reference) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#191919] border border-[#343434] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#70A987]"></span>
            <span className="text-xs font-mono uppercase text-[#70A987] font-semibold">
              Kondisi Infrastruktur: Optimal (Uptime 99.8%)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F2F2F2] tracking-tight">
            Konsol Manajemen Administrasi SENTRAVAX
          </h1>
          <p className="text-xs sm:text-sm text-[#B8B8B8]">
            Sistem pengawasan terpadu untuk moderasi pelaporan masyarakat, kurasi bencana resmi, dan kesehatan konektor data BMKG.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#B8B8B8] bg-[#222222] px-3.5 py-2 rounded-xl border border-[#343434] self-start md:self-auto">
          <Cpu className="w-4 h-4 text-[#70A987]" />
          <span>PostgreSQL 18 + PostGIS Terhubung</span>
        </div>
      </div>

      {/* 4 Metric Cards (Inspired by RevenuePulse AI / Aether Analytics reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl bg-[#191919] border border-[#343434] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#929292]">
            <span>Total Pengguna Terdaftar</span>
            <Users className="w-4 h-4 text-[#A9C2D1]" />
          </div>
          <div className="text-2xl font-bold text-[#F2F2F2]">18.642</div>
          <p className="text-[11px] text-[#70A987] font-mono">
            +8.4% peningkatan bulan ini
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl bg-[#191919] border border-[#343434] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#929292]">
            <span>Kejadian Bencana Terkurasi</span>
            <Flame className="w-4 h-4 text-[#D47A74]" />
          </div>
          <div className="text-2xl font-bold text-[#F2F2F2]">14</div>
          <p className="text-[11px] text-[#B8B8B8] font-mono">
            3 status tanggap darurat aktif
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl bg-[#191919] border border-[#343434] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#929292]">
            <span>Antrean Verifikasi Laporan</span>
            <FileCheck2 className="w-4 h-4 text-[#D2A45E]" />
          </div>
          <div className="text-2xl font-bold text-[#F2F2F2]">{reports.length}</div>
          <p className="text-[11px] text-[#D2A45E] font-mono">
            Memerlukan tinjauan operator
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl bg-[#191919] border border-[#343434] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#929292]">
            <span>Peringatan Dini Sistem</span>
            <AlertTriangle className="w-4 h-4 text-[#8BAFC8]" />
          </div>
          <div className="text-2xl font-bold text-[#F2F2F2]">3</div>
          <p className="text-[11px] text-[#70A987] font-mono">
            Diseminasi CAP terdistribusi
          </p>
        </div>
      </div>

      {/* Moderation Queue Table */}
      <div className="rounded-2xl bg-[#191919] border border-[#343434] overflow-hidden">
        <div className="p-5 border-b border-[#343434] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#F2F2F2]">Antrean Verifikasi Laporan Masuk</h2>
            <p className="text-xs text-[#B8B8B8] mt-0.5">
              Laporan warga sebelum dipublikasikan ke peta publik dan diolah ke dalam risk engine.
            </p>
          </div>
          <Link
            to={PATHS.ADMIN.REPORTS}
            className="text-xs font-semibold text-[#A9C2D1] hover:text-white flex items-center gap-1"
          >
            Buka Semua Antrean <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#929292] space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#70A987] mx-auto" />
            <p>Seluruh antrean laporan telah diverifikasi. Tidak ada data pending.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#343434]">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#222222] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#222222] text-[#A9C2D1] border border-[#343434]">
                      {rep.id}
                    </span>
                    <span className="text-xs text-[#929292] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {rep.time}
                    </span>
                    <span className="text-xs text-[#B8B8B8] font-mono">oleh {rep.reporter}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#F2F2F2]">{rep.type}</h3>
                  <p className="text-xs text-[#B8B8B8]">Lokasi: {rep.location}</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleVerify(rep.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#28734D] hover:bg-[#205C3E] text-white text-xs font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Setujui</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(rep.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] text-[#D47A74] border border-[#343434] text-xs font-medium transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
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
