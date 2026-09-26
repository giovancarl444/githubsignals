'use client';
import { useState } from 'react';
export function TokenAction({
  token,
  action,
}: {
  token: string;
  action: 'confirm' | 'unsubscribe';
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [done, setDone] = useState(false);
  return (
    <div>
      {!done && (
        <button
          className="button"
          disabled={busy || !token}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await fetch(
                action === 'confirm' ? '/api/subscribe/confirm' : '/api/unsubscribe',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token }),
                },
              );
              const value = await r.json();
              if (!r.ok) throw new Error(value.error);
              setMessage(value.message);
              setDone(true);
            } catch (e) {
              setMessage(e instanceof Error ? e.message : 'Please try again.');
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Working…' : action === 'confirm' ? 'Confirm my subscription' : 'Unsubscribe me'}
        </button>
      )}
      {message && <p role={done ? 'status' : 'alert'}>{message}</p>}
    </div>
  );
}
