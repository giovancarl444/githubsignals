import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { rpc } from '@/lib/db';
import { commissionRows, projectRows } from '@/lib/csv';
import { apiError, checkOrigin, HttpError } from '@/lib/http';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireAdmin();
    const kind = new URL(request.url).searchParams.get('kind');
    if (!['projects', 'commissions'].includes(kind || ''))
      throw new HttpError(400, 'Choose projects or commissions');
    const text = await request.text();
    let rows;
    try {
      rows = kind === 'projects' ? projectRows(text) : commissionRows(text);
    } catch (e) {
      throw new HttpError(400, e instanceof Error ? e.message : 'Invalid CSV');
    }
    const count = await rpc<number>(
      kind === 'projects' ? 'import_projects' : 'import_commissions',
      { p_rows: rows, p_actor: user.id },
    );
    return NextResponse.json({
      count,
      message:
        kind === 'projects'
          ? `${count} new drafts imported. Existing slugs were preserved.`
          : `${count} transactions reconciled.`,
    });
  } catch (e) {
    return apiError(e);
  }
}
