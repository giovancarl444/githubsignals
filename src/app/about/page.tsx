import Link from 'next/link';
import { ArrowUpRight, Github, Radio, FileText, ExternalLink } from 'lucide-react';
import { PageHeading } from '@/components/site-shell';
export const metadata = {
  title: 'About GitHub Signals',
  description:
    'An independent publication helping developers discover useful open-source projects and understand where to start.',
  alternates: { canonical: '/about' },
};
export default function About() {
  return (
    <main id="main" className="shell page about-page">
      <PageHeading
        eyebrow="ABOUT THE PUBLICATION"
        title="Good projects deserve to be found."
        description="GitHub Signals is an independent publication for people who like to build, explore and understand how things work."
      />
      <div className="about-story">
        <div className="about-mark" aria-hidden="true">
          <Radio size={110} strokeWidth={1} />
          <span>FOLLOW THE SIGNAL.</span>
        </div>
        <div>
          <h2>
            From a passing scroll
            <br />
            to a useful discovery.
          </h2>
          <p>
            Our home on Instagram is{' '}
            <a
              href="https://www.instagram.com/githubsignals/"
              target="_blank"
              rel="noopener noreferrer"
            >
              @githubsignals
            </a>
            . This site gives those discoveries a place to live: searchable, explained in context
            and connected to the original repositories.
          </p>
          <p>
            We’re interested in the practical idea behind a project. A better way to write code. A
            useful building block. A tool that makes something possible.
          </p>
          <p>
            The aim is simple: help you decide what deserves a closer look, then get you to the
            source.
          </p>
        </div>
      </div>
      <section className="section">
        <div className="section-title">
          <div>
            <span className="eyebrow">OUR EDITORIAL APPROACH</span>
            <h2>Useful, clear and open.</h2>
          </div>
        </div>
        <div className="card-grid">
          <div className="format-card">
            <Github size={25} />
            <h3>Start with the project.</h3>
            <p>
              Discoveries point to the original repository so you can read the code, documentation
              and license for yourself.
            </p>
          </div>
          <div className="format-card">
            <FileText size={25} />
            <h3>Give it some context.</h3>
            <p>
              A short explanation of what a project does, where it might fit and how to begin
              exploring it.
            </p>
          </div>
          <div className="format-card">
            <ExternalLink size={25} />
            <h3>Make relationships clear.</h3>
            <p>
              Paid placements and affiliate recommendations are labelled. Editorial project links
              stay direct.
            </p>
          </div>
        </div>
      </section>
      <div className="about-end">
        <div>
          <h2>Stay curious. Build something.</h2>
          <p>Start with a discovery, or introduce us to a project worth knowing.</p>
        </div>
        <Link className="button" href="/projects">
          Explore the collection <ArrowUpRight size={17} />
        </Link>
      </div>
      <p className="fine-print">
        GitHub Signals is independent of GitHub, Inc.{' '}
        <Link href="/disclosure">Read the editorial and affiliate policy.</Link>
      </p>
    </main>
  );
}
