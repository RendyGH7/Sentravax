import React, { useState, useEffect, useCallback, useId } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ScrollWordTitle } from '../../components/shared/ScrollWordTitle';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import type { 
  RegionItem, 
  LocationCheckResult,
  GoBagChecklistItem
} from '../../types';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { DisasterMap } from '../../components/map/DisasterMap';
import { ProvenanceBadge } from '../../components/shared/DataTrustBadges';
import { EmergencyHotlineStrip } from '../../components/shared/EmergencyHotlineStrip';
import { useAuth } from '../../app/context/useAuth';
import { userService } from '../../services/user-service';
import { guestPreparednessSyncService } from '../../services/guest-preparedness-sync-service';
import { 
  ShieldCheck, 
  MapPin, 
  Navigation, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Info, 
  Package, 
  FileText, 
  HeartPulse, 
  ArrowRight, 
  Crosshair, 
  Radio, 
  BarChart3
} from 'lucide-react';

function formatDate(dateString?: string): string {
  if (!dateString) return 'Waktu tidak tersedia';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(d);
  } catch {
    return dateString;
  }
}

function getRiskColorConfig(level: string) {
  switch (level?.toLowerCase()) {
    case 'critical':
      return {
        badgeVariant: 'danger' as const,
        label: 'Awas (Kritis)',
        bgClass: 'bg-rose-500',
        textClass: 'text-rose-400',
        borderClass: 'border-rose-800/60',
        bgLight: 'bg-rose-950/40',
      };
    case 'high':
      return {
        badgeVariant: 'warning' as const,
        label: 'Siaga (Tinggi)',
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-400',
        borderClass: 'border-amber-800/60',
        bgLight: 'bg-amber-950/40',
      };
    case 'medium':
      return {
        badgeVariant: 'warning' as const,
        label: 'Waspada (Sedang)',
        bgClass: 'bg-yellow-500',
        textClass: 'text-yellow-400',
        borderClass: 'border-yellow-800/60',
        bgLight: 'bg-yellow-950/40',
      };
    case 'insufficient_data':
      return {
        badgeVariant: 'warning' as const,
        label: 'Data Tidak Mencukupi',
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-300',
        borderClass: 'border-amber-800/60',
        bgLight: 'bg-amber-950/40',
      };
    case 'low':
    default:
      return {
        badgeVariant: 'success' as const,
        label: 'Normal (Rendah)',
        bgClass: 'bg-rose-500',
        textClass: 'text-rose-400',
        borderClass: 'border-rose-800/60',
        bgLight: 'bg-rose-950/40',
      };
  }
}

function getCategoryIcon(category: string) {
  switch (category?.toLowerCase()) {
    case 'dokumen':
      return <FileText className="w-4 h-4 text-sky-400" />;
    case 'medis':
      return <HeartPulse className="w-4 h-4 text-rose-400" />;
    case 'logistik':
      return <Package className="w-4 h-4 text-amber-400" />;
    default:
      return <CheckCircle2 className="w-4 h-4 text-rose-400" />;
  }
}

