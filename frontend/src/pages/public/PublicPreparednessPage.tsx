import React, { useState, useEffect, useCallback, useId } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { publicService } from '../../services/public-service';
import type { 
  RegionItem, 
  LocationCheckResult,
  GoBagChecklistItem
} from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { DisasterMap } from '../../components/map/DisasterMap';
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
  Sparkles,
  PhoneCall
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
        bgClass: 'bg-red-500',
        textClass: 'text-red-700',
        borderClass: 'border-red-200',
        bgLight: 'bg-red-50',
      };
    case 'high':
      return {
        badgeVariant: 'warning' as const,
        label: 'Siaga (Tinggi)',
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
        bgLight: 'bg-amber-50',
      };
    case 'medium':
      return {
        badgeVariant: 'warning' as const,
        label: 'Waspada (Sedang)',
        bgClass: 'bg-yellow-500',
        textClass: 'text-yellow-700',
        borderClass: 'border-yellow-200',
        bgLight: 'bg-yellow-50',
      };
    case 'insufficient_data':
      return {
        badgeVariant: 'warning' as const,
        label: 'Data Tidak Mencukupi',
        bgClass: 'bg-amber-400',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-300',
        bgLight: 'bg-amber-50/70',
      };
    case 'low':
    default:
      return {
        badgeVariant: 'success' as const,
        label: 'Normal (Rendah)',
        bgClass: 'bg-emerald-500',
        textClass: 'text-[#047857]',
        borderClass: 'border-[#A7F3D0]',
        bgLight: 'bg-[#ECFDF5]',
      };
  }
}

function getCategoryIcon(category: string) {
  switch (category?.toLowerCase()) {
    case 'dokumen':
      return <FileText className="w-4 h-4 text-[#0284C7]" />;
    case 'medis':
      return <HeartPulse className="w-4 h-4 text-[#DC2626]" />;
    case 'logistik':
      return <Package className="w-4 h-4 text-[#D97706]" />;
    default:
      return <CheckCircle2 className="w-4 h-4 text-[#047857]" />;
  }
}

