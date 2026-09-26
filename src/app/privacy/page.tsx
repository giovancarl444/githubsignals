import { PageHeading } from '@/components/site-shell';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Privacy', alternates: { canonical: '/privacy' } };
export default function Privacy() {
  return (
    <main id="main" className="shell page article">
      <PageHeading
        eyebrow="YOUR INFORMATION"
        title="Privacy, in plain English."
        description="GitHub Signals collects only the information needed to run this publication and respond to you."
      />
      <h2>Newsletter subscriptions</h2>
      <p>
        When you subscribe, we record your email address, consent, confirmation and subscription
        status, timestamps, and the campaign or page that brought you here. You must confirm your
        address before receiving the newsletter. We use Supabase to store these records and Resend
        to deliver email.
      </p>
      <h2>Your choices</h2>
      <p>
        You can unsubscribe using the link in every newsletter. We retain the minimum suppression
        record needed to respect your choice. Bounced addresses and complaints are excluded from
        future campaigns.
      </p>
      <h2>Partnership enquiries</h2>
      <p>
        We store the details you submit so we can respond to your proposal. Enquiries do not
        subscribe you to marketing email.
      </p>
      <h2>Website activity</h2>
      <p>
        We count outbound partner-link clicks with their campaign and placement. These records do
        not include your email address or IP address. Our hosting and anti-spam providers process
        request information to deliver and protect the site. Administrators use cookies to sign in.
      </p>
      <h2>Service providers and retention</h2>
      <p>
        Vercel hosts the site, Supabase stores application data, Resend delivers email and
        Cloudflare provides DNS and anti-spam verification. Information may be processed in the
        countries where these providers operate. We retain active subscription records while you
        subscribe; enquiry records for up to 12 months after closure; anonymous click records for 90
        days; and minimal unsubscribe records while we operate the mailing list. Backups age out
        according to the recovery schedule.
      </p>
      <h2>Contact and deletion</h2>
      <p>
        {process.env.BUSINESS_NAME || 'GitHub Signals'} operates this publication.{' '}
        {process.env.CONTACT_EMAIL ? (
          <a href={`mailto:${process.env.CONTACT_EMAIL}`}>
            Contact us about access, correction or deletion of your information.
          </a>
        ) : (
          <a href="https://www.instagram.com/githubsignals/">
            Contact @githubsignals about your information.
          </a>
        )}
      </p>
      <p className="fine-print">Last updated: 26 September 2026.</p>
    </main>
  );
}
