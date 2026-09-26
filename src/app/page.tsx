import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Github, Instagram, Mail, Check } from 'lucide-react';
import { SubscribeForm } from '@/components/subscribe-form';
import { EmptyCatalog } from '@/components/site-shell';
import { ProjectArtwork, ProjectCard, discoveryDate } from '@/components/project-card';
import { projects } from '@/lib/content';
import { signupsEnabled } from '@/lib/config';
export const dynamic = 'force-dynamic';
export const metadata = { alternates: { canonical: '/' } };
export default async function Home() {
  const collection = await projects();
  const featured = collection[0];
  const latest = collection.slice(1, 4);
  const social = collection.filter((p) => p.instagram_url).slice(0, 4);
  const categories = [...new Set(collection.map((p) => p.category))];
  const newsletter = signupsEnabled();
  return (
    <main id="main">
      <section className="publication-hero shell">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="signal-dot" /> INDEPENDENT OPEN-SOURCE DISCOVERY
          </div>
          <h1>
            Less noise.
            <br />
            More <span className="orange-text">signal.</span>
          </h1>
          <p className="publication-lead">
            Good code deserves your attention.
            <br />
            We find the projects, explain why they matter, and point you to the source.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/projects">
              Find your next project <ArrowUpRight size={18} />
            </Link>
            <Link href="/about" className="text-link">
              Meet the publication <ArrowRight size={16} />
            </Link>
          </div>
          <a
            className="community-note"
            href="https://www.instagram.com/githubsignals/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="community-icon">
              <Instagram size={20} />
            </span>
            <span>
              <strong>From the feed to your next build.</strong>
              <small>@githubsignals · 49K Instagram followers · Sep 2026</small>
            </span>
            <ArrowUpRight size={16} />
          </a>
        </div>
        {featured ? (
          <Link className="featured-discovery" href={`/projects/${featured.slug}`}>
            <div className="featured-label">
              <span>
                <span className="signal-dot" /> IN FOCUS
              </span>
              <time dateTime={featured.published_at || undefined}>
                {discoveryDate(featured.published_at)}
              </time>
            </div>
            <ProjectArtwork project={featured} />
            <div className="featured-copy">
              <span className="card-category">{featured.category}</span>
              <h2>
                {featured.title}
                <ArrowUpRight size={28} />
              </h2>
              <p>{featured.summary}</p>
              <span className="text-link">
                Read the discovery <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        ) : (
          <div className="hero-manifesto">
            <Github size={44} strokeWidth={1} />
            <p>
              Useful ideas.
              <br />
              Open by default.
            </p>
            <span className="eyebrow">THE GITHUB SIGNALS EDIT</span>
          </div>
        )}
      </section>
      <nav className="category-strip shell" aria-label="Browse project categories">
        <span>Find your interest</span>
        <div>
          {categories.map((category) => (
            <Link key={category} href={`/projects?category=${encodeURIComponent(category)}`}>
              {category}
              <ArrowUpRight size={13} />
            </Link>
          ))}
        </div>
      </nav>
      <section className="section shell discovery-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">THE DISCOVERY LOG</span>
            <h2>Worth a closer look.</h2>
          </div>
          <Link href="/projects" className="text-link">
            Explore the collection <ArrowRight size={17} />
          </Link>
        </div>
        {latest.length ? (
          <div className="card-grid">
            {latest.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : !featured ? (
          <EmptyCatalog kind="projects" />
        ) : (
          <p className="section-description">
            More discoveries are on the way. Start with the project in focus above.
          </p>
        )}
      </section>
      <section className="editorial-statement shell">
        <span className="eyebrow">A LITTLE CONTEXT GOES A LONG WAY</span>
        <h2>
          Discovery is only the beginning.
          <br />
          <span>Understanding is the useful part.</span>
        </h2>
        <div>
          <p>
            What does it do? Who is it for? Where do you start? Every discovery gives you a short
            introduction and a direct path to the original project.
          </p>
          <Link href="/disclosure" className="text-link">
            Our editorial standards <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      {social.length > 0 && (
        <section className="section shell instagram-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">
                <Instagram size={14} /> ON THE FEED
              </span>
              <h2>Seen it. Saved it. Find it here.</h2>
            </div>
            <a
              className="text-link"
              href="https://www.instagram.com/githubsignals/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow @githubsignals <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="feed-list">
            {social.map((project, index) => (
              <a
                key={project.id}
                href={project.instagram_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="feed-row"
              >
                <span className="feed-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="feed-project">
                  <strong>{project.title}</strong>
                  <span>{project.summary}</span>
                </span>
                <span className="feed-category">{project.category}</span>
                <span className="feed-action">
                  Original post <ArrowUpRight size={19} />
                </span>
              </a>
            ))}
          </div>
          <p className="fine-print">
            Selected discoveries from our Instagram archive. Every link opens the original post.
          </p>
        </section>
      )}
      <section className="newsletter-section shell publication-newsletter" id="newsletter">
        <div>
          <span className="eyebrow">
            <Mail size={14} /> THE WEEKLY SIGNAL{' '}
            {!newsletter && <span className="coming-label">COMING SOON</span>}
          </span>
          <h2>
            Good things.
            <br />
            <span className="orange-text">Once a week.</span>
          </h2>
          <p>
            A concise edit of open-source projects, useful tools and ideas worth taking into your
            next build.
          </p>
          <div className="newsletter-benefits">
            <span>
              <Check size={14} /> Editor selected
            </span>
            <span>
              <Check size={14} /> Free to read
            </span>
            <span>
              <Check size={14} /> Leave any time
            </span>
          </div>
        </div>
        <div className="newsletter-form-wrap">
          <SubscribeForm enabled={newsletter} />
          {newsletter && (
            <p className="fine-print">
              Confirm your email to join. Every edition includes an unsubscribe link.
            </p>
          )}
        </div>
      </section>
      <section className="partner-strip shell">
        <div>
          <span className="eyebrow">MAKE A USEFUL INTRODUCTION</span>
          <p>Built something developers should know about?</p>
        </div>
        <Link href="/partners" className="button button-secondary">
          Partner with GitHub Signals <ArrowUpRight size={17} />
        </Link>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'GitHub Signals',
            url: 'https://githubsignals.com',
            sameAs: ['https://www.instagram.com/githubsignals/'],
          }),
        }}
      />
    </main>
  );
}
