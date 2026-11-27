import apiClient from '../lib/axios';
import type {
  ApiResponse,
  PublicOverviewData,
  CheckLocationParams,
  LocationCheckResult,
  EventsQueryParams,
  HazardEventItem,
  HazardEventDetail,
  GeoJsonFeatureCollection,
  AlertsQueryParams,
  AlertItem,
  AlertDetail,
  BroadcastLevel,
  HazardTypeItem,
  RegionsQueryParams,
  RegionItem,
  EducationQueryParams,
  EducationContentItem,
  DataSourceItem,
  PaginatedData,
  CreateReportPayload,
  CreateReportResult,
  CommunityReportDetail,
  PublicEmergencyContact,
  PublicEmergencyDirectoryQueryParams,
  PublicEmergencyDirectoryResponse,
} from '../types';
import type {
  ShelterDetail,
  ShelterFilterParams,
  ShelterListResponse,
  ShelterGeoJsonCollection,
} from '../types/shelter';

export function normalizeBroadcastLevel(level: unknown): BroadcastLevel | null {
  if (level === 'local' || level === 'regional' || level === 'national') {
    return level;
  }
  return null;
}

/**
 * Service for communicating with SENTRAVAX Public Website endpoints.
 * All endpoints in this service are public and do not require prior authentication.
 */
