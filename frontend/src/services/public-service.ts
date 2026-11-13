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
  HazardTypeItem,
  RegionsQueryParams,
  RegionItem,
  EducationQueryParams,
  EducationContentItem,
  DataSourceItem,
  PaginatedData,
} from '../types';

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
   * Get paginated catalog of disaster hazard events with optional filtering.
   * Endpoint: GET /api/v1/public/events
   */
  async getEvents(params?: EventsQueryParams): Promise<PaginatedData<HazardEventItem>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<HazardEventItem>>>('/public/events', {
      params,
    });
    return res.data.data;
  },

  /**
   * Get complete details of a single hazard event by its ID.
   * Endpoint: GET /api/v1/public/events/{id}
   */
  async getEventDetail(id: number): Promise<HazardEventDetail> {
    const res = await apiClient.get<ApiResponse<HazardEventDetail>>(`/public/events/${id}`);
    return res.data.data;
  },

  /**
   * Get active hazard events as standard RFC 7946 GeoJSON FeatureCollection for interactive Leaflet maps.
   * Endpoint: GET /api/v1/public/map/features
   */
  async getMapFeatures(): Promise<GeoJsonFeatureCollection> {
    const res = await apiClient.get<GeoJsonFeatureCollection>('/public/map/features');
    return res.data;
  },

  /**
   * Get active early warning alerts (CAP standard) with optional level and regional filtering.
   * Endpoint: GET /api/v1/public/alerts
   */
  async getAlerts(params?: AlertsQueryParams): Promise<PaginatedData<AlertItem>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<AlertItem>>>('/public/alerts', {
      params,
    });
    return res.data.data;
  },

  /**
   * Get active hazard categories (earthquake, flood, extreme weather, volcano, forest fire, etc.).
   * Endpoint: GET /api/v1/public/hazard-types
   */
  async getHazardTypes(): Promise<HazardTypeItem[]> {
    const res = await apiClient.get<ApiResponse<HazardTypeItem[]>>('/public/hazard-types');
    return res.data.data;
  },

  /**
   * Search and list Indonesian monitored administrative regions (provinces, regencies) with center points.
   * Endpoint: GET /api/v1/public/regions
   */
  async getRegions(params?: RegionsQueryParams): Promise<RegionItem[]> {
    const res = await apiClient.get<ApiResponse<RegionItem[]>>('/public/regions', {
      params,
    });
    return res.data.data;
  },

  /**
   * Get paginated disaster mitigation and preparedness educational guides.
   * Endpoint: GET /api/v1/public/education
   */
  async getEducation(params?: EducationQueryParams): Promise<PaginatedData<EducationContentItem>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<EducationContentItem>>>('/public/education', {
      params,
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
};

export default publicService;

