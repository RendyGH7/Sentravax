export type NotificationCategory =
  | 'ai_insight'
  | 'official_warning'
  | 'report_status'
  | 'disaster_alert'
  | 'system';

export type NotificationUrgency =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

export interface InAppNotification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  category: NotificationCategory;
  urgency: NotificationUrgency;
  read_at: string | null;
  is_read: boolean;
  related_type: string | null;
  related_id: number | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id?: number;
  user_id?: number;
  enable_ai_insights: boolean;
  enable_official_warnings: boolean;
  enable_report_status: boolean;
  enable_disaster_alerts: boolean;
  enable_system: boolean;
  in_app_enabled: boolean;
  min_urgency: string;
}

export interface NotificationListParams {
  category?: string;
  status?: 'all' | 'unread' | 'read';
  urgency?: string;
  page?: number;
  per_page?: number;
}

export interface NotificationListResponse {
  success: boolean;
  data: InAppNotification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    unread_count: number;
  };
}
