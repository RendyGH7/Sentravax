import React from 'react';
import { X, Activity, Waves, CloudLightning, Mountain, Anchor, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge, type DataFreshnessStatus } from '../ui/Badge';
import { SEVERITY_CONFIGS } from './map-config';
import type { UITheme } from '../ui/Button';

export interface MapLegendProps {
  isOpen: boolean;
  onClose: () => void;
  dataStatus?: DataFreshnessStatus;
  dataSourceName?: string;
  lastUpdated?: string;
  totalActiveEvents?: number;
  theme?: UITheme;
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  isOpen,
  onClose,
  dataStatus = 'LIVE',
  dataSourceName = 'BMKG & Telemetri Kebencanaan Nasional',
  lastUpdated,
  totalActiveEvents = 0,
  theme = 'light',
  className,
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div
      role="region"
      aria-label="Legenda Peta Kebencanaan"
      className={cn(
        'absolute z-20 w-72 sm:w-80 rounded-2xl border shadow-lg transition-all duration-200 overflow-hidden',
        isDark
          ? 'bg-[#161616]/95 border-[#2C2C2C] text-[#F5F5F5] backdrop-blur-md'
          : 'bg-white/95 border-[#E5E7EB] text-[#111827] backdrop-blur-md',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className="flex items-center gap-2">
          <Info className={cn('w-4 h-4', isDark ? 'text-[#F59E0B]' : 'text-[#047857]')} aria-hidden="true" />
          <h4 className="text-xs sm:text-sm font-bold tracking-tight">Legenda Peta Bencana</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup legenda"
          className={cn(
            'p-1 rounded-lg transition-colors cursor-pointer',
            isDark
              ? 'text-[#8A8A8A] hover:text-white hover:bg-[#212121]'
              : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
          )}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
        {/* Data Provenance & Telemetry Health */}
        <div className="space-y-1.5 pb-3 border-b border-inherit">
          <div className="flex items-center justify-between">
            <span className={cn('font-semibold', isDark ? 'text-[#D4D4D4]' : 'text-[#4B5563]')}>
              Status Data:
            </span>
            <Badge dataStatus={dataStatus} size="sm" theme={theme} />
          </div>
          <p className={cn('text-[11px] leading-tight', isDark ? 'text-[#8A8A8A]' : 'text-[#6B7280]')}>
            {dataSourceName}
          </p>
          {lastUpdated && (
            <p className={cn('text-[10px] font-mono', isDark ? 'text-[#8A8A8A]' : 'text-[#6B7280]')}>
              Pembaruan: {lastUpdated}
            </p>
          )}
        </div>

        {/* Tingkat Keparahan (Severity Levels) */}
        <div>
          <span className={cn('font-bold block mb-2', isDark ? 'text-[#D4D4D4]' : 'text-[#111827]')}>
            Tingkat Keparahan:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SEVERITY_CONFIGS).map(([key, config]) => (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-2 p-1.5 rounded-lg border',
                  isDark ? 'bg-[#212121]/50 border-[#2C2C2C]' : 'bg-[#F9FAFB] border-[#E5E7EB]'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: config.dotColor }}
                  aria-hidden="true"
                />
                <span className="font-medium text-[11px]">{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Jenis Bahaya yang Dipantau */}
        <div>
          <span className={cn('font-bold block mb-2', isDark ? 'text-[#D4D4D4]' : 'text-[#111827]')}>
            Kategori Bahaya:
          </span>
          <ul className="space-y-1.5 text-[11px]">
            <li className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-red-500 shrink-0" aria-hidden="true" />
              <span>Gempa Bumi</span>
            </li>
            <li className="flex items-center gap-2">
              <Waves className="w-3.5 h-3.5 text-sky-500 shrink-0" aria-hidden="true" />
              <span>Banjir dan Genangan</span>
            </li>
            <li className="flex items-center gap-2">
              <CloudLightning className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
              <span>Cuaca Ekstrem & Angin Kencang</span>
            </li>
            <li className="flex items-center gap-2">
              <Mountain className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
              <span>Tanah Longsor</span>
            </li>
            <li className="flex items-center gap-2">
              <Anchor className="w-3.5 h-3.5 text-teal-600 shrink-0" aria-hidden="true" />
              <span>Banjir Rob Pesisir</span>
            </li>
          </ul>
        </div>

        {/* Active Events Count */}
        <div
          className={cn(
            'p-2 rounded-xl text-center font-medium text-[11px] border',
            isDark ? 'bg-[#212121] border-[#2C2C2C] text-[#F5F5F5]' : 'bg-[#F3F4F6] border-[#E5E7EB] text-[#111827]'
          )}
        >
          Total Kejadian Aktif di Peta: <span className="font-bold font-mono">{totalActiveEvents}</span>
        </div>
      </div>
    </div>
  );
};

