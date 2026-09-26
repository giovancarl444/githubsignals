import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { audit } from '@/lib/admin';
import { prepareCampaign, sendCampaign, reconcileCampaign } from '@/lib/campaigns';
import { apiError, checkOrigin, HttpError, readJson } from '@/lib/http';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    const user = await requireAdmin();
    const id = z
      .string()
      .uuid()
      .parse((await params).id);
    const input = z
      .object({
        action: z.enum(['prepare', 'send', 'schedule', 'cancel', 'reconcile']),
        scheduled_at: z.string().datetime({ offset: true }).optional(),
        provider_id: z.string().uuid().optional(),
      })
      .parse(await readJson(request));
    try {
      if (input.action === 'prepare') await prepareCampaign(id);
      if (input.action === 'send') await sendCampaign(id);
      if (input.action === 'reconcile') await reconcileCampaign(id, input.provider_id);
      if (input.action === 'schedule' || input.action === 'cancel') {
        if (
          input.action === 'schedule' &&
          (!input.scheduled_at || new Date(input.scheduled_at).getTime() < Date.now() + 60000)
        )
          throw new Error('Choose a time at least one minute in the future');
        const { data, error } = await db()
          .from('campaigns')
          .update({
            status: input.action === 'schedule' ? 'scheduled' : 'ready',
            scheduled_at: input.action === 'schedule' ? input.scheduled_at : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('status', input.action === 'schedule' ? 'ready' : 'scheduled')
          .select('id')
          .maybeSingle();
        if (error || !data) throw new Error('Campaign state changed. Refresh and try again.');
      }
    } catch (e) {
      throw new HttpError(409, e instanceof Error ? e.message : 'Campaign operation failed');
    }
    await audit(user.id, `campaign.${input.action}`, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
