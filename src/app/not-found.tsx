import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="shell page article">
      <span className="eyebrow">404 · SIGNAL LOST</span>
      <h1>
        A dead end.
        <br />
        Plenty more to discover.
      </h1>
      <p>This page doesn’t exist, or the project is no longer published.</p>
      <Link href="/projects" className="button">
        Explore the collection →
      </Link>
    </main>
  );
}
