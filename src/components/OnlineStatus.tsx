import { useOnlineStatus } from '../hooks';

/** Announces connectivity changes to screen readers and shows a visible banner when offline. */
export function OnlineStatus() {
  const online = useOnlineStatus();
  return (
    <div role="status" aria-live="polite" className={online ? 'status status--hidden' : 'status'}>
      {online ? '' : "You're offline. Your trips are saved on this device and everything still works."}
    </div>
  );
}
