import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLatestRequest, isRequestCanceled } from '../../hooks/useLatestRequest';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Eye,
  X,
  Layers,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { adminService, type AdminReportItem } from '../../services/admin-service';
import { publicService } from '../../services/public-service';
import type { HazardTypeItem } from '../../types';
import { toast } from 'sonner';

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [paginationMeta, setPaginationMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Inspect Modal State
  const [inspectedReport, setInspectedReport] = useState<AdminReportItem | null>(null);

  // Verification Modal State
  const [verifyingReport, setVerifyingReport] = useState<AdminReportItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<'verified' | 'rejected' | 'investigation'>('verified');
  const [verifierNotes, setVerifierNotes] = useState<string>('');
  const [submittingVerify, setSubmittingVerify] = useState<boolean>(false);

  // Delete Modal State
  const [deletingReport, setDeletingReport] = useState<AdminReportItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);

  const { beginRequest } = useLatestRequest();

  const loadData = useCallback(async () => {
    const req = beginRequest();
    try {
      setLoading(true);
      const [reportsRes, hazardsRes] = await Promise.all([
        adminService.getReports({
          status: statusFilter === 'all' ? undefined : statusFilter,
          hazard_type_id: hazardFilter === 'all' ? undefined : Number(hazardFilter),
          per_page: 50,
        }, req.signal),
        publicService.getHazardTypes(req.signal),
      ]);
      if (!req.isCurrent()) return;
      setReports(reportsRes.items);
      setPaginationMeta(reportsRes.meta);
      setHazardTypes(hazardsRes);
    } catch (err: any) {
      if (!req.isCurrent() || isRequestCanceled(err)) return;
      console.error('Failed to load moderation reports:', err);
      toast.error('Gagal memuat daftar laporan warga.');
    } finally {
      if (req.isCurrent()) {
        setLoading(false);
      }
    }
  }, [beginRequest, statusFilter, hazardFilter]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadData();
      }
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  // Derived moderation statistics
  const stats = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((r) => r.status === 'pending').length;
    const verified = reports.filter((r) => r.status === 'verified').length;
    const rejected = reports.filter((r) => r.status === 'rejected').length;
    return { total, pending, verified, rejected };
  }, [reports]);

  // Filtered reports by search term
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    const term = searchTerm.toLowerCase();
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.region?.name.toLowerCase().includes(term) ||
        r.hazard_type?.name.toLowerCase().includes(term) ||
        (r.cluster_id && r.cluster_id.toLowerCase().includes(term))
    );
  }, [reports, searchTerm]);

  // Handle Verify/Reject Action
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingReport) return;

    try {
      setSubmittingVerify(true);
      await adminService.verifyReport(verifyingReport.id, {
        status: targetStatus,
        notes: verifierNotes.trim() || undefined,
      });
      toast.success(`Laporan #${verifyingReport.id} berhasil ditandai sebagai [${targetStatus.toUpperCase()}].`);
      setVerifyingReport(null);
      setVerifierNotes('');
      loadData();
    } catch (err: any) {
      console.error('Failed to verify report:', err);
      toast.error(err.response?.data?.message || 'Gagal memverifikasi laporan.');
    } finally {
      setSubmittingVerify(false);
    }
  };

  // Handle Delete Report Action
  const handleDeleteSubmit = async () => {
    if (!deletingReport) return;

    try {
      setSubmittingDelete(true);
      await adminService.deleteReport(deletingReport.id);
      toast.success(`Laporan #${deletingReport.id} berhasil dihapus.`);
      setDeletingReport(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      toast.error(err.response?.data?.message || 'Gagal menghapus laporan.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            TERVERIFIKASI
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            DITOLAK
          </span>
        );
      case 'investigation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            INVESTIGASI
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            MENUNGGU
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
            <FileText className="w-6 h-6 text-[#047857]" />
            Moderasi & Kurasi Laporan Warga
          </h1>
          <p className="text-xs text-[#4B5563] mt-1">
            Validasi faktual laporan kejadian bencana masuk dari masyarakat, filter spam, dan sinkronkan dengan layer spasial resmi.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
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
            <span className="text-xs font-semibold text-[#6B7280]">Total Laporan</span>
            <FileText className="w-4 h-4 text-[#4B5563]" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.total}</p>
          <span className="text-[10px] text-[#9CA3AF]">Semua laporan warga</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Menunggu Verifikasi</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.pending}</p>
          <span className="text-[10px] text-blue-600">Perlu tindak lanjut</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Terverifikasi</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.verified}</p>
          <span className="text-[10px] text-emerald-600">Aktif di layer spasial</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Ditolak / Hoaks</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.rejected}</p>
          <span className="text-[10px] text-rose-600">Disaring dari publik</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul, wilayah, klaster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#047857]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-[#D1D5DB] py-1.5 px-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#047857]"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu (Pending)</option>
            <option value="verified">Terverifikasi (Verified)</option>
            <option value="investigation">Investigasi</option>
            <option value="rejected">Ditolak (Rejected)</option>
          </select>

          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
            className="text-xs rounded-lg border border-[#D1D5DB] py-1.5 px-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#047857]"
          >
            <option value="all">Semua Jenis Bahaya</option>
            {hazardTypes.map((ht) => (
              <option key={ht.id} value={ht.id}>
                {ht.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#047857]" />
            <p className="text-xs text-[#6B7280]">Memuat daftar moderasi laporan...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <p className="text-sm font-semibold text-[#111827]">Tidak Ada Laporan</p>
            <p className="text-xs text-[#6B7280]">Tidak ada laporan warga yang cocok dengan kriteria filter Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Laporan & Wilayah</th>
                  <th className="py-3 px-4">Jenis Bahaya</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Klaster AI</th>
                  <th className="py-3 px-4">Pelapor & Waktu</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-[#111827] line-clamp-1">{r.title}</div>
                      <div className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#9CA3AF] shrink-0" />
                        <span className="truncate">{r.region?.name || 'Koordinat Lapangan'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#374151]">{r.hazard_type?.name || 'Umum'}</span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                    <td className="py-3.5 px-4">
                      {r.cluster_id ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                          <Layers className="w-3 h-3" />
                          {r.cluster_id}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#9CA3AF] italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      <div className="flex items-center gap-1 text-[11px] text-[#374151]">
                        <User className="w-3 h-3 text-[#9CA3AF]" />
                        <span>{r.user?.name || 'Warga (Guest)'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF] mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectedReport(r)}
                          className="p-1.5 rounded-lg text-[#4B5563] hover:bg-[#F3F4F6] transition-colors"
                          title="Lihat Detail Laporan"
                          aria-label="Detail laporan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyingReport(r);
                            setTargetStatus(r.status === 'pending' ? 'verified' : (r.status as any));
                            setVerifierNotes('');
                          }}
                          className="p-1.5 rounded-lg text-[#047857] hover:bg-[#ECFDF5] transition-colors"
                          title="Verifikasi / Cek Status"
                          aria-label="Verifikasi laporan"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingReport(r)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Laporan"
                          aria-label="Hapus laporan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {reports.length > 0 && (
          <div className="p-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Menampilkan {filteredReports.length} dari {paginationMeta.total} laporan</span>
            <span>Halaman {paginationMeta.current_page} dari {paginationMeta.last_page}</span>
          </div>
        )}
      </div>

      {/* MODAL 1: Inspect Report Details */}
      {inspectedReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#047857]">
                  KODE: SVX-REP-{String(inspectedReport.id).padStart(5, '0')}
                </span>
                <h2 className="text-base font-bold text-[#111827] mt-0.5">{inspectedReport.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectedReport(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Status Laporan</span>
                  <div className="mt-0.5">{getStatusBadge(inspectedReport.status)}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Jenis Bahaya</span>
                  <span className="font-bold text-[#111827]">{inspectedReport.hazard_type?.name || 'Umum'}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Wilayah</span>
                  <span className="font-bold text-[#111827]">{inspectedReport.region?.name || 'Koordinat'}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#374151] block mb-1">Deskripsi Kondisi Lapangan</label>
                <p className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[#374151] leading-relaxed">
                  {inspectedReport.description}
                </p>
              </div>

              {(inspectedReport.photo_url || inspectedReport.photo_path) && (
                <div>
                  <label className="font-semibold text-[#374151] block mb-1">Foto Bukti Kejadian</label>
                  <img
                    src={inspectedReport.photo_url || `/storage/${inspectedReport.photo_path}`}
                    alt="Foto kejadian"
                    className="w-full h-44 object-cover rounded-xl border border-[#E5E7EB]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6B7280] pt-1">
                <div>
                  <span className="font-medium text-[#374151]">Koordinat:</span> {inspectedReport.latitude},{' '}
                  {inspectedReport.longitude}
                </div>
                <div>
                  <span className="font-medium text-[#374151]">Waktu Lapor:</span>{' '}
                  {new Date(inspectedReport.created_at).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setInspectedReport(null)}
                className="px-4 py-2 rounded-xl bg-[#F3F4F6] text-[#374151] text-xs font-semibold hover:bg-[#E5E7EB] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Verify / Reject Action */}
      {verifyingReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#047857]" />
                Kurasi Status Laporan #{verifyingReport.id}
              </h2>
              <button
                type="button"
                onClick={() => setVerifyingReport(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3.5 text-xs">
              <p className="text-[#4B5563]">
                Laporan: <strong className="text-[#111827]">{verifyingReport.title}</strong>
              </p>

              <div>
                <label className="block font-semibold text-[#374151] mb-1.5">Tetapkan Keputusan Status:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="verified"
                      checked={targetStatus === 'verified'}
                      onChange={() => setTargetStatus('verified')}
                      className="text-[#047857]"
                    />
                    <div>
                      <span className="font-bold text-emerald-700 block">VERIFIKASI (Verified)</span>
                      <span className="text-[10px] text-[#6B7280]">Laporan valid, muncul di peta publik & pengaruhi Risk Engine</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="investigation"
                      checked={targetStatus === 'investigation'}
                      onChange={() => setTargetStatus('investigation')}
                      className="text-amber-600"
                    />
                    <div>
                      <span className="font-bold text-amber-700 block">INVESTIGASI (Investigation)</span>
                      <span className="text-[10px] text-[#6B7280]">Perlu konfirmasi lanjutan dari tim posko lapangan</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="rejected"
                      checked={targetStatus === 'rejected'}
                      onChange={() => setTargetStatus('rejected')}
                      className="text-rose-600"
                    />
                    <div>
                      <span className="font-bold text-rose-700 block">TOLAK (Rejected)</span>
                      <span className="text-[10px] text-[#6B7280]">Laporan tidak terbukti, hoaks, atau spam</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Catatan Verifikator (Audit Trail)</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Terkonfirmasi dengan posko pemantauan BPBD setempat."
                  value={verifierNotes}
                  onChange={(e) => setVerifierNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setVerifyingReport(null)}
                  className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-[#4B5563] font-semibold hover:bg-[#F3F4F6] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingVerify}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] text-white font-bold hover:bg-[#065F46] transition-colors disabled:opacity-50"
                >
                  {submittingVerify ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Simpan Keputusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Report Confirmation */}
      {deletingReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#111827]">Hapus Laporan Warga?</h2>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Apakah Anda yakin ingin menghapus laporan #{deletingReport.id}: <strong className="text-[#111827]">{deletingReport.title}</strong>? Tindakan ini akan menghapus data dari repositori secara permanen.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setDeletingReport(null)}
                className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submittingDelete}
                onClick={handleDeleteSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {submittingDelete ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Hapus Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
