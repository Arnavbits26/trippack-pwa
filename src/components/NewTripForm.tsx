import { useState, type FormEvent } from 'react';
import { useAppDispatch } from '../hooks';
import { addTrip, MAX_DAYS, MIN_DAYS } from '../store/tripsSlice';

const today = () => new Date().toISOString().slice(0, 10);

export function NewTripForm({ onCreated }: { onCreated: (id: string) => void }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [days, setDays] = useState(3);
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !destination.trim()) {
      setError('Please enter a trip name and a destination.');
      return;
    }
    if (!Number.isFinite(days) || days < MIN_DAYS || days > MAX_DAYS) {
      setError(`Trips can be ${MIN_DAYS} to ${MAX_DAYS} days long.`);
      return;
    }
    setError('');
    const action = dispatch(addTrip({ name, destination, startDate, days }));
    setName('');
    setDestination('');
    onCreated(action.payload.id);
  }

  return (
    <form className="card form" onSubmit={submit} noValidate aria-labelledby="new-trip-heading">
      <h2 id="new-trip-heading">Plan a new trip</h2>
      <div className="field">
        <label htmlFor="trip-name">Trip name</label>
        <input id="trip-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="trip-destination">Destination</label>
        <input
          id="trip-destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="trip-start">Start date</label>
          <input id="trip-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="trip-days">Days</label>
          <input
            id="trip-days"
            type="number"
            min={MIN_DAYS}
            max={MAX_DAYS}
            value={days}
            onChange={(e) => setDays(e.target.valueAsNumber)}
          />
        </div>
      </div>
      <p role="alert" className="error">
        {error}
      </p>
      <button type="submit" className="btn">
        Create trip
      </button>
    </form>
  );
}
