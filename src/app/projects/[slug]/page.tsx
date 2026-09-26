import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Github, Instagram, BookOpen } from 'lucide-react';
import { projects } from '@/lib/content';
import {
  ProjectArtwork,
  ProjectCard,
  discoveryDate,
  repositoryName,
} from '@/components/project-card';
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
  const collection = await projects();
  const p = collection.find((project) => project.slug === slug);
  if (!p) notFound();
  const related = collection.filter((project) => project.id !== p.id).slice(0, 3);
  const minutes = Math.max(1, Math.ceil(p.body.trim().split(/\s+/).length / 200));
  return (
    <main id="main" className="shell page project-detail">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/projects">Discoveries</Link>
        <span aria-hidden="true">/</span>
        <span>{p.title}</span>
      </nav>
      <div className="project-intro">
        <header>
          <span className="eyebrow">{p.category}</span>
          <h1>{p.title}</h1>
          <p className="detail-lead">{p.summary}</p>
          <div className="byline">
            <span>GitHub Signals</span>
            <span>·</span>
            <span>{minutes} min read</span>
            {p.published_at && (
              <>
                <span>·</span>
                <time dateTime={p.published_at}>{discoveryDate(p.published_at)}</time>
              </>
            )}
          </div>
          <div className="tags">
            {p.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </header>
        <ProjectArtwork project={p} />
      </div>
      <div className="reading-layout">
        <article className="reading-body">
          <span className="eyebrow">THE FIELD NOTE</span>
          <h2>Inside the project.</h2>
          {p.body.split(/\n\n+/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          <div className="editorial-note">
            <span className="signal-dot" />
            <p>
              An independent editorial discovery.{' '}
              <Link href="/disclosure">
                How we choose and label our recommendations <ArrowUpRight size={13} />
              </Link>
            </p>
          </div>
        </article>
        <aside className="source-panel">
          <span className="eyebrow">START AT THE SOURCE</span>
          <Github size={28} />
          <h2>{repositoryName(p.repository_url)}</h2>
          <p>
            Read the project’s documentation, explore the code and check its latest requirements.
          </p>
          <a href={p.repository_url} target="_blank" rel="noopener noreferrer" className="button">
            Open repository <ArrowUpRight size={16} />
          </a>
          <a
            className="source-link"
            href={`${p.repository_url}#readme`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen size={17} /> Read the README <ArrowUpRight size={15} />
          </a>
          {p.instagram_url && (
            <a
              className="source-link"
              href={p.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram size={17} /> Original Instagram post <ArrowUpRight size={15} />
            </a>
          )}
          <small>Direct links to the project and original post.</small>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="section related-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">ONE DISCOVERY LEADS TO ANOTHER</span>
              <h2>Keep exploring.</h2>
            </div>
            <Link href="/projects" className="text-link">
              All discoveries <ArrowRight size={16} />
            </Link>
          </div>
          <div className="card-grid">
            {related.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
