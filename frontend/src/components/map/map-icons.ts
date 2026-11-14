import L from 'leaflet';
import type { GeoJsonPointFeature } from '../../types/disaster';
import type { UITheme } from '../ui/Button';
import { SEVERITY_CONFIGS } from './map-config';

// Inline SVG icons for pure leaflet divIcon rendering
function getHazardSvgPath(hazardSlug?: string): string {
  switch (hazardSlug) {
    case 'earthquake':
      // Activity / Pulse Line
      return '<path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'flood':
      // Waves
      return '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'extreme_weather':
      // Cloud Lightning
      return '<path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M13 11l-4 6h6l-4 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'landslide':
      // Mountain
      return '<path d="m8 3 4 8 5-5 5 15H2L8 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'coastal_flood':
      // Anchor
      return '<circle cx="12" cy="5" r="3" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="22" x2="12" y2="8" stroke="currentColor" stroke-width="2"/><path d="M5 12H2a10 10 0 0 0 20 0h-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    default:
      // Alert Triangle
      return '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2"/>';
  }
}

export function createMarkerIcon(
  feature: GeoJsonPointFeature,
  isSelected: boolean = false,
  theme: UITheme = 'light'
): L.DivIcon {
  const isDark = theme === 'dark';
  const severityKey = (feature.properties.severity as string) || 'low';
  const severityConfig = SEVERITY_CONFIGS[severityKey] || SEVERITY_CONFIGS.low;

  const pinColor = severityConfig.color;
  const pulseColor = severityConfig.dotColor;
  const borderColor = isDark ? '#161616' : '#FFFFFF';
  const size = isSelected ? 44 : 36;
  const anchorOffset = size / 2;

  const svgPath = getHazardSvgPath(feature.properties.hazard_slug as string);

  const html = `
    <div class="sentravax-marker-wrapper" style="width: ${size}px; height: ${size}px;">
      <!-- Pulsing Ring for Live Visual Feedback -->
      <div class="sentravax-marker-pulse" style="background-color: ${pulseColor};"></div>

      <!-- Main Pin Badge -->
      <div 
        style="
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 9999px; 
          background-color: ${pinColor}; 
          border: ${isSelected ? '3px' : '2.5px'} solid ${borderColor}; 
          box-shadow: 0 4px 12px rgba(0, 0, 0, ${isDark ? '0.6' : '0.25'}); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: #FFFFFF;
          position: relative;
          z-index: 2;
          ${isSelected ? `outline: 2px solid ${isDark ? '#F59E0B' : '#047857'}; outline-offset: 2px;` : ''}
        "
      >
        <svg 
          viewBox="0 0 24 24" 
          style="width: ${size * 0.52}px; height: ${size * 0.52}px; display: block;"
        >
          ${svgPath}
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'sentravax-leaflet-divicon',
    iconSize: [size, size],
    iconAnchor: [anchorOffset, anchorOffset],
    popupAnchor: [0, -anchorOffset],
  });
}

