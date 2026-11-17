import type { HazardTypeItem, RegionItem } from './disaster';
import type { DataSourceItem } from './admin';

export type { HazardTypeItem, RegionItem, DataSourceItem };

/**
 * Valid broadcast levels according to locked backend contract.
 * Strictly: local, regional, national.
 */
export type IntelligenceBroadcastLevel = 'local' | 'regional' | 'national';

/**
 * Valid alert classes according to locked backend contract.
 * Strictly: advisory, watch, warning.
 */
export type IntelligenceAlertClass = 'advisory' | 'watch' | 'warning';

/**
 * Valid multi-hazard risk levels according to Risk Engine.
 */
export type IntelligenceRiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'insufficient_data';

/**
 * Valid data freshness states according to Data Engine provenance.
 */
export type IntelligenceFreshnessState = 'LIVE' | 'STATIC' | 'SIMULATED' | 'STALE' | 'UNAVAILABLE';

/**
 * Telemetry status emitted by the Geospatial Command Center.
 */
export interface IntelligenceTelemetryStatus {
  stream_status: string;
  sources_connected: string;
  postgis_status: string;
  last_sync?: string | null;
}

/**
 * Core metric counters for active intelligence operations.
 */
export interface IntelligenceOverviewMetrics {
  active_threats: number;
  unverified_reports: number;
  active_cap_alerts: number;
  proactive_insights_generated: number;
}

/**
 * Critical facilities breakdown within simulation impact radius.
 */
export interface SimulationCriticalFacilities {
  total: number;
  breakdown?: string;
}

/**
 * Hydrological river discharge status from telemetry monitoring.
 */
export interface SimulationRiverDischarge {
  level: string;
  current_flow_m3_s: number;
  critical_threshold_m3_s: number;
}

/**
 * Numerical and categorical telemetry metrics for simulation scenarios.
 */
export interface SimulationMetrics {
  exposed_population: number;
  population_trend: string;
  critical_facilities_in_radius: SimulationCriticalFacilities;
  river_discharge_status: SimulationRiverDischarge;
}

/**
 * Multi-hazard hydrological projection and terrain simulation scenario.
 * Explicitly carries DEMONSTRATION_SCENARIO provenance and disclaimer.
 */
export interface SimulationProjectionData {
  scenario_name: string;
  freshness: string;
  hazard_type: string;
  active_layer: string;
  zone: string;
  data_nature: string;
  elevation_source: string;
  disclaimer: string;
  metrics: SimulationMetrics;
  timeline_steps: string[];
  current_step: string;
}

/**
 * Individual indicator contributing to AI Proactive Insight.
 */
export interface AiInsightIndicator {
  name: string;
  value: string | number;
  unit?: string;
}

/**
 * External or internal data source status attached to insight evidence.
 */
export interface AiInsightDataSourceInfo {
  name: string;
  type: string;
  status: string;
}

/**
 * Threat escalation evaluation data and triggers.
 */
export interface AiInsightThreatEscalation {
  is_escalating: boolean;
  level: 'CRITICAL' | 'ELEVATED' | 'INVESTIGATION_SIGNAL' | 'DATA_UNAVAILABLE' | 'STABLE';
  triggers: string[];
}

/**
 * Audit and spatial evidence metadata attached to AI Proactive Insights.
 */
export interface AiInsightEvidence {
  region_code?: string;
  hazard_slug?: string;
  confidence_level?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  confidence_basis?: string;
  evidence_strength?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  threat_escalation?: AiInsightThreatEscalation;
  indicators?: AiInsightIndicator[];
  data_sources?: AiInsightDataSourceInfo[];
  data_freshness?: string;
  computed_risk_score?: number;
  methodology?: string;
  active_hazard_events?: number;
  verified_community_reports?: number;
  telemetry_sync?: string;
  [key: string]: unknown;
}

/**
 * Proactive AI Insight record explaining risk dynamics and mitigation actions.
 */
