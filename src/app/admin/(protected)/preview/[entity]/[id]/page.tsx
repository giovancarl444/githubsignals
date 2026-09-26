import { isConfigured } from '@/lib/config';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
export default async function Preview({
  params,
}: {
  params: Promise<{ entity: string; id: string }>;
}) {
  if (!isConfigured()) return null;
  await requireAdmin();
  const { entity, id } = await params;
  if (!['projects', 'offers'].includes(entity) || !z.string().uuid().safeParse(id).success)
    notFound();
  const { data, error } = await db().from(entity).select('*').eq('id', id).single();
  if (error || !data) notFound();
  return (
    <article className="article">
      <p className="admin-note">Private editorial preview · {data.status}</p>
      <span className="eyebrow">{data.category || 'AFFILIATE PARTNER'}</span>
      <h1>{data.title}</h1>
      <p className="article-lead">{data.summary}</p>
      {data.disclosure && <p className="disclosure">{data.disclosure}</p>}
      <div className="article-body">
        {String(data.body)
          .split(/\n\n+/)
          .map((p, i) => (
            <p key={i}>{p}</p>
          ))}
      </div>
    </article>
  );
}