export const PublicPreparednessPage: React.FC = () => {
  // Pilot Regions State
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [regionsLoading, setRegionsLoading] = useState<boolean>(true);

  // Form / Coordinates Selection State
  const [selectedRegionId, setSelectedRegionId] = useState<string>('1'); // Default to DKI Jakarta
  const [latitude, setLatitude] = useState<string>('-6.2088');
  const [longitude, setLongitude] = useState<string>('106.8456');
  const [coordError, setCoordError] = useState<string | null>(null);

  // Origin tracking to prevent users from assuming default DKI Jakarta is their detected GPS
  const [locationOrigin, setLocationOrigin] = useState<'preset_default' | 'preset_selected' | 'manual' | 'map_click' | 'gps'>('preset_default');

  // Geolocation Browser State
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Analysis State
  const [analysisResult, setAnalysisResult] = useState<LocationCheckResult | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Go-Bag Interactive Completed Checklist (Local storage persistence for privacy)
  const GOBAG_STORAGE_KEY = 'sentravax_gobag_checklist';
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(GOBAG_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync checklist changes to browser localStorage without transmitting any personal data
  useEffect(() => {
    try {
      localStorage.setItem(GOBAG_STORAGE_KEY, JSON.stringify(checkedItems));
    } catch {
      // Ignore if localStorage unavailable
    }
  }, [checkedItems]);

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

  // 1. Load Monitored Pilot Regions (Asynchronous mount with cancellation)
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

  // 2. Validate Coordinates
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

  // 3. Run Risk Assessment
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses penilaian risiko lokasi.';
      setAnalysisError(msg);
    } finally {
      setAnalyzing(false);
    }
  }, [latitude, longitude, selectedRegionId]);

  // Run initial assessment on mount once default coords are ready
  useEffect(() => {
    let isCancelled = false;

    publicService.checkLocation({
      latitude: -6.2088,
      longitude: 106.8456,
      region_id: 1,
    })
      .then((res) => {
        if (!isCancelled) {
          setAnalysisResult(res);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setAnalysisError(err instanceof Error ? err.message : 'Gagal memuat analisis awal.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle Region Selection from Presets
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    setSelectedRegionId(regId);
    setLocationOrigin('preset_selected');
    setGeoNotice(null);

    const found = regions.find(r => String(r.id) === regId);
    if (found?.center?.latitude && found?.center?.longitude) {
      const newLat = String(found.center.latitude);
      const newLon = String(found.center.longitude);
      setLatitude(newLat);
      setLongitude(newLon);
      setCoordError(null);
      runAssessment(found.center.latitude, found.center.longitude, found.id);
    }
  };

  // Handle Map Click (Interactive Pin Drop)
  const handleMapClick = (clickLat: number, clickLon: number) => {
    setLatitude(String(clickLat));
    setLongitude(String(clickLon));
    setSelectedRegionId(''); // Clear predefined preset as user chose a custom point
    setLocationOrigin('map_click');
    setGeoNotice('Titik lokasi diperbarui melalui interaksi peta.');
    validateCoords(String(clickLat), String(clickLon));
    runAssessment(clickLat, clickLon, undefined);
  };

  // Handle Browser Geolocation (Explicit user request)
  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Browser Anda tidak mendukung layanan geolokasi GPS.');
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

  // Toggle Checklist Checkmark
  const toggleChecklistItem = (id: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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
    <div className="space-y-10 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 0. 1-CLICK EMERGENCY HOTLINE SPEED-DIAL BAR */}
      <section aria-label="Kontak Darurat Cepat" className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
              <PhoneCall className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#111827] block">Panggilan Darurat Siaga (1-Klik):</span>
              <span className="text-[11px] text-[#6B7280]">Bebas pulsa nasional 24/7 untuk tanggap darurat</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { name: 'BNPB', number: '117' },
              { name: 'Basarnas', number: '115' },
              { name: 'Ambulans', number: '119' },
              { name: 'Damkar', number: '113' },
              { name: 'Polisi', number: '110' },
            ].map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-800 transition-colors"
              >
                <span className="text-red-600 font-mono font-extrabold">{h.number}</span>
                <span className="text-[11px] text-neutral-600">{h.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 1: HERO & SCOPE TRANSPARENCY                                     */}
      {/* ========================================================================= */}
      <section aria-labelledby="siaga-hero-heading" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge variant="success" size="sm">SIAGA MANDIRI</Badge>
              <Badge variant="neutral" size="sm">POSTGIS DETERMINISTIK</Badge>
              <span className="text-xs font-mono text-neutral-500">Cakupan: DKI Jakarta, Jabar, Banten & Nasional</span>
            </div>
            <h1 id="siaga-hero-heading" className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              SIAGA PERSONAL: Cek Risiko &amp; Mitigasi Lokasi
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to={PATHS.PUBLIC.EDUCATION}>
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Panduan Edukasi
              </Button>
            </Link>
            <Link to={`${PATHS.PUBLIC.MAP}?layer=shelters`}>
              <Button variant="primary" size="sm">
                Peta Shelter Terverifikasi
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: LOCATION SELECTOR & INTERACTIVE MAP CONTROLS                   */}
      {/* ========================================================================= */}
      <section aria-labelledby="location-selector-heading" className="space-y-6">
        <Card padding="lg" className="border-[#D1D5DB] shadow-xs">
          <div className="space-y-6">
            <div>
              <h2 id="location-selector-heading" className="text-base sm:text-lg font-bold text-[#111827] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#047857]" />
                Pilih Lokasi untuk Dianalisis
              </h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Pilih salah satu wilayah pilot terpantau, klik langsung pada peta interaktif di bawah, atau gunakan koordinat perangkat Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Presets: Monitored Pilot Regions Dropdown */}
              <div className="md:col-span-5 space-y-1.5">
                <label htmlFor={regionSelectId} className="block text-xs font-bold text-[#111827]">
                  Pilih Wilayah Pilot Terpantau
                </label>
                <div className="relative">
                  <select
                    id={regionSelectId}
                    value={selectedRegionId}
                    onChange={handleRegionChange}
                    disabled={regionsLoading || analyzing}
                    aria-label="Pilih wilayah pilot terpantau"
                    className="w-full rounded-xl text-xs sm:text-sm px-3.5 py-2.5 transition-all outline-none border font-normal appearance-none cursor-pointer pr-10 bg-white text-[#111827] border-[#D1D5DB] focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 disabled:opacity-50"
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
                  <label htmlFor={latInputId} className="block text-xs font-bold text-[#111827]">
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
                    className="w-full rounded-xl text-xs sm:text-sm px-3 py-2 border border-[#D1D5DB] focus:border-[#047857] focus:ring-1 focus:ring-[#047857] outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={lonInputId} className="block text-xs font-bold text-[#111827]">
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
                    className="w-full rounded-xl text-xs sm:text-sm px-3 py-2 border border-[#D1D5DB] focus:border-[#047857] focus:ring-1 focus:ring-[#047857] outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons: Geolocation & Trigger Analysis */}
              <div className="md:col-span-3 flex flex-col sm:flex-row md:flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestGeolocation}
                  disabled={geoLoading || analyzing}
                  leftIcon={<Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />}
                  className="w-full justify-center"
                >
                  {geoLoading ? 'Mendeteksi...' : 'Lokasi GPS Saya'}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (validateCoords(latitude, longitude)) {
                      runAssessment();
                    }
                  }}
                  disabled={analyzing || !!coordError}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                  className="w-full justify-center"
                >
                  {analyzing ? 'Menganalisis...' : 'Analisis Risiko'}
                </Button>
              </div>
            </div>

            {/* Error or Notice Callout */}
            {coordError && (
              <p className="text-xs text-[#DC2626] flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{coordError}</span>
              </p>
            )}

            {geoNotice && (
              <p className="text-xs text-[#4B5563] flex items-center gap-1.5 bg-[#F9FAFB] p-2.5 rounded-xl border border-[#E5E7EB]">
                <Crosshair className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                <span>{geoNotice}</span>
              </p>
            )}

            {/* Informative Banner for Default Location Preset */}
            {locationOrigin === 'preset_default' && (
              <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-start gap-2.5 text-xs text-[#1E40AF] leading-relaxed">
                <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Preset Lokasi Contoh Awal: </span>
                  Data yang tampil pertama kali adalah contoh untuk wilayah percontohan DKI Jakarta. Ini <strong>BUKAN</strong> deteksi GPS otomatis perangkat Anda. Silakan pilih wilayah pilot, klik langsung pada peta interaktif, atau gunakan tombol <strong>"Lokasi GPS Saya"</strong> untuk memeriksa wilayah Anda.
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Embedded Interactive Map for Visual Spatial Context */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-semibold text-[#111827] flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-[#047857]" />
              Klik pada peta untuk memindahkan titik analisis koordinat secara interaktif:
            </span>
            <span className="font-mono text-[11px] text-[#047857]">
              Pin Terpilih: [{parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}]
            </span>
          </div>

          <Card padding="none" className="overflow-hidden border-[#D1D5DB]">
            <DisasterMap
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
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: ASSESSMENT RESULTS PRESENTATION                                */}
      {/* ========================================================================= */}
      <section aria-labelledby="assessment-result-heading" className="space-y-6 pt-4 border-t border-[#E5E7EB]">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#047857] font-bold">
            Hasil Evaluasi Risiko
          </span>
          <h2 id="assessment-result-heading" className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
            Indeks Kerentanan &amp; Profil Ancaman Lokasi
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Penilaian deterministik menggabungkan jarak radius 25 km terhadap kejadian bencana aktif, peringatan darurat CAP, dan kerentanan baseline wilayah.
          </p>
        </div>

        {analyzing ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton variant="card" count={3} />
          </div>
        ) : analysisError ? (
          <div className="p-8 rounded-2xl bg-white border border-[#E5E7EB] text-center space-y-4 shadow-xs">
            <AlertTriangle className="w-10 h-10 text-[#D97706] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111827]">Gagal Memproses Analisis Risiko</h3>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto">{analysisError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => runAssessment()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Coba Ulang Analisis
            </Button>
          </div>
        ) : analysisResult ? (
          <div className="space-y-6">
            {/* Out-of-Coverage Informational Banner */}
            {analysisResult.provenance.is_pilot_coverage === false && (
              <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3 text-xs text-[#92400E] leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Perhatian Cakupan Wilayah Pilot: </span>
                  Titik koordinat yang Anda pilih berada di luar radius asosiasi wilayah pilot (DKI Jakarta, Jawa Barat, Banten). 
                  Status "Data Tidak Mencukupi" mencerminkan bahwa koordinat berada di luar radius asosiasi 45 km dari titik acuan regional pilot, bukan jaminan bahwa wilayah tersebut bebas dari ancaman bencana alam. Tetap ikuti arahan resmi posko BMKG dan BPBD setempat.
                </div>
              </div>
            )}

            {/* Top Cards: Score Gauge & Location Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Score Meter Card */}
              <div className="lg:col-span-5">
                <Card padding="lg" className={`h-full border ${riskConfig.borderClass} ${riskConfig.bgLight}/40 space-y-5 flex flex-col justify-between`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#4B5563] uppercase">
                        Indeks Risiko Lokasi
                      </span>
                      <Badge variant={riskConfig.badgeVariant} size="sm">
                        {riskConfig.label}
                      </Badge>
                    </div>

                    <div className="flex items-baseline gap-2">
                      {isInsufficientData ? (
                        <>
                          <span className="text-3xl sm:text-4xl font-extrabold text-amber-800 tracking-tight">
                            DATA TERBATAS
                          </span>
                          <span className="text-xs font-semibold text-[#6B7280]">
                            ({riskScore} pt baseline)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight">
                            {riskScore}
                          </span>
                          <span className="text-sm font-semibold text-[#6B7280]">/ 100</span>
                        </>
                      )}
                    </div>

                    {/* Visual Risk Scale Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="h-3 w-full bg-neutral-200 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full transition-all duration-700 ${riskConfig.bgClass}`}
                          style={{ width: isInsufficientData ? '18%' : `${Math.min(100, Math.max(5, riskScore))}%` }}
                          role="progressbar"
                          aria-valuenow={riskScore}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#6B7280] font-mono">
                        <span>0 Normal</span>
                        <span>25 Waspada</span>
                        <span>50 Siaga</span>
                        <span>75 Awas</span>
                        <span>100</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#4B5563] leading-relaxed pt-2">
                      {analysisResult.assessment.risk_label || 'Indeks risiko dihitung berdasarkan kedekatan peristiwa aktif dan kerentanan lokal.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>Waktu Analisis:</span>
                    <span className="font-semibold text-[#111827]">
                      {formatDate(analysisResult.assessment.assessed_at)}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Location & Data Summary Card */}
              <div className="lg:col-span-7">
                <Card padding="lg" className="h-full border-[#E5E7EB] space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
                      <div>
                        <span className="text-[11px] font-mono uppercase text-[#047857] font-bold">
                          Wilayah Asosiasi Pilot
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <h3 className="text-lg font-extrabold text-[#111827]">
                            {analysisResult.location.region?.name || 'Di Luar Radius Asosiasi Pilot'}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                            {locationOrigin === 'preset_default' && 'Preset Contoh Awal'}
                            {locationOrigin === 'preset_selected' && 'Wilayah Terpilih'}
                            {locationOrigin === 'manual' && 'Input Manual'}
                            {locationOrigin === 'map_click' && 'Dipilih dari Peta'}
                            {locationOrigin === 'gps' && 'Sensor GPS'}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-[#6B7280] mt-0.5">
                          Radius asosiasi pilot &le; 45 km dari titik acuan regional (poligon batas administratif belum aktif).
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#6B7280] block font-mono">Kode</span>
                        <span className="text-xs font-mono font-bold text-[#111827]">
                          {analysisResult.location.region?.code || 'NON-PILOT'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                        <span className="text-[11px] text-[#6B7280] block">Koordinat Lat / Lon</span>
                        <span className="text-xs font-mono font-bold text-[#111827]">
                          {analysisResult.location.latitude.toFixed(4)}, {analysisResult.location.longitude.toFixed(4)}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                        <span className="text-[11px] text-[#6B7280] block">Ancaman Aktif 25km</span>
                        <span className="text-xs font-bold text-[#C2410C]">
                          {analysisResult.assessment.active_threats_count ?? 0} Kejadian
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] col-span-2 sm:col-span-1">
                        <span className="text-[11px] text-[#6B7280] block">Peringatan CAP</span>
                        <span className="text-xs font-bold text-[#D97706]">
                          {analysisResult.assessment.active_alerts_count ?? 0} Peringatan
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#4B5563]">
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-[#047857]" />
                        <span>Status Telemetri Spasial: </span>
                        <Badge variant={isInsufficientData ? 'warning' : 'success'} size="sm">
                          {isInsufficientData ? 'DI LUAR CAKUPAN PILOT' : (analysisResult.assessment.data_freshness || 'TERHUBUNG')}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#6B7280] leading-relaxed">
                        Evaluasi spasial dieksekusi secara instan dengan mesin PostGIS deterministik tanpa perkiraan spekulatif.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>Metodologi:</span>
                    <span className="font-mono text-[#047857] font-semibold">
                      v1.0-deterministic-spatial
                    </span>
                  </div>
                </Card>
              </div>
            </div>

            {/* Middle Section: Active Threats Breakdown & Factors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Threats Breakdown */}
              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-2.5">
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#C2410C]" />
                    Ancaman Aktif dalam Radius 25 KM
                  </h3>
                  <span className="text-xs font-bold text-[#6B7280]">
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
                      <div key={t.id} className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-[#111827]">
                              {t.hazard_type}
                            </span>
                            <Badge 
                              variant={t.provenance_status === 'LIVE' ? 'success' : 'neutral'} 
                              size="sm"
                            >
                              {t.provenance_label || (t.provenance_status === 'LIVE' ? (t.hazard_slug === 'earthquake' ? 'LIVE (BMKG TEWS)' : 'LIVE (TELEMETRI)') : 'STATIC (TERKURASI)')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={t.severity === 'high' ? 'danger' : 'warning'} size="sm">
                              Tingkat {t.severity}
                            </Badge>
                            <span className="text-[10px] font-mono text-[#C2410C] font-bold">
                              +{t.contribution} pt
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[#4B5563] leading-snug">
                          {t.title}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10.5px] text-[#6B7280] pt-1 border-t border-[#F3F4F6]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#9CA3AF]" />
                            {formatDate(t.occurred_at)}
                          </span>
                          <span className="text-[#4B5563]">
                            Sumber: <span className="font-semibold text-[#111827]">{t.source_name || 'SENTRAVAX Local Baseline'}</span>
                          </span>
                          <Link to={`${PATHS.PUBLIC.MAP}?eventId=${t.id}`} className="font-bold text-[#047857] hover:underline flex items-center gap-0.5">
                            Fokus Peta <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Contributing Risk Factors Breakdown */}
              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-2.5">
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#047857]" />
                    Faktor Komponen Pembentuk Risiko
                  </h3>
                  <span className="text-xs text-[#6B7280]">Bobot Analisis</span>
                </div>

                <div className="space-y-3">
                  {/* Baseline Factor */}
                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111827]">Kerentanan Dasar Tropis (Baseline)</span>
                      <span className="font-mono text-[#047857] font-bold">
                        +{Number((analysisResult.assessment.factors?.baseline_vulnerability as { contribution?: number })?.contribution ?? 15).toFixed(1)} pt (Bobot 15%)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280]">
                      Kerentanan geografis dasar kawasan kepulauan tropis Nusantara terhadap dinamika cuaca dan seismik.
                    </p>
                  </div>

                  {/* Nearby Events Factor */}
                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111827]">Kedekatan Kejadian Aktif (Proximity &amp; Recency)</span>
                      <span className="font-mono text-[#C2410C] font-bold">
                        +{Number((analysisResult.assessment.factors?.nearby_active_events as { contribution?: number })?.contribution || 0).toFixed(1)} pt (Bobot 45%)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280]">
                      Dihitung berdasarkan tingkat keparahan bencana dalam radius 25 km dengan peluruhan waktu (semakin baru semakin tinggi).
                    </p>
                  </div>

                  {/* Official Alerts Factor */}
                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111827]">Peringatan Dini Resmi Otoritas (CAP Alerts)</span>
                      <span className="font-mono text-[#D97706] font-bold">
                        +{Number((analysisResult.assessment.factors?.official_alerts as { contribution?: number })?.contribution || 0).toFixed(1)} pt (Bobot 30%)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280]">
                      Status siaga darurat resmi aktif yang diterbitkan BMKG / BPBD pada wilayah administratif terkait.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] font-mono text-[#4B5563] flex items-center justify-between">
                  <span>Total Rekonsiliasi:</span>
                  <span className="font-bold text-[#111827]">
                    {(
                      Number((analysisResult.assessment.factors?.baseline_vulnerability as { contribution?: number })?.contribution ?? 15) +
                      Number((analysisResult.assessment.factors?.nearby_active_events as { contribution?: number })?.contribution ?? 0) +
                      Number((analysisResult.assessment.factors?.official_alerts as { contribution?: number })?.contribution ?? 0)
                    ).toFixed(1)} pt &rarr; Skor: {riskScore}
                  </span>
                </div>
              </Card>
            </div>

            {/* Bottom Section: Preparedness Action Steps & Go-Bag Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Action Steps */}
              <div className="lg:col-span-5">
                <Card padding="md" className="h-full space-y-4">
                  <div className="border-b border-[#F3F4F6] pb-2.5">
                    <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#047857]" />
                      Rekomendasi Kesiapsiagaan Mandiri Keluarga
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Saran tindakan kesiapsiagaan internal sistem berbasis tingkat risiko. Untuk instruksi kedaruratan atau evakuasi resmi, selalu ikuti arahan dari BPBD dan BMKG.
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#374151]">
                    {analysisResult.recommendations.action_steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                        <span className="w-5 h-5 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    <Link to={PATHS.PUBLIC.EDUCATION}>
                      <Button variant="outline" size="sm" className="w-full justify-center" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Buka Panduan Edukasi Lengkap
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>

              {/* Interactive Go-Bag Checklist */}
              <div className="lg:col-span-7">
                <Card padding="md" className="h-full space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#047857]" />
                        Checklist Tas Siaga Bencana (Standar 13 Item BNPB)
                      </h3>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Centang perlengkapan yang sudah Anda siapkan di rumah secara mandiri.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span data-testid="gobag-count" className="text-xs font-mono font-bold text-[#047857]">
                        {Object.values(checkedItems).filter(Boolean).length} / {analysisResult.recommendations.recommended_checklist_items.length} Siap
                      </span>
                      <button
                        onClick={handleCheckAllChecklist}
                        type="button"
                        className="text-[11px] text-[#047857] hover:underline font-semibold cursor-pointer"
                      >
                        Tandai Semua
                      </button>
                      {Object.values(checkedItems).filter(Boolean).length > 0 && (
                        <button
                          onClick={handleResetChecklist}
                          type="button"
                          className="text-[11px] text-[#6B7280] hover:text-[#DC2626] underline font-medium cursor-pointer"
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
                        className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                          checklistFilter === cat
                            ? 'bg-[#047857] text-white shadow-xs'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
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
                          className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                            isChecked
                              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                              : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                            isChecked
                              ? 'bg-[#047857] border-[#047857] text-white'
                              : 'border-[#D1D5DB] bg-white'
                          }`}>
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {getCategoryIcon(item.category)}
                              <span className="text-xs font-bold text-[#111827] truncate">
                                {item.name}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-[#6B7280] line-clamp-2 leading-tight">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Privacy Microcopy */}
                  <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-[11px] text-[#065F46] flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                    <span>Privasi Terjamin: Status checklist tersimpan secara mandiri pada peramban perangkat Anda (localStorage) dan tidak pernah dikirim ke server.</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] text-[#6B7280] flex items-center justify-between">
                    <span>Ingin menyimpan rencana siaga keluarga secara permanen?</span>
                    <Link to={PATHS.PUBLIC.REGISTER} className="font-bold text-[#047857] hover:underline flex items-center gap-1">
                      Daftar Akun Warga <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              </div>
            </div>

            {/* Scientific Disclaimer & Data Provenance */}
            <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2 text-xs text-[#4B5563]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                <span className="font-bold text-[#111827]">Integritas &amp; Sumber Data Analisis:</span>
                <span className="text-[11px] font-mono text-[#047857]">
                  {analysisResult.provenance.data_sources.join(' • ')}
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-relaxed">
                <span className="font-semibold text-[#111827]">Catatan Resmi: </span>
                {analysisResult.provenance.disclaimer}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: LINKAGE TO EDUCATION & OTHER MODULES                           */}
      {/* ========================================================================= */}
      <section aria-labelledby="other-modules-heading" className="pt-4 border-t border-[#E5E7EB] space-y-4">
        <h3 id="other-modules-heading" className="text-sm font-bold text-[#111827]">
          Eksplorasi Modul Kesiapsiagaan Terkait
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to={PATHS.PUBLIC.MAP} className="block group">
            <Card interactive padding="md" className="space-y-1.5 h-full">
              <span className="text-xs font-bold text-[#111827] group-hover:text-[#047857] flex items-center gap-1">
                Peta Bencana Nasional <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs text-[#6B7280]">
                Pantau visualisasi sebaran spasial bencana gempa bumi, banjir, dan cuaca ekstrem secara langsung.
              </p>
            </Card>
          </Link>

          <Link to={PATHS.PUBLIC.WARNINGS} className="block group">
            <Card interactive padding="md" className="space-y-1.5 h-full">
              <span className="text-xs font-bold text-[#111827] group-hover:text-[#047857] flex items-center gap-1">
                Pusat Peringatan Dini <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs text-[#6B7280]">
                Diseminasi peringatan darurat berstandar CAP dari BMKG dan otoritas penanggulangan bencana.
              </p>
            </Card>
          </Link>

          <Link to={PATHS.PUBLIC.EDUCATION} className="block group">
            <Card interactive padding="md" className="space-y-1.5 h-full">
              <span className="text-xs font-bold text-[#111827] group-hover:text-[#047857] flex items-center gap-1">
                Pusat Literasi Edukasi <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs text-[#6B7280]">
                Panduan praktis mitigasi, SOP evakuasi saat sirene berbunyi, dan nomor kontak darurat nasional.
              </p>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PublicPreparednessPage;
