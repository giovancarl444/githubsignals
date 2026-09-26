import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { rpc } from '@/lib/db';
import { audit } from '@/lib/admin';
import { apiError, checkOrigin } from '@/lib/http';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    const user = await requireAdmin();
    const id = z
      .string()
      .uuid()
      .parse((await params).id);
    await rpc('stop_subscription', { p_id: id, p_reason: 'unsubscribe' });
    await audit(user.id, 'subscribers.unsubscribe', id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
