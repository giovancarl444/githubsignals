'use client';
import { useState } from 'react';
import { ArrowUpRight, Mail, Check } from 'lucide-react';
import Link from 'next/link';
import { CONSENT_TEXT } from '@/lib/config';
import { Turnstile } from './turnstile';
export function SubscribeForm({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [success, setSuccess] = useState(false),
    [token, setToken] = useState(''),
    [resetKey, setResetKey] = useState(0);
  if (!enabled)
    return (
      <div className="signup-unavailable">
        <Mail size={20} />
        <p>
          The weekly newsletter is opening soon.{' '}
          <a href="https://www.instagram.com/githubsignals/">
            Follow the discoveries on Instagram →
          </a>
        </p>
      </div>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        setBusy(true);
        setMessage('');
        setSuccess(false);
        const search = new URLSearchParams(window.location.search);
        const source: Record<string, string> = { path: window.location.pathname };
        for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) {
          const v = search.get(k);
          if (v) source[k] = v.slice(0, 100);
        }
        try {
          const r = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.get('email'),
              consent: data.get('consent') === 'on',
              website: data.get('website'),
              turnstileToken: token,
              source,
            }),
          });
          const result = await r.json();
          if (!r.ok) throw new Error(result.error);
          setMessage(result.message);
          setSuccess(true);
          form.reset();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : 'Please try again.');
        } finally {
          setBusy(false);
          setResetKey((k) => k + 1);
        }
      }}
      className="subscribe-form"
    >
      <label className="sr-only" htmlFor="subscribe-email">
        Email address
      </label>
      <div className="subscribe-row">
        <Mail size={18} />
        <input
          id="subscribe-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@your-inbox.com"
          maxLength={254}
        />
        <button className="button" disabled={busy || !token}>
          {busy ? 'Joining…' : 'Get the weekly signal'}
          <ArrowUpRight size={17} />
        </button>
      </div>
      <label className="consent">
        <input name="consent" type="checkbox" required />
        <span>
          {CONSENT_TEXT} <Link href="/privacy">Privacy policy</Link>
        </span>
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" autoComplete="off" tabIndex={-1} />
      </label>
      <Turnstile action="subscribe" onToken={setToken} resetKey={resetKey} />
      {message && (
        <p role={success ? 'status' : 'alert'} className={success ? 'form-success' : 'form-error'}>
          {success && <Check size={16} />} {message}
        </p>
      )}
    </form>
  );
}
