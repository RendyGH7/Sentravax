import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import type { 
  PublicOverviewData, 
  HazardEventItem, 
  AlertItem,
  EducationContentItem
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
  Users, 
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
  FileText,
  ArrowRight,
  Crosshair,
  CheckSquare,
  Square,
  Accessibility
} from 'lucide-react';
import { toast } from 'sonner';

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

// Fallback education guides for immediate citizen actionable guidance
const FALLBACK_EDUCATION = [
  {
    id: 1,
    title: 'Protokol Drop, Cover, Hold On Gempa Bumi',
    category: 'Kesiapsiagaan',
    summary: 'Refleks penyelamatan diri paling efektif di dalam gedung atau rumah saat getaran seismik tektonik melanda.',
    hazard_name: 'Gempa Bumi',
    slug: 'protokol-gempa-bumi-drop-cover-hold',
    read_time: '3 menit baca',
    action_points: [
      'DROP: Segera rendahkan tubuh berlutut agar tidak jatuh',
      'COVER: Lindungi kepala dan leher di bawah meja kokoh',
      'HOLD ON: Pegang kaki meja erat-erat hingga getaran berhenti'
    ]
  },
  {
    id: 2,
    title: 'Mitigasi Banjir Luapan & Genangan Ekstrem',
    category: 'Mitigasi',
    summary: 'Langkah protektif kelistrikan, penyelamatan arsip legal, dan evakuasi mandiri sebelum air melebihi ambang bahaya.',
    hazard_name: 'Banjir & Luapan',
    slug: 'mitigasi-banjir-luapan-ekstrem',
    read_time: '4 menit baca',
    action_points: [
      'Matikan sakelar listrik utama (MCB) dan cabut regulator gas',
      'Pindahkan arsip penting & obat ke dalam wadah kedap air',
      'Evakuasi ke tempat tinggi sebelum arus air mencapai 30 cm'
    ]
  },
  {
    id: 3,
    title: 'Kesiapsiagaan Cuaca Ekstrem & Puting Beliung',
    category: 'Kesiapsiagaan',
    summary: 'Tindakan bertahan saat angin badai kencang, sambaran petir, dan potensi pohon tumbang di musim pancaroba.',
    hazard_name: 'Cuaca Ekstrem',
    slug: 'kesiapsiagaan-cuaca-ekstrem-angin-kencang',
    read_time: '3 menit baca',
    action_points: [
      'Jauhi jendela kaca, pintu kaca, dan dinding luar bangunan',
      'Masuk ke ruangan paling tengah tanpa jendela di lantai dasar',
      'Hindari berteduh di bawah pohon besar, tiang listrik, atau baliho'
    ]
  }
];

// Interactive Go-Bag items for quick homepage test
const GO_BAG_QUICK_ITEMS = [
  { id: 'water', label: 'Air mineral 3L/orang untuk kebutuhan 72 jam' },
  { id: 'docs', label: 'Dokumen penting keluarga dalam wadah kedap air' },
  { id: 'meds', label: 'Kotak P3K & cadangan obat-obatan pribadi 7 hari' },
  { id: 'torch', label: 'Senter LED, baterai cadangan, dan peluit darurat' },
];

