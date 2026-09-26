import { NextResponse } from 'next/server';
import { required } from '@/lib/config';
import { safeSecretEquals } from '@/lib/tokens';
import { rpc } from '@/lib/db';
import { apiError, HttpError } from '@/lib/http';
export async function GET(request: Request) {
  try {
    if (
      !safeSecretEquals(
        request.headers.get('authorization') || '',
        `Bearer ${required('CRON_SECRET')}`,
      )
    )
      throw new HttpError(401, 'Unauthorized');
    await rpc('prune_private_data');
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return apiError(e);
  }
}
