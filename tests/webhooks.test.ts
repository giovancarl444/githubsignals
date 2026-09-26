import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';
const m = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../src/lib/db', () => ({ rpc: m.rpc, db: vi.fn() }));
import { POST } from '../src/app/api/webhooks/resend/route';
const key = Buffer.from('01234567890123456789012345678901').toString('base64');
function request(signature = true) {
  const payload = JSON.stringify({
    type: 'email.complained',
    created_at: new Date().toISOString(),
    data: { to: ['Reader@Example.com'], email_id: 'e' },
  });
  const timestamp = String(Math.floor(Date.now() / 1000)),
    id = 'evt_123';
  return new Request('https://githubsignals.com/api/webhooks/resend', {
    method: 'POST',
    headers: {
      'svix-id': id,
      'svix-timestamp': timestamp,
      'svix-signature': signature
        ? 'v1,' +
          createHmac('sha256', Buffer.from(key, 'base64'))
            .update(`${id}.${timestamp}.${payload}`)
            .digest('base64')
        : 'v1,invalid',
    },
    body: payload,
  });
}
beforeEach(() => {
  vi.stubEnv('RESEND_API_KEY', 're_test');
  vi.stubEnv('RESEND_WEBHOOK_SECRET', 'whsec_' + key);
  m.rpc.mockReset().mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());
it('authenticates the raw provider payload before storing suppression', async () => {
  expect((await POST(request())).status).toBe(200);
  expect(m.rpc).toHaveBeenCalledWith(
    'process_email_event',
    expect.objectContaining({
      p_event_id: 'evt_123',
      p_type: 'email.complained',
      p_emails: ['reader@example.com'],
    }),
  );
});
it('rejects forged webhook signatures', async () => {
  expect((await POST(request(false))).status).toBe(401);
  expect(m.rpc).not.toHaveBeenCalled();
});
it('returns a retryable error if committing the webhook fails', async () => {
  m.rpc.mockRejectedValue(new Error('down'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect((await POST(request())).status).toBe(503);
  } finally {
    vi.restoreAllMocks();
  }
});
