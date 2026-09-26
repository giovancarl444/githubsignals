import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';
import { PageHeading, EmptyCatalog } from '@/components/site-shell';
import { ProjectCard } from '@/components/project-card';
import { projects } from '@/lib/content';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Project discoveries',
  description:
    'Explore the GitHub Signals collection: open-source projects, clear explanations and direct links to the source.',
  alternates: { canonical: '/projects' },
};
export default async function Projects({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = '', category = '' } = await searchParams;
  const all = await projects();
  const categories = [...new Set(all.map((p) => p.category))];
  const query = q.slice(0, 100).trim();
  const filtered = all.filter(
    (p) =>
      (!category || p.category === category) &&
      `${p.title} ${p.summary} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main id="main" className="shell page collection-page">
      <PageHeading
        eyebrow="THE DISCOVERY LOG"
        title="Find your next build."
        description="A growing collection of open-source projects. Read the context, follow the source, and make something of your own."
      />
      <form className="search-bar" action="/projects">
        <label>
          <Search size={19} />
          <span className="sr-only">Search projects</span>
          <input
            name="q"
            defaultValue={query}
            maxLength={100}
            placeholder="Search a project, use case or tag…"
          />
        </label>
        <select name="category" defaultValue={category} aria-label="Project category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="button">
          Search <Search size={16} />
        </button>
      </form>
      <div className="results-summary">
        <p>
          {filtered.length} {filtered.length === 1 ? 'discovery' : 'discoveries'}
          {query ? ` for “${query}”` : category ? ` in ${category}` : ' in the collection'}
        </p>
        {query || category ? (
          <Link className="text-link" href="/projects">
            Clear filters ×
          </Link>
        ) : (
          <span>Independent picks. Direct repository links.</span>
        )}
      </div>
      {!all.length ? (
        <EmptyCatalog kind="projects" />
      ) : !filtered.length ? (
        <div className="empty-catalog">
          <Search size={30} />
          <h2>A different search might find it.</h2>
          <p>Try a project name, a technology or a broader category.</p>
          <Link href="/projects" className="button button-secondary">
            Explore all projects <ArrowUpRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} heading="h2" />
          ))}
        </div>
      )}
      <div className="collection-end">
        <p>Know a project worth a closer look?</p>
        <a
          className="text-link"
          href="https://www.instagram.com/githubsignals/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Send it to @githubsignals <ArrowUpRight size={16} />
        </a>
      </div>
    </main>
  );
}
