import {
  backupTables,
  encodeSnapshot,
  decodeSnapshot,
  restoreTables,
} from '../scripts/snapshot.mjs';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { tokenHash } from '../src/lib/tokens';
let db: PGlite;
const consent = 'weekly-newsletter-2026-09-26';
const uuid = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
async function request(email = 'reader@example.com', token = 'a'.repeat(64)) {
  return db.query('select request_subscription($1,$2,$3,$4::jsonb,$5)', [
    email,
    tokenHash(token),
    token,
    JSON.stringify({ path: '/projects' }),
    consent,
  ]);
}
async function count(table: string) {
  return Number((await db.query<{ n: number }>(`select count(*) as n from ${table}`)).rows[0].n);
}
async function subscriber() {
  return (
    await db.query<{ id: string; status: string; confirmation_hash: string }>(
      'select * from subscribers limit 1',
    )
  ).rows[0];
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql as 'select null::uuid'; grant usage on schema public,auth to anon,authenticated,service_role;`,
  );
  for (const file of readdirSync('supabase/migrations').sort())
    await db.exec(readFileSync('supabase/migrations/' + file, 'utf8'));
});
afterAll(async () => {
  await db.close();
});
beforeEach(async () => {
  await db.exec(
    'truncate subscribers,projects,offers,commissions,partner_enquiries,webhook_events,rate_limits,audit_events,campaigns restart identity cascade',
  );
});
describe('durable double opt-in', () => {
  it('normalizes an address and atomically saves consent and the email job', async () => {
    await request(' Reader@Example.com ');
    const s = await db.query<{ email: string; status: string }>(
      'select email,status from subscribers',
    );
    expect(s.rows).toEqual([{ email: 'reader@example.com', status: 'pending' }]);
    expect(await count('consent_events')).toBe(1);
    expect(await count('email_jobs')).toBe(1);
    expect(
      (
        await db.query<{ wording: string }>(
          'select wording from consent_versions where version=$1',
          [consent],
        )
      ).rows[0].wording,
    ).toContain('unsubscribe');
  });
  it('rolls back signup if storing the outbox job fails', async () => {
    await db.exec(
      `create function reject_job() returns trigger language plpgsql as $$begin raise exception 'simulated disk failure'; end$$; create trigger reject_job before insert on email_jobs for each row execute function reject_job();`,
    );
    try {
      await expect(request()).rejects.toThrow('simulated disk failure');
      expect(await count('subscribers')).toBe(0);
      expect(await count('consent_events')).toBe(0);
    } finally {
      await db.exec('drop trigger reject_job on email_jobs; drop function reject_job()');
    }
  });
  it('deduplicates concurrent requests and keeps confirmation single-use', async () => {
    await Promise.all(Array.from({ length: 8 }, () => request()));
    expect(await count('subscribers')).toBe(1);
    expect(await count('email_jobs')).toBe(1);
    const confirm = () =>
      db.query<{ ok: boolean }>('select confirm_subscription($1) as ok', [
        tokenHash('a'.repeat(64)),
      ]);
    expect((await confirm()).rows[0].ok).toBe(true);
    expect((await confirm()).rows[0].ok).toBe(false);
    await request();
    expect((await subscriber()).status).toBe('subscribed');
    expect(await count('email_jobs')).toBe(2);
  });
  it('rejects expired confirmations and supersedes old links on retry', async () => {
    await request();
    await db.exec(
      `update subscribers set confirmation_expires_at=now()-interval '1 minute',last_requested_at=now()-interval '1 hour'`,
    );
    expect(
      (
        await db.query<{ ok: boolean }>('select confirm_subscription($1) as ok', [
          tokenHash('a'.repeat(64)),
        ])
      ).rows[0].ok,
    ).toBe(false);
    await request('reader@example.com', 'b'.repeat(64));
    expect((await subscriber()).confirmation_hash).toBe(tokenHash('b'.repeat(64)));
    expect(await count('email_jobs')).toBe(2);
  });
  it('keeps unsubscribe and complaint suppression durable across repeated webhooks', async () => {
    await request();
    const s = await subscriber();
    await db.query('select stop_subscription($1)', [s.id]);
    await db.query('select stop_subscription($1)', [s.id]);
    expect((await subscriber()).status).toBe('unsubscribed');
    expect(await count('email_jobs')).toBe(2);
    const webhook = () =>
      db.query('select process_email_event($1,$2,$3::text[])', [
        'event-1',
        'email.complained',
        ['reader@example.com'],
      ]);
    await webhook();
    await webhook();
    expect((await subscriber()).status).toBe('suppressed');
    expect(await count('webhook_events')).toBe(1);
    await db.exec(`update subscribers set last_requested_at=now()-interval '2 days'`);
    await request();
    expect((await subscriber()).status).toBe('suppressed');
    expect(await count('email_jobs')).toBe(3);
  });
  it('handles provider-native unsubscribes', async () => {
    await request();
    await db.query('select confirm_subscription($1)', [tokenHash('a'.repeat(64))]);
    await db.query('select process_email_event($1,$2,$3::text[],null,true)', [
      'contact-1',
      'contact.updated',
      ['reader@example.com'],
    ]);
    expect((await subscriber()).status).toBe('unsubscribed');
  });
});
describe('queue and permissions', () => {
  it('fences stale workers and backs off failures without losing the job', async () => {
    await request();
    const first = (
      await db.query<{ id: string; lease_token: string }>('select * from claim_email_jobs(1)')
    ).rows[0];
    expect((await db.query('select * from claim_email_jobs(1)')).rows).toHaveLength(0);
    await db.exec(`update email_jobs set lease_until=now()-interval '1 minute'`);
    const second = (
      await db.query<{ id: string; lease_token: string }>('select * from claim_email_jobs(1)')
    ).rows[0];
    await db.query('select finish_email_job($1,$2,$3)', [first.id, first.lease_token, 'done']);
    expect(
      (await db.query<{ status: string }>('select status from email_jobs')).rows[0].status,
    ).toBe('processing');
    await db.query('select finish_email_job($1,$2,$3,$4)', [
      second.id,
      second.lease_token,
      'pending',
      'provider unavailable',
    ]);
    expect(
      (
        await db.query<{ status: string; delayed: boolean }>(
          'select status,available_at>now() as delayed from email_jobs',
        )
      ).rows[0],
    ).toEqual({ status: 'pending', delayed: true });
  });
  it('limits repeated requests atomically', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        db.query<{ ok: boolean }>('select consume_rate_limit($1,3,3600) as ok', ['bucket']),
      ),
    );
    expect(results.filter((r) => r.rows[0].ok)).toHaveLength(3);
  });
  it('denies private data and writes to both public client roles', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      try {
        await expect(db.query('select email from subscribers')).rejects.toThrow(
          'permission denied',
        );
        await expect(request()).rejects.toThrow('permission denied');
        await expect(
          db.query(
            "insert into projects(slug,title,summary,repository_url) values('test','Test','Summary','https://github.com/a/b')",
          ),
        ).rejects.toThrow('permission denied');
      } finally {
        await db.exec('reset role');
      }
    }
  });
  it('exposes published editorial records only', async () => {
    await db.exec(
      `insert into projects(slug,title,summary,repository_url,status) values('draft','Draft','A draft','https://github.com/a/b','draft'),('live','Live','Published','https://github.com/a/c','published')`,
    );
    await db.exec('set role anon');
    try {
      expect((await db.query<{ slug: string }>('select slug from projects')).rows).toEqual([
        { slug: 'live' },
      ]);
    } finally {
      await db.exec('reset role');
    }
  });
});
describe('commercial records and retention', () => {
  it('deduplicates reports and updates a transaction reversal without adding revenue', async () => {
    const row = {
      program: 'program-a',
      transaction_id: 'tx-1',
      amount_minor: 1200,
      currency: 'USD',
      status: 'pending',
      occurred_at: '2026-09-25T12:00:00Z',
    };
    const importRow = (r: typeof row) =>
      db.query('select import_commissions($1::jsonb,$2)', [JSON.stringify([r]), uuid]);
    await importRow(row);
    await importRow(row);
    expect(await count('commissions')).toBe(1);
    await importRow({ ...row, status: 'reversed' });
    const m = (
      await db.query<{ m: { revenue: { status: string; amount_minor: string }[] } }>(
        'select dashboard_metrics() as m',
      )
    ).rows[0].m;
    expect(m.revenue).toEqual([
      expect.objectContaining({ status: 'reversed', amount_minor: '1200' }),
    ]);
  });
  it('rolls back the whole commission file when any record is invalid', async () => {
    const rows = [
      {
        program: 'p',
        transaction_id: 'ok',
        amount_minor: 100,
        currency: 'USD',
        status: 'paid',
        occurred_at: '2026-09-25T12:00:00Z',
      },
      {
        program: 'p',
        transaction_id: 'bad',
        amount_minor: -1,
        currency: 'USD',
        status: 'paid',
        occurred_at: '2026-09-25T12:00:00Z',
      },
    ];
    await expect(
      db.query('select import_commissions($1::jsonb,$2)', [JSON.stringify(rows), uuid]),
    ).rejects.toThrow();
    expect(await count('commissions')).toBe(0);
  });
  it('keeps imported discoveries in draft and leaves existing slugs untouched', async () => {
    const row = {
      slug: 'real-project',
      title: 'Real project',
      summary: 'An editor supplied summary',
      body: 'Article',
      repository_url: 'https://github.com/owner/project',
      category: 'Developer tools',
      tags: [],
      status: 'published',
    };
    await db.query('select import_projects($1::jsonb,$2)', [JSON.stringify([row]), uuid]);
    await db.query('select import_projects($1::jsonb,$2)', [
      JSON.stringify([{ ...row, title: 'Overwrite' }]),
      uuid,
    ]);
    expect((await db.query('select title,status from projects')).rows).toEqual([
      { title: 'Real project', status: 'draft' },
    ]);
  });
  it('expires abandoned signups but preserves suppression', async () => {
    await request();
    await db.exec(`update subscribers set last_requested_at=now()-interval '31 days'`);
    await request('suppressed@example.com', 'b'.repeat(64));
    await db.query(
      "select stop_subscription(id,'email.bounced') from subscribers where email='suppressed@example.com'",
    );
    await db.query('select prune_private_data()');
    expect(await count('subscribers')).toBe(1);
    expect((await subscriber()).status).toBe('suppressed');
  });
});

it('restores subscriber status, consent and queued work from a database snapshot', async () => {
  await request();
  await db.query("select stop_subscription(id,'email.bounced') from subscribers");
  const snapshot = await db.dumpDataDir();
  const restored = new PGlite({ loadDataDir: snapshot });
  try {
    expect(
      (await restored.query<{ status: string }>('select status from subscribers')).rows[0].status,
    ).toBe('suppressed');
    expect(
      Number(
        (await restored.query<{ n: number }>('select count(*) as n from email_jobs')).rows[0].n,
      ),
    ).toBe(2);
    expect((await restored.query('select * from consent_events')).rows).toHaveLength(2);
    await restored.query(
      "select request_subscription('reader@example.com','new-hash','token','{}','weekly-newsletter-2026-09-26')",
    );
    expect(
      (await restored.query<{ status: string }>('select status from subscribers')).rows[0].status,
    ).toBe('suppressed');
  } finally {
    await restored.close();
  }
});

it('encrypts and restores the operator backup format without overwriting live records', async () => {
  await request();
  await db.query("select stop_subscription(id,'email.complained') from subscribers");
  const tables: Record<string, unknown[]> = Object.fromEntries(
    await Promise.all(
      backupTables.map(async (table: string) => [
        table,
        (await db.query(`select * from public.${table}`)).rows,
      ]),
    ),
  );
  const encrypted = encodeSnapshot({ format: 1, tables }, 'a'.repeat(64));
  expect(encrypted.toString()).not.toContain('reader@example.com');
  expect(() => decodeSnapshot(encrypted, 'b'.repeat(64))).toThrow();
  const snapshot = decodeSnapshot(encrypted, 'a'.repeat(64));
  await expect(restoreTables(db, snapshot)).rejects.toThrow('not empty');
  await db.exec(
    'truncate subscribers,projects,offers,commissions,partner_enquiries,webhook_events,rate_limits,audit_events,campaigns restart identity cascade',
  );
  await db.exec('begin');
  try {
    await restoreTables(db, snapshot);
    await db.exec('commit');
  } catch (e) {
    await db.exec('rollback');
    throw e;
  }
  expect((await subscriber()).status).toBe('suppressed');
  expect(await count('email_jobs')).toBe(2);
  await db.query(
    "insert into consent_events(subscriber_id,action) select id,'restore-check' from subscribers",
  );
  expect(await count('consent_events')).toBe(3);
});
