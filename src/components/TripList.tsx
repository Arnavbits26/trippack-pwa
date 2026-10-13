import { useAppSelector } from '../hooks';
import { packingProgress, tripProgress } from '../store/selectors';

export function TripList({ onOpen }: { onOpen: (id: string) => void }) {
  const trips = useAppSelector((s) => s.trips.trips);

  if (trips.length === 0) {
    return (
      <section aria-labelledby="trips-heading">
        <h2 id="trips-heading">Your trips</h2>
        <p className="empty">No trips yet. Plan one below and it will be available offline.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="trips-heading">
      <h2 id="trips-heading">Your trips</h2>
      <ul className="trip-list">
        {trips.map((trip) => {
          const a = tripProgress(trip);
          const p = packingProgress(trip);
          return (
            <li key={trip.id}>
              <button type="button" className="card trip-card" onClick={() => onOpen(trip.id)}>
                <span className="trip-card__name">{trip.name}</span>
                <span className="trip-card__meta">
                  {trip.destination} · {trip.days} {trip.days === 1 ? 'day' : 'days'} · from {trip.startDate}
                </span>
                <span className="trip-card__meta">
                  {a.done}/{a.total} activities done · {p.packed}/{p.total} items packed
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
