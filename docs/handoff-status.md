# Ownership handoff status — 26 September 2026

## Working now

- **Independent preview:** https://githubsignals-preview-giovancarl444.vercel.app. The stable alias points to the database-connected deployment `githubsignals-fuglhlzf4-giovancarl444s-projects.vercel.app`.
- **Source of truth:** https://github.com/giovancarl444/githubsignals, branch `main`. Implementation commit `730d1407317c2975a1efd08ab498347c2991eff6`; recovered prototype at tag `lovable-snapshot-2be9264`. Available edit metadata and patches are preserved in `migration/lovable-history.json`.
- **Hosting:** owner account `giovancarl444`, existing Vercel team `midas` (`giovancarl444s-projects`), project `githubsignals`. The team currently uses Hobby. Production Pro billing has not been activated.
- **Preview database:** Supabase `githubsignals-preview`, EU Stockholm, connected only to Vercel preview/development. All five migrations applied through a TLS-verified session connection. All fifteen public application tables have RLS enabled.
- **Content:** four verified GitHub discoveries with genuine Instagram permalinks. This is an editor-maintained selection, not an import of the entire Instagram account. There are no invented affiliate agreements or commission records.
- **Application:** public discovery pages, tool/offer pages, enquiry workflow, authenticated editorial dashboard, newsletter outbox/confirmation/suppression flows, campaign controls and commission imports are implemented. Provider-dependent mail flows remain switched off until integration acceptance.

## Verification completed

- Local lint, TypeScript and production build passed. Local tests: 53 passed and three PostgreSQL concurrency tests skipped because those run against the CI database.
- [GitHub Actions run 36203875512](https://github.com/giovancarl444/githubsignals/actions/runs/36203875512): all 56 unit/API/database tests passed, production build passed, and all ten desktop/mobile browser tests passed.
- The same ten browser tests passed against the hosted, database-connected preview: navigation, keyboard access, accessibility, mobile overflow, preview indexing controls, unavailable signup, protected exports and safe redirect rejection.
- Hosted `/api/health` returns 200. Unauthenticated `/admin` and its child routes redirect to sign-in. Public Supabase credentials cannot select subscribers or call financial/dashboard reporting functions. Service credentials can query the expected metrics.
- A temporary hosted Auth account was rejected before admin membership, then successfully opened the dashboard and all eight admin collections after membership was granted. A draft was saved and loaded in the editor while its public URL remained 404; authorized export returned CSV. Removing membership blocked the same active session's export with 403. The temporary account and draft were removed afterward; no email was sent.
- The public preview requires no Vercel login; application admin authentication remains required.

These checks do not prove actual email delivery or a provider-level restore. No real subscriber has been contacted.

## Required before the `.com` cutover

1. Complete production billing in the owner's accounts. Prefer a dedicated Vercel Pro team if upgrading the existing team would affect other projects. The attempted Supabase Pro provisioning required an interactive owner setup and did not create a production resource.
2. Grant the Vercel GitHub application access to this repository. Current deployments were uploaded from the checked-out source; automatic Git deployments are not connected yet.
3. Provision Supabase Pro production in the EU. Replace the preview isolation sentinel `unprovisioned-production` with the actual production reference in every environment. Apply migrations separately. Never copy production data or credentials into preview scopes.
4. Disable public signup in Supabase Auth, configure owner recovery and create the invited owner account plus `admin_users` membership. Supabase's default Auth signup setting is still enabled in the preview; the application separately requires explicit admin membership. No permanent owner admin has been created.
5. Configure Resend sender authentication, isolated test recipients, webhook signatures and newsletter segment; configure Turnstile. Supply the business identity, postal address and contact/reply-to addresses. Verify controlled Gmail and Outlook delivery, confirmation, unsubscribe and suppression before enabling signup.
6. Provision and verify the receiving Google Workspace mailbox and aliases. Record the complete current DNS zone, renewal/payment details and recovery contacts before moving DNS to Cloudflare.
7. Configure cron jobs, cloud monitoring and backups on the production plans. Complete the hosted recovery drill and record the result. Application rollback must retain the current subscriber database.
8. Run release acceptance, then change website DNS and canonical `www` redirect while preserving mail/verification records. Keep the original Lovable project and deployment until independent recovery is proven.

`githubsignals.com` currently remains on Lovable. Registration remains with the existing Lovable/Name.com arrangement. The unrelated `.io` site is excluded. `EMAIL_ENABLED=false` and `SIGNUPS_ENABLED=false` on the preview are deliberate launch gates, not successful email capture.

## Preview deployment and local storage

The preview was deployed from a disposable `git archive` export of the implementation commit. Only that export's `vercel.json` had its cron array emptied because Hobby rejects minutely cron jobs. The source repository retains the production schedules. Never promote this cron-free preview to production or enable email on it. Follow the production deployment runbook using the repository configuration after Pro setup.

The active checkout is `/Users/elliot/Developer/githubsignals`, outside iCloud-synced Documents. The old Documents location is only a browser shortcut and pointer to the active checkout. Approximately 2.5 GB of duplicate dependency/build data and disposable caches were removed after the source was pushed. Personal files were not removed. Keep secrets, snapshots and local reports out of Git; `.vercelignore` also excludes them from deployment uploads.
