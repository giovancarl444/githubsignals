import { AdminLogout } from '@/components/admin-logout';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isConfigured } from '@/lib/config';
export const metadata = { title: 'Editorial desk', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isConfigured())
    return (
      <main id="main" className="shell page article">
        <h1>Connect the editorial desk.</h1>
        <p>
          The application is installed. Configure the separate Supabase project, create an invited
          admin account, and complete the deployment runbook before opening signup.
        </p>
        <p>
          See the repository’s deployment documentation for the required environment variables and
          migrations.
        </p>
      </main>
    );
  try {
    await requireAdmin();
  } catch {
    redirect('/admin/login');
  }
  return (
    <main id="main" className="shell page">
      <nav className="admin-nav" aria-label="Editorial desk">
        {[
          '',
          'projects',
          'offers',
          'campaigns',
          'subscribers',
          'enquiries',
          'commissions',
          'jobs',
          'audit',
        ].map((s) => (
          <Link key={s} href={`/admin${s ? '/' + s : ''}`}>
            {s || 'Overview'}
          </Link>
        ))}
        <AdminLogout />
      </nav>
      {children}
    </main>
  );
}