export interface ProactiveAiInsightItem {
  id: number;
  risk_assessment_id?: number | null;
  title: string;
  region_id?: number | null;
  hazard_type_id?: number | null;
  insight_type: string;
  summary: string;
  recommendations: string[];
  confidence_score: number;
  confidence_level?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  generation_mode: string;
  model_name?: string | null;
  evidence?: AiInsightEvidence | Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
  hazard_type?: HazardTypeItem | null;
  region?: RegionItem | null;
  risk_assessment?: RiskAssessmentItem | null;
}

/**
 * Root data payload for GET /api/v1/intel/overview.
 */
export interface IntelligenceOverviewData {
  telemetry: IntelligenceTelemetryStatus;
  metrics: IntelligenceOverviewMetrics;
  simulation_projection: SimulationProjectionData;
  recent_insights: ProactiveAiInsightItem[];
}

/**
 * Individual active threat factor contributing to event score.
 */
export interface ThreatFactorItem {
  id: number;
  title: string;
  hazard_type: string;
  hazard_slug: string;
  severity: string;
  occurred_at: string;
  contribution: number;
  data_source_id?: number | null;
  source_name: string;
  provider_name?: string;
  provenance_status?: 'LIVE' | 'STATIC' | 'SIMULATED' | 'STALE' | 'UNAVAILABLE';
  provenance_label?: string;
}

/**
 * Individual official alert factor contributing to alert score.
 */
export interface AlertFactorItem {
  id: number;
  title: string;
  broadcast_level: string;
  alert_class: string;
  starts_at: string;
}

/**
 * Detailed calculation factors returned by RiskEngineService.
 */
export interface CalculationFactors {
  baseline_vulnerability?: {
    weight: number;
    contribution: number;
    description: string;
  };
  nearby_active_events?: {
    weight: number;
    contribution: number;
    count: number;
    threats: ThreatFactorItem[];
    description: string;
  };
  official_alerts?: {
    weight: number;
    contribution: number;
    alerts: AlertFactorItem[];
    description: string;
  };
  data_quality?: {
    status: 'FRESH' | 'STALE' | 'UNAVAILABLE' | string;
    description: string;
  };
  [key: string]: unknown;
}

/**
 * Multi-Hazard Risk Assessment record evaluated by RiskEngineService.
 */
export interface RiskAssessmentItem {
  id: number;
  hazard_event_id?: number | null;
  region_id?: number | null;
  hazard_type_id?: number | null;
  title?: string | null;
  risk_score: number;
  risk_level: IntelligenceRiskLevel;
  methodology_version?: string | null;
  impact_radius_meters: number;
  affected_population_estimate?: number | null;
  calculation_factors?: CalculationFactors | null;
  assessed_at: string;
  created_at?: string;
  updated_at?: string;
  region?: RegionItem | null;
  hazard_type?: HazardTypeItem | null;
  hazard_event?: Record<string, unknown> | null;
}

/**
 * Request payload for POST /api/v1/intel/risk/evaluate.
 */
export interface RiskEvaluationRequest {
  region_id: number;
  hazard_type_id: number;
  title?: string | null;
}

/**
 * Request payload for POST /api/v1/intel/insights/generate.
 */
export interface AiInsightGenerationRequest {
  region_id: number;
  hazard_type_id: number;
  risk_assessment_id?: number | null;
}

/**
 * Standard GeoJSON Point / Multi-geometry representation for Intel Map.
 */
export interface IntelGeoJsonGeometry {
  type: 'Point' | 'Polygon' | 'MultiPolygon' | 'LineString';
  coordinates: number[] | number[][] | number[][][];
}

/**
 * Feature properties emitted by GET /api/v1/intel/map.
 */
