import { useState, type FormEvent } from 'react';
import { useAppDispatch } from '../hooks';
import { addPackingItem, removePackingItem, togglePacked } from '../store/tripsSlice';
import type { Trip } from '../types';

export function PackingList({ trip }: { trip: Trip }) {
  const dispatch = useAppDispatch();
  const [label, setLabel] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    dispatch(addPackingItem({ tripId: trip.id, label }));
    setLabel('');
  }

  return (
    <section className="card" aria-labelledby="packing-heading">
      <h3 id="packing-heading">Packing list</h3>
      <form className="inline-form" onSubmit={submit}>
        <label htmlFor="pack-label" className="visually-hidden">
          New packing item
        </label>
        <input
          id="pack-label"
          placeholder="Add an item"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="btn">
          Add item
        </button>
      </form>
      {trip.packing.length === 0 ? (
        <p className="empty">Nothing on the list yet.</p>
      ) : (
        <ul className="plain-list">
          {trip.packing.map((item) => (
            <li key={item.id} className="row">
              <label className="check">
                <input
                  type="checkbox"
                  checked={item.packed}
                  onChange={() => dispatch(togglePacked({ tripId: trip.id, itemId: item.id }))}
                />
                <span className={item.packed ? 'done' : ''}>{item.label}</span>
              </label>
              <button
                type="button"
                className="btn btn--ghost"
                aria-label={`Remove ${item.label}`}
                onClick={() => dispatch(removePackingItem({ tripId: trip.id, itemId: item.id }))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
