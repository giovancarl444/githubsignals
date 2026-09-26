import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authClient, requireAdmin } from '@/lib/auth';
import { email } from '@/lib/validation';
import { apiError, checkOrigin, HttpError, rateLimit, readJson } from '@/lib/http';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await rateLimit(request, 'admin-login', 10);
    const input = z
      .object({ email, password: z.string().min(8).max(200) })
      .parse(await readJson(request));
    const client = await authClient();
    const { error } = await client.auth.signInWithPassword(input);
    if (error) throw new HttpError(401, 'Sign-in failed. Check your credentials.');
    try {
      await requireAdmin();
    } catch {
      await client.auth.signOut();
      throw new HttpError(403, 'Administrator access required.');
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
