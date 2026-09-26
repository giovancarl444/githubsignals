import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Check } from 'lucide-react';
import { offers, projects } from '@/lib/content';
import { PageHeading } from '@/components/site-shell';
import { ProjectCard } from '@/components/project-card';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'The developer toolbox',
  description:
    'Useful tools, open-source discoveries and clearly labelled partner recommendations from GitHub Signals.',
  alternates: { canonical: '/tools' },
};
export default async function Tools() {
  const [list, collection] = await Promise.all([offers(), projects()]);
  return (
    <main id="main" className="shell page toolbox-page">
      <PageHeading
        eyebrow="THE BUILDER’S TOOLBOX"
        title="A reason for every recommendation."
        description="Tools should earn a place in your workflow. Explore our open-source discoveries and clearly labelled commercial recommendations."
      />
      <div className="standards-bar">
        <span>
          <Check size={16} /> Clear use cases
        </span>
        <span>
          <Check size={16} /> Original sources
        </span>
        <span>
          <Check size={16} /> Disclosed relationships
        </span>
        <Link href="/disclosure">
          How we work <ArrowUpRight size={14} />
        </Link>
      </div>
      <section className="toolbox-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">COMMERCIAL RECOMMENDATIONS</span>
            <h2>Partner offers.</h2>
          </div>
        </div>
        {list.length ? (
          <div className="card-grid">
            {list.map((o) => (
              <Link href={`/tools/${o.slug}`} className="project-card offer-card" key={o.id}>
                <span className="commercial-label">Affiliate partner</span>
                <h3>{o.title}</h3>
                <p>{o.summary}</p>
                <span className="text-link">
                  See the recommendation <ArrowUpRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="offers-empty">
            <div>
              <span className="empty-status">
                <span className="signal-dot" /> CURATING THE TOOLBOX
              </span>
              <h3>Recommendations are worth getting right.</h3>
              <p>
                No partner offers are published yet. When they are, you’ll find the use case, the
                recommendation and the commercial relationship clearly explained here.
              </p>
            </div>
            <Link href="/partners" className="button button-secondary">
              Build with us <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
        <p className="fine-print">
          We may earn a commission through published affiliate links.{' '}
          <Link href="/disclosure">Read our affiliate policy.</Link>
        </p>
      </section>
      {collection.length > 0 && (
        <section className="toolbox-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">FROM THE OPEN-SOURCE COLLECTION</span>
              <h2>Good places to start.</h2>
            </div>
            <Link href="/projects" className="text-link">
              All discoveries <ArrowRight size={16} />
            </Link>
          </div>
          <p className="section-description">
            Independent editorial discoveries with direct repository links.
          </p>
          <div className="card-grid">
            {collection.slice(0, 3).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
