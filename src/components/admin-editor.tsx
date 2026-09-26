'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
type Values = Record<string, string | boolean>;
const fields: Record<string, { name: string; label: string; kind?: string }[]> = {
  projects: [
    { name: 'title', label: 'Project name' },
    { name: 'slug', label: 'URL slug' },
    { name: 'summary', label: 'Short description' },
    { name: 'repository_url', label: 'GitHub repository URL', kind: 'url' },
    { name: 'instagram_url', label: 'Instagram post or reel URL (optional)', kind: 'url' },
    { name: 'category', label: 'Category' },
    { name: 'tags', label: 'Tags, separated by |' },
    { name: 'body', label: 'Project explanation', kind: 'textarea' },
  ],
  offers: [
    { name: 'title', label: 'Tool name' },
    { name: 'slug', label: 'URL slug' },
    { name: 'summary', label: 'Short description' },
    { name: 'program', label: 'Affiliate program name' },
    { name: 'destination_url', label: 'Approved affiliate URL', kind: 'url' },
    { name: 'approved_hostname', label: 'Exact destination hostname, e.g. partner.example.com' },
    { name: 'disclosure', label: 'Affiliate disclosure' },
    { name: 'body', label: 'Recommendation', kind: 'textarea' },
  ],
  campaigns: [
    { name: 'title', label: 'Internal campaign title' },
    { name: 'subject', label: 'Email subject' },
    { name: 'body', label: 'Newsletter body (plain text)', kind: 'textarea' },
  ],
};
export function AdminEditor({ entity, id }: { entity: string; id?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
      status: 'draft',
      category: 'Developer tools',
      disclosure: 'We may earn a commission if you purchase through this link.',
      agreement_confirmed: false,
    }),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(Boolean(id)),
    [schedule, setSchedule] = useState(''),
    [providerId, setProviderId] = useState('');
  useEffect(() => {
    if (!id) return;
    let live = true;
    fetch(`/api/admin/${entity}?id=${id}`)
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw new Error(v.error);
        if (!v.rows[0]) throw new Error('Record not found');
        if (live) {
          const row = v.rows[0];
          setValues({ ...row, tags: (row.tags || []).join('|') });
          setProviderId(row.provider_broadcast_id || '');
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [entity, id]);
  const locked = entity === 'campaigns' && values.status !== 'draft';
  async function action(action: string) {
    setBusy(true);
    setError('');
    try {
      if (
        action === 'send' &&
        !window.confirm(`Send “${values.subject}” to the confirmed newsletter segment now?`)
      )
        return;
      const r = await fetch(`/api/admin/campaigns/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...(action === 'schedule' && schedule
            ? { scheduled_at: new Date(schedule).toISOString() }
            : {}),
          ...(action === 'reconcile' && providerId ? { provider_id: providerId } : {}),
        }),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed');
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p>Loading editor…</p>;
  return (
    <div className="admin-editor">
      <Link href={`/admin/${entity}`} className="text-link">
        ← Back to {entity}
      </Link>
      <h1 className="page-heading" style={{ fontSize: 32, marginTop: 24 }}>
        {id ? 'Edit' : 'New'}{' '}
        {entity === 'projects' ? 'project' : entity === 'offers' ? 'offer' : 'campaign'}
      </h1>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}
      <form
        className="panel form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          setMessage('');
          try {
            const payload = {
              ...values,
              id,
              ...(entity === 'projects'
                ? {
                    tags: String(values.tags || '')
                      .split('|')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }
                : {}),
            };
            const r = await fetch(`/api/admin/${entity}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const v = await r.json();
            if (!r.ok) throw new Error(v.error);
            setMessage('Saved.');
            if (!id) router.replace(`/admin/${entity}/edit?id=${v.id}`);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
          } finally {
            setBusy(false);
          }
        }}
      >
        {fields[entity].map((f) => (
          <label key={f.name}>
            {f.label}
            {f.kind === 'textarea' ? (
              <textarea
                rows={12}
                value={String(values[f.name] || '')}
                disabled={locked}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              />
            ) : (
              <input
                type={f.kind || 'text'}
                value={String(values[f.name] || '')}
                disabled={locked}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              />
            )}
          </label>
        ))}
        {entity === 'offers' && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={values.agreement_confirmed === true}
              onChange={(e) => setValues((v) => ({ ...v, agreement_confirmed: e.target.checked }))}
            />{' '}
            I have verified the affiliate agreement and destination.
          </label>
        )}
        {entity !== 'campaigns' && (
          <label>
            Publication status
            <select
              value={String(values.status)}
              onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
            >
              {['draft', 'published', 'archived'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        {!locked && (
          <button className="button" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </form>
      {id && entity !== 'campaigns' && (
        <p>
          <Link className="text-link" href={`/admin/preview/${entity}/${id}`}>
            Preview this {entity === 'projects' ? 'project' : 'offer'} →
          </Link>
        </p>
      )}
      {entity === 'campaigns' && (
        <>
          <section className="panel" style={{ marginTop: 24 }}>
            <span className="eyebrow">EMAIL PREVIEW · {String(values.status)}</span>
            <h2 style={{ fontSize: 24, margin: '20px 0' }}>
              {String(values.subject || 'Your subject')}
            </h2>
            <div className="preview-body">
              {String(values.body || 'Your newsletter copy will appear here.')}
            </div>
            <p className="fine-print">
              The business address, privacy link and provider unsubscribe link are added to the
              delivered email.
            </p>
          </section>
          {id && (
            <section className="panel form-stack" style={{ marginTop: 24 }}>
              <h2>Delivery controls</h2>
              <p className="admin-note">
                Save and review the draft before preparing it. Preparing creates a provider draft
                and locks the copy. Sending or scheduling is a separate explicit action. Broadcasts
                are disabled outside production.
              </p>
              <div className="admin-actions">
                {values.status === 'draft' && (
                  <button className="button" disabled={busy} onClick={() => action('prepare')}>
                    Prepare saved draft
                  </button>
                )}
                {values.status === 'ready' && (
                  <button className="button" disabled={busy} onClick={() => action('send')}>
                    Send now
                  </button>
                )}
                {values.status === 'scheduled' && (
                  <button
                    className="button button-secondary"
                    disabled={busy}
                    onClick={() => action('cancel')}
                  >
                    Cancel scheduled send
                  </button>
                )}
              </div>
              {values.status === 'ready' && (
                <>
                  <label>
                    Schedule (your local time)
                    <input
                      type="datetime-local"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                    />
                  </label>
                  <button
                    className="button button-secondary"
                    disabled={busy || !schedule}
                    onClick={() => action('schedule')}
                  >
                    Schedule saved campaign
                  </button>
                </>
              )}
              {['review_required', 'preparing', 'sending'].includes(String(values.status)) && (
                <>
                  <label>
                    Existing Resend broadcast ID
                    <input value={providerId} onChange={(e) => setProviderId(e.target.value)} />
                  </label>
                  <button
                    className="button button-secondary"
                    disabled={busy}
                    onClick={() => action('reconcile')}
                  >
                    Reconcile provider status
                  </button>
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
