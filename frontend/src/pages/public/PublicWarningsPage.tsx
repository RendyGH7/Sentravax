import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
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
import { Button } from '../../components/ui/Button';
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

// Badge styling per broadcast level
function getBroadcastBadge(level: BroadcastLevel | null) {
  switch (level) {
    case 'national':
      return {
        label: 'Siaran Nasional',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotClass: 'bg-purple-500',
      };
    case 'regional':
      return {
        label: 'Siaran Regional',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotClass: 'bg-indigo-500',
      };
    case 'local':
      return {
        label: 'Siaran Lokal',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-500',
      };
    default:
      return {
        label: 'Cakupan Belum Ditentukan',
        badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
        dotClass: 'bg-gray-400',
      };
  }
}

// Badge styling per alert class
function getAlertClassBadge(alertClass: AlertClass) {
  switch (alertClass) {
    case 'official_warning':
    case 'warning':
      return {
        label: 'Peringatan Resmi Otoritas',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    case 'platform_advisory':
    case 'advisory':
      return {
        label: 'Advisori Platform SENTRAVAX',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      };
    case 'watch':
      return {
        label: 'Pemantauan Siaga (Watch)',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    default:
      return {
        label: 'Peringatan Terbuka',
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
      };
  }
}

// Status badge styling
function getStatusBadge(status: AlertStatus) {
  switch (status) {
    case 'active':
      return {
        label: 'Aktif',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500 animate-pulse',
      };
    case 'expired':
      return {
        label: 'Berakhir',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-400',
      };
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        badgeClass: 'bg-gray-100 text-gray-500 border-gray-200',
        dotClass: 'bg-gray-400',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
        dotClass: 'bg-gray-400',
      };
  }
}

export const PublicWarningsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

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

  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // 1. Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Load Filter Options (Hazard Types & Regions) once
  useEffect(() => {
    let isMounted = true;
    const fetchFilterOptions = async () => {
      setIsOptionsLoading(true);
      try {
        const [typesData, regionsData] = await Promise.all([
          publicService.getHazardTypes(),
          publicService.getRegions(),
        ]);
        if (isMounted) {
          setHazardTypes(typesData);
          setRegions(regionsData);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      } finally {
        if (isMounted) setIsOptionsLoading(false);
      }
    };

    fetchFilterOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Fetch Alerts with AbortController cancellation on any filter change
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    // Sync state with URL search params
    const nextParams = new URLSearchParams();
    if (debouncedSearch) nextParams.set('q', debouncedSearch);
    if (selectedHazardType !== 'all') nextParams.set('hazard_type_id', selectedHazardType);
    if (selectedBroadcastLevel !== 'all') nextParams.set('broadcast_level', selectedBroadcastLevel);
    if (selectedAlertClass !== 'all') nextParams.set('alert_class', selectedAlertClass);
    if (selectedStatus !== 'all') nextParams.set('status', selectedStatus);
    if (selectedRegion !== 'all') nextParams.set('region_id', selectedRegion);
    if (currentPage > 1) nextParams.set('page', String(currentPage));
    setSearchParams(nextParams, { replace: true });

    const loadAlerts = async () => {
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
      } else {
        params.status = 'all';
      }
      if (selectedRegion !== 'all') {
        params.region_id = Number(selectedRegion);
      }

      try {
        const response = await publicService.getAlerts(params, controller.signal);
        if (isMounted) {
          let list = response.data || [];

          // Client-side sort if requested
          if (sortBy === 'title') {
            list = [...list].sort((a, b) => {
              const comp = a.title.localeCompare(b.title);
              return sortOrder === 'desc' ? -comp : comp;
            });
          } else if (sortBy === 'starts_at' && sortOrder === 'asc') {
            list = [...list].sort((a, b) => {
              return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
            });
          }

          setAlerts(list);
          setTotalAlerts(response.total || 0);
          setLastPage(response.last_page || 1);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) {
          return; // Request was aborted due to new filter input
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
    setSearchParams,
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
    <div className="min-h-screen bg-[#F9FAFB] pb-16">
      {/* 1. HERO & TELEMETRY BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7]/40 to-[#F9FAFB] border-b border-[#FDE68A] pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -translate-y-6 w-80 h-80 bg-rose-200/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>PUSAT INFORMASI PERINGATAN DINI PUBLIK</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#111827]">
                Pusat Peringatan Dini Kebencanaan
              </h1>
              <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                Agregasi peringatan dini resmi dan advisori kewaspadaan bahaya kebencanaan untuk membantu masyarakat mempersiapkan langkah antisipasi dan keselamatan.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="shrink-0 flex items-center gap-3">
              <Link
                to={PATHS.PUBLIC.HOME}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D1D5DB] text-xs sm:text-sm font-bold text-[#111827] shadow-xs hover:border-[#047857] hover:text-[#047857] transition-all"
              >
                <Compass className="w-4 h-4 text-[#047857]" />
                <span>Cek Risiko di SIAGA PERSONAL</span>
              </Link>
              <Link
                to={PATHS.PUBLIC.DISASTERS}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-[#065F46] transition-all"
              >
                <Activity className="w-4 h-4" />
                <span>Katalog Bencana</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar (Truthful Data Transparency) */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280]">Peringatan Terdata</p>
                <p className="text-lg font-extrabold text-[#111827]">{totalAlerts} Peringatan</p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280]">Cakupan Siaran</p>
                <p className="text-sm sm:text-base font-extrabold text-[#111827]">Multi-Tingkat</p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280]">Status Peringatan</p>
                <p className="text-sm sm:text-base font-extrabold text-[#111827]">
                  {alerts.filter((a) => a.is_active || a.status === 'active').length} Peringatan Aktif
                </p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280]">Sumber Pembaruan</p>
                <p className="text-xs sm:text-sm font-extrabold text-emerald-700">Sinkronisasi Berkala</p>
              </div>
            </div>
          </div>

          {/* Classification & Provenance Distinction Legend */}
          <div className="mt-6 p-4 rounded-xl bg-white/90 backdrop-blur-xs border border-[#E5E7EB] shadow-xs">
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2.5">
              Klasifikasi Jenis Data & Asal Informasi (Data Provenance):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="font-bold text-rose-800 block text-[11px]">Official Warning (CAP)</span>
                <span className="text-[10px] text-rose-600">Peringatan resmi BMKG / BNPB terverifikasi</span>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                <span className="font-bold text-indigo-800 block text-[11px]">SENTRAVAX Insight</span>
                <span className="text-[10px] text-indigo-600">Analisis inferensi AI & Risk Engine internal</span>
              </div>
              <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                <span className="font-bold text-teal-800 block text-[11px]">Observed Data</span>
                <span className="text-[10px] text-teal-600">Sensor & telemetri fisik pengamatan langsung</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-800 block text-[11px]">Community Report</span>
                <span className="text-[10px] text-amber-600">Laporan warga lapangan hasil triage terverifikasi</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px]">Simulated Data</span>
                <span className="text-[10px] text-slate-600">Data gladi simulasi pengujian kedaruratan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* URGENT WARNING CALLOUT (Fast-Scan Alert for Immediate Awareness) */}
        {!isLoading && topUrgentAlert && (
          <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-extrabold tracking-wider uppercase">
                      Peringatan Utama
                    </span>
                    <span className="text-xs text-rose-100 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatAlertDate(topUrgentAlert.starts_at)}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold leading-snug">
                    {topUrgentAlert.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-rose-100 line-clamp-2 max-w-3xl leading-relaxed">
                    {topUrgentAlert.message}
                  </p>
                </div>
              </div>

              <div className="shrink-0 pt-2 md:pt-0">
                <Link
                  to={`/warnings/${topUrgentAlert.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-rose-900 text-xs sm:text-sm font-extrabold shadow-xs hover:bg-rose-50 transition-colors"
                >
                  <span>Buka Detail Peringatan</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 3. SEARCH & MULTI-FACET FILTER TOOLBAR */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Top Row: Search Input & Category Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari peringatan berdasarkan judul, pesan peringatan, atau lokasi..."
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white transition-all text-[#111827]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] p-1"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills (Dynamic from backend) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedHazardType('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  selectedHazardType === 'all'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]'
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
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}
                  >
                    {renderHazardIcon(ht.slug, 'w-3.5 h-3.5')}
                    <span>{ht.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Row: Specific Dropdowns (Broadcast, Class, Status, Region, Sorting) */}
          <div className="pt-3 border-t border-[#F3F4F6] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs">
            {/* Broadcast Level Filter */}
            <div>
              <label htmlFor="select-broadcast" className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                Cakupan Siaran
              </label>
              <select
                id="select-broadcast"
                value={selectedBroadcastLevel}
                onChange={(e) => {
                  setSelectedBroadcastLevel(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">Semua Cakupan</option>
                <option value="national">Nasional (National)</option>
                <option value="regional">Regional (Provinsi / DAS)</option>
                <option value="local">Lokal (Kabupaten / Kota)</option>
              </select>
            </div>

            {/* Alert Class Filter */}
            <div>
              <label htmlFor="select-class" className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                Klasifikasi
              </label>
              <select
                id="select-class"
                value={selectedAlertClass}
                onChange={(e) => {
                  setSelectedAlertClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">Semua Klasifikasi</option>
                <option value="official_warning">Peringatan Resmi Otoritas</option>
                <option value="platform_advisory">Advisori Platform</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="select-status" className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                Status Operasional
              </label>
              <select
                id="select-status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="active">Aktif (Berlaku)</option>
                <option value="expired">Berakhir</option>
                <option value="cancelled">Dibatalkan</option>
                <option value="all">Semua Status</option>
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label htmlFor="select-region" className="block text-[11px] font-semibold text-[#6B7280] mb-1">
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
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-gray-100"
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
              <label htmlFor="select-sort" className="block text-[11px] font-semibold text-[#6B7280] mb-1">
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
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer'
                    : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed'
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
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900">Kendala Memuat Peringatan Dini</h4>
                <p className="text-xs text-red-700">{errorMessage}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="border-red-300 text-red-800 hover:bg-red-100 shrink-0"
            >
              Coba Sinkronisasi Ulang
            </Button>
          </div>
        )}

        {/* 5. ALERT CARDS LIST */}
        <section aria-label="Daftar Peringatan Dini Bencana" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#111827]">
                Peringatan Dini Terdata
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E5E7EB] text-[#374151]">
                {totalAlerts}
              </span>
            </div>
            {hasActiveFilters && (
              <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Filter aktif
              </span>
            )}
          </div>

          {/* SKELETON LOADING STATE */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 animate-pulse shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-24 h-5 bg-gray-200 rounded-md" />
                    <div className="w-16 h-5 bg-gray-200 rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 bg-gray-300 rounded-md" />
                    <div className="w-full h-12 bg-gray-200 rounded-md" />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-[#F3F4F6]">
                    <div className="w-1/2 h-3 bg-gray-200 rounded-md" />
                    <div className="w-2/3 h-3 bg-gray-200 rounded-md" />
                  </div>
                  <div className="w-full h-9 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {!isLoading && !errorMessage && alerts.length === 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 sm:p-12 text-center">
              <EmptyState
                icon={<BellRing className="w-10 h-10 text-amber-500 mx-auto" />}
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
              {alerts.map((alt) => {
                const bcast = getBroadcastBadge(alt.broadcast_level);
                const aclass = getAlertClassBadge(alt.alert_class);
                const stat = getStatusBadge(alt.status);
                const isOfficial = alt.alert_class === 'official_warning';

                return (
                  <article
                    key={alt.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isOfficial
                        ? 'border-amber-200 hover:border-amber-300'
                        : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Hazard Category Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold border border-amber-100">
                          {renderHazardIcon(alt.hazard_type?.slug, 'w-3.5 h-3.5 text-amber-700')}
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
                            {stat.label}
                          </span>
                        </div>
                      </div>

                      {/* Alert Class Label */}
                      <div className="text-[11px] font-semibold text-[#6B7280] flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${aclass.badgeClass}`}>
                          {aclass.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm sm:text-base text-[#111827] line-clamp-2 leading-snug">
                        <Link
                          to={`/warnings/${alt.id}`}
                          className="hover:text-amber-800 transition-colors focus:outline-none focus:underline"
                        >
                          {alt.title}
                        </Link>
                      </h3>

                      {/* Message Snippet */}
                      <p className="text-xs text-[#4B5563] line-clamp-3 leading-relaxed">
                        {alt.message}
                      </p>

                      {/* Metadata Chips Grid */}
                      <div className="pt-2 border-t border-[#F3F4F6] space-y-1.5 text-xs text-[#4B5563]">
                        {/* Time Validity Range */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                          <span className="truncate">
                            Mulai: {formatAlertDate(alt.starts_at)}
                          </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                          <span className="truncate">
                            {alt.region?.name || 'Wilayah Nasional'}
                          </span>
                        </div>

                        {/* Issuer Info (Strict Semantic Truthfulness) */}
                        <div className="pt-1 text-[11px] flex items-center justify-between gap-2 border-t border-[#F3F4F6]">
                          <span className="text-[#6B7280] truncate max-w-[170px]" title={alt.issuer?.name || 'Penerbit tidak terverifikasi'}>
                            {alt.issuer?.name || 'Penerbit tidak terverifikasi'}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              alt.issuer?.is_verified
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {alt.issuer?.is_verified ? 'Terverifikasi' : 'Belum Tersertifikasi'}
                          </span>
                        </div>

                        {/* Associated Event Data Source (if separate) */}
                        {alt.event_data_source && (
                          <div className="text-[10px] text-[#6B7280] flex items-center justify-between">
                            <span>Sumber Data Kejadian:</span>
                            <span className="font-semibold text-[#374151] truncate max-w-[150px]">
                              {alt.event_data_source.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between gap-2">
                      {alt.hazard_event_id ? (
                        <Link
                          to={`/disasters/${alt.hazard_event_id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857] hover:underline"
                        >
                          <Activity className="w-3 h-3" />
                          <span>Kejadian Terkait</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[#9CA3AF]">Peringatan Terpisah</span>
                      )}

                      <Link
                        to={`/warnings/${alt.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all border border-amber-200"
                      >
                        <span>Detail Peringatan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* 6. PAGINATION CONTROLS */}
          {!isLoading && lastPage > 1 && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <span className="text-xs text-[#6B7280]">
                Halaman <strong className="text-[#111827]">{currentPage}</strong> dari{' '}
                <strong className="text-[#111827]">{lastPage}</strong> (Total {totalAlerts} Peringatan)
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Sebelumnya
                </Button>

                {Array.from({ length: lastPage }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === lastPage || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const isCurrent = p === currentPage;
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                            isCurrent
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= lastPage}
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PublicWarningsPage;
