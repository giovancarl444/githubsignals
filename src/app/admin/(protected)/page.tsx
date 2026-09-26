import { isConfigured } from '@/lib/config';
import { rpc } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
type Metrics = {
  subscribed: number;
  pending: number;
  projects: number;
  offers: number;
  clicks: number;
  enquiries: number;
  failed_jobs: number;
  pending_jobs: number;
  campaigns_needing_review: number;
  revenue: { currency: string; status: string; amount_minor: string; transactions: number }[];
};
export default async function Dashboard() {
  if (!isConfigured()) return null;
  await requireAdmin();
  const m = await rpc<Metrics>('dashboard_metrics');
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">GITHUB SIGNALS / EDITORIAL DESK</span>
          <h1>What’s happening.</h1>
        </div>
        <Link href="/admin/projects/edit" className="button">
          Write a discovery +
        </Link>
      </div>
      <div className="admin-stats">
        {[
          ['Confirmed subscribers', m.subscribed],
          ['Awaiting confirmation', m.pending],
          ['Published discoveries', m.projects],
          ['Active offers', m.offers],
          ['Outbound clicks', m.clicks],
          ['New enquiries', m.enquiries],
          ['Pending email jobs', m.pending_jobs],
          ['Failed email jobs', m.failed_jobs],
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {m.campaigns_needing_review > 0 && (
        <p className="admin-note">
          <Link href="/admin/campaigns">
            {m.campaigns_needing_review} campaign(s) need provider reconciliation →
          </Link>
        </p>
      )}
      <div className="section-title" style={{ marginTop: 40 }}>
        <h2>Commission ledger</h2>
        <Link href="/admin/commissions" className="text-link">
          Import or reconcile →
        </Link>
      </div>
      <p className="fine-print">
        Reported by your programs. Pending commissions are not paid revenue. Amounts are shown in
        integer minor currency units.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Currency</th>
              <th>Status</th>
              <th>Minor units</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {m.revenue.map((r) => (
              <tr key={`${r.currency}-${r.status}`}>
                <td>{r.currency}</td>
                <td>{r.status}</td>
                <td>{r.amount_minor}</td>
                <td>{r.transactions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!m.revenue.length && <p>No commission reports have been imported.</p>}
    </>
  );
}
