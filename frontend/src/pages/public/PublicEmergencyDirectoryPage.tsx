import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { publicService } from '../../services/public-service';
import { ScrollWordTitle } from '../../components/shared/ScrollWordTitle';
import type {
  PublicEmergencyContact,
  PublicEmergencyContactChannel,
  PublicEmergencyDirectoryQueryParams,
  PublicEmergencyDirectoryPaginationMeta,
  EmergencyDirectoryCategory,
  EmergencyDirectoryScope,
  EmergencyDirectoryChannelClassification,
  RegionItem,
} from '../../types';
import {
  Phone,
  PhoneCall,
  Globe,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Building2,
  ExternalLink,
  Clock,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

const CATEGORY_OPTIONS: Array<{ value: EmergencyDirectoryCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'disaster_management', label: 'Penanggulangan Bencana' },
  { value: 'sar', label: 'SAR / Evakuasi' },
  { value: 'police', label: 'Kepolisian' },
  { value: 'medical', label: 'Medis / Ambulans' },
  { value: 'fire', label: 'Pemadam Kebakaran' },
  { value: 'red_cross', label: 'Palang Merah' },
  { value: 'other', label: 'Lainnya' },
];

const SCOPE_OPTIONS: Array<{ value: EmergencyDirectoryScope | 'all'; label: string }> = [
  { value: 'all', label: 'Semua Cakupan' },
  { value: 'national', label: 'Nasional' },
  { value: 'provincial', label: 'Provinsi' },
  { value: 'regency', label: 'Kabupaten / Kota' },
];

const CATEGORY_META: Record<EmergencyDirectoryCategory, { label: string; badgeClass: string }> = {
  disaster_management: {
    label: 'Penanggulangan Bencana',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
  },
  sar: {
    label: 'Pencarian & Pertolongan (SAR)',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
  },
  police: {
    label: 'Kepolisian & Keamanan',
    badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-800/60',
  },
  medical: {
    label: 'Gawat Darurat Medis',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
  },
  fire: {
    label: 'Pemadam Kebakaran',
    badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-800/60',
  },
  red_cross: {
    label: 'Palang Merah & Donor',
    badgeClass: 'bg-red-950/80 text-red-300 border-red-800/60',
  },
  other: {
    label: 'Layanan Darurat Lainnya',
    badgeClass: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  },
};

const SCOPE_META: Record<EmergencyDirectoryScope, { label: string; badgeClass: string }> = {
  national: {
    label: 'Nasional',
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-800/50',
  },
  provincial: {
    label: 'Provinsi',
    badgeClass: 'bg-sky-950/70 text-sky-300 border-sky-800/50',
  },
  regency: {
    label: 'Kabupaten/Kota',
    badgeClass: 'bg-teal-950/70 text-teal-300 border-teal-800/50',
  },
};

const CLASSIFICATION_LABELS: Record<EmergencyDirectoryChannelClassification, string> = {
  emergency_hotline: 'Hotline Darurat',
  operational_contact: 'Kontak Operasional',
  office_contact: 'Sekretariat / Kantor',
  informational_contact: 'Layanan Informasi',
};

// ============================================================================
// SECURITY VALIDATION UTILITIES FOR CHANNEL LINKS
// ============================================================================

/**
 * Validates phone or shortcode value before creating a tel: URI.
 * Rejects arbitrary strings, scripts, or non-telephonic data.
 */
function validatePhoneOrShortcode(value: string, channelType: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();

  if (channelType === 'shortcode') {
    const cleanDigits = trimmed.replace(/\D/g, '');
    if (/^[0-9]{3,6}$/.test(cleanDigits)) {
      return cleanDigits;
    }
    return null;
  }

  // General phone number: digits, parentheses, hyphens, optional leading plus
  const cleanPhone = trimmed.replace(/[\s()-]/g, '');
  if (/^\+?[0-9]{5,16}$/.test(cleanPhone)) {
    return cleanPhone;
  }
  return null;
}

/**
 * Validates email address format before creating mailto: URI.
 */
function validateEmail(value: string): boolean {
  if (!value) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim());
}

/**
 * Strictly validates website URL.
 * ONLY permits https: protocol. Rejects javascript:, data:, protocol-relative (//), etc.
 */
function validateHttpsWebsite(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' && parsed.hostname && parsed.hostname.length > 2) {
      return parsed.href;
    }
  } catch {
    // If user provided naked domain without protocol, reject it to avoid assuming or opening wrong targets
    return null;
  }
  return null;
}

