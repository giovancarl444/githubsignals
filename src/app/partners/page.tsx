import { PageHeading } from '@/components/site-shell';
import { PartnerForm } from '@/components/partner-form';
import { isConfigured } from '@/lib/config';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Partner with GitHub Signals',
  alternates: { canonical: '/partners' },
};
export default function Partners() {
  return (
    <main id="main" className="shell page">
      <PageHeading
        eyebrow="BUILD SOMETHING TOGETHER"
        title="Reach people who build."
        description="Have a tool that makes a developer’s day better? Let’s find the right way to introduce it."
      />
      <div className="partner-layout">
        <div className="form-stack">
          <div>
            <h2>A useful introduction.</h2>
            <p>
              Newsletter sponsorships, thoughtful tool recommendations and relevant affiliate
              partnerships.
            </p>
          </div>
          <div>
            <h2>Clear relationships.</h2>
            <p>
              Sponsored placements and affiliate links are labelled. Our editorial discoveries
              remain independent.
            </p>
          </div>
          <div>
            <h2>A conversation first.</h2>
            <p>
              Tell us who your product helps and what makes it worth a closer look. We review every
              proposal.
            </p>
          </div>
        </div>
        <PartnerForm
          enabled={
            isConfigured() &&
            Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
          }
        />
      </div>
    </main>
  );
}
