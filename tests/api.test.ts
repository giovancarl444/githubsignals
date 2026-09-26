import { beforeEach, afterEach, it, expect, vi } from 'vitest';
const mock = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../src/lib/db', () => ({ rpc: mock.rpc }));
import { POST } from '../src/app/api/subscribe/route';
function request(body: unknown, origin = 'https://githubsignals.com') {
  return new Request('https://githubsignals.com/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  });
}
const input = {
  email: ' READER@EXAMPLE.COM ',
  consent: true,
  turnstileToken: 'verified',
  source: { path: '/projects' },
};
beforeEach(() => {
  vi.stubEnv('APP_URL', 'https://githubsignals.com');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'secret');
  vi.stubEnv('SIGNUPS_ENABLED', 'true');
  vi.stubEnv('EMAIL_ENABLED', 'true');
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'test');
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'test');
  vi.stubEnv('RATE_LIMIT_SECRET', 'a'.repeat(64));
  mock.rpc.mockReset().mockResolvedValue(true);
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        Response.json({ success: true, hostname: 'githubsignals.com', action: 'subscribe' }),
      ),
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it('acknowledges only after the durable subscription RPC completes', async () => {
  let release: () => void = () => {};
  const pending = new Promise<void>((r) => (release = r));
  mock.rpc.mockImplementation(async (name) => {
    if (name === 'request_subscription') await pending;
    return true;
  });
  let resolved = false;
  const result = POST(request(input)).then((r) => {
    resolved = true;
    return r;
  });
  await new Promise((r) => setTimeout(r, 10));
  expect(resolved).toBe(false);
  release();
  expect((await result).status).toBe(202);
  expect(mock.rpc).toHaveBeenCalledWith(
    'request_subscription',
    expect.objectContaining({
      p_email: 'reader@example.com',
      p_consent: 'weekly-newsletter-2026-09-26',
    }),
  );
});
it('reports persistence failures without displaying signup success', async () => {
  mock.rpc.mockImplementation(async (name) => {
    if (name === 'request_subscription') throw new Error('db down');
    return true;
  });
  const response = await POST(request(input));
  expect(response.status).toBe(503);
  expect(await response.json()).toHaveProperty('error');
});
it.each([
  { ...input, email: 'invalid' },
  { ...input, consent: false },
  { ...input, website: 'spam' },
])('rejects invalid or bot submissions', async (body) => {
  expect((await POST(request(body))).status).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled();
});
it('rejects foreign origins before processing', async () => {
  expect((await POST(request(input, 'https://evil.example'))).status).toBe(403);
  expect(mock.rpc).not.toHaveBeenCalled();
});
it('fails closed if bot verification fails or the host does not match', async () => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json({ success: true, hostname: 'evil.example', action: 'subscribe' }),
  );
  expect((await POST(request(input))).status).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalledWith('request_subscription', expect.anything());
});
it('enforces rate limits', async () => {
  mock.rpc.mockResolvedValue(false);
  expect((await POST(request(input))).status).toBe(429);
});
