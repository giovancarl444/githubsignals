import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rpc } from '@/lib/db';
import { tokenHash } from '@/lib/tokens';
import { apiError, checkOrigin, HttpError, readJson, rateLimit } from '@/lib/http';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { token } = z
      .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
      .parse(await readJson(request));
    await rateLimit(request, 'confirm', 30);
    if (!(await rpc<boolean>('confirm_subscription', { p_hash: tokenHash(token) })))
      throw new HttpError(
        400,
        'This link has expired or has already been used. You can request another confirmation from the homepage.',
      );
    return NextResponse.json({
      message: 'Your subscription is confirmed. Welcome to GitHub Signals.',
    });
  } catch (e) {
    return apiError(e);
  }
}
