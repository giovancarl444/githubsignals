import { readFileSync } from 'node:fs';
import pg from 'pg';
export function connection() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      'Set DATABASE_URL in the private environment. Use a direct or session-pooler connection.',
    );
  const url = new URL(process.env.DATABASE_URL),
    ref = process.env.SUPABASE_PROJECT_REF;
  if (
    !ref ||
    !(
      url.hostname === `db.${ref}.supabase.co` ||
      decodeURIComponent(url.username).endsWith(`.${ref}`)
    )
  )
    throw new Error('DATABASE_URL does not match SUPABASE_PROJECT_REF');
  if (url.port === '6543')
    throw new Error('Use a direct/session connection on port 5432, not transaction pooling');
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
  const ssl = {
    rejectUnauthorized: true,
    ...(process.env.DATABASE_CA_FILE
      ? { ca: readFileSync(process.env.DATABASE_CA_FILE, 'utf8') }
      : {}),
  };
  return new pg.Client({
    connectionString: url.toString(),
    ssl,
    connectionTimeoutMillis: 10000,
    statement_timeout: 60000,
  });
}
