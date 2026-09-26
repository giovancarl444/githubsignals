import { readFile } from 'node:fs/promises';
import { decodeSnapshot, restoreTables } from './snapshot.mjs';
import { connection } from './database.mjs';
const file = process.argv[2],
  key = process.env.BACKUP_ENCRYPTION_KEY;
if (!file || !key || !/^[a-f0-9]{64}$/i.test(key))
  throw new Error('Provide a backup path and BACKUP_ENCRYPTION_KEY');
if (
  process.env.APP_ENV === 'production' ||
  !process.env.PRODUCTION_SUPABASE_PROJECT_REF ||
  process.env.SUPABASE_PROJECT_REF === process.env.PRODUCTION_SUPABASE_PROJECT_REF
)
  throw new Error(
    'Restore only to a separate non-production recovery project. Never overwrite live subscribers.',
  );
if (process.env.EMAIL_ENABLED !== 'false' || process.env.SIGNUPS_ENABLED !== 'false')
  throw new Error('Disable email and signup before restoring');
const snapshot = decodeSnapshot(await readFile(file), key);
const client = connection();
try {
  await client.connect();
  await client.query('begin');
  const applied = (
    await client.query('select name,sha256 from app_private.migrations order by name')
  ).rows;
  if (JSON.stringify(applied) !== JSON.stringify(snapshot.migrations))
    throw new Error('Recovery target migrations must exactly match the snapshot');
  await restoreTables(client, snapshot);
  await client.query('commit');
  console.log(
    'Application snapshot restored to the isolated recovery project. Email remains disabled. Recreate admin access separately; inspect suppression and queue records before any promotion.',
  );
} catch (e) {
  await client.query('rollback').catch(() => {});
  console.error('Restore failed:', e.code || e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
