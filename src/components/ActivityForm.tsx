import { useState, type FormEvent } from 'react';
import { useAppDispatch } from '../hooks';
import { addActivity } from '../store/tripsSlice';
import { CATEGORIES, type Category } from '../types';

export function ActivityForm({ tripId, days }: { tripId: string; days: number }) {
  const dispatch = useAppDispatch();
  const [day, setDay] = useState(1);
  const [time, setTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('activity');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please give the activity a title.');
      return;
    }
    setError('');
    dispatch(addActivity({ tripId, day, time, title, category, notes }));
    setTitle('');
    setNotes('');
  }

  return (
    <form className="card form" onSubmit={submit} noValidate aria-labelledby="add-activity-heading">
      <h3 id="add-activity-heading">Add an activity</h3>
      <div className="field-row">
        <div className="field">
          <label htmlFor="act-day">Day</label>
          <select id="act-day" value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                Day {d}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="act-time">Time</label>
          <input id="act-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="act-category">Type</label>
          <select id="act-category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="act-title">Activity title</label>
        <input id="act-title" value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="act-notes">Notes (optional)</label>
        <input id="act-notes" value={notes} onChange={(e) => setNotes(e.target.value)} autoComplete="off" />
      </div>
      <p role="alert" className="error">
        {error}
      </p>
      <button type="submit" className="btn">
        Add activity
      </button>
    </form>
  );
}
