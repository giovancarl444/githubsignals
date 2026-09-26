import { notFound } from 'next/navigation';
import Link from 'next/link';
import { projects } from '@/lib/content';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = (await projects()).find((p) => p.slug === slug);
  return project
    ? {
        title: project.title,
        description: project.summary,
        alternates: { canonical: `/projects/${slug}` },
      }
    : {};
}
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = (await projects()).find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <main id="main" className="shell page article">
      <Link href="/projects" className="text-link">
        ← Back to the collection
      </Link>
      <span className="eyebrow">{p.category}</span>
      <h1>{p.title}</h1>
      <p className="article-lead">{p.summary}</p>
      <div className="tags">
        {p.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="article-body">
        {p.body.split(/\n\n+/).map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </div>
      <div className="hero-actions">
        <a href={p.repository_url} target="_blank" rel="noopener noreferrer" className="button">
          Explore the repository ↗
        </a>
        {p.instagram_url && (
          <a href={p.instagram_url} target="_blank" rel="noopener noreferrer" className="text-link">
            Watch on Instagram ↗
          </a>
        )}
      </div>
      <p className="fine-print">
        An editorial discovery. Repository links take you directly to the project.
      </p>
    </main>
  );
}
