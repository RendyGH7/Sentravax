import apiClient from '../lib/axios';
import type {
  ApiResponse,
  User,
  UserDashboardData,
  UserSavedRegionItem,
  SaveRegionPayload,
  UserNotificationItem,
  PaginatedData,
  CommunityReportItem,
  CommunityReportDetail,
  CreateReportPayload,
  CreateReportResult,
  FamilyPlanData,
  PreparednessPlanItem,
  UpdatePlanPayload,
  EmergencyContactItem,
  CreateContactPayload,
  ChecklistOverviewData,
  ToggleChecklistResult,
  SimulationScenarioItem,
  ScenarioAttemptResult,
} from '../types';

export interface UserReportsQueryParams {
  status?: 'pending' | 'verified' | 'rejected';
  page?: number;
  per_page?: number;
}

export interface UserReportsResult {
  items: CommunityReportItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Service for communicating with SENTRAVAX User Portal (Portal Warga & Siaga Personal) endpoints.
 * All endpoints in this service require stateful session cookie authentication.
 */
export const userService = {
  // ==========================================
  // 1. DASHBOARD & PROFILE
  // ==========================================

  /**
   * Get authenticated user's dashboard overview, preparedness summary, and active regional alerts.
   * Endpoint: GET /api/v1/user/dashboard
   */
  async getDashboard(): Promise<UserDashboardData> {
    const res = await apiClient.get<ApiResponse<UserDashboardData>>('/user/dashboard');
    return res.data.data;
  },

  /**
   * Get authenticated user's profile details.
   * Endpoint: GET /api/v1/user/profile
   */
  async getProfile(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/user/profile');
    return res.data.data;
  },

  /**
   * Update authenticated user's display name.
   * Endpoint: PUT /api/v1/user/profile
   */
  async updateProfile(payload: { name: string }): Promise<User> {
    const res = await apiClient.put<ApiResponse<User>>('/user/profile', payload);
    return res.data.data;
  },

  // ==========================================
  // 2. SAVED MONITORED REGIONS
  // ==========================================

  /**
   * Get list of user's saved monitored regions (home, work, family).
   * Endpoint: GET /api/v1/user/saved-regions
   */
  async getSavedRegions(): Promise<UserSavedRegionItem[]> {
    const res = await apiClient.get<ApiResponse<UserSavedRegionItem[]>>('/user/saved-regions');
    return res.data.data;
  },

  /**
   * Add a new monitored administrative region to user's personal list.
   * Endpoint: POST /api/v1/user/saved-regions
   */
  async saveRegion(payload: SaveRegionPayload): Promise<UserSavedRegionItem> {
    const res = await apiClient.post<ApiResponse<UserSavedRegionItem>>('/user/saved-regions', payload);
    return res.data.data;
  },

  /**
   * Remove a monitored region from user's personal list.
   * Endpoint: DELETE /api/v1/user/saved-regions/{id}
   */
  async deleteSavedRegion(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/user/saved-regions/${id}`);
  },

  // ==========================================
  // 3. NOTIFICATIONS
  // ==========================================

  /**
   * Get paginated in-app disaster notifications for the authenticated user.
   * Endpoint: GET /api/v1/user/notifications
   */
  async getNotifications(page?: number): Promise<PaginatedData<UserNotificationItem>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<UserNotificationItem>>>('/user/notifications', {
      params: { page },
    });
    return res.data.data;
  },

  /**
   * Mark a single notification as read.
   * Endpoint: POST /api/v1/user/notifications/{id}/read
   */
  async markNotificationAsRead(id: number): Promise<void> {
    await apiClient.post<ApiResponse<null>>(`/user/notifications/${id}/read`);
  },

  /**
   * Mark all unread notifications as read.
   * Endpoint: POST /api/v1/user/notifications/read-all
   */
  async markAllNotificationsAsRead(): Promise<void> {
    await apiClient.post<ApiResponse<null>>('/user/notifications/read-all');
  },

  // ==========================================
  // 4. CITIZEN COMMUNITY REPORTS
  // ==========================================

  /**
   * Get list of disaster reports submitted by the authenticated user with status filtering.
   * Endpoint: GET /api/v1/user/reports
   */
  async getReports(params?: UserReportsQueryParams): Promise<UserReportsResult> {
    const res = await apiClient.get<ApiResponse<CommunityReportItem[]>>('/user/reports', {
      params,
    });
    return {
      items: res.data.data,
      meta: {
        current_page: res.data.meta?.current_page ?? 1,
        last_page: res.data.meta?.last_page ?? 1,
        per_page: res.data.meta?.per_page ?? 15,
        total: res.data.meta?.total ?? res.data.data.length,
      },
    };
  },

  /**
   * Submit a new citizen community disaster report with GPS coordinates and optional photo.
   * Endpoint: POST /api/v1/user/reports
   */
  async createReport(payload: CreateReportPayload): Promise<CreateReportResult> {
    const formData = new FormData();
    formData.append('hazard_type_id', String(payload.hazard_type_id));
    formData.append('region_id', String(payload.region_id));
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));
    if (payload.photo) {
      formData.append('photo', payload.photo);
    }

    const res = await apiClient.post<ApiResponse<CreateReportResult>>('/user/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  /**
   * Get detailed status, photo, and moderation audit notes of a submitted report.
   * Endpoint: GET /api/v1/user/reports/{id}
   */
  async getReportDetail(id: number): Promise<CommunityReportDetail> {
    const res = await apiClient.get<ApiResponse<CommunityReportDetail>>(`/user/reports/${id}`);
    return res.data.data;
  },

  // ==========================================
  // 5. SIAGA PERSONAL: FAMILY PREPAREDNESS PLAN
  // ==========================================

  /**
   * Get user's family preparedness plan (assembly points, notes) and emergency contacts directory.
   * Endpoint: GET /api/v1/user/preparedness/plan
   */
  async getFamilyPlan(): Promise<FamilyPlanData> {
    const res = await apiClient.get<ApiResponse<FamilyPlanData>>('/user/preparedness/plan');
    return res.data.data;
  },

  /**
   * Update user's family preparedness plan assembly points and evacuation notes.
   * Endpoint: PUT /api/v1/user/preparedness/plan
   */
  async updateFamilyPlan(payload: UpdatePlanPayload): Promise<PreparednessPlanItem> {
    const res = await apiClient.put<ApiResponse<PreparednessPlanItem>>('/user/preparedness/plan', payload);
    return res.data.data;
  },

  /**
   * Add a new emergency priority contact for family safety.
   * Endpoint: POST /api/v1/user/preparedness/contacts
   */
  async addEmergencyContact(payload: CreateContactPayload): Promise<EmergencyContactItem> {
    const res = await apiClient.post<ApiResponse<EmergencyContactItem>>('/user/preparedness/contacts', payload);
    return res.data.data;
  },

  /**
   * Delete an emergency contact.
   * Endpoint: DELETE /api/v1/user/preparedness/contacts/{id}
   */
  async deleteEmergencyContact(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/user/preparedness/contacts/${id}`);
  },

