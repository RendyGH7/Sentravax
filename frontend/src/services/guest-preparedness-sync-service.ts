import { userService } from './user-service';
import type { User } from '../types/auth';
import type { SyncChecklistResult } from '../types/siaga';
import { toast } from 'sonner';

export const GOBAG_PRIMARY_STORAGE_KEY = 'sentravax_gobag_checklist';
export const GOBAG_LEGACY_STORAGE_KEY = 'sentravax_gobag_checked';

export interface SyncOperationResult {
  success: boolean;
  result?: SyncChecklistResult;
  error?: unknown;
  reason?: 'UNVERIFIED_EMAIL' | 'EMPTY_ITEMS' | 'NO_USER' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'ABORTED';
  deferred?: boolean;
}

// In-flight concurrency lock and cancellation state
let activeSyncPromise: Promise<SyncOperationResult | null> | null = null;
let activeSyncUserId: number | null = null;
let activeAbortController: AbortController | null = null;

/**
 * Service to manage guest Go-Bag checklist persistence in browser localStorage
 * and safely migrate it to an authenticated user account upon login or registration.
 */
export const guestPreparednessSyncService = {
  /**
   * Read and parse guest checklist from localStorage.
   * Tolerates both Record<string, boolean> and number[] / string[] formats.
   */
  getGuestChecklistItems(): number[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const itemsSet = new Set<number>();

    const parseRaw = (raw: string | null) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((val) => {
            const num = Number(val);
            if (!isNaN(num) && num > 0) {
              itemsSet.add(num);
            }
          });
        } else if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([key, val]) => {
            if (val === true || val === 1 || val === '1') {
              const num = Number(key);
              if (!isNaN(num) && num > 0) {
                itemsSet.add(num);
              }
            }
          });
        }
      } catch {
        // Ignore JSON parse errors for corrupt entries
      }
    };

    // Check primary key first, then legacy/secondary key
    parseRaw(localStorage.getItem(GOBAG_PRIMARY_STORAGE_KEY));
    parseRaw(localStorage.getItem(GOBAG_LEGACY_STORAGE_KEY));

    return Array.from(itemsSet);
  },

  /**
   * Determine if any guest Go-Bag checklist items are pending migration.
   */
  hasGuestChecklistItems(): boolean {
    return this.getGuestChecklistItems().length > 0;
  },

  /**
   * Clear all guest checklist items from browser localStorage.
   * CRITICAL: Only called AFTER server confirms successful synchronization with HTTP 200.
   * NEVER called blindly on logout or failed sync, ensuring guest data is never lost.
   */
  clearGuestChecklist(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      localStorage.removeItem(GOBAG_PRIMARY_STORAGE_KEY);
      localStorage.removeItem(GOBAG_LEGACY_STORAGE_KEY);
    } catch {
      // Ignore storage access errors
    }
  },

  /**
   * Cancel or detach any in-flight sync when user logs out or switches accounts.
   * Ensures in-flight network responses do not clear or corrupt local storage.
   */
  cancelInFlightSync(): void {
    if (activeAbortController) {
      try {
        activeAbortController.abort();
      } catch {
        // Ignore abort errors
      }
    }
    activeSyncPromise = null;
    activeSyncUserId = null;
    activeAbortController = null;
  },

  /**
   * Synchronize guest Go-Bag checklist to authenticated user account.
   * Non-blocking: will never crash the calling flow or block redirects.
   * Concurrency-guarded: deduplicates simultaneous calls for the same user.
   */
  syncGuestChecklistToServer(
    user?: User | null,
    silent = false
  ): Promise<SyncOperationResult | null> {
    if (!user) {
      return Promise.resolve({ success: false, reason: 'NO_USER' });
    }

    if (user.role !== 'user') {
      return Promise.resolve(null);
    }

    // EDGE CASE: If account email is unverified, defer sync until email verification completes.
    // Retain guest items in localStorage so data is not lost or prematurely rejected with 403.
    if (user.email_verified_at === null) {
      return Promise.resolve({
        success: false,
        reason: 'UNVERIFIED_EMAIL',
        deferred: true,
      });
    }

    const itemIds = this.getGuestChecklistItems();
    if (itemIds.length === 0) {
      return Promise.resolve({ success: false, reason: 'EMPTY_ITEMS' });
    }

    // CONCURRENCY LOCK: If a sync is already running for this user, reuse the active promise directly
    if (activeSyncPromise && activeSyncUserId === user.id) {
      return activeSyncPromise;
    }

    const currentUserId = user.id;
    activeSyncUserId = currentUserId;
    activeAbortController = new AbortController();

    activeSyncPromise = (async (): Promise<SyncOperationResult> => {
      try {
        const result = await userService.syncChecklist(itemIds);

        // RACE CONDITION CHECK: Verify that active user hasn't switched or logged out
        if (activeSyncUserId !== currentUserId) {
          return { success: true, result, reason: 'ABORTED' };
        }

        // CRITICAL: Only clear localStorage AFTER server confirms success
        this.clearGuestChecklist();

        if (!silent && result.synced_count > 0) {
          toast.success('Progres Tas Siaga Berhasil Disinkronkan', {
            description: `${result.synced_count} item checklist dari sesi publik Anda telah digabungkan ke akun.`,
          });
        }

        return { success: true, result };
      } catch (err: unknown) {
        // On network failure or API error, keep localStorage intact so it can be retried later
        console.warn('[GuestPreparednessSync] Failed to sync guest checklist to user account:', err);
        return { success: false, error: err, reason: 'NETWORK_ERROR' };
      } finally {
        if (activeSyncUserId === currentUserId) {
          activeSyncPromise = null;
          activeSyncUserId = null;
          activeAbortController = null;
        }
      }
    })();

    return activeSyncPromise;
  },
};
