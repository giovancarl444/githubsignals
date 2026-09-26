import { NextResponse } from 'next/server';
import { verifyUnsubscribe } from '@/lib/tokens';
import { rpc } from '@/lib/db';
import { apiError, HttpError, readJson } from '@/lib/http';
export async function POST(request: Request) {
  try {
    // Signed links also support mail clients' one-click POST. GET never changes subscription state.
    const token =
      new URL(request.url).searchParams.get('token') ||
      String((await readJson(request)).token || '');
    const id = verifyUnsubscribe(token);
    if (!id) throw new HttpError(400, 'This unsubscribe link is invalid.');
    await rpc('stop_subscription', { p_id: id, p_reason: 'unsubscribe' });
    return NextResponse.json({ message: 'You have been unsubscribed.' });
  } catch (e) {
    return apiError(e);
  }
}
