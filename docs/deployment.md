# Deployment and ownership

## Owner prerequisites

Use accounts, billing, recovery methods and MFA controlled by the business owner. Record owner email, organization/team, billing owner and recovery contact in the owner's password manager. No credentials go into Git, chat, screenshots or CSV imports.

| Service          | Configuration                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------- |
| GitHub           | `giovancarl444/githubsignals`, default branch main                                          |
| Vercel           | Pro, import this existing repository, Next.js preset, Node 24, npm ci, npm run build        |
| Supabase         | Pro production project in an EU region; separate preview/recovery project                   |
| Resend           | Verified sending domain, dedicated newsletter segment; isolated preview credentials/segment |
| Cloudflare       | Owner-controlled zone and Turnstile widgets with exact allowed hostnames                    |
| Google Workspace | Business mailbox, contact/partners/privacy aliases; separate from newsletter delivery       |
| Domain           | Existing Lovable/Name.com registration retained for this release                            |

The budget in the accepted plan is an estimate, not a purchase or committed provider price. Check the provider checkout before starting subscriptions.

## Release A: real signup

1. Import the GitHub repository into Vercel. Keep its generated hostname during setup and retain the old production deployment. Use production and preview environment scopes deliberately; never select every scope for production secrets.
2. Create the two Supabase projects. Copy the appropriate project URL, publishable key, secret/service-role key and reference into each environment. Set `PRODUCTION_SUPABASE_PROJECT_REF` everywhere so preview misuse can be rejected. Set `APP_ENV=production` only in the production scope. `APP_URL` must equal that deployment's real origin. Production ultimately uses `https://githubsignals.com`.
3. In Supabase Auth, disable public user signup. Configure password authentication for invited admin users, approved redirect URLs and owner recovery. Create the admin through the owner-controlled dashboard; copy its UUID into:
   ```sql
   insert into public.admin_users(user_id) values ('REPLACE_WITH_AUTH_USER_UUID');
   ```
   Membership is checked server-side on every administrative read/write/export. The browser never gets the secret key.
4. Run `npm run db:migrate` against each correct database using a private `.env.local`, a direct/session connection (not transaction pooling) and the provider's CA if needed. The seeded editorial records are verified existing Instagram discoveries; no commercial inventory is fabricated.
5. Configure Resend and the mailbox as described in [domain-and-mail.md](domain-and-mail.md). Set the newsletter segment ID, sender, reply-to, organization name, postal address and privacy contact. Register `/api/webhooks/resend` with a provider signing secret. Enable `email.bounced`, `email.complained`, `email.suppressed`, `suppression.added` and `contact.updated` events. Resend-native unsubscribe events must reach this endpoint.
6. Generate separate random values (at least 32 bytes) for `TOKEN_SECRET`, `RATE_LIMIT_SECRET` and `CRON_SECRET`. Example local generation: `openssl rand -hex 32`. Store them directly in provider secret stores. Keep the unsubscribe-token key stable; rotation invalidates outstanding custom unsubscribe links.
7. Configure separate Turnstile widgets/keys for preview and production. Allow the exact deployment hostnames. Server verification checks hostname and action, not just the success flag.
8. Vercel reads `vercel.json`: `/api/jobs` every minute; `/api/maintenance` daily. Both require the configured cron bearer secret. If self-hosting, configure equivalent authenticated schedules and a trusted reverse proxy that supplies an unspoofable client IP; update the IP extraction before opening signup on a non-Vercel host.
9. Keep `EMAIL_ENABLED=false` and `SIGNUPS_ENABLED=false` until the isolated preview has passed. For preview delivery tests enable email with exact owner-controlled `TEST_RECIPIENTS`; real subscriber addresses and production database credentials are prohibited. Broadcasts remain blocked in previews.
10. Perform controlled Gmail and Outlook deliveries. Record receipt headers showing SPF, DKIM and DMARC results, confirmation click, provider webhook, unsubscribe and suppression. Do not upload complete subscriber headers or email addresses to this public repository.
11. Run CI and the deployed acceptance checklist below, verify a cloud restore, then enable the production flags and run `npm run check:release` with the intended production environment. Finish domain cutover only after the deployment is healthy. Until then, the site honestly displays signup as unavailable.

**Release A can ship independently:** the empty offers state is intentional. Do not wait for affiliate agreements to start validated email capture. Editor-approved newsletter campaigns can begin after the end-to-end delivery check.

## Release B: editorial and affiliate operations

The implementation includes `/projects`, `/projects/[slug]`, `/tools`, `/tools/[slug]`, `/partners`, `/admin`, confirmation/unsubscribe pages, tracked redirects and reporting. Review the four imported discoveries, then expand the archive using verified permalinks and project CSVs. Record actual partner agreements outside the public repository before marking an offer eligible to publish. The offered destination must match the approved hostname exactly.

The dashboard retains drafts until an explicit publication action. Campaign body/subject become locked when prepared in Resend. Saving, importing, editing or previewing never sends a campaign. No outside-affiliate recruitment or payout system is included.

## Deployed acceptance evidence required before cutover

- A clean Git checkout passes install, lint, types, SQL/API tests, build and browser tests. Remote Actions evidence is separate from local results.
- Preview cannot query production data or send to addresses outside its controlled allowlist. Check both environment scopes, not just this repository's defaults.
- Valid signup is persisted with consent and its outbox job before returning 202. Invalid, duplicate, concurrent, rate-limited and bot submissions behave correctly.
- Provider/database failure, retries, expiry, provider-webhook signature and replay, unsubscribe and bounce/complaint suppression are verified against actual staging services.
- Confirmed contacts reach the correct Resend segment; native provider unsubscribe is reflected locally. An unsubscribed contact is never automatically resubscribed by retrying a job.
- Non-admin sessions cannot read subscribers, exports, campaign records or commissions; authorized editors can use all workflows. Supabase RLS/privilege tests run with real preview credentials as well as local SQL tests.
- Actual destination redirects preserve partner URLs, strip no required tracking parameters, and never include subscriber identity. Click analytics and commissions are visible to administrators only.
- Mobile/keyboard behavior, canonical `.com`, GSC verification, OG image, robots and sitemap are checked on the deployment. Ensure production `robots.txt` allows indexing; previews stay blocked.
- A provider-level recovery drill succeeds with email disabled. Recheck suppression against current provider state before resuming sends.

**Verified on the isolated preview:** Vercel deployment, Supabase hosted migrations in Stockholm, live database health, public/private database permissions, and all ten desktop/mobile browser checks. See [handoff status](handoff-status.md) for the dated evidence.

**Still required before production:** production billing/account setup, owner admin provisioning, GitHub-to-Vercel application access, live Resend delivery, Gmail/Outlook receipt, mailbox aliases, a cloud restore drill, complete DNS export, nameserver changes and production cutover. The current preview is on Hobby with email and signup disabled. Its disposable deployment export omits cron schedules; the repository's production `vercel.json` retains them and requires Pro. Do not enable email on that cron-free preview.
