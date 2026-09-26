import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import pg from 'pg';
import { readFileSync, readdirSync } from 'node:fs';
import { tokenHash } from '../src/lib/tokens';
const testUrl = process.env.TEST_POSTGRES_URL;
describe.skipIf(!testUrl)('independent PostgreSQL connections (CI service)', () => {
  const pool = new pg.Pool({ connectionString: testUrl, max: 12 });
  beforeAll(async () => {
    const u = new URL(testUrl!);
    if (!['127.0.0.1', 'localhost'].includes(u.hostname) || u.pathname !== '/githubsignals_test')
      throw new Error('Use only the disposable local CI test database');
    await pool.query(
      `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql as 'select null::uuid'; grant usage on schema public,auth to anon,authenticated,service_role;`,
    );
    for (const name of readdirSync('supabase/migrations').sort())
      await pool.query(readFileSync('supabase/migrations/' + name, 'utf8'));
  });
  afterAll(async () => {
    await pool.end();
  });
  beforeEach(async () => {
    await pool.query('truncate subscribers restart identity cascade');
  });
  function signup(email = 'parallel@example.com', token = 'a'.repeat(64)) {
    return pool.query('select request_subscription($1,$2,$3,$4::jsonb,$5)', [
      email,
      tokenHash(token),
      token,
      '{}',
      'weekly-newsletter-2026-09-26',
    ]);
  }
  it('deduplicates twenty simultaneous signups across separate sessions', async () => {
    await Promise.all(Array.from({ length: 20 }, () => signup()));
    expect(Number((await pool.query('select count(*) as n from subscribers')).rows[0].n)).toBe(1);
    expect(Number((await pool.query('select count(*) as n from email_jobs')).rows[0].n)).toBe(1);
  });
  it('gives simultaneous queue workers disjoint leases', async () => {
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        signup(`reader${i}@example.com`, i.toString(16).padStart(64, '0')),
      ),
    );
    const claims = await Promise.all(
      Array.from({ length: 4 }, () => pool.query('select id from claim_email_jobs(3)')),
    );
    const ids = claims.flatMap((c) => c.rows.map((r) => r.id));
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
  });
  it('preserves unsubscribe when it races confirmation', async () => {
    await signup();
    const id = (await pool.query('select id from subscribers')).rows[0].id;
    await Promise.all([
      pool.query('select confirm_subscription($1)', [tokenHash('a'.repeat(64))]),
      pool.query('select stop_subscription($1)', [id]),
    ]);
    expect((await pool.query('select status from subscribers')).rows[0].status).toBe(
      'unsubscribed',
    );
  });
});
