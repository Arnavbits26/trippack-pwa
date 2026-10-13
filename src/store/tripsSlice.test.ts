import { describe, expect, it } from 'vitest';
import reducer, {
  addActivity,
  addPackingItem,
  addTrip,
  removeActivity,
  removePackingItem,
  removeTrip,
  toggleActivity,
  togglePacked,
} from './tripsSlice';
import type { TripsState } from '../types';

const empty: TripsState = { trips: [] };

function withTrip(days = 3): { state: TripsState; tripId: string } {
  const action = addTrip({ name: '  Bali  ', destination: ' Ubud ', startDate: '2026-12-30', days });
  return { state: reducer(empty, action), tripId: action.payload.id };
}

describe('trips reducer', () => {
  it('adds a trip with trimmed text and empty lists', () => {
    const { state } = withTrip();
    expect(state.trips).toHaveLength(1);
    expect(state.trips[0]).toMatchObject({ name: 'Bali', destination: 'Ubud', days: 3 });
    expect(state.trips[0].activities).toEqual([]);
    expect(state.trips[0].packing).toEqual([]);
  });

  it('clamps trip length to 1..14 days', () => {
    expect(withTrip(0).state.trips[0].days).toBe(1);
    expect(withTrip(99).state.trips[0].days).toBe(14);
  });

  it('keeps activities sorted by day, then time', () => {
    let { state, tripId } = withTrip();
    const add = (day: number, time: string, title: string) => {
      state = reducer(state, addActivity({ tripId, day, time, title, category: 'activity', notes: '' }));
    };
    add(2, '08:00', 'Breakfast');
    add(1, '15:00', 'Museum');
    add(1, '09:30', 'Airport pickup');
    expect(state.trips[0].activities.map((a) => a.title)).toEqual(['Airport pickup', 'Museum', 'Breakfast']);
  });

  it('toggles and removes an activity', () => {
    let { state, tripId } = withTrip();
    state = reducer(state, addActivity({ tripId, day: 1, time: '10:00', title: 'Hike', category: 'activity', notes: '' }));
    const activityId = state.trips[0].activities[0].id;
    state = reducer(state, toggleActivity({ tripId, activityId }));
    expect(state.trips[0].activities[0].done).toBe(true);
    state = reducer(state, toggleActivity({ tripId, activityId }));
    expect(state.trips[0].activities[0].done).toBe(false);
    state = reducer(state, removeActivity({ tripId, activityId }));
    expect(state.trips[0].activities).toHaveLength(0);
  });

  it('manages the packing list', () => {
    let { state, tripId } = withTrip();
    state = reducer(state, addPackingItem({ tripId, label: ' Passport ' }));
    const itemId = state.trips[0].packing[0].id;
    expect(state.trips[0].packing[0]).toMatchObject({ label: 'Passport', packed: false });
    state = reducer(state, togglePacked({ tripId, itemId }));
    expect(state.trips[0].packing[0].packed).toBe(true);
    state = reducer(state, removePackingItem({ tripId, itemId }));
    expect(state.trips[0].packing).toHaveLength(0);
  });

  it('removes a trip and ignores unknown trip ids', () => {
    let { state, tripId } = withTrip();
    const unchanged = reducer(state, addActivity({ tripId: 'nope', day: 1, time: '10:00', title: 'x', category: 'food', notes: '' }));
    expect(unchanged.trips[0].activities).toHaveLength(0);
    state = reducer(state, removeTrip(tripId));
    expect(state.trips).toHaveLength(0);
  });
});
