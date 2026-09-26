import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Github, Radio, Code2, Bookmark, Mail } from 'lucide-react';
import { SubscribeForm } from '@/components/subscribe-form';
import { EmptyCatalog } from '@/components/site-shell';
import { projects } from '@/lib/content';
import { signupsEnabled } from '@/lib/config';
export const dynamic = 'force-dynamic';
export const metadata = { alternates: { canonical: '/' } };
export default async function Home() {
  const collection = await projects();
  const latest = collection.slice(0, 3);
  const social = collection.filter((p) => p.instagram_url).slice(0, 4);
  return (
    <main id="main">
      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="signal-dot" /> THE OPEN-SOURCE DISCOVERY DESK
          </div>
          <h1>
            Less noise.
            <br />
            More <span className="orange-text">signal.</span>
          </h1>
          <p className="hero-description">
            Great projects get buried every day.
            <br className="desktop-break" /> We find the ones worth your next{' '}
            <span className="code-inline">git clone</span>.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/projects">
              Find your next project <ArrowUpRight size={18} />
            </Link>
            <a
              href="https://www.instagram.com/githubsignals/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              Follow the discoveries <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="audience">
            <span className="avatar-stack">
              <span>⌘</span>
              <span>↗</span>
              <span>_</span>
            </span>
            <p>
              <strong>49K curious builders</strong>
              <span>Following @githubsignals · September 2026</span>
            </p>
          </div>
        </div>
        <div className="signal-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="orbit-label label-top">IDEAS WORTH FORKING</div>
          <div className="orbit-label label-bottom">LESS SCROLLING. MORE BUILDING.</div>
          <div className="signal-core">
            <Radio size={90} strokeWidth={1} />
          </div>
          <div className="floating-badge badge-code">
            <Code2 /> open source
          </div>
          <div className="floating-badge badge-star">✦ worth your stars</div>
          <div className="terminal-line">
            <span>~/discoveries</span> $ find the signal<span className="cursor">_</span>
          </div>
        </div>
      </section>
      <div className="promise-strip">
        <div className="shell">
          <span>
            <Github size={17} /> Open source at the core
          </span>
          <span>
            <Bookmark size={17} /> Selected with context
          </span>
          <span>
            <Code2 size={17} /> Explained in plain English
          </span>
          <span>
            <Radio size={17} /> Independent by design
          </span>
        </div>
      </div>
      <section className="section shell">
        <div className="section-title">
          <div>
            <span className="eyebrow">THE DISCOVERY LOG</span>
            <h2>
              A little less searching.
              <br />A little more building.
            </h2>
          </div>
          <Link href="/projects" className="text-link">
            Browse the collection <ArrowRight size={17} />
          </Link>
        </div>
        {latest.length ? (
          <div className="card-grid">
            {latest.map((p) => (
              <Link className="project-card" href={`/projects/${p.slug}`} key={p.id}>
                <span className="card-category">{p.category}</span>
                <Github size={30} />
                <h3>{p.title}</h3>
                <p>{p.summary}</p>
                <span className="text-link">
                  Explore project <ArrowUpRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyCatalog kind="projects" />
        )}
      </section>
      {social.length > 0 && (
        <section className="section shell instagram-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">FROM @GITHUBSIGNALS</span>
              <h2>
                Spotted on the feed.
                <br />
                Saved for your next build.
              </h2>
            </div>
            <a
              className="text-link"
              href="https://www.instagram.com/githubsignals/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Instagram <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="social-grid">
            {social.map((p, i) => (
              <a
                className="social-card"
                key={p.id}
                href={p.instagram_url!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className={`social-cover cover-${i}`}>
                  <span className="eyebrow">{p.category}</span>
                  <Code2 size={48} strokeWidth={1} />
                  <strong>{p.title}</strong>
                  <span className="social-play">↗</span>
                </div>
                <div className="social-caption">
                  <span>FROM THE ARCHIVE</span>
                  <h3>{p.summary}</h3>
                  <span className="text-link">View original post ↗</span>
                </div>
              </a>
            ))}
          </div>
          <p className="fine-print">Selected discoveries from our Instagram archive.</p>
        </section>
      )}
      <section className="newsletter-section shell" id="newsletter">
        <div>
          <span className="eyebrow">
            <Mail size={14} /> A BETTER KIND OF INBOX
          </span>
          <h2>
            Your weekly
            <br />
            <span className="orange-text">unfair advantage.</span>
          </h2>
          <p>
            A considered collection of projects, tools and ideas.
            <br />
            Useful enough to open. Short enough to finish.
          </p>
        </div>
        <div className="newsletter-form-wrap">
          <SubscribeForm enabled={signupsEnabled()} />
          <p className="fine-print">One thoughtful email a week. Free to read. Easy to leave.</p>
        </div>
      </section>
      <section className="partner-strip shell">
        <p>Building something developers should know about?</p>
        <Link href="/partners" className="text-link">
          Let’s work together <ArrowUpRight size={17} />
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
