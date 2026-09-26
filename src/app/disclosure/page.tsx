import { PageHeading } from '@/components/site-shell';
export const metadata = {
  title: 'Editorial and affiliate policy',
  alternates: { canonical: '/disclosure' },
};
export default function Disclosure() {
  return (
    <main id="main" className="shell page article">
      <PageHeading
        eyebrow="HOW WE WORK"
        title="Useful first. Always."
        description="Our job is to help developers discover projects and tools worth their attention."
      />
      <h2>Editorial discoveries</h2>
      <p>
        Project pages explain what a repository does and who may find it useful. Repository links go
        directly to the project. Inclusion is not a security audit or a guarantee that a project
        will suit your needs.
      </p>
      <h2>Affiliate recommendations</h2>
      <p>
        Some tool recommendations use affiliate links. If you make a qualifying purchase, GitHub
        Signals may earn a commission. We label these relationships beside recommendations and
        links. The provider sets its own prices and terms.
      </p>
      <h2>Sponsorships</h2>
      <p>
        Paid placements are labelled as sponsored. A commercial relationship does not grant a
        partner control over unrelated editorial content.
      </p>
      <h2>Independence</h2>
      <p>
        GitHub Signals is an independent publication and is not affiliated with GitHub, Inc. Project
        names and trademarks belong to their respective owners.
      </p>
    </main>
  );
}
