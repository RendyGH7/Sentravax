import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { intelligenceService } from '../../services/intelligence-service';
import type {
  RiskAssessmentItem,
  CalculationFactors,
  ThreatFactorItem,
  AlertFactorItem,
} from '../../types/intelligence';
import type { RegionItem, HazardTypeItem } from '../../types';
import { 
  ActivitySquare, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Search,
  RefreshCw,
  Compass,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const IntelligenceRiskAnalysisPage: React.FC = () => {
  // Master data
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessmentItem[]>([]);

  // Workspace interaction state
  const [selectedRegionId, setSelectedRegionId] = useState<number | ''>('');
  const [selectedHazardId, setSelectedHazardId] = useState<number | ''>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [activeAssessment, setActiveAssessment] = useState<RiskAssessmentItem | null>(null);

  // Status & loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  // Regional comparison filter
  const [comparisonHazardFilter, setComparisonHazardFilter] = useState<string>('all');
  const [searchRegionQuery, setSearchRegionQuery] = useState<string>('');
  const [expandedThreats, setExpandedThreats] = useState<boolean>(true);
  const [expandedAlerts, setExpandedAlerts] = useState<boolean>(true);

  // Initial data loading
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [regionsRes, hazardsRes, assessmentsRes] = await Promise.all([
          intelligenceService.getRegions().catch(() => [] as RegionItem[]),
          intelligenceService.getHazardTypes().catch(() => [] as HazardTypeItem[]),
          intelligenceService.getRiskAssessments().catch(() => [] as RiskAssessmentItem[]),
        ]);

        if (!isMounted) return;

        setRegions(regionsRes);
        setHazardTypes(hazardsRes);
        setAssessments(assessmentsRes);

        // Preselect first region and hazard if available
        setSelectedRegionId((prev) => (prev === '' && regionsRes.length > 0 ? regionsRes[0].id : prev));
        setSelectedHazardId((prev) => (prev === '' && hazardsRes.length > 0 ? hazardsRes[0].id : prev));

        // Set active assessment from latest history
        if (assessmentsRes.length > 0) {
          setActiveAssessment(assessmentsRes[0]);
        }

        setError(null);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          const msg = (err.response?.data as { message?: string })?.message;
          setError({
            status,
            message: msg || 'Gagal memuat basis data intelijen multi-hazard.',
          });
        } else {
          setError({
            message: 'Terjadi kesalahan sistem saat memuat workspace analisis risiko.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle risk evaluation execution
  const handleExecuteEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRegionId || !selectedHazardId) {
      toast.error('Silakan tentukan wilayah administratif dan jenis bahaya terlebih dahulu.');
      return;
    }

    setIsEvaluating(true);
    try {
      const result = await intelligenceService.evaluateRisk({
        region_id: Number(selectedRegionId),
        hazard_type_id: Number(selectedHazardId),
        title: customTitle.trim() ? customTitle.trim() : null,
      });

      setActiveAssessment(result);
      toast.success('Evaluasi risiko multi-hazard berhasil dihitung oleh Risk Engine.');

      // Refresh assessments list to reflect latest update
      const updatedList = await intelligenceService.getRiskAssessments();
      setAssessments(updatedList);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message;
        toast.error(msg || 'Evaluasi risiko gagal dijalankan oleh Risk Engine backend.');
      } else {
        toast.error('Terjadi kesalahan jaringan saat mengevaluasi risiko.');
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  // Helper to format timestamps
  const formatTimestamp = (iso?: string | null): string => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return iso;
    }
  };

  // Render risk level badge
  const renderRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-500/50">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Awas (Risiko Sangat Tinggi)
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-500/50">
            <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
            Siaga (Risiko Tinggi)
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-[#212121] text-amber-200 border border-amber-400/40">
            <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
            Waspada (Perlu Perhatian)
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            Normal (Risiko Rendah)
          </span>
        );
      case 'insufficient_data':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-[#212121] text-[#A3A3A3] border border-[#383838]">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Data Tidak Mencukupi
          </span>
        );
    }
  };

  // Helper for data freshness badge
  const renderFreshnessBadge = (state?: string) => {
    switch (state) {
      case 'FRESH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/80 text-[#10B981] border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            FRESH
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-950/70 text-[#F59E0B] border border-amber-500/40">
            STALE
          </span>
        );
      case 'UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-950/70 text-rose-400 border border-rose-500/40">
            UNAVAILABLE
          </span>
        );
    }
  };

  // Filtered comparison assessments
  const filteredAssessments = assessments.filter((item) => {
    const matchesHazard =
      comparisonHazardFilter === 'all' || item.hazard_type?.slug === comparisonHazardFilter;
    const matchesRegion =
      !searchRegionQuery.trim() ||
      (item.region?.name || '').toLowerCase().includes(searchRegionQuery.toLowerCase()) ||
      (item.title || '').toLowerCase().includes(searchRegionQuery.toLowerCase());
    return matchesHazard && matchesRegion;
  });

  // Calculation factors parsed safely
  const factors: CalculationFactors | null = activeAssessment?.calculation_factors ?? null;
  const baselineFactor = factors?.baseline_vulnerability;
  const eventsFactor = factors?.nearby_active_events;
  const alertsFactor = factors?.official_alerts;
  const dataQuality = factors?.data_quality;

  // ==========================================
  // RENDER: LOADING SKELETON
  // ==========================================
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat workspace analisis risiko...">
        <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] h-28"></div>
        <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] h-48"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] h-96"></div>
          <div className="lg:col-span-4 p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* ==========================================
          1. HEADER CONTEXT BANNER
          ========================================== */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-mono uppercase text-[#F59E0B] font-bold tracking-wide">
              MESIN ANALISIS RISIKO MULTI-HAZARD
            </span>
            <span className="text-[#8A8A8A] font-mono">| PostGIS Geography (Pencarian 25 km | Asosiasi Pilot 45 km)</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#212121] text-[#D4D4D4] border border-[#2C2C2C]">
              v1.0-deterministic-spatial
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
            Workspace Komputasi & Evaluasi Risiko Geospasial
          </h1>
          <p className="text-xs sm:text-sm text-[#D4D4D4] max-w-3xl">
            Hitung skor risiko multi-hazard deterministik secara transparan berdasarkan agregasi kerentanan geografis dasar, ancaman kejadian aktif, dan peringatan resmi terkini.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              try {
                const updatedList = await intelligenceService.getRiskAssessments();
                setAssessments(updatedList);
                if (updatedList.length > 0) setActiveAssessment(updatedList[0]);
                toast.success('Data penilaian risiko regional terkini berhasil disegarkan.');
              } finally {
                setIsLoading(false);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2B2B2B] text-[#D4D4D4] hover:text-[#FFFFFF] border border-[#2C2C2C] text-xs font-semibold transition-colors"
            aria-label="Segarkan data penilaian risiko regional terkini"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error.message}</span>
          </div>
        </div>
      )}

      {/* ==========================================
          2. EVALUATION CONTROL CONSOLE (CARD)
          ========================================== */}
      <form onSubmit={handleExecuteEvaluation} className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#2C2C2C] pb-3">
          <div className="flex items-center gap-2">
            <ActivitySquare className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="text-base font-bold text-[#FFFFFF]">Konsol Evaluasi Risiko Regional</h2>
          </div>
          <span className="text-[11px] font-mono text-[#8A8A8A]">
            Metode: Deterministik Terbuka (PostGIS Geodesik)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Region Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="risk-region" className="block text-xs font-semibold text-[#D4D4D4]">
              Wilayah Administratif Pilot <span className="text-rose-400">*</span>
            </label>
            <select
              id="risk-region"
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#212121] border border-[#383838] text-xs text-[#FFFFFF] focus:outline-hidden focus:border-[#F59E0B] transition-colors"
              required
            >
              <option value="" disabled>Pilih wilayah acuan...</option>
              {regions.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} ({reg.code}) — Tk. {reg.level}
                </option>
              ))}
            </select>
          </div>

          {/* Hazard Type Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="risk-hazard" className="block text-xs font-semibold text-[#D4D4D4]">
              Jenis Bahaya Utama <span className="text-rose-400">*</span>
            </label>
            <select
              id="risk-hazard"
              value={selectedHazardId}
              onChange={(e) => setSelectedHazardId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#212121] border border-[#383838] text-xs text-[#FFFFFF] focus:outline-hidden focus:border-[#F59E0B] transition-colors"
              required
            >
              <option value="" disabled>Pilih jenis bahaya...</option>
              {hazardTypes.map((ht) => (
                <option key={ht.id} value={ht.id}>
                  {ht.name}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Title input */}
          <div className="space-y-1.5">
            <label htmlFor="risk-title" className="block text-xs font-semibold text-[#D4D4D4]">
              Judul Sesi Penilaian (Opsional)
            </label>
            <input
              id="risk-title"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Contoh: Evaluasi Kesiapsiagaan Ciliwung"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#212121] border border-[#383838] text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-hidden focus:border-[#F59E0B] transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-[#8A8A8A] leading-relaxed">
            Evaluasi mengalkulasi ancaman dalam radius pencarian geospasial 25 km dari titik acuan regional terpilih, status peringatan aktif, serta kerentanan dasar.
          </p>

          <button
            type="submit"
            disabled={isEvaluating || !selectedRegionId || !selectedHazardId}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-[#383838] disabled:text-[#888888] text-[#0C0C0C] text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {isEvaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menghitung di Risk Engine...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-[#0C0C0C]" />
                <span>Jalankan Evaluasi Risiko</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ==========================================
          3. ACTIVE ASSESSMENT RESULTS SHOWCASE
          ========================================== */}
      {activeAssessment ? (
        <div className="space-y-6">
          {/* Hero Risk Score & Integrity Overview */}
          <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2C2C2C] pb-5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#212121] text-[#F59E0B] border border-amber-500/30 font-bold">
                    HASIL EVALUASI AKTIF
                  </span>
                  <span className="text-xs text-[#D4D4D4] font-medium">
                    {activeAssessment.region?.name} — {activeAssessment.hazard_type?.name}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#FFFFFF]">
                  {activeAssessment.title || 'Penilaian Risiko Wilayah Terkini'}
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                {renderRiskLevelBadge(activeAssessment.risk_level)}
              </div>
            </div>

            {/* Score and Parameter Telemetry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Large Score Card */}
              <div className="p-5 rounded-2xl bg-[#212121] border border-[#2C2C2C] space-y-2">
                <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold">Skor Risiko Terhitung</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-[#FFFFFF] font-mono">
                    {Number(activeAssessment.risk_score).toFixed(1)}
                  </span>
                  <span className="text-sm font-mono text-[#8A8A8A]">/ 100</span>
                </div>
                {activeAssessment.risk_level === 'insufficient_data' ? (
                  <p className="text-[11px] text-amber-400 font-medium">
                    ⚠️ Status data belum mencukupi untuk penetapan level risiko definitif.
                  </p>
                ) : (
                  <p className="text-[11px] text-[#A3A3A3]">
                    Skor deterministik berbasis agregasi faktor PostGIS.
                  </p>
                )}
              </div>

              {/* Data Quality & Freshness */}
              <div className="p-5 rounded-2xl bg-[#212121] border border-[#2C2C2C] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono uppercase text-[#8A8A8A]">
                  <span>Kesegaran Data</span>
                  {renderFreshnessBadge(dataQuality?.status)}
                </div>
                <div className="text-sm font-bold text-[#FFFFFF] leading-snug">
                  {dataQuality?.status === 'FRESH'
                    ? 'Telemetri Mutakhir'
                    : dataQuality?.status === 'STALE'
                    ? 'Sinkronisasi Tertunda (>60 mnt)'
                    : 'Data Tidak Mencukupi'}
                </div>
                <p className="text-[11px] text-[#8A8A8A] line-clamp-2">
                  {dataQuality?.description || 'Status telemetri pemantauan.'}
                </p>
              </div>

              {/* Direct Impact Buffer (Default Parameter) */}
              <div className="p-5 rounded-2xl bg-[#212121] border border-[#2C2C2C] space-y-2">
                <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold">Radius Zona Dampak Langsung (Default Buffer)</span>
                <div className="text-2xl font-bold text-[#FFFFFF] font-mono">
                  {activeAssessment.impact_radius_meters?.toLocaleString('id-ID')} m
                </div>
                <p className="text-[11px] text-[#A3A3A3]">
                  Parameter buffer estimasi default sistem (2.000 m), bukan hasil pengukuran poligon insiden aktual real-time.
                </p>
              </div>

              {/* Affected Population (Baseline Regional Estimate) */}
              <div className="p-5 rounded-2xl bg-[#212121] border border-[#2C2C2C] space-y-2">
                <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold">Estimasi Populasi (Baseline Regional)</span>
                <div className="text-2xl font-bold text-[#FFFFFF] font-mono">
                  {activeAssessment.affected_population_estimate?.toLocaleString('id-ID')} Jiwa
                </div>
                <p className="text-[11px] text-[#A3A3A3]">
                  Estimasi agregat demografi regional default/baseline, bukan hasil sensus atau survei spasial presisi real-time.
                </p>
              </div>
            </div>

            {/* Risk Score Integrity Transparency Box */}
            <div className="p-4 rounded-xl bg-[#212121]/60 border border-[#2C2C2C] flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-[#FFFFFF] block">Integritas Skor & Penjelasan Metodologi:</span>
                <p className="text-[#D4D4D4] leading-relaxed">
                  Skor risiko {Number(activeAssessment.risk_score).toFixed(1)} merupakan skor komposit multi-kriteria yang dihasilkan secara deterministik oleh Risk Engine ({activeAssessment.methodology_version || 'v1.0-deterministic-spatial'}). Nilai ini <strong>bukan probabilitas persentase bencana</strong> dan <strong>bukan akurasi prediksi waktu</strong>. Jika kesegaran data berstatus UNAVAILABLE, sistem menetapkan tingkat risiko sebagai <em>Data Tidak Mencukupi</em> untuk mencegah kesimpulan yang menyesatkan.
                </p>
                <div className="text-[11px] font-mono text-[#8A8A8A] pt-1">
                  Waktu Komputasi: {formatTimestamp(activeAssessment.assessed_at)}
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              4. CALCULATION FACTOR TRANSPARENCY (STAGE 3)
              ========================================== */}
          <div className="space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2C2C2C] pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-base font-bold text-[#FFFFFF]">Transparansi Faktor Perhitungan Matematis</h3>
              </div>
              <span className="text-xs font-mono text-[#8A8A8A]">
                Formula: S_total = S_baseline + S_events + S_alerts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Baseline Vulnerability */}
              <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-3">
                <div className="flex items-center justify-between border-b border-[#2C2C2C] pb-2">
                  <span className="text-xs font-mono uppercase text-[#F59E0B] font-bold">1. Kerentanan Dasar</span>
                  <span className="text-xs font-mono text-[#FFFFFF] font-bold">Bobot: 15%</span>
                </div>
                <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">
                  {baselineFactor ? Number(baselineFactor.contribution).toFixed(1) : '15.0'}
                  <span className="text-xs font-normal text-[#8A8A8A] ml-1">/ 15.0</span>
                </div>
                <p className="text-xs text-[#D4D4D4] leading-relaxed">
                  {baselineFactor?.description || 'Kerentanan geografis dasar kawasan tropis Nusantara.'}
                </p>
                <div className="text-[11px] font-mono text-[#8A8A8A] border-t border-[#212121] pt-2">
                  Status: <strong className="text-[#10B981]">KONSTAN TERVERIFIKASI</strong>
                </div>
              </div>

              {/* 2. Nearby Active Events */}
              <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-3">
                <div className="flex items-center justify-between border-b border-[#2C2C2C] pb-2">
                  <span className="text-xs font-mono uppercase text-[#F59E0B] font-bold">2. Ancaman Bencana Sekitar</span>
                  <span className="text-xs font-mono text-[#FFFFFF] font-bold">Bobot: 45%</span>
                </div>
                <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">
                  {eventsFactor ? Number(eventsFactor.contribution).toFixed(1) : '0.0'}
                  <span className="text-xs font-normal text-[#8A8A8A] ml-1">/ 45.0</span>
                </div>
                <p className="text-xs text-[#D4D4D4] leading-relaxed">
                  {eventsFactor?.description || 'Kejadian aktif dalam radius geodesik 25 km.'}
                </p>
                <div className="text-[11px] font-mono text-[#8A8A8A] border-t border-[#212121] pt-2 flex items-center justify-between">
                  <span>Kejadian Terdeteksi: <strong className="text-[#FFFFFF]">{eventsFactor?.count ?? 0} Titik</strong></span>
                  {eventsFactor?.threats && eventsFactor.threats.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpandedThreats(!expandedThreats)}
                      className="text-[#F59E0B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Detail</span>
                      {expandedThreats ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Official Alerts Factor */}
              <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-3">
                <div className="flex items-center justify-between border-b border-[#2C2C2C] pb-2">
                  <span className="text-xs font-mono uppercase text-[#F59E0B] font-bold">3. Peringatan Dini Resmi</span>
                  <span className="text-xs font-mono text-[#FFFFFF] font-bold">Bobot: 30%</span>
                </div>
                <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">
                  {alertsFactor ? Number(alertsFactor.contribution).toFixed(1) : '0.0'}
                  <span className="text-xs font-normal text-[#8A8A8A] ml-1">/ 30.0</span>
                </div>
                <p className="text-xs text-[#D4D4D4] leading-relaxed">
                  {alertsFactor?.description || 'Peringatan aktif dari otoritas berwenang.'}
                </p>
                <div className="text-[11px] font-mono text-[#8A8A8A] border-t border-[#212121] pt-2 flex items-center justify-between">
                  <span>Peringatan Aktif: <strong className="text-[#FFFFFF]">{alertsFactor?.alerts?.length ?? 0} Peringatan</strong></span>
                  {alertsFactor?.alerts && alertsFactor.alerts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpandedAlerts(!expandedAlerts)}
                      className="text-[#F59E0B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Detail</span>
                      {expandedAlerts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Threats Drawer */}
            {expandedThreats && eventsFactor?.threats && eventsFactor.threats.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-3">
                <div className="text-xs font-mono uppercase text-[#F59E0B] font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Daftar Ancaman Kejadian Aktif dalam Radius 25 km:</span>
                </div>
                <div className="space-y-2">
                  {eventsFactor.threats.map((threat: ThreatFactorItem) => (
                    <div key={threat.id} className="p-3.5 rounded-xl bg-[#212121] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#FFFFFF]">{threat.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#161616] text-[#F59E0B] border border-amber-500/30">
                            {threat.severity}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8A8A8A] flex flex-wrap items-center gap-3">
                          <span>Sumber: {threat.source_name}</span>
                          <span>Provenance: <strong className="text-[#D4D4D4]">{threat.provenance_label || 'STATIC (TERKURASI)'}</strong></span>
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-sm font-bold text-[#F59E0B]">+{Number(threat.contribution).toFixed(1)}</span>
                        <span className="block text-[10px] text-[#8A8A8A]">kontribusi skor</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expanded Alerts Drawer */}
            {expandedAlerts && alertsFactor?.alerts && alertsFactor.alerts.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-3">
                <div className="text-xs font-mono uppercase text-[#F59E0B] font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Daftar Peringatan Resmi Aktif Terkait Wilayah Ini:</span>
                </div>
                <div className="space-y-2">
                  {alertsFactor.alerts.map((al: AlertFactorItem) => (
                    <div key={al.id} className="p-3.5 rounded-xl bg-[#212121] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#FFFFFF]">{al.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#161616] text-amber-300 border border-amber-500/30">
                            {al.broadcast_level}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8A8A8A]">
                          Kelas: {al.alert_class} | Mulai: {formatTimestamp(al.starts_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-center space-y-3">
          <Compass className="w-10 h-10 text-[#8A8A8A] mx-auto" />
          <h3 className="text-base font-bold text-[#FFFFFF]">Belum Ada Hasil Evaluasi yang Dipilih</h3>
          <p className="text-xs text-[#8A8A8A] max-w-md mx-auto">
            Pilih wilayah administratif dan jenis bahaya pada konsol di atas, lalu tekan &quot;Jalankan Evaluasi Risiko&quot; untuk menghasilkan komputasi deterministik.
          </p>
        </div>
      )}

      {/* ==========================================
          5. REGIONAL RISK COMPARISON (STAGE 4)
          ========================================== */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2C2C2C] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#FFFFFF]">
              Penilaian Risiko Regional Terkini (Latest Regional Assessments)
            </h3>
            <p className="text-xs text-[#8A8A8A]">
              Menampilkan hasil penilaian risiko terbaru yang telah dievaluasi oleh Risk Engine untuk setiap wilayah pilot dan jenis bahaya (bukan log time-series historis lengkap).
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchRegionQuery}
              onChange={(e) => setSearchRegionQuery(e.target.value)}
              placeholder="Cari wilayah..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#212121] border border-[#383838] text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-hidden focus:border-[#F59E0B]"
            />
          </div>
        </div>

        {/* Hazard filter tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setComparisonHazardFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              comparisonHazardFilter === 'all'
                ? 'bg-[#F59E0B] text-[#0C0C0C]'
                : 'bg-[#212121] text-[#8A8A8A] hover:text-[#FFFFFF]'
            }`}
          >
            Semua Bahaya ({assessments.length})
          </button>
          {hazardTypes.map((ht) => (
            <button
              key={ht.slug}
              type="button"
              onClick={() => setComparisonHazardFilter(ht.slug)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                comparisonHazardFilter === ht.slug
                  ? 'bg-[#F59E0B] text-[#0C0C0C]'
                  : 'bg-[#212121] text-[#8A8A8A] hover:text-[#FFFFFF]'
              }`}
            >
              {ht.name}
            </button>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead>
              <tr className="border-b border-[#2C2C2C] text-[#8A8A8A] font-mono uppercase text-[11px]">
                <th className="py-3 px-3">Wilayah Acuan</th>
                <th className="py-3 px-3">Jenis Bahaya</th>
                <th className="py-3 px-3">Skor Risiko</th>
                <th className="py-3 px-3">Kategori Risiko</th>
                <th className="py-3 px-3">Waktu Evaluasi</th>
                <th className="py-3 px-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212121]">
              {filteredAssessments.length > 0 ? (
                filteredAssessments.map((item) => (
                  <tr key={item.id} className="hover:bg-[#212121]/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#FFFFFF]">{item.region?.name || 'Wilayah Umum'}</div>
                      <div className="text-[10px] text-[#8A8A8A] font-mono">{item.region?.code}</div>
                    </td>
                    <td className="py-3 px-3 text-[#D4D4D4]">
                      {item.hazard_type?.name || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-sm text-[#FFFFFF]">
                      {Number(item.risk_score).toFixed(1)}
                    </td>
                    <td className="py-3 px-3">
                      {renderRiskLevelBadge(item.risk_level)}
                    </td>
                    <td className="py-3 px-3 text-[11px] font-mono text-[#8A8A8A]">
                      {formatTimestamp(item.assessed_at)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAssessment(item);
                          window.scrollTo({ top: 200, behavior: 'smooth' });
                          toast.info(`Menampilkan detail evaluasi untuk ${item.region?.name}.`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#212121] hover:bg-[#F59E0B] hover:text-[#0C0C0C] text-[#D4D4D4] font-semibold text-xs border border-[#383838] transition-all cursor-pointer"
                      >
                        Inspeksi
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#8A8A8A]">
                    Tidak ada penilaian risiko yang cocok dengan kriteria filter saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceRiskAnalysisPage;
