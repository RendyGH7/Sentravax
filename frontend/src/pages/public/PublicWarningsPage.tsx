import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ScrollWordTitle } from '../../components/shared/ScrollWordTitle';
import {
  BellRing,
  ShieldAlert,
  AlertTriangle,
  Search,
  X,
  RotateCcw,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
  Layers,
  Filter,
  Compass,
  Radio,
  Activity,
  Waves,
  CloudLightning,
  Mountain,
  Anchor,
} from 'lucide-react';

import { publicService } from '../../services/public-service';
import { PATHS } from '../../app/router/paths';
import type {
  AlertItem,
  AlertsQueryParams,
  HazardTypeItem,
  RegionItem,
  BroadcastLevel,
  AlertClass,
  AlertStatus,
} from '../../types/disaster';
import { EmptyState } from '../../components/ui/EmptyState';

// Safe date formatter for Indonesian locale (WIB)
function formatAlertDate(dateStr?: string | null): string {
  if (!dateStr) return 'Waktu tidak tersedia';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(d);
  } catch {
    return dateStr;
  }
}

// Direct JSX icon renderer per hazard slug
function renderHazardIcon(slug?: string, className: string = 'w-4 h-4') {
  switch (slug) {
    case 'earthquake':
      return <Activity className={className} />;
    case 'flood':
      return <Waves className={className} />;
    case 'extreme_weather':
      return <CloudLightning className={className} />;
    case 'landslide':
      return <Mountain className={className} />;
    case 'coastal_flood':
      return <Anchor className={className} />;
    default:
      return <AlertTriangle className={className} />;
  }
}

// Badge styling per broadcast level (Matte dark tokens)
function getBroadcastBadge(level: BroadcastLevel | null) {
  switch (level) {
    case 'national':
      return {
        label: 'Siaran Nasional',
        badgeClass: 'bg-purple-950/80 text-purple-200 border-purple-800/60',
        dotClass: 'bg-purple-400',
      };
    case 'regional':
      return {
        label: 'Siaran Regional',
        badgeClass: 'bg-indigo-950/80 text-indigo-200 border-indigo-800/60',
        dotClass: 'bg-indigo-400',
      };
    case 'local':
      return {
        label: 'Siaran Lokal',
        badgeClass: 'bg-sky-950/80 text-sky-200 border-sky-800/60',
        dotClass: 'bg-sky-400',
      };
    default:
      return {
        label: 'Siaran Terbuka',
        badgeClass: 'bg-neutral-900 text-neutral-300 border-neutral-700',
        dotClass: 'bg-neutral-500',
      };
  }
}

// Badge styling per alert classification
function getAlertClassBadge(alertClass: AlertClass) {
  switch (alertClass) {
    case 'official_warning':
      return {
        label: 'Peringatan Resmi (CAP)',
        badgeClass: 'bg-rose-950/80 text-rose-200 border-rose-800/60',
      };
    case 'platform_advisory':
      return {
        label: 'Advisori Platform (AI)',
        badgeClass: 'bg-indigo-950/80 text-indigo-200 border-indigo-800/60',
      };
    default:
      return {
        label: 'Peringatan Umum',
        badgeClass: 'bg-neutral-900 text-neutral-300 border-neutral-700',
      };
  }
}

