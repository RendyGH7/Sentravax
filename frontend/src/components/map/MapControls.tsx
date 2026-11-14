import React from 'react';
import { Plus, Minus, RotateCcw, Layers, List } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UITheme } from '../ui/Button';

export interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleLegend?: () => void;
  isLegendOpen?: boolean;
  onToggleList?: () => void;
  isListOpen?: boolean;
  hasListToggle?: boolean;
  theme?: UITheme;
  className?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleLegend,
  isLegendOpen = false,
  onToggleList,
  isListOpen = false,
  hasListToggle = false,
  theme = 'light',
  className,
}) => {
  const isDark = theme === 'dark';

  const btnBaseStyles = cn(
    'w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer shadow-xs select-none',
    'focus-visible:outline-none focus-visible:ring-2 active:scale-95',
    isDark
      ? 'bg-[#161616] border-[#2C2C2C] text-[#F5F5F5] hover:bg-[#212121] focus-visible:ring-[#F59E0B]'
      : 'bg-white border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB] focus-visible:ring-[#047857]'
  );

  return (
    <div
      className={cn('flex flex-col gap-2 z-10 pointer-events-auto', className)}
      role="toolbar"
      aria-label="Kontrol Navigasi Peta"
    >
      {/* Zoom In & Zoom Out Group */}
      <div className="flex flex-col rounded-xl overflow-hidden shadow-xs border border-inherit">
        <button
          type="button"
          onClick={onZoomIn}
          aria-label="Perbesar peta (Zoom in)"
          title="Perbesar peta"
          className={cn(
            btnBaseStyles,
            'rounded-b-none border-b-0'
          )}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Perkecil peta (Zoom out)"
          title="Perkecil peta"
          className={cn(
            btnBaseStyles,
            'rounded-t-none'
          )}
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Reset to Indonesia Archipelago Center */}
      <button
        type="button"
        onClick={onResetView}
        aria-label="Pusatkan kembali ke seluruh Indonesia"
        title="Pusatkan kembali (Seluruh Indonesia)"
        className={btnBaseStyles}
      >
        <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
      </button>

      {/* Toggle Legend Button */}
      {onToggleLegend && (
        <button
          type="button"
          onClick={onToggleLegend}
          aria-label={isLegendOpen ? 'Tutup legenda peta' : 'Buka legenda peta'}
          aria-expanded={isLegendOpen}
          title="Legenda peta"
          className={cn(
            btnBaseStyles,
            isLegendOpen && (isDark ? 'border-[#F59E0B] text-[#F59E0B]' : 'border-[#047857] text-[#047857]')
          )}
        >
          <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
        </button>
      )}

      {/* Toggle Event List / Drawer Button */}
      {hasListToggle && onToggleList && (
        <button
          type="button"
          onClick={onToggleList}
          aria-label={isListOpen ? 'Sembunyikan daftar kejadian' : 'Tampilkan daftar kejadian'}
          aria-expanded={isListOpen}
          title="Daftar kejadian"
          className={cn(
            btnBaseStyles,
            isListOpen && (isDark ? 'border-[#F59E0B] text-[#F59E0B]' : 'border-[#047857] text-[#047857]')
          )}
        >
          <List className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

