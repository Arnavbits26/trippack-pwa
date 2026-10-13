import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { removeActivity, removeTrip, toggleActivity } from '../store/tripsSlice';
import { dateForDay, filterActivities } from '../store/selectors';
import { CATEGORIES, type Category } from '../types';
import { ActivityForm } from './ActivityForm';
import { PackingList } from './PackingList';

export default function TripView({ tripId, onBack }: { tripId: string; onBack: () => void }) {
  const dispatch = useAppDispatch();
  const trip = useAppSelector((s) => s.trips.trips.find((t) => t.id === tripId));
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');

  const visible = useMemo(
    () => (trip ? filterActivities(trip.activities, { query, category }) : []),
    [trip, query, category],
  );

  if (!trip) {
    return (
      <section>
        <p className="empty">That trip could not be found.</p>
        <button type="button" className="btn" onClick={onBack}>
          Back to your trips
        </button>
      </section>
    );
  }

  return (
    <div className="trip-view">
      <button type="button" className="btn btn--ghost" onClick={onBack}>
        ← All trips
      </button>
      <h2>{trip.name}</h2>
      <p className="meta">
        {trip.destination} · {trip.days} {trip.days === 1 ? 'day' : 'days'} from {trip.startDate}
      </p>

      <section className="card filters" aria-label="Filter activities">
        <div className="field">
          <label htmlFor="search">Search activities</label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="filter-category">Show</label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | 'all')}
          >
            <option value="all">All types</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div role="status" className="visually-hidden">
        {visible.length} {visible.length === 1 ? 'activity' : 'activities'} shown
      </div>

      {Array.from({ length: trip.days }, (_, i) => i + 1).map((day) => {
        const items = visible.filter((a) => a.day === day);
        return (
          <section key={day} className="day" aria-labelledby={`day-${day}`}>
            <h3 id={`day-${day}`}>
              Day {day} <span className="meta">{dateForDay(trip.startDate, day)}</span>
            </h3>
            {items.length === 0 ? (
              <p className="empty">Nothing planned.</p>
            ) : (
              <ul className="plain-list">
                {items.map((a) => (
                  <li key={a.id} className="row activity">
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={a.done}
                        onChange={() => dispatch(toggleActivity({ tripId: trip.id, activityId: a.id }))}
                      />
                      <span className={a.done ? 'done' : ''}>
                        <strong>{a.time}</strong> {a.title}
                        {a.notes ? <span className="meta"> — {a.notes}</span> : null}
                      </span>
                    </label>
                    <span className={`badge badge--${a.category}`}>{a.category}</span>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      aria-label={`Delete ${a.title}`}
                      onClick={() => dispatch(removeActivity({ tripId: trip.id, activityId: a.id }))}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <ActivityForm tripId={trip.id} days={trip.days} />
      <PackingList trip={trip} />

      <button
        type="button"
        className="btn btn--danger"
        onClick={() => {
          if (window.confirm(`Delete "${trip.name}" and everything in it?`)) {
            dispatch(removeTrip(trip.id));
            onBack();
          }
        }}
      >
        Delete this trip
      </button>
    </div>
  );
}
