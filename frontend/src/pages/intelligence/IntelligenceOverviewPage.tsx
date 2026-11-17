import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PATHS } from '../../app/router/paths';
import { intelligenceService } from '../../services/intelligence-service';
import type { IntelligenceOverviewData } from '../../types/intelligence';
import type { DataSourceItem } from '../../types/admin';
import { 
  Radio, 
  Layers, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  BrainCircuit,
  ShieldAlert,
  Server,
  RefreshCw,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export const IntelligenceOverviewPage: React.FC = () => {
  const [data, setData] = useState<IntelligenceOverviewData | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  // Simulation scrubber state
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(false);
  const [selectedSimStep, setSelectedSimStep] = useState<number>(3); // Default to +12 Jam
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const executeFetch = async () => {
      try {
        const [overviewRes, sourcesRes] = await Promise.all([
          intelligenceService.getOverview(),
          intelligenceService.getDataSources().catch(() => [] as DataSourceItem[]),
        ]);
        if (!isMounted) return;
        setData(overviewRes);
        setDataSources(sourcesRes);
        setError(null);

        // Match current step if available
        const steps = overviewRes.simulation_projection?.timeline_steps ?? [];
        const currentStepIdx = steps.findIndex(
          (s) => s === overviewRes.simulation_projection?.current_step
        );
        if (currentStepIdx !== -1) {
          setSelectedSimStep(currentStepIdx);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          const msg = (err.response?.data as { message?: string })?.message;

          if (status === 401) {
            setError({
              status: 401,
              message: 'Sesi otentikasi intelijen berakhir atau belum terautentikasi. Silakan masuk kembali.',
            });
          } else if (status === 403) {
            setError({
              status: 403,
              message: 'Akses ditolak: Akun Anda tidak memiliki hak akses Analis Intelijen (role: intelligence).',
            });
          } else {
            setError({
              status,
              message: msg || 'Gagal memuat telemetri Pusat Komando Intelijen. Periksa koneksi backend SENTRAVAX.',
            });
          }
        } else {
          setError({
            message: 'Terjadi kesalahan jaringan atau sistem internal.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    executeFetch();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTogglePlay = () => {
    const nextState = !isSimPlaying;
    setIsSimPlaying(nextState);
    toast.info(nextState ? 'Simulasi proyeksi diaktifkan.' : 'Simulasi proyeksi dijeda.');
  };

  const handleResetSim = () => {
    setSelectedSimStep(0);
    setIsSimPlaying(false);
    toast.info('Simulasi diatur ulang ke t0 (+1 Jam).');
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
        second: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return iso;
    }
  };

  // Helper to resolve honest effective freshness
  const getEffectiveFreshness = (source: DataSourceItem): string => {
    if (source.name.toLowerCase().includes('terkurasi') || source.source_type === 'curated') {
      return 'STATIC';
    }
    const statusStr = String(source.status).toLowerCase();
    if (statusStr === 'pending' || statusStr === 'offline') {
      return 'UNAVAILABLE';
    }
    return source.freshness_state || 'STATIC';
  };

  // Helper to render freshness badge
  const renderFreshnessBadge = (state?: string) => {
    switch (state) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/80 text-[#10B981] border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            LIVE
          </span>
        );
      case 'STATIC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#212121] text-[#A3A3A3] border border-[#383838]">
            STATIC
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-950/70 text-[#F59E0B] border border-amber-500/40">
            STALE
          </span>
        );
      case 'UNAVAILABLE':
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-950/70 text-rose-400 border border-rose-500/40">
            UNAVAILABLE
          </span>
        );
    }
  };

  // ==========================================
  // RENDER: LOADING SKELETON
  // ==========================================
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat telemetri intelijen...">
        {/* Ticker skeleton */}
        <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] h-28"></div>

        {/* 4 Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] h-32"></div>
          ))}
        </div>

        {/* Main projection & insights skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] h-96"></div>
          <div className="lg:col-span-4 p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] h-96"></div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: ERROR STATES (401, 403, NETWORK)
  // ==========================================
  if (error || !data) {
    const is401 = error?.status === 401;
    const is403 = error?.status === 403;

    return (
      <div className="p-8 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#212121] border border-[#383838] flex items-center justify-center text-[#F59E0B] mx-auto">
          {is401 || is403 ? <ShieldAlert className="w-7 h-7 text-[#F59E0B]" /> : <AlertCircle className="w-7 h-7 text-rose-400" />}
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[#FFFFFF]">
            {is401 ? 'Otorisasi Diperlukan' : is403 ? 'Akses Terbatas' : 'Gagal Memuat Telemetri Intelijen'}
          </h2>
          <p className="text-xs text-[#D4D4D4] leading-relaxed">
            {error?.message || 'Data telemetri Pusat Komando tidak dapat diakses saat ini.'}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          {is401 ? (
            <Link
              to={PATHS.PUBLIC.LOGIN}
              className="px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0C0C] text-xs font-bold transition-all shadow-xs"
            >
              Masuk ke Akun
            </Link>
          ) : is403 ? (
            <Link
              to={PATHS.USER.DASHBOARD}
              className="px-5 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold border border-[#383838] transition-all"
            >
              Kembali ke Portal Warga
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0C0C] text-xs font-bold transition-all shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Telemetri</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const { telemetry, metrics, simulation_projection: sim, recent_insights: insights } = data;
  const simSteps = sim?.timeline_steps ?? ['+1 Jam', '+3 Jam', '+6 Jam', '+12 Jam', '+24 Jam'];

  return (
    <div className="space-y-6">
      {/* ==========================================
          1. TOP COMMAND TELEMETRY BANNER
          ========================================== */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-mono uppercase text-[#10B981] font-bold tracking-wide">
              {telemetry?.stream_status || 'STREAMING AKTIF'}
            </span>
            <span className="text-[#8A8A8A] font-mono">| PostGIS: {telemetry?.postgis_status || 'NORMAL'}</span>
            <span className="text-[#8A8A8A] font-mono">| {telemetry?.sources_connected || '7 Node Aktif'}</span>
            {telemetry?.last_sync && (
              <span className="text-[#8A8A8A] font-mono text-[11px]">
                (Sinkronisasi: {formatTimestamp(telemetry.last_sync)})
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
            Pusat Komando dan Analisis Multi-Hazard Nasional
          </h1>
          <p className="text-xs sm:text-sm text-[#D4D4D4] max-w-3xl">
            Sintesis data spasial elevasi medan, sensor telemetri lingkungan, dan laporan masyarakat untuk estimasi dampak bencana berbasis bukti.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-[#212121] hover:bg-[#2B2B2B] text-[#D4D4D4] hover:text-[#FFFFFF] border border-[#2C2C2C] transition-colors"
            aria-label="Segarkan telemetri"
            title="Segarkan data telemetri"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to={PATHS.INTELLIGENCE.ALERT_OPERATIONS}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0C0C] text-xs font-bold transition-all shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 text-[#0C0C0C]" />
            <span>Diseminasi Peringatan CAP</span>
          </Link>
        </div>
      </div>

      {/* ==========================================
          2. OPERATIONAL METRICS COUNTERS (4 CARDS)
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Threats */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#8A8A8A]">
            <span>Ancaman Bencana Aktif</span>
            <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">
            {metrics?.active_threats ?? 0}
          </div>
          <p className="text-[11px] text-[#A3A3A3]">
            Kejadian resmi terpantau dalam jangkauan PostGIS
          </p>
        </div>

        {/* Unverified Reports */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#8A8A8A]">
            <span>Laporan Belum Terverifikasi</span>
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">
            {metrics?.unverified_reports ?? 0}
          </div>
          <p className="text-[11px] text-[#A3A3A3]">
            Antrean verifikasi pelaporan masyarakat (Crowdsource)
          </p>
        </div>

        {/* Active CAP Alerts */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#8A8A8A]">
            <span>Peringatan Dini CAP Aktif</span>
            <Radio className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">
            {metrics?.active_cap_alerts ?? 0}
          </div>
          <p className="text-[11px] text-[#A3A3A3]">
            Siaran peringatan resmi yang sedang berlaku
          </p>
        </div>

        {/* Proactive AI Insights */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#8A8A8A]">
            <span>Wawasan AI Terbit</span>
            <BrainCircuit className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">
            {metrics?.proactive_insights_generated ?? 0}
          </div>
          <p className="text-[11px] text-[#A3A3A3]">
            Analisis proyeksi teruji aturan inferensi deterministik
          </p>
        </div>
      </div>

      {/* ==========================================
          3. SIMULATION SCENARIO VIEWPORT & ANALYTICS
          ========================================== */}
      {sim && (
        <div className="rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm overflow-hidden space-y-5 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C2C2C] pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#212121] text-[#F59E0B] border border-amber-500/30 font-bold">
                  {sim.data_nature === 'DEMONSTRATION_SCENARIO' ? 'SKENARIO DEMONSTRASI (DEMNAS 5M)' : (sim.data_nature || 'SKENARIO DEMONSTRASI')}
                </span>
                <span className="text-xs font-mono text-[#10B981] flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {sim.freshness || 'DATA AKTIF'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#FFFFFF] mt-1.5">
                {sim.scenario_name}
              </h2>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-[#212121] border border-[#2C2C2C] text-xs font-mono text-[#D4D4D4]">
              Zona: <span className="text-[#FFFFFF] font-bold">{sim.zone}</span>
            </div>
          </div>

          {/* Demonstration Scenario Transparent Disclaimer */}
          <div className="p-3.5 rounded-xl bg-[#212121]/80 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="font-bold text-[#F59E0B] block">Batasan Metodologi Proyeksi:</span>
              <p className="text-[#D4D4D4] leading-relaxed">
                {sim.disclaimer}
              </p>
              <p className="text-[11px] text-[#8A8A8A] font-mono mt-1">
                Sumber Elevasi: {sim.elevation_source}
              </p>
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Telemetry Metrics */}
            <div className="lg:col-span-4 space-y-3.5">
              {/* Exposed population */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#212121] border border-[#2C2C2C] space-y-1.5 shadow-xs">
                <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold">Estimasi Populasi Terpapar</span>
                <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">
                  {sim.metrics?.exposed_population?.toLocaleString('id-ID') ?? 0} Jiwa
                </div>
                <p className="text-xs text-[#F59E0B] flex items-center gap-1 font-semibold font-mono">
                  <TrendingUp className="w-3.5 h-3.5" /> {sim.metrics?.population_trend}
                </p>
              </div>

              {/* Critical facilities */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#212121] border border-[#2C2C2C] space-y-1.5 shadow-xs">
                <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold">Fasilitas Kritis dalam Radius</span>
                <div className="text-3xl font-extrabold text-[#FFFFFF] font-mono">
                  {sim.metrics?.critical_facilities_in_radius?.total ?? 0} Titik
                </div>
                <p className="text-xs text-[#D4D4D4]">
                  {sim.metrics?.critical_facilities_in_radius?.breakdown || 'Fasilitas kesehatan dan pendidikan'}
                </p>
              </div>

              {/* River discharge status */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#212121] border border-[#2C2C2C] space-y-1.5 shadow-xs">
                <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold">Status Debit Aliran Sungai</span>
                <div className="text-2xl font-extrabold text-[#F59E0B] font-mono">
                  {sim.metrics?.river_discharge_status?.level} ({sim.metrics?.river_discharge_status?.current_flow_m3_s} m³/s)
                </div>
                <p className="text-xs text-[#D4D4D4]">
                  Ambang batas kritis: {sim.metrics?.river_discharge_status?.critical_threshold_m3_s} m³/detik
                </p>
              </div>
            </div>

            {/* Right: Map Schematic & Scrubber */}
            <div className="lg:col-span-8 space-y-4">
              <div className="h-64 sm:h-80 rounded-2xl bg-[#212121] border border-[#2C2C2C] p-6 flex flex-col justify-between relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between text-xs font-mono text-[#8A8A8A] font-semibold">
                  <span>LAYER: {sim.active_layer}</span>
                  <span className="text-[#F59E0B]">BAHAYA: {sim.hazard_type}</span>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto shadow-xs">
                    <Layers className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">
                    Visualisasi Spasial Dinamis (PostGIS Vector Simulation)
                  </h3>
                  <p className="text-xs text-[#D4D4D4] max-w-md mx-auto">
                    Kombinasi layer poligon bahaya dan kurva hidrologi Ciliwung pada langkah simulasi {simSteps[selectedSimStep] || '+12 Jam'}.
                  </p>
                </div>

                {/* Scrubber Playback Controls */}
                <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2C2C2C] flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="w-9 h-9 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0C0C] flex items-center justify-center font-bold shadow-xs transition-colors"
                      aria-label={isSimPlaying ? 'Hentikan simulasi' : 'Jalankan simulasi'}
                    >
                      {isSimPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetSim}
                      className="p-2 rounded-xl bg-[#212121] hover:bg-[#2B2B2B] text-[#D4D4D4] hover:text-[#FFFFFF] border border-[#2C2C2C] transition-colors"
                      aria-label="Reset simulasi"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Timeline step indicators */}
                  <div className="flex items-center gap-2 flex-1 justify-end overflow-x-auto text-xs font-mono">
                    {simSteps.map((stepLabel, idx) => (
                      <button
                        key={stepLabel}
                        type="button"
                        onClick={() => setSelectedSimStep(idx)}
                        className={`px-3 py-1.5 rounded-lg border transition-all ${
                          selectedSimStep === idx
                            ? 'bg-[#F59E0B] text-[#0C0C0C] border-amber-400 font-bold shadow-xs'
                            : 'bg-[#212121] text-[#8A8A8A] border-[#2C2C2C] hover:text-[#FFFFFF] hover:border-[#383838]'
                        }`}
                      >
                        {stepLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          4. TWO-COLUMN: RECENT INSIGHTS & DATA SOURCES PROVENANCE
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Recent Proactive AI Insights Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#F59E0B]" />
              <h2 className="text-base font-bold text-[#FFFFFF]">Wawasan AI Proaktif Terkini</h2>
            </div>
            <Link
              to={PATHS.INTELLIGENCE.AI_INSIGHTS}
              className="text-xs text-[#F59E0B] hover:text-amber-400 flex items-center gap-1 font-semibold"
            >
              Semua Wawasan <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {insights && insights.length > 0 ? (
            <div className="space-y-3.5">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2C2C2C] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#212121] text-[#F59E0B] border border-amber-500/30">
                        {insight.hazard_type?.name || 'Multi-Hazard'}
                      </span>
                      {insight.region?.name && (
                        <span className="text-xs text-[#D4D4D4] font-medium">
                          {insight.region.name}
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] font-mono font-bold ${
                      insight.confidence_level === 'INSUFFICIENT_DATA' || Number(insight.confidence_score) === 0
                        ? 'text-stone-400'
                        : insight.confidence_level === 'HIGH' || Number(insight.confidence_score) >= 0.85
                        ? 'text-[#10B981]'
                        : insight.confidence_level === 'MEDIUM' || Number(insight.confidence_score) >= 0.60
                        ? 'text-[#F59E0B]'
                        : 'text-[#A3A3A3]'
                    }`}>
                      Kekuatan Bukti: {insight.confidence_level ?? (Number(insight.confidence_score) === 0 ? 'INSUFFICIENT_DATA' : (Number(insight.confidence_score) >= 0.85 ? 'HIGH' : (Number(insight.confidence_score) >= 0.60 ? 'MEDIUM' : 'LOW')))}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#FFFFFF]">
                    {insight.title}
                  </h3>
                  <p className="text-xs text-[#D4D4D4] leading-relaxed">
                    {insight.summary}
                  </p>

                  {/* Recommendations checklist */}
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#212121] border border-[#2C2C2C] space-y-1.5">
                      <span className="text-[11px] font-mono uppercase text-[#F59E0B] font-bold block">
                        Rekomendasi Tindakan Terverifikasi:
                      </span>
                      <ul className="space-y-1 text-xs text-[#D4D4D4]">
                        {insight.recommendations.map((rec, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#8A8A8A] pt-1">
                    <span>Model: {insight.model_name || 'SENTRAVAX-Deterministic-v1'}</span>
                    <span>Waktu: {formatTimestamp(insight.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-center space-y-2">
              <BrainCircuit className="w-8 h-8 text-[#8A8A8A] mx-auto" />
              <h3 className="text-sm font-bold text-[#FFFFFF]">Belum Ada Wawasan Proaktif</h3>
              <p className="text-xs text-[#8A8A8A] max-w-sm mx-auto">
                Wawasan proaktif dihasilkan secara otomatis ketika anomali cuaca atau kejadian bencana memenuhi ambang batas evaluasi.
              </p>
            </div>
          )}
        </div>

        {/* Right: Data Sources Provenance & Health (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-[#F59E0B]" />
              <h2 className="text-base font-bold text-[#FFFFFF]">Integritas Aliran Data Eksternal</h2>
            </div>
            <Link
              to={PATHS.INTELLIGENCE.DATA_SOURCES}
              className="text-xs text-[#F59E0B] hover:text-amber-400 flex items-center gap-1 font-semibold"
            >
              Monitor Pipeline <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {dataSources.length > 0 ? (
              dataSources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 rounded-xl bg-[#161616] border border-[#2C2C2C] space-y-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#FFFFFF]">{source.name}</h3>
                      <p className="text-[11px] text-[#8A8A8A]">{source.provider}</p>
                    </div>
                    {renderFreshnessBadge(getEffectiveFreshness(source))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8A8A] pt-1 border-t border-[#212121]">
                    <span>Status: <strong className="text-[#D4D4D4] uppercase">{source.status}</strong></span>
                    <span>Diperbarui: {formatTimestamp(source.last_fetched_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-[#161616] border border-[#2C2C2C] text-xs text-[#8A8A8A] text-center">
                Data registri sumber data tidak tersedia.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceOverviewPage;
