import { isConfigured } from '@/lib/config';
import { notFound } from 'next/navigation';
import { AdminEditor } from '@/components/admin-editor';
import { requireAdmin } from '@/lib/auth';
export default async function Edit({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  if (!isConfigured()) return null;
  await requireAdmin();
  const { entity } = await params;
  const { id } = await searchParams;
  if (!['projects', 'offers', 'campaigns'].includes(entity)) notFound();
  return <AdminEditor key={id || 'new'} entity={entity} id={id} />;
}
