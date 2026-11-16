export type HazardCategory = 'geological' | 'hydrometeorological' | 'climatological' | 'biological' | 'space';

export type HazardSeverity = 'minor' | 'moderate' | 'severe' | 'extreme' | 'low' | 'medium' | 'high';
export type EventStatus = 'active' | 'contained' | 'resolved';

export type AlertClass = 'official_warning' | 'platform_advisory' | 'advisory' | 'watch' | 'warning';
export type BroadcastLevel = 'local' | 'regional' | 'national';
export type AlertStatus = 'active' | 'expired' | 'cancelled' | 'draft';

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

export interface AlertIssuer {
  is_verified: boolean;
  name: string;
  provider: string | null;
  source_type: string | null;
  verification_basis?: string;
}

export interface EventDataSourceSummary {
  id: number;
  name: string;
  provider: string;
  source_type?: string;
}

export interface TimelineMilestone {
  entity: 'hazard_event' | 'alert';
  alert_id?: number;
  field: 'occurred_at' | 'reported_at' | 'starts_at' | 'expires_at';
  label: string;
  timestamp: string;
  description: string;
}

export interface NearbyHazardEvent {
  id: number;
  title: string;
  severity: HazardSeverity;
  status: EventStatus;
  distance_km: number;
  distance_meters: number;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  hazard_type?: {
    id: number;
    name: string;
    slug: string;
    icon?: string;
  } | null;
  occurred_at?: string | null;
}

export interface HazardEventDetail extends HazardEventItem {
  source_metadata?: Record<string, unknown> | null;
  alerts?: AlertItem[];
  nearby_events?: NearbyHazardEvent[];
  safety_guidelines?: EducationContentItem[];
  timeline?: TimelineMilestone[];
  data_source?: {
    id?: number;
    name: string;
    provider: string;
    source_type?: string;
    status: string;
    provenance_status?: 'LIVE' | 'STATIC' | 'SIMULATED' | 'STALE' | 'UNAVAILABLE';
    provenance_label?: string;
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
  q?: string;
  hazard_type_id?: number;
  region_id?: number;
  severity?: HazardSeverity;
  status?: EventStatus | 'all';
  date_from?: string;
  date_to?: string;
  sort_by?: 'occurred_at' | 'severity' | 'title' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface AlertsQueryParams {
  q?: string;
  alert_class?: AlertClass;
  broadcast_level?: BroadcastLevel;
  hazard_type_id?: number;
  region_id?: number;
  status?: AlertStatus | 'all';
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
  source_name?: string;
  provider_name?: string;
  provenance_status?: 'LIVE' | 'STATIC' | 'SIMULATED' | 'STALE' | 'UNAVAILABLE';
  provenance_label?: string;
}

export interface AlertItem {
  id: number;
  title: string;
  message: string;
  alert_class: AlertClass;
  broadcast_level: BroadcastLevel | null;
  status: AlertStatus;
  is_active?: boolean;
  starts_at: string;
  expires_at?: string | null;
  created_at?: string;
  issuer?: AlertIssuer;
  event_data_source?: EventDataSourceSummary | null;
  hazard_type?: HazardTypeItem | null;
  region?: RegionItem | null;
  hazard_event_id?: number | null;
}

export interface AlertDetail {
  id: number;
  title: string;
  message: string;
  alert_class: AlertClass;
  broadcast_level: BroadcastLevel | null;
  status: AlertStatus;
  is_active: boolean;
  starts_at: string;
  expires_at?: string | null;
  created_at: string;
  issuer: AlertIssuer;
  event_data_source?: EventDataSourceSummary | null;
  hazard_type?: HazardTypeItem | null;
  region?: (RegionItem & { center?: { latitude: number | null; longitude: number | null } }) | null;
  hazard_event?: {
    id: number;
    title: string;
    severity: HazardSeverity;
    status: EventStatus;
    occurred_at?: string;
    data_source?: EventDataSourceSummary | null;
  } | null;
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
    source_name?: string;
    provider_name?: string;
    provenance_status?: 'LIVE' | 'STATIC' | 'SIMULATED' | 'STALE' | 'UNAVAILABLE';
    provenance_label?: string;
    [key: string]: unknown;
  };
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonPointFeature[];
}

