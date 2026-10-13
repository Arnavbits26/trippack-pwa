import { describe, expect, it } from 'vitest';
import { dateForDay, filterActivities, packingProgress, tripProgress } from './selectors';
import type { Activity, Trip } from '../types';

const act = (over: Partial<Activity>): Activity => ({
  id: Math.random().toString(),
  day: 1,
  time: '09:00',
  title: 'Item',
  category: 'activity',
  notes: '',
  done: false,
  ...over,
});

describe('selectors', () => {
  const list = [
    act({ title: 'Flight to Denpasar', category: 'transport' }),
    act({ title: 'Warung lunch', category: 'food', notes: 'Try nasi campur' }),
    act({ title: 'Temple visit', category: 'activity' }),
  ];

  it('filters by text in title or notes, case-insensitively', () => {
    expect(filterActivities(list, { query: 'NASI', category: 'all' })).toHaveLength(1);
    expect(filterActivities(list, { query: 'flight', category: 'all' })[0].title).toBe('Flight to Denpasar');
  });

  it('filters by category and combines with text', () => {
    expect(filterActivities(list, { query: '', category: 'food' })).toHaveLength(1);
    expect(filterActivities(list, { query: 'temple', category: 'food' })).toHaveLength(0);
  });

  it('returns everything for an empty filter', () => {
    expect(filterActivities(list, { query: '  ', category: 'all' })).toHaveLength(3);
  });

  it('computes day dates across month and year boundaries', () => {
    expect(dateForDay('2026-12-30', 1)).toBe('2026-12-30');
    expect(dateForDay('2026-12-30', 3)).toBe('2027-01-01');
    expect(dateForDay('2028-02-28', 2)).toBe('2028-02-29'); // leap year
  });

  it('computes progress counts', () => {
    const trip: Trip = {
      id: 't', name: 'n', destination: 'd', startDate: '2026-01-01', days: 1,
      activities: [act({ done: true }), act({ done: false })],
      packing: [{ id: 'p', label: 'x', packed: true }],
    };
    expect(tripProgress(trip)).toEqual({ done: 1, total: 2 });
    expect(packingProgress(trip)).toEqual({ packed: 1, total: 1 });
  });
});
