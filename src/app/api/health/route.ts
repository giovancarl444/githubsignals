import { NextResponse } from 'next/server';
import { db, rpc } from '@/lib/db';
export async function GET() {
  try {
    const result = await db().from('projects').select('id', { head: true }).limit(1);
    if (result.error) throw new Error('Unavailable');
    if (process.env.EMAIL_ENABLED === 'true' && !(await rpc<boolean>('operational_health')))
      throw new Error('Operations degraded');
    return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  }
}
