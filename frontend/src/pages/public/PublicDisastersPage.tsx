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
  Filter,
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
import { EmptyState } from '../../components/ui/EmptyState';
import { DisasterMap } from '../../components/map/DisasterMap';
import { DataTrustGroup } from '../../components/shared/DataTrustBadges';

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

// Color and badge configuration for severity levels (Bold yet matte dark tokens)
function getSeverityBadge(severity?: string) {
  const s = severity?.toLowerCase();
  switch (s) {
    case 'extreme':
    case 'critical':
      return {
        label: 'Ekstrem',
        badgeClass: 'bg-rose-950/80 text-rose-200 border-rose-800/60',
        dotClass: 'bg-rose-500',
      };
    case 'high':
    case 'severe':
      return {
        label: 'Tinggi',
        badgeClass: 'bg-amber-950/80 text-amber-200 border-amber-800/60',
        dotClass: 'bg-amber-500',
      };
    case 'medium':
    case 'moderate':
      return {
        label: 'Sedang',
        badgeClass: 'bg-yellow-950/80 text-yellow-200 border-yellow-800/60',
        dotClass: 'bg-yellow-500',
      };
    case 'low':
    case 'minor':
    default:
      return {
        label: 'Rendah',
        badgeClass: 'bg-emerald-950/80 text-emerald-200 border-emerald-800/60',
        dotClass: 'bg-emerald-500',
      };
  }
}

// Status badge styling
function getStatusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case 'active':
      return { label: 'Aktif', badgeClass: 'bg-rose-950/80 text-rose-200 border-rose-800/60' };
    case 'contained':
      return { label: 'Terkendali', badgeClass: 'bg-sky-950/80 text-sky-200 border-sky-800/60' };
    case 'resolved':
      return { label: 'Selesai', badgeClass: 'bg-neutral-900 text-neutral-400 border-neutral-800' };
    default:
      return { label: status || 'Aktif', badgeClass: 'bg-neutral-900 text-neutral-300 border-neutral-700' };
  }
}

