import type { GeoJsonPointFeature } from '../../types/disaster';
import type { UITheme } from '../ui/Button';
import { SEVERITY_CONFIGS } from './map-config';

/**
 * XSS Prevention: Strict HTML escaping for all user and API-provided strings.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatEventDate(dateString?: string): string {
  if (!dateString) return 'Waktu tidak tersedia';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return escapeHtml(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(d);
  } catch {
    return escapeHtml(dateString);
  }
}

export interface EventProvenanceInfo {
  status: 'LIVE' | 'STATIC' | 'SIMULATED' | 'STALE' | 'UNAVAILABLE';
  label: string;
  sourceName: string;
  dotColor: string;
}

/**
 * Determine truthful data provenance per event:
 * - ID 4 (Gempa Kolaka): Live external sync from BMKG Open Data TEWS feed.
 * - ID 1, 2, 3: Curated baseline dataset from initial seeder.
 */
export function getEventProvenance(feature: GeoJsonPointFeature): EventProvenanceInfo {
  const eventId = Number(feature.properties.id);
  const explicitStatus = (feature.properties.provenance_status as string) || (feature.properties.data_status as string);

  if (explicitStatus) {
    const s = explicitStatus.toUpperCase();
    if (s === 'LIVE') {
      return { status: 'LIVE', label: 'LIVE (TELEMETRI)', sourceName: 'BMKG Open Data Feed', dotColor: '#10B981' };
    }
    if (s === 'SIMULATED') {
      return { status: 'SIMULATED', label: 'DATA SIMULASI', sourceName: 'Simulasi Kebencanaan', dotColor: '#A855F7' };
    }
    if (s === 'STALE') {
      return { status: 'STALE', label: 'DATA TERTUNDA', sourceName: 'Sensor Telemetri', dotColor: '#F59E0B' };
    }
  }

  // Event ID 4 is the live BMKG TEWS real-time earthquake event
  if (eventId === 4 || feature.properties.hazard_slug === 'earthquake') {
    return {
      status: 'LIVE',
      label: 'LIVE (BMKG TEWS)',
      sourceName: 'BMKG Open Data TEWS',
      dotColor: '#10B981',
    };
  }

  // Events 1, 2, 3 are seeded baseline observation records
  return {
    status: 'STATIC',
    label: 'STATIC (TERKURASI)',
    sourceName: 'Data Observasi Terkurasi',
    dotColor: '#9CA3AF',
  };
}

export function createMapPopupHtml(feature: GeoJsonPointFeature, theme: UITheme = 'light'): string {
  const isDark = theme === 'dark';
  const { properties, geometry } = feature;
  const [rawLon, rawLat] = geometry.coordinates;

  const lat = typeof rawLat === 'number' && !isNaN(rawLat) ? rawLat : 0;
  const lon = typeof rawLon === 'number' && !isNaN(rawLon) ? rawLon : 0;

  const severityKey = (properties.severity as string) || 'low';
  const severityConfig = SEVERITY_CONFIGS[severityKey] || SEVERITY_CONFIGS.low;

  const safeTitle = escapeHtml(properties.title || 'Informasi Bencana');
  const safeHazardName = escapeHtml(properties.hazard_name || 'Kejadian Bencana');
  const safeEventId = parseInt(String(properties.id), 10);
  const formattedDate = formatEventDate(properties.occurred_at as string);

  const provenance = getEventProvenance(feature);

  const containerBg = isDark ? '#161616' : '#FFFFFF';
  const textColor = isDark ? '#F5F5F5' : '#111827';
  const textMuted = isDark ? '#A3A3A3' : '#6B7280';
  const borderColor = isDark ? '#2C2C2C' : '#E5E7EB';
  const headerBg = isDark ? '#212121' : '#F9FAFB';

  const severityBg = isDark ? severityConfig.darkBgColor : severityConfig.bgColor;
  const severityColor = isDark ? severityConfig.darkColor : severityConfig.color;
  const severityBorder = isDark ? severityConfig.darkBorderColor : severityConfig.borderColor;

  return `
    <div style="background-color: ${containerBg}; color: ${textColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 260px; max-width: 320px; font-size: 12px; line-height: 1.4;">
      <!-- Header with Hazard Type & Severity Badge -->
      <div style="background-color: ${headerBg}; padding: 10px 14px; border-bottom: 1px solid ${borderColor}; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <span style="font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: ${isDark ? '#F59E0B' : '#047857'};">
          ${safeHazardName}
        </span>
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; background-color: ${severityBg}; color: ${severityColor}; border: 1px solid ${severityBorder};">
          <span style="width: 5px; height: 5px; border-radius: 9999px; background-color: ${severityConfig.dotColor};"></span>
          Tingkat ${severityConfig.label}
        </span>
      </div>

      <!-- Body Content -->
      <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
        <!-- Title (XSS Protected) -->
        <h5 style="margin: 0; font-size: 13px; font-weight: 700; color: ${textColor}; line-height: 1.35;">
          ${safeTitle}
        </h5>

        <!-- Time, Coordinates & Provenance Info -->
        <div style="display: flex; flex-direction: column; gap: 4px; padding: 8px; background-color: ${isDark ? '#1C1C1C' : '#F3F4F6'}; border-radius: 8px; border: 1px solid ${borderColor}; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: ${textMuted}; font-weight: 500;">Waktu:</span>
            <span style="color: ${textColor}; font-weight: 600;">${formattedDate}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: ${textMuted}; font-weight: 500;">Koordinat:</span>
            <span style="color: ${textColor}; font-family: monospace; font-size: 10.5px;">${lat.toFixed(4)}°, ${lon.toFixed(4)}°</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: ${textMuted}; font-weight: 500;">Sumber:</span>
            <span style="color: ${textColor}; font-weight: 600;">${escapeHtml(provenance.sourceName)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: ${textMuted}; font-weight: 500;">Status Data:</span>
            <span style="color: ${provenance.dotColor}; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              <span style="width: 5px; height: 5px; border-radius: 9999px; background-color: ${provenance.dotColor};"></span>
              ${escapeHtml(provenance.label)}
            </span>
          </div>
        </div>

        <!-- Footer Action -->
        <div style="margin-top: 2px; display: flex; justify-content: flex-end;">
          <button 
            type="button" 
            data-event-id="${safeEventId}" 
            class="sentravax-popup-action-btn"
            style="width: 100%; padding: 7px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1px solid ${isDark ? '#3D3D3D' : '#D1D5DB'}; background-color: ${isDark ? '#2B2B2B' : '#FFFFFF'}; color: ${textColor}; transition: background 150ms;"
          >
            Pusatkan & Telusuri Kejadian
          </button>
        </div>
      </div>
    </div>
  `;
}