/**
 * Sanitizes and validates Indonesian WhatsApp phone numbers.
 * Converts 08xx to 628xx and verifies length before creating wa.me URI.
 */
function validateWhatsApp(value: string): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;

  const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
  if (/^62[0-9]{8,13}$/.test(normalized)) {
    return `https://wa.me/${normalized}`;
  }
  return null;
}

function formatDate(isoStr: string | null): string | null {
  if (!isoStr) return null;
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoStr));
  } catch {
    return null;
  }
}

export const PublicEmergencyDirectoryPage: React.FC = () => {
  const [contacts, setContacts] = useState<PublicEmergencyContact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PublicEmergencyDirectoryPaginationMeta>({
    current_page: 1,
    per_page: 12,
    total: 0,
    last_page: 1,
  });

  // Filter & Search states
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQ, setDebouncedQ] = useState<string>('');
  const [category, setCategory] = useState<EmergencyDirectoryCategory | 'all'>('all');
  const [scope, setScope] = useState<EmergencyDirectoryScope | 'all'>('all');
  const [regionId, setRegionId] = useState<number | 'all'>('all');
  const [page, setPage] = useState<number>(1);

  // Region options (province and regency levels)
  const [provinceRegions, setProvinceRegions] = useState<RegionItem[]>([]);
  const [regencyRegions, setRegencyRegions] = useState<RegionItem[]>([]);

  // Selected contact for detail modal
  const [selectedContact, setSelectedContact] = useState<PublicEmergencyContact | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);

  // Debounce search query input (300ms) and reset page
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Load province and regency regions on mount (separate requests because backend filters 1 level per request)
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
        if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          return;
        }
        console.warn('Could not load regions for filter:', err);
      });

    return () => {
      controller.abort();
    };
  }, []);

  // Fetch emergency contacts from API
  const fetchContacts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params: PublicEmergencyDirectoryQueryParams = {
        per_page: 12,
        page,
      };
      if (debouncedQ.trim()) params.q = debouncedQ.trim();
      if (category !== 'all') params.category = category;
      if (scope !== 'all') params.scope = scope;
      if (regionId !== 'all') params.region_id = regionId;

      const res = await publicService.getEmergencyContacts(params, controller.signal);
      setContacts(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to load emergency contacts:', err);
      setError('Gagal memuat direktori kontak darurat resmi dari server. Silakan coba lagi.');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, category, scope, regionId, page]);

  useEffect(() => {
    fetchContacts();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (detailAbortRef.current) {
        detailAbortRef.current.abort();
      }
    };
  }, [fetchContacts]);

  // Handle open contact detail modal
  const handleOpenDetail = async (contact: PublicEmergencyContact) => {
    setSelectedContact(contact);
    setDetailError(null);
    setDetailLoading(true);

    if (detailAbortRef.current) {
      detailAbortRef.current.abort();
    }
    const controller = new AbortController();
    detailAbortRef.current = controller;

    try {
      const detail = await publicService.getEmergencyContactDetail(
        contact.slug || contact.id,
        controller.signal
      );
      if (detail) {
        setSelectedContact(detail);
      }
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      console.warn('Failed to refresh detail from backend:', err);
      if (err.response?.status === 404) {
        setDetailError('Kontak darurat ini sudah tidak ditemukan atau belum dipublikasikan oleh otoritas.');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedQ('');
    setCategory('all');
    setScope('all');
    setRegionId('all');
    setPage(1);
  };

  // Safe Channel action renderer
  const renderChannelAction = (channel: PublicEmergencyContactChannel, isLarge = false) => {
    const isEmergency = channel.channel_classification === 'emergency_hotline';

    switch (channel.channel_type) {
      case 'shortcode':
      case 'phone': {
        const validTel = validatePhoneOrShortcode(channel.value, channel.channel_type);
        if (!validTel) {
          return (
            <span className="font-mono text-xs text-neutral-400 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
              {channel.value}
            </span>
          );
        }

        return (
          <a
            href={`tel:${validTel}`}
            className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-all ${
              isLarge
                ? isEmergency
                  ? 'px-4 py-2 text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                  : 'px-3.5 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700'
                : isEmergency
                ? 'px-3 py-1.5 text-xs bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200'
                : 'px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200'
            }`}
            title={`Hubungi ${channel.label} (${channel.value})`}
          >
            {isEmergency ? <PhoneCall className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
            <span className="font-mono">{channel.value}</span>
          </a>
        );
      }

      case 'whatsapp': {
        const validWaUrl = validateWhatsApp(channel.value);
        if (!validWaUrl) {
          return (
            <span className="font-mono text-xs text-neutral-400 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
              {channel.value}
            </span>
          );
        }

        return (
          <a
            href={validWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-xl font-semibold transition-all ${
              isLarge
                ? 'px-3.5 py-1.5 text-xs bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/70 text-emerald-200'
                : 'px-2.5 py-1 text-xs bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-300'
            }`}
            title={`Buka WhatsApp ${channel.value}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="font-mono">{channel.value}</span>
          </a>
        );
      }

      case 'email': {
        const isValidEmail = validateEmail(channel.value);
        if (!isValidEmail) {
          return (
            <span className="text-xs text-neutral-400 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
              {channel.value}
            </span>
          );
        }

        return (
          <a
            href={`mailto:${channel.value.trim()}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 transition-colors"
            title={`Kirim email ke ${channel.value}`}
          >
            <Mail className="w-3.5 h-3.5 text-neutral-400" />
            <span className="truncate max-w-[180px]">{channel.value}</span>
          </a>
        );
      }

      case 'website': {
        const validHttps = validateHttpsWebsite(channel.value);
        if (!validHttps) {
          return (
            <span className="text-xs text-neutral-400 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
              {channel.value}
            </span>
          );
        }

        return (
          <a
            href={validHttps}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 transition-colors"
            title="Buka portal resmi"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <span className="truncate max-w-[180px]">Portal Resmi</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>
        );
      }

      default:
        // Unknown or unsupported channel types render strictly as plain text
        return (
          <span className="font-mono text-xs text-neutral-300 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800">
            {channel.value}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-neutral-100">
      {/* ========================================================================= */}
      {/* 1. HERO & DIRECTORY TITLE                                                 */}
      {/* ========================================================================= */}
      <section aria-labelledby="directory-heading" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            DIREKTORI RESMI OTORITAS
          </span>
          <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800">
            Terverifikasi Backend
          </span>
        </div>

        <div className="space-y-2">
          <ScrollWordTitle as="h1" className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Direktori Kontak Darurat &amp; Tanggap Bencana
          </ScrollWordTitle>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
            Daftar resmi kontak siaga darurat, pusat komando operasi penanggulangan bencana, pencarian dan pertolongan
            (SAR), medis, dan kepolisian di Indonesia yang telah terverifikasi secara resmi oleh otoritas platform.
          </p>
        </div>

        {/* Verification Guarantee Alert Note */}
        <div className="p-3.5 rounded-2xl bg-[#121614] border border-neutral-800 text-xs text-neutral-300 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-white block">Jaminan Kredibilitas Informasi:</span>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Seluruh nomor, tautan, dan kanal komunikasi dalam direktori ini diperoleh langsung dari basis data resmi
              SENTRAVAX yang lolos uji verifikasi. Data draf, tidak aktif, atau tidak lolos verifikasi tidak pernah
              ditampilkan.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FILTER & SEARCH CONTROL BAR                                            */}
      {/* ========================================================================= */}
      <section aria-label="Filter dan Pencarian" className="p-4 rounded-2xl bg-[#111413] border border-neutral-800 space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama instansi, nomor telepon, atau deskripsi layanan..."
            maxLength={100}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0a0c0b] border border-neutral-700/80 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
              aria-label="Hapus kata kunci pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-400 block">Kategori Layanan</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as EmergencyDirectoryCategory | 'all');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0c0b] border border-neutral-700/80 text-neutral-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Scope Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-400 block">Cakupan Wilayah</label>
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as EmergencyDirectoryScope | 'all');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0c0b] border border-neutral-700/80 text-neutral-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter (Province & Regency Levels) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-400 block">Wilayah Administratif</label>
            <select
              value={regionId}
              onChange={(e) => {
                const val = e.target.value;
                setRegionId(val === 'all' ? 'all' : Number(val));
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0c0b] border border-neutral-700/80 text-neutral-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Wilayah (Termasuk Nasional)</option>
              {provinceRegions.length > 0 && (
                <optgroup label="Tingkat Provinsi">
                  {provinceRegions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name} (Provinsi)
                    </option>
                  ))}
                </optgroup>
              )}
              {regencyRegions.length > 0 && (
                <optgroup label="Tingkat Kabupaten / Kota">
                  {regencyRegions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name} (Kab/Kota)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Active Filter Counter & Quick Reset */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-[11px] text-neutral-400">
          <span>
            Menampilkan <strong className="text-white">{contacts.length}</strong> dari{' '}
            <strong className="text-white">{meta.total}</strong> instansi terdaftar
          </span>
          {(searchInput || category !== 'all' || scope !== 'all' || regionId !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-2"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CONTACT DIRECTORY LIST & STATES                                       */}
      {/* ========================================================================= */}
      <section aria-label="Daftar Kontak Darurat" className="space-y-4">
        {/* Loading State: Skeleton Cards */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#121614] border border-neutral-800 animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-neutral-800 rounded-md" />
                  <div className="h-4 w-16 bg-neutral-800 rounded-md" />
                </div>
                <div className="h-6 w-3/4 bg-neutral-800 rounded-md" />
                <div className="h-10 w-full bg-neutral-800/60 rounded-md" />
                <div className="h-8 w-1/2 bg-neutral-800/80 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error State with Retry Button (Fail-Closed, No Mock Fallback) */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-900/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Gagal Memuat Direktori Kontak</h3>
              <p className="text-xs text-rose-200/90 max-w-md mx-auto leading-relaxed">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchContacts}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang Data</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && contacts.length === 0 && (
          <div className="p-12 rounded-3xl bg-[#121614] border border-neutral-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-700 text-neutral-400 flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Tidak Ada Kontak yang Cocok</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                Tidak ditemukan kontak darurat resmi yang memenuhi kriteria pencarian dan filter saat ini.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <span>Tampilkan Semua Kontak</span>
            </button>
          </div>
        )}

        {/* Data Cards Grid */}
        {!loading && !error && contacts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((contact) => {
              const catMeta = CATEGORY_META[contact.category] || CATEGORY_META.other;
              const scpMeta = SCOPE_META[contact.scope] || SCOPE_META.national;
              const hotlines = contact.channels.filter((c) => c.channel_classification === 'emergency_hotline');
              const operational = contact.channels.filter((c) => c.channel_classification !== 'emergency_hotline');

              return (
                <div
                  key={contact.id}
                  className="p-5 rounded-2xl bg-[#111413] border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${catMeta.badgeClass}`}
                        >
                          {catMeta.label}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${scpMeta.badgeClass}`}
                        >
                          {scpMeta.label}
                        </span>
                      </div>
                      {contact.region && (
                        <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-500" />
                          {contact.region.name}
                        </span>
                      )}
                    </div>

                    {/* Contact Name & Description */}
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {contact.name}
                      </h2>
                      {contact.description && (
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mt-1">
                          {contact.description}
                        </p>
                      )}
                    </div>

                    {/* Channels Section: Strictly Separated */}
                    <div className="space-y-2.5 pt-2 border-t border-neutral-800/60">
                      {/* 1. Emergency Hotlines (High Priority) */}
                      {hotlines.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider block">
                            Hotline Darurat Resmi:
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {hotlines.map((ch) => (
                              <div key={ch.id} className="flex items-center gap-1.5">
                                {renderChannelAction(ch)}
                                {ch.is_toll_free && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                                    Bebas Pulsa
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Operational / Office Contacts */}
                      {operational.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono font-semibold text-neutral-400 uppercase tracking-wider block">
                            Kontak Operasional &amp; Layanan:
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {operational.slice(0, 3).map((ch) => (
                              <div key={ch.id} className="flex items-center gap-1.5">
                                {renderChannelAction(ch)}
                              </div>
                            ))}
                            {operational.length > 3 && (
                              <span className="text-[10px] text-neutral-500 self-center">
                                +{operational.length - 3} kanal lainnya
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Detail Button & Quick Meta */}
                  <div className="pt-3 border-t border-neutral-800/70 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {contact.channels.length} kanal terverifikasi
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(contact)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 font-semibold text-white transition-colors cursor-pointer text-xs"
                    >
                      <span>Lihat Rincian</span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {!loading && !error && meta.last_page > 1 && (
          <div className="p-4 rounded-2xl bg-[#111413] border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-neutral-400 font-medium">
              Halaman <strong className="text-white">{meta.current_page}</strong> dari{' '}
              <strong className="text-white">{meta.last_page}</strong> (Total {meta.total} instansi)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-700 text-neutral-200 transition-colors cursor-pointer font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((prev) => Math.min(prev + 1, meta.last_page))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-700 text-neutral-200 transition-colors cursor-pointer font-semibold"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. DETAIL MODAL DIALOG                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedContact && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
            onClick={() => setSelectedContact(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#141414] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#2a2a2a] text-neutral-100 relative space-y-6 my-8 max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-contact-title"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
                aria-label="Tutup rincian kontak"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Error State */}
              {detailError && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Status Catatan:</span>
                    <span>{detailError}</span>
                  </div>
                </div>
              )}

              {/* Modal Header */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                      CATEGORY_META[selectedContact.category]?.badgeClass || CATEGORY_META.other.badgeClass
                    }`}
                  >
                    {CATEGORY_META[selectedContact.category]?.label || selectedContact.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                      SCOPE_META[selectedContact.scope]?.badgeClass || SCOPE_META.national.badgeClass
                    }`}
                  >
                    {SCOPE_META[selectedContact.scope]?.label || selectedContact.scope}
                  </span>
                  {selectedContact.region && (
                    <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      {selectedContact.region.name}
                    </span>
                  )}
                </div>

                <h3 id="modal-contact-title" className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {selectedContact.name}
                </h3>

                {selectedContact.description && (
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                    {selectedContact.description}
                  </p>
                )}

                {selectedContact.address && (
                  <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 text-xs text-neutral-300 flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Alamat Kantor / Markas:</span>
                      <span className="text-neutral-400">{selectedContact.address}</span>
                      {selectedContact.latitude && selectedContact.longitude && (
                        <span className="text-[10px] font-mono text-neutral-500 block mt-0.5">
                          Koordinat: {selectedContact.latitude.toFixed(6)}, {selectedContact.longitude.toFixed(6)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Channels Breakdown */}
              <div className="space-y-4 pt-2 border-t border-neutral-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Daftar Kanal Komunikasi Terverifikasi</span>
                  {detailLoading && (
                    <span className="text-[10px] font-mono text-neutral-500 animate-pulse">Menyinkronkan...</span>
                  )}
                </h4>

                <div className="space-y-3">
                  {selectedContact.channels.map((channel) => {
                    const isHotline = channel.channel_classification === 'emergency_hotline';
                    const verifiedDate = formatDate(channel.verified_at);
                    const validSourceUrl = channel.source_url ? validateHttpsWebsite(channel.source_url) : null;

                    return (
                      <div
                        key={channel.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isHotline
                            ? 'bg-rose-950/20 border-rose-900/50'
                            : 'bg-neutral-900/60 border-neutral-800/80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{channel.label}</span>
                              {channel.is_primary && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  Kanal Utama
                                </span>
                              )}
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                  isHotline
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                }`}
                              >
                                {CLASSIFICATION_LABELS[channel.channel_classification] ||
                                  channel.channel_classification}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-neutral-400 block">{channel.value}</span>
                          </div>

                          <div className="shrink-0">{renderChannelAction(channel, true)}</div>
                        </div>

                        {/* Operational Details & Proof */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-400">
                          {/* Jam Operasional: Hanya tampilkan jika eksplisit, jangan asumsikan jam dinas */}
                          {channel.operating_hours?.trim() ? (
                            <div className="flex items-center gap-1.5 text-neutral-300">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span>{channel.operating_hours.trim()}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-neutral-500">
                              <Clock className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                              <span>Jam operasional belum tersedia</span>
                            </div>
                          )}

                          {/* Bebas Pulsa: Hanya klaim jika boolean true */}
                          {channel.is_toll_free === true ? (
                            <div className="flex items-center gap-1.5 text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-semibold">Bebas Pulsa Terverifikasi</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-neutral-500">
                              <Info className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                              <span>Tarif reguler operator telekomunikasi</span>
                            </div>
                          )}

                          {/* Sumber Verifikasi */}
                          {channel.source_name && (
                            <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5 pt-1 text-neutral-400">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Sumber:</span>
                              {validSourceUrl ? (
                                <a
                                  href={validSourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 underline font-medium inline-flex items-center gap-1"
                                >
                                  <span>{channel.source_name}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-neutral-300 font-medium">{channel.source_name}</span>
                              )}
                              {verifiedDate && <span className="text-neutral-500">({verifiedDate})</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <span className="text-[11px] font-mono text-neutral-500">
                  Data resmi platform SENTRAVAX SIAGA
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 font-bold text-white transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicEmergencyDirectoryPage;
