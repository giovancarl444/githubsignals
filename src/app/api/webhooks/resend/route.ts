import { NextResponse } from 'next/server';
import { resend } from '@/lib/mail';
import { required } from '@/lib/config';
import { rpc } from '@/lib/db';
import { apiError, HttpError } from '@/lib/http';
export async function POST(request: Request) {
  try {
    const payload = await request.text();
    if (Buffer.byteLength(payload) > 100000) throw new HttpError(413, 'Payload too large');
    const id = request.headers.get('svix-id') || '';
    let event;
    try {
      event = resend().webhooks.verify({
        payload,
        headers: {
          id,
          timestamp: request.headers.get('svix-timestamp') || '',
          signature: request.headers.get('svix-signature') || '',
        },
        webhookSecret: required('RESEND_WEBHOOK_SECRET'),
      });
    } catch {
      throw new HttpError(401, 'Invalid webhook signature');
    }
    const data = event.data;
    const emails = 'to' in data ? data.to : 'email' in data ? [data.email] : [];
    await rpc('process_email_event', {
      p_event_id: id,
      p_type: event.type,
      p_emails: emails.map((e) => e.trim().toLowerCase()),
      p_contact_id: event.type.startsWith('contact.') && 'id' in data ? data.id : null,
      p_unsubscribed: 'unsubscribed' in data ? data.unsubscribed : false,
    });
    return NextResponse.json({ received: true });
  } catch (e) {
    return apiError(e);
  }
}
