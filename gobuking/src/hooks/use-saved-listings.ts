'use client';
import { useMemo, useSyncExternalStore } from 'react';
import { getDemoAccount } from '@/features/account/lib/demo-auth';
import {
  readSavedIds,
  writeSavedIds,
  SAVED_EVENT as EVENT,
} from '@/lib/saved-store';
function snapshot() {
  try {
    return JSON.stringify(readSavedIds(getDemoAccount()?.id));
  } catch {
    return '[]';
  }
}
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  window.addEventListener('gobuking:demo-account-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('gobuking:demo-account-change', callback);
  };
}
export function useSavedListings() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  const saved = useMemo(() => {
    try {
      const value: unknown = JSON.parse(raw);
      return Array.isArray(value)
        ? value.filter((v): v is string => typeof v === 'string')
        : [];
    } catch {
      return [];
    }
  }, [raw]);
  function update(next: string[]) {
    writeSavedIds(next, getDemoAccount()?.id);
  }
  return { saved, update };
}
