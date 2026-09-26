import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authClient, requireAdmin } from '@/lib/auth';
import { apiError, checkOrigin, HttpError, rateLimit, readJson } from '@/lib/http';

const activation = z.object({
  token_hash: z
    .string()
    .min(16)
    .max(512)
    .regex(/^[a-zA-Z0-9_-]+$/),
  type: z.enum(['invite', 'recovery']),
  password: z.string().min(12, 'Use at least 12 characters.').max(128),
});

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await rateLimit(request, 'admin-activate', 10);
    const { token_hash, type, password } = activation.parse(await readJson(request, 4000));
    const client = await authClient();
    const { error } = await client.auth.verifyOtp({ token_hash, type });
    if (error)
      throw new HttpError(
        401,
        'This link has expired or was already used. Ask the site owner for a new one.',
      );
    try {
      // A valid Auth invitation is not administrative authorization.
      await requireAdmin();
      const result = await client.auth.updateUser({ password });
      if (result.error)
        throw new HttpError(
          400,
          'The password could not be saved. Ask the site owner for a fresh link and choose a different password.',
        );
      const signedOut = await client.auth.signOut({ scope: 'global' });
      if (signedOut.error)
        throw new HttpError(
          503,
          'Your password was saved, but sign-out did not finish. Sign in with the new password and contact the site owner.',
        );
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
      await client.auth.signOut({ scope: 'local' }).catch(() => {});
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
