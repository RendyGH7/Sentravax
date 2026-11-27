import { useState, useEffect, useCallback, useRef } from 'react';
import { publicService } from '../services/public-service';
import type { PublicEmergencyContact, PublicEmergencyContactChannel } from '../types';

export interface NationalEmergencyHotlineItem {
  channelId: number;
  contactId: number;
  contactName: string;
  contactSlug: string;
  label: string;
  value: string;
  telUri: string;
  isTollFree: boolean;
  isPrimary: boolean;
  operatingHours: string | null;
  sortOrder: number;
}

interface HotlineState {
  hotlines: NationalEmergencyHotlineItem[];
  loading: boolean;
  error: string | null;
}

const CACHE_TTL_MS = 60_000;
let cachedHotlines: NationalEmergencyHotlineItem[] | null = null;
let cacheTimestamp = 0;

function getFreshCache(): NationalEmergencyHotlineItem[] | null {
  if (cachedHotlines !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedHotlines;
  }
  return null;
}

function validateDialableValue(value: string, channelType: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();

  if (channelType === 'shortcode') {
    const cleanDigits = trimmed.replace(/\D/g, '');
    return /^[0-9]{3,6}$/.test(cleanDigits) ? cleanDigits : null;
  }

  if (channelType === 'phone') {
    const cleanPhone = trimmed.replace(/[\s()-]/g, '');
    return /^\+?[0-9]{5,16}$/.test(cleanPhone) ? cleanPhone : null;
  }

  return null;
}

function extractNationalHotlines(contacts: PublicEmergencyContact[]): NationalEmergencyHotlineItem[] {
  const items: NationalEmergencyHotlineItem[] = [];

  for (const contact of contacts) {
    // Defense-in-depth: strictly enforce national scope
    if (contact.scope !== 'national' || !Array.isArray(contact.channels)) {
      continue;
    }

    for (const ch of contact.channels as PublicEmergencyContactChannel[]) {
      // Strictly filter emergency_hotline classification (never operational_contact like 117)
      if (ch.channel_classification !== 'emergency_hotline') {
        continue;
      }
      if (ch.channel_type !== 'shortcode' && ch.channel_type !== 'phone') {
        continue;
      }

      const dialable = validateDialableValue(ch.value, ch.channel_type);
      if (!dialable) {
        continue;
      }

      items.push({
        channelId: ch.id,
        contactId: contact.id,
        contactName: contact.name,
        contactSlug: contact.slug,
        label: ch.label,
        value: ch.value,
        telUri: `tel:${dialable}`,
        isTollFree: ch.is_toll_free === true,
        isPrimary: ch.is_primary === true,
        operatingHours: ch.operating_hours?.trim() || null,
        sortOrder: ch.sort_order,
      });
    }
  }

  return items.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.channelId - b.channelId;
  });
}

async function fetchAndCacheHotlines(signal: AbortSignal): Promise<NationalEmergencyHotlineItem[]> {
  const res = await publicService.getEmergencyContacts(
    { scope: 'national', per_page: 50 },
    signal
  );
  const extracted = extractNationalHotlines(res.data);
  cachedHotlines = extracted;
  cacheTimestamp = Date.now();
  return extracted;
}

function isCancellationError(err: any, signal: AbortSignal): boolean {
  return (
    signal.aborted ||
    err?.name === 'CanceledError' ||
    err?.name === 'AbortError' ||
    err?.code === 'ERR_CANCELED'
  );
}

export function useNationalEmergencyHotlines() {
  const [state, setState] = useState<HotlineState>(() => {
    const fresh = getFreshCache();
    return fresh !== null
      ? { hotlines: fresh, loading: false, error: null }
      : { hotlines: [], loading: true, error: null };
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (getFreshCache() !== null) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    fetchAndCacheHotlines(controller.signal)
      .then((extracted) => {
        if (!controller.signal.aborted) {
          setState({ hotlines: extracted, loading: false, error: null });
        }
      })
      .catch((err: any) => {
        if (isCancellationError(err, controller.signal)) {
          return;
        }
        console.error('Failed to synchronize national emergency hotlines:', err);
        setState({
          hotlines: [],
          loading: false,
          error: 'Gagal memuat hotline darurat resmi dari server.',
        });
      });

    return () => {
      controller.abort();
    };
  }, []);

  const retry = useCallback(() => {
    cachedHotlines = null;
    cacheTimestamp = 0;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ hotlines: [], loading: true, error: null });

    fetchAndCacheHotlines(controller.signal)
      .then((extracted) => {
        if (!controller.signal.aborted) {
          setState({ hotlines: extracted, loading: false, error: null });
        }
      })
      .catch((err: any) => {
        if (isCancellationError(err, controller.signal)) {
          return;
        }
        console.error('Failed to synchronize national emergency hotlines:', err);
        setState({
          hotlines: [],
          loading: false,
          error: 'Gagal memuat hotline darurat resmi dari server.',
        });
      });
  }, []);

  return {
    hotlines: state.hotlines,
    loading: state.loading,
    error: state.error,
    retry,
  };
}
