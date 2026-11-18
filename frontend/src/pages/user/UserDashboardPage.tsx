import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { userService } from '../../services/user-service';
import type { UserDashboardData, CommunityReportItem, EmergencyContactItem } from '../../types';
import { 
  PlusCircle, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText,
  ChevronRight,
  PackageCheck,
  Phone,
  PhoneCall,
  ShieldAlert,
  Layers,
  RefreshCw,
  ExternalLink,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const UserDashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<UserDashboardData | null>(null);
  const [reports, setReports] = useState<CommunityReportItem[]>([]);
  const [contacts, setContacts] = useState<EmergencyContactItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [dashData, repData, contactList] = await Promise.all([
        userService.getDashboard().catch(() => null),
        userService.getReports({ per_page: 5 }).catch(() => ({ items: [] })),
        userService.getEmergencyContacts().catch(() => []),
      ]);
      setDashboard(dashData);
      setReports(repData.items || []);
      setContacts(contactList || []);
    } catch (err) {
      console.error('Failed to load user dashboard:', err);
      toast.error('Gagal memuat data dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
            <CheckCircle2 className="w-3 h-3" />
            Terverifikasi
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
            <XCircle className="w-3 h-3" />
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
            <Clock className="w-3 h-3" />
            Menunggu
          </span>
        );
    }
  };

  const readinessPercent = dashboard?.preparedness_summary?.completion_percentage ?? 0;
  const verifiedReportsCount = reports.filter((r) => r.status === 'verified').length;

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & QUICK ACTION BAR */}
      <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-mono uppercase text-[#047857] font-bold">
              PORTAL WARGA SIAGA AKTIF
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-[#6B7280]">
              {dashboard?.user?.name || 'Warga'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
            Pusat Kesiapsiagaan Mandiri
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDashboard}
            className="p-2.5 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#4B5563] text-xs font-semibold transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to={PATHS.USER.CREATE_REPORT}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-xs transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lapor Kejadian</span>
          </Link>
        </div>
      </div>

      {/* 2. EMERGENCY HOTLINE SPEED-DIAL STRIP */}
      <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#991B1B] font-bold">
          <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
          <span>Hotline Darurat 1-Klik:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { num: '117', label: 'BNPB (Bencana)' },
            { num: '115', label: 'Basarnas (SAR)' },
            { num: '118', label: 'Ambulans' },
            { num: '113', label: 'Damkar' },
            { num: '110', label: 'Polisi' },
          ].map((item) => (
            <a
              key={item.num}
              href={`tel:${item.num}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#FCA5A5] hover:bg-[#FEE2E2] text-[#991B1B] font-bold text-[11px] transition-colors shadow-2xs"
            >
              <PhoneCall className="w-3 h-3 text-[#DC2626]" />
              <span>{item.num}</span>
              <span className="hidden md:inline font-normal text-gray-600">({item.label})</span>
            </a>
          ))}
        </div>
      </div>

      {/* 3. DENSE METRIC WIDGETS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Tas Siaga Dial */}
        <Link
          to={PATHS.USER.SIAGA}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#047857] transition-all shadow-xs flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#6B7280] font-semibold">Tas Siaga (Go-Bag)</span>
            <PackageCheck className="w-4 h-4 text-[#047857]" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-[#111827]">
              {readinessPercent}%
            </div>
            <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-[#047857] h-full transition-all duration-300"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#047857] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Buka Checklist <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 2: Wilayah Dipantau */}
        <Link
          to={PATHS.USER.REGIONS}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#047857] transition-all shadow-xs flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#6B7280] font-semibold">Wilayah Pantauan</span>
            <MapPin className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="my-2 text-2xl font-extrabold text-[#111827]">
            {dashboard?.saved_regions_count ?? 0}
          </div>
          <span className="text-[11px] font-bold text-[#D97706] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Kelola Watchlist <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 3: Kontak Prioritas */}
        <Link
          to={PATHS.USER.SIAGA}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#047857] transition-all shadow-xs flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#6B7280] font-semibold">Kontak Keluarga</span>
            <Phone className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="my-2 text-2xl font-extrabold text-[#111827]">
            {contacts.length}
          </div>
          <span className="text-[11px] font-bold text-[#0284C7] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Daftar Kontak <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 4: Laporan Terverifikasi */}
        <Link
          to={PATHS.USER.REPORTS}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#047857] transition-all shadow-xs flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#6B7280] font-semibold">Laporan Terverifikasi</span>
            <FileText className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="my-2 text-2xl font-extrabold text-[#111827]">
            {verifiedReportsCount}/{reports.length}
          </div>
          <span className="text-[11px] font-bold text-[#059669] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Lihat Riwayat <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* 4. ACTIVE REGIONAL ALERTS NOTICES (IF ANY) */}
      {dashboard?.active_regional_alerts && dashboard.active_regional_alerts.length > 0 && (
        <div className="space-y-2">
          {dashboard.active_regional_alerts.map((al) => (
            <div
              key={al.id}
              className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
                <span className="font-bold text-[#92400E]">{al.title}</span>
                <span className="hidden sm:inline text-gray-500">•</span>
                <span className="hidden sm:inline text-[#78350F] truncate max-w-md">{al.message}</span>
              </div>
              <Link
                to={PATHS.PUBLIC.WARNINGS}
                className="text-xs font-bold text-[#B45309] hover:underline shrink-0"
              >
                Lihat CAP &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* 5. SPLIT SECTION: RECENT REPORTS & QUICK SPEED-DIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Recent Reports Table (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#047857]" />
              Laporan Terakhir Anda
            </h2>
            <Link
              to={PATHS.USER.REPORTS}
              className="text-xs font-bold text-[#047857] hover:text-[#065F46] flex items-center gap-1"
            >
              Semua ({reports.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-xs text-gray-400 animate-pulse">
              Memuat data laporan...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <FileText className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500">Belum ada laporan yang diajukan.</p>
              <Link
                to={PATHS.USER.CREATE_REPORT}
                className="inline-block px-3 py-1.5 rounded-lg bg-[#047857] text-white text-xs font-bold"
              >
                Kirim Laporan Pertama
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-gray-400">
                        SVX-REP-{String(r.id).padStart(5, '0')}
                      </span>
                      {getStatusBadge(r.status)}
                      {r.cluster_id && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          <Layers className="w-2.5 h-2.5" />
                          Klaster
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-[#111827] truncate">
                      {r.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 truncate">
                      {r.region?.name || 'Wilayah'} • {new Date(r.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  <Link
                    to={PATHS.USER.REPORTS}
                    className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 shrink-0"
                    title="Rincian"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Speed-Dial Contacts (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#0284C7]" />
              Speed-Dial Kontak Keluarga
            </h2>
            <Link
              to={PATHS.USER.SIAGA}
              className="text-xs font-bold text-[#0284C7] hover:underline"
            >
              Kelola
            </Link>
          </div>

          {contacts.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <Phone className="w-7 h-7 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500">Belum ada kontak darurat keluarga.</p>
              <Link
                to={PATHS.USER.SIAGA}
                className="inline-block px-3 py-1.5 rounded-lg bg-[#0284C7] text-white text-xs font-bold"
              >
                Tambah Kontak
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{c.name}</h4>
                    <span className="text-[11px] text-gray-500">
                      {c.relationship} • {c.phone_number}
                    </span>
                  </div>
                  <a
                    href={`tel:${c.phone_number}`}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors"
                    title={`Panggil ${c.name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
