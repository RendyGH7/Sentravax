export * from './auth';
export * from './disaster';
export * from './siaga';
export * from './admin';
export * from './intelligence';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    timestamp?: string;
    version?: string;
    environment?: string;
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedData<T> {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: T[];
}
