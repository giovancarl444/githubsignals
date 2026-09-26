'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function AdminLogin() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const router = useRouter();
  return (
    <form
      className="panel form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          const r = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
          });
          const v = await r.json();
          if (!r.ok) throw new Error(v.error);
          router.replace('/admin');
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Sign-in failed');
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Email
        <input type="email" name="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </label>
      <button className="button" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <p className="fine-print">
        Access is by invitation. There is no public account registration.
      </p>
    </form>
  );
}