export const PublicDisastersPage: React.FC = () => {
  const [searchParams] = useSearchParams();

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // UI Interactive States
  const [isMapVisible, setIsMapVisible] = useState<boolean>(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Element refs for scrolling to selected card
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

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
        console.error('Failed to load filter options:', err);
      })
      .finally(() => {
        if (isMounted) setIsOptionsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Events from public API when filters/pagination change
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadEvents = async () => {
      setIsLoading(true);

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
          return;
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
  }, [debouncedSearch, selectedHazardType, selectedSeverity, selectedStatus, selectedRegion, sortBy, sortOrder, currentPage, reloadTrigger]);

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
    <div className="min-h-screen bg-transparent pb-16 text-neutral-100">
      {/* 1. HERO & TELEMETRY BANNER */}
      <section className="bg-[#0d0f0e] border-b border-neutral-800 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>PUSAT INTELIJEN BENCANA TERPADU</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Katalog Kejadian Bencana Indonesia
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                Akses publik terbuka untuk pemantauan data bencana geospasial real-time dan historis. Dihimpun langsung dari telemetri sensor BMKG, PVMBG, BNPB, dan posko pantau terintegrasi.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="shrink-0 flex items-center gap-3">
              <Link
                to={PATHS.PUBLIC.PREPAREDNESS}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs sm:text-sm font-bold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Cek Risiko di SIAGA PERSONAL</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMapVisible(!isMapVisible)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs sm:text-sm font-bold text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <MapIcon className="w-4 h-4 text-emerald-400" />
                <span>{isMapVisible ? 'Tutup Tampilan Peta' : 'Buka Tampilan Peta'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#121614] p-3.5 sm:p-4 rounded-2xl border border-neutral-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-neutral-400">Total Kejadian Aktif</p>
                <p className="text-lg font-black text-white">{totalEvents} Kejadian</p>
              </div>
            </div>

            <div className="bg-[#121614] p-3.5 sm:p-4 rounded-2xl border border-neutral-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-sky-400 flex items-center justify-center font-bold shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-neutral-400">Kategori Dipantau</p>
                <p className="text-lg font-black text-white">
                  {hazardTypes.length > 0 ? `${hazardTypes.length} Kategori` : '5 Kategori'}
                </p>
              </div>
            </div>

            <div className="bg-[#121614] p-3.5 sm:p-4 rounded-2xl border border-neutral-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center font-bold shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-neutral-400">Wilayah Terintegrasi</p>
                <p className="text-lg font-black text-white">
                  {regions.length > 0 ? `${regions.length} Wilayah` : '5 Wilayah'}
                </p>
              </div>
            </div>

            <div className="bg-[#121614] p-3.5 sm:p-4 rounded-2xl border border-neutral-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-neutral-400">Status Sinkronisasi</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-emerald-400">LIVE FEED ON</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* INTERACTIVE GEOSPATIAL MAP (Collapsible / Synced) */}
        {isMapVisible && (
          <div ref={mapSectionRef} className="bg-[#121614] border border-neutral-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-white">Peta Geospasial Bencana Real-Time</h3>
                <span className="text-xs text-neutral-400 hidden sm:inline">| Klik penanda untuk detail &amp; fokus</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMapVisible(false)}
                className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Sembunyikan Peta</span>
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-neutral-800 h-[380px] sm:h-[450px]">
              <DisasterMap
                theme="dark"
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
        <div className="bg-[#121614] border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Top Row: Search Input & Category Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari bencana berdasarkan judul, wilayah, atau kata kunci (cth: gempa, maluku, ciliwung)..."
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-neutral-900 transition-colors text-white placeholder:text-neutral-500"
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
                    ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white'
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
                        ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
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

          {/* Secondary Row: Specific Dropdowns (Severity, Status, Region, Sorting) */}
          <div className="pt-3 border-t border-neutral-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
            {/* Severity Filter */}
            <div>
              <label htmlFor="select-severity" className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Tingkat Keparahan
              </label>
              <select
                id="select-severity"
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif (Tanggap Darurat)</option>
                <option value="contained">Terkendali</option>
                <option value="resolved">Selesai</option>
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label htmlFor="select-region" className="block text-[11px] font-semibold text-neutral-400 mb-1">
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
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
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
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="occurred_at:desc">Waktu Terbaru</option>
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
                <h4 className="text-sm font-bold text-white">Kendala Sinkronisasi Data</h4>
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

        {/* 5. EVENT CARDS LIST / GRID */}
        <section aria-label="Daftar Kejadian Bencana" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                Hasil Pemantauan Bencana
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                {totalEvents}
              </span>
            </div>
            {hasActiveFilters && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
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
                    <div className="w-full h-4 bg-neutral-800 rounded-md" />
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
          {!isLoading && !errorMessage && events.length === 0 && (
            <div className="bg-[#121614] border border-neutral-800 rounded-2xl p-8 sm:p-12 text-center text-neutral-300">
              <EmptyState
                icon={<AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />}
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
                    className={`bg-[#121614] rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between shadow-xs ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-neutral-800 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Hazard Category Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 text-emerald-300 text-xs font-bold border border-neutral-700">
                          {renderHazardIcon(ev.hazard_type?.slug, 'w-3.5 h-3.5 text-emerald-400')}
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
                      <h3 className="font-bold text-sm sm:text-base text-white line-clamp-2 leading-snug">
                        <Link
                          to={`/disasters/${ev.id}`}
                          className="hover:text-emerald-300 transition-colors focus:outline-none focus:underline"
                        >
                          {ev.title}
                        </Link>
                      </h3>

                      {/* Description Snippet */}
                      {ev.description && (
                        <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed font-normal">
                          {ev.description}
                        </p>
                      )}

                      {/* Metadata Chips Grid */}
                      <div className="pt-2 border-t border-neutral-800 space-y-1.5 text-xs text-neutral-400">
                        {/* Time */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate">{formatEventDate(ev.occurred_at)}</span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                          <span className="truncate text-neutral-300">
                            {ev.region?.name || 'Wilayah Nasional'}
                          </span>
                        </div>

                        {/* Provenance & Source */}
                        <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                          <span className="text-neutral-400 truncate max-w-[150px]">
                            {ev.source_name || ev.provider_name || 'Sumber data tidak tercatat'}
                          </span>

                          <DataTrustGroup
                            connectivity={ev.connectivity_state || (isLive ? 'LIVE' : 'STATIC')}
                            provenance={ev.provenance_type || (ev.is_simulated ? 'SIMULATED' : 'OFFICIAL')}
                            freshness={ev.freshness_state}
                            isSimulated={ev.is_simulated}
                            size="xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                      {ev.coordinates?.latitude && ev.coordinates?.longitude ? (
                        <button
                          type="button"
                          onClick={() => handleFocusOnMap(ev.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                        >
                          <Compass className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pusatkan di Peta</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-500">Koordinat Umum</span>
                      )}

                      <Link
                        to={`/disasters/${ev.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
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
            <div className="bg-[#121614] border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <span className="text-xs text-neutral-400">
                Halaman <strong className="text-white">{currentPage}</strong> dari{' '}
                <strong className="text-white">{lastPage}</strong> (Total {totalEvents} Kejadian)
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
                              ? 'bg-emerald-700 text-white shadow-xs'
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

export default PublicDisastersPage;
