import type { Activity, Category, Trip } from '../types';

export interface ActivityFilter {
  query: string;
  category: Category | 'all';
}

/** Activities matching the text query (title or notes) and the category filter. */
export function filterActivities(activities: Activity[], filter: ActivityFilter): Activity[] {
  const q = filter.query.trim().toLowerCase();
  return activities.filter((a) => {
    if (filter.category !== 'all' && a.category !== filter.category) return false;
    if (!q) return true;
    return a.title.toLowerCase().includes(q) || a.notes.toLowerCase().includes(q);
  });
}

/** ISO date for day N (1-based) of a trip. Uses UTC so the result never shifts with time zones. */
export function dateForDay(startDate: string, day: number): string {
  const [y, m, d] = startDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + (day - 1)));
  return date.toISOString().slice(0, 10);
}

export function tripProgress(trip: Trip): { done: number; total: number } {
  return { done: trip.activities.filter((a) => a.done).length, total: trip.activities.length };
}

export function packingProgress(trip: Trip): { packed: number; total: number } {
  return { packed: trip.packing.filter((p) => p.packed).length, total: trip.packing.length };
}