export interface IntelGeoJsonFeatureProperties {
  layer: 'hazard_events' | 'community_reports' | string;
  id: number;
  title: string;
  severity?: 'low' | 'medium' | 'high' | string;
  status: string;
  hazard_type?: string | null;
  hazard_code?: string | null;
  region?: string | null;
  occurred_at?: string | null;
  cluster_id?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

/**
 * Single GeoJSON feature for intelligence spatial layers.
 */
export interface IntelGeoJsonFeature {
  type: 'Feature';
  geometry: IntelGeoJsonGeometry;
  properties: IntelGeoJsonFeatureProperties;
}

/**
 * Standard GeoJSON FeatureCollection emitted by GET /api/v1/intel/map.
 */
export interface IntelGeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: IntelGeoJsonFeature[];
}

/**
 * Candidate report detected within 1.5km spatiotemporal duplicate window.
 */
export interface DuplicateCandidateItem {
  id: number;
  title: string;
  status: string;
  cluster_id?: string | null;
  created_at: string;
  dist_deg?: number;
}

/**
 * Spatiotemporal duplicate detection metadata.
 */
export interface ReportDuplicateDetection {
  is_duplicate_suspect: boolean;
  cluster_id?: string | null;
  nearby_count: number;
  candidates?: DuplicateCandidateItem[];
}

/**
 * Audit log entry recording verification decision on community report.
 */
export interface ReportVerificationAuditItem {
  id: number;
  community_report_id: number;
  verified_by: number;
  previous_status: string;
  new_status: string;
  notes?: string | null;
  created_at: string;
  verifier?: {
    id: number;
    name: string;
    role: string;
  } | null;
}

/**
 * Item in the intelligence verification queue for crowdsourced reports.
 * Emitted by GET /api/v1/intel/reports/queue.
 */
export interface CommunityReportQueueItem {
  id: number;
  user_id?: number | null;
  hazard_type_id: number;
  region_id?: number | null;
  title: string;
  description: string;
  photo_path?: string | null;
  status: 'pending' | 'investigating' | 'verified' | 'rejected';
  cluster_id?: string | null;
  moderation_notes?: string | null;
  verified_by?: number | null;
  verified_at?: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  priority_score?: number;
  priority_level?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority_reasons?: string[];
  duplicate_detection?: ReportDuplicateDetection;
  hazard_type?: HazardTypeItem | null;
  region?: RegionItem | null;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  verifications?: ReportVerificationAuditItem[];
}

/**
 * Request payload for POST /api/v1/intel/reports/{id}/verify.
 */
export interface ReportVerificationPayload {
  status: 'investigating' | 'verified' | 'rejected';
  notes?: string | null;
}

/**
 * Request payload for POST /api/v1/intel/alerts/dispatch (CAP Dissemination).
 */
export interface AlertDispatchPayload {
  hazard_type_id: number;
  region_id: number;
  hazard_event_id?: number | null;
  title: string;
  message: string;
  alert_class: IntelligenceAlertClass;
  broadcast_level: IntelligenceBroadcastLevel;
  starts_at: string;
  expires_at: string;
}

/**
 * Response payload for POST /api/v1/intel/alerts/dispatch.
 */
export interface AlertDispatchResponse {
  alert: {
    id: number;
    hazard_type_id: number;
    region_id: number;
    hazard_event_id?: number | null;
    created_by: number;
    title: string;
    message: string;
    alert_class: IntelligenceAlertClass;
    broadcast_level: IntelligenceBroadcastLevel;
    status: string;
    starts_at: string;
    expires_at: string;
    created_at: string;
    updated_at: string;
    hazard_type?: HazardTypeItem | null;
    region?: RegionItem | null;
  };
  dissemination: {
    cap_status: string;
    recipients_count: number;
    timestamp: string;
  };
}

/**
 * Response from GET /api/v1/intel/ping authorization probe.
 */
export interface IntelligencePingResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    name: string;
    role: string;
  };
}

/**
 * Re-export DataSourceItem for convenient access in intelligence context.
 */
export type IntelligenceDataSourceItem = DataSourceItem;
