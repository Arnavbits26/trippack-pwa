export type Category = 'transport' | 'stay' | 'food' | 'activity';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'transport', label: 'Transport' },
  { value: 'stay', label: 'Stay' },
  { value: 'food', label: 'Food' },
  { value: 'activity', label: 'Activity' },
];

export interface Activity {
  id: string;
  day: number; // 1-based day of the trip
  time: string; // "HH:MM" (24h)
  title: string;
  category: Category;
  notes: string;
  done: boolean;
}

export interface PackingItem {
  id: string;
  label: string;
  packed: boolean;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string; // ISO date "YYYY-MM-DD"
  days: number;
  activities: Activity[];
  packing: PackingItem[];
}

export interface TripsState {
  trips: Trip[];
}