// Status badge styling
function getStatusBadge(status?: AlertStatus | string) {
  switch (status?.toLowerCase()) {
    case 'active':
      return { label: 'Aktif Berlaku', badgeClass: 'bg-rose-950/80 text-rose-200 border-rose-800/60', dotClass: 'bg-rose-400' };
    case 'expired':
      return { label: 'Kedaluwarsa', badgeClass: 'bg-neutral-900 text-neutral-400 border-neutral-800', dotClass: 'bg-neutral-600' };
    case 'cancelled':
      return { label: 'Dibatalkan', badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-900/60', dotClass: 'bg-rose-500' };
    default:
      return { label: status || 'Aktif', badgeClass: 'bg-neutral-900 text-neutral-300 border-neutral-700', dotClass: 'bg-neutral-500' };
  }
}

export const PublicWarningsPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Filter States initialized from URL params if present
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchQuery);
  const [selectedHazardType, setSelectedHazardType] = useState<string>(searchParams.get('hazard_type_id') || 'all');
  const [selectedBroadcastLevel, setSelectedBroadcastLevel] = useState<string>(searchParams.get('broadcast_level') || 'all');
  const [selectedAlertClass, setSelectedAlertClass] = useState<string>(searchParams.get('alert_class') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'active');
  const [selectedRegion, setSelectedRegion] = useState<string>(searchParams.get('region_id') || 'all');
  const [sortBy, setSortBy] = useState<'starts_at' | 'title'>('starts_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);

  // Data & Options States
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [totalAlerts, setTotalAlerts] = useState<number>(0);
  const [lastPage, setLastPage] = useState<number>(1);
  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Debounce search query input (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Filter Options (Hazard Types & Regions) once on mount
  useEffect(() => {
    let isMounted = true;
    setIsOptionsLoading(true);

    Promise.all([publicService.getHazardTypes(), publicService.getRegions()])
      .then(([typesData, regionsData]) => {
        if (isMounted) {
          setHazardTypes(typesData || []);
          setRegions(regionsData || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load filter options for warnings:', err);
      })
      .finally(() => {
        if (isMounted) setIsOptionsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Alerts from public API
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadAlerts = async () => {
      setIsLoading(true);

      const params: AlertsQueryParams = {
        page: currentPage,
        per_page: 9,
      };

      if (debouncedSearch.trim()) {
        params.q = debouncedSearch.trim();
      }
      if (selectedHazardType !== 'all') {
        params.hazard_type_id = Number(selectedHazardType);
      }
      if (selectedBroadcastLevel !== 'all') {
        params.broadcast_level = selectedBroadcastLevel as BroadcastLevel;
      }
      if (selectedAlertClass !== 'all') {
        params.alert_class = selectedAlertClass as AlertClass;
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus as AlertStatus;
      }
      if (selectedRegion !== 'all') {
        params.region_id = Number(selectedRegion);
      }

      try {
        const response = await publicService.getAlerts(params, controller.signal);
        if (isMounted) {
          setAlerts(response.data || []);
          setTotalAlerts(response.total || 0);
          setLastPage(response.last_page || 1);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) {
          return;
        }
        if (isMounted) {
          setErrorMessage('Gagal memuat pusat peringatan dini. Silakan periksa koneksi Anda dan coba lagi.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAlerts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    debouncedSearch,
    selectedHazardType,
    selectedBroadcastLevel,
    selectedAlertClass,
    selectedStatus,
    selectedRegion,
    sortBy,
    sortOrder,
    currentPage,
    reloadTrigger,
  ]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setReloadTrigger((v) => v + 1);
  }, []);

  // Reset all filters to default state
  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedHazardType('all');
    setSelectedBroadcastLevel('all');
    setSelectedAlertClass('all');
    setSelectedStatus('active');
    setSelectedRegion('all');
    setSortBy('starts_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch.trim() !== '' ||
      selectedHazardType !== 'all' ||
      selectedBroadcastLevel !== 'all' ||
      selectedAlertClass !== 'all' ||
      selectedStatus !== 'active' ||
      selectedRegion !== 'all' ||
      sortBy !== 'starts_at' ||
      sortOrder !== 'desc'
    );
  }, [debouncedSearch, selectedHazardType, selectedBroadcastLevel, selectedAlertClass, selectedStatus, selectedRegion, sortBy, sortOrder]);

  // Top Most Urgent Warning for Callout
  const topUrgentAlert = useMemo(() => {
    if (alerts.length === 0) return null;
    return alerts.find((a) => a.is_active || a.status === 'active') || alerts[0];
  }, [alerts]);

  return (
    <div className="min-h-screen bg-transparent pb-16 text-neutral-100">
      {/* 1. HERO & TELEMETRY BANNER */}
      <section className="bg-[#0d0f0e] border-b border-neutral-800 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <ScrollWordTitle
                as="h1"
                className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white"
              >
                Pusat Peringatan Dini Kebencanaan
              </ScrollWordTitle>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                Peringatan dini resmi dan advisori kewaspadaan bahaya kebencanaan untuk membantu masyarakat mengambil langkah antisipasi.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="shrink-0 flex items-center gap-3">
              <Link
                to={PATHS.PUBLIC.PREPAREDNESS}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs sm:text-sm font-bold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <Compass className="w-4 h-4 text-rose-400" />
                <span>Cek Risiko Lokasi</span>
              </Link>
              <Link
                to={PATHS.PUBLIC.DISASTERS}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold transition-colors shadow-xs"
              >
                <Activity className="w-4 h-4" />
                <span>Katalog Bencana</span>
              </Link>
            </div>
          </div>

          {/* Compact Status Bar */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-rose-400" />
              <span><strong className="text-white">{totalAlerts}</strong> Peringatan Terdata</span>
            </span>
            <span className="text-neutral-700">•</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span><strong className="text-white">{alerts.filter((a) => a.is_active || a.status === 'active').length}</strong> Aktif Berlaku</span>
            </span>
            <span className="text-neutral-700">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sumber Resmi BMKG / BNPB &amp; Analisis Platform</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* URGENT WARNING CALLOUT */}
        {!isLoading && topUrgentAlert && (
          <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 border border-rose-800/80 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-900/60 border border-rose-700/60 flex items-center justify-center shrink-0 text-rose-300">
                  <ShieldAlert className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-900/80 border border-rose-700/60 text-[10px] font-mono font-bold tracking-wider uppercase text-rose-200">
                      Peringatan Utama
                    </span>
                    <span className="text-xs text-neutral-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{formatAlertDate(topUrgentAlert.starts_at)}</span>
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold leading-snug text-white">
                    {topUrgentAlert.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 max-w-3xl leading-relaxed font-normal">
                    {topUrgentAlert.message}
                  </p>
                </div>
              </div>

              <div className="shrink-0 pt-2 md:pt-0">
                <Link
                  to={`/warnings/${topUrgentAlert.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm font-bold transition-colors"
                >
                  <span>Buka Detail Peringatan</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 3. SEARCH & MULTI-FACET FILTER TOOLBAR */}
        <div className="bg-[#121614] border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Top Row: Search Input & Category Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari peringatan berdasarkan judul, pesan peringatan, atau lokasi..."
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-neutral-900 transition-colors text-white placeholder:text-neutral-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedHazardType('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  selectedHazardType === 'all'
                    ? 'bg-rose-700 text-white border-rose-600 shadow-xs'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Semua Bahaya</span>
              </button>

              {hazardTypes.map((ht) => {
                const isSelected = selectedHazardType === String(ht.id);
                return (
                  <button
                    key={ht.id}
                    type="button"
                    onClick={() => {
                      setSelectedHazardType(isSelected ? 'all' : String(ht.id));
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-rose-700 text-white border-rose-600 shadow-xs'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    {renderHazardIcon(ht.slug, 'w-3.5 h-3.5')}
                    <span>{ht.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Row: Specific Dropdowns */}
          <div className="pt-3 border-t border-neutral-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs">
            {/* Broadcast Level Filter */}
            <div>
              <label htmlFor="select-broadcast" className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Cakupan Siaran
              </label>
              <select
                id="select-broadcast"
                value={selectedBroadcastLevel}
                onChange={(e) => {
                  setSelectedBroadcastLevel(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">Semua Cakupan</option>
                <option value="national">Nasional (National)</option>
                <option value="regional">Regional (Provinsi / DAS)</option>
                <option value="local">Lokal (Kabupaten / Kota)</option>
              </select>
            </div>

            {/* Alert Class Filter */}
            <div>
              <label htmlFor="select-class" className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Klasifikasi
              </label>
              <select
                id="select-class"
                value={selectedAlertClass}
                onChange={(e) => {
                  setSelectedAlertClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">Semua Klasifikasi</option>
                <option value="official_warning">Peringatan Resmi Otoritas</option>
                <option value="platform_advisory">Advisori Platform</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="select-status" className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Status Operasional
              </label>
              <select
                id="select-status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="active">Aktif (Berlaku)</option>
                <option value="expired">Berakhir</option>
                <option value="cancelled">Dibatalkan</option>
                <option value="all">Semua Status</option>
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label htmlFor="select-region" className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Wilayah Terdampak
              </label>
              <select
                id="select-region"
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={isOptionsLoading}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
              >
                <option value="all">Semua Wilayah</option>
                {regions.map((reg) => (
                  <option key={reg.id} value={String(reg.id)}>
                    {reg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label htmlFor="select-sort" className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Urutkan
              </label>
              <select
                id="select-sort"
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split(':') as ['starts_at' | 'title', 'desc' | 'asc'];
                  setSortBy(by);
                  setSortOrder(order);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="starts_at:desc">Waktu Mulai Terbaru</option>
                <option value="starts_at:asc">Waktu Mulai Terlama</option>
                <option value="title:asc">Judul (A-Z)</option>
              </select>
            </div>

            {/* Reset Filters Action */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                className={`w-full py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                  hasActiveFilters
                    ? 'border-rose-900/60 bg-rose-950/70 text-rose-200 hover:bg-rose-900 cursor-pointer'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-600 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. ERROR BANNER WITH RETRY */}
        {errorMessage && (
          <div className="bg-rose-950/70 border border-rose-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-900/60 text-rose-300 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Kendala Memuat Peringatan Dini</h4>
                <p className="text-xs text-rose-200">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="px-3.5 py-1.5 rounded-xl border border-rose-700 bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Sinkronisasi Ulang</span>
            </button>
          </div>
        )}

        {/* 5. ALERT CARDS LIST */}
        <section aria-label="Daftar Peringatan Dini Bencana" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                Peringatan Dini Terdata
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                {totalAlerts}
              </span>
            </div>
            {hasActiveFilters && (
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter aktif
              </span>
            )}
          </div>

          {/* SKELETON LOADING STATE */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-[#121614] border border-neutral-800 rounded-2xl p-5 space-y-4 animate-pulse shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-24 h-5 bg-neutral-800 rounded-md" />
                    <div className="w-16 h-5 bg-neutral-800 rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 bg-neutral-700 rounded-md" />
                    <div className="w-full h-12 bg-neutral-800 rounded-md" />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <div className="w-1/2 h-3 bg-neutral-800 rounded-md" />
                    <div className="w-2/3 h-3 bg-neutral-800 rounded-md" />
                  </div>
                  <div className="w-full h-9 bg-neutral-800 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {!isLoading && !errorMessage && alerts.length === 0 && (
            <div className="bg-[#121614] border border-neutral-800 rounded-2xl p-8 sm:p-12 text-center text-neutral-300">
              <EmptyState
                icon={<BellRing className="w-10 h-10 text-amber-400 mx-auto" />}
                title="Tidak Ada Peringatan Dini Ditemukan"
                description={
                  hasActiveFilters
                    ? 'Kriteria pencarian atau filter yang Anda pilih tidak menghasilkan data peringatan. Silakan sesuaikan filter atau reset pencarian.'
                    : 'Saat ini tidak ada peringatan dini bencana yang aktif pada sistem.'
                }
                action={
                  hasActiveFilters
                    ? {
                        label: 'Bersihkan Semua Filter',
                        onClick: handleResetFilters,
                        variant: 'primary',
                      }
                    : undefined
                }
              />
            </div>
          )}

          {/* ALERTS GRID */}
          {!isLoading && !errorMessage && alerts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {alerts.map((alt, idx) => {
                const bcast = getBroadcastBadge(alt.broadcast_level);
                const aclass = getAlertClassBadge(alt.alert_class);
                const stat = getStatusBadge(alt.status);

                return (
                  <motion.article
                    key={alt.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: (idx % 3) * 0.07 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-[#121614] rounded-2xl border border-neutral-800 hover:border-amber-500/40 transition-colors duration-200 p-5 flex flex-col justify-between shadow-xs"
                  >
                    <div className="space-y-3">
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Hazard Category Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 text-amber-300 text-xs font-bold border border-neutral-700">
                          {renderHazardIcon(alt.hazard_type?.slug, 'w-3.5 h-3.5 text-amber-400')}
                          <span>{alt.hazard_type?.name || 'Peringatan Dini'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Broadcast Level Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${bcast.badgeClass}`}>
                            {bcast.label}
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${stat.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${stat.dotClass}`} />
                            <span>{stat.label}</span>
                          </span>
                        </div>
                      </div>

                      {/* Alert Class Label */}
                      <div className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${aclass.badgeClass}`}>
                          {aclass.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm sm:text-base text-white line-clamp-2 leading-snug">
                        <Link
                          to={`/warnings/${alt.id}`}
                          className="hover:text-amber-300 transition-colors focus:outline-none focus:underline"
                        >
                          {alt.title}
                        </Link>
                      </h3>

                      {/* Message Snippet */}
                      <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed font-normal">
                        {alt.message}
                      </p>

                      {/* Metadata Chips Grid */}
                      <div className="pt-2 border-t border-neutral-800 space-y-1.5 text-xs text-neutral-400">
                        {/* Time Validity Range */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate">
                            Mulai: {formatAlertDate(alt.starts_at)}
                          </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500/80 shrink-0" />
                          <span className="truncate text-neutral-300">
                            {alt.region?.name || 'Wilayah Nasional'}
                          </span>
                        </div>

                        {/* Issuer Info */}
                        <div className="pt-1.5 text-[11px] flex items-center justify-between gap-2 border-t border-neutral-800">
                          <span className="text-neutral-400 truncate max-w-[170px]" title={alt.issuer?.name || 'Penerbit tidak terverifikasi'}>
                            {alt.issuer?.name || 'Penerbit tidak terverifikasi'}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              alt.issuer?.is_verified
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                            }`}
                          >
                            {alt.issuer?.is_verified ? 'Terverifikasi' : 'Belum Tersertifikasi'}
                          </span>
                        </div>

                        {/* Associated Event Data Source */}
                        {alt.event_data_source && (
                          <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                            <span>Sumber Data:</span>
                            <span className="font-semibold text-neutral-200 truncate max-w-[150px]">
                              {alt.event_data_source.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                      {alt.hazard_event_id ? (
                        <Link
                          to={`/disasters/${alt.hazard_event_id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:underline"
                        >
                          <Activity className="w-3 h-3" />
                          <span>Kejadian Terkait</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-neutral-500">Peringatan Terpisah</span>
                      )}

                      <Link
                        to={`/warnings/${alt.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-800/60 text-amber-200 text-xs font-bold transition-colors"
                      >
                        <span>Detail Peringatan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

          {/* 6. PAGINATION CONTROLS */}
          {!isLoading && lastPage > 1 && (
            <div className="bg-[#121614] border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <span className="text-xs text-neutral-400">
                Halaman <strong className="text-white">{currentPage}</strong> dari{' '}
                <strong className="text-white">{lastPage}</strong> (Total {totalAlerts} Peringatan)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-bold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                {Array.from({ length: lastPage }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === lastPage || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const isCurrent = p === currentPage;
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-neutral-600">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                            isCurrent
                              ? 'bg-amber-700 text-white shadow-xs'
                              : 'bg-neutral-900 text-neutral-300 border border-neutral-700 hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  disabled={currentPage >= lastPage}
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-bold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PublicWarningsPage;
