'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function AdminActivate() {
  const [link, setLink] = useState<{ token_hash: string; type: string } | null | undefined>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    // Fragments stay out of server logs and referrers. Never consume a link on GET.
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token_hash = params.get('token_hash') || '';
    const type = params.get('type') || '';
    const valid =
      /^[a-zA-Z0-9_-]{16,512}$/.test(token_hash) && ['invite', 'recovery'].includes(type);
    // The server cannot read a fragment. Capture it once after hydration before clearing the URL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLink((previous) =>
      previous === undefined ? (valid ? { token_hash, type } : null) : previous,
    );
    window.history.replaceState(null, '', window.location.pathname);
  }, []);
  if (link === undefined) return <p>Opening your secure link…</p>;
  if (done)
    return (
      <div className="panel form-stack">
        <p role="status">Your password is saved. Sign in to open the editorial desk.</p>
        <Link href="/admin/login" className="button">
          Go to sign-in
        </Link>
      </div>
    );
  if (!link)
    return (
      <div className="panel form-stack">
        <p>
          Open the invitation or password-reset link sent by the site owner. If it has expired, ask
          for a new link.
        </p>
        <Link href="/admin/login" className="text-link">
          Back to sign-in
        </Link>
      </div>
    );
  return (
    <form
      className="panel form-stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        const values = new FormData(event.currentTarget);
        const password = String(values.get('password') || '');
        if (password !== values.get('confirmPassword')) {
          setError('The passwords do not match.');
          return;
        }
        setBusy(true);
        try {
          const response = await fetch('/api/admin/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...link, password }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Could not save your password.');
          setLink(null);
          setDone(true);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Could not save your password.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        Choose a unique password of at least 12 characters. A password manager can create and save
        one for you.
      </p>
      <label>
        New password
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
      </label>
      <label>
        Confirm new password
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
      </label>
      <button className="button" disabled={busy}>
        {busy ? 'Saving…' : 'Save password'}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
