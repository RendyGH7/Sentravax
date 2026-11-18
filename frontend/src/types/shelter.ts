export type FacilityType =
  | 'assembly_point'
  | 'community_hall'
  | 'stadium'
  | 'school'
  | 'tent_camp'
  | 'health_facility'
  | 'government_office'
  | 'other';

export type OperationalStatus = 'open' | 'standby' | 'full' | 'closed';

export type VerificationStatus =
  | 'VERIFIED'
  | 'PENDING_VERIFICATION'
  | 'INACTIVE'
  | 'UNKNOWN'
  | 'SIMULATED';

export interface EvacuationRouteInfo {
  has_official_route: boolean;
  route_code?: string;
  corridor_name?: string;
  status?: string;
  verified_at?: string;
  authority?: string;
  safety_guidance?: string;
  notes?: string;
  official_source?: string | null;
}

export interface ShelterAuditItem {
  action: string;
  user_id?: number;
  user_name?: string;
  timestamp: string;
  notes?: string;
  verification_status?: string;
  operational_status?: string;
  changed_fields?: string[];
  old_status?: Record<string, unknown>;
  new_status?: Record<string, unknown>;
}

export interface ShelterProvenance {
  created_by_user_id?: number;
  created_by_user_name?: string;
  created_at?: string;
  last_updated_by?: string;
  last_updated_at?: string;
  verification_method?: string;
  audit_history?: ShelterAuditItem[];
}

export interface ShelterItem {
  id: number;
  name: string;
  facility_type: FacilityType;
  address: string;
  region_id?: number | null;
  region?: {
    id: number;
    code: string;
    name: string;
    level?: string;
  } | null;
  latitude: number;
  longitude: number;
  capacity?: number | null;
  current_occupancy: number;
  occupancy_rate?: number;
  has_sanitation: boolean;
  sanitation_details?: string | null;
  wheelchair_accessible: boolean;
  elderly_friendly: boolean;
  contact_person?: string | null;
  contact_phone?: string | null;
  operational_status: OperationalStatus;
  verification_status: VerificationStatus;
  is_verified: boolean;
  verified_at?: string | null;
  verified_by_agency?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  evacuation_route_info?: EvacuationRouteInfo | null;
  provenance_metadata?: ShelterProvenance | null;
  distance_km?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ShelterDetail extends ShelterItem {
  creator?: { id: number; name: string } | null;
  updater?: { id: number; name: string } | null;
}

export interface ShelterFilterParams {
  q?: string;
  facility_type?: string;
  operational_status?: string;
  verification_status?: string;
  region_id?: number;
  wheelchair_accessible?: boolean;
  elderly_friendly?: boolean;
  has_sanitation?: boolean;
  lat?: number;
  lon?: number;
  radius_km?: number;
  format?: 'json' | 'geojson';
  page?: number;
  per_page?: number;
}

export interface ShelterListResponse {
  current_page: number;
  data: ShelterItem[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface ShelterGeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: ShelterItem;
}

export interface ShelterGeoJsonCollection {
  type: 'FeatureCollection';
  features: ShelterGeoJsonFeature[];
  meta?: {
    total_features: number;
    disclaimer: string;
  };
}

export interface ShelterFormData {
  name: string;
  facility_type: FacilityType;
  address: string;
  region_id?: number | null;
  latitude: number;
  longitude: number;
  capacity?: number | null;
  current_occupancy?: number;
  has_sanitation?: boolean;
  sanitation_details?: string | null;
  wheelchair_accessible?: boolean;
  elderly_friendly?: boolean;
  contact_person?: string | null;
  contact_phone?: string | null;
  operational_status: OperationalStatus;
  verification_status: VerificationStatus;
  verified_by_agency?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  evacuation_route_info?: EvacuationRouteInfo | null;
}

export interface AdminShelterStats {
  total: number;
  verified: number;
  pending: number;
  open: number;
  full: number;
  standby: number;
  closed: number;
  total_capacity: number;
  total_occupancy: number;
}
