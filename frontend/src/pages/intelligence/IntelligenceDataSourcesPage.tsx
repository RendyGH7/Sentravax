import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Satellite,
  Layers,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { intelligenceService } from '../../services/intelligence-service';
import type { DataSourceItem, ConnectivityState, FreshnessState, ProvenanceType } from '../../types/admin';
import { PATHS } from '../../app/router/paths';
import {
  ConnectivityBadge,
  FreshnessBadge,
  ProvenanceBadge,
} from '../../components/shared/DataTrustBadges';

export const IntelligenceDataSourcesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [telemetryStream, setTelemetryStream] = useState<{
    status: string;
    active_sources: number;
    total_sources: number;
    last_heartbeat: string;
  } | null>(null);
  const [spatialLayersHealth, setSpatialLayersHealth] = useState<Record<string, string>>({});
  const [freshnessSummary, setFreshnessSummary] = useState<Record<string, number>>({});
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [operationalAlerts, setOperationalAlerts] = useState<
    Array<{
      severity: string;
      source_id: number;
      source_name: string;
      message: string;
    }>
  >([]);

  const loadOperationalData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await intelligenceService.getOperationalMonitoring();
      setTelemetryStream(data.telemetry_stream);
      setSpatialLayersHealth(data.spatial_layers_health);
      setFreshnessSummary(data.freshness_summary);
      setSources(data.sources);
      setOperationalAlerts(data.operational_alerts);
    } catch {
      toast.error('Gagal memuat telemetri operasional intelijen geospasial.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadOperationalData();
    });
  }, [loadOperationalData]);

  // Unified 3-Dimensional Data Trust Badges
  const renderConnectivityBadge = (state?: ConnectivityState) => <ConnectivityBadge state={state} size="xs" />;
  const renderProvenanceBadge = (type?: ProvenanceType, isSimulated?: boolean) => (
    <ProvenanceBadge type={type} isSimulated={isSimulated} size="xs" />
  );
  const renderFreshnessBadge = (state?: FreshnessState) => <FreshnessBadge state={state} size="xs" />;

  return (
    <div className="space-y-6">
      {/* Top Banner / Stream Telemetry Indicator */}
      <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                telemetryStream?.status === 'STREAMING AKTIF'
                  ? 'bg-[#10B981] animate-pulse'
                  : 'bg-[#F59E0B]'
              }`}
            />
            <span
              className={`text-xs font-mono uppercase font-bold ${
                telemetryStream?.status === 'STREAMING AKTIF' ? 'text-[#10B981]' : 'text-[#F59E0B]'
              }`}
            >
              Umpan Geospasial: {telemetryStream?.status || 'MEMUAT...'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
            Aliran Data Telemetri & Lapisan Sensor Geospasial
          </h1>
          <p className="text-xs sm:text-sm text-[#D4D4D4]">
            Pantau keandalan feed sensor BMKG, PVMBG MAGMA, dan data pengamatan geospasial yang menjadi dasar perhitungan Risk Engine dan AI Insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadOperationalData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2C2C2C] text-xs font-mono font-bold text-white border border-[#2C2C2C] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#F59E0B] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan Feed</span>
          </button>

          <Link
            to={PATHS.INTELLIGENCE.MAP}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold transition-all shadow-xs"
          >
            <Layers className="w-4 h-4" />
            <span>Buka Peta Intelijen</span>
          </Link>
        </div>
      </div>

      {/* Operational Alerts Banner (if any) */}
      {operationalAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Peringatan Degradasi Umpan Data Terdeteksi ({operationalAlerts.length})</span>
          </div>
          <div className="space-y-1 pl-7 text-xs text-amber-200/90 font-mono">
            {operationalAlerts.map((alert, idx) => (
              <p key={idx}>
                • <strong className="text-white">[{alert.source_name}]</strong>: {alert.message}
              </p>
            ))}
          </div>
          <p className="pl-7 text-[11px] text-amber-400/80 italic">
            Catatan: Sistem menerapkan isolasi kegagalan spasial (graceful degradation). Lapisan lain tetap beroperasi tanpa down total.
          </p>
        </div>
      )}

      {/* Spatial Layers Health Matrix */}
      <div className="p-5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F59E0B]" />
              Status Kesehatan Lapisan Spasial PostGIS (Spatial Layers)
            </h2>
            <p className="text-xs text-[#8A8A8A]">
              Integritas query spasial, bounding box (ST_MakeEnvelope), dan spatial index (GIST).
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            SRID: 4326 (WGS 84)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(spatialLayersHealth).map(([layer, status]) => (
            <div
              key={layer}
              className="p-3.5 rounded-xl bg-[#212121] border border-[#2C2C2C] flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-mono text-white font-bold">{layer}</span>
                <p className="text-[11px] text-[#8A8A8A]">Spatial Index OK</p>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                  status === 'OPERATIONAL' || status === 'ONLINE'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Freshness Summary Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {['FRESH', 'DELAYED', 'STALE', 'UNAVAILABLE', 'SIMULATED', 'UNKNOWN'].map((state) => {
          const count = freshnessSummary[state] || 0;
          return (
            <div
              key={state}
              className="p-3.5 rounded-xl bg-[#161616] border border-[#2C2C2C] space-y-1 text-center"
            >
              <span className="text-[11px] font-mono font-bold text-[#8A8A8A] block">{state}</span>
              <div className="text-xl font-extrabold text-white">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Live Data Sources Feeds Table */}
      <div className="rounded-2xl bg-[#161616] border border-[#2C2C2C] overflow-hidden">
        <div className="p-5 border-b border-[#2C2C2C] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Satellite className="w-4 h-4 text-[#F59E0B]" />
              Katalog Feed Telemetri Sensor Terkoneksi
            </h2>
            <p className="text-xs text-[#8A8A8A]">
              Menampilkan timestamp observasi sensor lapangan, waktu penyerapan (fetched_at), dan ambang batas kesegaran.
            </p>
          </div>
          <span className="text-xs text-[#8A8A8A] font-mono">
            Total {sources.length} Feed Terdaftar
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#8A8A8A] space-y-2">
            <RefreshCw className="w-8 h-8 text-[#F59E0B] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#D4D4D4]">Memuat feed telemetri...</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2C2C2C]">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#212121] transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#212121] text-[#F59E0B] border border-amber-500/20">
                      {source.category}
                    </span>
                    <span className="text-xs font-mono text-[#8A8A8A]">{source.provider}</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {renderConnectivityBadge(source.connectivity_state)}
                      {renderProvenanceBadge(source.provenance_type, source.is_simulated)}
                      {renderFreshnessBadge(source.freshness_state)}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white">{source.name}</h3>

                  {source.freshness_info?.explanation && (
                    <p className="text-xs text-[#A3A3A3] italic">
                      {source.freshness_info.explanation}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-mono text-[#8A8A8A] self-start md:self-center">
                  <div>
                    <span className="block text-[10px] uppercase text-[#6B7280]">
                      Waktu Observasi
                    </span>
                    <span className="text-white">
                      {source.last_observed_at
                        ? new Date(source.last_observed_at).toLocaleTimeString('id-ID')
                        : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase text-[#6B7280]">
                      Waktu Penyerapan
                    </span>
                    <span className="text-white">
                      {source.last_fetched_at
                        ? new Date(source.last_fetched_at).toLocaleTimeString('id-ID')
                        : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase text-[#6B7280]">Interval</span>
                    <span className="text-[#F59E0B]">{source.sync_interval_minutes}m</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
