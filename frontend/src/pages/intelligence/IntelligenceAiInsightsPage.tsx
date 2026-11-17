import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Clock,
  Compass,
  CheckSquare,
  XCircle,
  UserCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Camera,
  ShieldCheck,
  Flame,
  Info,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { intelligenceService } from '../../services/intelligence-service';
import type {
  ProactiveAiInsightItem,
  CommunityReportQueueItem,
  HazardTypeItem,
  RegionItem,
  AiInsightEvidence,
  ReportVerificationAuditItem,
} from '../../types/intelligence';

export const IntelligenceAiInsightsPage: React.FC = () => {
  // Navigation tabs between AI Insights and Verification Queue
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'insights' | 'queue'>('insights');

  // Common metadata
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // STATE: TAB 1 (AI PROACTIVE INSIGHTS)
  // ==========================================
  const [insights, setInsights] = useState<ProactiveAiInsightItem[]>([]);
  const [activeInsight, setActiveInsight] = useState<ProactiveAiInsightItem | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<number | ''>('');
  const [selectedHazardId, setSelectedHazardId] = useState<number | ''>('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [insightHazardFilter, setInsightHazardFilter] = useState<string>('all');
  const [searchInsightQuery, setSearchInsightQuery] = useState('');

  // ==========================================
  // STATE: TAB 2 (VERIFICATION QUEUE)
  // ==========================================
  const [reports, setReports] = useState<CommunityReportQueueItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<CommunityReportQueueItem | null>(null);
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('all');
  const [queueHazardFilter, setQueueHazardFilter] = useState<string>('all');
  const [searchReportQuery, setSearchReportQuery] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [moderationNotes, setModerationNotes] = useState('');
  const [expandedDuplicateInfo, setExpandedDuplicateInfo] = useState(false);

  // ==========================================
  // INITIAL DATA LOADING
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const loadWorkspaceData = async () => {
      try {
        const [regionsRes, hazardsRes, insightsRes, reportsRes] = await Promise.all([
          intelligenceService.getRegions(),
          intelligenceService.getHazardTypes(),
          intelligenceService.getInsights({ limit: 50 }),
          intelligenceService.getReportsQueue({ status: 'all', per_page: 50 }),
        ]);

        if (!isMounted) return;

        setRegions(regionsRes);
        setHazardTypes(hazardsRes);
        setInsights(insightsRes);
        if (insightsRes.length > 0) {
          setActiveInsight(insightsRes[0]);
        }

        setReports(reportsRes.data);
        if (reportsRes.data.length > 0) {
          setSelectedReport(reportsRes.data[0]);
        }

        setSelectedRegionId((prev) => (prev === '' && regionsRes.length > 0 ? regionsRes[0].id : prev));
        setSelectedHazardId((prev) => (prev === '' && hazardsRes.length > 0 ? hazardsRes[0].id : prev));
      } catch {
        if (!isMounted) return;
        toast.error('Gagal memuat data workspace intelijen.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadWorkspaceData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // ACTIONS: GENERATE PROACTIVE INSIGHT
  // ==========================================
  const handleGenerateInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegionId || !selectedHazardId) {
      toast.warning('Pilih wilayah pilot dan jenis bahaya terlebih dahulu.');
      return;
    }

    setIsGeneratingInsight(true);
    try {
      const newInsight = await intelligenceService.generateInsight({
        region_id: Number(selectedRegionId),
        hazard_type_id: Number(selectedHazardId),
      });

      setInsights((prev) => {
        const filtered = prev.filter((item) => item.id !== newInsight.id);
        return [newInsight, ...filtered];
      });
      setActiveInsight(newInsight);
      toast.success('AI Proactive Insight berhasil dihasilkan secara deterministik.');
    } catch {
      toast.error('Gagal memproses inferensi AI Proaktif.');
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  // ==========================================
  // ACTIONS: VERIFY / INVESTIGATE / REJECT REPORT
  // ==========================================
  const handleReportAction = async (status: 'investigating' | 'verified' | 'rejected') => {
    if (!selectedReport) return;

    if (status === 'rejected' && !moderationNotes.trim()) {
      toast.warning('Wajib mencantumkan catatan/alasan saat menolak laporan masyarakat.');
      return;
    }

    setIsProcessingAction(true);
    try {
      const updated = await intelligenceService.verifyReport(selectedReport.id, {
        status,
        notes: moderationNotes.trim() ? moderationNotes.trim() : null,
      });

      // Update in reports list
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedReport(updated);
      setModerationNotes('');

      const label = status === 'verified' ? 'terverifikasi' : status === 'rejected' ? 'ditolak' : 'sedang ditinjau';
      toast.success(`Laporan #${updated.id} berhasil ditandai sebagai ${label}.`);
    } catch {
      toast.error('Gagal memperbarui status laporan masyarakat.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ==========================================
  // HELPERS & BADGES
  // ==========================================
  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  const renderConfidenceBadge = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'INSUFFICIENT_DATA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-stone-900 text-stone-400 border border-stone-700">
            <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
            BUKTI TIDAK MENCUKUPI (INSUFFICIENT_DATA)
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            KEKUATAN BUKTI TINGGI (HIGH)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-500/50">
            <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
            KEKUATAN BUKTI SEDANG (MEDIUM)
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-[#212121] text-[#A3A3A3] border border-[#383838]">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            KEKUATAN BUKTI AWAL (LOW)
          </span>
        );
    }
  };

  const renderPriorityBadge = (level?: string, score?: number) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-500/50">
            <Flame className="w-3 h-3 text-rose-400" />
            KRITIS ({score ?? 80})
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-950/80 text-[#F59E0B] border border-amber-500/50">
            <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />
            TINGGI ({score ?? 60})
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-[#212121] text-amber-200 border border-amber-400/40">
            <AlertCircle className="w-3 h-3 text-amber-300" />
            SEDANG ({score ?? 40})
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-[#212121] text-[#10B981] border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
            RENDAH ({score ?? 20})
          </span>
        );
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/80 text-[#10B981] border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" />
            TERVERIFIKASI
          </span>
        );
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-950/80 text-[#F59E0B] border border-amber-500/40">
            <Clock className="w-3 h-3 animate-pulse" />
            SEDANG DITINJAU
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3 h-3" />
            DITOLAK
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#212121] text-[#A3A3A3] border border-[#383838]">
            <Clock className="w-3 h-3" />
            MENUNGGU
          </span>
        );
    }
  };

  // Filtered lists
  const filteredInsights = insights.filter((inItem) => {
    const matchesHazard = insightHazardFilter === 'all' || inItem.hazard_type?.slug === insightHazardFilter;
    const matchesQuery =
      !searchInsightQuery.trim() ||
      inItem.title.toLowerCase().includes(searchInsightQuery.toLowerCase()) ||
      (inItem.region?.name || '').toLowerCase().includes(searchInsightQuery.toLowerCase());
    return matchesHazard && matchesQuery;
  });

  const filteredReports = reports.filter((rep) => {
    const matchesStatus = queueStatusFilter === 'all' || rep.status === queueStatusFilter;
    const matchesHazard = queueHazardFilter === 'all' || rep.hazard_type?.slug === queueHazardFilter;
    const matchesQuery =
      !searchReportQuery.trim() ||
      rep.title.toLowerCase().includes(searchReportQuery.toLowerCase()) ||
      rep.description.toLowerCase().includes(searchReportQuery.toLowerCase()) ||
      (rep.region?.name || '').toLowerCase().includes(searchReportQuery.toLowerCase());
    return matchesStatus && matchesHazard && matchesQuery;
  });

  const parsedEvidence: AiInsightEvidence | null = (activeInsight?.evidence as AiInsightEvidence) ?? null;

  // ==========================================
  // RENDER: LOADING SKELETON
  // ==========================================
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat workspace proaktif...">
        <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] h-28"></div>
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
          1. HEADER & DUAL-WORKSPACE TAB SELECTOR
          ========================================== */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-mono uppercase text-[#F59E0B] font-bold tracking-wide">
              KECERDASAN PROAKTIF & VERIFIKASI INTELIJEN
            </span>
            <span className="text-[#8A8A8A] font-mono">| Human-in-the-Loop Workflow</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#212121] text-[#D4D4D4] border border-[#2C2C2C]">
              v1.0-explainable-deterministic
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
            Workspace Analisis Proaktif & Triase Laporan Masyarakat
          </h1>
          <p className="text-xs sm:text-sm text-[#D4D4D4] max-w-3xl">
            Sistem inferensi deterministik transparan multi-sumber untuk deteksi eskalasi bahaya, analisis pola spasiotemporal, dan meja verifikasi audit trail laporan warga.
          </p>
        </div>

        {/* Workspace Switcher Pills */}
        <div className="flex items-center gap-2 bg-[#212121] p-1.5 rounded-xl border border-[#2C2C2C] self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveWorkspaceTab('insights')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeWorkspaceTab === 'insights'
                ? 'bg-[#F59E0B] text-[#0C0C0C] shadow-xs'
                : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>AI Proactive Insights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspaceTab('queue')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeWorkspaceTab === 'queue'
                ? 'bg-[#F59E0B] text-[#0C0C0C] shadow-xs'
                : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verification Queue</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#161616] text-[#F59E0B] border border-amber-500/30">
              {reports.filter((r) => r.status === 'pending').length}
            </span>
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: AI PROACTIVE INSIGHTS WORKSPACE
          ========================================== */}
      {activeWorkspaceTab === 'insights' && (
        <div className="space-y-6">
          {/* Generation Console Card */}
          <form
            onSubmit={handleGenerateInsight}
            className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#2C2C2C] pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#F59E0B]" />
                <h2 className="text-base font-bold text-[#FFFFFF]">Konsol Inferensi Intelijen Proaktif</h2>
              </div>
              <span className="text-[11px] font-mono text-[#8A8A8A]">
                Model: Explainable Deterministic Multi-Hazard Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Region Select */}
              <div className="space-y-1.5">
                <label htmlFor="insight-region" className="block text-xs font-semibold text-[#D4D4D4]">
                  Wilayah Pilot Target <span className="text-rose-400">*</span>
                </label>
                <select
                  id="insight-region"
                  value={selectedRegionId}
                  onChange={(e) => setSelectedRegionId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#212121] border border-[#383838] text-xs text-[#FFFFFF] focus:outline-hidden focus:border-[#F59E0B]"
                  required
                >
                  <option value="" disabled>Pilih wilayah...</option>
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name} ({reg.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hazard Select */}
              <div className="space-y-1.5">
                <label htmlFor="insight-hazard" className="block text-xs font-semibold text-[#D4D4D4]">
                  Fokus Jenis Bahaya <span className="text-rose-400">*</span>
                </label>
                <select
                  id="insight-hazard"
                  value={selectedHazardId}
                  onChange={(e) => setSelectedHazardId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#212121] border border-[#383838] text-xs text-[#FFFFFF] focus:outline-hidden focus:border-[#F59E0B]"
                  required
                >
                  <option value="" disabled>Pilih jenis bahaya...</option>
                  {hazardTypes.map((ht) => (
                    <option key={ht.id} value={ht.id}>
                      {ht.name} ({ht.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isGeneratingInsight || !selectedRegionId || !selectedHazardId}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-[#383838] disabled:text-[#888888] text-[#0C0C0C] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  {isGeneratingInsight ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengalkulasi Inferensi AI...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4 text-[#0C0C0C]" />
                      <span>Jalankan Analisis Proaktif</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Active Insight Hero Showcase */}
          {activeInsight ? (
            <div className="p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2C2C2C] pb-5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#212121] text-[#F59E0B] border border-amber-500/30 font-bold">
                      HASIL ANALISIS PROAKTIF AKTIF
                    </span>
                    <span className="text-xs text-[#D4D4D4] font-medium">
                      {activeInsight.region?.name} — {activeInsight.hazard_type?.name}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#FFFFFF]">
                    {activeInsight.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2.5">
                  {renderConfidenceBadge(parsedEvidence?.confidence_level || 'HIGH')}
                </div>
              </div>

              {/* Threat Escalation Alert Banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                parsedEvidence?.threat_escalation?.level === 'CRITICAL'
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                  : parsedEvidence?.threat_escalation?.level === 'ELEVATED'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : parsedEvidence?.threat_escalation?.level === 'INVESTIGATION_SIGNAL'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  : parsedEvidence?.threat_escalation?.level === 'DATA_UNAVAILABLE'
                  ? 'bg-stone-900 border-stone-700 text-stone-300'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              }`}>
                <div className="flex items-start gap-3">
                  <Flame className={`w-5 h-5 shrink-0 mt-0.5 ${
                    parsedEvidence?.threat_escalation?.level === 'CRITICAL'
                      ? 'text-rose-400'
                      : parsedEvidence?.threat_escalation?.level === 'ELEVATED' || parsedEvidence?.threat_escalation?.level === 'INVESTIGATION_SIGNAL'
                      ? 'text-[#F59E0B]'
                      : parsedEvidence?.threat_escalation?.level === 'DATA_UNAVAILABLE'
                      ? 'text-stone-400'
                      : 'text-[#10B981]'
                  }`} />
                  <div>
                    <div className="text-xs font-mono uppercase font-bold tracking-wider">
                      STATUS ESKALASI ANCAMAN: {parsedEvidence?.threat_escalation?.level || 'ELEVATED'}
                    </div>
                    <ul className="text-xs text-[#D4D4D4] space-y-1 mt-1 list-disc list-inside">
                      {parsedEvidence?.threat_escalation?.triggers?.map((trig, idx) => (
                        <li key={idx}>{trig}</li>
                      )) || <li>Aktivitas pemantauan stabil dalam batas normal.</li>}
                    </ul>
                  </div>
                </div>

                <div className="text-right shrink-0 text-[11px] font-mono text-[#8A8A8A]">
                  Waktu Analisis: {formatTimestamp(activeInsight.created_at)}
                </div>
              </div>

              {/* Summary Description Box */}
              <div className="p-4 rounded-xl bg-[#212121] border border-[#2C2C2C] space-y-2">
                <span className="text-xs font-mono uppercase text-[#F59E0B] font-bold block">
                  Ringkasan Situasi Dinamika Geospasial
                </span>
                <p className="text-xs sm:text-sm text-[#FFFFFF] leading-relaxed">
                  {activeInsight.summary}
                </p>
                <div className="text-[11px] text-[#A3A3A3] pt-1 border-t border-[#2C2C2C] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Basis Keyakinan: {parsedEvidence?.confidence_basis || 'Korelasi terverifikasi multi-sumber data.'}</span>
                </div>
              </div>

              {/* Supporting Indicators Grid */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold block">
                  Indikator Bukti Pendukung Analisis
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {parsedEvidence?.indicators?.map((ind, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#212121] border border-[#2C2C2C] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#8A8A8A] block truncate">{ind.name}</span>
                      <div className="text-lg font-bold text-[#FFFFFF] font-mono">
                        {ind.value} <span className="text-[11px] font-normal text-[#8A8A8A]">{ind.unit}</span>
                      </div>
                    </div>
                  )) || (
                    <div className="col-span-5 text-xs text-[#8A8A8A] p-2">Indikator data belum terpetakan.</div>
                  )}
                </div>
              </div>

              {/* Actionable Recommendations Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-[#F59E0B] font-bold block">
                  Rekomendasi Tindakan Mitigasi Terstruktur
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeInsight.recommendations.map((rec, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-3.5 rounded-xl bg-[#212121]/60 border border-[#2C2C2C] flex items-start gap-2.5 text-xs text-[#E5E5E5] leading-relaxed"
                    >
                      <CheckSquare className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodology & Non-Auto-Broadcast Disclaimer */}
              <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2C2C2C] text-[11px] text-[#8A8A8A] space-y-1">
                <div className="font-bold text-[#D4D4D4] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Kepatuhan Human-in-the-Loop & Integritas Rekomendasi:</span>
                </div>
                <p>
                  Seluruh rekomendasi yang dihasilkan merupakan saran analitis pendukung keputusan petugas. Sistem <strong>tidak akan pernah menerbitkan peringatan resmi (CAP) atau menyiarkan broadcast ke publik secara otomatis</strong> tanpa verifikasi dan persetujuan eksplisit petugas intelijen yang berwenang.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-center space-y-2">
              <BrainCircuit className="w-8 h-8 text-[#8A8A8A] mx-auto" />
              <div className="text-sm font-bold text-[#FFFFFF]">Belum ada AI Proactive Insight yang dipilih</div>
              <p className="text-xs text-[#8A8A8A] max-w-md mx-auto">
                Pilih wilayah dan jenis bahaya di atas, lalu jalankan analisis proaktif untuk menghasilkan wawasan mitigasi.
              </p>
            </div>
          )}

          {/* Historical Insights Cards Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2C2C2C] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#FFFFFF]">
                  Daftar Wawasan Intelijen Proaktif Terkini ({insights.length})
                </h3>
                <p className="text-xs text-[#8A8A8A]">
                  Wawasan analitis deterministik yang tersimpan pada basis data aktual.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInsightQuery}
                  onChange={(e) => setSearchInsightQuery(e.target.value)}
                  placeholder="Cari wawasan..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#212121] border border-[#383838] text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-hidden focus:border-[#F59E0B]"
                />
              </div>
            </div>

            {/* Hazard Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setInsightHazardFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  insightHazardFilter === 'all'
                    ? 'bg-[#F59E0B] text-[#0C0C0C]'
                    : 'bg-[#212121] text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
              >
                Semua Bahaya ({insights.length})
              </button>
              {hazardTypes.map((ht) => (
                <button
                  key={ht.slug}
                  type="button"
                  onClick={() => setInsightHazardFilter(ht.slug)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    insightHazardFilter === ht.slug
                      ? 'bg-[#F59E0B] text-[#0C0C0C]'
                      : 'bg-[#212121] text-[#8A8A8A] hover:text-[#FFFFFF]'
                  }`}
                >
                  {ht.name}
                </button>
              ))}
            </div>

            {/* Insights Table */}
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#2C2C2C] text-[#8A8A8A] font-mono uppercase text-[11px]">
                    <th className="py-3 px-3">Judul Wawasan</th>
                    <th className="py-3 px-3">Wilayah</th>
                    <th className="py-3 px-3">Bahaya</th>
                    <th className="py-3 px-3">Tingkat Keyakinan</th>
                    <th className="py-3 px-3">Waktu Analisis</th>
                    <th className="py-3 px-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212121]">
                  {filteredInsights.length > 0 ? (
                    filteredInsights.map((inItem) => (
                      <tr key={inItem.id} className="hover:bg-[#212121]/50 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#FFFFFF] max-w-xs truncate">
                          {inItem.title}
                        </td>
                        <td className="py-3 px-3 text-[#D4D4D4]">
                          {inItem.region?.name || '-'}
                        </td>
                        <td className="py-3 px-3 text-[#D4D4D4]">
                          {inItem.hazard_type?.name || '-'}
                        </td>
                        <td className="py-3 px-3">
                          {renderConfidenceBadge((inItem.evidence as AiInsightEvidence)?.confidence_level || 'HIGH')}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#8A8A8A]">
                          {formatTimestamp(inItem.created_at)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveInsight(inItem);
                              window.scrollTo({ top: 180, behavior: 'smooth' });
                              toast.info(`Memuat detail wawasan: ${inItem.title}`);
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
                      <td colSpan={6} className="py-6 text-center text-[#8A8A8A]">
                        Tidak ada wawasan yang cocok dengan kriteria filter saat ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: VERIFICATION QUEUE & TRIAGE DESK
          ========================================== */}
      {activeWorkspaceTab === 'queue' && (
        <div className="space-y-6">
          {/* Queue Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-1">
              <span className="text-[11px] font-mono uppercase text-[#8A8A8A] font-semibold">Menunggu Verifikasi</span>
              <div className="text-2xl font-extrabold text-[#F59E0B] font-mono">
                {reports.filter((r) => r.status === 'pending').length}
              </div>
              <p className="text-[10px] text-[#8A8A8A]">Laporan baru masuk antrean triase.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-1">
              <span className="text-[11px] font-mono uppercase text-[#8A8A8A] font-semibold">Sedang Ditinjau</span>
              <div className="text-2xl font-extrabold text-amber-300 font-mono">
                {reports.filter((r) => r.status === 'investigating').length}
              </div>
              <p className="text-[10px] text-[#8A8A8A]">Proses validasi lapangan & CCTV.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-1">
              <span className="text-[11px] font-mono uppercase text-[#8A8A8A] font-semibold">Terverifikasi</span>
              <div className="text-2xl font-extrabold text-[#10B981] font-mono">
                {reports.filter((r) => r.status === 'verified').length}
              </div>
              <p className="text-[10px] text-[#8A8A8A]">Terkonfirmasi menjadi data valid.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-1">
              <span className="text-[11px] font-mono uppercase text-[#8A8A8A] font-semibold">Ditolak</span>
              <div className="text-2xl font-extrabold text-rose-400 font-mono">
                {reports.filter((r) => r.status === 'rejected').length}
              </div>
              <p className="text-[10px] text-[#8A8A8A]">Laporan tidak terbukti / spam.</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#161616] border border-[#2C2C2C] flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'all', label: 'Semua Status' },
                { id: 'pending', label: 'Menunggu (Pending)' },
                { id: 'investigating', label: 'Sedang Ditinjau' },
                { id: 'verified', label: 'Terverifikasi' },
                { id: 'rejected', label: 'Ditolak' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setQueueStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    queueStatusFilter === st.id
                      ? 'bg-[#F59E0B] text-[#0C0C0C]'
                      : 'bg-[#212121] text-[#8A8A8A] hover:text-[#FFFFFF]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Search Box & Hazard Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={queueHazardFilter}
                onChange={(e) => setQueueHazardFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#212121] border border-[#383838] text-xs text-[#FFFFFF] focus:outline-hidden focus:border-[#F59E0B] cursor-pointer"
              >
                <option value="all">Semua Bahaya</option>
                {hazardTypes.map((ht) => (
                  <option key={ht.slug} value={ht.slug}>
                    {ht.name}
                  </option>
                ))}
              </select>

              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchReportQuery}
                  onChange={(e) => setSearchReportQuery(e.target.value)}
                  placeholder="Cari laporan..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#212121] border border-[#383838] text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-hidden focus:border-[#F59E0B]"
                />
              </div>
            </div>
          </div>

          {/* Dual Pane Layout (Queue List on Left, Triage & Verification Desk on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT PANE: Queue List (Col 5) */}
            <div className="lg:col-span-5 space-y-3 min-w-0">
              <div className="flex items-center justify-between text-xs text-[#8A8A8A] px-1">
                <span>Daftar Laporan ({filteredReports.length})</span>
                <span>Urutkan: Prioritas & Terbaru</span>
              </div>

              {filteredReports.length > 0 ? (
                filteredReports.map((reportItem) => {
                  const isSelected = selectedReport?.id === reportItem.id;
                  const isDup = reportItem.duplicate_detection?.is_duplicate_suspect;

                  return (
                    <div
                      key={reportItem.id}
                      onClick={() => setSelectedReport(reportItem)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-[#212121] border-[#F59E0B] shadow-sm'
                          : 'bg-[#161616] border-[#2C2C2C] hover:border-[#383838]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {renderPriorityBadge(reportItem.priority_level, reportItem.priority_score)}
                          {isDup && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                              DUPLIKAT
                            </span>
                          )}
                        </div>
                        {renderStatusBadge(reportItem.status)}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-[#FFFFFF] line-clamp-1">
                          #{reportItem.id} — {reportItem.title}
                        </h4>
                        <p className="text-xs text-[#A3A3A3] line-clamp-2 leading-relaxed">
                          {reportItem.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#8A8A8A] border-t border-[#262626] pt-2">
                        <span>{reportItem.region?.name || 'Wilayah Umum'}</span>
                        <span>{formatTimestamp(reportItem.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-center space-y-2">
                  <CheckSquare className="w-8 h-8 text-[#8A8A8A] mx-auto" />
                  <div className="text-sm font-bold text-[#FFFFFF]">Tidak ada laporan dalam filter ini</div>
                  <p className="text-xs text-[#8A8A8A]">
                    Semua laporan untuk status ini telah selesai diproses atau belum ada data masuk.
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT PANE: Detail & Human-in-the-Loop Action Desk (Col 7) */}
            <div className="lg:col-span-7 min-w-0">
              {selectedReport ? (
                <div className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-[#2C2C2C] shadow-sm space-y-6">
                  {/* Report Header */}
                  <div className="border-b border-[#2C2C2C] pb-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#F59E0B] font-bold">
                          LAPORAN #{selectedReport.id}
                        </span>
                        <span className="text-xs text-[#8A8A8A]">|</span>
                        <span className="text-xs text-[#D4D4D4] font-medium">
                          {selectedReport.hazard_type?.name}
                        </span>
                      </div>
                      {renderStatusBadge(selectedReport.status)}
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-[#FFFFFF]">
                      {selectedReport.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#8A8A8A]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                        {selectedReport.region?.name || 'Wilayah Umum'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#8A8A8A]" />
                        {formatTimestamp(selectedReport.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-[#10B981]" />
                        Pelapor: {selectedReport.user?.name || 'Warga Terverifikasi'}
                      </span>
                    </div>
                  </div>

                  {/* Intelligent Prioritization Box */}
                  <div className="p-4 rounded-xl bg-[#212121] border border-[#2C2C2C] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-[#F59E0B] font-bold">
                        Analisis Prioritas Triase Cerdas
                      </span>
                      {renderPriorityBadge(selectedReport.priority_level, selectedReport.priority_score)}
                    </div>
                    <ul className="text-xs text-[#D4D4D4] space-y-1 list-disc list-inside">
                      {selectedReport.priority_reasons?.map((rea, rI) => (
                        <li key={rI}>{rea}</li>
                      )) || <li>Laporan standar dalam radius pengawasan regional.</li>}
                    </ul>
                    <div className="text-[10px] font-mono text-[#8A8A8A] pt-1 border-t border-[#2C2C2C]">
                      Catatan: Skor prioritas menentukan kecepatan respons triase, bukan probabilitas kebenaran laporan.
                    </div>
                  </div>

                  {/* Duplicate Detection Inspector */}
                  {selectedReport.duplicate_detection?.is_duplicate_suspect && (
                    <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-amber-300">
                        <div className="flex items-center gap-2 font-bold font-mono uppercase">
                          <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                          <span>Terdeteksi Klaster Laporan Berdekatan (Spasiotemporal)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedDuplicateInfo(!expandedDuplicateInfo)}
                          className="text-xs text-[#F59E0B] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{expandedDuplicateInfo ? 'Tutup' : 'Lihat Detail'}</span>
                          {expandedDuplicateInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <p className="text-xs text-[#D4D4D4]">
                        Ditemukan {selectedReport.duplicate_detection.nearby_count} laporan lain untuk jenis bencana yang sama dalam radius 1.5 km dan kurun waktu 6 jam (ID Klaster: <code className="text-[#F59E0B] font-mono">{selectedReport.duplicate_detection.cluster_id || 'cluster_auto'}</code>). Keputusan penggabungan tetap berada pada petugas intelijen.
                      </p>

                      {expandedDuplicateInfo && selectedReport.duplicate_detection.candidates && (
                        <div className="space-y-1.5 pt-2 border-t border-amber-500/20">
                          <span className="text-[11px] font-mono text-[#8A8A8A] uppercase font-bold">Laporan Terkait Dalam Klaster:</span>
                          <div className="space-y-1">
                            {selectedReport.duplicate_detection.candidates.map((cand) => (
                              <div key={cand.id} className="text-xs p-2 rounded-lg bg-[#212121] border border-[#2C2C2C] flex items-center justify-between">
                                <span className="font-medium text-[#FFFFFF]">#{cand.id} — {cand.title}</span>
                                <span className="text-[10px] font-mono text-[#8A8A8A]">{cand.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Report Narrative & Media */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase text-[#8A8A8A] font-semibold block">
                      Deskripsi Lapangan Dari Warga
                    </span>
                    <div className="p-4 rounded-xl bg-[#212121] border border-[#2C2C2C] text-xs sm:text-sm text-[#FFFFFF] leading-relaxed">
                      {selectedReport.description}
                    </div>
                  </div>

                  {/* Coordinates & Attachment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#212121] border border-[#2C2C2C] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#8A8A8A]">Koordinat Titik PostGIS</span>
                      <div className="font-mono font-bold text-[#FFFFFF]">
                        {selectedReport.latitude?.toFixed(5) ?? '-6.20880'}, {selectedReport.longitude?.toFixed(5) ?? '106.84560'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#212121] border border-[#2C2C2C] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#8A8A8A]">Lampiran Dokumentasi</span>
                      <div className="flex items-center gap-1.5 font-bold text-[#FFFFFF]">
                        <Camera className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{selectedReport.photo_path ? '1 Foto Lapangan Tersedia' : 'Tidak Ada Foto Lapangan'}</span>
                      </div>
                    </div>
                  </div>

                  {/* HUMAN-IN-THE-LOOP ACTION DESK */}
                  <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2C2C2C] space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#2C2C2C] pb-2">
                      <UserCheck className="w-4 h-4 text-[#F59E0B]" />
                      <h3 className="text-xs font-mono uppercase font-bold text-[#FFFFFF]">
                        Meja Keputusan Verifikasi Petugas (Human-in-the-Loop)
                      </h3>
                    </div>

                    {/* Internal Notes Input */}
                    <div className="space-y-1.5">
                      <label htmlFor="moderation-notes" className="block text-xs font-semibold text-[#D4D4D4]">
                        Catatan Internal / Dasar Verifikasi Intelijen
                      </label>
                      <textarea
                        id="moderation-notes"
                        rows={2}
                        value={moderationNotes}
                        onChange={(e) => setModerationNotes(e.target.value)}
                        placeholder="Contoh: Korelasi sensor PVMBG dan rekaman CCTV stasiun terdekat mengonfirmasi anomali genangan."
                        className="w-full px-3.5 py-2 rounded-xl bg-[#212121] border border-[#383838] text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-hidden focus:border-[#F59E0B]"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {/* Mark as Investigating */}
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={() => handleReportAction('investigating')}
                        className="px-4 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2C2C2C] text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Tandai Sedang Ditinjau
                      </button>

                      {/* Verify */}
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={() => handleReportAction('verified')}
                        className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0C0C0C] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        Verifikasi Laporan
                      </button>

                      {/* Reject */}
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={() => handleReportAction('rejected')}
                        className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Tolak Laporan
                      </button>
                    </div>
                  </div>

                  {/* IMMUTABLE AUDIT TRAIL TIMELINE */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#8A8A8A] font-bold">
                      <History className="w-4 h-4 text-[#F59E0B]" />
                      <span>Riwayat Tindakan & Jejak Audit (Audit Trail)</span>
                    </div>

                    {selectedReport.verifications && selectedReport.verifications.length > 0 ? (
                      <div className="space-y-2">
                        {selectedReport.verifications.map((verif: ReportVerificationAuditItem) => (
                          <div
                            key={verif.id}
                            className="p-3 rounded-xl bg-[#212121]/60 border border-[#2C2C2C] space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between text-[#8A8A8A] font-mono text-[11px]">
                              <span>Oleh: <strong className="text-[#FFFFFF]">{verif.verifier?.name || 'Petugas Intelijen'}</strong> ({verif.verifier?.role || 'intelligence'})</span>
                              <span>{formatTimestamp(verif.created_at)}</span>
                            </div>
                            <div className="text-[#D4D4D4]">
                              Status diubah dari <code className="text-amber-300">{verif.previous_status}</code> menjadi <code className="text-[#10B981] font-bold">{verif.new_status}</code>.
                            </div>
                            {verif.notes && (
                              <p className="text-[#A3A3A3] text-[11px] italic pt-1 border-t border-[#2C2C2C]">
                                Catatan: &ldquo;{verif.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#212121]/40 border border-[#2C2C2C] text-xs text-[#8A8A8A]">
                        Belum ada riwayat tindakan verifikasi sebelumnya.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-[#8A8A8A] mx-auto" />
                  <div className="text-sm font-bold text-[#FFFFFF]">Pilih laporan dari antrean untuk memulai triase</div>
                  <p className="text-xs text-[#8A8A8A]">
                    Klik salah satu kartu laporan pada panel sebelah kiri untuk meninjau detail dan menentukan tindakan verifikasi.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
