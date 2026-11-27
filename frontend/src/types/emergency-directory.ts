/**
 * SENTRAVAX Emergency Directory TypeScript Definitions
 * Aligned with Backend Phase 6.6.2 & 6.6.3 Contracts:
 * - App\Models\EmergencyContact
 * - App\Models\EmergencyContactChannel
 * - App\Http\Controllers\Api\V1\Public\PublicEmergencyDirectoryController
 */

export type EmergencyDirectoryCategory =
  | 'disaster_management'
  | 'sar'
  | 'police'
  | 'medical'
  | 'fire'
  | 'red_cross'
  | 'other';

export type EmergencyDirectoryScope = 'national' | 'provincial' | 'regency';

export type EmergencyDirectoryVerificationStatus =
  | 'verified'
  | 'unverified'
  | 'source_unavailable'
  | 'rejected';

export type EmergencyDirectoryPublicationStatus = 'draft' | 'published' | 'archived';

export type EmergencyDirectoryChannelType =
  | 'shortcode'
  | 'phone'
  | 'whatsapp'
  | 'email'
  | 'website';

export type EmergencyDirectoryChannelClassification =
  | 'emergency_hotline'
  | 'operational_contact'
  | 'office_contact'
  | 'informational_contact';

export interface PublicEmergencyContactRegion {
  id: number;
  code: string;
  name: string;
  level: string;
}

export interface PublicEmergencyContactChannel {
  id: number;
  channel_type: EmergencyDirectoryChannelType;
  channel_classification: EmergencyDirectoryChannelClassification;
  label: string;
  value: string;
  is_toll_free: boolean;
  is_primary: boolean;
  operating_hours: string | null;
  source_name: string;
  source_url: string;
  verified_at: string | null;
  sort_order: number;
}

export interface PublicEmergencyContact {
  id: number;
  name: string;
  slug: string;
  category: EmergencyDirectoryCategory;
  scope: EmergencyDirectoryScope;
  region: PublicEmergencyContactRegion | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  channels: PublicEmergencyContactChannel[];
}

export interface PublicEmergencyDirectoryQueryParams {
  q?: string;
  category?: EmergencyDirectoryCategory;
  scope?: EmergencyDirectoryScope;
  region_id?: number;
  per_page?: number;
  page?: number;
}

export interface PublicEmergencyDirectoryPaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PublicEmergencyDirectoryResponse {
  data: PublicEmergencyContact[];
  meta: PublicEmergencyDirectoryPaginationMeta;
}

export type PublicEmergencyContactDetailResponse = PublicEmergencyContact;
