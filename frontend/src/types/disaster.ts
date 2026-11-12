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

