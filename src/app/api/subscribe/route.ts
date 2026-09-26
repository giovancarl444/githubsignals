import { NextResponse } from 'next/server';
import { signupsEnabled, CONSENT_VERSION } from '@/lib/config';
import { subscribeSchema } from '@/lib/validation';
import { confirmationToken } from '@/lib/tokens';
import { rpc } from '@/lib/db';
import { apiError, checkOrigin, HttpError, rateLimit, readJson, verifyBot } from '@/lib/http';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!signupsEnabled())
      throw new HttpError(
        503,
        'Newsletter signup is temporarily unavailable. Please check back shortly.',
      );
    const input = subscribeSchema.parse(await readJson(request));
    if (input.website) throw new HttpError(400, 'Please check your submission.');
    await rateLimit(request, 'subscribe', 10);
    await verifyBot(input.turnstileToken, 'subscribe');
    const { token, hash } = confirmationToken();
    await rpc('request_subscription', {
      p_email: input.email,
      p_hash: hash,
      p_token: token,
      p_source: input.source,
      p_consent: CONSENT_VERSION,
    });
    return NextResponse.json(
      {
        message:
          'If this address is eligible, a confirmation email is on its way. Please check your inbox.',
      },
      { status: 202 },
    );
  } catch (e) {
    return apiError(e);
  }
}
