import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { audit } from '@/lib/admin';
import { apiError, checkOrigin, HttpError } from '@/lib/http';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    const user = await requireAdmin();
    const id = z
      .string()
      .uuid()
      .parse((await params).id);
    // Only idempotent contact synchronization can be manually replayed after the retry window.
    const { data, error } = await db()
      .from('email_jobs')
      .update({
        status: 'pending',
        attempts: 0,
        available_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', id)
      .eq('kind', 'contact_sync')
      .eq('status', 'dead')
      .select('id')
      .maybeSingle();
    if (error || !data)
      throw new HttpError(
        409,
        'Only failed contact synchronization jobs can be retried here. Request a fresh confirmation for expired confirmation jobs.',
      );
    await audit(user.id, 'email_job.retry', id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
