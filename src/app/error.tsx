'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="shell page article">
      <span className="eyebrow">A BRIEF INTERRUPTION</span>
      <h1>We lost the signal.</h1>
      <p>Something didn’t load. Please try again in a moment.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
