import { beforeEach, afterEach, it, expect, vi } from 'vitest';
const m = vi.hoisted(() => ({
  rpc: vi.fn(),
  single: vi.fn(),
  updateDb: vi.fn(),
  send: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  segment: vi.fn(),
}));
vi.mock('../src/lib/db', () => ({
  rpc: m.rpc,
  db: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: m.single }) }), update: m.updateDb }),
  }),
}));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: m.send };
    contacts = { get: m.get, update: m.update, create: m.create, segments: { add: m.segment } };
  },
}));
import { runEmailJobs, syncContact } from '../src/lib/mail';
import { tokenHash } from '../src/lib/tokens';
const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  lease = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
  token = 'a'.repeat(64);
const sub = {
  id,
  email: 'controlled@example.com',
  status: 'pending',
  confirmation_hash: tokenHash(token),
  confirmation_expires_at: new Date(Date.now() + 3600000).toISOString(),
  provider_contact_id: null,
  confirmed_at: null,
  updated_at: '2026-09-26T00:00:00Z',
};
const job = {
  id: 'job-id',
  kind: 'confirmation',
  subscriber_id: id,
  payload: { token },
  attempts: 1,
  created_at: new Date().toISOString(),
  lease_token: lease,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('EMAIL_ENABLED', 'true');
  vi.stubEnv('APP_ENV', 'preview');
  vi.stubEnv('TEST_RECIPIENTS', 'controlled@example.com');
  vi.stubEnv('APP_URL', 'https://preview.example.com');
  vi.stubEnv('BUSINESS_NAME', 'Signals Test');
  vi.stubEnv('RESEND_API_KEY', 're_test');
  vi.stubEnv('RESEND_FROM', 'newsletter@example.com');
  vi.stubEnv('REPLY_TO_EMAIL', 'contact@example.com');
  vi.stubEnv('RESEND_NEWSLETTER_SEGMENT_ID', 'test-segment');
  m.rpc.mockImplementation(async (name) => (name === 'claim_email_jobs' ? [job] : undefined));
  m.single.mockResolvedValue({ data: sub, error: null });
  m.send.mockResolvedValue({ data: { id: 'mail-id' }, error: null });
  m.updateDb.mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
  m.segment.mockResolvedValue({ data: {}, error: null });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it('delivers confirmation with a stable retry key then finishes the leased job', async () => {
  expect(await runEmailJobs()).toMatchObject({ processed: 1, failed: 0 });
  expect(m.send).toHaveBeenCalledWith(
    expect.objectContaining({ to: sub.email, html: expect.stringContaining(token) }),
    { idempotencyKey: 'confirmation-job-id' },
  );
  expect(m.rpc).toHaveBeenCalledWith(
    'finish_email_job',
    expect.objectContaining({ p_status: 'done', p_lease: lease, p_provider_id: 'mail-id' }),
  );
});
it('retries provider failures through the durable queue', async () => {
  m.send.mockResolvedValue({ error: { name: 'application_error' }, data: null });
  expect(await runEmailJobs()).toMatchObject({ failed: 1 });
  expect(m.rpc).toHaveBeenCalledWith(
    'finish_email_job',
    expect.objectContaining({ p_status: 'pending', p_lease: lease }),
  );
});
it('stops ambiguous retries before the provider idempotency window expires', async () => {
  m.rpc.mockImplementation(async (name) =>
    name === 'claim_email_jobs'
      ? [{ ...job, created_at: new Date(Date.now() - 24 * 3600000).toISOString() }]
      : undefined,
  );
  await runEmailJobs();
  expect(m.send).not.toHaveBeenCalled();
  expect(m.rpc).toHaveBeenCalledWith(
    'finish_email_job',
    expect.objectContaining({ p_status: 'dead' }),
  );
});
it('does not send stale confirmations after unsubscribe', async () => {
  m.single.mockResolvedValue({ data: { ...sub, status: 'unsubscribed' }, error: null });
  await runEmailJobs();
  expect(m.send).not.toHaveBeenCalled();
});
it('blocks non-allowlisted recipients in previews', async () => {
  m.single.mockResolvedValue({
    data: { ...sub, email: 'real-subscriber@example.com' },
    error: null,
  });
  await runEmailJobs();
  expect(m.send).not.toHaveBeenCalled();
});
it('does not clear a provider unsubscribe when a stale subscriber sync runs', async () => {
  m.get.mockResolvedValue({ data: { id: 'contact-id', unsubscribed: true }, error: null });
  await syncContact({ ...sub, status: 'subscribed' });
  expect(m.update).not.toHaveBeenCalled();
  expect(m.rpc).toHaveBeenCalledWith('stop_subscription', { p_id: id, p_reason: 'unsubscribe' });
});
it('never writes unsubscribed:false to existing provider contacts', async () => {
  m.get.mockResolvedValue({ data: { id: 'contact-id', unsubscribed: false }, error: null });
  m.single.mockResolvedValue({ data: { ...sub, status: 'subscribed' }, error: null });
  await syncContact({ ...sub, status: 'subscribed' });
  expect(m.update).not.toHaveBeenCalled();
  expect(m.segment).toHaveBeenCalled();
});
