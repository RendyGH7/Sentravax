import React from 'react';
import { Plus, Minus, RotateCcw, Layers, List, Shield, Info, Check, Globe, Mountain, Moon, Map as MapIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UITheme } from '../ui/Button';
import { BASEMAP_STYLES, type BasemapStyle } from './map-config';

export interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleLegend?: () => void;
  isLegendOpen?: boolean;
  onToggleList?: () => void;
  isListOpen?: boolean;
  hasListToggle?: boolean;
  onToggleShelters?: () => void;
  isSheltersOpen?: boolean;
  currentBasemap?: BasemapStyle;
  onSelectBasemap?: (style: BasemapStyle) => void;
  isBasemapMenuOpen?: boolean;
  onToggleBasemapMenu?: () => void;
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
  onToggleShelters,
  isSheltersOpen = false,
  currentBasemap = 'osm',
  onSelectBasemap,
  isBasemapMenuOpen = false,
  onToggleBasemapMenu,
  theme = 'light',
  className,
}) => {
  const isDark = theme === 'dark';

  const btnBaseStyles = cn(
    'w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer shadow-xs select-none',
    'focus-visible:outline-none focus-visible:ring-2 active:scale-95',
    isDark
      ? 'bg-[#141414] border-[#2A2A2A] text-white hover:bg-[#1E1E1E] focus-visible:ring-emerald-400'
      : 'bg-white border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB] focus-visible:ring-[#047857]'
  );

  const getBasemapIcon = (id: BasemapStyle) => {
    switch (id) {
      case 'satellite':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'topo':
        return <Mountain className="w-4 h-4 text-emerald-400" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-neutral-400" />;
      case 'voyager':
        return <MapIcon className="w-4 h-4 text-amber-400" />;
      case 'osm':
      default:
        return <Layers className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div
      className={cn('flex flex-col gap-2 z-10 pointer-events-auto relative', className)}
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
          className={cn(btnBaseStyles, 'rounded-b-none border-b-0')}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Perkecil peta (Zoom out)"
          title="Perkecil peta"
          className={cn(btnBaseStyles, 'rounded-t-none')}
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

      {/* Basemap Style Switcher (Interactive Color/Satellite Picker) */}
      {onToggleBasemapMenu && onSelectBasemap && (
        <div className="relative">
          <button
            type="button"
            onClick={onToggleBasemapMenu}
            aria-label={isBasemapMenuOpen ? 'Tutup pilihan gaya peta' : 'Pilih gaya & warna peta'}
            aria-expanded={isBasemapMenuOpen}
            title="Pilih Gaya & Warna Peta (Berwarna, Satelit, Topo)"
            className={cn(
              btnBaseStyles,
              isBasemapMenuOpen
                ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'hover:border-emerald-500/50'
            )}
          >
            <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-400" aria-hidden="true" />
          </button>

          {/* Basemap Switcher Popover Panel */}
          {isBasemapMenuOpen && (
            <div className="absolute right-full top-0 mr-2 w-64 rounded-2xl p-2 bg-[#121212]/95 backdrop-blur-xl border-2 border-emerald-500/40 shadow-2xl space-y-1 z-30 animate-in fade-in duration-150">
              <div className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center justify-between border-b border-[#262626] pb-1.5 mb-1">
                <span>Pilih Tipe Peta</span>
                <span className="text-[10px] text-neutral-400 font-mono">Real-Time</span>
              </div>
              {(Object.keys(BASEMAP_STYLES) as BasemapStyle[]).map((styleKey) => {
                const style = BASEMAP_STYLES[styleKey];
                const isActive = currentBasemap === styleKey;
                return (
                  <button
                    key={styleKey}
                    type="button"
                    onClick={() => {
                      onSelectBasemap(styleKey);
                      onToggleBasemapMenu();
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer',
                      isActive
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-950/40 font-black'
                        : 'text-neutral-200 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getBasemapIcon(styleKey)}
                      <span>{style.name}</span>
                    </div>
                    {isActive ? (
                      <Check className="w-4 h-4 text-black" />
                    ) : style.badge ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-400">
                        {style.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Toggle Verified Shelters Layer Button */}
      {onToggleShelters && (
        <button
          type="button"
          onClick={onToggleShelters}
          aria-label={isSheltersOpen ? 'Sembunyikan layer shelter resmi' : 'Tampilkan layer shelter resmi'}
          aria-expanded={isSheltersOpen}
          title={isSheltersOpen ? 'Layer Shelter Aktif' : 'Tampilkan Titik Kumpul & Shelter'}
          className={cn(
            btnBaseStyles,
            isSheltersOpen
              ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : ''
          )}
        >
          <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
        </button>
      )}

      {/* Toggle Legend Button */}
      {onToggleLegend && (
        <button
          type="button"
          onClick={onToggleLegend}
          aria-label={isLegendOpen ? 'Tutup legenda peta' : 'Buka legenda peta'}
          aria-expanded={isLegendOpen}
          title="Legenda Simbol & Bencana"
          className={cn(
            btnBaseStyles,
            isLegendOpen
              ? 'border-amber-400 text-amber-400 bg-amber-950/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : ''
          )}
        >
          <Info className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
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
            isListOpen && (isDark ? 'border-emerald-500 text-emerald-400' : 'border-[#047857] text-[#047857]')
          )}
        >
          <List className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

