import 'server-only';
import { db } from './db';
import { required } from './config';
import { assertBroadcastAllowed, campaignHtml, resend } from './mail';
export async function prepareCampaign(id: string) {
  assertBroadcastAllowed();
  const { data: c, error } = await db()
    .from('campaigns')
    .update({ status: 'preparing', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'draft')
    .select('*')
    .maybeSingle();
  if (error || !c) throw new Error('Only a saved draft can be prepared');
  try {
    const result = await resend().broadcasts.create({
      name: `${c.title} [${id}]`,
      segmentId: required('RESEND_NEWSLETTER_SEGMENT_ID'),
      from: required('RESEND_FROM'),
      replyTo: required('REPLY_TO_EMAIL'),
      subject: c.subject,
      html: campaignHtml(c.title, c.body),
      send: false,
    });
    if (result.error || !result.data) throw new Error('Provider draft creation failed');
    const saved = await db()
      .from('campaigns')
      .update({
        provider_broadcast_id: result.data.id,
        status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (saved.error) throw new Error('Provider draft mapping could not be saved');
  } catch {
    await db()
      .from('campaigns')
      .update({
        status: 'review_required',
        last_error:
          'Draft creation uncertain. Reconcile the campaign ID in Resend before retrying.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    throw new Error(
      'Provider draft needs reconciliation; no automatic retry will send a duplicate',
    );
  }
}
export async function sendCampaign(id: string, scheduledOnly = false) {
  assertBroadcastAllowed();
  // Never send while opt-outs or confirmations are waiting for provider synchronization.
  const queue = await db()
    .from('email_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('kind', 'contact_sync')
    .neq('status', 'done');
  if (queue.error || queue.count)
    throw new Error('Resolve subscriber synchronization jobs before sending');
  let claim = db()
    .from('campaigns')
    .update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', id);
  claim = scheduledOnly
    ? claim.eq('status', 'scheduled').lte('scheduled_at', new Date().toISOString())
    : claim.eq('status', 'ready');
  const { data: c, error } = await claim.select('*').maybeSingle();
  if (error || !c || !c.provider_broadcast_id) throw new Error('Campaign is not ready to send');
  try {
    const result = await resend().broadcasts.send(c.provider_broadcast_id);
    if (result.error) throw new Error('Provider send failed');
    const saved = await db()
      .from('campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (saved.error) throw new Error('Send receipt could not be saved');
  } catch {
    await db()
      .from('campaigns')
      .update({
        status: 'review_required',
        last_error:
          'Send outcome uncertain. Inspect the existing provider broadcast before any further action.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    throw new Error('Send outcome needs reconciliation');
  }
}
export async function reconcileCampaign(id: string, providerId?: string) {
  assertBroadcastAllowed();
  const { data: c, error } = await db().from('campaigns').select('*').eq('id', id).single();
  if (error || !c) throw new Error('Campaign not found');
  if (!['preparing', 'sending', 'review_required'].includes(c.status))
    throw new Error('Only uncertain campaigns can be reconciled');
  if (c.status !== 'review_required' && Date.now() - new Date(c.updated_at).getTime() < 10 * 60_000)
    throw new Error('The operation may still be running. Wait ten minutes before reconciling.');
  const provider = providerId || c.provider_broadcast_id;
  if (!provider) throw new Error('Provide the existing Resend broadcast ID');
  const result = await resend().broadcasts.get(provider);
  if (result.error || !result.data || !result.data.name?.includes(`[${id}]`))
    throw new Error('Broadcast does not match this campaign');
  const status =
    result.data.status === 'sent'
      ? 'sent'
      : result.data.status === 'draft'
        ? 'ready'
        : 'review_required';
  const saved = await db()
    .from('campaigns')
    .update({
      provider_broadcast_id: provider,
      status,
      last_error: null,
      sent_at: result.data.sent_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', c.status);
  if (saved.error) throw new Error('Reconciliation failed');
}
