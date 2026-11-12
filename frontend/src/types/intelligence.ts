import type { HazardTypeItem, RegionItem } from './disaster';

export interface IntelligenceTelemetryStatus {
  stream_status: string;
  sources_connected: string;
  postgis_status: string;
  last_sync?: string;
}

export interface SimulationProjectionData {
  scenario_name: string;
  freshness: string;
  hazard_type: string;
  active_layer: string;
  zone: string;
  data_nature: string;
  elevation_source: string;
  disclaimer: string;
  metrics: {
    exposed_population: number;
    population_trend: string;
    critical_facilities_in_radius: {
      total: number;
      breakdown?: string;
    };
    river_discharge_status: {
      level: string;
      current_flow_m3_s: number;
      critical_threshold_m3_s: number;
    };
  };
  timeline_steps: string[];
  current_step: string;
}

export interface ProactiveAiInsightItem {
  id: number;
  title: string;
  summary: string;
  recommendations: string[];
  confidence_score: number;
  insight_type: string;
  generation_mode: string;
  model_name?: string;
  evidence?: Array<Record<string, unknown>>;
  hazard_type?: HazardTypeItem | null;
  region?: RegionItem | null;
  created_at: string;
}

export interface IntelligenceOverviewData {
  telemetry: IntelligenceTelemetryStatus;
  metrics: {
    active_threats: number;
    unverified_reports: number;
    active_cap_alerts: number;
    proactive_insights_generated: number;
  };
  simulation_projection: SimulationProjectionData;
  recent_insights: ProactiveAiInsightItem[];
}
