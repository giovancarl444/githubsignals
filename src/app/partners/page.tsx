import Link from 'next/link';
import { ArrowUpRight, Instagram, Mail, Compass } from 'lucide-react';
import { PageHeading } from '@/components/site-shell';
import { PartnerForm } from '@/components/partner-form';
import { isConfigured, signupsEnabled } from '@/lib/config';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Partner with GitHub Signals',
  description:
    'Introduce a useful developer product through clearly labelled sponsorships and affiliate partnerships with GitHub Signals.',
  alternates: { canonical: '/partners' },
};
export default function Partners() {
  const newsletter = signupsEnabled();
  return (
    <main id="main" className="shell page partners-page">
      <div className="partners-intro">
        <PageHeading
          eyebrow="PARTNER WITH GITHUB SIGNALS"
          title="A useful product. The right introduction."
          description="Meet a community built around open-source discovery. We work with products that give developers a clear reason to look closer."
        />
        <div className="audience-card">
          <Instagram size={24} />
          <strong>49K</strong>
          <span>Instagram followers</span>
          <a
            href="https://www.instagram.com/githubsignals/"
            target="_blank"
            rel="noopener noreferrer"
          >
            @githubsignals <ArrowUpRight size={14} />
          </a>
          <small>Approximate audience · September 2026</small>
        </div>
      </div>
      <section className="partner-formats">
        <div className="section-title">
          <div>
            <span className="eyebrow">WAYS TO WORK TOGETHER</span>
            <h2>Context before clicks.</h2>
          </div>
        </div>
        <div className="card-grid">
          <div className="format-card">
            <Instagram size={25} />
            <span>01 / SOCIAL</span>
            <h3>A considered introduction.</h3>
            <p>
              A sponsored feature built around what your product does and who it helps, with the
              commercial relationship clearly labelled.
            </p>
          </div>
          <div className="format-card">
            <Compass size={25} />
            <span>02 / TOOLBOX</span>
            <h3>A recommendation with substance.</h3>
            <p>
              An affiliate partnership with a dedicated tool page, a clear use case and transparent
              disclosure beside the link.
            </p>
          </div>
          <div className="format-card">
            <Mail size={25} />
            <span>03 / NEWSLETTER {!newsletter && '· COMING SOON'}</span>
            <h3>A place in the weekly edit.</h3>
            <p>
              {newsletter
                ? 'A clearly labelled sponsorship alongside the week’s editorial discoveries.'
                : 'Newsletter placements will open with the weekly edition. We can discuss fit while the publication prepares to launch.'}
            </p>
          </div>
        </div>
      </section>
      <section className="partner-contact" id="enquire">
        <div>
          <span className="eyebrow">START A CONVERSATION</span>
          <h2>
            Show us what
            <br />
            you’re building.
          </h2>
          <p>
            Send your product link, the developer problem it solves, and the kind of collaboration
            you have in mind.
          </p>
          <p className="fine-print">
            Sponsorships are labelled. Partnerships do not purchase control over unrelated editorial
            coverage. <Link href="/disclosure">Our editorial policy →</Link>
          </p>
        </div>
        <PartnerForm
          enabled={
            isConfigured() &&
            Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
          }
        />
      </section>
    </main>
  );
}