export const publicService = {
  /**
   * Get public platform telemetry and disaster summary overview.
   * Endpoint: GET /api/v1/public/overview
   */
  async getOverview(): Promise<PublicOverviewData> {
    const res = await apiClient.get<ApiResponse<PublicOverviewData>>('/public/overview');
    return res.data.data;
  },

  /**
   * Flagship Feature: SENTRAVAX SIAGA PERSONAL — Location Risk Check.
   * Calculates deterministic multi-hazard risk assessment and protective actions for coordinates.
   * Endpoint: GET /api/v1/public/check-location
   */
  async checkLocation(params: CheckLocationParams): Promise<LocationCheckResult> {
    const res = await apiClient.get<ApiResponse<LocationCheckResult>>('/public/check-location', {
      params: {
        latitude: params.latitude ?? params.lat,
        longitude: params.longitude ?? params.lon,
        region_id: params.region_id,
      },
    });
    return res.data.data;
  },

  /**
   * Get paginated catalog of disaster hazard events with optional filtering and request cancellation.
   * Endpoint: GET /api/v1/public/events
   */
  async getEvents(params?: EventsQueryParams, signal?: AbortSignal): Promise<PaginatedData<HazardEventItem>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<HazardEventItem>>>('/public/events', {
      params,
      signal,
    });
    return res.data.data;
  },

  /**
   * Get complete details of a single hazard event by its ID with optional request cancellation.
   * Endpoint: GET /api/v1/public/events/{id}
   */
  async getEventDetail(id: number, signal?: AbortSignal): Promise<HazardEventDetail> {
    const res = await apiClient.get<ApiResponse<HazardEventDetail>>(`/public/events/${id}`, {
      signal,
    });
    const detail = res.data.data;
    if (detail && Array.isArray(detail.alerts)) {
      detail.alerts = detail.alerts.map((item) => ({
        ...item,
        broadcast_level: normalizeBroadcastLevel(item.broadcast_level),
      }));
    }
    return detail;
  },

  /**
   * Get active hazard events as standard RFC 7946 GeoJSON FeatureCollection for interactive Leaflet maps.
   * Endpoint: GET /api/v1/public/map/features
   */
  async getMapFeatures(signal?: AbortSignal): Promise<GeoJsonFeatureCollection> {
    const res = await apiClient.get<GeoJsonFeatureCollection>('/public/map/features', {
      signal,
    });
    return res.data;
  },

  /**
   * Get active early warning alerts (CAP standard) with optional level and regional filtering and request cancellation.
   * Endpoint: GET /api/v1/public/alerts
   */
  async getAlerts(params?: AlertsQueryParams, signal?: AbortSignal): Promise<PaginatedData<AlertItem>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<AlertItem>>>('/public/alerts', {
      params,
      signal,
    });
    const pageData = res.data.data;
    if (pageData && Array.isArray(pageData.data)) {
      pageData.data = pageData.data.map((item) => ({
        ...item,
        broadcast_level: normalizeBroadcastLevel(item.broadcast_level),
      }));
    }
    return pageData;
  },

  /**
   * Get full details of a single early warning alert by its ID with optional request cancellation.
   * Endpoint: GET /api/v1/public/alerts/{id}
   */
  async getAlertDetail(id: number, signal?: AbortSignal): Promise<AlertDetail> {
    const res = await apiClient.get<ApiResponse<AlertDetail>>(`/public/alerts/${id}`, {
      signal,
    });
    const detail = res.data.data;
    if (detail) {
      detail.broadcast_level = normalizeBroadcastLevel(detail.broadcast_level);
    }
    return detail;
  },

  /**
   * Get active hazard categories (earthquake, flood, extreme weather, volcano, forest fire, etc.).
   * Endpoint: GET /api/v1/public/hazard-types
   */
  async getHazardTypes(signal?: AbortSignal): Promise<HazardTypeItem[]> {
    const res = await apiClient.get<ApiResponse<HazardTypeItem[]>>('/public/hazard-types', { signal });
    return res.data.data;
  },

  /**
   * Search and list Indonesian monitored administrative regions (provinces, regencies) with center points.
   * Endpoint: GET /api/v1/public/regions
   */
  async getRegions(params?: RegionsQueryParams, signal?: AbortSignal): Promise<RegionItem[]> {
    const res = await apiClient.get<ApiResponse<RegionItem[]>>('/public/regions', {
      params,
      signal,
    });
    return res.data.data;
  },

  /**
   * Get paginated disaster mitigation and preparedness educational guides.
   * Endpoint: GET /api/v1/public/education
   */
  async getEducation(params?: EducationQueryParams, signal?: AbortSignal): Promise<PaginatedData<EducationContentItem>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<EducationContentItem>>>('/public/education', {
      params,
      signal,
    });
    return res.data.data;
  },

  /**
   * Get full detail and actionable steps of a single educational article by its slug.
   * Endpoint: GET /api/v1/public/education/{slug}
   */
  async getEducationDetail(slug: string): Promise<EducationContentItem> {
    const res = await apiClient.get<ApiResponse<EducationContentItem>>(`/public/education/${slug}`);
    return res.data.data;
  },

  /**
   * Get public data sources registry health and freshness status (BMKG, BNPB, PVMBG, Copernicus).
   * Endpoint: GET /api/v1/public/data-sources
   */
  async getDataSources(): Promise<DataSourceItem[]> {
    const res = await apiClient.get<ApiResponse<DataSourceItem[]>>('/public/data-sources');
    return res.data.data;
  },

  /**
   * Get list of verified emergency shelters and assembly points.
   * Endpoint: GET /api/v1/public/shelters
   */
  async getShelters(params?: ShelterFilterParams, signal?: AbortSignal): Promise<ShelterListResponse> {
    const res = await apiClient.get<ApiResponse<ShelterListResponse>>('/public/shelters', {
      params,
      signal,
    });
    return res.data.data;
  },

  /**
   * Get shelters in GeoJSON FeatureCollection format for interactive Leaflet maps.
   * Endpoint: GET /api/v1/public/shelters?format=geojson
   */
  async getSheltersGeoJson(params?: Omit<ShelterFilterParams, 'format'>): Promise<ShelterGeoJsonCollection> {
    const res = await apiClient.get<ShelterGeoJsonCollection>('/public/shelters', {
      params: { ...params, format: 'geojson' },
    });
    return res.data;
  },

  /**
   * Get single shelter details, facilities, verified agency, and official evacuation corridor guidance.
   * Endpoint: GET /api/v1/public/shelters/{id}
   */
  async getShelterDetail(id: number, lat?: number, lon?: number): Promise<ShelterDetail> {
    const res = await apiClient.get<ApiResponse<ShelterDetail>>(`/public/shelters/${id}`, {
      params: lat !== undefined && lon !== undefined ? { lat, lon } : undefined,
    });
    return res.data.data;
  },

  /**
   * Submit emergency community disaster report without requiring login (Zero-Barrier).
   * Endpoint: POST /api/v1/public/reports
   */
  async submitReport(payload: CreateReportPayload & { reporter_name?: string; reporter_contact?: string }): Promise<CreateReportResult & { tracking_code: string }> {
    const formData = new FormData();
    formData.append('hazard_type_id', String(payload.hazard_type_id));
    formData.append('region_id', String(payload.region_id));
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));
    if (payload.reporter_name) {
      formData.append('reporter_name', payload.reporter_name);
    }
    if (payload.reporter_contact) {
      formData.append('reporter_contact', payload.reporter_contact);
    }
    if (payload.photo) {
      formData.append('photo', payload.photo);
    }

    const res = await apiClient.post<ApiResponse<CreateReportResult & { tracking_code: string }>>('/public/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
    return res.data.data;
  },

  /**
   * Check status of a submitted report by ID or tracking code (e.g. SVX-REP-00001).
   * Endpoint: GET /api/v1/public/reports/{id}
   */
  async checkReportStatus(id: number | string): Promise<CommunityReportDetail & { tracking_code: string }> {
    const res = await apiClient.get<ApiResponse<CommunityReportDetail & { tracking_code: string }>>(`/public/reports/${id}`);
    return res.data.data;
  },

  /**
   * Get public emergency directory contacts.
   * Endpoint: GET /api/v1/public/emergency-contacts
   */
  async getEmergencyContacts(
    params?: PublicEmergencyDirectoryQueryParams,
    signal?: AbortSignal
  ): Promise<PublicEmergencyDirectoryResponse> {
    const res = await apiClient.get<ApiResponse<PublicEmergencyContact[]>>('/public/emergency-contacts', {
      params,
      signal,
    });

    const payload = res.data;
    if (!payload || payload.success !== true || !Array.isArray(payload.data)) {
      throw new Error('Respons direktori kontak darurat tidak sesuai kontrak (data bukan array valid).');
    }

    const meta = payload.meta;
    if (
      !meta ||
      typeof meta.current_page !== 'number' ||
      !Number.isFinite(meta.current_page) ||
      typeof meta.per_page !== 'number' ||
      !Number.isFinite(meta.per_page) ||
      typeof meta.total !== 'number' ||
      !Number.isFinite(meta.total) ||
      typeof meta.last_page !== 'number' ||
      !Number.isFinite(meta.last_page)
    ) {
      throw new Error('Metadata paginasi direktori kontak darurat tidak valid atau tidak lengkap.');
    }

    return {
      data: payload.data,
      meta: {
        current_page: meta.current_page,
        per_page: meta.per_page,
        total: meta.total,
        last_page: meta.last_page,
      },
    };
  },

  /**
   * Get public emergency contact detail by ID or slug.
   * Endpoint: GET /api/v1/public/emergency-contacts/{idOrSlug}
   */
  async getEmergencyContactDetail(
    idOrSlug: number | string,
    signal?: AbortSignal
  ): Promise<PublicEmergencyContact> {
    const res = await apiClient.get<ApiResponse<PublicEmergencyContact>>(`/public/emergency-contacts/${idOrSlug}`, {
      signal,
    });
    return res.data.data;
  },
};

export default publicService;

