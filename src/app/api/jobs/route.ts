import { NextResponse } from 'next/server';
import { required, isProduction } from '@/lib/config';
import { safeSecretEquals } from '@/lib/tokens';
import { runEmailJobs } from '@/lib/mail';
import { sendCampaign } from '@/lib/campaigns';
import { db } from '@/lib/db';
import { apiError, HttpError } from '@/lib/http';
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    if (
      !safeSecretEquals(
        request.headers.get('authorization') || '',
        `Bearer ${required('CRON_SECRET')}`,
      )
    )
      throw new HttpError(401, 'Unauthorized');
    const result = await runEmailJobs();
    if (process.env.EMAIL_ENABLED === 'true') {
      const heartbeat = await db()
        .from('system_status')
        .upsert({ key: 'email_worker', updated_at: new Date().toISOString() });
      if (heartbeat.error) throw new Error('Worker heartbeat could not be saved');
    }
    if (isProduction() && process.env.EMAIL_ENABLED === 'true') {
      const due = await db()
        .from('campaigns')
        .select('id')
        .eq('status', 'scheduled')
        .lte('scheduled_at', new Date().toISOString())
        .limit(1);
      if (due.error) throw new Error('Campaign scheduler unavailable');
      for (const c of due.data || []) await sendCampaign(c.id, true);
    }
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return apiError(e);
  }
}