  // ==========================================
  // 6. SIAGA PERSONAL: GO-BAG CHECKLIST
  // ==========================================

  /**
   * Get master 13 BNPB checklist items grouped by 5 categories with user's completion status.
   * Endpoint: GET /api/v1/user/preparedness/checklist
   */
  async getChecklist(): Promise<ChecklistOverviewData> {
    const res = await apiClient.get<ApiResponse<ChecklistOverviewData>>('/user/preparedness/checklist');
    return res.data.data;
  },

  /**
   * Toggle completion state of a disaster go-bag checklist item.
   * Endpoint: POST /api/v1/user/preparedness/checklist/{itemId}/toggle
   */
  async toggleChecklistItem(itemId: number): Promise<ToggleChecklistResult> {
    const res = await apiClient.post<ApiResponse<ToggleChecklistResult>>(
      `/user/preparedness/checklist/${itemId}/toggle`
    );
    return res.data.data;
  },

  // ==========================================
  // 7. SIAGA PERSONAL: INTERACTIVE DISASTER SIMULATION
  // ==========================================

  /**
   * Get list of available disaster simulation scenarios.
   * Endpoint: GET /api/v1/user/preparedness/scenarios
   */
  async getScenarios(): Promise<SimulationScenarioItem[]> {
    const res = await apiClient.get<ApiResponse<SimulationScenarioItem[]>>('/user/preparedness/scenarios');
    return res.data.data;
  },

  /**
   * Get single scenario briefing, context, and questions with masked correct answers.
   * Endpoint: GET /api/v1/user/preparedness/scenarios/{idOrSlug}
   */
  async getScenarioDetail(idOrSlug: number | string): Promise<SimulationScenarioItem> {
    const res = await apiClient.get<ApiResponse<SimulationScenarioItem>>(
      `/user/preparedness/scenarios/${idOrSlug}`
    );
    return res.data.data;
  },

  /**
   * Submit user answers for a simulation scenario and receive score and educational feedback.
   * Endpoint: POST /api/v1/user/preparedness/scenarios/{id}/attempt
   */
  async submitScenarioAttempt(
    id: number,
    answers: Record<number | string, string>
  ): Promise<ScenarioAttemptResult> {
    const res = await apiClient.post<ApiResponse<ScenarioAttemptResult>>(
      `/user/preparedness/scenarios/${id}/attempt`,
      { answers }
    );
    return res.data.data;
  },
};

export default userService;

