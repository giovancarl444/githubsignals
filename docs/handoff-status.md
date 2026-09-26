# Ownership handoff status — 26 September 2026

## Working now

- **Independent preview:** https://githubsignals-preview-giovancarl444.vercel.app. This stable alias is updated after each verified preview deployment; the Vercel project records its current deployment.
- **Source of truth:** https://github.com/giovancarl444/githubsignals, branch `main`. Invited-editor password setup and recovery are implemented; the recovered prototype is at tag `lovable-snapshot-2be9264`. Available edit metadata and patches are preserved in `migration/lovable-history.json`.
- **Hosting:** owner account `giovancarl444`, existing Vercel team `midas` (`giovancarl444s-projects`), project `githubsignals`. The team currently uses Hobby. Production Pro billing has not been activated.
- **Preview database:** Supabase `githubsignals-preview`, EU Stockholm, connected only to Vercel preview/development. All five migrations applied through a TLS-verified session connection. All fifteen public application tables have RLS enabled.
- **Content:** four verified GitHub discoveries with genuine Instagram permalinks. This is an editor-maintained selection, not an import of the entire Instagram account. There are no invented affiliate agreements or commission records.
- **Application:** public discovery pages, tool/offer pages, enquiry workflow, authenticated editorial dashboard, newsletter outbox/confirmation/suppression flows, campaign controls and commission imports are implemented. Provider-dependent mail flows remain switched off until integration acceptance.
- **Publication design:** the homepage leads with a real featured discovery. Searchable project cards, contextual project pages with direct sources, mobile navigation, an About page, an independent open-source toolbox and a fuller partnership page replace the prototype presentation. Lightweight local artwork adds no external asset or media-hosting dependency.
- **Preview owner access:** an invited Auth account and admin membership have been created using the primary email on the connected Vercel account. The owner must choose their password through the private local setup file. The one-time link and account address are excluded from Git and deployment uploads. No invitation email was sent; production admin provisioning remains separate.

## Verification completed

- Local lint, TypeScript and production build passed. Local tests: 63 passed and three PostgreSQL concurrency tests skipped because those run against the CI database.
- [GitHub Actions run 36206103198](https://github.com/giovancarl444/githubsignals/actions/runs/36206103198) passed for the invited-editor release, including the PostgreSQL test service, production build and browser checks. Check [latest runs](https://github.com/giovancarl444/githubsignals/actions) for the current commit's separate CI evidence.
- All sixteen desktop/mobile browser tests passed locally for the publication redesign, including searchable discoveries, source links, mobile menu behaviour and current-page navigation. The previous twelve also passed against the hosted, database-connected preview: navigation, keyboard access, accessibility, mobile overflow, preview indexing controls, unavailable signup, protected exports, safe redirect rejection and invitation-link handling without consuming a token on GET.
- Hosted `/api/health` returns 200. Unauthenticated `/admin` and its child routes redirect to sign-in. Public Supabase credentials cannot select subscribers or call financial/dashboard reporting functions. Service credentials can query the expected metrics.
- A temporary hosted Auth account was rejected before admin membership, then successfully opened the dashboard and all eight admin collections after membership was granted. A draft was saved and loaded in the editor while its public URL remained 404; authorized export returned CSV. Removing membership blocked the same active session's export with 403. The temporary account and draft were removed afterward; no email was sent.
- The public preview requires no Vercel login; application admin authentication remains required.
- Hosted invitation and recovery links were generated for a temporary `.invalid` account without requesting email delivery. Both allowed password setup and subsequent dashboard sign-in; both rejected replay with 401. The temporary account was deleted after verification. See [admin access](admin-access.md) for the required provider email templates.

These checks do not prove actual email delivery or a provider-level restore. No real subscriber has been contacted.

## Required before the `.com` cutover

1. Complete production billing in the owner's accounts. Prefer a dedicated Vercel Pro team if upgrading the existing team would affect other projects. The attempted Supabase Pro provisioning required an interactive owner setup and did not create a production resource.
2. Grant the Vercel GitHub application access to this repository. Current deployments were uploaded from the checked-out source; automatic Git deployments are not connected yet.
3. Provision Supabase Pro production in the EU. Replace the preview isolation sentinel `unprovisioned-production` with the actual production reference in every environment. Apply migrations separately. Never copy production data or credentials into preview scopes.
4. Disable public signup in Supabase Auth and configure owner recovery. Supabase's default Auth signup setting is still enabled in the preview; the application separately requires explicit admin membership. The preview owner invitation is prepared, but the owner still needs to set their password. Create a separate invited owner account plus `admin_users` membership in production, and configure the Auth email templates/SMTP.
5. Configure Resend sender authentication, isolated test recipients, webhook signatures and newsletter segment; configure Turnstile. Supply the business identity, postal address and contact/reply-to addresses. Verify controlled Gmail and Outlook delivery, confirmation, unsubscribe and suppression before enabling signup.
6. Provision and verify the receiving Google Workspace mailbox and aliases. Record the complete current DNS zone, renewal/payment details and recovery contacts before moving DNS to Cloudflare.
7. Configure cron jobs, cloud monitoring and backups on the production plans. Complete the hosted recovery drill and record the result. Application rollback must retain the current subscriber database.
8. Run release acceptance, then change website DNS and canonical `www` redirect while preserving mail/verification records. Keep the original Lovable project and deployment until independent recovery is proven.

`githubsignals.com` currently remains on Lovable. Registration remains with the existing Lovable/Name.com arrangement. The unrelated `.io` site is excluded. `EMAIL_ENABLED=false` and `SIGNUPS_ENABLED=false` on the preview are deliberate launch gates, not successful email capture.

The additional isolated recovery database could not be provisioned: Vercel/Supabase returned `Billing plan is disabled: free (400)`. This does not prove the hosted restore path, and the provider-level restore gate remains open until account/billing setup permits a dedicated recovery project.

## Preview deployment and local storage

The preview was deployed from a disposable `git archive` export of the implementation commit. Only that export's `vercel.json` had its cron array emptied because Hobby rejects minutely cron jobs. The source repository retains the production schedules. Never promote this cron-free preview to production or enable email on it. Follow the production deployment runbook using the repository configuration after Pro setup.

The active checkout is `/Users/elliot/Developer/githubsignals`, outside iCloud-synced Documents. The old Documents location is only a shortcut to the hosted preview and pointer to the active checkout. Approximately 3 GB of duplicate dependency/build data and disposable caches were removed after the source was pushed. Personal files were not removed. Keep secrets, snapshots and local reports out of Git; `.vercelignore` also excludes them from deployment uploads. The private owner setup file is `.local/owner-access.html`; remove it after successful activation.
