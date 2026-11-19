export type ConnectivityState =
  | 'LIVE'
  | 'STATIC'
  | 'OFFLINE'
  | 'UNKNOWN';

export type FreshnessState =
  | 'FRESH'
  | 'DELAYED'
  | 'STALE'
  | 'UNAVAILABLE'
  | 'SIMULATED'
  | 'UNKNOWN';

export type ProvenanceType =
  | 'OFFICIAL'
  | 'OBSERVED'
  | 'COMMUNITY_REPORT'
  | 'SENTRAVAX_INSIGHT'
  | 'SIMULATED'
  | 'CURATED_REFERENCE';

export interface FreshnessInfo {
  connectivity_state?: ConnectivityState;
  freshness_state?: FreshnessState;
  provenance_type?: ProvenanceType;
  state?: FreshnessState;
  threshold_fresh_minutes?: number;
  threshold_delayed_minutes?: number;
  threshold_stale_minutes?: number;
  minutes_since_observation?: number | null;
  minutes_since_fetch?: number | null;
  minutes_since_last_sync?: number | null;
  explanation: string;
}

export interface AdminOverviewStats {
  total_users: number;
  curated_events_total: number;
  curated_events_active: number;
  pending_verification_reports: number;
  active_cap_alerts: number;
}

export interface InfrastructureStatus {
  database_connected: boolean;
  postgis_version: string;
  database_engine: string;
  latency_ms: number;
  system_uptime: string;
}

export interface DataSourceItem {
  id: number;
  name: string;
  slug: string;
  provider: string;
  source_type: string;
  category: string;
  endpoint_url?: string | null;
  sync_interval_minutes: number;
  rate_limit_rpm: number;
  terms_of_service?: string | null;
  status: 'active' | 'inactive' | 'degraded' | 'offline';
  is_simulated: boolean;
  metadata?: Record<string, unknown> | null;
  last_fetched_at?: string | null;
  last_observed_at?: string | null;
  last_successful_at?: string | null;
  connectivity_state?: ConnectivityState;
  freshness_state: FreshnessState;
  provenance_type?: ProvenanceType;
  freshness_info?: FreshnessInfo;
  created_at?: string;
  updated_at?: string;
  sync_runs?: SyncRunItem[];
}

export interface SyncRunItem {
  id: number;
  data_source_id: number;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'PARTIAL';
  freshness_state: FreshnessState;
  items_fetched: number;
  items_persisted: number;
  duration_ms: number;
  error_message?: string | null;
  provenance_metadata?: {
    endpoint?: string;
    correlation_id?: string;
    is_simulated?: boolean;
    observed_at?: string;
    fetched_at?: string;
    [key: string]: unknown;
  } | null;
  synced_at: string;
}

export interface SystemHealthData {
  timestamp: string;
  overall_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  database: {
    status: 'ONLINE' | 'OFFLINE';
    latency_ms: number;
    engine: string;
  };
  postgis: {
    status: 'ONLINE' | 'OFFLINE';
    version: string;
  };
  queue_worker: {
    driver: string;
    pending_jobs: number;
    failed_jobs: number;
    status: 'OPTIMAL' | 'ATTENTION' | 'ERROR';
  };
  storage: {
    status: 'WRITEABLE' | 'READONLY' | 'ERROR';
    disks: Record<string, string>;
  };
  scheduler: {
    heartbeat_status: 'HEALTHY' | 'BEHIND' | 'UNKNOWN';
    last_run: string;
  };
  external_connectivity: Record<
    string,
    {
      url: string;
      status: 'REACHABLE' | 'UNREACHABLE' | 'ERROR';
      http_code?: number | null;
      latency_ms: number;
      error?: string | null;
    }
  >;
}

export interface FailedJobItem {
  id: number;
  uuid: string;
  connection: string;
  queue: string;
  failed_at: string;
  exception_sanitized: string;
}
