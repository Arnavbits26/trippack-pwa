import { describe, expect, it } from 'vitest';
import { parseState } from './persistence';

const goodTrip = {
  id: '1', name: 'Trip', destination: 'Place', startDate: '2026-01-01', days: 2,
  activities: [{ id: 'a', day: 1, time: '10:00', title: 'T', category: 'food', notes: '', done: false }],
  packing: [{ id: 'p', label: 'Hat', packed: false }],
};

describe('parseState', () => {
  it('accepts a valid saved state', () => {
    expect(parseState(JSON.stringify({ trips: [goodTrip] }))?.trips).toHaveLength(1);
  });

  it('returns undefined for missing, corrupt or wrongly shaped data', () => {
    expect(parseState(null)).toBeUndefined();
    expect(parseState('{not json')).toBeUndefined();
    expect(parseState(JSON.stringify({ trips: 'nope' }))).toBeUndefined();
    expect(parseState(JSON.stringify({ trips: [{ id: 1 }] }))).toBeUndefined();
  });

  it('rejects activities with an unknown category', () => {
    const bad = { ...goodTrip, activities: [{ ...goodTrip.activities[0], category: 'party' }] };
    expect(parseState(JSON.stringify({ trips: [bad] }))).toBeUndefined();
  });
});
