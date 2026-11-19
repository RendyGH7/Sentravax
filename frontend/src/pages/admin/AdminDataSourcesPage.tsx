import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Sliders,
  ChevronRight,
  X,
  RotateCcw,
  Trash2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '../../services/admin-service';
import type {
  DataSourceItem,
  ConnectivityState,
  FreshnessState,
  ProvenanceType,
  SystemHealthData,
  FailedJobItem,
} from '../../types/admin';

export const AdminDataSourcesPage: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSourceItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Operational Monitoring Tabs
  const [activeTab, setActiveTab] = useState<'sources' | 'health' | 'failed_jobs'>('sources');
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJobItem[]>([]);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);

  // Load Data Sources
  const loadDataSources = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params: { category?: string; status?: string } = {};
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'active') params.status = 'active';
        else if (statusFilter === 'inactive') params.status = 'inactive';
      }

      const sources = await adminService.getDataSources(params);
      setDataSources(sources);

      // If slideover is open, update its selection too using functional state
      setSelectedSource((prev) => (prev ? (sources.find((s) => s.id === prev.id) ?? prev) : null));
    } catch {
      toast.error('Gagal memuat daftar sumber data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryFilter, statusFilter]);

  // Load System Health
  const loadSystemHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const [health, jobs] = await Promise.all([
        adminService.getSystemHealth(),
        adminService.getFailedJobs(),
      ]);
      setSystemHealth(health);
      setFailedJobs(jobs);
    } catch {
      toast.error('Gagal memuat status kesehatan infrastruktur.');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDataSources();
  }, [loadDataSources]);

  useEffect(() => {
    if (activeTab === 'health' || activeTab === 'failed_jobs') {
      loadSystemHealth();
    }
  }, [activeTab, loadSystemHealth]);

  // Toggle active/inactive
  const handleToggle = async (source: DataSourceItem) => {
    setTogglingId(source.id);
    const newStatus = source.status === 'active' ? false : true;
    try {
      const updated = await adminService.toggleDataSource(source.id, newStatus);
      toast.success(
        `Sumber data "${source.name}" berhasil di-${updated.status === 'active' ? 'aktifkan' : 'nonaktifkan'}.`
      );
      setDataSources((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      if (selectedSource?.id === updated.id) {
        setSelectedSource((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch {
      toast.error(`Gagal mengubah status sumber data "${source.name}".`);
    } finally {
      setTogglingId(null);
    }
  };

  // Trigger manual sync
  const handleSync = async (id: number, runAsync = false) => {
    setSyncingId(id);
    try {
      const res = await adminService.triggerSync(id, runAsync);
      if (res.queued) {
        toast.info(`Tugas sinkronisasi dimasukkan ke antrean worker background (Job ID: ${res.job_id}).`);
      } else {
        toast.success(`Sinkronisasi manual berhasil diselesaikan.`);
      }
      // Reload sources to get latest sync runs & timestamps
      await loadDataSources(true);
    } catch {
      toast.error('Gagal menjalankan proses sinkronisasi data.');
    } finally {
      setSyncingId(null);
    }
  };

  // Open detail slideover
  const handleOpenDetail = async (source: DataSourceItem) => {
    setSelectedSource(source);
    try {
      const detailed = await adminService.getDataSource(source.id);
      setSelectedSource(detailed);
    } catch {
      // Keep basic source if detail fetch fails
    }
  };

  // Retry failed job
  const handleRetryJob = async (id: number) => {
    try {
      await adminService.retryFailedJob(id);
      toast.success(`Tugas job #${id} dijadwalkan ulang untuk dicoba kembali.`);
      loadSystemHealth();
    } catch {
      toast.error('Gagal menjadwalkan ulang antrean tugas.');
    }
  };

  // Dismiss failed job
  const handleDismissJob = async (id: number) => {
    try {
      await adminService.dismissFailedJob(id);
      toast.info(`Tugas job #${id} telah dihapus dari antrean kegagalan.`);
      loadSystemHealth();
    } catch {
      toast.error('Gagal menghapus antrean tugas.');
    }
  };

  // Dimension A: Connectivity Badge (LIVE, STATIC, OFFLINE, UNKNOWN)
  const renderConnectivityBadge = (state?: ConnectivityState) => {
    switch (state) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </span>
        );
      case 'STATIC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            STATIC
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            OFFLINE
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-zinc-900 text-zinc-500 border border-zinc-800">
            UNKNOWN
          </span>
        );
    }
  };

  // Dimension C: Provenance Badge (OFFICIAL, OBSERVED, COMMUNITY_REPORT, SENTRAVAX_INSIGHT, SIMULATED, CURATED_REFERENCE)
  const renderProvenanceBadge = (type?: ProvenanceType, isSimulated?: boolean) => {
    if (isSimulated || type === 'SIMULATED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
          <Radio className="w-3 h-3" /> SIMULATED
        </span>
      );
    }

    switch (type) {
      case 'OFFICIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            OFFICIAL
          </span>
        );
      case 'OBSERVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            OBSERVED
          </span>
        );
      case 'CURATED_REFERENCE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            CURATED_REFERENCE
          </span>
        );
      case 'COMMUNITY_REPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
            COMMUNITY_REPORT
          </span>
        );
      case 'SENTRAVAX_INSIGHT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30">
            SENTRAVAX_INSIGHT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            REFERENCE
          </span>
        );
    }
  };

  // Dimension B: Freshness Badge (FRESH, DELAYED, STALE, UNAVAILABLE, UNKNOWN)
  const renderFreshnessBadge = (state?: FreshnessState) => {
    switch (state) {
      case 'FRESH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            FRESH
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> DELAYED
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" /> STALE
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">
            <XCircle className="w-3 h-3" /> UNAVAILABLE
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Clock className="w-3 h-3" /> UNKNOWN
          </span>
        );
    }
  };

  // Aggregated quick stats
  const totalSources = dataSources.length;
  const activeSources = dataSources.filter((s) => s.status === 'active').length;
  const staleOrDelayed = dataSources.filter(
    (s) => s.freshness_state === 'STALE' || s.freshness_state === 'DELAYED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Header */}
      <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-mono uppercase text-[#10B981] font-bold">
              Data Ingestion & Operational Monitor
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
            Registri Sumber Data & Pemantauan Operasional
          </h1>
          <p className="text-xs sm:text-sm text-[#D4D4D4]">
            Kelola konektor data resmi (BMKG, PVMBG, Satelit Copernicus), ambang batas kesegaran data spesifik, dan kesehatan infrastruktur background pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'sources') loadDataSources(true);
              else loadSystemHealth();
            }}
            disabled={refreshing || healthLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2C2C2C] text-xs font-mono font-bold text-white border border-[#2C2C2C] transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#F59E0B] ${refreshing || healthLoading ? 'animate-spin' : ''}`}
            />
            <span>Segarkan Status</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2C2C2C] pb-2 overflow-x-auto whitespace-nowrap max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab('sources')}
          className={`flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sources'
              ? 'bg-[#212121] text-[#F59E0B] border border-amber-500/30'
              : 'text-[#8A8A8A] hover:text-white hover:bg-white/5'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Daftar Sumber Data ({totalSources})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'health'
              ? 'bg-[#212121] text-[#10B981] border border-emerald-500/30'
              : 'text-[#8A8A8A] hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Kesehatan Infrastruktur Live</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('failed_jobs')}
          className={`flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'failed_jobs'
              ? 'bg-[#212121] text-[#EF4444] border border-rose-500/30'
              : 'text-[#8A8A8A] hover:text-white hover:bg-white/5'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Antrean Gagal ({failedJobs.length})</span>
        </button>
      </div>

      {/* TAB 1: DATA SOURCES REGISTRY */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-1">
              <span className="text-xs text-[#8A8A8A] font-semibold">Total Sumber Terdaftar</span>
              <div className="text-2xl font-extrabold text-white">{totalSources}</div>
              <p className="text-[11px] text-[#A3A3A3] font-mono">BMKG, PVMBG, Satelit, dsb.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-1">
              <span className="text-xs text-[#8A8A8A] font-semibold">Konektor Aktif</span>
              <div className="text-2xl font-extrabold text-[#10B981]">{activeSources}</div>
              <p className="text-[11px] text-[#10B981] font-mono">
                {Math.round((activeSources / (totalSources || 1)) * 100)}% dari total sumber
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-1">
              <span className="text-xs text-[#8A8A8A] font-semibold">Keterlambatan (Stale / Delayed)</span>
              <div className="text-2xl font-extrabold text-[#F59E0B]">{staleOrDelayed}</div>
              <p className="text-[11px] text-[#FBBF24] font-mono">
                {staleOrDelayed > 0 ? 'Memerlukan pemeriksaan koneksi' : 'Semua feed normal'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-1">
              <span className="text-xs text-[#8A8A8A] font-semibold">Mekanisme Fallback</span>
              <div className="text-2xl font-extrabold text-[#A855F7]">ISOLATED</div>
              <p className="text-[11px] text-[#C084FC] font-mono">Kegagalan 1 feed tidak merusak peta</p>
            </div>
          </div>

          {/* Filters & Control Bar */}
          <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] flex flex-wrap items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#8A8A8A] font-semibold mr-1 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Kategori:
              </span>
              {['ALL', 'WEATHER', 'SEISMOLOGY', 'GEOLOGY', 'SATELLITE', 'CURATED'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    categoryFilter === cat
                      ? 'bg-[#F59E0B] text-black font-extrabold'
                      : 'bg-[#212121] text-[#D4D4D4] hover:bg-[#2C2C2C]'
                  }`}
                >
                  {cat === 'ALL' ? 'SEMUA' : cat}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8A8A8A] font-semibold">Status:</span>
              <select
                aria-label="Filter status sumber data"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#212121] border border-[#2C2C2C] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-[#F59E0B]"
              >
                <option value="ALL">Semua Status</option>
                <option value="active">Aktif Saja</option>
                <option value="inactive">Nonaktif Saja</option>
              </select>
            </div>
          </div>

          {/* Sources Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#8A8A8A] space-y-2">
              <RefreshCw className="w-8 h-8 text-[#F59E0B] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#D4D4D4]">Memuat data source registry...</p>
            </div>
          ) : dataSources.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8A8A8A] bg-[#161616] rounded-2xl border border-[#2C2C2C] space-y-2">
              <Info className="w-8 h-8 text-[#F59E0B] mx-auto" />
              <p className="text-sm font-semibold text-[#D4D4D4]">
                Tidak ada sumber data yang sesuai filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataSources.map((source) => (
                <div
                  key={source.id}
                  className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] hover:border-[#383838] transition-all flex flex-col justify-between gap-4"
                >
                  {/* Card Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#212121] text-[#F59E0B] border border-amber-500/20">
                          {source.category}
                        </span>
                        <span className="text-xs text-[#8A8A8A] font-mono">{source.provider}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {renderConnectivityBadge(source.connectivity_state)}
                        {renderProvenanceBadge(source.provenance_type, source.is_simulated)}
                        {renderFreshnessBadge(source.freshness_state)}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">{source.name}</h3>

                    {source.endpoint_url && (
                      <p className="text-xs text-[#8A8A8A] font-mono truncate bg-[#0C0C0C] px-2.5 py-1 rounded-md border border-[#212121]">
                        {source.endpoint_url}
                      </p>
                    )}
                  </div>

                  {/* Provenance & Freshness Explanation */}
                  <div className="p-3 rounded-xl bg-[#0C0C0C] border border-[#212121] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[#8A8A8A]">
                      <span>Observasi Terakhir:</span>
                      <span className="text-white font-mono">
                        {source.last_observed_at
                          ? new Date(source.last_observed_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            }) +
                            ' (' +
                            new Date(source.last_observed_at).toLocaleDateString('id-ID') +
                            ')'
                          : 'Belum ada data'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#8A8A8A]">
                      <span>Sinkronisasi Terakhir:</span>
                      <span className="text-white font-mono">
                        {source.last_fetched_at
                          ? new Date(source.last_fetched_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Belum pernah'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#8A8A8A]">
                      <span>Interval & Rate Limit:</span>
                      <span className="text-[#F59E0B] font-mono">
                        {source.sync_interval_minutes} menit | {source.rate_limit_rpm} RPM
                      </span>
                    </div>

                    {source.freshness_info?.explanation && (
                      <div className="pt-1 border-t border-[#212121] text-[11px] text-[#A3A3A3] italic">
                        {source.freshness_info.explanation}
                      </div>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#2C2C2C] gap-2">
                    {/* Active Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggle(source)}
                      disabled={togglingId === source.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                        source.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          source.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'
                        }`}
                      />
                      <span>{source.status === 'active' ? 'Koneksi Aktif' : 'Nonaktif'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSync(source.id, false)}
                        disabled={syncingId === source.id || source.status !== 'active'}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#212121] hover:bg-[#2C2C2C] text-xs font-mono font-bold text-white border border-[#2C2C2C] transition-all disabled:opacity-40"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 text-[#F59E0B] ${
                            syncingId === source.id ? 'animate-spin' : ''
                          }`}
                        />
                        <span>Sync</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDetail(source)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold transition-all shadow-xs"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SYSTEM HEALTH DIAGNOSTICS */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {healthLoading || !systemHealth ? (
            <div className="p-12 text-center text-xs text-[#8A8A8A] space-y-2">
              <RefreshCw className="w-8 h-8 text-[#10B981] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#D4D4D4]">
                Melakukan diagnosa infrastruktur live...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall status banner */}
              <div
                className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
                  systemHealth.overall_status === 'HEALTHY'
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
                    : 'bg-amber-950/30 border-amber-800 text-amber-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6" />
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">
                      Status Keseluruhan Sistem: {systemHealth.overall_status}
                    </h3>
                    <p className="text-xs text-white/80">
                      Waktu diagnosa: {new Date(systemHealth.timestamp).toLocaleTimeString('id-ID')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadSystemHealth}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
                >
                  Uji Ulang
                </button>
              </div>

              {/* Component Health Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Database & PostGIS */}
                <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8A8A8A] font-semibold">PostgreSQL Engine</span>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">
                      {systemHealth.database.status}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-white">
                    {systemHealth.database.latency_ms} ms
                  </div>
                  <div className="text-xs text-[#8A8A8A] font-mono space-y-1">
                    <p>Engine: {systemHealth.database.engine}</p>
                    <p>PostGIS: {systemHealth.postgis.version}</p>
                  </div>
                </div>

                {/* Queue Worker */}
                <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8A8A8A] font-semibold">Queue Pipeline</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md border ${
                        systemHealth.queue_worker.status === 'OPTIMAL'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {systemHealth.queue_worker.status}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-white">
                    {systemHealth.queue_worker.pending_jobs} Pending
                  </div>
                  <div className="text-xs text-[#8A8A8A] font-mono space-y-1">
                    <p>Driver: {systemHealth.queue_worker.driver}</p>
                    <p className="text-rose-400">
                      Gagal: {systemHealth.queue_worker.failed_jobs} tugas
                    </p>
                  </div>
                </div>

                {/* Scheduler Heartbeat */}
                <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8A8A8A] font-semibold">Scheduler Heartbeat</span>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">
                      {systemHealth.scheduler.heartbeat_status}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-white">Active Cron</div>
                  <div className="text-xs text-[#8A8A8A] font-mono">
                    Heartbeat: {new Date(systemHealth.scheduler.last_run).toLocaleTimeString('id-ID')}
                  </div>
                </div>
              </div>

              {/* External Ingestion Connectivity Probe */}
              <div className="rounded-2xl bg-[#161616] border border-[#2C2C2C] overflow-hidden">
                <div className="p-4 border-b border-[#2C2C2C]">
                  <h3 className="text-sm font-bold text-white">
                    Uji Konektivitas Endpoint Eksternal Resmi
                  </h3>
                  <p className="text-xs text-[#8A8A8A]">
                    Pengujian live TCP handshake dan response code ke server BMKG & PVMBG.
                  </p>
                </div>

                <div className="divide-y divide-[#2C2C2C]">
                  {Object.entries(systemHealth.external_connectivity).map(([key, conn]) => (
                    <div
                      key={key}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white uppercase">{key}</span>
                          <span className="text-xs text-[#8A8A8A] font-mono">{conn.url}</span>
                        </div>
                        {conn.error && (
                          <p className="text-xs text-rose-400 font-mono italic">{conn.error}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-[#A3A3A3]">
                          Latensi: {conn.latency_ms} ms
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                            conn.status === 'REACHABLE'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {conn.status} {conn.http_code ? `(${conn.http_code})` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FAILED JOBS MONITOR */}
      {activeTab === 'failed_jobs' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Antrean Tugas Sinkronisasi yang Gagal</h3>
              <p className="text-xs text-[#8A8A8A]">
                Pesan error telah disanitasi dari token otorisasi, kredensial sandi, dan IP server internal.
              </p>
            </div>
            <button
              type="button"
              onClick={loadSystemHealth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#212121] hover:bg-[#2C2C2C] text-xs font-mono text-white border border-[#2C2C2C]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Segarkan
            </button>
          </div>

          {failedJobs.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8A8A8A] bg-[#161616] rounded-2xl border border-[#2C2C2C] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto" />
              <p className="text-sm font-semibold text-[#D4D4D4]">
                Antrean bersih. Tidak ada tugas background yang gagal.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-2xl bg-[#161616] border border-rose-950 hover:border-rose-800 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-rose-950 text-rose-400 border border-rose-800">
                        Job #{job.id}
                      </span>
                      <span className="text-xs font-mono text-[#8A8A8A]">Antrean: {job.queue}</span>
                      <span className="text-xs font-mono text-[#8A8A8A]">
                        Waktu: {new Date(job.failed_at).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRetryJob(job.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#212121] hover:bg-[#2C2C2C] text-xs font-bold text-[#F59E0B] border border-amber-500/30"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Coba Ulang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissJob(job.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-400 border border-rose-500/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0C0C0C] border border-[#212121] text-xs font-mono text-rose-300 break-all">
                    {job.exception_sanitized}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAIL SLIDEOVER MODAL */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl h-full bg-[#161616] border-l border-[#2C2C2C] p-6 overflow-y-auto space-y-6">
            {/* Slideover Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#2C2C2C]">
              <div>
                <span className="text-xs font-mono text-[#F59E0B] font-bold uppercase">
                  {selectedSource.category} • {selectedSource.provider}
                </span>
                <h2 className="text-lg font-bold text-white">{selectedSource.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="p-2 rounded-xl bg-[#212121] hover:bg-[#2C2C2C] text-[#8A8A8A] hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Standardized 3-Dimension Status */}
            <div className="p-4 rounded-xl bg-[#0C0C0C] border border-[#212121] space-y-3">
              <h3 className="text-xs font-bold uppercase text-[#8A8A8A] tracking-wider">
                Status Tiga Dimensi Sumber Data
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-[#161616] border border-[#2C2C2C] flex flex-col gap-1">
                  <span className="text-[10px] text-[#8A8A8A] uppercase font-mono">1. Konektivitas</span>
                  <div>{renderConnectivityBadge(selectedSource.connectivity_state)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#161616] border border-[#2C2C2C] flex flex-col gap-1">
                  <span className="text-[10px] text-[#8A8A8A] uppercase font-mono">2. Asal Data (Provenance)</span>
                  <div>{renderProvenanceBadge(selectedSource.provenance_type, selectedSource.is_simulated)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#161616] border border-[#2C2C2C] flex flex-col gap-1">
                  <span className="text-[10px] text-[#8A8A8A] uppercase font-mono">3. Kesegaran (Freshness)</span>
                  <div>{renderFreshnessBadge(selectedSource.freshness_state)}</div>
                </div>
              </div>
              {selectedSource.is_simulated && (
                <div className="text-xs text-purple-400 font-mono bg-purple-950/40 p-2.5 rounded-lg border border-purple-800/50">
                  PERINGATAN: Sumber ini berlabel DATA SIMULASI. Digunakan untuk pengujian skenario demonstrasi dan tidak boleh dianggap sebagai observasi langsung instrumen lapangan.
                </div>
              )}
              {selectedSource.freshness_info && (
                <p className="text-xs text-[#D4D4D4] italic bg-[#161616] p-2.5 rounded-lg border border-[#2C2C2C]">
                  {selectedSource.freshness_info.explanation}
                </p>
              )}
            </div>

            {/* Source Configuration & Rates */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-[#8A8A8A] tracking-wider">
                Konfigurasi Teknis & Ketentuan
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#212121] border border-[#2C2C2C] flex items-center justify-between">
                  <span className="text-[#8A8A8A]">Interval Sinkronisasi Otomatis:</span>
                  <span className="text-white font-mono font-bold">
                    Setiap {selectedSource.sync_interval_minutes} Menit
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#212121] border border-[#2C2C2C] flex items-center justify-between">
                  <span className="text-[#8A8A8A]">Batas Laju Panggilan (Rate Limit):</span>
                  <span className="text-white font-mono font-bold">
                    {selectedSource.rate_limit_rpm} Requests/Menit
                  </span>
                </div>
                {selectedSource.terms_of_service && (
                  <div className="p-3 rounded-xl bg-[#212121] border border-[#2C2C2C] space-y-1">
                    <span className="text-[#8A8A8A]">Ketentuan Penggunaan (ToS):</span>
                    <p className="text-white font-mono">{selectedSource.terms_of_service}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sync Run History Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-[#8A8A8A] tracking-wider">
                  Riwayat Eksekusi Sinkronisasi (Sync Runs)
                </h3>
                <button
                  type="button"
                  onClick={() => handleSync(selectedSource.id, false)}
                  disabled={syncingId === selectedSource.id || selectedSource.status !== 'active'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B] text-black text-xs font-bold hover:bg-[#D97706] disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${syncingId === selectedSource.id ? 'animate-spin' : ''}`}
                  />
                  <span>Sync Sekarang</span>
                </button>
              </div>

              {!selectedSource.sync_runs || selectedSource.sync_runs.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8A8A8A] bg-[#0C0C0C] rounded-xl border border-[#212121]">
                  Belum ada log riwayat sinkronisasi untuk sumber ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSource.sync_runs.map((run) => (
                    <div
                      key={run.id}
                      className="p-3 rounded-xl bg-[#0C0C0C] border border-[#212121] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                            run.status === 'SUCCESS'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {run.status}
                        </span>
                        <span className="text-[#8A8A8A] font-mono">
                          {new Date(run.synced_at).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-[#A3A3A3]">
                        <div>Ambil: {run.items_fetched}</div>
                        <div>Disimpan: {run.items_persisted}</div>
                        <div>Durasi: {run.duration_ms} ms</div>
                      </div>

                      {run.error_message && (
                        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300 font-mono text-[11px] break-all">
                          {run.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
