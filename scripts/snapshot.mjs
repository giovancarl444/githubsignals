import initialProjects from '../content/projects.json' with { type: 'json' };
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
export const backupTables = [
  'consent_versions',
  'projects',
  'offers',
  'subscribers',
  'consent_events',
  'email_jobs',
  'campaigns',
  'clicks',
  'commissions',
  'partner_enquiries',
  'webhook_events',
  'rate_limits',
  'audit_events',
];
function validKey(key) {
  if (!key || !/^[a-f0-9]{64}$/i.test(key))
    throw new Error('BACKUP_ENCRYPTION_KEY must be 64 hexadecimal characters');
  return Buffer.from(key, 'hex');
}
export function encodeSnapshot(snapshot, key) {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', validKey(key), iv);
  return Buffer.concat([
    Buffer.from('GHS1'),
    iv,
    cipher.update(gzipSync(JSON.stringify(snapshot))),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
}
export function decodeSnapshot(bytes, key) {
  if (bytes.length < 32 || bytes.subarray(0, 4).toString() !== 'GHS1')
    throw new Error('Unsupported backup');
  const decipher = createDecipheriv('aes-256-gcm', validKey(key), bytes.subarray(4, 16));
  decipher.setAuthTag(bytes.subarray(-16));
  const snapshot = JSON.parse(
    gunzipSync(
      Buffer.concat([decipher.update(bytes.subarray(16, -16)), decipher.final()]),
    ).toString(),
  );
  if (
    snapshot.format !== 1 ||
    Object.keys(snapshot.tables).sort().join() !== [...backupTables].sort().join()
  )
    throw new Error('Invalid application snapshot');
  return snapshot;
}
export async function restoreTables(client, snapshot) {
  const currentProjects = (await client.query('select * from public.projects')).rows;
  for (const current of currentProjects) {
    const seed = initialProjects.find((p) => p.id === current.id);
    if (
      !seed ||
      Object.entries(seed).some(([k, v]) =>
        k.endsWith('_at')
          ? new Date(current[k]).getTime() !== new Date(v).getTime()
          : JSON.stringify(current[k]) !== JSON.stringify(v),
      )
    )
      throw new Error('Recovery target contains non-seed editorial work');
  }

  for (const table of backupTables.filter((t) => !['consent_versions', 'projects'].includes(t)))
    if (Number((await client.query(`select count(*) as n from public.${table}`)).rows[0].n))
      throw new Error(`Recovery target is not empty: ${table}`);
  await client.query(
    `truncate ${backupTables.map((t) => 'public.' + t).join(',')} restart identity`,
  );
  for (const table of backupTables) {
    const rows = snapshot.tables[table];
    if (!Array.isArray(rows)) throw new Error('Invalid table data');
    if (rows.length)
      await client.query(
        `insert into public.${table} overriding system value select * from jsonb_populate_recordset(null::public.${table},$1::jsonb)`,
        [JSON.stringify(rows)],
      );
  }
  for (const table of ['consent_events', 'audit_events'])
    await client.query(
      `select setval(pg_get_serial_sequence('public.${table}','id'),coalesce((select max(id) from public.${table}),1),exists(select 1 from public.${table}))`,
    );
}
