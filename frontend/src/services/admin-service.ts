import apiClient from '../lib/axios';
import type { ApiResponse, EducationContentItem, AdminEducationPayload } from '../types';
import type {
  AdminOverviewStats,
  InfrastructureStatus,
  DataSourceItem,
  SystemHealthData,
  FailedJobItem,
} from '../types/admin';
import type {
  ShelterItem,
  ShelterDetail,
  ShelterFormData,
  AdminShelterStats,
} from '../types/shelter';
import type {
  AdminEmergencyContact,
  AdminEmergencyDirectoryStats,
  AdminEmergencyDirectoryQueryParams,
  AdminEmergencyDirectoryListResponse,
  AdminEmergencyContactParentPayload,
} from '../types/emergency-directory';

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

  /**
   * List all shelters for admin management with filters and operational metrics.
   * Endpoint: GET /api/v1/admin/shelters
   */
  async getShelters(params?: {
    q?: string;
    facility_type?: string;
    operational_status?: string;
    verification_status?: string;
    region_id?: number;
    with_trashed?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: ShelterItem[];
    stats: AdminShelterStats;
    meta: { current_page: number; last_page: number; total: number; per_page: number };
  }> {
    const res = await apiClient.get<ApiResponse<{
      data: ShelterItem[];
      current_page: number;
      last_page: number;
      total: number;
      per_page: number;
    }> & { stats: AdminShelterStats }>('/admin/shelters', { params });

    const innerData = res.data.data;
    return {
      data: innerData.data,
      stats: res.data.stats || {
        total: 0,
        verified: 0,
        pending: 0,
        open: 0,
        full: 0,
        standby: 0,
        closed: 0,
        total_capacity: 0,
        total_occupancy: 0,
      },
      meta: {
        current_page: innerData.current_page,
        last_page: innerData.last_page,
        total: innerData.total,
        per_page: innerData.per_page,
      },
    };
  },

  /**
   * Get single shelter detail for admin inspection & editing.
   * Endpoint: GET /api/v1/admin/shelters/{id}
   */
  async getShelter(id: number): Promise<ShelterDetail> {
    const res = await apiClient.get<ApiResponse<ShelterDetail>>(`/admin/shelters/${id}`);
    return res.data.data;
  },

  /**
   * Register a new verified or pending emergency shelter.
   * Endpoint: POST /api/v1/admin/shelters
   */
  async createShelter(payload: ShelterFormData): Promise<ShelterDetail> {
    const res = await apiClient.post<ApiResponse<ShelterDetail>>('/admin/shelters', payload);
    return res.data.data;
  },

  /**
   * Update shelter information and log revision to provenance audit trail.
   * Endpoint: PUT /api/v1/admin/shelters/{id}
   */
  async updateShelter(id: number, payload: Partial<ShelterFormData>): Promise<ShelterDetail> {
    const res = await apiClient.put<ApiResponse<ShelterDetail>>(`/admin/shelters/${id}`, payload);
    return res.data.data;
  },

  /**
   * Quick update shelter operational status, occupancy, or verification status.
   * Endpoint: PUT /api/v1/admin/shelters/{id}/status
   */
  async updateShelterStatus(
    id: number,
    payload: {
      operational_status?: string;
      verification_status?: string;
      current_occupancy?: number;
      notes?: string;
    }
  ): Promise<ShelterDetail> {
    const res = await apiClient.put<ApiResponse<ShelterDetail>>(`/admin/shelters/${id}/status`, payload);
    return res.data.data;
  },

  /**
   * Soft-deactivate shelter, preserving complete public audit history.
   * Endpoint: DELETE /api/v1/admin/shelters/{id}
   */
  async deleteShelter(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/admin/shelters/${id}`);
  },

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  /**
   * Fetch registered users with role and search filter.
   * Endpoint: GET /api/v1/admin/users
   */
  async getUsers(params?: {
    role?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ items: AdminUserItem[]; meta: { current_page: number; last_page: number; total: number } }> {
    const res = await apiClient.get<ApiResponse<AdminUserItem[]>>('/admin/users', { params });
    return {
      items: res.data.data || [],
      meta: (res.data as any).meta || { current_page: 1, last_page: 1, total: 0 },
    };
  },

  /**
   * Get single user details.
   * Endpoint: GET /api/v1/admin/users/{id}
   */
  async getUser(id: number): Promise<AdminUserDetail> {
    const res = await apiClient.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`);
    return res.data.data;
  },

  /**
   * Register a new user with specific role.
   * Endpoint: POST /api/v1/admin/users
   */
  async createUser(payload: CreateUserPayload): Promise<AdminUserItem> {
    const res = await apiClient.post<ApiResponse<AdminUserItem>>('/admin/users', payload);
    return res.data.data;
  },

  /**
   * Update user role and profile.
   * Endpoint: PUT /api/v1/admin/users/{id}/role
   */
  async updateUserRole(
    id: number,
    payload: { role: 'admin' | 'intelligence' | 'user'; name?: string; phone?: string }
  ): Promise<AdminUserItem> {
    const res = await apiClient.put<ApiResponse<AdminUserItem>>(`/admin/users/${id}/role`, payload);
    return res.data.data;
  },

  /**
   * Delete or deactivate user account.
   * Endpoint: DELETE /api/v1/admin/users/{id}
   */
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/admin/users/${id}`);
  },

  // ==========================================
  // COMMUNITY REPORT MODERATION
  // ==========================================

  /**
   * Fetch community reports for administrative curation.
   * Endpoint: GET /api/v1/admin/reports
   */
  async getReports(params?: {
    status?: string;
    hazard_type_id?: number;
    cluster_id?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ items: AdminReportItem[]; meta: { current_page: number; last_page: number; total: number } }> {
    const res = await apiClient.get<ApiResponse<AdminReportItem[]>>('/admin/reports', { params });
    return {
      items: res.data.data || [],
      meta: (res.data as any).meta || { current_page: 1, last_page: 1, total: 0 },
    };
  },

  /**
   * Get detail of a specific citizen disaster report with audit trail.
   * Endpoint: GET /api/v1/admin/reports/{id}
   */
  async getReport(id: number): Promise<AdminReportItem> {
    const res = await apiClient.get<ApiResponse<AdminReportItem>>(`/admin/reports/${id}`);
    return res.data.data;
  },

  /**
   * Verify or reject citizen report with immutable audit log.
   * Endpoint: POST /api/v1/admin/reports/{id}/verify
   */
  async verifyReport(
    id: number,
    payload: { status: 'verified' | 'rejected' | 'investigation'; notes?: string }
  ): Promise<AdminReportItem> {
    const res = await apiClient.post<ApiResponse<AdminReportItem>>(`/admin/reports/${id}/verify`, payload);
    return res.data.data;
  },

  /**
   * Delete abusive or fraudulent report.
   * Endpoint: DELETE /api/v1/admin/reports/{id}
   */
  async deleteReport(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/admin/reports/${id}`);
  },

  // ==========================================
  // DISASTER EVENTS CRUD
  // ==========================================

  /**
   * Fetch official disaster events.
   * Endpoint: GET /api/v1/admin/events
   */
  async getEvents(params?: {
    hazard_type_id?: number;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ items: AdminEventItem[]; meta: { current_page: number; last_page: number; total: number } }> {
    const res = await apiClient.get<ApiResponse<AdminEventItem[]>>('/admin/events', { params });
    return {
      items: res.data.data || [],
      meta: (res.data as any).meta || { current_page: 1, last_page: 1, total: 0 },
    };
  },

  /**
   * Get single event detail.
   * Endpoint: GET /api/v1/admin/events/{id}
   */
  async getEvent(id: number): Promise<AdminEventItem> {
    const res = await apiClient.get<ApiResponse<AdminEventItem>>(`/admin/events/${id}`);
    return res.data.data;
  },

  /**
   * Store new official disaster event.
   * Endpoint: POST /api/v1/admin/events
   */
  async createEvent(payload: Partial<AdminEventItem>): Promise<AdminEventItem> {
    const res = await apiClient.post<ApiResponse<AdminEventItem>>('/admin/events', payload);
    return res.data.data;
  },

  /**
   * Update existing disaster event.
   * Endpoint: PUT /api/v1/admin/events/{id}
   */
  async updateEvent(id: number, payload: Partial<AdminEventItem>): Promise<AdminEventItem> {
    const res = await apiClient.put<ApiResponse<AdminEventItem>>(`/admin/events/${id}`, payload);
    return res.data.data;
  },

  /**
   * Delete disaster event.
   * Endpoint: DELETE /api/v1/admin/events/{id}
   */
  async deleteEvent(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/admin/events/${id}`);
  },

  // ==========================================
  // CAP ALERTS CRUD
  // ==========================================

  /**
   * Fetch official alerts.
   * Endpoint: GET /api/v1/admin/alerts
   */
  async getAlerts(params?: {
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ items: AdminAlertItem[]; meta: { current_page: number; last_page: number; total: number } }> {
    const res = await apiClient.get<ApiResponse<AdminAlertItem[]>>('/admin/alerts', { params });
    return {
      items: res.data.data || [],
      meta: (res.data as any).meta || { current_page: 1, last_page: 1, total: 0 },
    };
  },

  /**
   * Create and publish CAP alert.
   * Endpoint: POST /api/v1/admin/alerts
   */
  async createAlert(payload: Partial<AdminAlertItem>): Promise<AdminAlertItem> {
    const res = await apiClient.post<ApiResponse<AdminAlertItem>>('/admin/alerts', payload);
    return res.data.data;
  },

  /**
   * Update CAP alert.
   * Endpoint: PUT /api/v1/admin/alerts/{id}
   */
  async updateAlert(id: number, payload: Partial<AdminAlertItem>): Promise<AdminAlertItem> {
    const res = await apiClient.put<ApiResponse<AdminAlertItem>>(`/admin/alerts/${id}`, payload);
    return res.data.data;
  },

  /**
   * Delete CAP alert.
   * Endpoint: DELETE /api/v1/admin/alerts/{id}
   */
  async deleteAlert(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/admin/alerts/${id}`);
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================

  /**
   * Fetch unified system-wide audit logs.
   * Endpoint: GET /api/v1/admin/audit-logs
   */
  async getAuditLogs(params?: {
    category?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ items: AdminAuditLogItem[]; meta: { current_page: number; last_page: number; total: number } }> {
    const res = await apiClient.get<ApiResponse<AdminAuditLogItem[]>>('/admin/audit-logs', { params });
    return {
      items: res.data.data || [],
      meta: (res.data as any).meta || { current_page: 1, last_page: 1, total: 0 },
    };
  },

  // ==========================================
  // EMERGENCY DIRECTORY (PARENT CONTACTS)
  // ==========================================

  /**
   * List emergency contacts for Admin management with strict contract validation.
   * Endpoint: GET /api/v1/admin/emergency-contacts
   */
  async getEmergencyContacts(
    params?: AdminEmergencyDirectoryQueryParams,
    signal?: AbortSignal
  ): Promise<AdminEmergencyDirectoryListResponse> {
    const res = await apiClient.get<
      ApiResponse<AdminEmergencyContact[]> & { stats?: AdminEmergencyDirectoryStats }
    >('/admin/emergency-contacts', {
      params,
      signal,
    });

    const payload = res.data;
    if (!payload || payload.success !== true || !Array.isArray(payload.data)) {
      throw new Error('Respons daftar kontak darurat admin tidak sesuai kontrak (data bukan array valid).');
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
      throw new Error('Metadata paginasi kontak darurat admin tidak valid atau tidak lengkap.');
    }

    const stats = payload.stats;
    if (!stats || typeof stats.total !== 'number') {
      throw new Error('Ringkasan statistik kontak darurat admin tidak tersedia pada respons API.');
    }

    return {
      data: payload.data,
      meta: {
        current_page: meta.current_page,
        per_page: meta.per_page,
        total: meta.total,
        last_page: meta.last_page,
      },
      stats,
    };
  },

  /**
   * Fetch single emergency contact detail for Admin view/edit.
   * Endpoint: GET /api/v1/admin/emergency-contacts/{id}
   */
  async getEmergencyContactDetail(id: number, signal?: AbortSignal): Promise<AdminEmergencyContact> {
    const res = await apiClient.get<ApiResponse<AdminEmergencyContact>>(`/admin/emergency-contacts/${id}`, {
      signal,
    });
    const payload = res.data;
    if (!payload || payload.success !== true || !payload.data || typeof payload.data.id !== 'number') {
      throw new Error('Respons detail kontak darurat admin tidak valid.');
    }
    return payload.data;
  },

  /**
   * Create a new parent emergency contact record (defaults to unverified/draft on backend).
   * Endpoint: POST /api/v1/admin/emergency-contacts
   */
  async createEmergencyContact(payload: AdminEmergencyContactParentPayload): Promise<AdminEmergencyContact> {
    const res = await apiClient.post<ApiResponse<AdminEmergencyContact>>('/admin/emergency-contacts', payload);
    if (!res.data || res.data.success !== true || !res.data.data) {
      throw new Error(res.data?.message || 'Gagal membuat kontak darurat baru.');
    }
    return res.data.data;
  },

  /**
   * Update parent fields of an existing emergency contact (does not mutate channels).
   * Endpoint: PUT /api/v1/admin/emergency-contacts/{id}
   */
  async updateEmergencyContact(
    id: number,
    payload: Partial<AdminEmergencyContactParentPayload>
  ): Promise<AdminEmergencyContact> {
    const res = await apiClient.put<ApiResponse<AdminEmergencyContact>>(`/admin/emergency-contacts/${id}`, payload);
    if (!res.data || res.data.success !== true || !res.data.data) {
      throw new Error(res.data?.message || 'Gagal memperbarui data kontak darurat.');
    }
    return res.data.data;
  },

  /**
   * Soft-delete an emergency contact record.
   * Endpoint: DELETE /api/v1/admin/emergency-contacts/{id}
   */
  async deleteEmergencyContact(id: number): Promise<{ message: string }> {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/emergency-contacts/${id}`);
    if (!res.data || res.data.success !== true) {
      throw new Error(res.data?.message || 'Gagal mengarsipkan (soft delete) kontak darurat.');
    }
    return { message: res.data.message || 'Kontak darurat berhasil diarsipkan.' };
  },
};

// Export interfaces for UI consumption
export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'intelligence' | 'user';
  phone?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AdminUserDetail extends AdminUserItem {
  community_reports_count?: number;
  saved_regions_count?: number;
  notifications_count?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: 'admin' | 'intelligence' | 'user';
  password: string;
  phone?: string;
}

export interface AdminReportItem {
  id: number;
  user_id?: number | null;
  hazard_type_id: number;
  region_id: number;
  title: string;
  description: string;
  photo_path?: string | null;
  photo_url?: string | null;
  status: 'pending' | 'verified' | 'rejected' | 'investigation';
  cluster_id?: string | null;
  verified_by?: number | null;
  verified_at?: string | null;
  created_at: string;
  latitude: number;
  longitude: number;
  hazard_type?: { id: number; slug: string; name: string; icon?: string };
  region?: { id: number; code: string; name: string; level: string };
  user?: { id: number; name: string };
  verifier?: { id: number; name: string; role?: string };
}

export interface AdminEventItem {
  id: number;
  title: string;
  description?: string | null;
  hazard_type_id: number;
  region_id?: number | null;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  radius_km?: number | null;
  source_type?: string | null;
  started_at: string;
  ended_at?: string | null;
  hazard_type?: { id: number; name: string; slug: string };
  region?: { id: number; name: string };
}

export interface AdminAlertItem {
  id: number;
  title: string;
  alert_class: string;
  severity: string;
  urgency: string;
  certainty: string;
  status: string;
  scope?: string;
  sender_name?: string;
  area_description?: string;
  instruction?: string;
  effective_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface AdminAuditLogItem {
  id: string;
  category: 'REPORT_VERIFICATION' | 'DATA_SOURCE_SYNC' | 'SHELTER_REGISTRY';
  actor: {
    name: string;
    role: string;
  };
  action: string;
  target: string;
  notes?: string | null;
  timestamp: string;
}