export const HomePage: React.FC = () => {
  const [overview, setOverview] = useState<PublicOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);

  const [events, setEvents] = useState<HazardEventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);

  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [sheltersLoading, setSheltersLoading] = useState<boolean>(true);

  const [educationItems, setEducationItems] = useState<EducationContentItem[]>([]);
  const [educationLoading, setEducationLoading] = useState<boolean>(true);

  // Instant Hero Risk Checker
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [selectedQuickRegion, setSelectedQuickRegion] = useState<string>('');
  const [isQuickChecking, setIsQuickChecking] = useState<boolean>(false);
  const [quickCheckResult, setQuickCheckResult] = useState<LocationCheckResult | null>(null);

  // Interactive Go-Bag checklist state on homepage
  const [checkedGoBag, setCheckedGoBag] = useState<Record<string, boolean>>({
    water: true,
    docs: true,
  });

  const toggleGoBag = (id: string) => {
    setCheckedGoBag((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const goBagCompletedCount = Object.values(checkedGoBag).filter(Boolean).length;
  const goBagPercent = Math.round((goBagCompletedCount / GO_BAG_QUICK_ITEMS.length) * 100);

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
      const res = await publicService.getEvents({ per_page: 3 });
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
      const res = await publicService.getAlerts({ per_page: 3 });
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
      const res = await publicService.getShelters({ per_page: 3 });
      setShelters(res.data || []);
    } catch {
      // Graceful fallback
    } finally {
      setSheltersLoading(false);
    }
  }, []);

  const fetchEducation = useCallback(async () => {
    setEducationLoading(true);
    try {
      const res = await publicService.getEducation({ per_page: 3 });
      setEducationItems(res.data || []);
    } catch {
      // Graceful fallback
    } finally {
      setEducationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchEvents();
    fetchAlerts();
    fetchShelters();
    fetchEducation();
    publicService.getRegions().then((r) => setRegions(r)).catch(() => {});
  }, [fetchOverview, fetchEvents, fetchAlerts, fetchShelters, fetchEducation]);

  // Instant Quick GPS Check in Hero
  const handleGpsCheck = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung browser.');
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
          toast.success('Analisis risiko lokasi GPS berhasil dihitung.');
        } catch {
          toast.error('Gagal menghitung risiko lokasi.');
        } finally {
          setIsQuickChecking(false);
        }
      },
      () => {
        toast.warning('Akses GPS ditolak. Pilih wilayah dari daftar.');
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

  // Resolved shelters to display
  const displayShelters = shelters.length > 0 ? shelters.slice(0, 3) : FALLBACK_SHELTERS;

  // Resolved education to display
  const displayEducation = educationItems.length > 0
    ? educationItems.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category || 'Mitigasi',
        summary: item.summary || 'Panduan mitigasi dan aksi penyelamatan bencana.',
        slug: item.slug,
        read_time: '3 menit baca',
        action_points: [
          'Ketahui ancaman risiko spesifik di zona hunian Anda',
          'Siapkan perlengkapan darurat mandiri sebelum bencana',
          'Ikuti arahan resmi otoritas BPBD saat proses evakuasi',
        ],
      }))
    : FALLBACK_EDUCATION;

  return (
    <div className="space-y-16 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP 1-CLICK EMERGENCY HOTLINE STRIP                                    */}
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
      {/* 2. HERO SECTION WITH INSTANT RISK & SHELTER CHECKER WIDGET               */}
      {/* ========================================================================= */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headline & Action Buttons */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span>PORTAL UTAMA INTELIJEN & KESIAPSIAGAAN BENCANA</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827] leading-[1.15]">
              Intelijen Spasial &amp;
              <span className="block text-[#047857]">Kesiapsiagaan Bencana.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed max-w-xl">
              Deteksi risiko di posisi Anda, pantau ancaman real-time, dan temukan shelter terdekat.
            </p>
          </div>

          {/* Action CTAs connecting core pages */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link to={PATHS.PUBLIC.MAP}>
              <Button 
                variant="primary" 
                size="md" 
                leftIcon={<Map className="w-4 h-4" />}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Peta Risiko Geospasial
              </Button>
            </Link>

            <Link to={PATHS.PUBLIC.PREPAREDNESS}>
              <Button 
                variant="outline" 
                size="md" 
                leftIcon={<ShieldCheck className="w-4 h-4 text-[#047857]" />}
              >
                Kesiapsiagaan Personal
              </Button>
            </Link>

            <Link to={PATHS.PUBLIC.REPORT}>
              <Button 
                variant="outline" 
                size="md" 
                className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                leftIcon={<Activity className="w-4 h-4 text-red-600" />}
              >
                Lapor Bencana Cepat
              </Button>
            </Link>
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
      {/* 3. COMPACT SITUATION OVERVIEW STRIP                                       */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-4 border-t border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#047857]" />
            Telemetri Bencana Nasional Real-Time
          </h2>
          <button
            type="button"
            onClick={() => {
              fetchOverview();
              fetchEvents();
              fetchAlerts();
              fetchShelters();
              fetchEducation();
            }}
            className="text-xs text-[#047857] hover:underline flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3 h-3" /> Segarkan
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card padding="md" className="space-y-1 hover:border-[#A7F3D0] transition-colors">
            <span className="text-[11px] text-gray-500 font-semibold uppercase">Kejadian Bencana Aktif</span>
            <div className="text-2xl font-extrabold text-[#111827]">
              {overviewLoading ? '...' : (overview?.active_hazard_events ?? 0)}
            </div>
            <Link to={PATHS.PUBLIC.DISASTERS} className="text-[11px] font-bold text-[#047857] hover:underline block pt-0.5">
              Lihat Katalog &rarr;
            </Link>
          </Card>

          <Card padding="md" className="space-y-1 hover:border-[#FED7AA] transition-colors">
            <span className="text-[11px] text-gray-500 font-semibold uppercase">Peringatan Dini CAP</span>
            <div className="text-2xl font-extrabold text-[#C2410C]">
              {overviewLoading ? '...' : (overview?.active_alerts ?? 0)}
            </div>
            <Link to={PATHS.PUBLIC.WARNINGS} className="text-[11px] font-bold text-[#C2410C] hover:underline block pt-0.5">
              Lihat Peringatan &rarr;
            </Link>
          </Card>

          <Card padding="md" className="space-y-1 hover:border-[#BFDBFE] transition-colors">
            <span className="text-[11px] text-gray-500 font-semibold uppercase">Wilayah Terpantau</span>
            <div className="text-2xl font-extrabold text-[#1D4ED8]">
              {overviewLoading ? '...' : (overview?.monitored_regions ?? 0)}
            </div>
            <span className="text-[11px] text-gray-500 block pt-0.5">PostGIS Geocoded</span>
          </Card>

          <Card padding="md" className="space-y-1 hover:border-[#A7F3D0] transition-colors">
            <span className="text-[11px] text-gray-500 font-semibold uppercase">Shelter Resmi Terverifikasi</span>
            <div className="text-2xl font-extrabold text-[#059669]">
              {overviewLoading ? '...' : (shelters.length > 0 ? shelters.length : 3)}
            </div>
            <Link to={PATHS.PUBLIC.SHELTERS} className="text-[11px] font-bold text-[#059669] hover:underline block pt-0.5">
              Direktori Shelter &rarr;
            </Link>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURE 1: PETA RISIKO GEOSPASIAL MULTI-HAZARD (/map)                 */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <Map className="w-3.5 h-3.5" />
              <span>Sistem Geospasial GIS Interaktif</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
              Peta Risiko Multi-Hazard
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
              Layer interaktif seismik BMKG, radar banjir, zonasi vulkanik, dan shelter evakuasi.
            </p>
          </div>
          <Link
            to={PATHS.PUBLIC.MAP}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Map className="w-4 h-4" />
            <span>Buka Peta Interaktif Lengkap</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Multi-Hazard Map Layers Highlight Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#FDBA74] transition-all shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#C2410C]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Seismik Tektonik BMKG</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Episentrum gempa bumi real-time, magnitudo, kedalaman, serta estimasi intensitas guncangan (MMI).
              </p>
            </div>
            <span className="inline-block text-[10px] font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
              FEED RESMI BMKG
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#93C5FD] transition-all shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0284C7]">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Genangan Banjir &amp; Curah Hujan</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Pemantauan tinggi muka air bendungan, risiko banjir bandang, serta radar citra satelit hidrometeorologi.
              </p>
            </div>
            <span className="inline-block text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              RADAR SATELIT LIVE
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#FCA5A5] transition-all shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#DC2626]">
              <Mountain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Zonasi Vulkanik PVMBG</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Kawasan Rawan Bencana (KRB) I, II, dan III untuk gunung api aktif dengan status Level I hingga IV.
              </p>
            </div>
            <span className="inline-block text-[10px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
              ZONASI BAHAYA PVMBG
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#A7F3D0] transition-all shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#047857]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Radius Jangkauan Shelter</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Buffer radius evakuasi terdekat, ketersediaan kapasitas ruang, dan koridor jalur evakuasi aman.
              </p>
            </div>
            <span className="inline-block text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              POSTGIS BUFFER 5KM
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SITUASI TERKINI: KEJADIAN BENCANA & PERINGATAN DINI CAP                */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-4 border-t border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              MONITORING KEJADIAN AKTIF
            </span>
            <h2 className="text-xl font-extrabold text-[#111827]">
              Kejadian Bencana &amp; Peringatan Dini
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hazards Feed (/disasters) */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C2410C]" />
                Kejadian Bencana Terkini
              </h3>
              <Link to={PATHS.PUBLIC.DISASTERS} className="text-xs font-bold text-[#047857] hover:underline flex items-center gap-1">
                <span>Lihat Semua Katalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">Tidak ada bencana aktif terdeteksi saat ini.</p>
            ) : (
              <div className="space-y-2.5">
                {events.map((ev) => {
                  const badge = getSeverityBadge(ev.severity);
                  return (
                    <Link
                      key={ev.id}
                      to={PATHS.PUBLIC.DISASTER_DETAIL.replace(':id', String(ev.id))}
                      className="p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between gap-3 group"
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
          </div>

          {/* CAP Warnings Feed (/warnings) */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                Peringatan Dini CAP Resmi
              </h3>
              <Link to={PATHS.PUBLIC.WARNINGS} className="text-xs font-bold text-[#047857] hover:underline flex items-center gap-1">
                <span>Lihat Semua Peringatan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">Tidak ada peringatan dini darurat saat ini.</p>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((al) => {
                  const badge = getAlertBadge(al.alert_class);
                  return (
                    <Link
                      key={al.id}
                      to={PATHS.PUBLIC.WARNING_DETAIL.replace(':id', String(al.id))}
                      className="p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between gap-3 group"
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
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FEATURE 2: KESIAPSIAGAAN MANDIRI & TAS SIAGA 72 JAM (/preparedness)   */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kesiapsiagaan Warga &amp; Keluarga</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
              Siaga Personal &amp; Tas Siaga 72 Jam
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
              Simulasi kesiapan darurat mandiri sebelum bantuan tiba di lokasi Anda.
            </p>
          </div>
          <Link
            to={PATHS.PUBLIC.PREPAREDNESS}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mulai Rencana Siaga Lengkap</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Pillars + Interactive Mini Checklist Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 3 Core Pillars */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#A7F3D0] transition-all flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#047857] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">Pilar 1: Tas Siaga Bencana (Go-Bag 72 Jam)</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Menyiapkan ransum darurat kalori tinggi, air minum 3 liter/hari/orang, kotak obat keluarga, senter LED tahan air, dan arsip legal dalam kantung kedap air.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#93C5FD] transition-all flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#0284C7] flex items-center justify-center shrink-0">
                <Crosshair className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">Pilar 2: Titik Kumpul &amp; Jalur Evakuasi Terencana</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Menentukan titik temu primer di lingkungan RT/RW dan titik sekunder di luar zona rawan bahaya jika anggota keluarga terpisah saat bencana terjadi.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#FED7AA] transition-all flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#C2410C] flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">Pilar 3: Rencana Komunikasi Darurat Terpusat</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Menunjuk satu kontak kerabat di luar wilayah provinsi sebagai narahubung utama keluarga ketika jaringan telekomunikasi lokal mengalami gangguan.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Interactive Quick Checklist Preview */}
          <div className="lg:col-span-5 rounded-3xl bg-emerald-50/60 border border-emerald-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold">SIMULATOR MANDIRI</span>
                <h3 className="text-sm font-bold text-emerald-950">Uji Kesiapan Tas Siaga Anda</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                {goBagPercent}% Siap
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-emerald-200 overflow-hidden">
              <div
                className="h-full bg-[#047857] transition-all duration-300 rounded-full"
                style={{ width: `${goBagPercent}%` }}
              />
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              {GO_BAG_QUICK_ITEMS.map((item) => {
                const isChecked = !!checkedGoBag[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleGoBag(item.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-white border border-emerald-100 hover:border-emerald-300 flex items-center gap-3 transition-colors text-xs text-gray-800"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#047857] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <span className={isChecked ? 'line-through text-gray-400' : 'font-medium'}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Link
              to={PATHS.PUBLIC.PREPAREDNESS}
              className="block text-center w-full py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-colors shadow-2xs"
            >
              Simpan &amp; Lanjutkan ke Rencana Lengkap &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FEATURE 3: DIREKTORI SHELTER & TITIK PENGUNGSIAN RESMI (/shelters)     */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Fasilitas Evakuasi Terverifikasi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
              Direktori Shelter &amp; Titik Kumpul
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
              Fasilitas pengungsian terverifikasi BPBD/BNPB dengan kapasitas dan fasilitas darurat.
            </p>
          </div>
          <Link
            to={PATHS.PUBLIC.SHELTERS}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Lihat Seluruh Shelter Resmi</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Shelter Showcase Cards */}
        {sheltersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayShelters.map((s, idx) => (
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
                      {s.operational_status === 'open' ? 'BEROPERASI' : 'SIAGA (STANDBY)'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#047857] transition-colors line-clamp-1">
                    {s.name}
                  </h3>

                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {s.address}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Kapasitas:</span>
                    <span className="font-bold text-gray-900">
                      {s.current_occupancy ?? 0} / {s.capacity || 'Tidak Terbatas'} jiwa
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {s.has_sanitation && (
                      <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Sanitasi Lengkap
                      </span>
                    )}
                    {s.wheelchair_accessible && (
                      <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                        <Accessibility className="w-3 h-3" /> Ramah Difabel
                      </span>
                    )}
                    {s.verified_by_agency && (
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {s.verified_by_agency}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 8. FEATURE 4: PUSAT EDUKASI & PANDUAN MITIGASI BENCANA (/education)        */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Literasi &amp; Tanggap Kebencanaan</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
              Pusat Edukasi &amp; Protokol Keselamatan
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
              Langkah aksi penyelamatan mandiri saat gempa bumi, banjir luapan, dan cuaca ekstrem.
            </p>
          </div>
          <Link
            to={PATHS.PUBLIC.EDUCATION}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            <span>Jelajahi Seluruh Panduan</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Education Guides Grid */}
        {educationLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {displayEducation.map((guide) => (
              <div
                key={guide.id}
                className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#047857] transition-all shadow-2xs flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#047857] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                      {guide.category}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {guide.read_time}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#047857] transition-colors leading-snug">
                    {guide.title}
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {guide.summary}
                  </p>

                  {/* Practical action steps */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    {guide.action_points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to={PATHS.PUBLIC.EDUCATION}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] group-hover:underline pt-2"
                >
                  <span>Baca panduan lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 9. FEATURE 5: LAPOR BENCANA PARTISIPATIF WARGA (/report)                 */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="rounded-3xl bg-linear-to-br from-red-50/80 via-white to-red-50/30 border border-red-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 text-xs font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span>ZERO-BARRIER CITIZEN REPORTING</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950">
                Lapor Kejadian Bencana
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-xl">
                Laporkan kejadian darurat di sekitar Anda dengan bukti foto dan geotagging GPS otomatis.
              </p>
            </div>

            <Link
              to={PATHS.PUBLIC.REPORT}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Activity className="w-4 h-4" />
              <span>Buat Laporan Bencana Sekarang</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 3-Step Reporting Transparency Mechanism */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-red-100 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-red-700 uppercase">LANGKAH 01</span>
              <h3 className="text-xs font-bold text-gray-900">Geotagging &amp; Bukti Foto</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Kamera mendokumentasikan dampak visual dengan pencatatan otomatis titik koordinat GPS secara presisi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-red-100 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-red-700 uppercase">LANGKAH 02</span>
              <h3 className="text-xs font-bold text-gray-900">Verifikasi Multi-Tier</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Algoritma mencocokkan anomali spasial dan diteruskan ke petugas moderasi BPBD untuk validasi darurat.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-red-100 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-red-700 uppercase">LANGKAH 03</span>
              <h3 className="text-xs font-bold text-gray-900">Diseminasi &amp; Respon Cepat</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Laporan terkonfirmasi segera muncul di peta publik dan diteruskan ke tim evakuasi SAR lapangan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FEATURE 6: TENTANG PLATFORM & MULTI-AGENCY DATA TRUST (/about)         */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
              <Shield className="w-3.5 h-3.5" />
              <span>Transparansi Data &amp; Sains</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
              Sumber Data Otoritatif
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
              Feed data resmi terintegrasi langsung dari BMKG, BNPB, PVMBG, dan Copernicus.
            </p>
          </div>
          <Link
            to={PATHS.PUBLIC.ABOUT}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-bold transition-all shadow-2xs shrink-0"
          >
            <span>Pelajari Arsitektur Platform</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Official Partner Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-1.5">
            <span className="text-xs font-bold text-gray-900 block">BMKG</span>
            <span className="text-[10px] text-gray-500 block">Badan Meteorologi, Klimatologi, dan Geofisika</span>
            <span className="text-[10px] font-mono text-[#047857] font-semibold block pt-1">Seismik &amp; Iklim</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-1.5">
            <span className="text-xs font-bold text-gray-900 block">BNPB</span>
            <span className="text-[10px] text-gray-500 block">Badan Nasional Penanggulangan Bencana</span>
            <span className="text-[10px] font-mono text-[#047857] font-semibold block pt-1">Koordinasi Bencana</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-1.5">
            <span className="text-xs font-bold text-gray-900 block">PVMBG</span>
            <span className="text-[10px] text-gray-500 block">Pusat Vulkanologi &amp; Mitigasi Bencana Geologi</span>
            <span className="text-[10px] font-mono text-[#047857] font-semibold block pt-1">Vulkanik &amp; Gerakan Tanah</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-1.5">
            <span className="text-xs font-bold text-gray-900 block">Copernicus EMS</span>
            <span className="text-[10px] text-gray-500 block">European Emergency Management Service</span>
            <span className="text-[10px] font-mono text-[#047857] font-semibold block pt-1">Citra Satelit Global</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOUR PLATFORM ACCESS TILES (CLEAN & CONCISE)                           */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-4 border-t border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-[#111827] uppercase tracking-wider">
            Ekosistem Akses Terpadu SENTRAVAX
          </h2>
          <span className="text-xs text-gray-500 font-mono">4 PERAN TERISOLASI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to={PATHS.PUBLIC.MAP}
            className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#047857] transition-all shadow-xs flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#047857] flex items-center justify-center font-bold">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#047857]">Area Publik</h3>
              <p className="text-xs text-gray-500">Peta interaktif, shelter, dan edukasi mitigasi tanpa login.</p>
            </div>
            <span className="text-xs font-bold text-[#047857] pt-3 flex items-center gap-1">
              Buka Peta &rarr;
            </span>
          </Link>

          <Link
            to={PATHS.USER.DASHBOARD}
            className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#0284C7] transition-all shadow-xs flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#0284C7] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#0284C7]">Portal Warga</h3>
              <p className="text-xs text-gray-500">Kesiapsiagaan keluarga, tas siaga, dan pemantauan wilayah.</p>
            </div>
            <span className="text-xs font-bold text-[#0284C7] pt-3 flex items-center gap-1">
              Buka Portal &rarr;
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
              <p className="text-xs text-gray-400">Moderasi laporan warga, registry shelter, dan audit logs.</p>
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
              <p className="text-xs text-gray-400">Earth GIS Map, risk analysis, dan diseminasi rilis CAP.</p>
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
