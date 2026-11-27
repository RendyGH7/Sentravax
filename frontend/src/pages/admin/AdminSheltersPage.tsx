import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Edit2,
  Trash2,
  History,
  X,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminService } from '../../services/admin-service';
import { publicService } from '../../services/public-service';
import { getApiErrorMessage } from '../../lib/api-error';
import type {
  ShelterItem,
  ShelterFormData,
  AdminShelterStats,
  FacilityType,
  OperationalStatus,
  VerificationStatus,
  ShelterAuditItem,
} from '../../types/shelter';
import type { RegionItem } from '../../types';

export const AdminSheltersPage: React.FC = () => {
  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [stats, setStats] = useState<AdminShelterStats>({
    total: 0,
    verified: 0,
    pending: 0,
    open: 0,
    full: 0,
    standby: 0,
    closed: 0,
    total_capacity: 0,
    total_occupancy: 0,
  });
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOperational, setFilterOperational] = useState<string>('all');
  const [filterVerification, setFilterVerification] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingShelter, setEditingShelter] = useState<ShelterItem | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [statusTargetShelter, setStatusTargetShelter] = useState<ShelterItem | null>(null);
  const [statusFormData, setStatusFormData] = useState<{
    operational_status: OperationalStatus;
    verification_status: VerificationStatus;
    current_occupancy: number;
    notes: string;
  }>({
    operational_status: 'open',
    verification_status: 'VERIFIED',
    current_occupancy: 0,
    notes: '',
  });

  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditTargetShelter, setAuditTargetShelter] = useState<ShelterItem | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<ShelterFormData>({
    name: '',
    facility_type: 'assembly_point',
    address: '',
    region_id: null,
    latitude: -6.2088,
    longitude: 106.8456,
    capacity: 500,
    current_occupancy: 0,
    has_sanitation: true,
    sanitation_details: '',
    wheelchair_accessible: true,
    elderly_friendly: true,
    contact_person: '',
    contact_phone: '',
    operational_status: 'open',
    verification_status: 'VERIFIED',
    verified_by_agency: 'BPBD Provinsi DKI Jakarta',
    source_name: 'Katalog Posko Evakuasi Resmi BPBD',
    source_url: '',
    evacuation_route_info: {
      has_official_route: false,
      notes: 'Rute evakuasi digital resmi belum dirilis oleh BPBD setempat. Warga diimbau mematuhi rambu fisik di lapangan.',
    },
  });

  const [hasOfficialEvacRoute, setHasOfficialEvacRoute] = useState<boolean>(false);
  const [evacRouteCode, setEvacRouteCode] = useState<string>('');
  const [evacCorridorName, setEvacCorridorName] = useState<string>('');
  const [evacAuthority, setEvacAuthority] = useState<string>('');
  const [evacGuidance, setEvacGuidance] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load Regions on Mount
  useEffect(() => {
    publicService.getRegions().then(setRegions).catch(() => {});
  }, []);

  // Load Shelters
  const loadShelters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getShelters({
        q: searchQuery || undefined,
        facility_type: filterType !== 'all' ? filterType : undefined,
        operational_status: filterOperational !== 'all' ? filterOperational : undefined,
        verification_status: filterVerification !== 'all' ? filterVerification : undefined,
        region_id: filterRegion ? Number(filterRegion) : undefined,
        with_trashed: includeArchived,
        page: currentPage,
        per_page: 15,
      });

      setShelters(res.data);
      setStats(res.stats);
      setTotalPages(res.meta.last_page);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    filterType,
    filterOperational,
    filterVerification,
    filterRegion,
    includeArchived,
    currentPage,
  ]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadShelters();
      }
    });
    return () => {
      active = false;
    };
  }, [loadShelters]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingShelter(null);
    setFormData({
      name: '',
      facility_type: 'assembly_point',
      address: '',
      region_id: regions[0]?.id || null,
      latitude: -6.2088,
      longitude: 106.8456,
      capacity: 500,
      current_occupancy: 0,
      has_sanitation: true,
      sanitation_details: 'Fasilitas MCK dan suplai air bersih darurat',
      wheelchair_accessible: true,
      elderly_friendly: true,
      contact_person: 'Pusdalops BPBD',
      contact_phone: '',
      operational_status: 'open',
      verification_status: 'VERIFIED',
      verified_by_agency: 'BPBD Provinsi DKI Jakarta',
      source_name: 'Katalog Posko Evakuasi Resmi BPBD',
      source_url: '',
      evacuation_route_info: {
        has_official_route: false,
        notes: 'Rute evakuasi digital resmi belum dirilis oleh BPBD setempat. Warga diimbau mematuhi rambu fisik di lapangan.',
      },
    });
    setHasOfficialEvacRoute(false);
    setEvacRouteCode('');
    setEvacCorridorName('');
    setEvacAuthority('BPBD Provinsi DKI Jakarta');
    setEvacGuidance('');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (shelter: ShelterItem) => {
    setEditingShelter(shelter);
    setFormData({
      name: shelter.name,
      facility_type: shelter.facility_type,
      address: shelter.address,
      region_id: shelter.region_id ?? null,
      latitude: shelter.latitude,
      longitude: shelter.longitude,
      capacity: shelter.capacity ?? null,
      current_occupancy: shelter.current_occupancy || 0,
      has_sanitation: shelter.has_sanitation,
      sanitation_details: shelter.sanitation_details || '',
      wheelchair_accessible: shelter.wheelchair_accessible,
      elderly_friendly: shelter.elderly_friendly,
      contact_person: shelter.contact_person || '',
      contact_phone: shelter.contact_phone || '',
      operational_status: shelter.operational_status,
      verification_status: shelter.verification_status,
      verified_by_agency: shelter.verified_by_agency || '',
      source_name: shelter.source_name || '',
      source_url: shelter.source_url || '',
      evacuation_route_info: shelter.evacuation_route_info || null,
    });

    const evac = shelter.evacuation_route_info;
    if (evac && evac.has_official_route) {
      setHasOfficialEvacRoute(true);
      setEvacRouteCode(evac.route_code || '');
      setEvacCorridorName(evac.corridor_name || '');
      setEvacAuthority(evac.authority || '');
      setEvacGuidance(evac.safety_guidance || '');
    } else {
      setHasOfficialEvacRoute(false);
      setEvacRouteCode('');
      setEvacCorridorName('');
      setEvacAuthority(shelter.verified_by_agency || '');
      setEvacGuidance('');
    }

    setIsFormModalOpen(true);
  };

  // Submit Form (Create / Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: ShelterFormData = {
      ...formData,
      evacuation_route_info: hasOfficialEvacRoute
        ? {
            has_official_route: true,
            route_code: evacRouteCode || `EVAC-${Date.now().toString().slice(-4)}`,
            corridor_name: evacCorridorName || 'Koridor Evakuasi Terverifikasi',
            status: 'AVAILABLE',
            verified_at: new Date().toISOString(),
            authority: evacAuthority || formData.verified_by_agency || 'BPBD Setempat',
            safety_guidance: evacGuidance || 'Ikuti rambu penunjuk jalur evakuasi resmi.',
          }
        : {
            has_official_route: false,
            notes: 'Rute evakuasi digital resmi belum dirilis oleh BPBD setempat. Warga diimbau mematuhi rambu evakuasi fisik dan arahan petugas.',
            official_source: null,
          },
    };

    try {
      if (editingShelter) {
        await adminService.updateShelter(editingShelter.id, payload);
        setSuccessMessage(`Fasilitas shelter "${payload.name}" berhasil diperbarui.`);
      } else {
        await adminService.createShelter(payload);
        setSuccessMessage(`Fasilitas shelter baru "${payload.name}" berhasil ditambahkan.`);
      }
      setIsFormModalOpen(false);
      loadShelters();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Status Toggle Modal
  const handleOpenStatusModal = (shelter: ShelterItem) => {
    setStatusTargetShelter(shelter);
    setStatusFormData({
      operational_status: shelter.operational_status,
      verification_status: shelter.verification_status,
      current_occupancy: shelter.current_occupancy || 0,
      notes: '',
    });
    setIsStatusModalOpen(true);
  };

  // Submit Quick Status Update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTargetShelter) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await adminService.updateShelterStatus(statusTargetShelter.id, statusFormData);
      setSuccessMessage(`Status operasional dan verifikasi shelter "${statusTargetShelter.name}" berhasil diperbarui.`);
      setIsStatusModalOpen(false);
      loadShelters();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Audit History Drawer
  const handleOpenAuditModal = (shelter: ShelterItem) => {
    setAuditTargetShelter(shelter);
    setIsAuditModalOpen(true);
  };

  // Soft Deactivate Shelter
  const handleDeleteShelter = async (shelter: ShelterItem) => {
    if (
      !window.confirm(
        `Nonaktifkan shelter "${shelter.name}"? Fasilitas akan diarsipkan dan tidak lagi ditampilkan aktif kepada publik, namun riwayat historis tetap tersimpan.`
      )
    ) {
      return;
    }

    try {
      await adminService.deleteShelter(shelter.id);
      setSuccessMessage(`Shelter "${shelter.name}" berhasil dinonaktifkan.`);
      loadShelters();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#047857]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
              Registry Shelter & Jalur Evakuasi Terverifikasi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Kelola data resmi titik kumpul, gelanggang pengungsian, dan koridor evakuasi bencana terverifikasi BPBD/BNPB.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#047857] hover:bg-[#065F46] shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Shelter Baru</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Total Terdaftar</span>
            <Shield className="w-4 h-4 text-[#047857]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#111827] mt-1">
            {stats.total}
          </div>
          <div className="text-[11px] text-[#059669] mt-0.5 font-medium">
            {stats.verified} Resmi Terverifikasi
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Status Operasional</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#111827] mt-1">
            {stats.open} Buka
          </div>
          <div className="text-[11px] text-[#D97706] mt-0.5 font-medium">
            {stats.standby} Siaga | {stats.full} Penuh
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Kapasitas Tampung</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#111827] mt-1 font-mono">
            {stats.total_capacity.toLocaleString()} Jiwa
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5 font-medium">
            Terisi: {stats.total_occupancy.toLocaleString()} Jiwa
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Menunggu Verifikasi</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#111827] mt-1">
            {stats.pending} Fasilitas
          </div>
          <div className="text-[11px] text-[#4B5563] mt-0.5 font-medium">
            Perlu Peninjauan Otoritas
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Cari nama shelter, alamat, atau instansi verifikator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E7EB] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-2 px-3 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#047857]"
            >
              <option value="all">Semua Jenis Fasilitas</option>
              <option value="assembly_point">Titik Kumpul Aman</option>
              <option value="community_hall">Balai Warga / GOR</option>
              <option value="stadium">Stadion Evakuasi</option>
              <option value="school">Sekolah</option>
              <option value="health_facility">Fasilitas Kesehatan</option>
              <option value="government_office">Kantor Pemerintah</option>
            </select>

            <select
              value={filterOperational}
              onChange={(e) => setFilterOperational(e.target.value)}
              className="py-2 px-3 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#047857]"
            >
              <option value="all">Semua Status Operasional</option>
              <option value="open">Buka (Open)</option>
              <option value="standby">Siaga (Standby)</option>
              <option value="full">Penuh (Full)</option>
              <option value="closed">Tutup (Closed)</option>
            </select>

            <select
              value={filterVerification}
              onChange={(e) => setFilterVerification(e.target.value)}
              className="py-2 px-3 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#047857]"
            >
              <option value="all">Semua Status Verifikasi</option>
              <option value="VERIFIED">Terverifikasi Resmi</option>
              <option value="PENDING_VERIFICATION">Menunggu Verifikasi</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>

            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="py-2 px-3 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#047857]"
            >
              <option value="">Semua Wilayah</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-xs text-[#4B5563] cursor-pointer ml-auto sm:ml-0">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded text-[#047857] focus:ring-[#047857]"
              />
              <span>Tampilkan Arsip</span>
            </label>
          </div>
        </div>
      </div>

      {/* Shelters Table */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#047857]" />
            <span className="text-xs font-semibold text-[#6B7280]">Memuat registry shelter...</span>
          </div>
        ) : shelters.length === 0 ? (
          <div className="py-16 text-center text-xs sm:text-sm text-[#6B7280]">
            Tidak ada fasilitas shelter yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nama & Lokasi</th>
                  <th className="py-3 px-3">Jenis Fasilitas</th>
                  <th className="py-3 px-3">Kapasitas</th>
                  <th className="py-3 px-3">Fasilitas</th>
                  <th className="py-3 px-3">Status Operasional</th>
                  <th className="py-3 px-3">Verifikasi & Sumber</th>
                  <th className="py-3 px-3">Jalur Evakuasi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#111827]">
                {shelters.map((s) => {
                  const isVerified = s.verification_status === 'VERIFIED';
                  const isArchived = Boolean(s.deleted_at);
                  const hasEvacRoute = s.evacuation_route_info?.has_official_route === true;

                  return (
                    <tr key={s.id} className={isArchived ? 'bg-gray-50 opacity-60' : 'hover:bg-[#F9FAFB]'}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-[#111827] flex items-center gap-1.5">
                          {s.name}
                          {isArchived && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-gray-200 text-gray-700 font-semibold">
                              Diarsipkan
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">
                          {s.address}
                        </div>
                        <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                          Koord: {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)} | {s.region?.name || 'Nasional'}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3F4F6] text-[#374151]">
                          {s.facility_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold font-mono text-[11px]">
                          {s.capacity ? `${s.current_occupancy || 0} / ${s.capacity}` : 'Tidak dicatat'}
                        </div>
                        {s.capacity && s.capacity > 0 && (
                          <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                            <div
                              className="bg-[#047857] h-1 rounded-full"
                              style={{ width: `${Math.min(100, Math.round(((s.current_occupancy || 0) / s.capacity) * 100))}%` }}
                            />
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          {s.wheelchair_accessible && <span title="Akses Kursi Roda">♿</span>}
                          {s.elderly_friendly && <span title="Ramah Lansia">👴</span>}
                          {s.has_sanitation && <span title="Sanitasi & Air Bersih">🚻</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.operational_status === 'open'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.operational_status === 'standby'
                              ? 'bg-amber-100 text-amber-800'
                              : s.operational_status === 'full'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {s.operational_status}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVerified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isVerified ? '✓ TERVERIFIKASI' : '⏳ PENDING'}
                        </span>
                        <div className="text-[10px] text-[#6B7280] line-clamp-1 mt-0.5">
                          {s.verified_by_agency || 'Belum ada verifikator'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {hasEvacRoute ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            🛣️ Jalur Resmi Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#9CA3AF]">
                            Rute digital belum ada
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(s)}
                            className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#374151]"
                            title="Ubah Status & Keterisian"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#047857]"
                            title="Edit Data Shelter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAuditModal(s)}
                            className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#4B5563]"
                            title="Lihat Riwayat Audit"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          {!isArchived && (
                            <button
                              type="button"
                              onClick={() => handleDeleteShelter(s)}
                              className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                              title="Nonaktifkan / Arsipkan Shelter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Halaman {currentPage} dari {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-[#E5E7EB] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-[#E5E7EB] disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* ADD / EDIT SHELTER MODAL */}
      {/* ===================================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full my-8 overflow-hidden text-xs sm:text-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#047857]" />
                <h3 className="font-bold text-base text-[#111827]">
                  {editingShelter ? 'Perbarui Fasilitas Shelter' : 'Tambah Shelter & Titik Kumpul Resmi'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Nama Fasilitas / Shelter <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Gelanggang Remaja Jatinegara (GOR Otista)"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:ring-2 focus:ring-[#047857]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Jenis Fasilitas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.facility_type}
                    onChange={(e) => setFormData({ ...formData, facility_type: e.target.value as FacilityType })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:ring-2 focus:ring-[#047857]"
                  >
                    <option value="assembly_point">Titik Kumpul Aman (Assembly Point)</option>
                    <option value="community_hall">Balai Warga / GOR</option>
                    <option value="stadium">Stadion Evakuasi Terpadu</option>
                    <option value="school">Sekolah / Madrasah</option>
                    <option value="tent_camp">Tenda Pengungsian Lapangan</option>
                    <option value="health_facility">Puskesmas / RS Lapangan</option>
                    <option value="government_office">Kantor Kelurahan / Kecamatan</option>
                    <option value="other">Fasilitas Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Address & Region */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Jl. Otto Iskandardinata No. 121, RT 02/RW 04"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:ring-2 focus:ring-[#047857]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Wilayah Administrasi
                  </label>
                  <select
                    value={formData.region_id ?? ''}
                    onChange={(e) => setFormData({ ...formData, region_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:ring-2 focus:ring-[#047857]"
                  >
                    <option value="">Pilih Wilayah...</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Latitude (Garis Lintang) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    placeholder="-6.2088"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-mono focus:ring-2 focus:ring-[#047857]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Longitude (Garis Bujur) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    placeholder="106.8456"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-mono focus:ring-2 focus:ring-[#047857]"
                  />
                </div>
              </div>

              {/* Capacity & Occupancy */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Kapasitas Maksimal (Jiwa)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity ?? ''}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Contoh: 1000"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:ring-2 focus:ring-[#047857]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Keterisian Saat Ini (Jiwa)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.current_occupancy ?? 0}
                    onChange={(e) => setFormData({ ...formData, current_occupancy: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:ring-2 focus:ring-[#047857]"
                  />
                </div>
              </div>

              {/* Status & Verification */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Status Operasional <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.operational_status}
                    onChange={(e) => setFormData({ ...formData, operational_status: e.target.value as OperationalStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:ring-2 focus:ring-[#047857]"
                  >
                    <option value="open">Buka (Siap Tampung)</option>
                    <option value="standby">Siaga (Standby)</option>
                    <option value="full">Penuh</option>
                    <option value="closed">Tutup / Tidak Beroperasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Status Verifikasi Otoritas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.verification_status}
                    onChange={(e) => setFormData({ ...formData, verification_status: e.target.value as VerificationStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:ring-2 focus:ring-[#047857]"
                  >
                    <option value="VERIFIED">TERVERIFIKASI RESMI (BPBD/BNPB)</option>
                    <option value="PENDING_VERIFICATION">Menunggu Verifikasi Otoritas</option>
                    <option value="INACTIVE">Nonaktif / Kadaluarsa</option>
                    <option value="SIMULATED">Data Simulasi Latihan</option>
                  </select>
                </div>
              </div>

              {/* Sanitation & Accessibility */}
              <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-2.5">
                <div className="font-semibold text-xs text-[#374151]">Aksesibilitas & Sanitasi</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-xs text-[#374151] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.wheelchair_accessible}
                      onChange={(e) => setFormData({ ...formData, wheelchair_accessible: e.target.checked })}
                      className="rounded text-[#047857] focus:ring-[#047857]"
                    />
                    <span>♿ Akses Kursi Roda</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#374151] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.elderly_friendly}
                      onChange={(e) => setFormData({ ...formData, elderly_friendly: e.target.checked })}
                      className="rounded text-[#047857] focus:ring-[#047857]"
                    />
                    <span>👴 Ramah Lansia</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#374151] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_sanitation}
                      onChange={(e) => setFormData({ ...formData, has_sanitation: e.target.checked })}
                      className="rounded text-[#047857] focus:ring-[#047857]"
                    />
                    <span>🚻 Sanitasi & Air Bersih</span>
                  </label>
                </div>

                {formData.has_sanitation && (
                  <input
                    type="text"
                    value={formData.sanitation_details || ''}
                    onChange={(e) => setFormData({ ...formData, sanitation_details: e.target.value })}
                    placeholder="Rincian fasilitas sanitasi: 8 unit toilet, 4 toren air 5000L..."
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs bg-white focus:ring-2 focus:ring-[#047857]"
                  />
                )}
              </div>

              {/* Verifying Agency & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Instansi Verifikator Resmi
                  </label>
                  <input
                    type="text"
                    value={formData.verified_by_agency || ''}
                    onChange={(e) => setFormData({ ...formData, verified_by_agency: e.target.value })}
                    placeholder="BPBD Provinsi DKI Jakarta"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:ring-2 focus:ring-[#047857]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Kontak Posko / Pengelola
                  </label>
                  <input
                    type="text"
                    value={formData.contact_phone || ''}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="021-8192000"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:ring-2 focus:ring-[#047857]"
                  />
                </div>
              </div>

              {/* Section: Evacuation Route (Bagian D) */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                      <span>🛣️ Informasi Koridor / Jalur Evakuasi Resmi</span>
                    </div>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Hanya aktifkan bila telah ada penetapan koridor evakuasi resmi dari BPBD/Dishub.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasOfficialEvacRoute}
                      onChange={(e) => setHasOfficialEvacRoute(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#047857]"></div>
                  </label>
                </div>

                {hasOfficialEvacRoute ? (
                  <div className="space-y-2 pt-2 border-t border-blue-200 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Kode Rute (cth: EVAC-JKT-01)"
                        value={evacRouteCode}
                        onChange={(e) => setEvacRouteCode(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Nama Koridor (cth: Koridor Jl. Otista)"
                        value={evacCorridorName}
                        onChange={(e) => setEvacCorridorName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Petunjuk Keselamatan (cth: Gunakan lajur timur, hindari genangan bawah flyover)"
                      value={evacGuidance}
                      onChange={(e) => setEvacGuidance(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-xs"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-[#6B7280] italic">
                    Status: "Rute digital resmi belum dirilis oleh BPBD setempat. Warga diimbau mematuhi rambu fisik di lapangan."
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-[#4B5563] font-semibold hover:bg-[#F3F4F6]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingShelter ? 'Simpan Perubahan' : 'Tambah Shelter'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* QUICK STATUS UPDATE MODAL */}
      {/* ===================================================================== */}
      {isStatusModalOpen && statusTargetShelter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 text-xs sm:text-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-bold text-base text-[#111827]">
                Perbarui Status Operasional
              </h3>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B7280]">
              Shelter: <strong className="text-[#111827]">{statusTargetShelter.name}</strong>
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Status Operasional
                </label>
                <select
                  value={statusFormData.operational_status}
                  onChange={(e) => setStatusFormData({ ...statusFormData, operational_status: e.target.value as OperationalStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs"
                >
                  <option value="open">Buka (Siap Tampung)</option>
                  <option value="standby">Siaga (Standby)</option>
                  <option value="full">Penuh</option>
                  <option value="closed">Tutup / Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Jumlah Keterisian Saat Ini (Jiwa)
                </label>
                <input
                  type="number"
                  min="0"
                  value={statusFormData.current_occupancy}
                  onChange={(e) => setStatusFormData({ ...statusFormData, current_occupancy: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Status Verifikasi
                </label>
                <select
                  value={statusFormData.verification_status}
                  onChange={(e) => setStatusFormData({ ...statusFormData, verification_status: e.target.value as VerificationStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs"
                >
                  <option value="VERIFIED">TERVERIFIKASI RESMI</option>
                  <option value="PENDING_VERIFICATION">Menunggu Verifikasi</option>
                  <option value="INACTIVE">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Catatan Riwayat Audit (Alasan Perubahan)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Evakuasi warga gelombang pasang RW 04"
                  value={statusFormData.notes}
                  onChange={(e) => setStatusFormData({ ...statusFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-[#4B5563] font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#047857] text-white font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* AUDIT LOG PROVENANCE DRAWER / MODAL */}
      {/* ===================================================================== */}
      {isAuditModalOpen && auditTargetShelter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 text-xs sm:text-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#047857]" />
                <h3 className="font-bold text-base text-[#111827]">
                  Riwayat Audit Perubahan Lokasi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#6B7280]">
              Fasilitas: <strong className="text-[#111827]">{auditTargetShelter.name}</strong>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                Verifikator: {auditTargetShelter.verified_by_agency || 'Belum ada'} | Sumber: {auditTargetShelter.source_name || '-'}
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {auditTargetShelter.provenance_metadata?.audit_history &&
              auditTargetShelter.provenance_metadata.audit_history.length > 0 ? (
                auditTargetShelter.provenance_metadata.audit_history.map((log: ShelterAuditItem, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-mono">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-[#6B7280]">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#374151]">
                      Oleh: <strong>{log.user_name || `Admin #${log.user_id}`}</strong>
                    </div>
                    {log.notes && (
                      <div className="text-[11px] text-[#4B5563] italic">
                        "{log.notes}"
                      </div>
                    )}
                    {log.changed_fields && log.changed_fields.length > 0 && (
                      <div className="text-[10px] text-[#6B7280]">
                        Field diubah: {log.changed_fields.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-[#6B7280]">
                  Belum ada catatan riwayat audit tersimpan untuk shelter ini.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] text-right">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
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

export default AdminSheltersPage;
