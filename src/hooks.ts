import { useEffect, useState } from 'react';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './store/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/** Tiny hash router: "#/trip/<id>" opens a trip, anything else shows the list. */
export function useHashRoute(): { tripId: string | null; goHome: () => void; openTrip: (id: string) => void } {
  const read = () => {
    const match = window.location.hash.match(/^#\/trip\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  };
  const [tripId, setTripId] = useState<string | null>(read);
  useEffect(() => {
    const onChange = () => setTripId(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return {
    tripId,
    goHome: () => {
      window.location.hash = '#/';
    },
    openTrip: (id: string) => {
      window.location.hash = `#/trip/${encodeURIComponent(id)}`;
    },
  };
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}
