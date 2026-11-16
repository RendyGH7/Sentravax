import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import L from 'leaflet';
import '../../components/map/map.css';
import {
  Activity,
  Waves,
  CloudLightning,
  Mountain,
  Anchor,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Compass,
  Radio,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Share2,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Info,
} from 'lucide-react';

import { publicService } from '../../services/public-service';
import { PATHS } from '../../app/router/paths';
import type {
  HazardEventDetail,
  GeoJsonPointFeature,
  BroadcastLevel,
} from '../../types/disaster';
import { createMarkerIcon } from '../../components/map/map-icons';
import { Button } from '../../components/ui/Button';

// Safe date formatter for Indonesian locale (WIB)
function formatEventDate(dateStr?: string | null): string {
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

// Color and badge configuration for severity levels
function getSeverityBadge(severity?: string) {
  const s = severity?.toLowerCase();
  switch (s) {
    case 'extreme':
    case 'critical':
      return {
        label: 'Tingkat Ekstrem',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        dotClass: 'bg-red-500',
      };
    case 'high':
    case 'severe':
      return {
        label: 'Tingkat Tinggi',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        dotClass: 'bg-orange-500',
      };
    case 'medium':
    case 'moderate':
      return {
        label: 'Tingkat Sedang',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    case 'low':
    case 'minor':
    default:
      return {
        label: 'Tingkat Rendah',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
  }
}

// Status badge styling
function getStatusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case 'active':
      return { label: 'Aktif (Tanggap Darurat)', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'contained':
      return { label: 'Terkendali', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'resolved':
      return { label: 'Selesai', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
    default:
      return { label: status || 'Aktif', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

// Format broadcast level badge
function getBroadcastLevelBadge(level: BroadcastLevel | null) {
  switch (level) {
    case 'national':
      return { label: 'Siaran Nasional', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'regional':
      return { label: 'Siaran Regional', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'local':
      return { label: 'Siaran Lokal', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    default:
      return { label: 'Cakupan Belum Ditentukan', badgeClass: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
}

// Mini Interactive Leaflet Map Component
const EventMiniMap: React.FC<{
  eventId: number;
  title: string;
  latitude: number;
  longitude: number;
  hazardSlug?: string;
  severity?: string;
}> = ({ eventId, title, latitude, longitude, hazardSlug, severity }) => {
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
      zoom: 8,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; CARTO',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const pointFeature: GeoJsonPointFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      properties: {
        id: eventId,
        title,
        hazard_slug: hazardSlug,
        severity,
      },
    };

    const icon = createMarkerIcon(pointFeature, true, 'light');
    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    marker
      .bindPopup(
        `<div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 4px;">
          <strong style="color: #111827;">${title}</strong><br/>
          <span style="color: #6B7280; font-size: 11px;">Koordinat: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</span>
        </div>`
      )
      .openPopup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [eventId, title, latitude, longitude, hazardSlug, severity]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[280px] sm:h-[320px] rounded-xl overflow-hidden border border-[#E5E7EB] bg-gray-100 relative z-0"
    />
  );
};

export const PublicDisasterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? parseInt(id, 10) : NaN;
  const isValidId = !isNaN(eventId) && eventId > 0;

  const [eventDetail, setEventDetail] = useState<HazardEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isValidId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Fetch Event Detail with cancellation
  useEffect(() => {
    if (!isValidId) {
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadDetail = async () => {
      setErrorMessage(null);
      try {
        const data = await publicService.getEventDetail(eventId, controller.signal);
        if (isMounted) {
          setEventDetail(data);
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) {
          return;
        }
        if (isMounted) {
          setErrorMessage('Data kejadian bencana tidak ditemukan atau terjadi kendala saat memuat.');
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
  }, [eventId, isValidId]);

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
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
          Parameter ID Kejadian Bencana Tidak Valid
        </h1>
        <p className="text-sm text-[#4B5563] max-w-md mx-auto">
          URL kejadian bencana harus menyertakan identifikasi bilangan bulat positif.
        </p>
        <div className="pt-2">
          <Link
            to={PATHS.PUBLIC.DISASTERS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#047857] text-white text-sm font-bold shadow-xs hover:bg-[#065F46] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Bencana</span>
          </Link>
        </div>
      </div>
    );
  }

  // SKELETON LOADING VIEW
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="w-48 h-4 bg-gray-200 rounded-md animate-pulse" />
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-4 animate-pulse">
          <div className="w-32 h-6 bg-gray-200 rounded-md" />
          <div className="w-2/3 h-8 bg-gray-300 rounded-md" />
          <div className="w-full h-12 bg-gray-100 rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white border border-[#E5E7EB] rounded-2xl p-6 animate-pulse" />
            <div className="h-48 bg-white border border-[#E5E7EB] rounded-2xl p-6 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-white border border-[#E5E7EB] rounded-2xl p-6 animate-pulse" />
            <div className="h-48 bg-white border border-[#E5E7EB] rounded-2xl p-6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 404 OR FETCH ERROR VIEW
  if (errorMessage || !eventDetail) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
          Kejadian Bencana #{eventId} Tidak Ditemukan
        </h1>
        <p className="text-sm text-[#4B5563] max-w-md mx-auto">
          {errorMessage || 'Data untuk kejadian bencana ini tidak tercatat atau telah diarsipkan.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to={PATHS.PUBLIC.DISASTERS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D1D5DB] text-sm font-bold text-[#111827] shadow-xs hover:border-[#047857] hover:text-[#047857] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Katalog Bencana</span>
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
  const sev = getSeverityBadge(eventDetail.severity);
  const stat = getStatusBadge(eventDetail.status);
  const provenanceStatus = eventDetail.data_source?.provenance_status || eventDetail.provenance_status;
  const provenanceLabel = eventDetail.data_source?.provenance_label || eventDetail.provenance_label;
  const isLive = provenanceStatus === 'LIVE';
  const hasCoordinates =
    typeof eventDetail.coordinates?.latitude === 'number' &&
    typeof eventDetail.coordinates?.longitude === 'number';

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16">
      {/* 1. BREADCRUMBS & NAVIGATION */}
      <div className="bg-white border-b border-[#E5E7EB] py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <nav className="flex items-center gap-1.5 text-[#6B7280] truncate" aria-label="Breadcrumb">
            <Link to={PATHS.PUBLIC.HOME} className="hover:text-[#047857] transition-colors shrink-0">
              Beranda
            </Link>
            <span>/</span>
            <Link to={PATHS.PUBLIC.DISASTERS} className="hover:text-[#047857] transition-colors shrink-0">
              Katalog Bencana
            </Link>
            <span>/</span>
            <span className="text-[#111827] font-semibold truncate">
              {eventDetail.title}
            </span>
          </nav>

          <Link
            to={PATHS.PUBLIC.DISASTERS}
            className="inline-flex items-center gap-1 text-[#047857] hover:text-emerald-800 font-bold shrink-0 ml-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Daftar Bencana</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* 2. HEADER CARD */}
        <header className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Large Hazard Icon */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-[#047857] flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
                {renderHazardIcon(eventDetail.hazard_type?.slug, 'w-8 h-8 sm:w-9 sm:h-9')}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-[#047857] text-xs font-bold font-mono">
                    #{eventDetail.id}
                  </span>
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wide">
                    {eventDetail.hazard_type?.name || 'Kejadian Bencana'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold font-mono text-[11px] ${
                      isLive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                      }`}
                    />
                    {provenanceLabel || (isLive ? 'LIVE (TELEMETRI)' : 'STATIC (TERKURASI)')}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight leading-snug">
                  {eventDetail.title}
                </h1>

                {/* Badges & Operational Status */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sev.badgeClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${sev.dotClass}`} />
                    <span>{sev.label}</span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${stat.badgeClass}`}>
                    {stat.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Share, Full Map) */}
            <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                leftIcon={isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              >
                {isCopied ? 'Tautan Disalin!' : 'Bagikan Info'}
              </Button>
              <Link
                to={PATHS.PUBLIC.MAP}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#047857] text-xs font-bold border border-emerald-200 transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Peta Nasional</span>
              </Link>
            </div>
          </div>

          {/* Meta Information Bar */}
          <div className="mt-6 pt-5 border-t border-[#F3F4F6] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <div>
                <p className="text-[#6B7280] font-semibold text-[11px]">Waktu Kejadian (WIB)</p>
                <p className="font-bold text-[#111827]">{formatEventDate(eventDetail.occurred_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <div>
                <p className="text-[#6B7280] font-semibold text-[11px]">Wilayah Terdampak</p>
                <p className="font-bold text-[#111827]">
                  {eventDetail.region?.name || 'Wilayah Republik Indonesia'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Compass className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <div>
                <p className="text-[#6B7280] font-semibold text-[11px]">Titik Koordinat</p>
                <p className="font-bold font-mono text-[#111827]">
                  {hasCoordinates
                    ? `${eventDetail.coordinates.latitude?.toFixed(4)}°, ${eventDetail.coordinates.longitude?.toFixed(4)}°`
                    : 'Koordinat Umum'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Radio className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <div>
                <p className="text-[#6B7280] font-semibold text-[11px]">Sumber Telemetri</p>
                <p className="font-bold text-[#111827] truncate">
                  {eventDetail.data_source?.name || eventDetail.source_name || 'BMKG TEWS / Pusdalops'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 3. TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ======================================================== */}
          {/* LEFT COLUMN: PRIMARY INTELLIGENCE & TELEMETRY */}
          {/* ======================================================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* SITUATION REPORT & DESCRIPTION */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#047857]" />
                <span>Ringkasan Situasi Kebencanaan</span>
              </h2>
              <div className="text-sm text-[#374151] leading-relaxed space-y-3">
                <p>
                  {eventDetail.description ||
                    'Laporan pemantauan rutin posko kebencanaan terhadap anomali geofisika dan hidrometeorologi terdeteksi pada wilayah ini.'}
                </p>
              </div>
            </section>

            {/* MINI GEOSPATIAL MAP */}
            {hasCoordinates && (
              <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#047857]" />
                    <span>Peta Lokasi Episentrum / Pusat Kejadian</span>
                  </h2>
                  <span className="text-xs font-mono font-bold text-[#047857]">
                    {eventDetail.coordinates.latitude}°, {eventDetail.coordinates.longitude}°
                  </span>
                </div>

                <EventMiniMap
                  eventId={eventDetail.id}
                  title={eventDetail.title}
                  latitude={eventDetail.coordinates.latitude!}
                  longitude={eventDetail.coordinates.longitude!}
                  hazardSlug={eventDetail.hazard_type?.slug}
                  severity={eventDetail.severity}
                />
              </section>
            )}

            {/* TELEMETRY & SOURCE METADATA (Safe Allowlist) */}
            {eventDetail.source_metadata && Object.keys(eventDetail.source_metadata).length > 0 && (
              <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#047857]" />
                    <span>Parameter Sensor & Data Telemetri</span>
                  </h2>
                  <span className="text-[11px] font-semibold text-[#6B7280]">
                    Metadata Otoritatif Terverifikasi
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Earthquake Magnitude */}
                  {eventDetail.source_metadata.Magnitude !== undefined && (
                    <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[11px] font-semibold text-[#6B7280]">Magnitudo Gempa</p>
                      <p className="text-lg font-extrabold text-[#111827]">
                        {String(eventDetail.source_metadata.Magnitude)} <span className="text-xs font-semibold">M</span>
                      </p>
                    </div>
                  )}

                  {/* Earthquake Depth */}
                  {eventDetail.source_metadata.Kedalaman !== undefined && (
                    <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[11px] font-semibold text-[#6B7280]">Kedalaman Hiposentrum</p>
                      <p className="text-lg font-extrabold text-[#111827]">
                        {String(eventDetail.source_metadata.Kedalaman)}
                      </p>
                    </div>
                  )}

                  {/* Flow Rate */}
                  {eventDetail.source_metadata.flow_rate_m3s !== undefined && (
                    <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[11px] font-semibold text-[#6B7280]">Debit Aliran Air</p>
                      <p className="text-lg font-extrabold text-[#111827]">
                        {String(eventDetail.source_metadata.flow_rate_m3s)}{' '}
                        <span className="text-xs font-semibold">m³/detik</span>
                      </p>
                    </div>
                  )}

                  {/* Water Level */}
                  {eventDetail.source_metadata.water_level_m !== undefined && (
                    <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[11px] font-semibold text-[#6B7280]">Tinggi Muka Air</p>
                      <p className="text-lg font-extrabold text-[#111827]">
                        {String(eventDetail.source_metadata.water_level_m)}{' '}
                        <span className="text-xs font-semibold">meter</span>
                      </p>
                    </div>
                  )}

                  {/* Tsunami Potential */}
                  {eventDetail.source_metadata.Potensi !== undefined && (
                    <div className="col-span-2 sm:col-span-3 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-emerald-900">Potensi Bahaya Lanjutan</p>
                        <p className="text-xs font-semibold text-emerald-800">
                          {String(eventDetail.source_metadata.Potensi)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Shakemap Preview if available */}
                  {typeof eventDetail.source_metadata.Shakemap === 'string' && (
                    <div className="col-span-2 sm:col-span-3 bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#4B5563]">Peta Guncangan (Shakemap BMKG):</span>
                      <span className="font-mono text-[11px] text-[#6B7280]">{String(eventDetail.source_metadata.Shakemap)}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* LINKED EARLY WARNING ALERTS */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Peringatan Dini Terkait</span>
                </h2>
                <span className="text-xs font-bold text-[#6B7280]">
                  {eventDetail.alerts?.length || 0} Peringatan Aktif
                </span>
              </div>

              {eventDetail.alerts && eventDetail.alerts.length > 0 ? (
                <div className="space-y-3">
                  {eventDetail.alerts.map((alert) => {
                    const bcast = getBroadcastLevelBadge(alert.broadcast_level);
                    const isOfficial = alert.alert_class === 'official_warning';

                    return (
                      <div
                        key={alert.id}
                        className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 space-y-2.5 transition-all hover:border-amber-400"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isOfficial
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {isOfficial ? 'Peringatan Resmi Otoritas' : 'Advisori Platform'}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${bcast.badgeClass}`}>
                            {bcast.label}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-[#111827]">{alert.title}</h3>
                        <p className="text-xs text-[#78350F] leading-relaxed">{alert.message}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-amber-200/70 text-[11px] text-[#92400E]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Mulai: {formatEventDate(alert.starts_at)}
                          </span>

                          <Link
                            to={`/warnings/${alert.id}`}
                            className="inline-flex items-center gap-1 font-bold text-[#047857] hover:underline"
                          >
                            <span>Lihat Peringatan</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 text-center text-xs text-[#6B7280]">
                  Tidak ada peringatan dini darurat spesifik yang diterbitkan untuk kejadian ini.
                </div>
              )}
            </section>

            {/* DATA PROVENANCE & INTEGRITY */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#047857]" />
                <span>Integritas & Asal Data Sumber</span>
              </h2>

              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Nama Penyedia / Otoritas:</span>
                  <span className="font-bold text-[#111827]">
                    {eventDetail.data_source?.provider || 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Saluran Telemetri:</span>
                  <span className="font-bold text-[#111827]">
                    {eventDetail.data_source?.name || 'BMKG TEWS Open Data API'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Tipe Sumber Data:</span>
                  <span className="font-mono font-semibold text-[#111827] uppercase">
                    {eventDetail.data_source?.source_type || 'API Telemetri'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                  <span className="text-[#6B7280]">Status Verifikasi:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terverifikasi Secara Deterministik
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: NEARBY EVENTS, TIMELINE, SAFETY & HOTLINES */}
          {/* ======================================================== */}
          <div className="space-y-6">
            {/* 1. NEARBY HAZARD EVENTS (SPATIAL QUERY 50 KM) */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#047857]" />
                  <span>Kejadian Terdekat (&le; 50 km)</span>
                </h2>
                <span className="text-xs font-semibold text-[#6B7280]">
                  {eventDetail.nearby_events?.length || 0} Kejadian
                </span>
              </div>

              {eventDetail.nearby_events && eventDetail.nearby_events.length > 0 ? (
                <div className="space-y-3">
                  {eventDetail.nearby_events.map((nearby) => {
                    const nSev = getSeverityBadge(nearby.severity);

                    return (
                      <Link
                        key={nearby.id}
                        to={`/disasters/${nearby.id}`}
                        className="block bg-[#F9FAFB] hover:bg-emerald-50/50 border border-[#E5E7EB] hover:border-[#047857]/40 rounded-xl p-3.5 transition-all group"
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="inline-flex items-center gap-1 font-bold text-[#047857]">
                            {renderHazardIcon(nearby.hazard_type?.slug, 'w-3.5 h-3.5')}
                            {nearby.hazard_type?.name || 'Kejadian'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {nearby.distance_km} km
                          </span>
                        </div>

                        <h4 className="font-bold text-xs sm:text-sm text-[#111827] group-hover:text-[#047857] transition-colors line-clamp-2">
                          {nearby.title}
                        </h4>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-[#6B7280]">
                          <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${nSev.badgeClass}`}>
                            {nSev.label}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[#047857] font-semibold">
                            Detail <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 text-center text-xs text-[#6B7280]">
                  Tidak ada kejadian bencana lain terdeteksi dalam radius 50 km dari lokasi ini.
                </div>
              )}
            </section>

            {/* 2. CHRONOLOGICAL VERIFIED TIMELINE */}
            {eventDetail.timeline && eventDetail.timeline.length > 0 && (
              <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#047857]" />
                  <span>Kronologi Kejadian Terverifikasi</span>
                </h2>

                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
                  {eventDetail.timeline.map((item, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full bg-white border-2 border-[#047857]" />

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold font-mono text-[#047857]">
                          {formatEventDate(item.timestamp)}
                        </span>
                        <h4 className="font-bold text-xs text-[#111827] leading-snug">{item.label}</h4>
                        <p className="text-[11px] text-[#4B5563] leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. SAFETY & MITIGATION GUIDELINES */}
            {eventDetail.safety_guidelines && eventDetail.safety_guidelines.length > 0 && (
              <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3">
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#047857]" />
                  <span>Panduan Keselamatan & Mitigasi</span>
                </h2>

                <div className="space-y-3">
                  {eventDetail.safety_guidelines.map((guide) => (
                    <div
                      key={guide.id}
                      className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#047857] uppercase">
                        <span>{guide.category}</span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#111827]">{guide.title}</h4>
                      <p className="text-xs text-[#166534] leading-relaxed">{guide.summary}</p>
                      <div className="pt-1">
                        <Link
                          to={`/education/${guide.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#047857] hover:underline"
                        >
                          <span>Baca Panduan Lengkap</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. EMERGENCY HOTLINES QUICK CALL */}
            <section className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-800">
                <PhoneCall className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm">Pusat Bantuan & Panggilan Darurat</h3>
              </div>
              <p className="text-xs text-rose-700">
                Hubungi nomor darurat resmi nasional jika Anda atau keluarga berada dalam zona bahaya:
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-bold">
                <a
                  href="tel:112"
                  className="bg-white p-2.5 rounded-xl border border-rose-200 text-center hover:bg-rose-100 transition-colors text-rose-900 block"
                >
                  <p className="text-[10px] text-rose-600 font-semibold">Panggilan Darurat</p>
                  <p className="text-base font-extrabold">112</p>
                </a>
                <a
                  href="tel:115"
                  className="bg-white p-2.5 rounded-xl border border-rose-200 text-center hover:bg-rose-100 transition-colors text-rose-900 block"
                >
                  <p className="text-[10px] text-rose-600 font-semibold">BASARNAS (SAR)</p>
                  <p className="text-base font-extrabold">115</p>
                </a>
                <a
                  href="tel:119"
                  className="bg-white p-2.5 rounded-xl border border-rose-200 text-center hover:bg-rose-100 transition-colors text-rose-900 block"
                >
                  <p className="text-[10px] text-rose-600 font-semibold">Ambulans Kemenkes</p>
                  <p className="text-base font-extrabold">119</p>
                </a>
                <a
                  href="tel:117"
                  className="bg-white p-2.5 rounded-xl border border-rose-200 text-center hover:bg-rose-100 transition-colors text-rose-900 block"
                >
                  <p className="text-[10px] text-rose-600 font-semibold">Posko BNPB</p>
                  <p className="text-base font-extrabold">117</p>
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDisasterDetailPage;
