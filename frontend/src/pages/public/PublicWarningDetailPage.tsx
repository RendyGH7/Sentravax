import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import L from 'leaflet';
import '../../components/map/map.css';
import {
  BellRing,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Clock,
  MapPin,
  Compass,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Share2,
  ChevronRight,
  BookOpen,
  Activity,
  Waves,
  CloudLightning,
  Mountain,
  Anchor,
} from 'lucide-react';

import { publicService } from '../../services/public-service';
import { EmergencyHotlineStrip } from '../../components/shared/EmergencyHotlineStrip';
import { PATHS } from '../../app/router/paths';
import { TILE_LAYERS } from '../../components/map/map-config';
import type {
  AlertDetail,
  BroadcastLevel,
  AlertClass,
  AlertStatus,
} from '../../types/disaster';
import { escapeHtml } from '../../components/map/MapPopup';
import { Button } from '../../components/ui/Button';

// Safe date formatter for Indonesian locale (WIB)
function formatAlertDate(dateStr?: string | null): string {
  if (!dateStr) return 'Waktu tidak tersedia';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
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
        badgeClass: 'bg-neutral-900 text-gray-600 border-gray-200',
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
        badgeClass: 'bg-neutral-900 text-gray-700 border-gray-200',
      };
  }
}

// Status badge styling
function getStatusBadge(status: AlertStatus) {
  switch (status) {
    case 'active':
      return {
        label: 'Aktif (Berlaku)',
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
        badgeClass: 'bg-neutral-900 text-gray-500 border-gray-200',
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

// Mini Leaflet Map Component for Alert Region Center Point
const AlertCenterMap: React.FC<{
  latitude: number;
  longitude: number;
  regionName: string;
  broadcastLevel: string;
}> = ({ latitude, longitude, regionName, broadcastLevel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 9,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    const tileConfig = TILE_LAYERS.dark;
    L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
      maxNativeZoom: tileConfig.maxNativeZoom || tileConfig.maxZoom,
      subdomains: tileConfig.subdomains || 'abc',
    }).addTo(map);

    const marker = L.circleMarker([latitude, longitude], {
      radius: 12,
      fillColor: '#F59E0B',
      color: '#B45309',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(map);

    const popupHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 280px; max-width: 90vw; padding: 12px 14px; font-size: 12px; line-height: 1.45; border-radius: 14px; box-sizing: border-box;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-right: 32px;">
          <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #B45309; background: #FEF3C7; border: 1px solid #FDE68A; padding: 2px 8px; border-radius: 9999px;">
            <span style="width: 5px; height: 5px; border-radius: 50%; background: #D97706;"></span>
            Zona Peringatan CAP
          </span>
        </div>
        <h4 style="margin: 0 0 10px 0; font-size: 13.5px; font-weight: 700; color: #0F172A; line-height: 1.35; padding-right: 8px; word-break: break-word;">
          ${escapeHtml(regionName)}
        </h4>
        <div style="display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748B; font-weight: 500;">Tingkat Cakupan:</span>
            <span style="color: #B45309; font-weight: 700; font-size: 10.5px; text-transform: uppercase;">${escapeHtml(broadcastLevel)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748B; font-weight: 500;">Koordinat:</span>
            <span style="color: #0F172A; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 600; font-size: 10.5px; background: #FFFFFF; border: 1px solid #E2E8F0; padding: 1px 6px; border-radius: 4px;">
              ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°
            </span>
          </div>
        </div>
      </div>
    `;

    marker
      .bindPopup(popupHtml, {
        minWidth: 260,
        maxWidth: 320,
        autoPanPadding: [30, 30],
      })
      .openPopup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, regionName, broadcastLevel]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[260px] sm:h-[300px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 relative z-0"
    />
  );
};

export const PublicWarningDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const alertId = id ? parseInt(id, 10) : NaN;
  const isValidId = !isNaN(alertId) && alertId > 0;

  const [alertDetail, setAlertDetail] = useState<AlertDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isValidId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Fetch Alert Detail with request cancellation
  useEffect(() => {
    if (!isValidId) {
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadDetail = async () => {
      setErrorMessage(null);
      try {
        const data = await publicService.getAlertDetail(alertId, controller.signal);
        if (isMounted) {
          setAlertDetail(data);
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) {
          return;
        }
        if (isMounted) {
          setErrorMessage('Peringatan dini tidak ditemukan atau terjadi kendala saat memuat.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [alertId, isValidId]);

  // Copy URL action
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  // INVALID ID ERROR VIEW
  if (!isValidId) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Parameter ID Peringatan Dini Tidak Valid
        </h1>
        <p className="text-sm text-neutral-300 max-w-md mx-auto">
          URL peringatan dini harus menyertakan identifikasi bilangan bulat positif.
        </p>
        <div className="pt-2">
          <Link
            to={PATHS.PUBLIC.WARNINGS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-bold shadow-xs hover:bg-amber-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pusat Peringatan</span>
          </Link>
        </div>
      </div>
    );
  }

  // SKELETON LOADING VIEW
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="w-48 h-4 bg-neutral-800 rounded-md animate-pulse" />
        <div className="bg-[#121614] border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-4 animate-pulse">
          <div className="w-32 h-6 bg-neutral-800 rounded-md" />
          <div className="w-2/3 h-8 bg-neutral-700 rounded-md" />
          <div className="w-full h-12 bg-neutral-900 rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-[#121614] border border-neutral-800 rounded-2xl p-6 animate-pulse" />
            <div className="h-48 bg-[#121614] border border-neutral-800 rounded-2xl p-6 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-[#121614] border border-neutral-800 rounded-2xl p-6 animate-pulse" />
            <div className="h-48 bg-[#121614] border border-neutral-800 rounded-2xl p-6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 404 OR FETCH ERROR VIEW
  if (errorMessage || !alertDetail) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Peringatan Dini #{alertId} Tidak Ditemukan
        </h1>
        <p className="text-sm text-neutral-300 max-w-md mx-auto">
          {errorMessage || 'Peringatan dini ini tidak tercatat dalam database atau telah diarsipkan.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to={PATHS.PUBLIC.WARNINGS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121614] border border-neutral-700 text-sm font-bold text-white shadow-xs hover:border-amber-500 hover:text-amber-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Pusat Peringatan</span>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.location.reload()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Muat Ulang Halaman
          </Button>
        </div>
      </div>
    );
  }

  // DATA LOADED SUCCESSFULLY
  const bcast = getBroadcastBadge(alertDetail.broadcast_level);
  const aclass = getAlertClassBadge(alertDetail.alert_class);
  const stat = getStatusBadge(alertDetail.status);
  const hasCoordinates =
    typeof alertDetail.region?.center?.latitude === 'number' &&
    typeof alertDetail.region?.center?.longitude === 'number';

  return (
    <div className="min-h-screen bg-transparent pb-16 text-neutral-100">
      {/* 1. BREADCRUMBS & NAVIGATION */}
      <div className="bg-[#0d0f0e] border-b border-neutral-800 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs">
          <nav className="flex items-center gap-1.5 text-neutral-400 truncate" aria-label="Breadcrumb">
            <Link to={PATHS.PUBLIC.HOME} className="hover:text-[#047857] transition-colors shrink-0">
              Beranda
            </Link>
            <span>/</span>
            <Link to={PATHS.PUBLIC.WARNINGS} className="hover:text-[#047857] transition-colors shrink-0">
              Pusat Peringatan Dini
            </Link>
            <span>/</span>
            <span className="text-white font-semibold truncate">
              {alertDetail.title}
            </span>
          </nav>

          <Link
            to={PATHS.PUBLIC.WARNINGS}
            className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 font-bold shrink-0 ml-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Daftar Peringatan</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* 2. HEADER CARD */}
        <header className="bg-[#121614] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Large Hazard Icon */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 shadow-xs">
                {renderHazardIcon(alertDetail.hazard_type?.slug, 'w-8 h-8 sm:w-9 sm:h-9 text-amber-700')}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold font-mono">
                    #{alertDetail.id}
                  </span>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">
                    {alertDetail.hazard_type?.name || 'Peringatan Dini'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${aclass.badgeClass}`}>
                    {aclass.label}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {alertDetail.title}
                </h1>

                {/* Badges Row */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {/* Broadcast Level Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${bcast.badgeClass}`}>
                    {bcast.label}
                  </span>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${stat.badgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${stat.dotClass}`} />
                    <span>{stat.label}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Share, Back) */}
            <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                leftIcon={isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              >
                {isCopied ? 'Tautan Disalin!' : 'Bagikan Peringatan'}
              </Button>
              <Link
                to={PATHS.PUBLIC.WARNINGS}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-colors"
              >
                <BellRing className="w-4 h-4" />
                <span>Pusat Peringatan</span>
              </Link>
            </div>
          </div>

          {/* Meta Information Bar */}
          <div className="mt-6 pt-5 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
              <div>
                <p className="text-neutral-400 font-semibold text-[11px]">Waktu Mulai Berlaku</p>
                <p className="font-bold text-white">{formatAlertDate(alertDetail.starts_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
              <div>
                <p className="text-neutral-400 font-semibold text-[11px]">Batas Waktu Berlaku</p>
                <p className="font-bold text-white">
                  {alertDetail.expires_at ? formatAlertDate(alertDetail.expires_at) : 'Hingga pemberitahuan lanjut'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
              <div>
                <p className="text-neutral-400 font-semibold text-[11px]">Wilayah Siaran</p>
                <p className="font-bold text-white">
                  {alertDetail.region?.name || 'Seluruh Wilayah Nasional'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Radio className="w-4 h-4 text-neutral-500 shrink-0" />
              <div>
                <p className="text-neutral-400 font-semibold text-[11px]">Waktu Diterbitkan</p>
                <p className="font-bold text-white">{formatAlertDate(alertDetail.created_at)}</p>
              </div>
            </div>
          </div>
        </header>

        {/* 3. TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ======================================================== */}
          {/* LEFT COLUMN: WARNING MESSAGE, ISSUER, DATA SOURCE & MAP */}
          {/* ======================================================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* FULL WARNING MESSAGE */}
            <section className="bg-[#121614] border border-neutral-800 rounded-2xl p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Pesan Siaran &amp; Deskripsi Situasi</span>
              </h2>
              <div className="text-sm sm:text-base text-neutral-200 leading-relaxed p-4 bg-neutral-900 border border-amber-900/40 rounded-xl">
                <p className="font-medium">{alertDetail.message}</p>
              </div>
            </section>

            {/* OFFICIAL INSTRUCTION BOX (CAP ACTIONABLE GUIDANCE) */}
            {alertDetail.instruction && (
              <section className="bg-[#121614] border border-neutral-800 rounded-2xl p-6 shadow-xs space-y-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Instruksi Keselamatan Resmi (Official CAP Instruction)</span>
                </h2>
                <div className="text-sm text-neutral-200 leading-relaxed p-4 bg-neutral-900 rounded-xl border border-neutral-800 font-medium">
                  {alertDetail.instruction}
                </div>
              </section>
            )}

            {/* ISSUER & DATA PROVENANCE (STRICT SEMANTIC SEPARATION) */}
            <section className="bg-[#121614] border border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#047857]" />
                <span>Atribusi Penerbit & Sumber Data Kejadian</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. ALERT ISSUER BOX */}
                <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                    <span className="font-bold text-white">Penerbit Peringatan (Issuer)</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        alertDetail.issuer.is_verified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-neutral-900 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {alertDetail.issuer.is_verified ? 'Terverifikasi' : 'Belum Tersertifikasi'}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-white">
                    {alertDetail.issuer.name || 'Penerbit tidak terverifikasi'}
                  </p>

                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {alertDetail.issuer.verification_basis ||
                      'Tidak terdapat data dasar verifikasi penerbit pada sistem.'}
                  </p>

                  {alertDetail.external_identifier && (
                    <div className="text-[10px] font-mono text-neutral-400 pt-1.5 border-t border-gray-200 break-all">
                      <span className="font-semibold text-slate-700">CAP ID: </span>
                      {alertDetail.external_identifier}
                    </div>
                  )}

                  {alertDetail.area_description && (
                    <div className="text-[11px] text-neutral-300 pt-0.5">
                      <span className="font-semibold text-slate-700">Cakupan Wilayah: </span>
                      {alertDetail.area_description}
                    </div>
                  )}
                </div>

                {/* 2. EVENT DATA SOURCE BOX */}
                <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                    <span className="font-bold text-white">Sumber Data Kejadian</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Telemetri Kejadian
                    </span>
                  </div>

                  {alertDetail.event_data_source ? (
                    <>
                      <p className="text-sm font-bold text-white">
                        {alertDetail.event_data_source.name}
                      </p>
                      <p className="text-[11px] text-neutral-300">
                        Penyedia: <span className="font-semibold">{alertDetail.event_data_source.provider}</span>
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Asal data observasi fisik bencana, terpisah secara semantik dari pihak penerbit siaran.
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-neutral-400 leading-relaxed pt-1">
                      Peringatan ini diterbitkan secara mandiri tanpa keterkaitan langsung dengan rekaman telemetri observasi kejadian bencana tunggal.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ASSOCIATED HAZARD EVENT */}
            <section className="bg-[#121614] border border-neutral-800 rounded-2xl p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#047857]" />
                <span>Kejadian Bencana Terkait</span>
              </h2>

              {alertDetail.hazard_event ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold text-[10px]">
                      Kejadian #{alertDetail.hazard_event.id}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      Tingkat {alertDetail.hazard_event.severity} • Status {alertDetail.hazard_event.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white">
                    {alertDetail.hazard_event.title}
                  </h3>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs text-neutral-400">
                    <span>Waktu Kejadian: {formatAlertDate(alertDetail.hazard_event.occurred_at)}</span>

                    <Link
                      to={`/disasters/${alertDetail.hazard_event.id}`}
                      className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300"
                    >
                      <span>Buka Detail Kejadian</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center text-xs text-neutral-400">
                  Peringatan ini tidak terikat secara langsung dengan rekaman kejadian bencana spesifik pada katalog.
                </div>
              )}
            </section>

            {/* BROADCAST SPATIAL CENTER MAP */}
            {hasCoordinates && (
              <section className="bg-[#121614] border border-neutral-800 rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>Pusat Geospasial Wilayah Siaran</span>
                  </h2>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    {alertDetail.region?.center?.latitude?.toFixed(4)}°, {alertDetail.region?.center?.longitude?.toFixed(4)}°
                  </span>
                </div>

                <AlertCenterMap
                  latitude={alertDetail.region!.center!.latitude!}
                  longitude={alertDetail.region!.center!.longitude!}
                  regionName={alertDetail.region?.name || 'Wilayah Siaran'}
                  broadcastLevel={bcast.label}
                />
              </section>
            )}
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: ACTIONABLE PREPAREDNESS & HOTLINES */}
          {/* ======================================================== */}
          <div className="space-y-6">
            {/* 1. ACTIONABLE PREPAREDNESS GUIDANCE */}
            <section className="bg-[#121614] border border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-white">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-base">Panduan Kesiapsiagaan Mandiri</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Panduan Edukasi Umum
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Langkah mitigasi perlindungan diri mandiri yang umum dianjurkan. Panduan ini merupakan edukasi kesiapsiagaan umum dan tidak menggantikan arahan langsung dari petugas di lapangan:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="text-xs text-white space-y-0.5">
                    <p className="font-bold">Tingkatkan Kewaspadaan</p>
                    <p className="text-neutral-300 font-normal">Pantau saluran radio, televisi, dan kanal pengumuman resmi instansi setempat secara berkala.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="text-xs text-white space-y-0.5">
                    <p className="font-bold">Amankan Dokumen &amp; Aset</p>
                    <p className="text-neutral-300 font-normal">Simpan dokumen penting di wadah kedap air dan tempatkan peralatan berharga di posisi yang aman.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="text-xs text-white space-y-0.5">
                    <p className="font-bold">Siapkan Tas Siaga Bencana</p>
                    <p className="text-neutral-300 font-normal">Pastikan pasokan air minum, makanan tahan lama, P3K, dan senter telah siap dibawa.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    4
                  </span>
                  <div className="text-xs text-white space-y-0.5">
                    <p className="font-bold">Ikuti Arahan Petugas Lapangan</p>
                    <p className="text-neutral-300 font-normal">Bila aparat BPBD atau perangkat desa/kelurahan setempat menginstruksikan evakuasi, segera menuju titik kumpul aman.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. EMERGENCY HOTLINES */}
            <EmergencyHotlineStrip
              variant="grid"
              theme="dark"
              title="Nomor Kontak Darurat Nasional"
              subtitle="Akses cepat ke kontak layanan darurat instansi berwenang terverifikasi:"
            />

            {/* 3. RELATED PLATFORM LINKS */}
            <section className="bg-[#121614] border border-neutral-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Fitur Terkait SENTRAVAX
              </h4>
              <div className="space-y-2 text-xs">
                <Link
                  to={PATHS.PUBLIC.HOME}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-200 hover:text-emerald-400 transition-colors border border-transparent hover:border-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">SIAGA PERSONAL (Cek Koordinat)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to={PATHS.PUBLIC.DISASTERS}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-200 hover:text-emerald-400 transition-colors border border-transparent hover:border-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">Katalog Kejadian Bencana</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to={PATHS.PUBLIC.EDUCATION}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-200 hover:text-emerald-400 transition-colors border border-transparent hover:border-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">Panduan Edukasi & Kesiapsiagaan</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicWarningDetailPage;
