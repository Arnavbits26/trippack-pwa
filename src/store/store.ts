import { configureStore } from '@reduxjs/toolkit';
import tripsReducer from './tripsSlice';
import { loadState, saveState } from './persistence';

export function makeStore(preloaded = loadState()) {
  const store = configureStore({
    reducer: { trips: tripsReducer },
    preloadedState: preloaded,
  });
  // Every change is written to localStorage, so the app is fully usable offline.
  store.subscribe(() => saveState(store.getState().trips));
  return store;
}

export const store = makeStore();
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
