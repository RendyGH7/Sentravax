import React from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Database,
  Radio,
  ShieldCheck,
  Cpu,
  Users,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import type { ConnectivityState, FreshnessState, ProvenanceType } from '../../types/admin';

interface BadgeProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export interface ConnectivityBadgeProps extends BadgeProps {
  state?: ConnectivityState | string;
}

export interface FreshnessBadgeProps extends BadgeProps {
  state?: FreshnessState | string;
}

export interface ProvenanceBadgeProps extends BadgeProps {
  type?: ProvenanceType | string;
  provenance?: ProvenanceType | string;
  isSimulated?: boolean;
}

export interface DataTrustGroupProps {
  connectivity?: ConnectivityState | string;
  freshness?: FreshnessState | string;
  provenance?: ProvenanceType | string;
  isSimulated?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showLabels?: boolean;
}

/**
 * Dimension A: Connectivity Badge (LIVE, STATIC, OFFLINE, UNKNOWN)
 */
export const ConnectivityBadge: React.FC<ConnectivityBadgeProps> = ({ state, size = 'sm', className = '' }) => {
  const normState = (state || 'UNKNOWN').toUpperCase();
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px] sm:text-[11px]';
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  switch (normState) {
    case 'LIVE':
      return (
        <span
          title="Dimensi A: Konektivitas LIVE (Terhubung langsung dengan streaming telemetri aktif)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Wifi className={iconSize} /> LIVE
        </span>
      );
    case 'STATIC':
      return (
        <span
          title="Dimensi A: Konektivitas STATIC (Baseline tersimpan lokal, pembaruan berkala non-stream)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 ${sizeClasses} ${className}`}
        >
          <Database className={iconSize} /> STATIC
        </span>
      );
    case 'OFFLINE':
      return (
        <span
          title="Dimensi A: Konektivitas OFFLINE (Koneksi jaringan eksternal dimatikan atau simulasi lokal)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800 ${sizeClasses} ${className}`}
        >
          <WifiOff className={iconSize} /> OFFLINE
        </span>
      );
    case 'UNKNOWN':
    default:
      return (
        <span
          title="Dimensi A: Konektivitas UNKNOWN (Status koneksi belum dapat dipastikan)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-zinc-900 text-zinc-500 border border-zinc-800 ${sizeClasses} ${className}`}
        >
          UNKNOWN
        </span>
      );
  }
};

/**
 * Dimension B: Freshness Badge (FRESH, DELAYED, STALE, UNAVAILABLE, UNKNOWN)
 */
export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({ state, size = 'sm', className = '' }) => {
  const normState = (state || 'UNKNOWN').toUpperCase();
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px] sm:text-[11px]';
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  switch (normState) {
    case 'FRESH':
      return (
        <span
          title="Dimensi B: Freshness FRESH (Stempel waktu observasi aktual dalam ambang toleransi)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className={iconSize} /> FRESH
        </span>
      );
    case 'DELAYED':
      return (
        <span
          title="Dimensi B: Freshness DELAYED (Observasi mengalami keterlambatan polling di atas ambang batas normal)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 ${sizeClasses} ${className}`}
        >
          <AlertTriangle className={iconSize} /> DELAYED
        </span>
      );
    case 'STALE':
      return (
        <span
          title="Dimensi B: Freshness STALE (Data usang melewati ambang toleransi, tidak mencerminkan kondisi menit ini)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 ${sizeClasses} ${className}`}
        >
          <AlertTriangle className={iconSize} /> STALE
        </span>
      );
    case 'UNAVAILABLE':
      return (
        <span
          title="Dimensi B: Freshness UNAVAILABLE (Sumber tidak tersedia, endpoint putus atau dinonaktifkan)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-red-950 text-red-400 border border-red-800 ${sizeClasses} ${className}`}
        >
          <XCircle className={iconSize} /> UNAVAILABLE
        </span>
      );
    case 'UNKNOWN':
    default:
      return (
        <span
          title="Dimensi B: Freshness UNKNOWN (Stempel waktu observasi tidak dapat diverifikasi)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 ${sizeClasses} ${className}`}
        >
          <Clock className={iconSize} /> UNKNOWN
        </span>
      );
  }
};

/**
 * Dimension C: Provenance Badge (OFFICIAL, OBSERVED, COMMUNITY_REPORT, SENTRAVAX_INSIGHT, SIMULATED, CURATED_REFERENCE)
 */
export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ type, provenance, isSimulated, size = 'sm', className = '' }) => {
  const normType = (provenance || type || '').toUpperCase();
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px] sm:text-[11px]';
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  if (isSimulated || normType === 'SIMULATED') {
    return (
      <span
        title="Dimensi C: Asal-Usul SIMULATED (Data simulasi terkurasi lokal, bukan telemetri sensor hidup)"
        className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 ${sizeClasses} ${className}`}
      >
        <Radio className={iconSize} /> SIMULATED
      </span>
    );
  }

  switch (normType) {
    case 'OFFICIAL':
      return (
        <span
          title="Dimensi C: Asal-Usul OFFICIAL (Diterbitkan oleh otoritas resmi BMKG/BNPB)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 ${sizeClasses} ${className}`}
        >
          <ShieldCheck className={iconSize} /> OFFICIAL
        </span>
      );
    case 'OBSERVED':
      return (
        <span
          title="Dimensi C: Asal-Usul OBSERVED (Data pengamatan instrumen fisik stasiun cuaca / radar BMKG)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 ${sizeClasses} ${className}`}
        >
          <Activity className={iconSize} /> OBSERVED
        </span>
      );
    case 'COMMUNITY_REPORT':
      return (
        <span
          title="Dimensi C: Asal-Usul COMMUNITY_REPORT (Laporan kejadian bencana terverifikasi dari warga)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/30 ${sizeClasses} ${className}`}
        >
          <Users className={iconSize} /> COMMUNITY_REPORT
        </span>
      );
    case 'SENTRAVAX_INSIGHT':
      return (
        <span
          title="Dimensi C: Asal-Usul SENTRAVAX_INSIGHT (Hasil sintesis analisis AI & Risk Engine SENTRAVAX)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-violet-500/15 text-violet-400 border border-violet-500/30 ${sizeClasses} ${className}`}
        >
          <Cpu className={iconSize} /> SENTRAVAX_INSIGHT
        </span>
      );
    case 'CURATED_REFERENCE':
    default:
      return (
        <span
          title="Dimensi C: Asal-Usul CURATED_REFERENCE (Dataset referensi statis terkurasi ilmiah seperti PVMBG/Copernicus)"
          className={`inline-flex items-center gap-1 font-mono font-bold rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 ${sizeClasses} ${className}`}
        >
          <BookOpen className={iconSize} /> CURATED_REFERENCE
        </span>
      );
  }
};

/**
 * Unified 3-Dimensional Data Trust Badge Group
 */
export const DataTrustGroup: React.FC<DataTrustGroupProps> = ({
  connectivity,
  freshness,
  provenance,
  isSimulated = false,
  size = 'sm',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {connectivity && <ConnectivityBadge state={connectivity} size={size} />}
      {provenance && <ProvenanceBadge type={provenance} isSimulated={isSimulated} size={size} />}
      {freshness && <FreshnessBadge state={freshness} size={size} />}
    </div>
  );
};
