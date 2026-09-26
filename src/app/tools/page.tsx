import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { offers } from '@/lib/content';
import { PageHeading, EmptyCatalog } from '@/components/site-shell';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recommended tools', alternates: { canonical: '/tools' } };
export default async function Tools() {
  const list = await offers();
  return (
    <main id="main" className="shell page">
      <PageHeading
        eyebrow="THE BUILDER’S TOOLBOX"
        title="Tools with a reason to be here."
        description="Thoughtful recommendations for the work you actually do. Commercial relationships are always disclosed."
      />
      {list.length ? (
        <div className="card-grid">
          {list.map((o) => (
            <Link href={`/tools/${o.slug}`} className="project-card" key={o.id}>
              <span className="card-category">Affiliate partner</span>
              <h2>{o.title}</h2>
              <p>{o.summary}</p>
              <span className="text-link">
                See the recommendation <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyCatalog kind="tools" />
      )}
      <p className="fine-print">
        We may earn a commission through approved partner links.{' '}
        <Link href="/disclosure">How our recommendations work →</Link>
      </p>
    </main>
  );
}
