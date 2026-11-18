import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../app/router/paths';
import { DisasterMap } from '../../components/map/DisasterMap';
import { intelligenceService } from '../../services/intelligence-service';
import type { IntelligenceOverviewData } from '../../types/intelligence';
import { 
  Layers, 
  Activity, 
  SendHorizontal, 
  BrainCircuit
} from 'lucide-react';

export const IntelligenceMapPage: React.FC = () => {
  const [overview, setOverview] = useState<IntelligenceOverviewData | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const data = await intelligenceService.getOverview();
        if (isMounted) {
          setOverview(data);
        }
      } catch (err) {
        console.error('Failed to load intelligence telemetry:', err);
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Intelligence Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B] text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Earth Intelligence Map — Multi-Hazard Analytical GIS
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Integrasi spasial multi-hazard PostGIS: Kejadian aktif, klaster laporan warga, shelter resmi, dan simulasi radius bahaya.
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            to={PATHS.INTELLIGENCE.RISK_ANALYSIS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Risk Engine</span>
          </Link>
          <Link
            to={PATHS.INTELLIGENCE.AI_INSIGHTS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Insights</span>
          </Link>
          <Link
            to={PATHS.INTELLIGENCE.ALERT_OPERATIONS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-xs"
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>Diseminasi CAP</span>
          </Link>
        </div>
      </div>

      {/* Operational Telemetry Banner */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] text-slate-200">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Ancaman Aktif</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {overview.metrics?.active_threats ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] text-slate-200">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Peringatan Berjalan</span>
            <div className="text-lg font-bold text-amber-400 mt-0.5">
              {overview.metrics?.active_cap_alerts ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] text-slate-200">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Laporan Warga Belum Verif</span>
            <div className="text-lg font-bold text-rose-400 mt-0.5">
              {overview.metrics?.unverified_reports ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] text-slate-200">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">AI Insights Dihasilkan</span>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">
              {overview.metrics?.proactive_insights_generated ?? 0}
            </div>
          </div>
        </div>
      )}

      {/* Embedded High-Performance DisasterMap */}
      <div className="rounded-2xl overflow-hidden border border-[#1E293B] shadow-lg relative min-h-[620px] bg-[#020617]">
        <DisasterMap
          theme="dark"
          height="650px"
          showControls={true}
          showFilters={true}
          showLegend={true}
        />
      </div>
    </div>
  );
};
