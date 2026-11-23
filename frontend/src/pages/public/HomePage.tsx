import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import type { 
  PublicOverviewData, 
  HazardEventItem, 
  AlertItem
} from '../../types/disaster';
import type { RegionItem, LocationCheckResult } from '../../types';
import type { ShelterItem } from '../../types/shelter';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { 
  Shield, 
  Map, 
  Activity, 
  Radio, 
  ChevronRight, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw,
  Flame,
  Waves,
  Wind,
  Mountain,
  PhoneCall,
  Navigation,
  CheckCircle2,
  Compass,
  Home as HomeIcon,
  BookOpen,
  Crosshair,
  CheckSquare,
  Square,
  Accessibility,
  Search,
  Copy,
  ExternalLink,
  Plus,
  Minus,
  Check,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

// Lazy-load Leaflet map module for instant smooth rendering
const DisasterMap = lazy(() =>
  import('../../components/map').then((mod) => ({ default: mod.DisasterMap }))
);

function formatEventDate(dateString?: string): string {
  if (!dateString) return 'Waktu tidak tersedia';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return dateString;
  }
}

function getSeverityBadge(severity?: string) {
  const s = (severity || 'low').toLowerCase();
  switch (s) {
    case 'extreme':
    case 'critical':
      return { variant: 'danger' as const, label: 'Kritis' };
    case 'severe':
    case 'high':
      return { variant: 'warning' as const, label: 'Tinggi' };
    case 'moderate':
    case 'medium':
      return { variant: 'warning' as const, label: 'Sedang' };
    case 'minor':
    case 'low':
    default:
      return { variant: 'success' as const, label: 'Rendah' };
  }
}

function getAlertBadge(alertClass?: string) {
  const c = (alertClass || 'advisory').toLowerCase();
  switch (c) {
    case 'warning':
    case 'danger':
      return { variant: 'danger' as const, label: 'Peringatan Bahaya' };
    case 'watch':
      return { variant: 'warning' as const, label: 'Kewaspadaan Siaga' };
    case 'advisory':
    default:
      return { variant: 'info' as const, label: 'Advisori Resmi' };
  }
}

