import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PhoneCall,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '../../services/admin-service';
import { publicService } from '../../services/public-service';
import { getApiErrorMessage, isRequestCanceled } from '../../lib/api-error';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../app/context/useAuth';
import { AdminEmergencyChannelsSection } from '../../components/admin/AdminEmergencyChannelsSection';
import { AdminEmergencyGovernanceBar } from '../../components/admin/AdminEmergencyGovernanceBar';
import { AdminEmergencyAuditHistoryPanel } from '../../components/admin/AdminEmergencyAuditHistoryPanel';
import type {
  AdminEmergencyContact,
  AdminEmergencyDirectoryStats,
  AdminEmergencyDirectoryQueryParams,
  AdminEmergencyContactParentPayload,
  EmergencyDirectoryCategory,
  EmergencyDirectoryScope,
  EmergencyDirectoryVerificationStatus,
  EmergencyDirectoryPublicationStatus,
  PublicEmergencyDirectoryPaginationMeta,
  RegionItem,
} from '../../types';

const CATEGORY_OPTIONS: Array<{ value: EmergencyDirectoryCategory; label: string }> = [
  { value: 'disaster_management', label: 'Penanggulangan Bencana' },
  { value: 'sar', label: 'SAR / Pencarian & Pertolongan' },
  { value: 'police', label: 'Kepolisian & Keamanan' },
  { value: 'medical', label: 'Medis / Ambulans' },
  { value: 'fire', label: 'Pemadam Kebakaran' },
  { value: 'red_cross', label: 'Palang Merah' },
  { value: 'other', label: 'Lainnya' },
];

const SCOPE_OPTIONS: Array<{ value: EmergencyDirectoryScope; label: string }> = [
  { value: 'national', label: 'Nasional' },
  { value: 'provincial', label: 'Provinsi' },
  { value: 'regency', label: 'Kabupaten / Kota' },
];

const VERIFICATION_OPTIONS: Array<{ value: EmergencyDirectoryVerificationStatus; label: string }> = [
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
  { value: 'source_unavailable', label: 'Source Unavailable' },
  { value: 'rejected', label: 'Rejected' },
];

const PUBLICATION_OPTIONS: Array<{ value: EmergencyDirectoryPublicationStatus; label: string }> = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const CATEGORY_LABELS: Record<EmergencyDirectoryCategory, string> = {
  disaster_management: 'Penanggulangan Bencana',
  sar: 'SAR / Evakuasi',
  police: 'Kepolisian',
  medical: 'Medis / Ambulans',
  fire: 'Pemadam Kebakaran',
  red_cross: 'Palang Merah',
  other: 'Lainnya',
};

const SCOPE_LABELS: Record<EmergencyDirectoryScope, string> = {
  national: 'Nasional',
  provincial: 'Provinsi',
  regency: 'Kabupaten / Kota',
};

function getVerificationBadge(status: EmergencyDirectoryVerificationStatus) {
  switch (status) {
    case 'verified':
      return 'bg-[#064E3B]/60 text-[#34D399] border-[#065F46]';
    case 'unverified':
      return 'bg-[#2E2208] text-[#FBBF24] border-[#78350F]';
    case 'source_unavailable':
      return 'bg-[#262626] text-[#D4D4D4] border-[#404040]';
    case 'rejected':
      return 'bg-[#450A0A]/70 text-[#F87171] border-[#7F1D1D]';
    default:
      return 'bg-[#212121] text-[#A3A3A3] border-[#343434]';
  }
}

