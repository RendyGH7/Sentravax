import apiClient from '../lib/axios';
import type {
  ApiResponse,
  PaginatedData,
  DataSourceItem,
  RegionItem,
  HazardTypeItem,
} from '../types';
import type {
  IntelligenceOverviewData,
  IntelligencePingResponse,
  IntelGeoJsonFeatureCollection,
  CommunityReportQueueItem,
  ReportVerificationPayload,
  RiskEvaluationRequest,
  RiskAssessmentItem,
  AiInsightGenerationRequest,
  ProactiveAiInsightItem,
  AlertDispatchPayload,
  AlertDispatchResponse,
} from '../types/intelligence';

export interface ReportsQueueParams {
  status?: 'all' | 'pending' | 'investigating' | 'verified' | 'rejected' | string;
  region_id?: number;
  hazard_type_id?: number;
  cluster_id?: string;
  page?: number;
  per_page?: number;
}

/**
 * Service for communicating with SENTRAVAX Geospatial Command & Intelligence Center endpoints.
 * Endpoints under /api/v1/intel/* strictly require Sanctum authentication with role = 'intelligence'.
 */
export const intelligenceService = {
  // ==========================================
  // 1. SYSTEM HEALTH & AUTHORIZATION PROBE
  // ==========================================

  /**
   * Probe intelligence authorization and session status.
   * Endpoint: GET /api/v1/intel/ping
   */
  async ping(): Promise<IntelligencePingResponse> {
    const res = await apiClient.get<IntelligencePingResponse>('/intel/ping');
    return res.data;
  },

  // ==========================================
  // 2. COMMAND CENTER TELEMETRY & OVERVIEW
  // ==========================================

  /**
   * Retrieve active intelligence telemetry, live multi-hazard metrics,
   * demonstration simulation scenario, and latest proactive AI insights.
   * Endpoint: GET /api/v1/intel/overview
   */
  async getOverview(): Promise<IntelligenceOverviewData> {
    const res = await apiClient.get<ApiResponse<IntelligenceOverviewData>>('/intel/overview');
    return res.data.data;
  },

  /**
   * Retrieve real-time data source status and sync runs for operational provenance.
   * Endpoint: GET /api/v1/public/data-sources
   */
  async getDataSources(): Promise<DataSourceItem[]> {
    const res = await apiClient.get<ApiResponse<DataSourceItem[]>>('/public/data-sources');
    return res.data.data;
  },

  // ==========================================
  // 3. GEOSPATIAL MAP LAYERS
  // ==========================================

  /**
   * Retrieve geospatial intelligence layers (hazard events & community reports) as GeoJSON FeatureCollection.
   * Endpoint: GET /api/v1/intel/map
   */
  async getMapFeatures(): Promise<IntelGeoJsonFeatureCollection> {
    const res = await apiClient.get<ApiResponse<IntelGeoJsonFeatureCollection>>('/intel/map');
    return res.data.data;
  },

  // ==========================================
  // 4. MULTI-HAZARD RISK EVALUATION & WORKSPACE
  // ==========================================

  /**
   * List historical multi-hazard risk assessments evaluated by the Risk Engine.
   * Endpoint: GET /api/v1/intel/risk/assessments
   */
  async getRiskAssessments(params?: { region_id?: number; hazard_type_id?: number }): Promise<RiskAssessmentItem[]> {
    const res = await apiClient.get<ApiResponse<RiskAssessmentItem[]>>('/intel/risk/assessments', { params });
    return res.data.data;
  },

  /**
   * Trigger multi-hazard deterministic risk evaluation for a region and hazard type.
   * Endpoint: POST /api/v1/intel/risk/evaluate
   */
  async evaluateRisk(payload: RiskEvaluationRequest): Promise<RiskAssessmentItem> {
    const res = await apiClient.post<ApiResponse<RiskAssessmentItem>>('/intel/risk/evaluate', payload);
    return res.data.data;
  },

  /**
   * Retrieve available administrative pilot regions for multi-hazard scoping.
   * Endpoint: GET /api/v1/public/regions
   */
  async getRegions(): Promise<RegionItem[]> {
    const res = await apiClient.get<ApiResponse<RegionItem[]>>('/public/regions');
    return res.data.data;
  },

  /**
   * Retrieve officially registered multi-hazard types.
   * Endpoint: GET /api/v1/public/hazard-types
   */
  async getHazardTypes(): Promise<HazardTypeItem[]> {
    const res = await apiClient.get<ApiResponse<HazardTypeItem[]>>('/public/hazard-types');
    return res.data.data;
  },

  // ==========================================
  // 5. PROACTIVE AI INSIGHTS (FOR STEP 3)
  // ==========================================

  /**
   * Retrieve list of generated proactive intelligence insights.
   * Endpoint: GET /api/v1/intel/insights
   */
  async getInsights(params?: { region_id?: number; hazard_type_id?: number; insight_type?: string; limit?: number }): Promise<ProactiveAiInsightItem[]> {
    const res = await apiClient.get<ApiResponse<ProactiveAiInsightItem[]>>('/intel/insights', { params });
    return res.data.data;
  },

  /**
   * Generate transparent proactive intelligence insight with evidence attribution.
   * Endpoint: POST /api/v1/intel/insights/generate
   */
  async generateInsight(payload: AiInsightGenerationRequest): Promise<ProactiveAiInsightItem> {
    const res = await apiClient.post<ApiResponse<ProactiveAiInsightItem>>('/intel/insights/generate', payload);
    return res.data.data;
  },

  // ==========================================
  // 6. VERIFICATION QUEUE & REPORT TRIAGE (FOR STEP 3)
  // ==========================================

  /**
   * Retrieve triage queue of community reports with spatiotemporal duplicate tags.
   * Endpoint: GET /api/v1/intel/reports/queue
   */
  async getReportsQueue(params?: ReportsQueueParams): Promise<PaginatedData<CommunityReportQueueItem>> {
    const res = await apiClient.get<ApiResponse<CommunityReportQueueItem[]>>('/intel/reports/queue', {
      params: {
        status: params?.status,
        region_id: params?.region_id,
        hazard_type_id: params?.hazard_type_id,
        cluster_id: params?.cluster_id,
        page: params?.page,
        per_page: params?.per_page ?? 20,
      },
    });

    // Normalize Laravel pagination response structure
    const meta = res.data.meta ?? {
      current_page: 1,
      last_page: 1,
      per_page: params?.per_page ?? 20,
      total: res.data.data.length,
    };

    return {
      current_page: (meta.current_page as number) ?? 1,
      last_page: (meta.last_page as number) ?? 1,
      per_page: (meta.per_page as number) ?? 20,
      total: (meta.total as number) ?? res.data.data.length,
      data: res.data.data,
    };
  },

  /**
   * Retrieve single community report detail with audit trail and triage metadata.
   * Endpoint: GET /api/v1/intel/reports/{id}
   */
  async getReportDetail(id: number): Promise<CommunityReportQueueItem> {
    const res = await apiClient.get<ApiResponse<CommunityReportQueueItem>>(`/intel/reports/${id}`);
    return res.data.data;
  },

  /**
   * Verify, investigate, or reject community report from intelligence triage desk.
   * Endpoint: POST /api/v1/intel/reports/{id}/verify
   */
  async verifyReport(id: number, payload: ReportVerificationPayload): Promise<CommunityReportQueueItem> {
    const res = await apiClient.post<ApiResponse<CommunityReportQueueItem>>(`/intel/reports/${id}/verify`, payload);
    return res.data.data;
  },

  // ==========================================
  // 7. CAP EARLY WARNING DISSEMINATION (FOR STEP 4)
  // ==========================================

  /**
   * Dispatch Common Alerting Protocol (CAP) early warning alert to citizens.
   * Endpoint: POST /api/v1/intel/alerts/dispatch
   */
  async dispatchAlert(payload: AlertDispatchPayload): Promise<AlertDispatchResponse> {
    const res = await apiClient.post<ApiResponse<AlertDispatchResponse>>('/intel/alerts/dispatch', payload);
    return res.data.data;
  },
};

export default intelligenceService;
