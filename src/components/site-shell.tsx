import Link from 'next/link';
import { ArrowUpRight, Radio, Github, Instagram } from 'lucide-react';
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
        <nav aria-label="Main navigation">
          <Link href="/projects">Projects</Link>
          <Link href="/tools">Tools</Link>
          <Link href="/partners">
            Partner with us <ArrowUpRight size={14} />
          </Link>
        </nav>
        <Link href="/#newsletter" className="button button-small">
          Get the signal <ArrowUpRight size={14} />
        </Link>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer shell">
      <div>
        <Brand />
        <p>Good projects deserve to be found.</p>
      </div>
      <div className="footer-links">
        <a
          href="https://www.instagram.com/githubsignals/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Instagram size={16} /> Instagram
        </a>
        <Link href="/partners">Partnerships</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/disclosure">Editorial & affiliates</Link>
      </div>
      <p className="copyright">
        © {new Date().getFullYear()} GitHub Signals. Independent of GitHub, Inc.
      </p>
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
