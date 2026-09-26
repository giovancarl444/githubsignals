'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
const columns: Record<string, string[]> = {
  projects: ['title', 'status', 'category'],
  offers: ['title', 'program', 'status'],
  campaigns: ['title', 'subject', 'status', 'scheduled_at'],
  subscribers: ['email', 'status', 'confirmed_at', 'created_at'],
  enquiries: ['name', 'company', 'email', 'message', 'status'],
  commissions: ['program', 'transaction_id', 'amount_minor', 'currency', 'status'],
  jobs: ['kind', 'status', 'attempts', 'last_error'],
  audit: ['action', 'entity_id', 'created_at'],
};
export function AdminTable({ entity }: { entity: string }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]),
    [count, setCount] = useState(0),
    [page, setPage] = useState(0),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const load = () => setRevision((v) => v + 1);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/${entity}?page=${page}`, { signal: controller.signal })
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw new Error(v.error);
        return v;
      })
      .then((v) => {
        if (!controller.signal.aborted) {
          setRows(v.rows);
          setCount(v.count);
          setError('');
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Could not load records');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [entity, page, revision]);
  const editable = ['projects', 'offers', 'campaigns'].includes(entity);
  return (
    <>
      <div className="admin-actions">
        {editable && (
          <Link href={`/admin/${entity}/edit`} className="button button-small">
            New {entity === 'projects' ? 'project' : entity === 'offers' ? 'offer' : 'campaign'} +
          </Link>
        )}
        {entity === 'subscribers' && (
          <a download href="/api/admin/export" className="button button-small">
            Export subscribers CSV
          </a>
        )}
        {['projects', 'commissions'].includes(entity) && (
          <label className="button button-small button-secondary">
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 1000000) throw new Error('CSV must be smaller than 1 MB');
                  const r = await fetch(`/api/admin/import?kind=${entity}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/csv' },
                    body: await file.text(),
                  });
                  const v = await r.json();
                  if (!r.ok) throw new Error(v.error);
                  await load();
                  window.alert(v.message);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Import failed');
                }
              }}
            />
          </label>
        )}
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading records…</p>
      ) : (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {columns[entity].map((c) => (
                    <th key={c}>{c.replaceAll('_', ' ')}</th>
                  ))}
                  {(editable ||
                    entity === 'enquiries' ||
                    entity === 'jobs' ||
                    entity === 'subscribers') && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={String(row.id)}>
                    {columns[entity].map((c) => (
                      <td key={c}>
                        {c === 'status' ? (
                          <span className="status-pill">{String(row[c] ?? '')}</span>
                        ) : (
                          String(row[c] ?? '—')
                        )}
                      </td>
                    ))}
                    {editable && (
                      <td>
                        <Link href={`/admin/${entity}/edit?id=${row.id}`}>Open →</Link>
                      </td>
                    )}
                    {entity === 'enquiries' && (
                      <td>
                        <label>
                          <span className="sr-only">Enquiry status</span>
                          <select
                            value={String(row.status)}
                            onChange={async (e) => {
                              const r = await fetch('/api/admin/enquiries', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: row.id, status: e.target.value }),
                              });
                              if (r.ok) await load();
                              else setError('Status could not be saved');
                            }}
                          >
                            {['new', 'contacted', 'qualified', 'closed'].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                      </td>
                    )}
                    {entity === 'subscribers' && (
                      <td>
                        {['pending', 'subscribed'].includes(String(row.status)) && (
                          <button
                            className="text-link"
                            onClick={async () => {
                              if (!window.confirm('Unsubscribe this reader?')) return;
                              const r = await fetch(
                                `/api/admin/subscribers/${row.id}/unsubscribe`,
                                { method: 'POST' },
                              );
                              if (r.ok) load();
                              else setError('Unsubscribe could not be saved');
                            }}
                          >
                            Unsubscribe
                          </button>
                        )}
                      </td>
                    )}
                    {entity === 'jobs' && (
                      <td>
                        {row.kind === 'contact_sync' && row.status === 'dead' && (
                          <button
                            className="text-link"
                            onClick={async () => {
                              const r = await fetch(`/api/admin/jobs/${row.id}/retry`, {
                                method: 'POST',
                              });
                              if (r.ok) await load();
                              else setError('Retry could not be queued');
                            }}
                          >
                            Retry sync
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && <p>No records yet.</p>}
          <div className="admin-actions">
            <button
              className="button button-small button-secondary"
              disabled={page === 0}
              onClick={() => {
                setLoading(true);
                setPage((v) => v - 1);
              }}
            >
              Previous
            </button>
            <span className="fine-print">
              {count} records · page {page + 1}
            </span>
            <button
              className="button button-small button-secondary"
              disabled={(page + 1) * 50 >= count}
              onClick={() => {
                setLoading(true);
                setPage((v) => v + 1);
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
      {entity === 'commissions' && (
        <p className="admin-note">
          CSV columns: program, transaction_id, offer_id (optional), amount_minor, currency, status,
          occurred_at. Use integer minor currency units and an ISO timestamp. Re-importing the same
          program + transaction updates its state atomically. Totals never mix currencies.
        </p>
      )}
      {entity === 'projects' && (
        <p className="admin-note">
          CSV columns: slug, title, summary, body, repository_url, instagram_url, category, tags
          (separated by |). Imports create drafts and preserve existing slugs.
        </p>
      )}
      {entity === 'jobs' && (
        <p className="admin-note">
          Expired confirmation jobs require a new signup request. Contact synchronization retries
          are safe. Campaigns with uncertain provider outcomes must be reconciled from their
          campaign screen.
        </p>
      )}
    </>
  );
}
