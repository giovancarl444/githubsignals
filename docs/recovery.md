# Backup, rollback and recovery

## Two different backups

1. **Supabase platform backups:** enable and verify the actual plan's backup retention. Consider PITR according to recovery objectives and pricing. These are needed for the full hosted database/auth setup. Platform settings, secrets, DNS and provider accounts also need an owner-controlled inventory.
2. **Portable application snapshots:** `npm run db:backup` exports a transactionally consistent application-data snapshot, gzip-compressed and authenticated/encrypted with AES-256-GCM. It includes subscribers, consent wording/events, suppressed status, outbox, content, commissions and campaign mappings. `backups/` is ignored by Git. Files are private mode 0600. Store `BACKUP_ENCRYPTION_KEY` separately in the owner's secret manager and copy snapshots into owner-controlled encrypted storage.

Application snapshots **exclude** Supabase Auth users, `admin_users`, credentials, provider contacts/broadcast state, files in Supabase Storage (none are used here), DNS and runtime heartbeat. They are not a substitute for platform backups. Establish a daily backup schedule and a retention policy before launch (initial operating target: 30 daily application backups; confirm provider retention separately). The repository does not claim a cloud backup schedule is active until it is configured in the owner's infrastructure.

## Restore drill

The local tests exercise both a PostgreSQL/PGlite snapshot restoration and the encrypted operator snapshot serialization/import, including consent, suppressed status, queue records, identity sequences and refusal to overwrite operational data. This is local engineering evidence; it does **not** prove a hosted Supabase restore.

For the required cloud drill:

1. Create a dedicated non-production EU recovery project. Set `APP_ENV=preview`, the recovery project reference, the actual production reference, and both `EMAIL_ENABLED=false` and `SIGNUPS_ENABLED=false`. Do not attach the live domain. Use fresh preview Resend credentials later if controlled delivery needs testing.
2. Check out the exact backup migration version and apply the migrations. The restore script rejects different migration checksums, production targets and targets containing operational data.
3. Restore using `npm run db:restore -- /private/path/snapshot.ghs`. The transaction inserts with database types and constraints, preserves IDs, and resets identity sequences. Any failure rolls back the entire restore.
4. Recreate one invited admin and its membership separately. Compare record counts and representative checksums/statuses privately. Verify a suppressed reader remains suppressed, old confirmation links remain expired, jobs retain state and commission status is unchanged.
5. Run application tests against recovery credentials and controlled recipients only. Record the duration, backup age, failures and the operator/date in the private recovery log. Run a Supabase platform restore test separately to prove the full-service path.
6. Keep recovery isolated or delete that explicitly disposable project after acceptance. Never promote an old snapshot over live subscriber data without reconciling **all** confirmations and opt-outs since backup time. Check Resend's current suppressions/unsubscribes first; those are newer than some backups.

## Deployment rollback

Retain the previous successful Vercel build. Roll the application back while keeping the current database and queue intact. Prefer additive, backwards-compatible migrations. A data/schema rollback needs its own evidence and recovery plan. Turning `EMAIL_ENABLED=false` immediately stops new worker sends and broadcasts; turning `SIGNUPS_ENABLED=false` stops accepting new signup requests. Already accepted jobs remain durable.

## Outages and ambiguous provider responses

- Database unavailable: signup returns an error, never simulated success. The reader can retry later.
- Email provider unavailable: committed outbox jobs retry with exponential delay and a stable provider idempotency key. Retries of confirmation sends stop before the provider's 24-hour idempotency window expires; request a new confirmation after resolving the incident. Daily retention closes expired confirmation work without sending it.
- Lost worker: its five-minute lease expires; another worker can claim the job. A stale lease cannot finish the replacement worker's job.
- Contact sync: retry dead sync jobs from the admin queue after resolving provider setup. Workers never set an existing provider contact back to subscribed. Fresh reconsent from someone already unsubscribed requires an operator-reviewed provider resubscribe workflow; it is intentionally not automated.
- Uncertain campaign send/create: the campaign becomes `review_required`. A timeout can leave `sending` or `preparing`; health detects staleness. Inspect the existing Resend broadcast and reconcile the provider ID in the dashboard. Do not create a second broadcast or retry send blindly. Check the provider status when it is still queued/sending before reconciling again.

Monitor `/api/health` and Vercel error logs, alerting the owner on failures. With mail enabled, health also rejects stale worker heartbeats, dead/old email work and campaigns needing reconciliation. A cloud monitor is an account-setup prerequisite; no owner notification service is silently assumed to exist.
