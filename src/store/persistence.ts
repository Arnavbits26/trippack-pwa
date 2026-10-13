import type { Activity, PackingItem, Trip, TripsState } from '../types';

export const STORAGE_KEY = 'trippack:v1';

const CATEGORY_VALUES = ['transport', 'stay', 'food', 'activity'];

function isActivity(v: unknown): v is Activity {
  const a = v as Activity;
  return (
    !!a &&
    typeof a.id === 'string' &&
    typeof a.day === 'number' &&
    typeof a.time === 'string' &&
    typeof a.title === 'string' &&
    typeof a.notes === 'string' &&
    typeof a.done === 'boolean' &&
    CATEGORY_VALUES.includes(a.category)
  );
}

function isPackingItem(v: unknown): v is PackingItem {
  const p = v as PackingItem;
  return !!p && typeof p.id === 'string' && typeof p.label === 'string' && typeof p.packed === 'boolean';
}

function isTrip(v: unknown): v is Trip {
  const t = v as Trip;
  return (
    !!t &&
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.destination === 'string' &&
    typeof t.startDate === 'string' &&
    typeof t.days === 'number' &&
    Array.isArray(t.activities) &&
    t.activities.every(isActivity) &&
    Array.isArray(t.packing) &&
    t.packing.every(isPackingItem)
  );
}

/**
 * Reads saved state defensively: anything malformed (corrupt JSON, wrong shape, storage
 * disabled) is ignored, so a bad value can never stop the app from starting.
 */
export function parseState(raw: string | null): TripsState | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as TripsState;
    if (parsed && Array.isArray(parsed.trips) && parsed.trips.every(isTrip)) return parsed;
  } catch {
    /* fall through */
  }
  return undefined;
}

export function loadState(): { trips: TripsState } | undefined {
  try {
    const parsed = parseState(window.localStorage.getItem(STORAGE_KEY));
    return parsed ? { trips: parsed } : undefined;
  } catch {
    return undefined; // storage unavailable (private mode, disabled cookies)
  }
}

export function saveState(state: TripsState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded or storage unavailable: keep working in memory */
  }
}
