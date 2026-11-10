export * from './auth';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
    version: string;
    environment?: string;
    [key: string]: any;
  };
}

export type HazardType = 
  | 'flood'
  | 'earthquake'
  | 'tsunami'
  | 'landslide'
  | 'volcano'
  | 'wildfire'
  | 'extreme_weather'
  | 'drought';

export type AlertLevel = 'info' | 'advisory' | 'watch' | 'warning';

