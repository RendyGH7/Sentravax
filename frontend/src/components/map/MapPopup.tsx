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
 * Determine truthful data provenance per event directly from backend GeoJSON properties.
 * No hardcoded IDs or hazard-type assumptions.
 * If backend does not specify, safely falls back to STATIC without falsely claiming LIVE.
 */
export function getEventProvenance(feature: GeoJsonPointFeature): EventProvenanceInfo {
  const props = feature.properties;
  const rawStatus = (props.provenance_status as string) || (props.data_status as string);
  const backendSourceName = (props.source_name as string) || (props.provider_name as string);
  const backendLabel = props.provenance_label as string;

  if (rawStatus) {
    const s = rawStatus.toUpperCase();
    if (s === 'LIVE') {
      return {
        status: 'LIVE',
        label: backendLabel || 'LIVE (TELEMETRI)',
        sourceName: backendSourceName || 'BMKG Open Data Feed',
        dotColor: '#10B981',
      };
    }
    if (s === 'SIMULATED') {
      return {
        status: 'SIMULATED',
        label: backendLabel || 'DATA SIMULASI',
        sourceName: backendSourceName || 'Simulasi Kebencanaan',
        dotColor: '#A855F7',
      };
    }
    if (s === 'STALE') {
      return {
        status: 'STALE',
        label: backendLabel || 'DATA TERTUNDA',
        sourceName: backendSourceName || 'Sensor Telemetri',
        dotColor: '#F59E0B',
      };
    }
    if (s === 'UNAVAILABLE') {
      return {
        status: 'UNAVAILABLE',
        label: backendLabel || 'TIDAK TERSEDIA',
        sourceName: backendSourceName || 'Sumber Data Terputus',
        dotColor: '#EF4444',
      };
    }
  }

  // Safe fallback when no status provided: treat as STATIC / Curated, NEVER falsely claim LIVE
  return {
    status: 'STATIC',
    label: backendLabel || 'STATIC (TERKURASI)',
    sourceName: backendSourceName || 'Data Observasi Terkurasi',
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
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#2A2A2A' : '#F1F5F9';

  const severityBg = isDark ? severityConfig.darkBgColor : severityConfig.bgColor;
  const severityColor = isDark ? severityConfig.darkColor : severityConfig.color;
  const severityBorder = isDark ? severityConfig.darkBorderColor : severityConfig.borderColor;

  return `
    <div style="background-color: ${containerBg}; color: ${textColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 310px; max-width: 90vw; font-size: 12px; line-height: 1.45; border-radius: 16px; overflow: hidden;">
      <!-- Header: Hazard Category & Severity Badge (44px right-padding ensures zero collision with Leaflet close button) -->
      <div style="background: ${isDark ? 'linear-gradient(to right, #212121, #1A1A1A)' : 'linear-gradient(to right, #F8FAFC, #F1F5F9)'}; padding: 12px 44px 10px 16px; border-bottom: 1px solid ${borderColor}; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background-color: ${isDark ? '#F59E0B' : '#047857'}; flex-shrink: 0;"></span>
          <span style="font-weight: 700; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: ${isDark ? '#F59E0B' : '#047857'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${safeHazardName}
          </span>
        </div>
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2.5px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; background-color: ${severityBg}; color: ${severityColor}; border: 1px solid ${severityBorder}; flex-shrink: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
          <span style="width: 5px; height: 5px; border-radius: 9999px; background-color: ${severityConfig.dotColor};"></span>
          Tingkat ${severityConfig.label}
        </span>
      </div>

      <!-- Body Content -->
      <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 12px;">
        <!-- Title -->
        <h4 style="margin: 0; font-size: 13.5px; font-weight: 700; color: ${textColor}; line-height: 1.35; letter-spacing: -0.015em;">
          ${safeTitle}
        </h4>

        <!-- Telemetry Data Grid (Clean 2-Column, Zero Overlap) -->
        <div style="display: grid; grid-template-columns: 78px 1fr; gap: 7px 12px; padding: 10px 12px; background-color: ${isDark ? '#1C1C1C' : '#F8FAFC'}; border-radius: 12px; border: 1px solid ${borderColor}; font-size: 11px; align-items: baseline;">
          <!-- Waktu -->
          <span style="color: ${textMuted}; font-weight: 500; font-size: 10.5px;">Waktu</span>
          <span style="color: ${textColor}; font-weight: 600; text-align: right;">${formattedDate}</span>

          <!-- Koordinat -->
          <span style="color: ${textMuted}; font-weight: 500; font-size: 10.5px;">Koordinat</span>
          <span style="color: ${textColor}; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; font-weight: 600; text-align: right; background-color: ${isDark ? '#262626' : '#FFFFFF'}; border: 1px solid ${borderColor}; padding: 1.5px 6px; border-radius: 6px; justify-self: end;">
            ${lat.toFixed(4)}°, ${lon.toFixed(4)}°
          </span>

          <!-- Sumber -->
          <span style="color: ${textMuted}; font-weight: 500; font-size: 10.5px;">Sumber</span>
          <span style="color: ${textColor}; font-weight: 600; text-align: right; line-height: 1.3;">${escapeHtml(provenance.sourceName)}</span>

          <!-- Status Data -->
          <span style="color: ${textMuted}; font-weight: 500; font-size: 10.5px;">Status Data</span>
          <span style="display: inline-flex; align-items: center; gap: 5px; justify-self: end; font-size: 10px; font-weight: 700; color: ${provenance.dotColor};">
            <span style="width: 6px; height: 6px; border-radius: 9999px; background-color: ${provenance.dotColor}; box-shadow: 0 0 0 2px ${provenance.dotColor}33;"></span>
            ${escapeHtml(provenance.label)}
          </span>
        </div>

        <!-- Dual Actions: Pusatkan Peta & Buka Detail -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 2px;">
          <button 
            type="button" 
            data-event-id="${safeEventId}" 
            class="sentravax-popup-action-btn"
            style="display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: 100%; padding: 8px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid ${isDark ? '#383838' : '#CBD5E1'}; background-color: ${isDark ? '#242424' : '#FFFFFF'}; color: ${textColor}; transition: all 150ms ease; box-shadow: 0 1px 2px rgba(0,0,0,0.03);"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
            <span>Pusatkan Peta</span>
          </button>

          <a
            href="/disasters/${safeEventId}"
            class="sentravax-popup-detail-link"
            style="display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: 100%; padding: 8px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; text-decoration: none; border: 1px solid #047857; background: linear-gradient(to bottom, #059669, #047857); color: #FFFFFF; transition: all 150ms ease; box-shadow: 0 2px 4px rgba(4, 120, 87, 0.25);"
          >
            <span>Buka Detail</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </div>
    </div>
  `;
}
