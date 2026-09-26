import Link from 'next/link';
import { Github, ArrowUpRight, Search } from 'lucide-react';
import { PageHeading, EmptyCatalog } from '@/components/site-shell';
import { projects } from '@/lib/content';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project discoveries', alternates: { canonical: '/projects' } };
export default async function Projects({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = '', category = '' } = await searchParams;
  const all = await projects();
  const categories = [...new Set(all.map((p) => p.category))];
  const filtered = all.filter(
    (p) =>
      (!category || p.category === category) &&
      `${p.title} ${p.summary} ${p.tags.join(' ')}`
        .toLowerCase()
        .includes(q.slice(0, 100).toLowerCase()),
  );
  return (
    <main id="main" className="shell page">
      <PageHeading
        eyebrow="THE DISCOVERY LOG"
        title="Your next rabbit hole."
        description="Useful open-source projects, with the context to decide whether they belong in your toolbox."
      />
      <form className="search-bar" action="/projects">
        <label>
          <Search size={17} />
          <span className="sr-only">Search projects</span>
          <input
            name="q"
            defaultValue={q}
            maxLength={100}
            placeholder="Search projects, ideas, tags…"
          />
        </label>
        <select name="category" defaultValue={category} aria-label="Project category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="button">Search</button>
      </form>
      {!all.length ? (
        <EmptyCatalog kind="projects" />
      ) : !filtered.length ? (
        <div className="empty-catalog">
          <h2>No discoveries match yet.</h2>
          <Link href="/projects" className="text-link">
            Clear your search →
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((p) => (
            <Link href={`/projects/${p.slug}`} className="project-card" key={p.id}>
              <span className="card-category">{p.category}</span>
              <Github size={28} />
              <h2>{p.title}</h2>
              <p>{p.summary}</p>
              <div className="tags">
                {p.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <span className="text-link">
                Take a closer look <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
