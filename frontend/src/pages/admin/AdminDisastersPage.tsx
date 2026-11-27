import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import { adminService, type AdminEventItem } from '../../services/admin-service';
import { publicService } from '../../services/public-service';
import type { HazardTypeItem, RegionItem } from '../../types';
import { toast } from 'sonner';

export const AdminDisastersPage: React.FC = () => {
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [paginationMeta, setPaginationMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Form Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<AdminEventItem | null>(null);
  const [submittingForm, setSubmittingForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<AdminEventItem>>(() => ({
    title: '',
    description: '',
    hazard_type_id: 1,
    region_id: 1,
    severity: 'moderate',
    status: 'active',
    latitude: -6.2,
    longitude: 106.85,
    radius_km: 5,
    started_at: new Date().toISOString().slice(0, 16),
  }));

  // Delete Modal State
  const [deletingEvent, setDeletingEvent] = useState<AdminEventItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [eventsRes, hazardsRes, regionsRes] = await Promise.all([
        adminService.getEvents({
          status: statusFilter === 'all' ? undefined : statusFilter,
          hazard_type_id: hazardFilter === 'all' ? undefined : Number(hazardFilter),
          per_page: 50,
        }),
        publicService.getHazardTypes(),
        publicService.getRegions(),
      ]);
      setEvents(eventsRes.items);
      setPaginationMeta(eventsRes.meta);
      setHazardTypes(hazardsRes);
      setRegions(regionsRes);
    } catch (err: any) {
      console.error('Failed to load disaster events:', err);
      toast.error('Gagal memuat kejadian bencana.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, hazardFilter]);

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

  // Derived statistics
  const stats = useMemo(() => {
    const total = events.length;
    const active = events.filter((e) => e.status === 'active').length;
    const contained = events.filter((e) => e.status === 'contained').length;
    const resolved = events.filter((e) => e.status === 'resolved').length;
    return { total, active, contained, resolved };
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return events;
    const term = searchTerm.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.region?.name.toLowerCase().includes(term) ||
        e.hazard_type?.name.toLowerCase().includes(term)
    );
  }, [events, searchTerm]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      hazard_type_id: hazardTypes[0]?.id || 1,
      region_id: regions[0]?.id || 1,
      severity: 'moderate',
      status: 'active',
      latitude: -6.2,
      longitude: 106.85,
      radius_km: 5,
      started_at: new Date().toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (event: AdminEventItem) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      hazard_type_id: event.hazard_type_id,
      region_id: event.region_id || regions[0]?.id || 1,
      severity: event.severity,
      status: event.status,
      latitude: event.latitude,
      longitude: event.longitude,
      radius_km: event.radius_km || 5,
      started_at: event.started_at ? event.started_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Judul kejadian wajib diisi.');
      return;
    }

    try {
      setSubmittingForm(true);
      if (editingEvent) {
        await adminService.updateEvent(editingEvent.id, formData);
        toast.success(`Kejadian bencana #${editingEvent.id} berhasil diperbarui.`);
      } else {
        await adminService.createEvent(formData);
        toast.success('Kejadian bencana resmi baru berhasil ditambahkan.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to save disaster event:', err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan kejadian bencana.');
    } finally {
      setSubmittingForm(false);
    }
  };

  // Handle Delete
  const handleDeleteSubmit = async () => {
    if (!deletingEvent) return;

    try {
      setSubmittingDelete(true);
      await adminService.deleteEvent(deletingEvent.id);
      toast.success(`Kejadian bencana #${deletingEvent.id} berhasil dihapus.`);
      setDeletingEvent(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete disaster event:', err);
      toast.error(err.response?.data?.message || 'Gagal menghapus kejadian.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
      case 'extreme':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            EKSTREM
          </span>
        );
      case 'severe':
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            TINGGI
          </span>
        );
      case 'moderate':
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            SEDANG
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-300">
            RENDAH
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            AKTIF
          </span>
        );
      case 'contained':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            TERKENDALI
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            SELESAI
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {status}
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
            <Activity className="w-6 h-6 text-[#047857]" />
            Katalog Kejadian Bencana Resmi
          </h1>
          <p className="text-xs text-[#4B5563] mt-1">
            Pengelolaan kejadian bencana terverifikasi dari telemetri BMKG, BNPB, dan posko komando terpadu.
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
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Kejadian Baru
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Total Kejadian</span>
            <Activity className="w-4 h-4 text-[#4B5563]" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.total}</p>
          <span className="text-[10px] text-[#9CA3AF]">Tercatat dalam sistem</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Kejadian Aktif</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.active}</p>
          <span className="text-[10px] text-emerald-600">Mempengaruhi Risk Engine</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Terkendali</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.contained}</p>
          <span className="text-[10px] text-amber-600">Dalam penanganan posko</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">Selesai / Pulih</span>
            <Layers className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.resolved}</p>
          <span className="text-[10px] text-gray-500">Arsip riwayat bencana</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul kejadian, wilayah..."
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
            <option value="active">Aktif (Active)</option>
            <option value="contained">Terkendali (Contained)</option>
            <option value="resolved">Selesai (Resolved)</option>
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

      {/* Events Table */}
      <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#047857]" />
            <p className="text-xs text-[#6B7280]">Memuat katalog kejadian...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <p className="text-sm font-semibold text-[#111827]">Tidak Ada Kejadian Ditemukan</p>
            <p className="text-xs text-[#6B7280]">Sesuaikan kata kunci pencarian atau filter Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Kejadian & Wilayah</th>
                  <th className="py-3 px-4">Jenis Bahaya</th>
                  <th className="py-3 px-4">Tingkat Keparahan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Radius & Koordinat</th>
                  <th className="py-3 px-4">Waktu Mulai</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-[#111827] line-clamp-1">{ev.title}</div>
                      <div className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#9CA3AF] shrink-0" />
                        <span className="truncate">{ev.region?.name || 'Area Terkoordinasi'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#374151]">{ev.hazard_type?.name || 'Bahaya Umum'}</td>
                    <td className="py-3.5 px-4">{getSeverityBadge(ev.severity)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(ev.status)}</td>
                    <td className="py-3.5 px-4 text-[11px] text-[#6B7280]">
                      <div>{ev.radius_km ? `${ev.radius_km} km` : 'Spesifik'}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{ev.latitude.toFixed(3)}, {ev.longitude.toFixed(3)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-[#9CA3AF]" />
                        {new Date(ev.started_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(ev)}
                          className="p-1.5 rounded-lg text-[#047857] hover:bg-[#ECFDF5] transition-colors"
                          title="Edit Kejadian"
                          aria-label={`Edit ${ev.title}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingEvent(ev)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Kejadian"
                          aria-label={`Hapus ${ev.title}`}
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
        {events.length > 0 && (
          <div className="p-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Menampilkan {filteredEvents.length} dari {paginationMeta.total} kejadian</span>
            <span>Halaman {paginationMeta.current_page} dari {paginationMeta.last_page}</span>
          </div>
        )}
      </div>

      {/* MODAL 1: Create / Edit Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB] my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#047857]" />
                {editingEvent ? `Edit Kejadian #${editingEvent.id}` : 'Tambah Kejadian Bencana Baru'}
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
                <label className="block font-semibold text-[#374151] mb-1">Judul Kejadian Bencana *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Banjir Luapan Kali Ciliwung"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Jenis Bahaya *</label>
                  <select
                    value={formData.hazard_type_id}
                    onChange={(e) => setFormData({ ...formData, hazard_type_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  >
                    {hazardTypes.map((ht) => (
                      <option key={ht.id} value={ht.id}>
                        {ht.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Wilayah Administrasi *</label>
                  <select
                    value={formData.region_id || ''}
                    onChange={(e) => setFormData({ ...formData, region_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  >
                    {regions.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Tingkat Keparahan *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  >
                    <option value="minor">Minor / Rendah</option>
                    <option value="moderate">Moderate / Sedang</option>
                    <option value="severe">Severe / Tinggi</option>
                    <option value="critical">Critical / Ekstrem</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Status Penanganan *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  >
                    <option value="active">Aktif (Active)</option>
                    <option value="contained">Terkendali (Contained)</option>
                    <option value="resolved">Selesai (Resolved)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Radius (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.radius_km || 5}
                    onChange={(e) => setFormData({ ...formData, radius_km: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Waktu Mulai Terjadi *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.started_at}
                  onChange={(e) => setFormData({ ...formData, started_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Deskripsi Tambahan / Dampak</label>
                <textarea
                  rows={3}
                  placeholder="Detail dampak, kerusakan, dan perimeter evakuasi..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                />
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
                  {editingEvent ? 'Simpan Perubahan' : 'Terbitkan Kejadian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Event Confirmation */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#111827]">Hapus Kejadian Bencana?</h2>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Apakah Anda yakin ingin menghapus kejadian #{deletingEvent.id}: <strong className="text-[#111827]">{deletingEvent.title}</strong>? Penghapusan ini akan menghapus rekaman spasial dari peta resmi.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
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
                Hapus Kejadian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