export const PublicPreparednessPage: React.FC = () => {
  // Pilot Regions State
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [regionsLoading, setRegionsLoading] = useState<boolean>(true);

  // Form / Coordinates Selection State
  const [selectedRegionId, setSelectedRegionId] = useState<string>('1');
  const [latitude, setLatitude] = useState<string>('-6.2088');
  const [longitude, setLongitude] = useState<string>('106.8456');
  const [coordError, setCoordError] = useState<string | null>(null);

  // Origin tracking
  const [locationOrigin, setLocationOrigin] = useState<'preset_default' | 'preset_selected' | 'manual' | 'map_click' | 'gps'>('preset_default');

  // Geolocation Browser State
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Authentication Context
  const { user, isAuthenticated } = useAuth();

  // Analysis State
  const [analysisResult, setAnalysisResult] = useState<LocationCheckResult | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Go-Bag Interactive Completed Checklist
  const GOBAG_STORAGE_KEY = 'sentravax_gobag_checklist';
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(GOBAG_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    try {
      const items = guestPreparednessSyncService.getGuestChecklistItems();
      const initial: Record<number, boolean> = {};
      items.forEach(id => {
        initial[id] = true;
      });
      return initial;
    } catch {
      return {};
    }
  });

  // Hydrate checklist from authenticated user account
  useEffect(() => {
    let isCancelled = false;

    if (isAuthenticated && user?.role === 'user') {
      const hydrateUserChecklist = async () => {
        try {
          if (guestPreparednessSyncService.hasGuestChecklistItems()) {
            await guestPreparednessSyncService.syncGuestChecklistToServer(user, true);
          }
          const res = await userService.getChecklist();
          if (!isCancelled && res?.categories) {
            const mapped: Record<number, boolean> = {};
            Object.values(res.categories).forEach(items => {
              items.forEach(it => {
                if (it.is_completed) {
                  mapped[it.id] = true;
                }
              });
            });
            setCheckedItems(mapped);
          }
        } catch {
          // Keep local state
        }
      };

      void hydrateUserChecklist();
    }

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem(GOBAG_STORAGE_KEY, JSON.stringify(checkedItems));
      } catch {
        // Ignore
      }
    }
  }, [checkedItems, isAuthenticated]);

  const [checklistFilter, setChecklistFilter] = useState<string>('all');

  const handleResetChecklist = () => {
    setCheckedItems({});
    try {
      localStorage.removeItem(GOBAG_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleCheckAllChecklist = () => {
    if (!analysisResult?.recommendations?.recommended_checklist_items) return;
    const allChecked: Record<number, boolean> = {};
    analysisResult.recommendations.recommended_checklist_items.forEach((item) => {
      allChecked[item.id] = true;
    });
    setCheckedItems(allChecked);
  };

  // Unique accessible IDs for form fields
  const regionSelectId = useId();
  const latInputId = useId();
  const lonInputId = useId();

  // Load Monitored Pilot Regions
  useEffect(() => {
    let isCancelled = false;

    publicService.getRegions()
      .then((data) => {
        if (!isCancelled) {
          setRegions(data);
          setRegionsLoading(false);
          const defaultReg = data.find(r => r.id === 1);
          if (defaultReg?.center?.latitude && defaultReg?.center?.longitude) {
            setLatitude(String(defaultReg.center.latitude));
            setLongitude(String(defaultReg.center.longitude));
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setRegionsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Validate Coordinates
  const validateCoords = (latStr: string, lonStr: string): boolean => {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      setCoordError('Latitude dan Longitude harus berupa angka desimal valid.');
      return false;
    }
    if (lat < -90 || lat > 90) {
      setCoordError('Latitude harus berada dalam rentang -90.0 hingga 90.0 derajat.');
      return false;
    }
    if (lon < -180 || lon > 180) {
      setCoordError('Longitude harus berada dalam rentang -180.0 hingga 180.0 derajat.');
      return false;
    }

    setCoordError(null);
    return true;
  };

  // Run Risk Assessment
  const runAssessment = useCallback(async (latVal?: number, lonVal?: number, regIdVal?: number) => {
    const targetLat = latVal !== undefined ? latVal : parseFloat(latitude);
    const targetLon = lonVal !== undefined ? lonVal : parseFloat(longitude);
    const targetRegionId = regIdVal !== undefined ? regIdVal : (selectedRegionId ? parseInt(selectedRegionId, 10) : undefined);

    if (isNaN(targetLat) || isNaN(targetLon)) {
      setCoordError('Koordinat belum valid untuk dilakukan kalkulasi.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await publicService.checkLocation({
        latitude: targetLat,
        longitude: targetLon,
        region_id: targetRegionId,
      });
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Failed to run risk assessment:', err);
      setAnalysisError(err?.message || 'Gagal menghitung profil risiko wilayah. Silakan coba kembali.');
    } finally {
      setAnalyzing(false);
    }
  }, [latitude, longitude, selectedRegionId]);

  // Initial calculation on mount
  useEffect(() => {
    const defaultLat = parseFloat(latitude);
    const defaultLon = parseFloat(longitude);
    if (!isNaN(defaultLat) && !isNaN(defaultLon)) {
      runAssessment(defaultLat, defaultLon, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    setSelectedRegionId(regId);
    setLocationOrigin('preset_selected');
    const selected = regions.find((r) => String(r.id) === regId);
    if (selected && selected.center?.latitude && selected.center?.longitude) {
      const newLat = String(selected.center.latitude);
      const newLon = String(selected.center.longitude);
      setLatitude(newLat);
      setLongitude(newLon);
      setCoordError(null);
      runAssessment(selected.center.latitude, selected.center.longitude, selected.id);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    const roundedLat = Number(lat.toFixed(5));
    const roundedLng = Number(lng.toFixed(5));
    setLatitude(String(roundedLat));
    setLongitude(String(roundedLng));
    setSelectedRegionId('');
    setLocationOrigin('map_click');
    setCoordError(null);
    runAssessment(roundedLat, roundedLng, undefined);
  };

  const handleRequestGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoNotice('Peramban Anda tidak mendukung deteksi lokasi otomatis.');
      return;
    }

    setGeoLoading(true);
    setGeoNotice('Meminta izin lokasi perangkat...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(5));
        const userLon = Number(pos.coords.longitude.toFixed(5));
        setLatitude(String(userLat));
        setLongitude(String(userLon));
        setSelectedRegionId('');
        setLocationOrigin('gps');
        setGeoNotice(`Lokasi GPS terdeteksi (Akurasi: ±${Math.round(pos.coords.accuracy)}m).`);
        setGeoLoading(false);
        setCoordError(null);
        runAssessment(userLat, userLon, undefined);
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoNotice('Izin lokasi ditolak. Silakan pilih wilayah administratif atau masukkan koordinat manual.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoNotice('Informasi posisi satelit tidak tersedia saat ini.');
            break;
          case err.TIMEOUT:
            setGeoNotice('Waktu permintaan geolokasi habis. Silakan gunakan pemilihan manual.');
            break;
          default:
            setGeoNotice('Gagal mendeteksi lokasi otomatis.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const toggleChecklistItem = (id: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    if (isAuthenticated && user?.role === 'user') {
      void userService.toggleChecklistItem(id);
    }
  };

  const riskLevel = analysisResult?.assessment.risk_level || 'low';
  const isInsufficientData = analysisResult?.assessment.assessment_status === 'INSUFFICIENT_DATA' || riskLevel === 'insufficient_data';
  const riskConfig = getRiskColorConfig(riskLevel);
  const riskScore = analysisResult?.assessment.risk_score ?? 0;
  const activeThreats = (analysisResult?.assessment.factors?.nearby_active_events as Record<string, unknown>)?.threats as Array<{
    id: number;
    title: string;
    hazard_type: string;
    hazard_slug: string;
    severity: string;
    occurred_at: string;
    contribution: number;
    data_source_id?: number;
    source_name?: string;
    provider_name?: string;
    provenance_status?: string;
    provenance_label?: string;
  }> | undefined;

  return (
    <div className="space-y-10 py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-neutral-100">
      {/* 0. 1-CLICK EMERGENCY HOTLINE SPEED-DIAL BAR */}
      <EmergencyHotlineStrip
        variant="bar"
        theme="dark"
        title="Panggilan Darurat Siaga (1-Klik):"
        subtitle="Kontak darurat nasional terverifikasi resmi"
      />

      {/* ========================================================================= */}
      {/* SECTION 1: HERO & SCOPE TRANSPARENCY                                     */}
      {/* ========================================================================= */}
      <section aria-labelledby="siaga-hero-heading" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/60">
                SIAGA MANDIRI
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-neutral-900 text-neutral-300 border border-neutral-700">
                POSTGIS DETERMINISTIK
              </span>
              <span className="text-xs font-mono text-neutral-400">Cakupan: DKI Jakarta, Jabar, Banten &amp; Nasional</span>
            </div>
            <ScrollWordTitle
              as="h1"
              className="text-2xl sm:text-3xl font-black text-white tracking-tight"
            >
              SIAGA PERSONAL: Cek Risiko &amp; Mitigasi Lokasi
            </ScrollWordTitle>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to={PATHS.PUBLIC.EDUCATION}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 transition-colors"
            >
              <span>Panduan Edukasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to={`${PATHS.PUBLIC.MAP}?layer=shelters`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-xs font-bold text-white transition-colors"
            >
              <span>Peta Shelter Terverifikasi</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: LOCATION SELECTOR & INTERACTIVE MAP CONTROLS                   */}
      {/* ========================================================================= */}
      <section aria-labelledby="location-selector-heading" className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="p-6 sm:p-8 rounded-3xl bg-[#121614] border border-neutral-800 space-y-6"
        >
          <div>
            <h2 id="location-selector-heading" className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-400" />
              <span>Pilih Lokasi untuk Dianalisis</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1 font-normal">
              Pilih salah satu wilayah pilot terpantau, klik langsung pada peta interaktif di bawah, atau gunakan koordinat perangkat Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Presets: Monitored Pilot Regions Dropdown */}
            <div className="md:col-span-5 space-y-1.5">
              <label htmlFor={regionSelectId} className="block text-xs font-bold text-neutral-300">
                Pilih Wilayah Pilot Terpantau
              </label>
              <div className="relative">
                <select
                  id={regionSelectId}
                  value={selectedRegionId}
                  onChange={handleRegionChange}
                  disabled={regionsLoading || analyzing}
                  aria-label="Pilih wilayah pilot terpantau"
                  className="w-full rounded-xl text-xs sm:text-sm px-3.5 py-2.5 transition-all outline-none border font-normal appearance-none cursor-pointer pr-10 bg-neutral-900 text-white border-neutral-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
                >
                  <option value="" disabled>-- Pilih Wilayah Pilot --</option>
                  {regions.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Coordinates Manual Inputs */}
            <div className="md:col-span-4 grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label htmlFor={latInputId} className="block text-xs font-bold text-neutral-300">
                  Latitude
                </label>
                <input
                  id={latInputId}
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => {
                    setLatitude(e.target.value);
                    setSelectedRegionId('');
                    setLocationOrigin('manual');
                    validateCoords(e.target.value, longitude);
                  }}
                  placeholder="-6.2088"
                  className="w-full rounded-xl text-xs sm:text-sm px-3 py-2 border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={lonInputId} className="block text-xs font-bold text-neutral-300">
                  Longitude
                </label>
                <input
                  id={lonInputId}
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => {
                    setLongitude(e.target.value);
                    setSelectedRegionId('');
                    setLocationOrigin('manual');
                    validateCoords(latitude, e.target.value);
                  }}
                  placeholder="106.8456"
                  className="w-full rounded-xl text-xs sm:text-sm px-3 py-2 border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            {/* Action Buttons: Geolocation & Trigger Analysis */}
            <div className="md:col-span-3 flex flex-col sm:flex-row md:flex-col gap-2">
              <button
                type="button"
                onClick={handleRequestGeolocation}
                disabled={geoLoading || analyzing}
                className="w-full justify-center px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Navigation className={`w-3.5 h-3.5 text-rose-400 ${geoLoading ? 'animate-spin' : ''}`} />
                <span>{geoLoading ? 'Mendeteksi...' : 'Lokasi GPS Saya'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateCoords(latitude, longitude)) {
                    runAssessment();
                  }
                }}
                disabled={analyzing || !!coordError}
                className="w-full justify-center px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-xs font-bold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{analyzing ? 'Menganalisis...' : 'Analisis Risiko'}</span>
              </button>
            </div>
          </div>

          {/* Error or Notice Callout */}
          {coordError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{coordError}</span>
            </p>
          )}

          {geoNotice && (
            <p className="text-xs text-neutral-300 flex items-center gap-1.5 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
              <Crosshair className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{geoNotice}</span>
            </p>
          )}

          {/* Informative Banner for Default Location Preset */}
          {locationOrigin === 'preset_default' && (
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Preset Lokasi Contoh Awal: </span>
                Data yang tampil pertama kali adalah contoh untuk wilayah percontohan DKI Jakarta. Ini <strong>BUKAN</strong> deteksi GPS otomatis perangkat Anda. Silakan pilih wilayah pilot, klik langsung pada peta interaktif, atau gunakan tombol <strong>"Lokasi GPS Saya"</strong> untuk memeriksa wilayah Anda.
              </div>
            </div>
          )}
        </motion.div>

        {/* Embedded Interactive Map for Visual Spatial Context */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-rose-400" />
              <span>Klik pada peta untuk memindahkan titik analisis koordinat secara interaktif:</span>
            </span>
            <span className="font-mono text-[11px] text-rose-400 font-bold">
              Pin Terpilih: [{parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}]
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-[#121614]">
            <DisasterMap
              theme="dark"
              height="380px"
              selectedLocation={{
                latitude: parseFloat(latitude) || -6.2088,
                longitude: parseFloat(longitude) || 106.8456,
                label: analysisResult?.location.region?.name || 'Titik Analisis Kesiapsiagaan',
              }}
              onMapClick={handleMapClick}
              showFilters={true}
              showLegend={false}
              showControls={true}
              showEventList={false}
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: ASSESSMENT RESULTS PRESENTATION                                */}
      {/* ========================================================================= */}
      <section aria-labelledby="assessment-result-heading" className="space-y-6 pt-4 border-t border-neutral-800">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
            Hasil Evaluasi Risiko
          </span>
          <h2 id="assessment-result-heading" className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Indeks Kerentanan &amp; Profil Ancaman Lokasi
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-normal">
            Penilaian deterministik menggabungkan jarak radius 25 km terhadap kejadian bencana aktif, peringatan darurat CAP, dan kerentanan baseline wilayah.
          </p>
        </div>

        {analyzing ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton variant="card" count={3} />
          </div>
        ) : analysisError ? (
          <div className="p-8 rounded-3xl bg-[#121614] border border-neutral-800 text-center space-y-4 shadow-xs">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Gagal Memproses Analisis Risiko</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">{analysisError}</p>
            </div>
            <button
              type="button"
              onClick={() => runAssessment()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white border border-neutral-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Ulang Analisis</span>
            </button>
          </div>
        ) : analysisResult ? (
          <div className="space-y-6">
            {/* Out-of-Coverage Informational Banner */}
            {analysisResult.provenance.is_pilot_coverage === false && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-3 text-xs text-amber-200 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Perhatian Cakupan Wilayah Pilot: </span>
                  Titik koordinat yang Anda pilih berada di luar radius asosiasi wilayah pilot (DKI Jakarta, Jawa Barat, Banten). 
                  Status "Data Tidak Mencukupi" mencerminkan bahwa koordinat berada di luar radius asosiasi 45 km dari titik acuan regional pilot, bukan jaminan bahwa wilayah tersebut bebas dari ancaman bencana alam. Tetap ikuti arahan resmi posko BMKG dan BPBD setempat.
                </div>
              </div>
            )}

            {/* Top Cards: Score Gauge & Location Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Score Meter Card */}
              <div className="lg:col-span-5">
                <div className={`p-6 sm:p-8 rounded-3xl bg-[#121614] border ${riskConfig.borderClass} h-full space-y-5 flex flex-col justify-between`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-neutral-400 uppercase">
                        Indeks Risiko Lokasi
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${riskConfig.borderClass} ${riskConfig.bgLight} ${riskConfig.textClass}`}>
                        {riskConfig.label}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      {isInsufficientData ? (
                        <>
                          <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                            DATA TERBATAS
                          </span>
                          <span className="text-xs font-semibold text-neutral-400">
                            ({riskScore} pt baseline)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                            {riskScore}
                          </span>
                          <span className="text-sm font-semibold text-neutral-400">/ 100</span>
                        </>
                      )}
                    </div>

                    {/* Visual Risk Scale Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full transition-all duration-700 ${riskConfig.bgClass}`}
                          style={{ width: isInsufficientData ? '18%' : `${Math.min(100, Math.max(5, riskScore))}%` }}
                          role="progressbar"
                          aria-valuenow={riskScore}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span>0 Normal</span>
                        <span>25 Waspada</span>
                        <span>50 Siaga</span>
                        <span>75 Awas</span>
                        <span>100</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed pt-2 font-normal">
                      {analysisResult.assessment.risk_label || 'Indeks risiko dihitung berdasarkan kedekatan peristiwa aktif dan kerentanan lokal.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Waktu Analisis:</span>
                    <span className="font-semibold text-white">
                      {formatDate(analysisResult.assessment.assessed_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location & Data Summary Card */}
              <div className="lg:col-span-7">
                <div className="p-6 sm:p-8 rounded-3xl bg-[#121614] border border-neutral-800 h-full space-y-5 flex flex-col justify-between text-neutral-100">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <span className="text-[11px] font-mono uppercase text-rose-400 font-bold">
                          Wilayah Asosiasi Pilot
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <h3 className="text-lg font-black text-white">
                            {analysisResult.location.region?.name || 'Di Luar Radius Asosiasi Pilot'}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-300 border border-neutral-700">
                            {locationOrigin === 'preset_default' && 'Preset Contoh Awal'}
                            {locationOrigin === 'preset_selected' && 'Wilayah Terpilih'}
                            {locationOrigin === 'manual' && 'Input Manual'}
                            {locationOrigin === 'map_click' && 'Dipilih dari Peta'}
                            {locationOrigin === 'gps' && 'Sensor GPS'}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-neutral-400 mt-0.5">
                          Radius asosiasi pilot &le; 45 km dari titik acuan regional (poligon batas administratif belum aktif).
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-500 block font-mono">Kode</span>
                        <span className="text-xs font-mono font-bold text-white">
                          {analysisResult.location.region?.code || 'NON-PILOT'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-[11px] text-neutral-400 block">Koordinat Lat / Lon</span>
                        <span className="text-xs font-mono font-bold text-white">
                          {analysisResult.location.latitude.toFixed(4)}, {analysisResult.location.longitude.toFixed(4)}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-[11px] text-neutral-400 block">Ancaman Aktif 25km</span>
                        <span className="text-xs font-bold text-amber-400">
                          {analysisResult.assessment.active_threats_count ?? 0} Kejadian
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 col-span-2 sm:col-span-1">
                        <span className="text-[11px] text-neutral-400 block">Peringatan CAP</span>
                        <span className="text-xs font-bold text-amber-400">
                          {analysisResult.assessment.active_alerts_count ?? 0} Peringatan
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-neutral-300">
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-rose-400" />
                        <span>Status Telemetri Spasial: </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${isInsufficientData ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'}`}>
                          {isInsufficientData ? 'DI LUAR CAKUPAN PILOT' : (analysisResult.assessment.data_freshness || 'TERHUBUNG')}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">
                        Evaluasi spasial dieksekusi secara instan dengan mesin PostGIS deterministik tanpa perkiraan spekulatif.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Metodologi:</span>
                    <span className="font-mono text-rose-400 font-semibold">
                      v1.0-deterministic-spatial
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section: Active Threats Breakdown & Factors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Threats Breakdown */}
              <div className="p-6 rounded-3xl bg-[#121614] border border-neutral-800 space-y-4 text-neutral-100">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Ancaman Aktif dalam Radius 25 KM</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-neutral-400">
                    {activeThreats?.length || 0} Terdeteksi
                  </span>
                </div>

                {!activeThreats || activeThreats.length === 0 ? (
                  <EmptyState
                    title="Tidak Ada Kejadian Kritis Sekitar"
                    description="Tidak ada catatan bencana aktif dalam radius pantauan 25 km dari titik koordinat ini."
                    className="py-6"
                  />
                ) : (
                  <div className="space-y-3">
                    {activeThreats.map((t) => (
                      <div key={t.id} className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white">
                              {t.hazard_type}
                            </span>
                            <ProvenanceBadge
                              provenance={t.provenance_status === 'SIMULATED' ? 'SIMULATED' : (t.provenance_status === 'LIVE' ? 'OFFICIAL' : 'CURATED_REFERENCE')}
                              isSimulated={t.provenance_status === 'SIMULATED'}
                              size="xs"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${t.severity === 'high' ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60' : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'}`}>
                              Tingkat {t.severity}
                            </span>
                            <span className="text-[10px] font-mono text-rose-400 font-bold">
                              +{t.contribution} pt
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-300 leading-snug font-normal">
                          {t.title}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10.5px] text-neutral-400 pt-1.5 border-t border-neutral-800">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            {formatDate(t.occurred_at)}
                          </span>
                          <span className="text-neutral-400">
                            Sumber: <span className="font-semibold text-neutral-200">{t.source_name || 'SENTRAVAX Local Baseline'}</span>
                          </span>
                          <Link to={`${PATHS.PUBLIC.MAP}?eventId=${t.id}`} className="font-bold text-rose-400 hover:underline flex items-center gap-0.5">
                            <span>Fokus Peta</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contributing Risk Factors Breakdown */}
              <div className="p-6 rounded-3xl bg-[#121614] border border-neutral-800 space-y-4 text-neutral-100">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-rose-400" />
                    <span>Faktor Komponen Pembentuk Risiko</span>
                  </h3>
                  <span className="text-xs text-neutral-400">Bobot Analisis</span>
                </div>

                <div className="space-y-3">
                  {/* Baseline Factor */}
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Kerentanan Dasar Tropis (Baseline)</span>
                      <span className="font-mono text-rose-400 font-bold">
                        +{Number((analysisResult.assessment.factors?.baseline_vulnerability as { contribution?: number })?.contribution ?? 15).toFixed(1)} pt (Bobot 15%)
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Kerentanan geografis dasar kawasan kepulauan tropis Nusantara terhadap dinamika cuaca dan seismik.
                    </p>
                  </div>

                  {/* Nearby Events Factor */}
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Kedekatan Kejadian Aktif (Proximity &amp; Recency)</span>
                      <span className="font-mono text-amber-400 font-bold">
                        +{Number((analysisResult.assessment.factors?.nearby_active_events as { contribution?: number })?.contribution || 0).toFixed(1)} pt (Bobot 45%)
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Dihitung berdasarkan tingkat keparahan bencana dalam radius 25 km dengan peluruhan waktu (semakin baru semakin tinggi).
                    </p>
                  </div>

                  {/* Official Alerts Factor */}
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Peringatan Dini Resmi Otoritas (CAP Alerts)</span>
                      <span className="font-mono text-amber-400 font-bold">
                        +{Number((analysisResult.assessment.factors?.official_alerts as { contribution?: number })?.contribution || 0).toFixed(1)} pt (Bobot 30%)
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Status siaga darurat resmi aktif yang diterbitkan BMKG / BPBD pada wilayah administratif terkait.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300 flex items-center justify-between">
                  <span>Total Rekonsiliasi:</span>
                  <span className="font-bold text-white">
                    {(
                      Number((analysisResult.assessment.factors?.baseline_vulnerability as { contribution?: number })?.contribution ?? 15) +
                      Number((analysisResult.assessment.factors?.nearby_active_events as { contribution?: number })?.contribution ?? 0) +
                      Number((analysisResult.assessment.factors?.official_alerts as { contribution?: number })?.contribution ?? 0)
                    ).toFixed(1)} pt &rarr; Skor: {riskScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Section: Preparedness Action Steps & Go-Bag Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Action Steps */}
              <div className="lg:col-span-5">
                <div className="p-6 rounded-3xl bg-[#121614] border border-neutral-800 h-full space-y-4 text-neutral-100 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-neutral-800 pb-2.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        <span>Rekomendasi Kesiapsiagaan Mandiri Keluarga</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 font-normal">
                        Saran tindakan kesiapsiagaan internal sistem berbasis tingkat risiko. Untuk instruksi kedaruratan atau evakuasi resmi, selalu ikuti arahan dari BPBD dan BMKG.
                      </p>
                    </div>

                    <ul className="space-y-2.5 text-xs text-neutral-200">
                      {analysisResult.recommendations.action_steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                          <span className="w-5 h-5 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-neutral-800">
                    <Link
                      to={PATHS.PUBLIC.EDUCATION}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 transition-colors"
                    >
                      <span>Buka Panduan Edukasi Lengkap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Interactive Go-Bag Checklist */}
              <div className="lg:col-span-7">
                <div className="p-6 rounded-3xl bg-[#121614] border border-neutral-800 h-full space-y-4 text-neutral-100">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Package className="w-4 h-4 text-rose-400" />
                        <span>Checklist Tas Siaga Bencana (Standar 13 Item BNPB)</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5 font-normal">
                        Centang perlengkapan yang sudah Anda siapkan di rumah secara mandiri.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span data-testid="gobag-count" className="text-xs font-mono font-bold text-rose-400">
                        {Object.values(checkedItems).filter(Boolean).length} / {analysisResult.recommendations.recommended_checklist_items.length} Siap
                      </span>
                      <button
                        onClick={handleCheckAllChecklist}
                        type="button"
                        className="text-[11px] text-rose-400 hover:underline font-semibold cursor-pointer"
                      >
                        Tandai Semua
                      </button>
                      {Object.values(checkedItems).filter(Boolean).length > 0 && (
                        <button
                          onClick={handleResetChecklist}
                          type="button"
                          className="text-[11px] text-neutral-400 hover:text-rose-400 underline font-medium cursor-pointer"
                          aria-label="Atur ulang checklist"
                        >
                          Atur Ulang
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {['all', 'dokumen', 'medis', 'logistik'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setChecklistFilter(cat)}
                        className={`px-3 py-1 rounded-xl font-bold capitalize transition-all ${
                          checklistFilter === cat
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                        }`}
                      >
                        {cat === 'all' ? 'Semua Item' : cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {analysisResult.recommendations.recommended_checklist_items
                      .filter((item) => checklistFilter === 'all' || item.category?.toLowerCase() === checklistFilter)
                      .map((item: GoBagChecklistItem) => {
                      const isChecked = Boolean(checkedItems[item.id]);

                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                            isChecked
                              ? 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                            isChecked
                              ? 'bg-rose-600 border-rose-500 text-white'
                              : 'border-neutral-700 bg-neutral-800'
                          }`}>
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {getCategoryIcon(item.category)}
                              <span className="text-xs font-bold text-white truncate">
                                {item.name}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-tight font-normal">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Status / Privacy Microcopy */}
                  {isAuthenticated ? (
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-rose-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Tersinkronisasi dengan Akun Anda ({user?.name}). Progres tersimpan aman di server.</span>
                      </div>
                      <Link to={PATHS.USER.PREPAREDNESS} className="font-bold text-rose-400 hover:underline flex items-center gap-1 shrink-0">
                        <span>Siaga Personal</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Privasi Terjamin: Status checklist tersimpan secara mandiri pada peramban perangkat Anda (localStorage).</span>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                        <span>Ingin menyimpan progres dan rencana siaga keluarga ke akun?</span>
                        <Link to={PATHS.PUBLIC.REGISTER} className="font-bold text-rose-400 hover:underline flex items-center gap-1">
                          <span>Daftar Akun Warga</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Scientific Disclaimer & Data Provenance */}
            <div className="p-4 rounded-2xl bg-[#121614] border border-neutral-800 space-y-2 text-xs text-neutral-400">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <span className="font-bold text-white">Integritas &amp; Sumber Data Analisis:</span>
                <span className="text-[11px] font-mono text-rose-400 font-bold">
                  {analysisResult.provenance.data_sources.join(' • ')}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">
                <span className="font-semibold text-neutral-200">Catatan Resmi: </span>
                {analysisResult.provenance.disclaimer}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: LINKAGE TO EDUCATION & OTHER MODULES                           */}
      {/* ========================================================================= */}
      <section aria-labelledby="other-modules-heading" className="pt-4 border-t border-neutral-800 space-y-4">
        <h3 id="other-modules-heading" className="text-sm font-bold text-white">
          Eksplorasi Modul Kesiapsiagaan Terkait
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to={PATHS.PUBLIC.MAP} className="block group">
            <div className="p-5 rounded-2xl bg-[#121614] border border-neutral-800 hover:border-rose-500/40 transition-all space-y-1.5 h-full">
              <span className="text-xs font-bold text-white group-hover:text-rose-300 flex items-center gap-1 transition-colors">
                <span>Peta Bencana Nasional</span>
                <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
              </span>
              <p className="text-xs text-neutral-400 font-normal">
                Pantau visualisasi sebaran spasial bencana gempa bumi, banjir, dan cuaca ekstrem secara langsung.
              </p>
            </div>
          </Link>

          <Link to={PATHS.PUBLIC.WARNINGS} className="block group">
            <div className="p-5 rounded-2xl bg-[#121614] border border-neutral-800 hover:border-rose-500/40 transition-all space-y-1.5 h-full">
              <span className="text-xs font-bold text-white group-hover:text-rose-300 flex items-center gap-1 transition-colors">
                <span>Pusat Peringatan Dini</span>
                <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
              </span>
              <p className="text-xs text-neutral-400 font-normal">
                Diseminasi peringatan darurat berstandar CAP dari BMKG dan otoritas penanggulangan bencana.
              </p>
            </div>
          </Link>

          <Link to={PATHS.PUBLIC.EDUCATION} className="block group">
            <div className="p-5 rounded-2xl bg-[#121614] border border-neutral-800 hover:border-rose-500/40 transition-all space-y-1.5 h-full">
              <span className="text-xs font-bold text-white group-hover:text-rose-300 flex items-center gap-1 transition-colors">
                <span>Pusat Literasi Edukasi</span>
                <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
              </span>
              <p className="text-xs text-neutral-400 font-normal">
                Panduan praktis mitigasi, SOP evakuasi saat sirene berbunyi, dan nomor kontak darurat nasional.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PublicPreparednessPage;
