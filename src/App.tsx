import { lazy, Suspense } from 'react';
import { useHashRoute } from './hooks';
import { InstallButton } from './components/InstallButton';
import { NewTripForm } from './components/NewTripForm';
import { OnlineStatus } from './components/OnlineStatus';
import { TripList } from './components/TripList';

// The trip screen is loaded on demand so the first screen stays small.
const TripView = lazy(() => import('./components/TripView'));

export default function App() {
  const { tripId, goHome, openTrip } = useHashRoute();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <OnlineStatus />
      <header className="app-header">
        <h1>TripPack</h1>
        <InstallButton />
      </header>
      <main id="main" tabIndex={-1}>
        {tripId ? (
          <Suspense fallback={<p className="empty">Loading trip…</p>}>
            <TripView tripId={tripId} onBack={goHome} />
          </Suspense>
        ) : (
          <>
            <TripList onOpen={openTrip} />
            <NewTripForm onCreated={openTrip} />
          </>
        )}
      </main>
    </>
  );
}
