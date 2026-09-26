import 'server-only';
import { Resend } from 'resend';
import { db, rpc } from './db';
import { appUrl, required, isProduction } from './config';
import { canEmail, emailHtml, escapeHtml, newsletterBody } from './email-policy';
import { tokenHash } from './tokens';
export function resend() {
  return new Resend(required('RESEND_API_KEY'));
}
type Job = {
  id: string;
  kind: 'confirmation' | 'contact_sync';
  subscriber_id: string;
  payload: { token?: string };
  attempts: number;
  created_at: string;
  lease_token: string;
};
type Subscriber = {
  id: string;
  email: string;
  status: string;
  confirmation_hash: string | null;
  confirmation_expires_at: string | null;
  provider_contact_id: string | null;
  confirmed_at: string | null;
  updated_at: string;
};
export async function syncContact(s: Subscriber) {
  if (!canEmail(s.email)) throw new Error('Email is disabled for this recipient');
  const client = resend();
  // Never clear a provider unsubscribe merely because an old sync job is replayed.
  const existing = await client.contacts.get(s.provider_contact_id || s.email);
  if (existing.error && existing.error.name !== 'not_found')
    throw new Error('Contact lookup failed');
  if (existing.data?.unsubscribed && s.status === 'subscribed') {
    await rpc('stop_subscription', { p_id: s.id, p_reason: 'unsubscribe' });
    return existing.data.id;
  }
  // Existing contacts are never set to unsubscribed:false by a worker. This
  // prevents an in-flight stale sync from undoing a newer provider opt-out.
  const result = existing.data
    ? s.status === 'subscribed'
      ? { data: { id: existing.data.id }, error: null }
      : await client.contacts.update({ id: existing.data.id, unsubscribed: true })
    : await client.contacts.create({ email: s.email, unsubscribed: s.status !== 'subscribed' });
  if (result.error || !result.data) throw new Error('Contact synchronization failed');
  const id = result.data.id;
  if (s.status === 'subscribed') {
    const segment = await client.contacts.segments.add({
      contactId: id,
      segmentId: required('RESEND_NEWSLETTER_SEGMENT_ID'),
    });
    if (segment.error) throw new Error('Newsletter segment synchronization failed');
  }
  const saved = await db().from('subscribers').update({ provider_contact_id: id }).eq('id', s.id);
  if (saved.error) throw new Error('Contact mapping could not be saved');
  // A stop/confirmation may have raced this network call. Requeue the latest state.
  const latest = await db().from('subscribers').select('status,updated_at').eq('id', s.id).single();
  if (latest.error) throw new Error('Contact state unavailable');
  if (latest.data.updated_at !== s.updated_at)
    throw new Error('Contact changed during synchronization');
  return id;
}
export async function runEmailJobs() {
  if (process.env.EMAIL_ENABLED !== 'true') return { processed: 0, failed: 0, disabled: true };
  const jobs = await rpc<Job[]>('claim_email_jobs', { p_limit: 10 });
  let processed = 0,
    failed = 0;
  for (const job of jobs) {
    try {
      const { data, error } = await db()
        .from('subscribers')
        .select('*')
        .eq('id', job.subscriber_id)
        .single();
      if (error || !data) throw new Error('Subscriber unavailable');
      const s = data as Subscriber;
      if (!canEmail(s.email)) throw new Error('Recipient is not permitted in this environment');
      let providerId: string | null = null;
      if (job.kind === 'confirmation') {
        const token = job.payload.token;
        const valid =
          token &&
          s.status === 'pending' &&
          s.confirmation_hash === tokenHash(token) &&
          new Date(s.confirmation_expires_at || 0).getTime() > Date.now();
        if (valid) {
          // Resend idempotency expires after 24h. Stop ambiguous retries before that window.
          if (Date.now() - new Date(job.created_at).getTime() > 23 * 3600000)
            throw new Error('Confirmation retry window expired; request a new confirmation');
          const link = `${appUrl()}/subscribe/confirm?token=${token}`;
          const response = await resend().emails.send(
            {
              from: required('RESEND_FROM'),
              to: s.email,
              replyTo: required('REPLY_TO_EMAIL'),
              subject: 'Confirm your GitHub Signals subscription',
              html: emailHtml(
                'One more click.',
                `<p>Confirm your address to get the weekly collection of useful open-source projects and clearly labelled partner recommendations.</p><p><a style="color:#ff9d5d" href="${link}">Confirm my subscription →</a></p><p>This link expires in 24 hours. If you didn’t request this, you can ignore this email.</p>`,
                escapeHtml(required('BUSINESS_NAME')),
              ),
              text: `Confirm your weekly GitHub Signals subscription: ${link}\nThe link expires in 24 hours. Ignore this email if you did not request it.`,
            },
            { idempotencyKey: `confirmation-${job.id}` },
          );
          if (response.error || !response.data)
            throw new Error(
              `Email provider rejected request: ${response.error?.name || 'unknown'}`,
            );
          providerId = response.data.id;
        }
      } else providerId = await syncContact(s);
      await rpc('finish_email_job', {
        p_id: job.id,
        p_lease: job.lease_token,
        p_status: 'done',
        p_provider_id: providerId,
      });
      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email processing failed';
      const dead =
        job.attempts >= 8 ||
        (job.kind === 'confirmation' &&
          Date.now() - new Date(job.created_at).getTime() > 23 * 3600000);
      await rpc('finish_email_job', {
        p_id: job.id,
        p_lease: job.lease_token,
        p_status: dead ? 'dead' : 'pending',
        p_error: message,
      });
      failed++;
      console.error('email_job_failed', { job: job.id, attempt: job.attempts, dead });
    }
  }
  return { processed, failed, disabled: false };
}
export function assertBroadcastAllowed() {
  if (!isProduction() || process.env.EMAIL_ENABLED !== 'true')
    throw new Error('Broadcasts are enabled only in production');
  required('BUSINESS_NAME');
  required('BUSINESS_POSTAL_ADDRESS');
  required('CONTACT_EMAIL');
}
export function campaignHtml(title: string, body: string) {
  // Text-only authoring prevents arbitrary HTML/scripts in previews and email.
  const content = newsletterBody(body);
  return emailHtml(
    title,
    content,
    `${escapeHtml(required('BUSINESS_NAME'))}<br>${escapeHtml(required('BUSINESS_POSTAL_ADDRESS'))}<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a> · <a href="https://githubsignals.com/privacy">Privacy</a>`,
  );
}
