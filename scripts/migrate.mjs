import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { connection } from './database.mjs';
const client = connection();
try {
  await client.connect();
  await client.query("select pg_advisory_lock(hashtext('githubsignals:migrations'))");
  await client.query('create schema if not exists app_private');
  await client.query('revoke all on schema app_private from public,anon,authenticated');
  await client.query(
    'create table if not exists app_private.migrations(name text primary key,sha256 text not null,applied_at timestamptz not null default now())',
  );
  for (const name of readdirSync('supabase/migrations')
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    const sql = readFileSync('supabase/migrations/' + name, 'utf8'),
      sha256 = createHash('sha256').update(sql).digest('hex');
    const found = await client.query('select sha256 from app_private.migrations where name=$1', [
      name,
    ]);
    if (found.rows.length) {
      if (found.rows[0].sha256 !== sha256) throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into app_private.migrations(name,sha256) values($1,$2)', [
        name,
        sha256,
      ]);
      await client.query('commit');
      console.log('Applied', name);
    } catch (e) {
      await client.query('rollback');
      throw e;
    }
  }
  console.log('Migrations are current.');
} catch (e) {
  console.error('Migration failed:', e.code || e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
