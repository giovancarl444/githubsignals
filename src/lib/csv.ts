import { parse } from 'csv-parse/sync';
import { commissionSchema, projectSchema } from './validation';
export function parseCsv(text: string): Record<string, string>[] {
  if (Buffer.byteLength(text) > 1_000_000) throw new Error('CSV must be smaller than 1 MB');
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
    max_record_size: 40000,
  }) as Record<string, string>[];
  if (!rows.length || rows.length > 1000) throw new Error('Import between 1 and 1,000 rows');
  return rows;
}
export function commissionRows(text: string) {
  const rows = parseCsv(text).map((row) => commissionSchema.parse(row));
  if (new Set(rows.map((r) => JSON.stringify([r.program, r.transaction_id]))).size !== rows.length)
    throw new Error('CSV contains duplicate transactions');
  return rows;
}
export function projectRows(text: string) {
  const rows = parseCsv(text).map((row) =>
    projectSchema.parse({
      ...row,
      status: 'draft',
      tags: (row.tags || '').split('|').filter(Boolean),
    }),
  );
  if (new Set(rows.map((r) => r.slug)).size !== rows.length)
    throw new Error('CSV contains duplicate project slugs');
  return rows;
}
export function csvExport(rows: Record<string, unknown>[], columns: string[]) {
  const field = (v: unknown) =>
    '"' +
    String(v ?? '')
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return [
    columns.map(field).join(','),
    ...rows.map((row) => columns.map((k) => field(row[k])).join(',')),
  ].join('\r\n');
}
