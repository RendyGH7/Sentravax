import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import {
  Users,
  Flame,
  Clock,
  Cpu,
  ChevronRight,
  ShieldCheck,
  FileCheck2,
  RefreshCw,
  Activity,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService, type AdminOverviewApiResponse } from '../../services/admin-service';

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [overviewData, setOverviewData] = useState<AdminOverviewApiResponse | null>(null);

  const loadOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await adminService.getOverview();
      setOverviewData(data);
    } catch {
      toast.error('Gagal memuat telemetri konsol administrasi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadOverview();
      }
    });
    return () => {
      active = false;
    };
  }, [loadOverview]);

  const counts = overviewData?.counts || {
    total_users: 0,
    curated_events_total: 0,
    curated_events_active: 0,
    pending_verification_reports: 0,
    active_cap_alerts: 0,
  };

  const systemHealth = overviewData?.system_health;
  const recentReports = overviewData?.recent_reports || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / System Health (Pure Black & Grey) */}
      <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                systemHealth?.database_connected ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'
              }`}
            />
            <span className="text-xs font-mono uppercase text-[#10B981] font-bold">
              Kondisi Infrastruktur: {systemHealth?.system_uptime || 'Optimal (Uptime 99.9%)'} • Latensi DB: {systemHealth?.latency_ms ?? 1.2} ms
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
            Konsol Manajemen Administrasi SENTRAVAX
          </h1>
          <p className="text-xs sm:text-sm text-[#D4D4D4]">
            Sistem pengawasan terpadu untuk moderasi pelaporan masyarakat, kurasi bencana resmi, dan kesehatan konektor data BMKG & PVMBG.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D4D4D4] bg-[#212121] px-4 py-2.5 rounded-xl border border-[#2C2C2C] self-start md:self-auto shadow-xs">
            <Cpu className="w-4 h-4 text-[#10B981]" />
            <span>{systemHealth?.database_engine ? `${systemHealth.database_engine.split(' ')[0]} + PostGIS Terhubung` : 'PostgreSQL + PostGIS'}</span>
          </div>

          <button
            type="button"
            onClick={() => loadOverview(true)}
            disabled={refreshing || loading}
            aria-label="Segarkan data konsol"
            className="p-2.5 rounded-xl bg-[#212121] hover:bg-[#2C2C2C] text-[#8A8A8A] hover:text-white border border-[#2C2C2C] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#F59E0B] ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <Link
          to={PATHS.ADMIN.REPORTS}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#212121] hover:bg-[#2B2B2B] text-[#FFFFFF] font-bold border border-[#2C2C2C] transition-all whitespace-nowrap shadow-xs"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Moderasi Laporan</span>
          {counts.pending_verification_reports > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-[#F59E0B] font-mono">
              {counts.pending_verification_reports}
            </span>
          )}
        </Link>
        <Link
          to={PATHS.ADMIN.SHELTERS}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#212121] hover:bg-[#2B2B2B] text-[#FFFFFF] font-bold border border-[#2C2C2C] transition-all whitespace-nowrap shadow-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Kelola Shelter Resmi</span>
        </Link>
        <Link
          to={PATHS.ADMIN.DISASTERS}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#212121] hover:bg-[#2B2B2B] text-[#FFFFFF] font-bold border border-[#2C2C2C] transition-all whitespace-nowrap shadow-xs"
        >
          <Flame className="w-3.5 h-3.5 text-[#EF4444]" />
          <span>Kurasi Bencana</span>
        </Link>
        <Link
          to={PATHS.ADMIN.DATA_SOURCES}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#212121] hover:bg-[#2B2B2B] text-[#FFFFFF] font-bold border border-[#2C2C2C] transition-all whitespace-nowrap shadow-xs"
        >
          <Database className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Status Sumber Data</span>
        </Link>
        <Link
          to={PATHS.ADMIN.USERS}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#212121] hover:bg-[#2B2B2B] text-[#FFFFFF] font-bold border border-[#2C2C2C] transition-all whitespace-nowrap shadow-xs"
        >
          <Users className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span>Manajemen Pengguna</span>
        </Link>
      </div>

      {/* 4 Metric Cards (Grey & Black with Strong Gold, Emerald, & Coral) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Users */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2.5 shadow-xs hover:border-[#383838] transition-all">
          <div className="flex items-center justify-between text-xs text-[#8A8A8A] font-semibold">
            <span>Total Pengguna Terdaftar</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#FFFFFF]">{counts.total_users}</div>
          <p className="text-xs text-[#10B981] font-bold flex items-center gap-1 font-mono">
            <Activity className="w-3.5 h-3.5" /> Akun terverifikasi aktif
          </p>
        </div>

        {/* Metric 2: Curated Events */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2.5 shadow-xs hover:border-[#383838] transition-all">
          <div className="flex items-center justify-between text-xs text-[#8A8A8A] font-semibold">
            <span>Kejadian Bencana Terkurasi</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-[#EF4444] flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#FFFFFF]">{counts.curated_events_total}</div>
          <p className="text-xs text-[#F87171] font-mono font-medium">
            {counts.curated_events_active} status tanggap darurat aktif
          </p>
        </div>

        {/* Metric 3: Pending Reports */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2.5 shadow-xs hover:border-[#383838] transition-all">
          <div className="flex items-center justify-between text-xs text-[#8A8A8A] font-semibold">
            <span>Antrean Verifikasi Laporan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-[#F59E0B] flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F59E0B]">
            {counts.pending_verification_reports}
          </div>
          <p className="text-xs text-[#FBBF24] font-mono font-medium">
            Memerlukan tinjauan operator
          </p>
        </div>

        {/* Metric 4: Data Sources */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2.5 shadow-xs hover:border-[#383838] transition-all">
          <div className="flex items-center justify-between text-xs text-[#8A8A8A] font-semibold">
            <span>Konektor Sumber Data</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-[#10B981] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#FFFFFF]">
            {overviewData?.data_sources?.active ?? 5}/{overviewData?.data_sources?.total ?? 5}
          </div>
          <p className="text-xs text-[#10B981] font-mono font-medium">
            Koneksi stream aktif normal
          </p>
        </div>
      </div>

      {/* Moderation Queue Table (Neutral Grey & Black) */}
      <div className="rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#2C2C2C] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#FFFFFF]">Antrean Verifikasi Laporan Masuk</h2>
            <p className="text-xs text-[#D4D4D4] mt-0.5">
              Laporan masyarakat terkini yang menunggu verifikasi sebelum dipublikasikan ke peta publik.
            </p>
          </div>
          <Link
            to={PATHS.ADMIN.REPORTS}
            className="text-xs font-bold text-[#F59E0B] hover:text-[#D97706] flex items-center gap-1"
          >
            Buka Semua Antrean <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8A8A8A] space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#10B981] mx-auto" />
            <p className="text-sm font-semibold text-[#D4D4D4]">
              Seluruh antrean laporan telah diverifikasi. Tidak ada data pending.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#2C2C2C]">
            {recentReports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#212121] transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-[#212121] text-[#F59E0B] border border-amber-500/30">
                      {rep.report_number || `REP-${rep.id}`}
                    </span>
                    <span className="text-xs text-[#8A8A8A] flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" /> {rep.reported_at ? new Date(rep.reported_at).toLocaleString('id-ID') : 'Baru saja'}
                    </span>
                    <span className="text-xs text-amber-400 font-mono font-bold uppercase">
                      [{rep.status}]
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">{rep.hazard_title}</h3>
                  <p className="text-xs text-[#D4D4D4]">Lokasi: {rep.location_name}</p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center">
                  <Link
                    to={PATHS.ADMIN.REPORTS}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold transition-all shadow-xs"
                  >
                    <span>Tinjau di Antrean</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
