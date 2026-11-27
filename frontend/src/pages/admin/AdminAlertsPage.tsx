import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  X,
  CheckCircle,
  Clock,
  Radio,
} from 'lucide-react';
import { adminService, type AdminAlertItem } from '../../services/admin-service';
import { toast } from 'sonner';

export const AdminAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AdminAlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [paginationMeta, setPaginationMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Inspect Modal State
  const [inspectedAlert, setInspectedAlert] = useState<AdminAlertItem | null>(null);

  // Form Modal State (Publish CAP Alert)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submittingForm, setSubmittingForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<AdminAlertItem>>(() => ({
    title: '',
    alert_class: 'warning',
    severity: 'Severe',
    urgency: 'Immediate',
    certainty: 'Observed',
    status: 'active',
    scope: 'Public',
    sender_name: 'SENTRAVAX Emergency Operations Center',
    area_description: 'DKI Jakarta dan Sekitarnya',
    instruction: 'Segera lakukan evakuasi mandiri ke titik kumpul terverifikasi.',
    effective_at: new Date().toISOString().slice(0, 16),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  }));

  // Delete Modal State
  const [deletingAlert, setDeletingAlert] = useState<AdminAlertItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getAlerts({
        status: statusFilter === 'all' ? undefined : statusFilter,
        per_page: 50,
      });
      setAlerts(res.items);
      setPaginationMeta(res.meta);
    } catch (err: any) {
      console.error('Failed to load CAP alerts:', err);
      toast.error('Gagal memuat peringatan dini CAP.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAlerts();
    });
  }, [loadAlerts]);

  // Derived statistics
  const stats = useMemo(() => {
    const total = alerts.length;
    const active = alerts.filter((a) => a.status === 'active').length;
    const expired = alerts.filter((a) => a.status === 'expired').length;
    return { total, active, expired };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (!searchTerm.trim()) return alerts;
    const term = searchTerm.toLowerCase();
    return alerts.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.sender_name?.toLowerCase().includes(term) ||
        a.area_description?.toLowerCase().includes(term)
    );
  }, [alerts, searchTerm]);

  // Handle Create CAP Alert
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Judul peringatan dini wajib diisi.');
      return;
    }

    try {
      setSubmittingForm(true);
      await adminService.createAlert(formData);
      toast.success('Peringatan dini berstandar OASIS CAP berhasil diterbitkan.');
      setIsModalOpen(false);
      loadAlerts();
    } catch (err: any) {
      console.error('Failed to dispatch alert:', err);
      toast.error(err.response?.data?.message || 'Gagal menerbitkan peringatan dini CAP.');
    } finally {
      setSubmittingForm(false);
    }
  };

  // Handle Delete / Dismiss Alert
  const handleDeleteSubmit = async () => {
    if (!deletingAlert) return;

    try {
      setSubmittingDelete(true);
      await adminService.deleteAlert(deletingAlert.id);
      toast.success(`Peringatan dini #${deletingAlert.id} berhasil dicabut/dihapus.`);
      setDeletingAlert(null);
      loadAlerts();
    } catch (err: any) {
      console.error('Failed to delete alert:', err);
      toast.error(err.response?.data?.message || 'Gagal menghapus peringatan dini.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'extreme':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            EXTREME (AWAS)
          </span>
        );
      case 'severe':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            SEVERE (SIAGA)
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            MODERATE (WASPADA)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-300">
            MINOR
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
            <AlertTriangle className="w-6 h-6 text-[#047857]" />
            Peringatan Dini Resmi (OASIS CAP v1.2)
          </h1>
          <p className="text-xs text-[#4B5563] mt-1">
            Pengelolaan peringatan darurat terstandar internasional, verifikasi penerbit otoritas, dan diseminasi publik.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadAlerts}
            className="p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl transition-colors border border-[#E5E7EB]"
            title="Muat ulang data"
            aria-label="Muat ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Terbitkan Peringatan CAP
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Total Peringatan</span>
            <Radio className="w-4 h-4 text-[#4B5563]" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.total}</p>
          <span className="text-[10px] text-[#9CA3AF]">Tercatat dalam repositori CAP</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Peringatan Aktif</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.active}</p>
          <span className="text-[10px] text-emerald-600">Disiarkan ke kanal publik</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">Kedaluwarsa / Dicabut</span>
            <Clock className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.expired}</p>
          <span className="text-[10px] text-gray-500">Masa berlaku habis</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul, penerbit, area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#047857]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="cap-status-filter" className="text-xs text-[#6B7280] font-medium whitespace-nowrap">
            Status:
          </label>
          <select
            id="cap-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-[#D1D5DB] py-1.5 px-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#047857]"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif (Active)</option>
            <option value="expired">Kedaluwarsa (Expired)</option>
          </select>
        </div>
      </div>

      {/* Alerts Data Table */}
      <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#047857]" />
            <p className="text-xs text-[#6B7280]">Memuat peringatan dini...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <p className="text-sm font-semibold text-[#111827]">Tidak Ada Peringatan Dini</p>
            <p className="text-xs text-[#6B7280]">Sesuaikan kata kunci pencarian atau filter status Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Peringatan & Area</th>
                  <th className="py-3 px-4">Penerbit Resmi</th>
                  <th className="py-3 px-4">Keparahan (Severity)</th>
                  <th className="py-3 px-4">Urgensi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Masa Berlaku</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {filteredAlerts.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-[#111827] line-clamp-1">{a.title}</div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5 truncate">
                        {a.area_description || 'Nasional / Multi-Region'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#374151]">{a.sender_name || 'BMKG / BNPB'}</span>
                    </td>
                    <td className="py-3.5 px-4">{getSeverityBadge(a.severity)}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] text-[#4B5563]">{a.urgency || 'Immediate'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {a.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          AKTIF
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          EXPIRED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280] text-[11px]">
                      {a.expires_at ? (
                        <span>Hingga {new Date(a.expires_at).toLocaleDateString('id-ID')}</span>
                      ) : (
                        <span className="italic">Tanpa batas</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectedAlert(a)}
                          className="p-1.5 rounded-lg text-[#4B5563] hover:bg-[#F3F4F6] transition-colors"
                          title="Inspeksi CAP Parameter"
                          aria-label="Inspeksi alert"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAlert(a)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Cabut / Hapus Peringatan"
                          aria-label="Hapus alert"
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
        {alerts.length > 0 && (
          <div className="p-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Menampilkan {filteredAlerts.length} dari {paginationMeta.total} peringatan</span>
            <span>Halaman {paginationMeta.current_page} dari {paginationMeta.last_page}</span>
          </div>
        )}
      </div>

      {/* MODAL 1: Inspect Alert Details */}
      {inspectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#047857]">
                  OASIS CAP v1.2 ALERT #{inspectedAlert.id}
                </span>
                <h2 className="text-base font-bold text-[#111827] mt-0.5">{inspectedAlert.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectedAlert(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Penerbit (Sender)</span>
                  <span className="font-bold text-[#111827]">{inspectedAlert.sender_name || 'BMKG / BNPB'}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Tingkat Keparahan</span>
                  <div className="mt-0.5">{getSeverityBadge(inspectedAlert.severity)}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Area Terdampak</span>
                  <span className="font-semibold text-[#111827]">{inspectedAlert.area_description}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Urgensi / Kepastian</span>
                  <span className="font-mono text-[#111827]">
                    {inspectedAlert.urgency} / {inspectedAlert.certainty}
                  </span>
                </div>
              </div>

              {inspectedAlert.instruction && (
                <div>
                  <label className="font-semibold text-[#374151] block mb-1">Instruksi Keselamatan Publik (SOP)</label>
                  <p className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 leading-relaxed font-medium">
                    {inspectedAlert.instruction}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6B7280]">
                <div>
                  <span className="font-medium text-[#374151]">Mulai Berlaku:</span>{' '}
                  {inspectedAlert.effective_at ? new Date(inspectedAlert.effective_at).toLocaleString('id-ID') : '-'}
                </div>
                <div>
                  <span className="font-medium text-[#374151]">Berakhir:</span>{' '}
                  {inspectedAlert.expires_at ? new Date(inspectedAlert.expires_at).toLocaleString('id-ID') : '-'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setInspectedAlert(null)}
                className="px-4 py-2 rounded-xl bg-[#F3F4F6] text-[#374151] text-xs font-semibold hover:bg-[#E5E7EB] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create / Dispatch CAP Alert */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB] my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#047857]" />
                Terbitkan Peringatan Dini CAP v1.2
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Judul Peringatan Dini (Headline) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Peringatan Dini Cuaca Ekstrem Hujan Lebat Disertai Petir"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Tingkat Keparahan (Severity) *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  >
                    <option value="Minor">Minor (Waspada Rendah)</option>
                    <option value="Moderate">Moderate (Waspada Sedang)</option>
                    <option value="Severe">Severe (Siaga Tinggi)</option>
                    <option value="Extreme">Extreme (Awas Kritis)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Urgensi Tindakan *</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  >
                    <option value="Immediate">Immediate (Segera)</option>
                    <option value="Expected">Expected (Dalam Waktu Dekat)</option>
                    <option value="Future">Future (Mendatang)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Penerbit Berwenang (Sender) *</label>
                  <input
                    type="text"
                    required
                    value={formData.sender_name}
                    onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Area Deskripsi Terdampak *</label>
                  <input
                    type="text"
                    required
                    placeholder="DKI Jakarta, Tangerang, Bekasi"
                    value={formData.area_description}
                    onChange={(e) => setFormData({ ...formData, area_description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Instruksi Keselamatan Warga (SOP)</label>
                <textarea
                  rows={2}
                  placeholder="Jauhi bantaran sungai, persiapkan tas siaga bencana, pantau arahan posko..."
                  value={formData.instruction || ''}
                  onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Mulai Berlaku *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.effective_at}
                    onChange={(e) => setFormData({ ...formData, effective_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Berakhir Pada *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-[#4B5563] font-semibold hover:bg-[#F3F4F6] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] text-white font-bold hover:bg-[#065F46] transition-colors disabled:opacity-50"
                >
                  {submittingForm ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Terbitkan Peringatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Alert Confirmation */}
      {deletingAlert && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#111827]">Cabut Peringatan Dini?</h2>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Apakah Anda yakin ingin mencabut peringatan #{deletingAlert.id}: <strong className="text-[#111827]">{deletingAlert.title}</strong>? Peringatan ini tidak akan lagi disiarkan ke publik.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setDeletingAlert(null)}
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
                Cabut Peringatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
