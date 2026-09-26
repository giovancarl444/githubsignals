import { NextResponse } from 'next/server';
import { authClient } from '@/lib/auth';
import { apiError, checkOrigin } from '@/lib/http';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await (await authClient()).auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
