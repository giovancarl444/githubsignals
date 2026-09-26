import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { adminTables, adminColumns, audit, type AdminEntity } from '@/lib/admin';
import { projectSchema, offerSchema, campaignSchema } from '@/lib/validation';
import { apiError, checkOrigin, HttpError, readJson } from '@/lib/http';
const entitySchema = z.enum([
  'projects',
  'offers',
  'campaigns',
  'subscribers',
  'enquiries',
  'commissions',
  'jobs',
  'audit',
]);
export async function GET(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  try {
    await requireAdmin();
    const entity = entitySchema.parse((await params).entity);
    const search = new URL(request.url).searchParams;
    const page = z.coerce
      .number()
      .int()
      .min(0)
      .max(100000)
      .parse(search.get('page') || 0);
    let query = db().from(adminTables[entity]).select(adminColumns[entity], { count: 'exact' });
    const id = search.get('id');
    if (id) query = query.eq('id', z.string().uuid().parse(id));
    const { data, error, count } = await query
      .order(entity === 'commissions' ? 'imported_at' : 'created_at', { ascending: false })
      .range(page * 50, page * 50 + 49);
    if (error) throw new Error('Records unavailable');
    return NextResponse.json(
      { rows: data, count, page },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  try {
    checkOrigin(request);
    const user = await requireAdmin();
    const entity = (await params).entity as AdminEntity;
    const raw = await readJson(request, 50000);
    const id = raw.id ? z.string().uuid().parse(raw.id) : undefined;
    if (!['projects', 'offers', 'campaigns', 'enquiries'].includes(entity))
      throw new HttpError(405, 'This collection is read-only');
    const value =
      entity === 'projects'
        ? projectSchema.parse(raw)
        : entity === 'offers'
          ? offerSchema.parse(raw)
          : entity === 'campaigns'
            ? campaignSchema.parse(raw)
            : z.object({ status: z.enum(['new', 'contacted', 'qualified', 'closed']) }).parse(raw);
    if (entity === 'enquiries' && !id) throw new HttpError(400, 'Choose an enquiry');
    const values: Record<string, unknown> = { ...value };
    if (entity !== 'enquiries') values.updated_at = new Date().toISOString();
    if (entity === 'projects' && 'status' in value && value.status === 'published') {
      if (!('body' in value) || !value.body.trim())
        throw new HttpError(400, 'Add the project explanation before publishing');
      const old = id
        ? await db().from('projects').select('published_at').eq('id', id).maybeSingle()
        : null;
      if (old?.error) throw new Error('Project unavailable');
      values.published_at = old?.data?.published_at || new Date().toISOString();
    }
    let query = id
      ? db().from(adminTables[entity]).update(values).eq('id', id)
      : db().from(adminTables[entity]).insert(values);
    if (entity === 'campaigns' && id) query = query.eq('status', 'draft');
    const { data, error } = await query.select('id').maybeSingle();
    if (error)
      throw new HttpError(
        400,
        error.code === '23505' ? 'That slug is already in use.' : 'The record could not be saved.',
      );
    if (!data)
      throw new HttpError(
        409,
        'Record is missing or no longer editable. Prepared campaigns are locked.',
      );
    await audit(user.id, `${entity}.${id ? 'update' : 'create'}`, data.id);
    return NextResponse.json({ id: data.id });
  } catch (e) {
    return apiError(e);
  }
}