function getPublicationBadge(status: EmergencyDirectoryPublicationStatus) {
  switch (status) {
    case 'published':
      return 'bg-[#064E3B]/60 text-[#34D399] border-[#065F46]';
    case 'draft':
      return 'bg-[#212121] text-[#D4D4D4] border-[#383838]';
    case 'archived':
      return 'bg-[#450A0A]/50 text-[#FCA5A5] border-[#7F1D1D]/60';
    default:
      return 'bg-[#212121] text-[#A3A3A3] border-[#343434]';
  }
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface ParentFormState {
  name: string;
  slug: string;
  category: EmergencyDirectoryCategory;
  scope: EmergencyDirectoryScope;
  region_id: string;
  address: string;
  latitude: string;
  longitude: string;
  description: string;
}

const EMPTY_FORM: ParentFormState = {
  name: '',
  slug: '',
  category: 'disaster_management',
  scope: 'national',
  region_id: '',
  address: '',
  latitude: '',
  longitude: '',
  description: '',
};

export const AdminEmergencyDirectoryPage: React.FC = () => {
  // List & Pagination State
  const [contacts, setContacts] = useState<AdminEmergencyContact[]>([]);
  const [stats, setStats] = useState<AdminEmergencyDirectoryStats | null>(null);
  const [meta, setMeta] = useState<PublicEmergencyDirectoryPaginationMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQ, setDebouncedQ] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<EmergencyDirectoryCategory | 'all'>('all');
  const [filterScope, setFilterScope] = useState<EmergencyDirectoryScope | 'all'>('all');
  const [filterVerification, setFilterVerification] = useState<EmergencyDirectoryVerificationStatus | 'all'>('all');
  const [filterPublication, setFilterPublication] = useState<EmergencyDirectoryPublicationStatus | 'all'>('all');
  const [filterRegionId, setFilterRegionId] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  // Region Options
  const [provinceRegions, setProvinceRegions] = useState<RegionItem[]>([]);
  const [regencyRegions, setRegencyRegions] = useState<RegionItem[]>([]);

  const { user } = useAuth();
  const canMutateChannels = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'contacts' | 'audit'>('contacts');
  const [auditRefreshNonce, setAuditRefreshNonce] = useState<number>(0);

  // Detail Modal State
  const [detailContact, setDetailContact] = useState<AdminEmergencyContact | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Create / Edit Modal State
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formState, setFormState] = useState<ParentFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<AdminEmergencyContact | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  const listAbortRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);

  // Debounce search query (300ms) and reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load province and regency regions on mount
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      publicService.getRegions({ level: 'province' }, controller.signal),
      publicService.getRegions({ level: 'regency' }, controller.signal),
    ])
      .then(([provinces, regencies]) => {
        if (Array.isArray(provinces)) setProvinceRegions(provinces);
        if (Array.isArray(regencies)) setRegencyRegions(regencies);
      })
      .catch((err) => {
        if (!isRequestCanceled(err)) {
          console.warn('Gagal memuat daftar wilayah untuk filter:', err);
        }
      });
    return () => controller.abort();
  }, []);

  const triggerReload = useCallback(() => {
    setLoading(true);
    setError(null);
    setRefreshNonce((n) => n + 1);
  }, []);

  // Fetch contacts list via async promise callbacks (zero synchronous setState in effect)
  useEffect(() => {
    if (listAbortRef.current) {
      listAbortRef.current.abort();
    }
    const controller = new AbortController();
    listAbortRef.current = controller;

    const params: AdminEmergencyDirectoryQueryParams = {
      per_page: 15,
      page,
    };
    if (debouncedQ.trim()) params.q = debouncedQ.trim();
    if (filterCategory !== 'all') params.category = filterCategory;
    if (filterScope !== 'all') params.scope = filterScope;
    if (filterVerification !== 'all') params.verification_status = filterVerification;
    if (filterPublication !== 'all') params.publication_status = filterPublication;
    if (filterRegionId !== 'all') params.region_id = Number(filterRegionId);

    adminService
      .getEmergencyContacts(params, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setContacts(res.data);
        setMeta(res.meta);
        setStats(res.stats);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (isRequestCanceled(err) || controller.signal.aborted) return;
        setContacts([]);
        setMeta(null);
        setError(getApiErrorMessage(err, 'Gagal memuat daftar kontak darurat admin.'));
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQ, filterCategory, filterScope, filterVerification, filterPublication, filterRegionId, page, refreshNonce]);

  useEffect(() => {
    return () => {
      detailAbortRef.current?.abort();
    };
  }, []);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedQ('');
    setFilterCategory('all');
    setFilterScope('all');
    setFilterVerification('all');
    setFilterPublication('all');
    setFilterRegionId('all');
    setPage(1);
  };

  // Open Detail Modal
  const handleOpenDetail = async (contact: AdminEmergencyContact) => {
    setDetailContact(contact);
    setDetailError(null);
    setDetailLoading(true);

    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;

    try {
      const fresh = await adminService.getEmergencyContactDetail(contact.id, controller.signal);
      if (!controller.signal.aborted) {
        setDetailContact(fresh);
      }
    } catch (err: unknown) {
      if (!isRequestCanceled(err)) {
        setDetailError(getApiErrorMessage(err, 'Gagal memuat detail kontak dari server.'));
      }
    } finally {
      if (!controller.signal.aborted) {
        setDetailLoading(false);
      }
    }
  };

  const handleRefreshDetailContact = async () => {
    if (!detailContact) return;
    setDetailLoading(true);
    setDetailError(null);
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;

    try {
      const fresh = await adminService.getEmergencyContactDetail(detailContact.id, controller.signal);
      if (!controller.signal.aborted) {
        setDetailContact(fresh);
        setRefreshNonce((n) => n + 1);
        setAuditRefreshNonce((n) => n + 1);
      }
    } catch (err: unknown) {
      if (!isRequestCanceled(err)) {
        setDetailError(getApiErrorMessage(err, 'Gagal menyegarkan data kanal kontak dari server.'));
      }
    } finally {
      if (!controller.signal.aborted) {
        setDetailLoading(false);
      }
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
    setFieldErrors({});
    setFormLoading(false);
    setFormModalOpen(true);
  };

  // Open Edit Modal (fetches fresh record from backend)
  const handleOpenEdit = async (contact: AdminEmergencyContact) => {
    setEditingId(contact.id);
    setFormError(null);
    setFieldErrors({});
    setFormLoading(true);
    setFormModalOpen(true);

    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;

    try {
      const fresh = await adminService.getEmergencyContactDetail(contact.id, controller.signal);
      if (controller.signal.aborted) return;
      setFormState({
        name: fresh.name ?? '',
        slug: fresh.slug ?? '',
        category: fresh.category,
        scope: fresh.scope,
        region_id: fresh.region_id !== null && fresh.region_id !== undefined ? String(fresh.region_id) : '',
        address: fresh.address ?? '',
        latitude: fresh.latitude !== null && fresh.latitude !== undefined ? String(fresh.latitude) : '',
        longitude: fresh.longitude !== null && fresh.longitude !== undefined ? String(fresh.longitude) : '',
        description: fresh.description ?? '',
      });
    } catch (err: unknown) {
      if (!isRequestCanceled(err)) {
        setFormError(getApiErrorMessage(err, 'Gagal memuat data kontak untuk diedit.'));
      }
    } finally {
      if (!controller.signal.aborted) {
        setFormLoading(false);
      }
    }
  };

  // Client-side validation matching backend rules
  const validateForm = (): string | null => {
    const errors: Record<string, string[]> = {};

    if (!formState.name.trim()) {
      errors.name = ['Nama instansi/kontak wajib diisi.'];
    } else if (formState.name.trim().length > 255) {
      errors.name = ['Nama maksimal 255 karakter.'];
    }

    if (formState.slug.trim().length > 255) {
      errors.slug = ['Slug maksimal 255 karakter.'];
    }

    if (formState.scope === 'national' && formState.region_id !== '') {
      errors.region_id = ['Kontak berskala nasional tidak boleh terikat pada wilayah tertentu.'];
    }

    if (formState.scope === 'provincial' || formState.scope === 'regency') {
      if (!formState.region_id) {
        errors.region_id = ['Wilayah wajib dipilih untuk cakupan daerah.'];
      }
    }

    if (formState.address.trim().length > 1000) {
      errors.address = ['Alamat maksimal 1000 karakter.'];
    }

    if (formState.latitude.trim() !== '') {
      const lat = Number(formState.latitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        errors.latitude = ['Latitude harus berupa angka antara -90 hingga 90.'];
      }
    }

    if (formState.longitude.trim() !== '') {
      const lon = Number(formState.longitude);
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        errors.longitude = ['Longitude harus berupa angka antara -180 hingga 180.'];
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      return errors[firstKey][0];
    }
    return null;
  };

  // Submit Create or Edit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSubmitting) return;

    const clientErr = validateForm();
    if (clientErr) {
      setFormError(clientErr);
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const payload: AdminEmergencyContactParentPayload = {
      name: formState.name.trim(),
      category: formState.category,
      scope: formState.scope,
      region_id: formState.scope === 'national' ? null : Number(formState.region_id),
      address: formState.address.trim() || null,
      latitude: formState.latitude.trim() !== '' ? Number(formState.latitude) : null,
      longitude: formState.longitude.trim() !== '' ? Number(formState.longitude) : null,
      description: formState.description.trim() || null,
    };

    if (formState.slug.trim()) {
      payload.slug = formState.slug.trim();
    }

    try {
      if (editingId === null) {
        const created = await adminService.createEmergencyContact(payload);
        toast.success(
          `Kontak '${created.name}' berhasil dibuat dengan status ${created.verification_status} / ${created.publication_status} (belum tampil di direktori publik).`
        );
      } else {
        const updated = await adminService.updateEmergencyContact(editingId, payload);
        toast.success(`Data kontak '${updated.name}' berhasil diperbarui.`);
      }
      setFormModalOpen(false);
      triggerReload();
    } catch (err: any) {
      if (err?.response?.status === 422 && err?.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
      setFormError(getApiErrorMessage(err, 'Gagal menyimpan data kontak darurat.'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm Soft Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleteSubmitting) return;

    setDeleteSubmitting(true);
    try {
      const res = await adminService.deleteEmergencyContact(deleteTarget.id);
      toast.success(res.message);
      setDeleteTarget(null);
      if (detailContact?.id === deleteTarget.id) {
        setDetailContact(null);
      }
      triggerReload();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal mengarsipkan kontak darurat.'));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Region options filtered by selected form scope
  const formRegionOptions =
    formState.scope === 'provincial'
      ? provinceRegions
      : formState.scope === 'regency'
      ? regencyRegions
      : [];

  const hasActiveFilters =
    searchInput.trim() !== '' ||
    filterCategory !== 'all' ||
    filterScope !== 'all' ||
    filterVerification !== 'all' ||
    filterPublication !== 'all' ||
    filterRegionId !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C2C2C]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B] uppercase tracking-wider mb-1">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Direktori Kontak Darurat</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] tracking-tight">
            Manajemen Kontak Darurat Nasional &amp; Daerah
          </h1>
          <p className="text-xs text-[#A3A3A3] mt-1">
            Kelola entitas induk, kanal komunikasi, verifikasi, publikasi, dan riwayat audit Emergency Directory.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0C0C] text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kontak</span>
        </button>
      </div>

      {/* Tab Switcher: Contacts vs Global Audit */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#262626] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-[#BE123C] text-white'
              : 'bg-[#161616] text-[#A3A3A3] hover:text-[#F5F5F5] border border-[#2C2C2C]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Direktori Kontak</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#BE123C] text-white'
              : 'bg-[#161616] text-[#A3A3A3] hover:text-[#F5F5F5] border border-[#2C2C2C]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat Audit Global</span>
        </button>
      </div>

      {activeTab === 'audit' ? (
        <AdminEmergencyAuditHistoryPanel
          canViewAudit={canMutateChannels}
          refreshTrigger={auditRefreshNonce}
        />
      ) : (
        <>
      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2C2C2C]">
            <span className="text-[11px] text-[#8A8A8A] block">Total Kontak</span>
            <span className="text-lg font-bold text-[#F5F5F5] font-mono">{stats.total}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2C2C2C]">
            <span className="text-[11px] text-[#8A8A8A] block">Verified</span>
            <span className="text-lg font-bold text-[#34D399] font-mono">{stats.verified}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2C2C2C]">
            <span className="text-[11px] text-[#8A8A8A] block">Unverified</span>
            <span className="text-lg font-bold text-[#FBBF24] font-mono">{stats.unverified}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2C2C2C]">
            <span className="text-[11px] text-[#8A8A8A] block">Published</span>
            <span className="text-lg font-bold text-[#34D399] font-mono">{stats.published}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2C2C2C]">
            <span className="text-[11px] text-[#8A8A8A] block">Draft</span>
            <span className="text-lg font-bold text-[#D4D4D4] font-mono">{stats.draft}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2C2C2C]">
            <span className="text-[11px] text-[#8A8A8A] block">Total Kanal</span>
            <span className="text-lg font-bold text-[#F5F5F5] font-mono">{stats.total_channels}</span>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="p-4 rounded-xl bg-[#161616] border border-[#2C2C2C] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama instansi, slug, atau deskripsi..."
              maxLength={100}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <button
            type="button"
            onClick={triggerReload}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] border border-[#343434] text-xs font-medium text-[#D4D4D4] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <select
            aria-label="Filter Kategori"
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value as EmergencyDirectoryCategory | 'all');
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
          >
            <option value="all">Semua Kategori</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter Cakupan"
            value={filterScope}
            onChange={(e) => {
              setFilterScope(e.target.value as EmergencyDirectoryScope | 'all');
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
          >
            <option value="all">Semua Cakupan</option>
            {SCOPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter Wilayah"
            value={filterRegionId}
            onChange={(e) => {
              setFilterRegionId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
          >
            <option value="all">Semua Wilayah</option>
            {provinceRegions.length > 0 && (
              <optgroup label="Provinsi">
                {provinceRegions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Provinsi)
                  </option>
                ))}
              </optgroup>
            )}
            {regencyRegions.length > 0 && (
              <optgroup label="Kabupaten / Kota">
                {regencyRegions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Kab/Kota)
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <select
            aria-label="Filter Status Verifikasi"
            value={filterVerification}
            onChange={(e) => {
              setFilterVerification(e.target.value as EmergencyDirectoryVerificationStatus | 'all');
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
          >
            <option value="all">Semua Verifikasi</option>
            {VERIFICATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter Status Publikasi"
            value={filterPublication}
            onChange={(e) => {
              setFilterPublication(e.target.value as EmergencyDirectoryPublicationStatus | 'all');
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
          >
            <option value="all">Semua Publikasi</option>
            {PUBLICATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-[11px] text-[#8A8A8A]">
            <span>Filter aktif diterapkan</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#F59E0B] hover:underline font-medium cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* List States: Loading / Error / Empty / Data Table */}
      {loading && (
        <div className="p-6 rounded-xl bg-[#161616] border border-[#2C2C2C] space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-[#212121] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="p-8 rounded-xl bg-[#2A1215] border border-[#7F1D1D] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#F87171] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Gagal Memuat Data Kontak Darurat</h3>
            <p className="text-xs text-[#FCA5A5] max-w-md mx-auto">{error}</p>
          </div>
          <button
            type="button"
            onClick={triggerReload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] border border-[#383838] text-xs font-bold text-[#F5F5F5] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {!loading && !error && contacts.length === 0 && (
        <div className="p-10 rounded-xl bg-[#161616] border border-[#2C2C2C] text-center space-y-3">
          <Info className="w-8 h-8 text-[#8A8A8A] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#F5F5F5]">
              {hasActiveFilters ? 'Tidak Ada Kontak yang Cocok dengan Filter' : 'Belum Ada Kontak Darurat'}
            </h3>
            <p className="text-xs text-[#8A8A8A] max-w-md mx-auto">
              {hasActiveFilters
                ? 'Ubah kata kunci pencarian atau reset filter untuk melihat seluruh data.'
                : 'Klik tombol Tambah Kontak untuk mendaftarkan entitas instansi darurat baru.'}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] border border-[#383838] text-xs font-semibold text-[#F5F5F5] cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      )}

      {!loading && !error && contacts.length > 0 && (
        <div className="rounded-xl bg-[#161616] border border-[#2C2C2C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2C2C2C] bg-[#121212] text-[#8A8A8A] uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-3 px-4">Instansi &amp; Alamat</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Cakupan &amp; Wilayah</th>
                  <th className="py-3 px-3">Verifikasi</th>
                  <th className="py-3 px-3">Publikasi</th>
                  <th className="py-3 px-3">Diperbarui</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1C1C1C] transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-[#F5F5F5]">{c.name}</div>
                      <div className="text-[11px] font-mono text-[#737373]">{c.slug}</div>
                      {c.address && (
                        <div className="text-[11px] text-[#A3A3A3] truncate mt-0.5" title={c.address}>
                          {c.address}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-[#D4D4D4]">
                      {CATEGORY_LABELS[c.category] || c.category}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-[#F5F5F5] font-medium">{SCOPE_LABELS[c.scope] || c.scope}</div>
                      {c.region && (
                        <div className="text-[11px] text-[#8A8A8A] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{c.region.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold ${getVerificationBadge(
                          c.verification_status
                        )}`}
                      >
                        {c.verification_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold ${getPublicationBadge(
                          c.publication_status
                        )}`}
                      >
                        {c.publication_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[11px] text-[#A3A3A3] whitespace-nowrap">
                      {formatDateTime(c.updated_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleOpenDetail(c)}
                          title="Lihat Detail"
                          className="p-1.5 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] border border-[#343434] text-[#D4D4D4] hover:text-white cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleOpenEdit(c)}
                          title="Edit Kontak Induk"
                          className="p-1.5 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] border border-[#343434] text-[#F59E0B] hover:text-[#FBBF24] cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          title="Arsipkan (Soft Delete)"
                          className="p-1.5 rounded-lg bg-[#212121] hover:bg-[#450A0A] border border-[#343434] hover:border-[#7F1D1D] text-[#F87171] cursor-pointer"
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

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="px-4 py-3 border-t border-[#2C2C2C] bg-[#121212] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A3A3A3]">
              <span>
                Halaman <strong className="text-[#F5F5F5]">{meta.current_page}</strong> dari{' '}
                <strong className="text-[#F5F5F5]">{meta.last_page}</strong> (Total {meta.total} kontak)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] disabled:opacity-40 disabled:cursor-not-allowed border border-[#343434] text-[#F5F5F5] cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>
                <button
                  type="button"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] disabled:opacity-40 disabled:cursor-not-allowed border border-[#343434] text-[#F5F5F5] cursor-pointer"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* =================================================================== */}
      {/* DETAIL MODAL                                                        */}
      {/* =================================================================== */}
      <Modal
        isOpen={detailContact !== null}
        onClose={() => setDetailContact(null)}
        title={detailContact?.name || 'Detail Kontak Darurat'}
        description={detailContact ? `ID #${detailContact.id} · ${detailContact.slug}` : undefined}
        size="xl"
        theme="dark"
        footer={
          <button
            type="button"
            onClick={() => setDetailContact(null)}
            className="px-4 py-2 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] border border-[#343434] text-xs font-bold text-[#F5F5F5] cursor-pointer"
          >
            Tutup
          </button>
        }
      >
        {detailContact && (
          <div className="space-y-4 text-xs">
            {detailLoading && (
              <div className="text-[11px] font-mono text-[#F59E0B] animate-pulse">
                Menyinkronkan data terbaru dari backend...
              </div>
            )}
            {detailError && (
              <div className="p-3 rounded-lg bg-[#2A1215] border border-[#7F1D1D] text-[#FCA5A5]">
                {detailError}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#161616] border border-[#2C2C2C]">
                <span className="text-[10px] text-[#8A8A8A] block">Kategori</span>
                <span className="font-semibold text-[#F5F5F5]">
                  {CATEGORY_LABELS[detailContact.category] || detailContact.category}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#161616] border border-[#2C2C2C]">
                <span className="text-[10px] text-[#8A8A8A] block">Cakupan</span>
                <span className="font-semibold text-[#F5F5F5]">
                  {SCOPE_LABELS[detailContact.scope] || detailContact.scope}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#161616] border border-[#2C2C2C]">
                <span className="text-[10px] text-[#8A8A8A] block">Verifikasi</span>
                <span className="font-mono font-semibold text-[#F5F5F5]">
                  {detailContact.verification_status}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#161616] border border-[#2C2C2C]">
                <span className="text-[10px] text-[#8A8A8A] block">Publikasi</span>
                <span className="font-mono font-semibold text-[#F5F5F5]">
                  {detailContact.publication_status}
                </span>
              </div>
            </div>

            {detailContact.region && (
              <div className="p-3 rounded-lg bg-[#161616] border border-[#2C2C2C] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>
                  Wilayah: <strong className="text-[#F5F5F5]">{detailContact.region.name}</strong> ({detailContact.region.level})
                </span>
              </div>
            )}

            {detailContact.address && (
              <div className="p-3 rounded-lg bg-[#161616] border border-[#2C2C2C] flex items-start gap-2">
                <Building2 className="w-4 h-4 text-[#8A8A8A] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#F5F5F5] block">Alamat:</span>
                  <span className="text-[#A3A3A3]">{detailContact.address}</span>
                </div>
              </div>
            )}

            {(detailContact.latitude !== null || detailContact.longitude !== null) && (
              <div className="text-[11px] font-mono text-[#8A8A8A]">
                Koordinat: {detailContact.latitude ?? '-'}, {detailContact.longitude ?? '-'}
              </div>
            )}

            {detailContact.description && (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase">Deskripsi</span>
                <p className="text-[#D4D4D4] leading-relaxed">{detailContact.description}</p>
              </div>
            )}

            <AdminEmergencyGovernanceBar
              contact={detailContact}
              canMutate={canMutateChannels}
              onRefreshContact={handleRefreshDetailContact}
            />

            <AdminEmergencyChannelsSection
              contact={detailContact}
              canMutate={canMutateChannels}
              loading={detailLoading}
              onRefreshContact={handleRefreshDetailContact}
            />

            <AdminEmergencyAuditHistoryPanel
              contactId={detailContact.id}
              canViewAudit={canMutateChannels}
              refreshTrigger={auditRefreshNonce}
            />

            <div className="p-2.5 rounded-lg bg-[#161616] border border-[#2C2C2C] flex items-center justify-end text-[11px] text-[#8A8A8A]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Diperbarui: {formatDateTime(detailContact.updated_at)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* =================================================================== */}
      {/* CREATE / EDIT PARENT CONTACT MODAL                                  */}
      {/* =================================================================== */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => !formSubmitting && setFormModalOpen(false)}
        title={editingId === null ? 'Tambah Kontak Darurat Baru' : 'Edit Data Induk Kontak Darurat'}
        description={
          editingId === null
            ? 'Kontak baru akan disimpan dengan status default unverified & draft.'
            : 'Perubahan hanya memperbarui data induk dan tidak menimpa kanal komunikasi.'
        }
        size="lg"
        theme="dark"
        closeOnBackdropClick={!formSubmitting}
      >
        {formLoading ? (
          <div className="py-10 text-center text-xs text-[#A3A3A3]">Memuat data kontak dari backend...</div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 rounded-lg bg-[#2A1215] border border-[#7F1D1D] text-[#FCA5A5] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label htmlFor="ec-name" className="block font-semibold text-[#D4D4D4]">
                  Nama Instansi / Lembaga <span className="text-[#F87171]">*</span>
                </label>
                <input
                  id="ec-name"
                  type="text"
                  required
                  maxLength={255}
                  value={formState.name}
                  onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Contoh: BPBD Provinsi Jawa Barat"
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
                />
                {fieldErrors.name && <p className="text-[11px] text-[#F87171]">{fieldErrors.name[0]}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="ec-slug" className="block font-semibold text-[#D4D4D4]">
                  Slug {editingId === null ? '(Opsional)' : '*'}
                </label>
                <input
                  id="ec-slug"
                  type="text"
                  required={editingId !== null}
                  maxLength={255}
                  value={formState.slug}
                  onChange={(e) => setFormState((s) => ({ ...s, slug: e.target.value }))}
                  placeholder="bpbd-jawa-barat"
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] font-mono focus:outline-none focus:border-[#F59E0B]"
                />
                {fieldErrors.slug && <p className="text-[11px] text-[#F87171]">{fieldErrors.slug[0]}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="ec-category" className="block font-semibold text-[#D4D4D4]">
                  Kategori <span className="text-[#F87171]">*</span>
                </label>
                <select
                  id="ec-category"
                  value={formState.category}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, category: e.target.value as EmergencyDirectoryCategory }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && <p className="text-[11px] text-[#F87171]">{fieldErrors.category[0]}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="ec-scope" className="block font-semibold text-[#D4D4D4]">
                  Cakupan Wilayah <span className="text-[#F87171]">*</span>
                </label>
                <select
                  id="ec-scope"
                  value={formState.scope}
                  onChange={(e) => {
                    const nextScope = e.target.value as EmergencyDirectoryScope;
                    setFormState((s) => ({
                      ...s,
                      scope: nextScope,
                      region_id: '',
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
                >
                  {SCOPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.scope && <p className="text-[11px] text-[#F87171]">{fieldErrors.scope[0]}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="ec-region" className="block font-semibold text-[#D4D4D4]">
                  Wilayah {formState.scope !== 'national' && <span className="text-[#F87171]">*</span>}
                </label>
                <select
                  id="ec-region"
                  disabled={formState.scope === 'national'}
                  value={formState.scope === 'national' ? '' : formState.region_id}
                  onChange={(e) => setFormState((s) => ({ ...s, region_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] disabled:opacity-50 focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="">
                    {formState.scope === 'national'
                      ? 'Tidak berlaku untuk skala Nasional'
                      : 'Pilih wilayah...'}
                  </option>
                  {formRegionOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.region_id && <p className="text-[11px] text-[#F87171]">{fieldErrors.region_id[0]}</p>}
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label htmlFor="ec-address" className="block font-semibold text-[#D4D4D4]">
                  Alamat Kantor / Posko
                </label>
                <input
                  id="ec-address"
                  type="text"
                  maxLength={1000}
                  value={formState.address}
                  onChange={(e) => setFormState((s) => ({ ...s, address: e.target.value }))}
                  placeholder="Jl. ..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
                />
                {fieldErrors.address && <p className="text-[11px] text-[#F87171]">{fieldErrors.address[0]}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="ec-lat" className="block font-semibold text-[#D4D4D4]">
                  Latitude (-90 s.d. 90)
                </label>
                <input
                  id="ec-lat"
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={formState.latitude}
                  onChange={(e) => setFormState((s) => ({ ...s, latitude: e.target.value }))}
                  placeholder="-6.200000"
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] font-mono focus:outline-none focus:border-[#F59E0B]"
                />
                {fieldErrors.latitude && <p className="text-[11px] text-[#F87171]">{fieldErrors.latitude[0]}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="ec-lon" className="block font-semibold text-[#D4D4D4]">
                  Longitude (-180 s.d. 180)
                </label>
                <input
                  id="ec-lon"
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={formState.longitude}
                  onChange={(e) => setFormState((s) => ({ ...s, longitude: e.target.value }))}
                  placeholder="106.816666"
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] font-mono focus:outline-none focus:border-[#F59E0B]"
                />
                {fieldErrors.longitude && <p className="text-[11px] text-[#F87171]">{fieldErrors.longitude[0]}</p>}
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label htmlFor="ec-desc" className="block font-semibold text-[#D4D4D4]">
                  Deskripsi Layanan
                </label>
                <textarea
                  id="ec-desc"
                  rows={3}
                  value={formState.description}
                  onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Tugas pokok atau cakupan layanan instansi..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
                />
                {fieldErrors.description && <p className="text-[11px] text-[#F87171]">{fieldErrors.description[0]}</p>}
              </div>
            </div>

            <div className="pt-3 border-t border-[#2C2C2C] flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={formSubmitting}
                onClick={() => setFormModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] border border-[#343434] font-semibold text-[#D4D4D4] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 font-bold text-[#0C0C0C] cursor-pointer"
              >
                {formSubmitting ? 'Menyimpan...' : editingId === null ? 'Simpan Kontak Baru' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* =================================================================== */}
      {/* SOFT DELETE CONFIRMATION MODAL                                      */}
      {/* =================================================================== */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => !deleteSubmitting && setDeleteTarget(null)}
        title="Konfirmasi Arsipkan Kontak (Soft Delete)"
        size="sm"
        theme="dark"
        closeOnBackdropClick={!deleteSubmitting}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={deleteSubmitting}
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] border border-[#343434] text-xs font-semibold text-[#D4D4D4] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={deleteSubmitting}
              onClick={() => void handleConfirmDelete()}
              className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
            >
              {deleteSubmitting ? 'Mengarsipkan...' : 'Ya, Arsipkan Kontak'}
            </button>
          </div>
        }
      >
        {deleteTarget && (
          <div className="space-y-3 text-xs text-[#D4D4D4]">
            <p>
              Anda akan mengarsipkan kontak darurat: <strong className="text-white">{deleteTarget.name}</strong>
            </p>
            <p className="p-3 rounded-lg bg-[#2A1215] border border-[#7F1D1D] text-[#FCA5A5] leading-relaxed">
              Tindakan ini melakukan <strong>soft delete</strong> pada record kontak induk dan menghapusnya dari
              visibilitas direktori publik. Data histori tetap tersimpan untuk audit trail.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminEmergencyDirectoryPage;
