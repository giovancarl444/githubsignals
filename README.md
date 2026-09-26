# GitHub Signals

Independent source for [githubsignals.com](https://githubsignals.com), built with Next.js 16, React, TypeScript, Tailwind/shadcn, Supabase and Resend. No Lovable runtime or publishing access is required to run this application.

**Current state:** [open the independent preview](https://githubsignals-preview-giovancarl444.vercel.app). It runs in the owner's Vercel account with an isolated Supabase database in Stockholm. The implementation and selected Instagram archive are in this repository; [GitHub Actions passed](https://github.com/giovancarl444/githubsignals/actions/runs/36203875512). Production accounts, mail authentication, live delivery, a cloud restore drill and DNS cutover remain deployment prerequisites. The live domain continues serving the previous Lovable deployment until that cutover. See the [dated handoff status](docs/handoff-status.md) for verified evidence and remaining account setup.

## Start locally

Use Node **24** and npm **11**. Keep this checkout outside iCloud-synced Documents/Desktop so dependencies remain available.

```sh
git clone https://github.com/giovancarl444/githubsignals.git
cd githubsignals
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Set `APP_URL` to the exact origin you use (including port). A browser cannot open this server application by loading an `index.html` file.

Without provider credentials, the site shows four verified discoveries and their original Instagram links. Newsletter and enquiry submission remain disabled. Admin setup is explained at `/admin`. No email capture or authentication success is simulated.

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

To use an already installed Chrome locally and save storage: `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`. Browser tests run against a production build on port 3001. `npm run check:release` checks configured deployment prerequisites without printing secrets.

## Connect the services

Follow [deployment](docs/deployment.md), [domain and mail cutover](docs/domain-and-mail.md), and [recovery](docs/recovery.md). Use separate Supabase projects and Resend credentials/segments for production and previews. Only controlled preview recipients can receive email; broadcasts are production-only.

```sh
npm run db:migrate
npm run build
npm run start
```

Migrations use a direct or session-pooler database URL, verify TLS, check the project reference and retain migration checksums. Never modify an applied migration; add a new one. `DATABASE_URL` and backup keys are operator secrets, not application/browser credentials.

Create an admin through Supabase Auth with public signup disabled, then add that Auth user's ID to `public.admin_users`. The authenticated `/admin` dashboard supports project/offer editing, draft previews, CSV imports, subscriber exports and unsubscribe, enquiry management, campaign preparation/scheduling/sending, job retries and revenue reporting. The schema denies public access to subscriber and financial data.

## Editorial and commercial workflows

- `/projects`: searchable discoveries, article pages and direct repository links.
- Home feed: selected genuine Instagram permalinks, maintained by editors; social publishing is independent. [Content provenance](docs/content-provenance.md).
- `/tools`: only approved offers with a real agreement and an exact allowed destination hostname. There are no seeded affiliate deals.
- `/partners`: protected, durable sponsorship enquiries; enquiries never subscribe someone to marketing.
- Newsletter: weekly, editor-approved. Saving or preparing never sends. Sending/scheduling is an explicit admin action.
- Commissions: validated CSV in integer minor currency units, deduplicated by program + transaction ID. Pending, approved, reversed and paid are separate; currencies are never combined.

See [operating guide](docs/operations.md) and example CSV headers in `docs/examples/`.

## Migration record

The recovered Lovable source is preserved in Git tag **`lovable-snapshot-2be9264`**, with inspected source SHA `2be926445a491ccc67ff587d782316cc87ec0716`. [migration-source.json](migration-source.json) records recovered files and limitations. The nine connector-visible edit records and available patches are in `migration/lovable-history.json`. The connector provided file contents, not the original Git object history or binary `bun.lockb`. The original favicon was retrieved from the live site, not verified against the source blob. Two logo attachments mentioned in Lovable chat were not in the project file tree. Keep the original Lovable project until independent recovery is proven.

The `.io` domain is unrelated and is excluded from this application and migration.