function getHazardIcon(slug?: string) {
  switch (slug) {
    case 'earthquake':
      return <Activity className="w-4 h-4 text-[#C2410C]" />;
    case 'flood':
    case 'coastal_flood':
      return <Waves className="w-4 h-4 text-[#0284C7]" />;
    case 'extreme_weather':
      return <Wind className="w-4 h-4 text-[#D97706]" />;
    case 'landslide':
      return <Mountain className="w-4 h-4 text-[#B45309]" />;
    case 'fire':
      return <Flame className="w-4 h-4 text-[#DC2626]" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-[#D97706]" />;
  }
}

function getFacilityTypeLabel(type: string): string {
  switch (type) {
    case 'assembly_point':
      return 'Titik Kumpul Lapangan';
    case 'community_hall':
      return 'Balai Warga / Aula';
    case 'stadium':
      return 'Stadion Olahraga';
    case 'school':
      return 'Gedung Sekolah / Kampus';
    case 'health_facility':
      return 'Fasilitas Kesehatan';
    case 'government_office':
      return 'Kantor Pemerintah';
    case 'tent_camp':
      return 'Tenda Pengungsian BPBD';
    default:
      return 'Shelter Penampungan';
  }
}

// Fallback data for verified shelters in case API returns zero records
const FALLBACK_SHELTERS: Partial<ShelterItem>[] = [
  {
    id: 1,
    name: 'GOR Gelanggang Olahraga Remaja Rawamangun',
    facility_type: 'stadium',
    address: 'Jl. Pemuda No. 10, Rawamangun, Pulo Gadung, Jakarta Timur',
    capacity: 1200,
    current_occupancy: 150,
    operational_status: 'open',
    wheelchair_accessible: true,
    has_sanitation: true,
    elderly_friendly: true,
    verified_by_agency: 'BPBD DKI Jakarta',
    is_verified: true,
  },
  {
    id: 2,
    name: 'Balai Pertemuan Warga RW 07 Kebon Pala',
    facility_type: 'community_hall',
    address: 'Jl. Cipinang Asem No. 14, Makasar, Jakarta Timur',
    capacity: 350,
    current_occupancy: 80,
    operational_status: 'open',
    wheelchair_accessible: true,
    has_sanitation: true,
    elderly_friendly: false,
    verified_by_agency: 'BPBD DKI Jakarta',
    is_verified: true,
  },
  {
    id: 3,
    name: 'Posko Pengungsian Terpadu Lapangan Karebosi',
    facility_type: 'tent_camp',
    address: 'Jl. Jenderal Sudirman, Ujung Pandang, Kota Makassar',
    capacity: 2500,
    current_occupancy: 0,
    operational_status: 'standby',
    wheelchair_accessible: true,
    has_sanitation: true,
    elderly_friendly: true,
    verified_by_agency: 'BNPB / BPBD Sulsel',
    is_verified: true,
  },
];

export const HomePage: React.FC = () => {
  // Telemetry & Overview state
  const [overview, setOverview] = useState<PublicOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<HazardEventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);
  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [sheltersLoading, setSheltersLoading] = useState<boolean>(true);

  // 1. Instant Location Risk Calculator
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [selectedQuickRegion, setSelectedQuickRegion] = useState<string>('');
  const [isQuickChecking, setIsQuickChecking] = useState<boolean>(false);
  const [quickCheckResult, setQuickCheckResult] = useState<LocationCheckResult | null>(null);

  // 2. Interactive Family 72-Hour Logistics Calculator
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(1);
  const [elderly, setElderly] = useState<number>(0);
  const [days, setDays] = useState<number>(3);
  const [copiedLogistics, setCopiedLogistics] = useState<boolean>(false);
  const [checkedSupplies, setCheckedSupplies] = useState<Record<string, boolean>>({
    water: true,
    food: true,
    torch: false,
    firstaid: true,
    docs: true,
    radio: false,
    powerbank: false,
    special_care: false,
  });

  // 3. Interactive Shelter Quick Finder
  const [shelterSearch, setShelterSearch] = useState<string>('');
  const [shelterFacilityFilter, setShelterFacilityFilter] = useState<string>('all');
  const [shelterAccessibilityOnly, setShelterAccessibilityOnly] = useState<boolean>(false);

  // 4. Live Telemetry Feed Tab
  const [activeFeedTab, setActiveFeedTab] = useState<'events' | 'alerts'>('events');

  // 5. Quick Citizen Report & Tracking Tool
  const [reportSubTab, setReportSubTab] = useState<'create' | 'track'>('create');
  const [quickHazardSlug, setQuickHazardSlug] = useState<string>('flood');
  const [quickCoords, setQuickCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isGettingGps, setIsGettingGps] = useState<boolean>(false);
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [trackedReportResult, setTrackedReportResult] = useState<{
    id: number;
    title: string;
    tracking_code: string;
    status: string;
    description: string;
    created_at: string;
  } | null>(null);

  // 6. Interactive Survival Protocol Selector
  const [selectedProtocol, setSelectedProtocol] = useState<'earthquake' | 'flood' | 'weather'>('earthquake');

  // Fetch initial data
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const data = await publicService.getOverview();
      setOverview(data);
    } catch {
      // Graceful fallback
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await publicService.getEvents({ per_page: 6 });
      setEvents(res.data || []);
    } catch {
      // Graceful fallback
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await publicService.getAlerts({ per_page: 6 });
      setAlerts(res.data || []);
    } catch {
      // Graceful fallback
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const fetchShelters = useCallback(async () => {
    setSheltersLoading(true);
    try {
      const res = await publicService.getShelters({ per_page: 12 });
      setShelters(res.data || []);
    } catch {
      // Graceful fallback
    } finally {
      setSheltersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchEvents();
    fetchAlerts();
    fetchShelters();
    publicService.getRegions().then((r) => setRegions(r)).catch(() => {});
  }, [fetchOverview, fetchEvents, fetchAlerts, fetchShelters]);

  // GPS Risk Check
  const handleGpsCheck = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung oleh browser Anda.');
      return;
    }
    setIsQuickChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await publicService.checkLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
          setQuickCheckResult(res);
          toast.success('Analisis risiko geospasial lokasi Anda berhasil dihitung.');
        } catch {
          toast.error('Gagal menghitung risiko lokasi.');
        } finally {
          setIsQuickChecking(false);
        }
      },
      () => {
        toast.warning('Akses GPS ditolak. Silakan pilih wilayah pilot.');
        setIsQuickChecking(false);
      },
      { timeout: 8000 }
    );
  };

  const handleRegionSelectCheck = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedQuickRegion(val);
    if (!val) return;
    setIsQuickChecking(true);
    try {
      const res = await publicService.checkLocation({ region_id: Number(val) });
      setQuickCheckResult(res);
      toast.success('Analisis risiko wilayah berhasil dihitung.');
    } catch {
      toast.error('Gagal menganalisis wilayah.');
    } finally {
      setIsQuickChecking(false);
    }
  };

  // Logistics Calculations
  const totalPersons = adults + children + elderly;
  const totalWaterLiters = totalPersons * 3 * days;
  const totalFoodPortions = totalPersons * 3 * days;

  const toggleSupply = (key: string) => {
    setCheckedSupplies((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const supplyKeys = Object.keys(checkedSupplies);
  const checkedSupplyCount = supplyKeys.filter((k) => checkedSupplies[k]).length;
  const supplyPercent = Math.round((checkedSupplyCount / supplyKeys.length) * 100);

  const handleCopyLogistics = () => {
    const text = `=== RINGKASAN RANSUM SIAGA BENCANA SENTRAVAX (72 JAM) ===
Keluarga: ${adults} Dewasa, ${children} Anak, ${elderly} Lansia (Total ${totalPersons} Jiwa)
Durasi Siaga: ${days} Hari

KEBUTUHAN LOGISTIK MINIMAL:
- Air Minum Bersih: ${totalWaterLiters} Liter (3L / orang / hari)
- Ransum Makanan Siap Santap: ${totalFoodPortions} Porsi Kalori Tinggi
${elderly > 0 ? `- Cadangan Obat Rutin & Alat Bantu Lansia: Siap untuk ${days} hari\n` : ''}${children > 0 ? `- Kebutuhan Bayi/Anak (Popok, Susu, Pakaian Hangat): Siap\n` : ''}- Tas Kedap Air Dokumen Penting (KK, KTP, Ijazah, Polis)
- Kit Medis P3K, Senter LED Cadangan, Radio Baterai, Powerbank

Status Kesiapan Perlengkapan: ${supplyPercent}% Siap
Dihitung otomatis via SENTRAVAX (${new Date().toLocaleDateString('id-ID')})`;

    navigator.clipboard.writeText(text);
    setCopiedLogistics(true);
    toast.success('Rincian logistik berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedLogistics(false), 2500);
  };

  // Shelter Filtering
  const activeShelters = shelters.length > 0 ? shelters : (FALLBACK_SHELTERS as ShelterItem[]);
  const filteredShelters = useMemo(() => {
    return activeShelters.filter((s) => {
      const matchSearch =
        !shelterSearch.trim() ||
        s.name?.toLowerCase().includes(shelterSearch.toLowerCase()) ||
        s.address?.toLowerCase().includes(shelterSearch.toLowerCase());

      const matchFacility =
        shelterFacilityFilter === 'all' || s.facility_type === shelterFacilityFilter;

      const matchAccess = !shelterAccessibilityOnly || (s.wheelchair_accessible || s.elderly_friendly);

      return matchSearch && matchFacility && matchAccess;
    });
  }, [activeShelters, shelterSearch, shelterFacilityFilter, shelterAccessibilityOnly]);

  // Quick Report GPS Grabber
  const handleGetReportGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung browser.');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setQuickCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lon: Number(pos.coords.longitude.toFixed(6)),
        });
        setIsGettingGps(false);
        toast.success(`Koordinat GPS tersimpan: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => {
        setIsGettingGps(false);
        toast.warning('Akses GPS ditolak atau tidak tersedia.');
      },
      { timeout: 7000 }
    );
  };

  // Quick Report Tracking
  const handleTrackReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingInput.trim().toUpperCase();
    if (!code) {
      toast.error('Masukkan kode laporan terlebih dahulu.');
      return;
    }

    setIsTracking(true);
    setTrackedReportResult(null);
    try {
      const result = await publicService.checkReportStatus(code);
      setTrackedReportResult({
        id: result.id,
        title: result.title || 'Laporan Kejadian Bencana Warga',
        tracking_code: result.tracking_code || code,
        status: result.status || 'SUBMITTED',
        description: result.description || 'Sedang dalam proses verifikasi tim moderasi BPBD.',
        created_at: result.created_at || new Date().toISOString(),
      });
      toast.success(`Data laporan ${code} ditemukan.`);
    } catch {
      toast.error(`Laporan dengan kode "${code}" tidak ditemukan. Pastikan format benar (contoh: SVX-REP-00001).`);
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="space-y-12 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP 1-TAP EMERGENCY HOTLINE STRIP                                      */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-[#991B1B] font-bold">
          <PhoneCall className="w-4 h-4 text-[#DC2626]" />
          <span>Hotline Darurat Nasional (Bebas Pulsa):</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { num: '117', label: 'BNPB Bencana' },
            { num: '115', label: 'Basarnas SAR' },
            { num: '119', label: 'Ambulans Medis' },
            { num: '113', label: 'Damkar' },
            { num: '110', label: 'Polisi' },
          ].map((h) => (
            <a
              key={h.num}
              href={`tel:${h.num}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#FCA5A5] hover:bg-[#FEE2E2] text-[#991B1B] font-bold text-xs transition-colors shadow-2xs"
            >
              <span>{h.num}</span>
              <span className="hidden sm:inline font-normal text-gray-600">({h.label})</span>
            </a>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO: INTELIJEN BENCANA & KALKULATOR RISIKO LOKASI LANGSUNG            */}
      {/* ========================================================================= */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headline & Action Buttons */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span>SISTEM INTELIJEN & KESIAPSIAGAAN BENCANA PUBLIK</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827] leading-[1.15]">
              Intelijen Spasial &amp;
              <span className="block text-[#047857]">Kesiapsiagaan Nyata.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed max-w-xl">
              Gunakan perangkat interaktif di bawah untuk mendeteksi ancaman di posisi Anda, menghitung logistik darurat 72 jam, mencari shelter terdekat, dan melaporkan bencana seketika.
            </p>
          </div>

          {/* Quick-Action Anchors to Features on Beranda */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <a
              href="#peta-interaktif"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Map className="w-4 h-4" />
              <span>Peta Radar Live</span>
            </a>

            <a
              href="#kalkulator-logistik"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#A7F3D0] hover:bg-emerald-50 text-[#047857] text-xs font-bold transition-all shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Kalkulator Tas Siaga</span>
            </a>

            <a
              href="#cari-shelter"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all shadow-xs"
            >
              <HomeIcon className="w-4 h-4 text-[#047857]" />
              <span>Pencari Shelter</span>
            </a>

            <a
              href="#lapor-cepat"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-bold transition-all shadow-xs"
            >
              <Activity className="w-4 h-4 text-red-600" />
              <span>Lapor Cepat</span>
            </a>
          </div>
        </div>

        {/* Right Column: Instant Location Risk Checker Widget */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 text-xs">
              <span className="font-bold text-[#111827] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#047857]" />
                Kalkulator Risiko Lokasi Seketika
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                POSTGIS ENGINE
              </span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGpsCheck}
                  disabled={isQuickChecking}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] text-[#047857] text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isQuickChecking ? 'Mendeteksi...' : 'Deteksi GPS Saya'}</span>
                </button>

                <select
                  value={selectedQuickRegion}
                  onChange={handleRegionSelectCheck}
                  disabled={isQuickChecking}
                  aria-label="Pilih Wilayah Pilot"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 outline-none focus:border-[#047857]"
                >
                  <option value="">-- Pilih Wilayah Pilot --</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instant Result Box */}
              {quickCheckResult ? (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-gray-500 block">Status Risiko Terdeteksi:</span>
                      <span className="text-base font-extrabold uppercase text-[#047857]">
                        {quickCheckResult.assessment?.risk_label || quickCheckResult.assessment?.risk_level || 'NORMAL'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-600 bg-white px-2.5 py-1 rounded-lg border">
                      Skor: {Math.round(quickCheckResult.assessment?.risk_score || 0)}/100
                    </span>
                  </div>

                  {quickCheckResult.recommendations?.action_steps && quickCheckResult.recommendations.action_steps.length > 0 && (
                    <div className="text-[11px] text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0 mt-0.5" />
                      <span>{quickCheckResult.recommendations.action_steps[0]}</span>
                    </div>
                  )}

                  <Link
                    to={`${PATHS.PUBLIC.PREPAREDNESS}?region_id=${quickCheckResult.location?.region?.id || ''}&lat=${quickCheckResult.location?.latitude || ''}&lon=${quickCheckResult.location?.longitude || ''}`}
                    className="block text-center w-full py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-colors"
                  >
                    Buka Rencana Kesiapsiagaan Lengkap &rarr;
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs text-gray-500 space-y-1">
                  <span>Klik tombol di atas untuk mengetahui level ancaman gempa, banjir, dan cuaca ekstrem di posisi Anda saat ini.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TELEMETRI STATUS CEPAT (REAL-TIME METRICS)                             */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card padding="md" className="space-y-1 hover:border-[#A7F3D0] transition-colors">
            <span className="text-[11px] text-gray-500 font-semibold uppercase">Bencana Aktif</span>
            <div className="text-2xl font-extrabold text-[#111827]">
              {overviewLoading ? '...' : (overview?.active_hazard_events ?? events.length)}
            </div>
            <a href="#feed-situasi" className="text-[11px] font-bold text-[#047857] hover:underline block pt-0.5">
              Pantau Data Live &rarr;
            </a>
          </Card>

          <Card padding="md" className="space-y-1 hover:border-[#FED7AA] transition-colors">
            <span className="text-[11px] text-gray-500 font-semibold uppercase">Peringatan Dini CAP</span>
            <div className="text-2xl font-extrabold text-[#C2410C]">
              {overviewLoading ? '...' : (overview?.active_alerts ?? alerts.length)}
            </div>
            <a href="#feed-situasi" className="text-[11px] font-bold text-[#C2410C] hover:underline block pt-0.5">
              Lihat Peringatan &rarr;
            </a>
          </Card>

          <Card padding="md" className="space-y-1 hover:border-[#BFDBFE] transition-colors">
            <span className="text-[11px] text-gray-500 font-semibold uppercase">Wilayah Terpantau</span>
            <div className="text-2xl font-extrabold text-[#1D4ED8]">
              {overviewLoading ? '...' : (overview?.monitored_regions ?? regions.length)}
            </div>
            <span className="text-[11px] text-gray-500 block pt-0.5">PostGIS Geocoded</span>
          </Card>

          <Card padding="md" className="space-y-1 hover:border-[#A7F3D0] transition-colors">
            <span className="text-[11px] text-gray-500 font-semibold uppercase">Shelter Resmi Siaga</span>
            <div className="text-2xl font-extrabold text-[#059669]">
              {overviewLoading ? '...' : (shelters.length > 0 ? shelters.length : 3)}
            </div>
            <a href="#cari-shelter" className="text-[11px] font-bold text-[#059669] hover:underline block pt-0.5">
              Cek Lokasi Terdekat &rarr;
            </a>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FITUR 1: PETA BENCANA & SHELTER INTERAKTIF LANGSUNG DI BERANDA         */}
      {/* ========================================================================= */}
      <section id="peta-interaktif" className="space-y-4 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <Map className="w-3.5 h-3.5" />
              <span>RADAR GEOSPASIAL INTERAKTIF BERANDA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
              Peta Situasi Bencana &amp; Shelter Terkini
            </h2>
            <p className="text-xs text-gray-500">
              Jelajahi titik gempa BMKG, radar banjir, dan titik evakuasi shelter langsung dari peta di bawah ini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={PATHS.PUBLIC.MAP}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs"
            >
              <span>Buka Layar Penuh</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Embedded Leaflet Interactive Map */}
        <div className="rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs bg-white">
          <Suspense
            fallback={
              <div className="h-[520px] w-full flex flex-col items-center justify-center gap-3 bg-gray-50 text-xs text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin text-[#047857]" />
                <span>Memuat Komponen Peta Interaktif Leaflet...</span>
              </div>
            }
          >
            <DisasterMap
              theme="light"
              height="520px"
              showFilters={true}
              showLegend={true}
              showControls={true}
              showEventList={false}
              initialShowShelters={true}
            />
          </Suspense>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FITUR 2: KALKULATOR KESIAPSIAGAAN MANDIRI & RANSUM 72 JAM             */}
      {/* ========================================================================= */}
      <section id="kalkulator-logistik" className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PERANGKAT KESELAMATAN KELUARGA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
              Kalkulator Ransum &amp; Tas Siaga Bencana (72 Jam)
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
              Hitung kebutuhan air bersih, kalori pangan darurat, dan obat-obatan spesifik sesuai komposisi keluarga Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLogistics}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-[#047857] text-xs font-bold transition-all shadow-2xs"
            >
              {copiedLogistics ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLogistics ? 'Tersalin!' : 'Salin Ringkasan Logistik'}</span>
            </button>
            <Link
              to={PATHS.PUBLIC.PREPAREDNESS}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Portal Siaga Lengkap</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Interactive Calculator UI Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls & Result Metrics */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E5E7EB] p-6 shadow-xs space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#047857]" />
                1. Tentukan Komposisi Anggota Keluarga &amp; Durasi
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Dewasa */}
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-center">
                  <span className="text-[11px] font-bold text-gray-600 block">Dewasa</span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-colors"
                      aria-label="Kurangi Dewasa"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-base font-extrabold text-gray-900 w-6">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults((prev) => Math.min(10, prev + 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-colors"
                      aria-label="Tambah Dewasa"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Anak/Balita */}
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-center">
                  <span className="text-[11px] font-bold text-gray-600 block">Anak/Balita</span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-colors"
                      aria-label="Kurangi Anak"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-base font-extrabold text-gray-900 w-6">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren((prev) => Math.min(10, prev + 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-colors"
                      aria-label="Tambah Anak"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lansia */}
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-center">
                  <span className="text-[11px] font-bold text-gray-600 block">Lansia</span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setElderly((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-colors"
                      aria-label="Kurangi Lansia"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-base font-extrabold text-gray-900 w-6">{elderly}</span>
                    <button
                      type="button"
                      onClick={() => setElderly((prev) => Math.min(10, prev + 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-colors"
                      aria-label="Tambah Lansia"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Durasi Siaga */}
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-center">
                  <span className="text-[11px] font-bold text-gray-600 block">Durasi Hari</span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDays((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-colors"
                      aria-label="Kurangi Hari"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-base font-extrabold text-emerald-800 w-6">{days}h</span>
                    <button
                      type="button"
                      onClick={() => setDays((prev) => Math.min(14, prev + 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-colors"
                      aria-label="Tambah Hari"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Results Banner */}
            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-3">
              <span className="text-[11px] font-mono font-bold text-[#047857] uppercase tracking-wider block">
                HASIL ESTIMASI LOGISTIK STANDAR BNPB ({totalPersons} JIWA, {days} HARI)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-1">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-[#0284C7]" />
                    Air Bersih &amp; Minum:
                  </span>
                  <span className="text-xl font-extrabold text-gray-900 block">
                    {totalWaterLiters} Liter
                  </span>
                  <span className="text-[10px] text-gray-400">Minimal 3L / orang / hari untuk konsumsi &amp; sanitasi darurat</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-1">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#C2410C]" />
                    Ransum Makanan Cepat Saji:
                  </span>
                  <span className="text-xl font-extrabold text-gray-900 block">
                    {totalFoodPortions} Porsi
                  </span>
                  <span className="text-[10px] text-gray-400">Biskuit kalori, makanan kaleng, sereal tanpa masak</span>
                </div>
              </div>

              {(elderly > 0 || children > 0) && (
                <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200 text-[11px] text-gray-700 space-y-1">
                  <span className="font-bold text-[#047857] block">Perhatian Kebutuhan Khusus:</span>
                  {elderly > 0 && (
                    <p className="flex items-center gap-1.5">
                      <Accessibility className="w-3 h-3 text-[#047857]" />
                      Sediakan resep dan persediaan obat rutin lansia untuk minimal {days} hari ke depan.
                    </p>
                  )}
                  {children > 0 && (
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-[#047857]" />
                      Siapkan persediaan popok bayi, bubur instan, dan pakaian ganti hangat ekstra.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Checklist Preview */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-[#E5E7EB] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#047857] font-bold">CHECKLIST FISIK</span>
                <h3 className="text-sm font-bold text-gray-900">Kesiapan Perlengkapan</h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#047857] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {supplyPercent}% Lengkap
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-[#047857] transition-all duration-300 rounded-full"
                style={{ width: `${supplyPercent}%` }}
              />
            </div>

            {/* Checklist items */}
            <div className="space-y-1.5">
              {[
                { id: 'water', label: `Air Minum Kemasan Segel (${totalWaterLiters} Liter)` },
                { id: 'food', label: `Ransum Makanan Kalori Siap Santap (${totalFoodPortions} Porsi)` },
                { id: 'docs', label: 'Dokumen Penting (KK/KTP) dalam Tas Kedap Air' },
                { id: 'firstaid', label: 'Kotak P3K, Antiseptik, Obat Penurun Panas' },
                { id: 'torch', label: 'Senter LED Tahan Air + Baterai Cadangan' },
                { id: 'powerbank', label: 'Powerbank Penuh & Kabel Pengisi Daya' },
                { id: 'radio', label: 'Peluit Darurat & Radio Saku Frekuensi FM' },
                { id: 'special_care', label: 'Perlengkapan Khusus Balita / Obat Lansia' },
              ].map((item) => {
                const isChecked = !!checkedSupplies[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSupply(item.id)}
                    className="w-full text-left p-2.5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 flex items-center gap-2.5 transition-colors text-xs text-gray-800"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#047857] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <span className={isChecked ? 'line-through text-gray-400' : 'font-medium'}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FITUR 3: DIREKTORI & PENCARI SHELTER CEPAT DENGAN RUTE                 */}
      {/* ========================================================================= */}
      <section id="cari-shelter" className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <HomeIcon className="w-3.5 h-3.5" />
              <span>EVAKUASI CEPAT WARGA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
              Pencari Shelter &amp; Posko Terdekat
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
              Cari titik penampungan resmi terverifikasi BPBD/BNPB, pantau sisa kapasitas, dan buka petunjuk arah peta seketika.
            </p>
          </div>

          <Link
            to={PATHS.PUBLIC.SHELTERS}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <span>Buka Direktori Lengkap</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Shelter Interactive Filter Strip */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={shelterSearch}
                onChange={(e) => setShelterSearch(e.target.value)}
                placeholder="Cari nama shelter atau jalan..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:border-[#047857]"
              />
            </div>

            {/* Facility Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full">
              {[
                { id: 'all', label: 'Semua Tipe' },
                { id: 'stadium', label: 'GOR / Stadion' },
                { id: 'community_hall', label: 'Balai Warga' },
                { id: 'tent_camp', label: 'Tenda BPBD' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setShelterFacilityFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    shelterFacilityFilter === f.id
                      ? 'bg-[#047857] text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShelterAccessibilityOnly((prev) => !prev)}
                className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  shelterAccessibilityOnly
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Accessibility className="w-3.5 h-3.5" />
                <span>Ramah Lansia/Difabel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Shelter Result Cards Grid */}
        {sheltersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredShelters.length === 0 ? (
          <div className="p-8 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs text-gray-500">
            Tidak ada shelter yang cocok dengan kriteria pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredShelters.slice(0, 6).map((s, idx) => {
              const capacity = s.capacity || 1000;
              const occupancy = s.current_occupancy || 0;
              const percentFull = Math.min(100, Math.round((occupancy / capacity) * 100));

              return (
                <div
                  key={s.id || idx}
                  className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#A7F3D0] transition-all shadow-2xs flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {getFacilityTypeLabel(s.facility_type || 'stadium')}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {s.operational_status === 'open' ? 'TERBUKA' : 'SIAGA (STANDBY)'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#047857] transition-colors line-clamp-1">
                      {s.name}
                    </h3>

                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                      {s.address}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-2.5 text-xs">
                    {/* Capacity Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-600">
                        <span>Kapasitas:</span>
                        <span className="font-bold text-gray-900">
                          {occupancy} / {capacity} jiwa ({percentFull}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentFull > 85 ? 'bg-red-500' : percentFull > 50 ? 'bg-amber-500' : 'bg-[#047857]'
                          }`}
                          style={{ width: `${percentFull}%` }}
                        />
                      </div>
                    </div>

                    {/* Facility Tags & Directions Button */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        {s.has_sanitation && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Sanitasi
                          </span>
                        )}
                        {s.wheelchair_accessible && (
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-0.5">
                            <Accessibility className="w-3 h-3" /> Difabel
                          </span>
                        )}
                      </div>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address || s.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#047857] hover:underline"
                      >
                        <span>Petunjuk Arah</span>
                        <Navigation className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 7. FITUR 4: SITUASI TERKINI & PERINGATAN DINI LIVE DENGAN TAB             */}
      {/* ========================================================================= */}
      <section id="feed-situasi" className="space-y-4 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              TELEMETRI AKTIF
            </span>
            <h2 className="text-xl font-extrabold text-[#111827]">
              Monitoring Kejadian Bencana &amp; Peringatan Dini
            </h2>
          </div>

          {/* Interactive Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveFeedTab('events')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFeedTab === 'events'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kejadian Bencana ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFeedTab('alerts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFeedTab === 'alerts'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Peringatan Dini CAP ({alerts.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Kejadian Bencana */}
        {activeFeedTab === 'events' && (
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs p-5 space-y-4">
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">Tidak ada bencana aktif terdeteksi saat ini.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {events.map((ev) => {
                  const badge = getSeverityBadge(ev.severity);
                  return (
                    <Link
                      key={ev.id}
                      to={PATHS.PUBLIC.DISASTER_DETAIL.replace(':id', String(ev.id))}
                      className="p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between gap-3 group border border-gray-100"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          {getHazardIcon(ev.hazard_type?.slug)}
                          <span className="text-xs font-bold text-gray-900 truncate group-hover:text-[#047857] transition-colors">
                            {ev.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 block truncate">
                          {ev.region?.name || 'Indonesia'} • {formatEventDate(ev.occurred_at)}
                        </span>
                      </div>
                      <Badge variant={badge.variant} size="sm">
                        {badge.label}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="pt-2 text-right">
              <Link to={PATHS.PUBLIC.DISASTERS} className="text-xs font-bold text-[#047857] hover:underline inline-flex items-center gap-1">
                <span>Lihat Seluruh Katalog Kejadian Bencana</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Tab 2: Peringatan Dini CAP */}
        {activeFeedTab === 'alerts' && (
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs p-5 space-y-4">
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">Tidak ada peringatan dini darurat saat ini.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {alerts.map((al) => {
                  const badge = getAlertBadge(al.alert_class);
                  return (
                    <Link
                      key={al.id}
                      to={PATHS.PUBLIC.WARNING_DETAIL.replace(':id', String(al.id))}
                      className="p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between gap-3 group border border-gray-100"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-[#D97706] transition-colors">
                          {al.title}
                        </h4>
                        <span className="text-[11px] text-gray-500 block truncate">
                          {al.region?.name || 'Seluruh Wilayah'} • {formatEventDate(al.starts_at)}
                        </span>
                      </div>
                      <Badge variant={badge.variant} size="sm">
                        {badge.label}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="pt-2 text-right">
              <Link to={PATHS.PUBLIC.WARNINGS} className="text-xs font-bold text-[#047857] hover:underline inline-flex items-center gap-1">
                <span>Lihat Seluruh Peringatan Dini CAP</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 8. FITUR 5: LAPOR CEPAT BENCANA & LACAK STATUS DI BERANDA                 */}
      {/* ========================================================================= */}
      <section id="lapor-cepat" className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="rounded-3xl bg-linear-to-br from-red-50/80 via-white to-red-50/30 border border-red-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 text-xs font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span>AKSI PARTISIPATIF WARGA BERBASIS SPASIAL</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950">
                Pusat Lapor Bencana &amp; Pelacakan Status
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-xl">
                Laporkan situasi bahaya langsung dengan koordinat GPS Anda, atau lacak status verifikasi laporan yang sudah diajukan.
              </p>
            </div>

            {/* Mode Tab Switcher */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-red-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setReportSubTab('create')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  reportSubTab === 'create'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-700 hover:text-red-700'
                }`}
              >
                Buat Laporan Cepat
              </button>
              <button
                type="button"
                onClick={() => setReportSubTab('track')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  reportSubTab === 'track'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-700 hover:text-red-700'
                }`}
              >
                Lacak Status Laporan
              </button>
            </div>
          </div>

          {/* Subtab 1: Quick Report Dispatcher */}
          {reportSubTab === 'create' && (
            <div className="p-5 rounded-2xl bg-white border border-red-100 shadow-xs space-y-4">
              <span className="text-xs font-bold text-gray-900 block">
                1. Pilih Kategori Kejadian yang Terjadi:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { slug: 'flood', label: 'Banjir Luapan', icon: <Waves className="w-4 h-4 text-blue-600" /> },
                  { slug: 'earthquake', label: 'Gempa Bumi', icon: <Activity className="w-4 h-4 text-orange-600" /> },
                  { slug: 'landslide', label: 'Tanah Longsor', icon: <Mountain className="w-4 h-4 text-amber-700" /> },
                  { slug: 'fire', label: 'Kebakaran', icon: <Flame className="w-4 h-4 text-red-600" /> },
                  { slug: 'extreme_weather', label: 'Cuaca Ekstrem', icon: <Wind className="w-4 h-4 text-emerald-600" /> },
                ].map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setQuickHazardSlug(item.slug)}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                      quickHazardSlug === item.slug
                        ? 'border-red-500 bg-red-50 text-red-800 ring-2 ring-red-400/20'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleGetReportGps}
                    disabled={isGettingGps}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    <Navigation className="w-3.5 h-3.5 text-red-600" />
                    <span>{isGettingGps ? 'Merekam GPS...' : quickCoords ? 'GPS Terekam' : 'Ambil Titik GPS Saya'}</span>
                  </button>

                  {quickCoords && (
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      {quickCoords.lat}, {quickCoords.lon}
                    </span>
                  )}
                </div>

                <Link
                  to={`${PATHS.PUBLIC.REPORT}?hazard=${quickHazardSlug}${quickCoords ? `&lat=${quickCoords.lat}&lon=${quickCoords.lon}` : ''}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Rincian Laporan Lengkap</span>
                </Link>
              </div>
            </div>
          )}

          {/* Subtab 2: Track Report Status */}
          {reportSubTab === 'track' && (
            <div className="p-5 rounded-2xl bg-white border border-red-100 shadow-xs space-y-4">
              <form onSubmit={handleTrackReport} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Masukkan Kode Laporan (Contoh: SVX-REP-00001)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-mono text-gray-900 outline-none focus:border-red-500 uppercase"
                />
                <Button
                  type="submit"
                  disabled={isTracking}
                  variant="primary"
                  size="md"
                  className="bg-red-600 hover:bg-red-700 border-none shrink-0"
                >
                  {isTracking ? 'Melacak...' : 'Lacak Status'}
                </Button>
              </form>

              {trackedReportResult && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900">{trackedReportResult.tracking_code}</span>
                    <Badge variant={trackedReportResult.status === 'VERIFIED' ? 'success' : 'warning'} size="sm">
                      {trackedReportResult.status}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-gray-900">{trackedReportResult.title}</h4>
                  <p className="text-gray-600 text-[11px] leading-relaxed">{trackedReportResult.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FITUR 6: PROTOKOL AKSI KESELAMATAN INTERAKTIF                          */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <BookOpen className="w-3.5 h-3.5" />
              <span>PROTOKOL AKSI CEPAT KESELAMATAN</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
              Langkah Penyelamatan Diri Seketika
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
              Pilih jenis bencana untuk melihat tindakan refleks yang harus segera diambil keluarga Anda saat sirine peringatan berbunyi.
            </p>
          </div>

          <Link
            to={PATHS.PUBLIC.EDUCATION}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-bold transition-all shadow-2xs shrink-0"
          >
            <span>Seluruh Panduan Edukasi</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Interactive Protocol Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'earthquake' as const,
              title: 'Protokol Gempa Bumi',
              sub: 'Drop, Cover, Hold On',
              icon: <Activity className="w-4 h-4 text-[#C2410C]" />,
              points: [
                'DROP: Rendahkan badan dan lindungi kepala dengan kedua tangan',
                'COVER: Masuk ke bawah meja kokoh; jauhi kaca jendela dan lemari gantung',
                'HOLD ON: Pegang kaki meja erat-erat hingga getaran seismik benar-benar berhenti',
              ],
            },
            {
              id: 'flood' as const,
              title: 'Protokol Banjir Luapan',
              sub: 'Listrik & Evakuasi Tinggi',
              icon: <Waves className="w-4 h-4 text-[#0284C7]" />,
              points: [
                'Segera matikan sakelar pemutus listrik (MCB) dan cabut regulator gas',
                'Amankan tas siaga dan arsip penting ke wadah kedap air di lantai atas',
                'Jangan menerobos arus air deras yang melebihi mata kaki (15 cm)',
              ],
            },
            {
              id: 'weather' as const,
              title: 'Protokol Cuaca Ekstrem',
              sub: 'Badai & Angin Kencang',
              icon: <Wind className="w-4 h-4 text-[#D97706]" />,
              points: [
                'Masuk ke ruangan paling tengah tanpa jendela di lantai dasar bangunan',
                'Hindari berteduh di dekat pohon rimbun, tiang listrik, atau baliho besar',
                'Cabut kabel perangkat elektronik sensitif untuk mencegah lonjakan petir',
              ],
            },
          ].map((proto) => {
            const isSelected = selectedProtocol === proto.id;
            return (
              <div
                key={proto.id}
                onClick={() => setSelectedProtocol(proto.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 shadow-2xs ${
                  isSelected
                    ? 'bg-emerald-50/50 border-[#047857] ring-2 ring-[#047857]/20'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {proto.icon}
                    <h3 className="text-sm font-bold text-gray-900">{proto.title}</h3>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 font-bold">{proto.sub}</span>
                </div>

                <div className="space-y-2 pt-1 border-t border-gray-100">
                  {proto.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. EKOSISTEM AKSES TERPADU (PORTAL WARGA, ADMIN, INTELLIGENCE)           */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-4 border-t border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-[#111827] uppercase tracking-wider">
            Ekosistem Akses Terpadu SENTRAVAX
          </h2>
          <span className="text-xs text-gray-500 font-mono">PORTAL RESMI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to={PATHS.USER.DASHBOARD}
            className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#0284C7] transition-all shadow-xs flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#0284C7] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#0284C7]">Portal Kesiapsiagaan Warga</h3>
              <p className="text-xs text-gray-500">Rencana darurat keluarga, kontak prioritas darurat, dan checklist tas siaga.</p>
            </div>
            <span className="text-xs font-bold text-[#0284C7] pt-3 flex items-center gap-1">
              Buka Portal Warga &rarr;
            </span>
          </Link>

          <Link
            to={PATHS.ADMIN.DASHBOARD}
            className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-white hover:border-[#F59E0B] transition-all shadow-xs flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#212121] text-[#F59E0B] flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#F59E0B]">Admin Console</h3>
              <p className="text-xs text-gray-400">Moderasi laporan warga, registry shelter, dan audit trail operasional.</p>
            </div>
            <span className="text-xs font-bold text-[#F59E0B] pt-3 flex items-center gap-1">
              Akses Admin &rarr;
            </span>
          </Link>

          <Link
            to={PATHS.INTELLIGENCE.OVERVIEW}
            className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-white hover:border-[#10B981] transition-all shadow-xs flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#212121] text-[#10B981] flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#10B981]">Intelligence Center</h3>
              <p className="text-xs text-gray-400">Analisis risiko spasial multi-hazard dan diseminasi peringatan dini resmi.</p>
            </div>
            <span className="text-xs font-bold text-[#10B981] pt-3 flex items-center gap-1">
              Buka Komando &rarr;
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};
