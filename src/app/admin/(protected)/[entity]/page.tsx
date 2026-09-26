import { isConfigured } from '@/lib/config';
import { notFound } from 'next/navigation';
import { AdminTable } from '@/components/admin-table';
import { requireAdmin } from '@/lib/auth';
export default async function Collection({ params }: { params: Promise<{ entity: string }> }) {
  if (!isConfigured()) return null;
  await requireAdmin();
  const { entity } = await params;
  if (
    ![
      'projects',
      'offers',
      'campaigns',
      'subscribers',
      'enquiries',
      'commissions',
      'jobs',
      'audit',
    ].includes(entity)
  )
    notFound();
  return (
    <>
      <div className="admin-heading">
        <h1 style={{ textTransform: 'capitalize' }}>{entity}</h1>
      </div>
      <AdminTable entity={entity} />
    </>
  );
}
