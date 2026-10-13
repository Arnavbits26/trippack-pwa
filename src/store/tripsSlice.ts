import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { newId } from './id';
import type { Activity, Category, PackingItem, Trip, TripsState } from '../types';

export const MIN_DAYS = 1;
export const MAX_DAYS = 14;

const initialState: TripsState = { trips: [] };

/** Orders activities by day, then by time, then by title, so the list is stable. */
export function compareActivities(a: Activity, b: Activity): number {
  return a.day - b.day || a.time.localeCompare(b.time) || a.title.localeCompare(b.title);
}

function findTrip(state: TripsState, tripId: string): Trip | undefined {
  return state.trips.find((t) => t.id === tripId);
}

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    addTrip: {
      reducer(state, action: PayloadAction<Trip>) {
        state.trips.push(action.payload);
      },
      prepare(input: { name: string; destination: string; startDate: string; days: number }) {
        const days = Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.round(input.days)));
        const trip: Trip = {
          id: newId(),
          name: input.name.trim(),
          destination: input.destination.trim(),
          startDate: input.startDate,
          days,
          activities: [],
          packing: [],
        };
        return { payload: trip };
      },
    },
    removeTrip(state, action: PayloadAction<string>) {
      state.trips = state.trips.filter((t) => t.id !== action.payload);
    },
    addActivity: {
      reducer(state, action: PayloadAction<{ tripId: string; activity: Activity }>) {
        const trip = findTrip(state, action.payload.tripId);
        if (!trip) return;
        trip.activities.push(action.payload.activity);
        trip.activities.sort(compareActivities);
      },
      prepare(input: {
        tripId: string;
        day: number;
        time: string;
        title: string;
        category: Category;
        notes: string;
      }) {
        const activity: Activity = {
          id: newId(),
          day: input.day,
          time: input.time,
          title: input.title.trim(),
          category: input.category,
          notes: input.notes.trim(),
          done: false,
        };
        return { payload: { tripId: input.tripId, activity } };
      },
    },
    toggleActivity(state, action: PayloadAction<{ tripId: string; activityId: string }>) {
      const activity = findTrip(state, action.payload.tripId)?.activities.find(
        (a) => a.id === action.payload.activityId,
      );
      if (activity) activity.done = !activity.done;
    },
    removeActivity(state, action: PayloadAction<{ tripId: string; activityId: string }>) {
      const trip = findTrip(state, action.payload.tripId);
      if (trip) trip.activities = trip.activities.filter((a) => a.id !== action.payload.activityId);
    },
    addPackingItem: {
      reducer(state, action: PayloadAction<{ tripId: string; item: PackingItem }>) {
        findTrip(state, action.payload.tripId)?.packing.push(action.payload.item);
      },
      prepare(input: { tripId: string; label: string }) {
        const item: PackingItem = { id: newId(), label: input.label.trim(), packed: false };
        return { payload: { tripId: input.tripId, item } };
      },
    },
    togglePacked(state, action: PayloadAction<{ tripId: string; itemId: string }>) {
      const item = findTrip(state, action.payload.tripId)?.packing.find(
        (p) => p.id === action.payload.itemId,
      );
      if (item) item.packed = !item.packed;
    },
    removePackingItem(state, action: PayloadAction<{ tripId: string; itemId: string }>) {
      const trip = findTrip(state, action.payload.tripId);
      if (trip) trip.packing = trip.packing.filter((p) => p.id !== action.payload.itemId);
    },
  },
});

export const {
  addTrip,
  removeTrip,
  addActivity,
  toggleActivity,
  removeActivity,
  addPackingItem,
  togglePacked,
  removePackingItem,
} = tripsSlice.actions;

export default tripsSlice.reducer;
