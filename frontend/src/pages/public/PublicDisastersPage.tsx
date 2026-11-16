import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Activity,
  Waves,
  CloudLightning,
  Mountain,
  Anchor,
  AlertTriangle,
  Search,
  X,
  RotateCcw,
  MapPin,
  Calendar,
  Radio,
  ChevronRight,
  ChevronLeft,
  Map as MapIcon,
  ShieldAlert,
  Compass,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';

import { publicService } from '../../services/public-service';
import { PATHS } from '../../app/router/paths';
import type {
  HazardEventItem,
  HazardTypeItem,
  RegionItem,
  EventsQueryParams,
  HazardSeverity,
  EventStatus,
} from '../../types/disaster';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { DisasterMap } from '../../components/map/DisasterMap';

// Safe date formatter for Indonesian locale (WIB)
function formatEventDate(dateStr?: string): string {
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

// Color and badge configuration for severity levels
function getSeverityBadge(severity?: string) {
  const s = severity?.toLowerCase();
  switch (s) {
    case 'extreme':
    case 'critical':
      return {
        label: 'Ekstrem',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        dotClass: 'bg-red-500',
      };
    case 'high':
    case 'severe':
      return {
        label: 'Tinggi',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        dotClass: 'bg-orange-500',
      };
    case 'medium':
    case 'moderate':
      return {
        label: 'Sedang',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    case 'low':
    case 'minor':
    default:
      return {
        label: 'Rendah',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
  }
}

// Status badge styling
function getStatusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case 'active':
      return { label: 'Aktif', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'contained':
      return { label: 'Terkendali', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'resolved':
      return { label: 'Selesai', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
    default:
      return { label: status || 'Aktif', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

export const PublicDisastersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States initialized from URL params if present
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchQuery);
  const [selectedHazardType, setSelectedHazardType] = useState<string>(searchParams.get('hazard_type_id') || 'all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>(searchParams.get('severity') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'all');
  const [selectedRegion, setSelectedRegion] = useState<string>(searchParams.get('region_id') || 'all');
  const [sortBy, setSortBy] = useState<'occurred_at' | 'severity' | 'title'>('occurred_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);

  // Data & Options States
  const [events, setEvents] = useState<HazardEventItem[]>([]);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [lastPage, setLastPage] = useState<number>(1);
  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);

  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMapVisible, setIsMapVisible] = useState<boolean>(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Ref to scroll to map container
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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

  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // 3. Fetch Events with AbortController cancellation on any filter change
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    // Sync state with URL search params
    const nextParams = new URLSearchParams();
    if (debouncedSearch) nextParams.set('q', debouncedSearch);
    if (selectedHazardType !== 'all') nextParams.set('hazard_type_id', selectedHazardType);
    if (selectedSeverity !== 'all') nextParams.set('severity', selectedSeverity);
    if (selectedStatus !== 'all') nextParams.set('status', selectedStatus);
    if (selectedRegion !== 'all') nextParams.set('region_id', selectedRegion);
    if (currentPage > 1) nextParams.set('page', String(currentPage));
    setSearchParams(nextParams, { replace: true });

    const loadEvents = async () => {
      const params: EventsQueryParams = {
        page: currentPage,
        per_page: 9,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (debouncedSearch.trim()) {
        params.q = debouncedSearch.trim();
      }
      if (selectedHazardType !== 'all') {
        params.hazard_type_id = Number(selectedHazardType);
      }
      if (selectedSeverity !== 'all') {
        params.severity = selectedSeverity as HazardSeverity;
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus as EventStatus;
      }
      if (selectedRegion !== 'all') {
        params.region_id = Number(selectedRegion);
      }

      try {
        const response = await publicService.getEvents(params, controller.signal);
        if (isMounted) {
          setEvents(response.data || []);
          setTotalEvents(response.total || 0);
          setLastPage(response.last_page || 1);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) {
          return; // Request was aborted due to new filter input
        }
        if (isMounted) {
          setErrorMessage('Gagal memuat katalog kejadian bencana. Silakan periksa koneksi Anda dan coba lagi.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [debouncedSearch, selectedHazardType, selectedSeverity, selectedStatus, selectedRegion, sortBy, sortOrder, currentPage, setSearchParams, reloadTrigger]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setReloadTrigger((v) => v + 1);
  }, []);

  // Reset all filters to default state
  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedHazardType('all');
    setSelectedSeverity('all');
    setSelectedStatus('all');
    setSelectedRegion('all');
    setSortBy('occurred_at');
    setSortOrder('desc');
    setCurrentPage(1);
    setSelectedEventId(null);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch.trim() !== '' ||
      selectedHazardType !== 'all' ||
      selectedSeverity !== 'all' ||
      selectedStatus !== 'all' ||
      selectedRegion !== 'all' ||
      sortBy !== 'occurred_at' ||
      sortOrder !== 'desc'
    );
  }, [debouncedSearch, selectedHazardType, selectedSeverity, selectedStatus, selectedRegion, sortBy, sortOrder]);

  // Center event on map
  const handleFocusOnMap = (eventId: number) => {
    setSelectedEventId(eventId);
    if (!isMapVisible) {
      setIsMapVisible(true);
    }
    setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // When marker is selected from map
  const handleMapSelectEvent = (eventId: number) => {
    setSelectedEventId(eventId);
    const cardEl = cardRefs.current.get(eventId);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16">
      {/* 1. HERO & TELEMETRY BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#ECFDF5] via-[#F0FDF4] to-[#F9FAFB] border-b border-[#E5E7EB] pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -translate-y-6 w-80 h-80 bg-teal-200/25 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#047857] text-xs font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>PUSAT INTELIJEN BENCANA TERPADU</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#111827]">
                Katalog Kejadian Bencana Indonesia
              </h1>
              <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                Akses publik terbuka untuk pemantauan data bencana geospasial real-time dan historis. Dihimpun langsung dari telemetri sensor BMKG, PVMBG, BNPB, dan posko pantau terintegrasi.
              </p>
            </div>

            {/* Quick Action to SIAGA PERSONAL */}
            <div className="shrink-0 flex items-center gap-3">
              <Link
                to={PATHS.PUBLIC.HOME}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D1D5DB] text-xs sm:text-sm font-bold text-[#111827] shadow-xs hover:border-[#047857] hover:text-[#047857] transition-all"
              >
                <Compass className="w-4 h-4 text-[#047857]" />
                <span>Cek Risiko di SIAGA PERSONAL</span>
              </Link>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsMapVisible(!isMapVisible)}
                leftIcon={<MapIcon className="w-4 h-4 text-[#047857]" />}
                className="hidden sm:inline-flex"
              >
                {isMapVisible ? 'Tutup Tampilan Peta' : 'Buka Tampilan Peta'}
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#047857] flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280]">Total Kejadian Aktif</p>
                <p className="text-lg font-extrabold text-[#111827]">{totalEvents} Kejadian</p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280]">Kategori Dipantau</p>
                <p className="text-lg font-extrabold text-[#111827]">
                  {hazardTypes.length > 0 ? `${hazardTypes.length} Kategori` : '5 Kategori'}
                </p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280]">Wilayah Terintegrasi</p>
                <p className="text-lg font-extrabold text-[#111827]">
                  {regions.length > 0 ? `${regions.length} Wilayah` : '5 Wilayah'}
                </p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280]">Status Sinkronisasi</p>
                <p className="text-xs sm:text-sm font-extrabold text-emerald-700">LIVE FEED ON</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* INTERACTIVE GEOSPATIAL MAP (Collapsible / Synced) */}
        {isMapVisible && (
          <div ref={mapSectionRef} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-sm font-bold text-[#111827]">Peta Geospasial Bencana Real-Time</h3>
                <span className="text-xs text-[#6B7280]">| Klik penanda untuk detail & fokus</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMapVisible(false)}
                className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Sembunyikan Peta</span>
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#E5E7EB] h-[380px] sm:h-[450px]">
              <DisasterMap
                theme="light"
                height="100%"
                selectedEventId={selectedEventId}
                onSelectEvent={handleMapSelectEvent}
                showFilters={false}
                showEventList={false}
              />
            </div>
          </div>
        )}

        {/* 3. SEARCH & MULTI-HAZARD FILTER TOOLBAR */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Top Row: Search Input & Category Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari bencana berdasarkan judul, wilayah, atau kata kunci (cth: gempa, maluku, ciliwung)..."
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#047857]/30 focus:border-[#047857] bg-white transition-all text-[#111827]"
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
                    ? 'bg-[#047857] text-white border-[#047857] shadow-xs'
                    : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Semua Kategori</span>
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
                        ? 'bg-[#047857] text-white border-[#047857] shadow-xs'
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

          {/* Secondary Row: Specific Dropdowns (Severity, Status, Region, Sorting) */}
          <div className="pt-3 border-t border-[#F3F4F6] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
            {/* Severity Filter */}
            <div>
              <label htmlFor="select-severity" className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                Tingkat Keparahan
              </label>
              <select
                id="select-severity"
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#047857]"
              >
                <option value="all">Semua Keparahan</option>
                <option value="low">Rendah (Low / Minor)</option>
                <option value="medium">Sedang (Moderate)</option>
                <option value="high">Tinggi (High / Severe)</option>
                <option value="extreme">Ekstrem (Critical)</option>
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
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#047857]"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif (Tanggap Darurat)</option>
                <option value="contained">Terkendali</option>
                <option value="resolved">Selesai</option>
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label htmlFor="select-region" className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                Wilayah Pantau
              </label>
              <select
                id="select-region"
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={isOptionsLoading}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#047857] disabled:bg-gray-100"
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
                Urutkan Berdasarkan
              </label>
              <select
                id="select-sort"
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split(':') as [
                    'occurred_at' | 'severity' | 'title',
                    'desc' | 'asc'
                  ];
                  setSortBy(by);
                  setSortOrder(order);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#047857]"
              >
                <option value="occurred_at:desc">Waktu Terbaru (Terbaru)</option>
                <option value="occurred_at:asc">Waktu Terlama (Historis)</option>
                <option value="severity:desc">Keparahan Tertinggi</option>
                <option value="title:asc">Nama Kejadian (A-Z)</option>
              </select>
            </div>

            {/* Reset Filters Action */}
            <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                className={`w-full py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                  hasActiveFilters
                    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer'
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
                <h4 className="text-sm font-bold text-red-900">Kendala Sinkronisasi Data</h4>
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

        {/* 5. EVENT CARDS LIST / GRID */}
        <section aria-label="Daftar Kejadian Bencana" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#111827]">
                Hasil Pemantauan Bencana
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E5E7EB] text-[#374151]">
                {totalEvents}
              </span>
            </div>
            {hasActiveFilters && (
              <span className="text-xs text-[#047857] font-semibold flex items-center gap-1">
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
                    <div className="w-full h-4 bg-gray-200 rounded-md" />
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
          {!isLoading && !errorMessage && events.length === 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 sm:p-12 text-center">
              <EmptyState
                icon={<AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />}
                title="Tidak Ada Kejadian Bencana Ditemukan"
                description={
                  hasActiveFilters
                    ? 'Kriteria pencarian atau filter yang Anda pilih tidak menghasilkan kejadian bencana. Silakan sesuaikan kata kunci atau bersihkan filter.'
                    : 'Belum ada kejadian bencana yang tercatat pada sistem saat ini.'
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

          {/* EVENTS GRID */}
          {!isLoading && !errorMessage && events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {events.map((ev) => {
                const sev = getSeverityBadge(ev.severity);
                const stat = getStatusBadge(ev.status);
                const isSelected = selectedEventId === ev.id;
                const isLive = ev.provenance_status === 'LIVE';

                return (
                  <article
                    key={ev.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(ev.id, el as HTMLDivElement);
                      else cardRefs.current.delete(ev.id);
                    }}
                    className={`bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-[#047857] ring-2 ring-[#047857]/20 bg-emerald-50/20'
                        : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Hazard Category Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#047857] text-xs font-bold border border-emerald-100">
                          {renderHazardIcon(ev.hazard_type?.slug, 'w-3.5 h-3.5 text-[#047857]')}
                          <span>{ev.hazard_type?.name || 'Kejadian Bencana'}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${stat.badgeClass}`}>
                            {stat.label}
                          </span>

                          {/* Severity Level Badge */}
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${sev.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${sev.dotClass}`} />
                            <span>{sev.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm sm:text-base text-[#111827] line-clamp-2 leading-snug">
                        <Link
                          to={`/disasters/${ev.id}`}
                          className="hover:text-[#047857] transition-colors focus:outline-none focus:underline"
                        >
                          {ev.title}
                        </Link>
                      </h3>

                      {/* Description Snippet */}
                      {ev.description && (
                        <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      {/* Metadata Chips Grid */}
                      <div className="pt-2 border-t border-[#F3F4F6] space-y-1.5 text-xs text-[#4B5563]">
                        {/* Time */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                          <span className="truncate">{formatEventDate(ev.occurred_at)}</span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                          <span className="truncate">
                            {ev.region?.name || 'Wilayah Nasional'}
                          </span>
                        </div>

                        {/* Provenance & Source */}
                        <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                          <span className="text-[#6B7280] truncate max-w-[150px]">
                            {ev.source_name || ev.provider_name || 'Sumber data tidak tercatat'}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold font-mono text-[10px] ${
                              isLive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                              }`}
                            />
                            {ev.provenance_label || (isLive ? 'LIVE' : 'STATIC')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between gap-2">
                      {ev.coordinates?.latitude && ev.coordinates?.longitude ? (
                        <button
                          type="button"
                          onClick={() => handleFocusOnMap(ev.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#047857] hover:text-emerald-800 transition-colors"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Pusatkan di Peta</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#9CA3AF]">Koordinat Umum</span>
                      )}

                      <Link
                        to={`/disasters/${ev.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#047857] text-xs font-bold transition-all border border-emerald-200"
                      >
                        <span>Detail Kejadian</span>
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
                <strong className="text-[#111827]">{lastPage}</strong> (Total {totalEvents} Kejadian)
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
                              ? 'bg-[#047857] text-white shadow-xs'
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

export default PublicDisastersPage;
