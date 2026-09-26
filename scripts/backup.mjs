// Portable application backup. Supabase platform backups remain the full-system backup.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { backupTables, encodeSnapshot } from './snapshot.mjs';
import { connection } from './database.mjs';
const key = process.env.BACKUP_ENCRYPTION_KEY;
if (!key || !/^[a-f0-9]{64}$/i.test(key))
  throw new Error(
    'BACKUP_ENCRYPTION_KEY must be 32 random bytes encoded as 64 hex characters; keep it in your secret manager',
  );
const tables = backupTables;
const client = connection();
try {
  await client.connect();
  await client.query('begin isolation level repeatable read read only');
  const snapshot = {
    format: 1,
    created_at: new Date().toISOString(),
    project_ref: process.env.SUPABASE_PROJECT_REF,
    migrations: (await client.query('select name,sha256 from app_private.migrations order by name'))
      .rows,
    tables: {},
  };
  for (const table of tables)
    snapshot.tables[table] = (await client.query(`select * from public.${table}`)).rows;
  await client.query('commit');
  const encrypted = encodeSnapshot(snapshot, key);
  await mkdir('backups', { recursive: true, mode: 0o700 });
  const path = `backups/githubsignals-${new Date().toISOString().replaceAll(':', '-')}.ghs`;
  await writeFile(path, encrypted, { mode: 0o600, flag: 'wx' });
  console.log('Encrypted application snapshot:', path);
  console.log('SHA256:', createHash('sha256').update(encrypted).digest('hex'));
  console.log(
    'Copy to owner-controlled storage. Auth users, admin membership, platform settings and provider state require separate recovery.',
  );
} catch (e) {
  console.error('Backup failed:', e.code || e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
