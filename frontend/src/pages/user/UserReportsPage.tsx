import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { userService } from '../../services/user-service';
import type { CommunityReportItem, CommunityReportDetail } from '../../types';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Layers, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  X,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export const UserReportsPage: React.FC = () => {
  const [reports, setReports] = useState<CommunityReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [reportDetail, setReportDetail] = useState<CommunityReportDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userService.getReports({
        status: statusFilter === 'all' ? undefined : statusFilter,
        per_page: 50,
      });
      setReports(res.items);
    } catch (err) {
      console.error('Failed to load user reports:', err);
      toast.error('Gagal memuat riwayat laporan.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadReports();
    });
  }, [loadReports]);

  const handleOpenDetail = async (id: number) => {
    setSelectedReportId(id);
    setIsLoadingDetail(true);
    try {
      const detail = await userService.getReportDetail(id);
      setReportDetail(detail);
    } catch (err) {
      console.error('Failed to load report detail:', err);
      toast.error('Gagal memuat detail laporan.');
      setSelectedReportId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedReportId(null);
    setReportDetail(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Terverifikasi Resmi
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
            <XCircle className="w-3.5 h-3.5" />
            Ditolak / Tidak Valid
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
            <Clock className="w-3.5 h-3.5" />
            Menunggu Verifikasi
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
            <FileText className="w-6 h-6 text-[#BE123C]" />
            Riwayat Laporan Kejadian Warga
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Pantau status verifikasi, tindak lanjut posko, dan bukti geospasial laporan yang telah Anda ajukan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadReports}
            className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F9FAFB] text-[#4B5563] text-xs font-semibold transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to={PATHS.USER.CREATE_REPORT}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Kirim Laporan Baru</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Semua Status' },
          { key: 'pending', label: 'Menunggu' },
          { key: 'verified', label: 'Terverifikasi' },
          { key: 'rejected', label: 'Ditolak' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-[#BE123C] text-white shadow-xs'
                : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Content List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl animate-pulse p-4" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#BE123C] mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-[#111827]">Belum Ada Laporan yang Diajukan</h2>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            {statusFilter === 'all'
              ? 'Anda belum mengirimkan laporan kejadian bencana. Buat laporan pertama untuk membantu posko tanggap darurat.'
              : `Tidak ditemukan laporan dengan status ${statusFilter}.`}
          </p>
          <div className="pt-2">
            <Link
              to={PATHS.USER.CREATE_REPORT}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#BE123C] text-white text-xs font-bold hover:bg-[#9F1239] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Kirim Laporan Pertama
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#FECDD3] transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(report.status)}
                  {report.hazard_type && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#374151]">
                      {report.hazard_type.name}
                    </span>
                  )}
                  {report.cluster_id && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      Klaster: {report.cluster_id}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-[#9CA3AF]">
                    ID: SVX-REP-{String(report.id).padStart(5, '0')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#111827] line-clamp-1">
                  {report.title}
                </h3>

                <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                  {report.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    {report.region?.name || 'Wilayah Belum Terdefinisi'} ({report.latitude.toFixed(4)}, {report.longitude.toFixed(4)})
                  </span>
                  <span>•</span>
                  <span>
                    Dilaporkan: {new Date(report.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} WIB
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:self-center">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(report.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-semibold text-[#111827] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>Detail</span>
                </button>
                <Link
                  to={`${PATHS.PUBLIC.MAP}?lat=${report.latitude}&lon=${report.longitude}&zoom=14`}
                  className="p-2 rounded-xl bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563] hover:text-[#BE123C] transition-colors"
                  title="Lihat di Peta"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E5E7EB] shadow-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  ID LAPORAN: SVX-REP-{String(selectedReportId).padStart(5, '0')}
                </span>
                <h3 className="text-base font-bold text-[#111827]">
                  Detail Verifikasi Laporan Warga
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDetail || !reportDetail ? (
              <div className="py-12 text-center text-xs text-[#6B7280] animate-pulse">
                Memuat detail laporan dari server...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {getStatusBadge(reportDetail.status)}
                  <span className="text-xs text-[#6B7280]">
                    {new Date(reportDetail.created_at).toLocaleString('id-ID')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#111827]">{reportDetail.title}</h4>
                  <p className="text-xs text-[#4B5563] mt-1 leading-relaxed whitespace-pre-wrap">
                    {reportDetail.description}
                  </p>
                </div>

                {reportDetail.photo_url && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
                      Foto Dokumentasi Lapangan
                    </label>
                    <div className="rounded-xl overflow-hidden border border-[#E5E7EB]">
                      <img
                        src={reportDetail.photo_url}
                        alt="Bukti Lapangan"
                        className="w-full max-h-60 object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Jenis Bahaya:</span>
                    <span className="font-semibold text-[#111827]">{reportDetail.hazard_type?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Wilayah:</span>
                    <span className="font-semibold text-[#111827]">{reportDetail.region?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Koordinat:</span>
                    <span className="font-mono text-[#111827]">{reportDetail.latitude}, {reportDetail.longitude}</span>
                  </div>
                  {reportDetail.verified_at && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Waktu Verifikasi:</span>
                      <span className="font-semibold text-[#BE123C]">
                        {new Date(reportDetail.verified_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {reportDetail.moderation_notes && (
                  <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[#DC2626] font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Catatan Tim Verifikator</span>
                    </div>
                    <p className="text-[#7F1D1D] leading-relaxed">
                      {reportDetail.moderation_notes}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    className="px-4 py-2 rounded-xl bg-[#BE123C] text-white text-xs font-bold hover:bg-[#9F1239] transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
