import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import type { 
  PublicOverviewData, 
  HazardEventItem, 
  AlertItem 
} from '../../types/disaster';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { 
  Shield, 
  Map, 
  Activity, 
  Radio, 
  Users, 
  ChevronRight, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  RefreshCw,
  ArrowRight,
  Flame,
  Waves,
  Wind,
  Mountain
} from 'lucide-react';

function formatEventDate(dateString?: string): string {
  if (!dateString) return 'Waktu tidak tersedia';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
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
  // 1. Overview State
  const [overview, setOverview] = useState<PublicOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // 2. Events State
  const [events, setEvents] = useState<HazardEventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // 3. Alerts State
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  // Reload Handlers (For User Retry Actions)
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await publicService.getOverview();
      setOverview(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal memuat ringkasan situasi publik.';
      setOverviewError(errorMsg);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const res = await publicService.getEvents({ per_page: 4, status: 'active' });
      const list = res?.data || (Array.isArray(res) ? res : []);
      setEvents(list);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal memuat kejadian terkini.';
      setEventsError(errorMsg);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const res = await publicService.getAlerts({ per_page: 3 });
      const list = res?.data || (Array.isArray(res) ? res : []);
      setAlerts(list);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal memuat peringatan dini.';
      setAlertsError(errorMsg);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  // Initial Load (Asynchronous with cancellation protection)
  useEffect(() => {
    let isCancelled = false;

    publicService.getOverview()
      .then((data) => {
        if (!isCancelled) {
          setOverview(data);
          setOverviewLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setOverviewError(err instanceof Error ? err.message : 'Gagal memuat ringkasan situasi publik.');
          setOverviewLoading(false);
        }
      });

    publicService.getEvents({ per_page: 4, status: 'active' })
      .then((res) => {
        if (!isCancelled) {
          const list = res?.data || (Array.isArray(res) ? res : []);
          setEvents(list);
          setEventsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setEventsError(err instanceof Error ? err.message : 'Gagal memuat kejadian terkini.');
          setEventsLoading(false);
        }
      });

    publicService.getAlerts({ per_page: 3 })
      .then((res) => {
        if (!isCancelled) {
          const list = res?.data || (Array.isArray(res) ? res : []);
          setAlerts(list);
          setAlertsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setAlertsError(err instanceof Error ? err.message : 'Gagal memuat peringatan dini.');
          setAlertsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* SECTION A: HERO SECTION — SENTRAVAX INTELLIGENCE                         */}
      {/* ========================================================================= */}
      <section 
        aria-labelledby="hero-heading" 
        className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-2 sm:pt-6"
      >
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-50/70 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-amber-50/60 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Left Column: Heading & CTAs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
            <span>Platform Intelijen Bencana & Kesiapsiagaan Mandiri</span>
          </div>

          <div className="space-y-2">
            <h1 
              id="hero-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827] leading-[1.15]"
            >
              Intelijen Spasial &amp;
              <span className="block text-[#047857]">Kesiapsiagaan Multi-Hazard.</span>
              <span className="block text-[#C2410C]">Tanggap Bersama SENTRAVAX.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed max-w-xl font-normal pt-1">
              Pemantauan geospasial real-time ancaman bencana nasional, analisis risiko deterministik berbasis wilayah, serta panduan kesiapsiagaan mandiri keluarga di seluruh Nusantara.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
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

            <Link to={PATHS.PUBLIC.PREPAREDNESS}>
              <Button 
                variant="outline" 
                size="md" 
                leftIcon={<ShieldCheck className="w-4 h-4 text-[#047857]" />}
              >
                Pelajari SIAGA PERSONAL
              </Button>
            </Link>
          </div>

          {/* Live System Operational Status Badge */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
              <span className="font-semibold text-[#111827]">
                Status Sistem: {overview?.system_status === 'operational' ? 'Operasional Normal' : 'Aktif Terpantau'}
              </span>
              <span className="text-[#9CA3AF]">•</span>
              <span className="text-[#6B7280] font-mono text-[11px]">
                {overview?.platform || 'SENTRAVAX Disaster Intelligence'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Graphic Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#047857] text-white flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-bold text-[#111827]">SENTRAVAX Sentinel</span>
              </div>
              {overview?.telemetry_sync ? (
                <Badge dataStatus={overview.telemetry_sync.freshness} size="sm" />
              ) : (
                <span className="text-[10px] font-mono font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                  TELEMETRI AKTIF
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-[#F9FAFB] border border-[#DCFCE7] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#047857] uppercase tracking-wider font-mono">
                  Ringkasan Cepat
                </span>
                <span className="text-[11px] text-[#6B7280]">Indonesia</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                  <span className="text-[11px] text-[#6B7280] block font-medium">Bencana Aktif</span>
                  <span className="text-xl font-extrabold text-[#111827]">
                    {overviewLoading ? '...' : (overview?.active_hazard_events ?? 0)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                  <span className="text-[11px] text-[#6B7280] block font-medium">Peringatan CAP</span>
                  <span className="text-xl font-extrabold text-[#C2410C]">
                    {overviewLoading ? '...' : (overview?.active_alerts ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#6B7280] leading-relaxed pt-1 flex items-center justify-between">
              <span>Sumber Data Terintegrasi:</span>
              <span className="font-semibold text-[#111827]">BMKG TEWS &amp; Jaringan Posko</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION B: LIVE SITUATION OVERVIEW                                        */}
      {/* ========================================================================= */}
      <section aria-labelledby="live-overview-heading" className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#047857] font-bold">
              Telemetri Nasional
            </span>
            <h2 id="live-overview-heading" className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
              Situasi Terkini Kebencanaan
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
              Data agregasi dari telemetri sensor resmi dan posko verifikasi terdaftar di seluruh Indonesia.
            </p>
          </div>

          {/* Freshness & Sync Metadata */}
          {overview?.telemetry_sync && (
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 text-xs">
              <Badge dataStatus={overview.telemetry_sync.freshness} size="sm" />
              <span className="text-[#6B7280] text-[11px]">
                Sinkron: {formatEventDate(overview.telemetry_sync.last_synced_at)}
              </span>
            </div>
          )}
        </div>

        {/* Overview Metric Grid */}
        {overviewLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton variant="card" count={4} />
          </div>
        ) : overviewError ? (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-[#D97706] mx-auto" />
            <h3 className="text-sm font-bold text-[#111827]">Gagal Menghubungkan Telemetri Overview</h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto">{overviewError}</p>
            <Button variant="outline" size="sm" onClick={fetchOverview} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Coba Muat Ulang
            </Button>
          </div>
        ) : overview ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Kejadian Aktif */}
            <Card padding="md" className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
                <span>Kejadian Aktif</span>
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#C2410C] flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#111827]">
                {overview.active_hazard_events}
              </div>
              <p className="text-xs text-[#6B7280]">
                Kejadian bencana aktif terverifikasi
              </p>
            </Card>

            {/* Metric 2: Peringatan CAP */}
            <Card padding="md" className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
                <span>Peringatan Dini Aktif</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#111827]">
                {overview.active_alerts}
              </div>
              <p className="text-xs text-[#6B7280]">
                Peringatan darurat resmi berlaku
              </p>
            </Card>

            {/* Metric 3: Wilayah Pantauan */}
            <Card padding="md" className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
                <span>Wilayah Dipantau</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#047857] flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#111827]">
                {overview.monitored_regions}
              </div>
              <p className="text-xs text-[#6B7280]">
                Cakupan wilayah pilot administratif
              </p>
            </Card>

            {/* Metric 4: Status Sinkronisasi */}
            <Card padding="md" className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
                <span>Sinkronisasi Telemetri</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#047857] flex items-center justify-center font-bold">
                  <Radio className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#047857]">
                {overview.telemetry_sync.status === 'SUCCESS' ? 'Normal' : 'Pemeliharaan'}
              </div>
              <p className="text-xs text-[#6B7280]">
                Feed telemetri terhubung otomatis
              </p>
            </Card>
          </div>
        ) : null}
      </section>

      {/* ========================================================================= */}
      {/* SECTION C: QUICK ACCESS — PUBLIC INTELLIGENCE                             */}
      {/* ========================================================================= */}
      <section aria-labelledby="quick-access-heading" className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#047857] font-bold">
            Navigasi Cepat
          </span>
          <h2 id="quick-access-heading" className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
            Akses Layanan Publik SENTRAVAX
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Jelajahi seluruh fitur informasi dan edukasi kebencanaan terbuka tanpa hambatan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Peta Bencana */}
          <Link to={PATHS.PUBLIC.MAP} className="block group">
            <Card interactive padding="md" className="h-full flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Map className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#047857] transition-colors">
                  Peta Interaktif
                </h3>
                <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                  Pantau sebaran titik kejadian bencana dan zonasi risiko spasial di peta digital.
                </p>
              </div>
              <span className="text-xs font-bold text-[#047857] flex items-center gap-1 pt-1">
                Buka Peta <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Card>
          </Link>

          {/* 2. Katalog Bencana */}
          <Link to={PATHS.PUBLIC.DISASTERS} className="block group">
            <Card interactive padding="md" className="h-full flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#C2410C] transition-colors">
                  Katalog Bencana
                </h3>
                <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                  Daftar terstruktur seluruh kejadian bencana aktif di Indonesia beserta riwayatnya.
                </p>
              </div>
              <span className="text-xs font-bold text-[#C2410C] flex items-center gap-1 pt-1">
                Lihat Katalog <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Card>
          </Link>

          {/* 3. Peringatan Dini */}
          <Link to={PATHS.PUBLIC.WARNINGS} className="block group">
            <Card interactive padding="md" className="h-full flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FEFCE8] text-[#A16207] border border-[#FEF08A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#A16207] transition-colors">
                  Peringatan Dini
                </h3>
                <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                  Feed notifikasi resmi standar CAP (Waspada, Siaga, Kritis) dari instansi berwenang.
                </p>
              </div>
              <span className="text-xs font-bold text-[#A16207] flex items-center gap-1 pt-1">
                Buka Peringatan <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Card>
          </Link>

          {/* 4. SIAGA PERSONAL */}
          <Link to={PATHS.PUBLIC.PREPAREDNESS} className="block group">
            <Card interactive padding="md" className="h-full flex flex-col justify-between space-y-3 border-[#A7F3D0] bg-[#F0FDF4]/30">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#047857] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#047857] transition-colors">
                  SIAGA PERSONAL
                </h3>
                <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                  Cek risiko lokasi mandiri dan langkah mitigasi personal keluarga Anda.
                </p>
              </div>
              <span className="text-xs font-bold text-[#047857] flex items-center gap-1 pt-1">
                Cek Risiko <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Card>
          </Link>

          {/* 5. Literasi & Edukasi */}
          <Link to={PATHS.PUBLIC.EDUCATION} className="block group">
            <Card interactive padding="md" className="h-full flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#111827] transition-colors">
                  Modul Edukasi
                </h3>
                <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                  Panduan evakuasi, checklist tas siaga bencana, dan edukasi pertolongan pertama.
                </p>
              </div>
              <span className="text-xs font-bold text-[#4B5563] flex items-center gap-1 pt-1">
                Buka Edukasi <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Card>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION D: RECENT DISASTER HIGHLIGHTS                                     */}
      {/* ========================================================================= */}
      <section aria-labelledby="recent-events-heading" className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#C2410C] font-bold">
              Katalog Observasi
            </span>
            <h2 id="recent-events-heading" className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
              Kejadian Bencana Terkini
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
              Kejadian aktif terverifikasi dengan data provenance transparan per sumber.
            </p>
          </div>

          <Link to={PATHS.PUBLIC.DISASTERS} className="text-xs font-bold text-[#047857] hover:text-[#065F46] flex items-center gap-1 shrink-0">
            Lihat Semua di Katalog <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {eventsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton variant="card" count={4} />
          </div>
        ) : eventsError ? (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] text-center space-y-3">
            <p className="text-xs text-[#6B7280]">{eventsError}</p>
            <Button variant="outline" size="sm" onClick={fetchEvents} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Coba Muat Ulang Kejadian
            </Button>
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="Tidak Ada Kejadian Kritis Aktif"
            description="Saat ini seluruh sensor telemetri berada dalam rentang normal dan tidak ada anomali bencana aktif."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => {
              const sev = getSeverityBadge(ev.severity);
              const isLive = ev.provenance_status === 'LIVE';

              return (
                <Card key={ev.id} padding="md" className="space-y-3 hover:border-[#D1D5DB] transition-all">
                  {/* Top Bar: Hazard & Severity */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center">
                        {getHazardIcon(ev.hazard_type?.slug)}
                      </div>
                      <span className="text-xs font-bold text-[#111827]">
                        {ev.hazard_type?.name || 'Kejadian Bencana'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge variant={sev.variant} size="sm">
                        Tingkat {sev.label}
                      </Badge>
                      <Badge 
                        dataStatus={ev.provenance_status || (isLive ? 'LIVE' : 'STATIC')} 
                        size="sm"
                      >
                        {ev.provenance_label || (isLive ? 'LIVE' : 'STATIC')}
                      </Badge>
                    </div>
                  </div>

                  {/* Body: Title & Details */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-[#111827] line-clamp-2 leading-snug">
                      {ev.title}
                    </h3>
                    {ev.description && (
                      <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Footer Meta: Region, Time, Source & Map Action */}
                  <div className="pt-2 border-t border-[#F3F4F6] space-y-2 text-[11px] text-[#6B7280]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>{ev.region?.name || 'Wilayah Indonesia'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>{formatEventDate(ev.occurred_at)}</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-[#F9FAFB] flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-mono text-[#4B5563] truncate">
                        Sumber: <span className="font-semibold text-[#111827]">{ev.source_name || ev.source || 'SENTRAVAX'}</span>
                      </span>
                      <Link
                        to={`${PATHS.PUBLIC.MAP}?eventId=${ev.id}`}
                        className="inline-flex items-center gap-1 font-bold text-[#047857] hover:text-[#065F46] shrink-0 text-xs"
                      >
                        Lihat di Peta <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION E: EARLY WARNING HIGHLIGHTS                                       */}
      {/* ========================================================================= */}
      <section aria-labelledby="early-warnings-heading" className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#D97706] font-bold">
              Peringatan Dini Otoritatif
            </span>
            <h2 id="early-warnings-heading" className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
              Peringatan Resmi Berstandar CAP
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
              Diseminasi peringatan darurat berjenjang untuk langkah tanggap darurat warga.
            </p>
          </div>

          <Link to={PATHS.PUBLIC.WARNINGS} className="text-xs font-bold text-[#047857] hover:text-[#065F46] flex items-center gap-1 shrink-0">
            Buka Pusat Peringatan <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {alertsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton variant="card" count={3} />
          </div>
        ) : alertsError ? (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] text-center space-y-3">
            <p className="text-xs text-[#6B7280]">{alertsError}</p>
            <Button variant="outline" size="sm" onClick={fetchAlerts} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Coba Muat Ulang Peringatan
            </Button>
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            title="Tidak Ada Peringatan Dini Aktif"
            description="Tidak ada peringatan darurat waspada atau siaga yang diterbitkan otoritas resmi saat ini."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alerts.map((al) => {
              const alertBadge = getAlertBadge(al.alert_class);

              return (
                <Card key={al.id} padding="md" className="space-y-3 flex flex-col justify-between hover:border-[#D1D5DB] transition-all">
                  <div className="space-y-2.5">
                    {/* Urgency Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={alertBadge.variant} size="sm">
                        {alertBadge.label}
                      </Badge>
                      <span className="text-[10px] font-mono text-[#6B7280] uppercase">
                        {al.broadcast_level}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#111827] line-clamp-2 leading-snug">
                      {al.title}
                    </h3>
                    <p className="text-xs text-[#4B5563] line-clamp-3 leading-relaxed">
                      {al.message}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F3F4F6] text-[11px] text-[#6B7280] space-y-1.5">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span>{al.region?.name || 'Seluruh Wilayah'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[10.5px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>Mulai: {formatEventDate(al.starts_at)}</span>
                      </div>
                      <Link 
                        to={PATHS.PUBLIC.WARNINGS}
                        className="inline-flex items-center gap-1 font-bold text-[#047857] hover:text-[#065F46] shrink-0"
                      >
                        Detail <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION F: SIAGA PERSONAL SPOTLIGHT                                       */}
      {/* ========================================================================= */}
      <section 
        aria-labelledby="siaga-personal-heading" 
        className="rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#065F46] p-8 sm:p-12 text-white relative overflow-hidden shadow-lg space-y-8"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-100 text-xs font-mono font-bold backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>FITUR UNGGULAN MASYARAKAT</span>
          </div>

          <h2 id="siaga-personal-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            SIAGA PERSONAL: Kesiapsiagaan Mandiri Keluarga Anda
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 leading-relaxed font-normal">
            Jangan menunggu sirine berbunyi saat bencana tiba. Kenali tingkat kerentanan wilayah Anda secara transparan dan susun rencana keselamatan keluarga Anda sekarang.
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-sm font-bold text-white">Cek Risiko Lokasi</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Analisis spasial PostGIS menghitung kedekatan ancaman multi-hazard dan faktor kerentanan dalam radius 25 km.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-sm font-bold text-white">Tas Siaga Bencana (Go-Bag)</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Checklist 13 perlengkapan vital standar BNPB (Dokumen, Medis, Logistik, Alat, Proteksi) dengan progres terukur.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-sm font-bold text-white">Rencana Siaga Keluarga</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Tetapkan titik kumpul evakuasi utama, rute darurat aman, dan direktori kontak prioritas keluarga.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link to={PATHS.PUBLIC.PREPAREDNESS}>
            <Button 
              variant="secondary" 
              size="md" 
              className="bg-white text-[#047857] hover:bg-emerald-50 border-white font-bold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Mulai Cek Kesiapsiagaan
            </Button>
          </Link>
          <Link to={PATHS.PUBLIC.REGISTER} className="text-xs font-semibold text-emerald-100 hover:text-white underline underline-offset-4">
            Daftar Akun Portal Warga Gratis &rarr;
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION G: FOUR INTEGRATED PLATFORM AREAS                                 */}
      {/* ========================================================================= */}
      <section aria-labelledby="platform-areas-heading" className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#047857] font-bold">
            Arsitektur Terpadu
          </span>
          <h2 id="platform-areas-heading" className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
            Empat Area Terintegrasi SENTRAVAX
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] max-w-xl mx-auto">
            Menghubungkan masyarakat, relawan posko, administrator sistem, dan analis intelijen kebencanaan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Public */}
          <Card padding="md" className="flex flex-col justify-between space-y-4 hover:border-[#047857] transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#047857] font-bold">Area Publik</span>
              <h3 className="text-base font-bold text-[#111827] mt-1">Website Publik</h3>
              <p className="text-xs text-[#4B5563] mt-2 leading-relaxed">
                Akses bebas tanpa login untuk peta interaktif, katalog kejadian bencana, dan informasi mitigasi.
              </p>
            </div>
            <Link to={PATHS.PUBLIC.MAP} className="text-xs font-bold text-[#047857] hover:text-[#065F46] flex items-center gap-1">
              Jelajahi Peta <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Card 2: User */}
          <Card padding="md" className="flex flex-col justify-between space-y-4 hover:border-[#C2410C] transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#C2410C] font-bold">Area Warga</span>
              <h3 className="text-base font-bold text-[#111827] mt-1">Portal Warga</h3>
              <p className="text-xs text-[#4B5563] mt-2 leading-relaxed">
                Pelaporan bencana warga, pemantauan radius tempat tinggal, dan rencana siaga keluarga.
              </p>
            </div>
            <Link to={PATHS.USER.DASHBOARD} className="text-xs font-bold text-[#C2410C] hover:text-[#9A3412] flex items-center gap-1">
              Buka Portal Warga <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Card 3: Admin */}
          <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-[#F5F5F5] flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#212121] text-[#F59E0B] border border-[#383838] flex items-center justify-center mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#F59E0B] font-bold">Area Konsol</span>
              <h3 className="text-base font-bold text-[#F5F5F5] mt-1">Admin Dashboard</h3>
              <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">
                Manajemen akun pengguna, moderasi laporan warga, data kejadian resmi, dan audit log.
              </p>
            </div>
            <Link to={PATHS.ADMIN.DASHBOARD} className="text-xs font-bold text-[#F59E0B] hover:text-[#D97706] flex items-center gap-1">
              Akses Admin <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Intelligence */}
          <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-[#F5F5F5] flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#212121] text-[#10B981] border border-[#383838] flex items-center justify-center mb-3">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase text-[#10B981] font-bold">Area Komando</span>
              <h3 className="text-base font-bold text-[#F5F5F5] mt-1">Intelligence Center</h3>
              <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">
                Analisis geospasial multi-hazard, AI proactive insight, dan diseminasi operasi peringatan dini.
              </p>
            </div>
            <Link to={PATHS.INTELLIGENCE.OVERVIEW} className="text-xs font-bold text-[#10B981] hover:text-[#059669] flex items-center gap-1">
              Buka Komando <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
