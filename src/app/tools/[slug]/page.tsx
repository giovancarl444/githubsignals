import { notFound } from 'next/navigation';
import Link from 'next/link';
import { offers } from '@/lib/content';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = (await offers()).find((o) => o.slug === slug);
  return o
    ? { title: o.title, description: o.summary, alternates: { canonical: `/tools/${slug}` } }
    : {};
}
export default async function Tool({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = (await offers()).find((o) => o.slug === slug);
  if (!o) notFound();
  return (
    <main id="main" className="shell page article">
      <Link href="/tools" className="text-link">
        ← Back to the toolbox
      </Link>
      <span className="eyebrow">AFFILIATE PARTNER</span>
      <h1>{o.title}</h1>
      <p className="article-lead">{o.summary}</p>
      <p className="disclosure">{o.disclosure}</p>
      <div className="article-body">
        {o.body.split(/\n\n+/).map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </div>
      <a
        className="button"
        href={`/go/${o.slug}?placement=tool-page`}
        rel="sponsored nofollow noopener"
        target="_blank"
      >
        Explore {o.title} ↗
      </a>
    </main>
  );
}
