'use client';
import { useState } from 'react';
import { ArrowUpRight, Instagram } from 'lucide-react';
import { Turnstile } from './turnstile';
export function PartnerForm({ enabled }: { enabled: boolean }) {
  const [token, setToken] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false),
    [resetKey, setResetKey] = useState(0);
  if (!enabled)
    return (
      <div className="panel partner-direct">
        <Instagram size={27} />
        <h3>Let’s talk about the fit.</h3>
        <p>
          For partnership enquiries, message @githubsignals on Instagram. Include your product link
          and a short introduction so we can pick up the conversation.
        </p>
        <a
          className="button"
          href="https://www.instagram.com/githubsignals/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Start on Instagram <ArrowUpRight size={16} />
        </a>
        <span className="fine-print">
          Sponsorships · Affiliate partnerships · Product introductions
        </span>
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
