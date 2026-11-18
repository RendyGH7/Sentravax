import apiClient from '../lib/axios';
import type { ApiResponse, EducationContentItem, AdminEducationPayload } from '../types';
import type {
  AdminOverviewStats,
  InfrastructureStatus,
  DataSourceItem,
  SystemHealthData,
  FailedJobItem,
} from '../types/admin';

export interface AdminOverviewApiResponse {
  counts: AdminOverviewStats;
  system_health: InfrastructureStatus;
  data_sources: {
    total: number;
    active: number;
    freshness: Record<string, number>;
  };
  recent_reports: Array<{
    id: number;
    report_number: string;
    hazard_title: string;
    location_name: string;
    reported_at: string;
    status: string;
  }>;
}

export interface DataSourcesFilterParams {
  category?: string;
  status?: string;
}

export const adminService = {
  /**
   * Fetch overview metrics and telemetry for Admin Workspace.
   * Endpoint: GET /api/v1/admin/overview
   */
  async getOverview(): Promise<AdminOverviewApiResponse> {
    const res = await apiClient.get<ApiResponse<AdminOverviewApiResponse>>('/admin/overview');
    return res.data.data;
  },

  /**
   * Fetch all registered data sources with optional category and status filtering.
   * Endpoint: GET /api/v1/admin/data-sources
   */
  async getDataSources(params?: DataSourcesFilterParams): Promise<DataSourceItem[]> {
    const res = await apiClient.get<ApiResponse<DataSourceItem[]>>('/admin/data-sources', { params });
    return res.data.data;
  },

  /**
   * Fetch single data source details including sync runs history.
   * Endpoint: GET /api/v1/admin/data-sources/{id}
   */
  async getDataSource(id: number): Promise<DataSourceItem> {
    const res = await apiClient.get<ApiResponse<DataSourceItem>>(`/admin/data-sources/${id}`);
    return res.data.data;
  },

  /**
   * Toggle data source active state.
   * Endpoint: POST /api/v1/admin/data-sources/{id}/toggle
   */
  async toggleDataSource(id: number, active?: boolean): Promise<DataSourceItem> {
    const res = await apiClient.post<ApiResponse<DataSourceItem>>(`/admin/data-sources/${id}/toggle`, {
      active,
    });
    return res.data.data;
  },

  /**
   * Trigger manual ingestion sync for a data source.
   * Endpoint: POST /api/v1/admin/data-sources/{id}/sync
   */
  async triggerSync(id: number, runAsync: boolean = false): Promise<{
    sync_run?: unknown;
    queued?: boolean;
    job_id?: string;
    status: string;
  }> {
    const res = await apiClient.post<ApiResponse<{
      sync_run?: unknown;
      queued?: boolean;
      job_id?: string;
      status: string;
    }>>(`/admin/data-sources/${id}/sync`, { run_async: runAsync });
    return res.data.data;
  },

  /**
   * Fetch live operational system health diagnostics.
   * Endpoint: GET /api/v1/admin/monitoring/system-health
   */
  async getSystemHealth(): Promise<SystemHealthData> {
    const res = await apiClient.get<ApiResponse<SystemHealthData>>('/admin/monitoring/system-health');
    return res.data.data;
  },

  /**
   * Fetch list of failed queue jobs with sanitized exceptions.
   * Endpoint: GET /api/v1/admin/monitoring/failed-jobs
   */
  async getFailedJobs(): Promise<FailedJobItem[]> {
    const res = await apiClient.get<ApiResponse<FailedJobItem[]>>('/admin/monitoring/failed-jobs');
    return res.data.data;
  },

  /**
   * Retry a failed queue job.
   * Endpoint: POST /api/v1/admin/monitoring/failed-jobs/{id}/retry
   */
  async retryFailedJob(id: number): Promise<{ retried: boolean; job_id: number }> {
    const res = await apiClient.post<ApiResponse<{ retried: boolean; job_id: number }>>(
      `/admin/monitoring/failed-jobs/${id}/retry`
    );
    return res.data.data;
  },

  /**
   * Dismiss a failed queue job.
   * Endpoint: DELETE /api/v1/admin/monitoring/failed-jobs/{id}
   */
  async dismissFailedJob(id: number): Promise<{ dismissed: boolean; job_id: number }> {
    const res = await apiClient.delete<ApiResponse<{ dismissed: boolean; job_id: number }>>(
      `/admin/monitoring/failed-jobs/${id}`
    );
    return res.data.data;
  },

  /**
   * List education mitigation guides for administration.
   * Endpoint: GET /api/v1/admin/education
   */
  async getEducationList(params?: {
    category?: string;
    hazard_type_id?: number;
    search?: string;
    is_published?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: EducationContentItem[]; meta: { current_page: number; last_page: number; total: number; per_page: number } }> {
    const res = await apiClient.get<ApiResponse<EducationContentItem[]>>('/admin/education', { params });
    return {
      data: res.data.data,
      meta: (res.data.meta as { current_page: number; last_page: number; total: number; per_page: number }) || {
        current_page: 1,
        last_page: 1,
        total: res.data.data.length,
        per_page: 15,
      },
    };
  },

  /**
   * Create a new education mitigation guide.
   * Endpoint: POST /api/v1/admin/education
   */
  async createEducation(payload: AdminEducationPayload): Promise<EducationContentItem> {
    const res = await apiClient.post<ApiResponse<EducationContentItem>>('/admin/education', payload);
    return res.data.data;
  },

  /**
   * Update an existing education mitigation guide.
   * Endpoint: PUT /api/v1/admin/education/{id}
   */
  async updateEducation(id: number, payload: Partial<AdminEducationPayload>): Promise<EducationContentItem> {
    const res = await apiClient.put<ApiResponse<EducationContentItem>>(`/admin/education/${id}`, payload);
    return res.data.data;
  },

  /**
   * Delete an education guide.
   * Endpoint: DELETE /api/v1/admin/education/{id}
   */
  async deleteEducation(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/admin/education/${id}`);
  },
};
