import Link from 'next/link';
import { ArrowUpRight, Github, Radio } from 'lucide-react';
import type { Project } from '@/lib/validation';

const artworkThemes = new Map([
  ['zcode', 'code'],
  ['sprite-gen', 'pixels'],
  ['turbo-vision', 'terminal'],
  ['hextra', 'docs'],
]);

export function discoveryDate(date: string | null) {
  return date
    ? new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(date))
    : '';
}
export function repositoryName(url: string) {
  return new URL(url).pathname.replace(/^\//, '').replace(/\/$/, '');
}
export function ProjectArtwork({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  const theme = artworkThemes.get(project.slug) || 'code';
  return (
    <div className={`project-art art-${theme}${compact ? ' art-compact' : ''}`} aria-hidden="true">
      <div className="art-top">
        <span>GITHUB SIGNALS / DISCOVERY</span>
        <Radio size={16} />
      </div>
      <div className="art-glyph">
        {theme === 'pixels' ? (
          <div className="pixel-character">
            {[
              '00100100',
              '00011000',
              '01111110',
              '11011011',
              '11111111',
              '10111101',
              '10100101',
              '00100100',
            ].flatMap((row, y) =>
              [...row].map((cell, x) => (
                <i className={cell === '1' ? 'pixel-on' : ''} key={`${y}-${x}`} />
              )),
            )}
          </div>
        ) : theme === 'terminal' ? (
          <div className="terminal-window">
            <div>
              ~/terminal<span>─ □ ×</span>
            </div>
            <pre>{'> build something\n  worth opening.\n\n  _'}</pre>
          </div>
        ) : theme === 'docs' ? (
          <div className="docs-glyph">
            <strong>
              Aa<span>.</span>
            </strong>
            <i />
            <i />
            <i />
          </div>
        ) : (
          <div className="code-glyph">
            <span>{'{ '}</span>
            <b>_</b>
            <span>{' }'}</span>
          </div>
        )}
      </div>
      <div className="art-bottom">
        <span>{project.category}</span>
        <span>OPEN SOURCE ↗</span>
      </div>
    </div>
  );
}
export function ProjectCard({
  project,
  heading = 'h3',
}: {
  project: Project;
  heading?: 'h2' | 'h3';
}) {
  const Heading = heading;
  return (
    <Link className="discovery-card" href={`/projects/${project.slug}`}>
      <ProjectArtwork project={project} compact />
      <div className="discovery-card-body">
        <div className="card-meta">
          <span>{project.category}</span>
          <time dateTime={project.published_at || undefined}>
            {discoveryDate(project.published_at)}
          </time>
        </div>
        <Heading>
          {project.title}
          <ArrowUpRight size={21} />
        </Heading>
        <p>{project.summary}</p>
        <span className="repository-label">
          <Github size={14} />
          {repositoryName(project.repository_url)}
        </span>
      </div>
    </Link>
  );
}
