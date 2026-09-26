# Editorial and commercial operations

## Publishing discoveries and Instagram posts

Sign in at `/admin`, open Projects and write/edit a discovery. Store a real repository URL, plain-text editorial body, category/tags and a genuine Instagram post/reel permalink. Preview the saved draft before changing status to published. Archives disappear from public listings. The four checked-in discoveries are the initial archive; ongoing content lives in Supabase after connection.

CSV import accepts at most 1 MB and 1,000 rows. Import validates the complete file before writing. Every imported project is a draft, regardless of a supplied status column; existing slugs are preserved. Tags are separated with `|`. There is no scheduled scraping dependency or automatic social publishing. For the complete historical feed, obtain the owner-authorized Instagram export/API connection and review the imported project mapping before publication.

## Offers and sponsorships

Record the actual affiliate program, merchant landing page, approved hostname and disclosure. Keep an offer in draft until a real agreement is confirmed. Published links use `/go/<slug>?campaign=<label>&placement=<label>`. Labels accept letters, numbers, underscores and hyphens; do not put email addresses, subscriber IDs or secrets in them. Public project repository links remain direct and untracked.

An outbound click stores only the offer, campaign, placement and timestamp. It is a click count, not unique visitors, sales attribution or proof of revenue. The destination URL is approved explicitly; it cannot be overridden by query parameters. A merchant's own onward redirect is outside this site's control; inspect it before publishing and during routine link checks.

Partner enquiries are stored in the admin inbox with new/contacted/qualified/closed status. Submission never sends a message to the partner or enrolls them in the newsletter. Reply through the actual business mailbox after reviewing the enquiry.

## Newsletter

1. Write a weekly draft and preview the saved text. Use full HTTPS URLs for links. Include context and commercial labels in the copy.
2. Prepare the draft in Resend. Preparation does not send. The local subject/body lock prevents an unnoticed divergence from the prepared provider draft.
3. Resolve pending/dead contact-sync jobs, review the sender/recipient segment and verify that the provider's unsubscribed contacts remain excluded.
4. Explicitly choose Send or Schedule in the dashboard. Scheduled times are entered in the operator's local time and stored as UTC. Saving a draft does not implicitly schedule it.
5. If the provider outcome is uncertain, inspect the existing broadcast and reconcile it. Do not create a duplicate campaign to work around an uncertain send. `review_required`, stale `sending` and stale `preparing` require operator review.

Provider-native unsubscribe is used in every broadcast. Custom signed unsubscribe endpoints also enforce a one-way opt-out without login, and GET links never change subscription state. Complaints and bounces suppress a subscriber. Neither CSV import nor a stale sync can automatically re-enable suppressed addresses.

Subscriber export is authenticated and formula-safe for spreadsheets. Preserve the exported status and consent version. Consent wording is in `consent_versions`, event history in `consent_events`; use an encrypted application backup for the full consent audit trail. A historical external list is **not verified**. Do not upload or subscribe it until its source, permission and all opt-outs are validated; subscriber import is deliberately not exposed as an unrestricted CSV action.

## Commissions

Use CSV columns: `program,transaction_id,offer_id,amount_minor,currency,status,occurred_at`. `offer_id` may be blank. Enter ISO 4217 currency codes in uppercase; amounts are integer minor units (e.g. USD 1234 = $12.34). Accepted statuses: pending, approved, reversed, paid. Use an ISO timestamp with timezone.

Program + transaction ID identifies a transaction. Re-importing that pair updates the current amount/status rather than duplicating revenue. Record reversals as status `reversed` with the original positive amount. The dashboard reports each status and currency independently, not a misleading combined earnings figure. A malformed row rejects the entire import. Keep original partner reports in private accounting storage as the audit evidence; the application stores the current reconciled ledger and import action log.

## Retention and monitoring

The daily maintenance job removes anonymous clicks after 90 days, closed enquiries after 12 months, abandoned never-confirmed signups after 30 days, finished jobs after 30 days, expired confirmation payloads, stale rate buckets and old webhook IDs. It strips signup-source details from opted-out records while retaining suppression and necessary consent evidence. Backups have their own configured retention and must age out too.

Set an owner-controlled uptime alert for `/api/health`, enable Vercel error alerts and inspect the failed-job queue. The authenticated operations script `npm run check:offers` detects broken published destination responses without following arbitrary redirect chains. Run it after publishing an offer and on a daily owner-controlled schedule. Set an alert on its nonzero exit code. No monitoring schedule is claimed active until installed in the hosting account.

Never clear a provider suppression simply to make the dashboard look healthy. Verify genuine reconsent and the actual failure cause. Privacy/deletion requests need an operator workflow covering Supabase, Resend, retained minimal suppression and backup expiry.
