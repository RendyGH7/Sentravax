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

const CACHE_TTL_MS = 60_000;
let cachedHotlines: NationalEmergencyHotlineItem[] | null = null;
let cacheTimestamp = 0;

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

export function useNationalEmergencyHotlines() {
  const hasFreshCache = cachedHotlines !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;

  const [hotlines, setHotlines] = useState<NationalEmergencyHotlineItem[]>(
    hasFreshCache && cachedHotlines ? cachedHotlines : []
  );
  const [loading, setLoading] = useState<boolean>(!hasFreshCache);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const loadHotlines = useCallback(async (bypassCache = false) => {
    if (!bypassCache && cachedHotlines !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      setHotlines(cachedHotlines);
      setLoading(false);
      setError(null);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await publicService.getEmergencyContacts(
        { scope: 'national', per_page: 50 },
        controller.signal
      );
      const extracted = extractNationalHotlines(res.data);
      cachedHotlines = extracted;
      cacheTimestamp = Date.now();
      setHotlines(extracted);
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to synchronize national emergency hotlines:', err);
      setHotlines([]);
      setError('Gagal memuat hotline darurat resmi dari server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotlines(false);
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [loadHotlines]);

  const retry = useCallback(() => {
    cachedHotlines = null;
    cacheTimestamp = 0;
    loadHotlines(true);
  }, [loadHotlines]);

  return { hotlines, loading, error, retry };
}
