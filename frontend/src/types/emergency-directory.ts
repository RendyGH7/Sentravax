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

// ============================================================================
// ADMIN EMERGENCY DIRECTORY TYPES (Phase 6.6.4.4 — Parent Contact Management)
// ============================================================================

export interface AdminEmergencyContactActor {
  id: number;
  name: string;
  email: string;
}

export interface AdminEmergencyContactChannel extends PublicEmergencyContactChannel {
  emergency_contact_id: number;
  verification_status: EmergencyDirectoryVerificationStatus;
  verification_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminEmergencyContact {
  id: number;
  name: string;
  slug: string;
  category: EmergencyDirectoryCategory;
  scope: EmergencyDirectoryScope;
  region_id: number | null;
  region: PublicEmergencyContactRegion | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  verification_status: EmergencyDirectoryVerificationStatus;
  publication_status: EmergencyDirectoryPublicationStatus;
  created_by: number | null;
  updated_by: number | null;
  creator?: AdminEmergencyContactActor | null;
  updater?: AdminEmergencyContactActor | null;
  channels?: AdminEmergencyContactChannel[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AdminEmergencyDirectoryStats {
  total: number;
  verified: number;
  unverified: number;
  published: number;
  draft: number;
  archived: number;
  total_channels: number;
  active_channels: number;
}

export interface AdminEmergencyDirectoryQueryParams {
  q?: string;
  category?: EmergencyDirectoryCategory;
  scope?: EmergencyDirectoryScope;
  verification_status?: EmergencyDirectoryVerificationStatus;
  publication_status?: EmergencyDirectoryPublicationStatus;
  region_id?: number;
  with_trashed?: boolean;
  per_page?: number;
  page?: number;
}

export interface AdminEmergencyDirectoryListResponse {
  data: AdminEmergencyContact[];
  meta: PublicEmergencyDirectoryPaginationMeta;
  stats: AdminEmergencyDirectoryStats;
}

export interface AdminEmergencyContactParentPayload {
  name: string;
  slug?: string;
  category: EmergencyDirectoryCategory;
  scope: EmergencyDirectoryScope;
  region_id: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
}

// ============================================================================
// ADMIN EMERGENCY CONTACT CHANNELS TYPES (Phase 6.6.4.5)
// ============================================================================

export interface AdminEmergencyChannelCreatePayload {
  channel_type: EmergencyDirectoryChannelType;
  channel_classification: EmergencyDirectoryChannelClassification;
  label: string;
  value: string;
  is_toll_free?: boolean;
  is_primary?: boolean;
  operating_hours?: string | null;
  verification_status?: EmergencyDirectoryVerificationStatus;
  source_name: string;
  source_url: string;
  verification_notes?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface AdminEmergencyChannelUpdatePayload {
  channel_type?: EmergencyDirectoryChannelType;
  channel_classification?: EmergencyDirectoryChannelClassification;
  label?: string;
  value?: string;
  is_toll_free?: boolean;
  is_primary?: boolean;
  operating_hours?: string | null;
  source_name?: string;
  source_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface AdminEmergencyChannelVerifyPayload {
  verification_status: EmergencyDirectoryVerificationStatus;
  source_name: string;
  source_url: string;
  verification_notes?: string | null;
}

// ============================================================================
// ADMIN EMERGENCY DIRECTORY AUDIT LOG TYPES (Phase 6.6.4.6)
// ============================================================================

export type EmergencyDirectoryAuditEntityType =
  | 'emergency_contact'
  | 'emergency_contact_channel';

export interface AdminEmergencyAuditParentRef {
  id: number;
  name: string;
  slug: string;
}

export interface AdminEmergencyAuditLogItem {
  id: number;
  entity_type: EmergencyDirectoryAuditEntityType;
  entity_id: number;
  parent_contact_id: number;
  actor_id: number | null;
  actor?: AdminEmergencyContactActor | null;
  parent_contact?: AdminEmergencyAuditParentRef | null;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AdminEmergencyAuditQueryParams {
  entity_type?: EmergencyDirectoryAuditEntityType;
  entity_id?: number;
  parent_contact_id?: number;
  actor_id?: number;
  action?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

export interface AdminEmergencyAuditListResponse {
  data: AdminEmergencyAuditLogItem[];
  meta: PublicEmergencyDirectoryPaginationMeta;
}
