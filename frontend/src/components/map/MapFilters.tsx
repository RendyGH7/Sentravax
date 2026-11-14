import React from 'react';
import { Activity, Waves, CloudLightning, Mountain, Anchor, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UITheme } from '../ui/Button';

export interface FilterItem {
  id: string; // 'all' | 'earthquake' | 'flood' | 'extreme_weather' | 'landslide' | 'coastal_flood'
  label: string;
  count: number;
  iconName?: string;
}

export interface MapFiltersProps {
  filters: FilterItem[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  theme?: UITheme;
  className?: string;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
  filters,
  activeFilter,
  onFilterChange,
  theme = 'light',
  className,
}) => {
  const isDark = theme === 'dark';

  const getHazardIcon = (id: string) => {
    switch (id) {
      case 'earthquake':
        return <Activity className="w-3.5 h-3.5 text-red-500 shrink-0" aria-hidden="true" />;
      case 'flood':
        return <Waves className="w-3.5 h-3.5 text-sky-500 shrink-0" aria-hidden="true" />;
      case 'extreme_weather':
        return <CloudLightning className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />;
      case 'landslide':
        return <Mountain className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />;
      case 'coastal_flood':
        return <Anchor className="w-3.5 h-3.5 text-teal-600 shrink-0" aria-hidden="true" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />;
    }
  };

  return (
    <div
      role="group"
      aria-label="Filter Kategori Bencana"
      className={cn('flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 pointer-events-auto', className)}
    >
      {filters.map((filter) => {
        const isActive = filter.id === activeFilter;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none transition-all duration-150 cursor-pointer border shadow-2xs',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              isActive
                ? isDark
                  ? 'bg-[#F59E0B] text-[#0C0C0C] border-[#F59E0B] font-bold focus-visible:ring-[#F59E0B]'
                  : 'bg-[#047857] text-white border-[#047857] shadow-xs focus-visible:ring-[#047857]'
                : isDark
                ? 'bg-[#161616]/90 hover:bg-[#212121] text-[#D4D4D4] border-[#2C2C2C] focus-visible:ring-[#F59E0B]'
                : 'bg-white/95 hover:bg-[#F9FAFB] text-[#111827] border-[#E5E7EB] focus-visible:ring-[#047857]'
            )}
          >
            {getHazardIcon(filter.id)}
            <span>{filter.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ml-0.5',
                isActive
                  ? isDark
                    ? 'bg-[#0C0C0C]/20 text-[#0C0C0C]'
                    : 'bg-white/25 text-white'
                  : isDark
                  ? 'bg-[#222222] text-[#8A8A8A]'
                  : 'bg-[#E5E7EB] text-[#4B5563]'
              )}
            >
              {filter.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

