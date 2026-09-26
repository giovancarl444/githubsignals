import Link from 'next/link';
import { ArrowUpRight, Radio, Github, Instagram } from 'lucide-react';
import { SiteNavigation } from './site-navigation';
import { signupsEnabled } from '@/lib/config';
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="GitHub Signals home">
      <span className="brand-mark">
        <Radio size={23} />
      </span>
      <span>
        GitHub <strong>Signals</strong>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand />
        <SiteNavigation />
        <div className="header-cta">
          {signupsEnabled() ? (
            <Link href="/#newsletter" className="button button-small">
              The weekly signal <ArrowUpRight size={14} />
            </Link>
          ) : (
            <a
              href="https://www.instagram.com/githubsignals/"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-small"
            >
              <Instagram size={15} /> Follow the signal
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer shell publication-footer">
      <div className="footer-intro">
        <Brand />
        <p>
          Good projects deserve to be found.
          <br />
          Independent discoveries for people who build.
        </p>
      </div>
      <div className="footer-column">
        <span>Explore</span>
        <Link href="/projects">Project collection</Link>
        <Link href="/tools">The toolbox</Link>
        <a
          href="https://www.instagram.com/githubsignals/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram <ArrowUpRight size={13} />
        </a>
      </div>
      <div className="footer-column">
        <span>Publication</span>
        <Link href="/about">About GitHub Signals</Link>
        <Link href="/partners">Partner with us</Link>
        <Link href="/disclosure">Editorial standards</Link>
      </div>
      <div className="footer-bottom">
        <p className="copyright">
          © {new Date().getFullYear()} GitHub Signals. Independent of GitHub, Inc.
        </p>
        <Link href="/privacy">Privacy</Link>
        <Link href="/disclosure">Affiliate disclosure</Link>
      </div>
    </footer>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function EmptyCatalog({ kind }: { kind: 'projects' | 'tools' }) {
  return (
    <div className="empty-catalog">
      <Github size={30} />
      <h2>
        {kind === 'projects'
          ? 'The next discovery starts here.'
          : 'Good recommendations take a little care.'}
      </h2>
      <p>
        {kind === 'projects'
          ? 'Our web collection is taking shape. Explore the latest discoveries on Instagram while we prepare the archive.'
          : 'We’re curating tools worth recommending. Approved partner offers will appear here, with the relationship clearly labelled.'}
      </p>
      <a
        className="text-link"
        href="https://www.instagram.com/githubsignals/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Explore @githubsignals <ArrowUpRight size={16} />
      </a>
    </div>
  );
}
