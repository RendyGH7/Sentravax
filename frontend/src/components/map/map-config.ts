import type { UITheme } from '../ui/Button';

// Default geographical center of Indonesia (Archipelago Center)
export const INDONESIA_CENTER: [number, number] = [-2.5489, 118.0149];
export const INDONESIA_DEFAULT_ZOOM = 5;
export const INDONESIA_MIN_ZOOM = 4;
export const INDONESIA_MAX_ZOOM = 18;

// Geographical bounding box of Indonesia [South-West, North-East]
export const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
  [-11.5, 94.5], // Southwest (Rote / Indian Ocean)
  [6.5, 141.5],  // Northeast (Miangas / Papua border)
];

// Map Tile Layer Providers
export interface TileLayerConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
}

export const TILE_LAYERS: Record<UITheme, TileLayerConfig> = {
  // Family 1 (Light): CartoDB Positron - Clean, muted, high contrast for emergency layers
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
  },
  // Family 2 (Dark): CartoDB Dark Matter - Pure charcoal, zero neon, tactical intelligence look
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
  },
};

// Fallback Standard OpenStreetMap Tile Layer
export const OSM_FALLBACK_TILE_LAYER: TileLayerConfig = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  maxZoom: 19,
  subdomains: 'abc',
};

// Severity Level Configurations
export interface SeverityConfig {
  label: string;
  color: string;
  darkColor: string;
  bgColor: string;
  darkBgColor: string;
  borderColor: string;
  darkBorderColor: string;
  dotColor: string;
}

export const SEVERITY_CONFIGS: Record<string, SeverityConfig> = {
  low: {
    label: 'Rendah',
    color: '#059669',       // Emerald-600
    darkColor: '#34D399',   // Emerald-400
    bgColor: '#ECFDF5',
    darkBgColor: '#064E3B',
    borderColor: '#A7F3D0',
    darkBorderColor: '#047857',
    dotColor: '#10B981',
  },
  medium: {
    label: 'Sedang',
    color: '#D97706',       // Amber-600
    darkColor: '#FBBF24',   // Amber-400
    bgColor: '#FFFBEB',
    darkBgColor: '#78350F',
    borderColor: '#FDE68A',
    darkBorderColor: '#B45309',
    dotColor: '#F59E0B',
  },
  high: {
    label: 'Tinggi',
    color: '#C2410C',       // Terracotta
    darkColor: '#FB923C',   // Orange-400
    bgColor: '#FFF7ED',
    darkBgColor: '#7C2D12',
    borderColor: '#FFEDD5',
    darkBorderColor: '#9A3412',
    dotColor: '#EA580C',
  },
  critical: {
    label: 'Kritis',
    color: '#DC2626',       // Red-600
    darkColor: '#F87171',   // Red-400
    bgColor: '#FEF2F2',
    darkBgColor: '#7F1D1D',
    borderColor: '#FECACA',
    darkBorderColor: '#991B1B',
    dotColor: '#EF4444',
  },
};

// Hazard Type metadata mapping
export interface HazardMeta {
  name: string;
  iconName: 'activity' | 'waves' | 'cloud-lightning' | 'mountain' | 'anchor' | 'alert-triangle';
  primaryColor: string;
}

export const HAZARD_META: Record<string, HazardMeta> = {
  earthquake: {
    name: 'Gempa Bumi',
    iconName: 'activity',
    primaryColor: '#DC2626',
  },
  flood: {
    name: 'Banjir & Genangan',
    iconName: 'waves',
    primaryColor: '#0284C7',
  },
  extreme_weather: {
    name: 'Cuaca Ekstrem',
    iconName: 'cloud-lightning',
    primaryColor: '#D97706',
  },
  landslide: {
    name: 'Tanah Longsor',
    iconName: 'mountain',
    primaryColor: '#92400E',
  },
  coastal_flood: {
    name: 'Banjir Rob',
    iconName: 'anchor',
    primaryColor: '#0D9488',
  },
};

