import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  X,
  FileCheck,
  Database,
  Home,
  User,
  Calendar,
  Layers,
} from 'lucide-react';
import { adminService, type AdminAuditLogItem } from '../../services/admin-service';
import { toast } from 'sonner';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchTerm.trim() || undefined,
        per_page: 50,
      });
      setLogs(res.items);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      toast.error('Gagal memuat log audit sistem.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchTerm]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Derived statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const verifications = logs.filter((l) => l.category === 'REPORT_VERIFICATION').length;
    const syncs = logs.filter((l) => l.category === 'DATA_SOURCE_SYNC').length;
    const shelters = logs.filter((l) => l.category === 'SHELTER_REGISTRY').length;
    return { total, verifications, syncs, shelters };
  }, [logs]);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'REPORT_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileCheck className="w-3 h-3" />
            VERIFIKASI
          </span>
        );
      case 'DATA_SOURCE_SYNC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Database className="w-3 h-3" />
            TELEMETRI SYNC
          </span>
        );
      case 'SHELTER_REGISTRY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Home className="w-3 h-3" />
            SHELTER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
            {cat}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#047857]" />
            Jejak Audit & Akuntabilitas Sistem
          </h1>
          <p className="text-xs text-[#4B5563] mt-1">
            Rekam jejak tidak dapat diubah (immutable audit trail) atas verifikasi laporan, sinkronisasi sensor telemetri, dan mutasi data posko.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadLogs}
            className="p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl transition-colors border border-[#E5E7EB]"
            title="Muat ulang data"
            aria-label="Muat ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Total Log Terekam</span>
            <Layers className="w-4 h-4 text-[#4B5563]" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.total}</p>
          <span className="text-[10px] text-[#9CA3AF]">Aktivitas sistem</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Verifikasi Laporan</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.verifications}</p>
          <span className="text-[10px] text-emerald-600">Oleh analis intelijen/admin</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Sinkronisasi Telemetri</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.syncs}</p>
          <span className="text-[10px] text-blue-600">Eksternal data ingestion</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Mutasi Shelter</span>
            <Home className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.shelters}</p>
          <span className="text-[10px] text-purple-600">Perubahan fasilitas posko</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari target, tindakan, aktor, catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#047857]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="audit-cat-filter" className="text-xs text-[#6B7280] font-medium whitespace-nowrap">
            Kategori Log:
          </label>
          <select
            id="audit-cat-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-[#D1D5DB] py-1.5 px-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#047857]"
          >
            <option value="all">Semua Kategori</option>
            <option value="verification">Verifikasi Laporan Warga</option>
            <option value="sync">Sinkronisasi Data Telemetri</option>
            <option value="shelter">Registry Shelter Posko</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#047857]" />
            <p className="text-xs text-[#6B7280]">Memuat jejak audit sistem...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <p className="text-sm font-semibold text-[#111827]">Tidak Ada Log Audit</p>
            <p className="text-xs text-[#6B7280]">Sesuaikan kata kunci pencarian atau filter kategori Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Aktor Pelaksana</th>
                  <th className="py-3 px-4">Aksi / Perubahan</th>
                  <th className="py-3 px-4">Target Objek</th>
                  <th className="py-3 px-4">Waktu Eksekusi</th>
                  <th className="py-3 px-4 text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4">{getCategoryBadge(log.category)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-[#111827]">
                        <User className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>{log.actor.name}</span>
                      </div>
                      <span className="text-[10px] text-[#6B7280] uppercase font-mono">{log.actor.role}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#374151] max-w-xs">
                      <div className="truncate">{log.action}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#4B5563] max-w-xs">
                      <div className="truncate">{log.target}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-[#9CA3AF]" />
                        {new Date(log.timestamp).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg text-[#047857] hover:bg-[#ECFDF5] transition-colors"
                        title="Lihat Rincian Log"
                        aria-label="Rincian log"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Log Detail Inspection */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#047857]">LOG #{selectedLog.id}</span>
                <h2 className="text-base font-bold text-[#111827] mt-0.5">Rincian Catatan Audit</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Kategori</span>
                  <div className="mt-0.5">{getCategoryBadge(selectedLog.category)}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Aktor</span>
                  <span className="font-bold text-[#111827]">
                    {selectedLog.actor.name} ({selectedLog.actor.role})
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#374151] block mb-0.5">Tindakan Dilakukan</label>
                <p className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] font-mono text-[11px] text-[#111827]">
                  {selectedLog.action}
                </p>
              </div>

              <div>
                <label className="font-semibold text-[#374151] block mb-0.5">Target Objek</label>
                <p className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[#374151]">
                  {selectedLog.target}
                </p>
              </div>

              {selectedLog.notes && (
                <div>
                  <label className="font-semibold text-[#374151] block mb-0.5">Catatan / Parameter Perubahan</label>
                  <p className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 font-mono text-[11px] leading-relaxed break-words">
                    {selectedLog.notes}
                  </p>
                </div>
              )}

              <div className="text-[11px] text-[#6B7280] pt-1">
                <span className="font-medium text-[#374151]">Stempel Waktu Server:</span>{' '}
                {new Date(selectedLog.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#F3F4F6] text-[#374151] text-xs font-semibold hover:bg-[#E5E7EB] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
