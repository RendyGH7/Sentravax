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
  provider: string;
  source_type?: string;
  category?: string;
  endpoint_url?: string;
  status: 'active' | 'degraded' | 'offline';
  last_fetched_at?: string | null;
  last_successful_at?: string | null;
  freshness_state?: 'LIVE' | 'STATIC' | 'SIMULATED' | 'STALE' | 'UNAVAILABLE';
  notes?: string | null;
  sync_runs?: SyncRunItem[];
}

export interface SyncRunItem {
  id: number;
  data_source_id: number;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'PARTIAL';
  freshness_state: 'LIVE' | 'STATIC' | 'SIMULATED' | 'STALE' | 'UNAVAILABLE';
  items_fetched: number;
  items_persisted: number;
  duration_ms: number;
  error_message?: string | null;
  provenance_metadata?: Record<string, unknown> | null;
  synced_at: string;
}

