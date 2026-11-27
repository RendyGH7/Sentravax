import apiClient from '../lib/axios';
import type {
  InAppNotification,
  NotificationListParams,
  NotificationListResponse,
  NotificationPreferences,
} from '../types/notification';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
}

export const notificationService = {
  /**
   * Fetch paginated list of user notifications with filtering.
   * Endpoint: GET /api/v1/notifications
   */
  async getNotifications(params?: NotificationListParams, signal?: AbortSignal): Promise<NotificationListResponse> {
    const res = await apiClient.get<NotificationListResponse>('/notifications', { params, signal });
    return res.data;
  },

  /**
   * Fetch single notification detail.
   * Endpoint: GET /api/v1/notifications/{id}
   */
  async getNotification(id: number): Promise<InAppNotification> {
    const res = await apiClient.get<ApiResponse<InAppNotification>>(`/notifications/${id}`);
    return res.data.data;
  },

  /**
   * Mark a single notification as read.
   * Endpoint: PATCH /api/v1/notifications/{id}/read
   */
  async markAsRead(id: number): Promise<{ unread_count: number }> {
    const res = await apiClient.patch<ApiResponse<{ unread_count: number }>>(`/notifications/${id}/read`);
    return res.data.data;
  },

  /**
   * Mark all unread notifications as read.
   * Endpoint: POST /api/v1/notifications/read-all
   */
  async markAllAsRead(): Promise<{ unread_count: number }> {
    const res = await apiClient.post<ApiResponse<{ unread_count: number }>>('/notifications/read-all');
    return res.data.data;
  },

  /**
   * Fetch user notification preferences.
   * Endpoint: GET /api/v1/me/notification-preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const res = await apiClient.get<ApiResponse<NotificationPreferences>>('/me/notification-preferences');
    return res.data.data;
  },

  /**
   * Update user notification preferences.
   * Endpoint: PUT /api/v1/me/notification-preferences
   */
  async updatePreferences(payload: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const res = await apiClient.put<ApiResponse<NotificationPreferences>>('/me/notification-preferences', payload);
    return res.data.data;
  },
};
