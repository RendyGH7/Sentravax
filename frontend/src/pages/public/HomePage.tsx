import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import type { 
  PublicOverviewData, 
  HazardEventItem, 
  AlertItem
} from '../../types/disaster';
import type { RegionItem, LocationCheckResult } from '../../types';
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
  Compass
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

export const HomePage: React.FC = () => {
  const [overview, setOverview] = useState<PublicOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);

  const [events, setEvents] = useState<HazardEventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);

  // Instant Hero Risk Checker
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [selectedQuickRegion, setSelectedQuickRegion] = useState<string>('');
  const [isQuickChecking, setIsQuickChecking] = useState<boolean>(false);
  const [quickCheckResult, setQuickCheckResult] = useState<LocationCheckResult | null>(null);

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

  useEffect(() => {
    fetchOverview();
    fetchEvents();
    fetchAlerts();
    publicService.getRegions().then((r) => setRegions(r)).catch(() => {});
  }, [fetchOverview, fetchEvents, fetchAlerts]);

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

  return (
    <div className="space-y-10 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. TOP 1-CLICK EMERGENCY HOTLINE STRIP */}
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

      {/* 2. HERO SECTION WITH INSTANT RISK & SHELTER CHECKER WIDGET */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headline & Action Buttons */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span>PLATFORM INTELIJEN & KESIAPSIAGAAN BENCANA</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827] leading-tight">
              Intelijen Spasial &amp;
              <span className="block text-[#047857]">Kesiapsiagaan Multi-Hazard.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed max-w-xl">
              Pemantauan geospasial real-time, analisis risiko deterministik PostGIS, dan panduan kesiapsiagaan mandiri keluarga.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link to={PATHS.PUBLIC.MAP}>
              <Button 
                variant="primary" 
                size="md" 
                leftIcon={<Map className="w-4 h-4" />}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Buka Peta Interaktif
              </Button>
            </Link>

            <Link to={PATHS.PUBLIC.REPORT}>
              <Button 
                variant="outline" 
                size="md" 
                className="border-red-300 text-red-700 hover:bg-red-50"
                leftIcon={<Activity className="w-4 h-4 text-red-600" />}
              >
                Lapor Bencana (Zero-Barrier)
              </Button>
            </Link>

            <Link to={PATHS.PUBLIC.PREPAREDNESS}>
              <Button 
                variant="outline" 
                size="md" 
                leftIcon={<ShieldCheck className="w-4 h-4 text-[#047857]" />}
              >
                SIAGA PERSONAL
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Instant Location Risk Checker Widget (HIGH VALUE FEATURE) */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 text-xs">
              <span className="font-bold text-[#111827] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#047857]" />
                Kalkulator Risiko Lokasi Seketika
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                POSTGIS LIVE
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
                    Buka Rincian Kesiapsiagaan Lengkap &rarr;
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

      {/* 3. COMPACT SITUATION OVERVIEW STRIP */}
      <section className="space-y-4 pt-4 border-t border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#047857]" />
            Telemetri Bencana Nasional Real-Time
          </h2>
          <button
            type="button"
            onClick={() => {
              fetchOverview();
              fetchEvents();
              fetchAlerts();
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
              {overviewLoading ? '...' : 3}
            </div>
            <Link to={PATHS.PUBLIC.MAP} className="text-[11px] font-bold text-[#059669] hover:underline block pt-0.5">
              Peta Pengungsian &rarr;
            </Link>
          </Card>
        </div>
      </section>

      {/* 4. DENSE SPLIT: RECENT HAZARDS & EARLY WARNINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Hazards Feed */}
        <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#C2410C]" />
              Kejadian Bencana Terkini
            </h3>
            <Link to={PATHS.PUBLIC.DISASTERS} className="text-xs font-bold text-[#047857] hover:underline">
              Semua &rarr;
            </Link>
          </div>

          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">Tidak ada bencana aktif terdeteksi.</p>
          ) : (
            <div className="space-y-2.5">
              {events.map((ev) => {
                const badge = getSeverityBadge(ev.severity);
                return (
                  <Link
                    key={ev.id}
                    to={PATHS.PUBLIC.DISASTER_DETAIL.replace(':id', String(ev.id))}
                    className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        {getHazardIcon(ev.hazard_type?.slug)}
                        <span className="text-xs font-bold text-gray-900 truncate">{ev.title}</span>
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

        {/* CAP Warnings Feed */}
        <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              Peringatan Dini CAP Resmi
            </h3>
            <Link to={PATHS.PUBLIC.WARNINGS} className="text-xs font-bold text-[#047857] hover:underline">
              Semua &rarr;
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
                    className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{al.title}</h4>
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

      {/* 5. FOUR PLATFORM ACCESS TILES (CLEAN & CONCISE) */}
      <section className="space-y-4 pt-4 border-t border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
            Akses Terpadu SENTRAVAX
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
