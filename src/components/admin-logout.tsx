'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function AdminLogout() {
  const router = useRouter();
  const [error, setError] = useState('');
  return (
    <>
      <button
        className="text-link"
        onClick={async () => {
          try {
            const r = await fetch('/api/admin/logout', { method: 'POST' });
            if (!r.ok) throw new Error();
            router.replace('/admin/login');
            router.refresh();
          } catch {
            setError('Could not sign out. Try again.');
          }
        }}
      >
        Sign out
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
