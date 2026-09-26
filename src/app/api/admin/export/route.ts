import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { csvExport } from '@/lib/csv';
import { audit } from '@/lib/admin';
import { apiError } from '@/lib/http';
export async function GET() {
  try {
    const user = await requireAdmin();
    const rows: Record<string, unknown>[] = [];
    const columns = [
      'id',
      'email',
      'status',
      'consent_version',
      'source',
      'created_at',
      'confirmed_at',
      'unsubscribed_at',
      'suppression_reason',
    ];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db()
        .from('subscribers')
        .select(columns.join(','))
        .order('id')
        .range(offset, offset + 999);
      if (error) throw new Error('Export failed');
      rows.push(
        ...(data as unknown as Record<string, unknown>[]).map((r) => ({
          ...r,
          source: JSON.stringify(r.source),
        })),
      );
      if (data.length < 1000) break;
    }
    await audit(user.id, 'subscribers.export');
    return new Response(csvExport(rows, columns), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="githubsignals-subscribers.csv"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
