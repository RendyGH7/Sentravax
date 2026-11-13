export type HazardCategory = 'geological' | 'hydrometeorological' | 'climatological' | 'biological' | 'space';

export type HazardSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';
export type EventStatus = 'active' | 'contained' | 'resolved';

export type AlertClass = 'advisory' | 'watch' | 'warning';
export type BroadcastLevel = 'local' | 'regional' | 'national';
export type AlertStatus = 'active' | 'expired' | 'cancelled';

export interface HazardTypeItem {
  id: number;
  slug: string;
  name: string;
  category: HazardCategory;
  description?: string;
  icon?: string;
  severity_levels?: string[];
  is_active: boolean;
}

export interface RegionItem {
  id: number;
  code: string;
  name: string;
  level: string; // province, regency, district
  parent_id?: number | null;
  latitude?: number;
  longitude?: number;
  center?: {
    latitude: number | null;
    longitude: number | null;
  };
}

export interface PublicOverviewData {
  platform: string;
  active_hazard_events: number;
  active_alerts: number;
  monitored_regions: number;
  system_status: string;
  telemetry_sync: {
    status: string;
    freshness: 'LIVE' | 'STATIC' | 'SIMULATED' | 'STALE' | 'UNAVAILABLE';
    last_synced_at: string;
  };
}

export interface HazardEventDetail extends HazardEventItem {
  source_metadata?: Record<string, unknown> | null;
  alerts?: AlertItem[];
  data_source?: {
    name: string;
    provider: string;
    status: string;
  } | null;
}

export interface EducationContentItem {
  id: number;
  hazard_type_id?: number | null;
  hazard_type?: HazardTypeItem | null;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content_body: string;
  content_type?: string;
  is_published: boolean;
  published_at?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface EventsQueryParams {
  hazard_type_id?: number;
  region_id?: number;
  severity?: HazardSeverity;
  status?: EventStatus;
  page?: number;
  per_page?: number;
}

export interface AlertsQueryParams {
  broadcast_level?: BroadcastLevel;
  region_id?: number;
  page?: number;
  per_page?: number;
}

export interface RegionsQueryParams {
  q?: string;
  level?: string;
}

export interface EducationQueryParams {
  category?: string;
  hazard_type_id?: number;
  page?: number;
  per_page?: number;
}

export interface CheckLocationParams {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lon?: number;
  region_id?: number;
}

export interface HazardEventItem {
  id: number;
  title: string;
  description?: string;
  severity: HazardSeverity;
  status: EventStatus;
  hazard_type?: HazardTypeItem | null;
  region?: RegionItem | null;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  occurred_at: string;
  reported_at?: string;
  source?: string;
}

export interface AlertItem {
  id: number;
  title: string;
  message: string;
  alert_class: AlertClass;
  broadcast_level: BroadcastLevel;
  status: AlertStatus;
  starts_at: string;
  expires_at?: string;
  hazard_type?: HazardTypeItem | null;
  region?: RegionItem | null;
  hazard_event_id?: number | null;
}

export interface GeoJsonPointFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    id: number;
    title: string;
    hazard_slug?: string;
    hazard_name?: string;
    hazard_icon?: string;
    severity?: string;
    status?: string;
    occurred_at?: string;
    [key: string]: unknown;
  };
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonPointFeature[];
}

