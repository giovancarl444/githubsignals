'use client';
import { useState } from 'react';
import { Turnstile } from './turnstile';
export function PartnerForm({ enabled }: { enabled: boolean }) {
  const [token, setToken] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false),
    [resetKey, setResetKey] = useState(0);
  if (!enabled)
    return (
      <div className="panel">
        <h2>Let’s make a useful introduction.</h2>
        <p>
          Partnership enquiries are currently welcome through{' '}
          <a className="text-link" href="https://www.instagram.com/githubsignals/">
            @githubsignals on Instagram
          </a>
          .
        </p>
      </div>
    );
  return (
    <form
      className="panel form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        setBusy(true);
        setSuccess(false);
        try {
          const r = await fetch('/api/partners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, turnstileToken: token }),
          });
          const value = await r.json();
          if (!r.ok) throw new Error(value.error);
          setMessage(value.message);
          setSuccess(true);
          form.reset();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : 'Please try again.');
        } finally {
          setBusy(false);
          setResetKey((v) => v + 1);
        }
      }}
    >
      <div className="form-grid">
        <label>
          Your name
          <input name="name" required minLength={2} maxLength={100} />
        </label>
        <label>
          Work email
          <input name="email" type="email" required maxLength={254} />
        </label>
        <label>
          Company
          <input name="company" required minLength={2} maxLength={160} />
        </label>
        <label>
          Website
          <input name="url" type="url" placeholder="https://" required maxLength={2048} />
        </label>
      </div>
      <label>
        What would you like to work on?
        <textarea name="message" minLength={20} maxLength={4000} required rows={5} />
      </label>
      <label className="honeypot" aria-hidden="true">
        Leave this blank
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <Turnstile action="partners" onToken={setToken} resetKey={resetKey} />
      <p className="fine-print">
        We’ll use these details to respond to your enquiry. This does not subscribe you to our
        newsletter.
      </p>
      <button className="button" disabled={busy || !token}>
        {busy ? 'Saving…' : 'Send partnership enquiry →'}
      </button>
      {message && (
        <p role={success ? 'status' : 'alert'} className={success ? 'form-success' : 'form-error'}>
          {message}
        </p>
      )}
    </form>
  );
}
