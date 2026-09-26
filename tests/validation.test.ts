import { afterEach, describe, it, expect, vi } from 'vitest';
import { safeDestination, offerSchema, subscribeSchema } from '../src/lib/validation';
import { commissionRows, projectRows, csvExport } from '../src/lib/csv';
import {
  confirmationToken,
  tokenHash,
  unsubscribeToken,
  verifyUnsubscribe,
} from '../src/lib/tokens';
import { canEmail } from '../src/lib/email-policy';
import { assertEnvironmentIsolation } from '../src/lib/config';
afterEach(() => vi.unstubAllEnvs());
describe('safe public input', () => {
  it.each([
    'javascript:alert(1)',
    'https://trusted.com.evil.com/path',
    'https://user@trusted.com/path',
    'https://trusted.com:8443/path',
    'https://127.0.0.1/',
    'https://localhost/',
  ])('rejects unsafe destination %s', (url) =>
    expect(safeDestination(url, 'trusted.com')).toBe(false),
  );
  it('accepts only the exact approved destination', () =>
    expect(safeDestination('https://trusted.com/offer?ref=githubsignals', 'trusted.com')).toBe(
      true,
    ));
  it('requires an actual agreement before publication', () => {
    expect(
      offerSchema.safeParse({
        slug: 'tool',
        title: 'A tool',
        summary: 'This is a useful tool',
        program: 'Vendor',
        destination_url: 'https://vendor.com/signup',
        approved_hostname: 'vendor.com',
        agreement_confirmed: false,
        disclosure: 'We may receive a commission.',
        status: 'published',
      }).success,
    ).toBe(false);
  });
  it('requires consent and a valid email', () => {
    expect(
      subscribeSchema.safeParse({ email: 'nope', consent: true, turnstileToken: 't' }).success,
    ).toBe(false);
    expect(
      subscribeSchema.safeParse({
        email: 'reader@example.com',
        consent: false,
        turnstileToken: 't',
      }).success,
    ).toBe(false);
    expect(
      subscribeSchema.parse({ email: ' Reader@Example.com ', consent: true, turnstileToken: 't' })
        .email,
    ).toBe('reader@example.com');
  });
  it('validates CSV rows and rejects duplicate transaction keys', () => {
    const header = 'program,transaction_id,amount_minor,currency,status,occurred_at\n';
    const row = 'Vendor,tx1,1234,USD,paid,2026-09-25T12:00:00Z\n';
    expect(commissionRows(header + row)[0].amount_minor).toBe(1234);
    expect(() => commissionRows(header + row + row)).toThrow('duplicate');
    expect(() => commissionRows(header + row.replace('1234', '12.34'))).toThrow();
    expect(() => commissionRows(header + row.replace('USD', 'usd'))).toThrow();
  });
  it('imports only draft projects with actual repository/permalink URL shapes', () => {
    const csv =
      'slug,title,summary,repository_url,instagram_url,tags,status\nproject,Project name,Useful project summary,https://github.com/owner/repo,https://www.instagram.com/p/abc123/,AI|Tools,published';
    expect(projectRows(csv)[0]).toMatchObject({ status: 'draft', tags: ['AI', 'Tools'] });
    expect(() =>
      projectRows(
        csv.replace(
          'https://www.instagram.com/p/abc123/',
          'https://www.instagram.com/githubsignals/',
        ),
      ),
    ).toThrow();
  });
  it('escapes spreadsheet formulas and CSV quotes in subscriber exports', () => {
    expect(csvExport([{ email: '=CMD()' }, { email: 'a"b' }], ['email'])).toBe(
      '"email"\r\n"\'=CMD()"\r\n"a""b"',
    );
  });
});
describe('tokens and preview isolation', () => {
  it('generates random one-way confirmation values', () => {
    const a = confirmationToken(),
      b = confirmationToken();
    expect(a.token).toHaveLength(64);
    expect(a.hash).toBe(tokenHash(a.token));
    expect(a).not.toEqual(b);
  });
  it('rejects tampered unsubscribe tokens', () => {
    vi.stubEnv('TOKEN_SECRET', 'a'.repeat(64));
    const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const t = unsubscribeToken(id);
    expect(verifyUnsubscribe(t)).toBe(id);
    expect(verifyUnsubscribe(t + '0')).toBeNull();
    expect(verifyUnsubscribe(t.replace('aaaa', 'bbbb'))).toBeNull();
  });
  it('never mails production subscribers from Vercel previews', () => {
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('EMAIL_ENABLED', 'true');
    vi.stubEnv('TEST_RECIPIENTS', 'controlled@example.com');
    expect(canEmail('reader@example.com')).toBe(false);
    expect(canEmail('controlled@example.com')).toBe(true);
  });
  it('fails closed if preview points to the production database', () => {
    vi.stubEnv('APP_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://production.supabase.co');
    vi.stubEnv('SUPABASE_PROJECT_REF', 'production');
    vi.stubEnv('PRODUCTION_SUPABASE_PROJECT_REF', 'production');
    expect(assertEnvironmentIsolation).toThrow('isolation');
  });
});
