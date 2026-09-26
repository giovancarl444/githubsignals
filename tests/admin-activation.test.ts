import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { HttpError } from '../src/lib/http';
const m = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  requireAdmin: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('../src/lib/auth', () => ({
  authClient: async () => ({
    auth: { verifyOtp: m.verifyOtp, updateUser: m.updateUser, signOut: m.signOut },
  }),
  requireAdmin: m.requireAdmin,
}));
vi.mock('../src/lib/db', () => ({ rpc: m.rpc }));
import { POST } from '../src/app/api/admin/activate/route';
const input = {
  token_hash: 'a'.repeat(64),
  type: 'invite',
  password: 'a unique password for testing',
};
function request(body: unknown = input, origin = 'https://githubsignals.com') {
  return new Request('https://githubsignals.com/api/admin/activate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv('APP_URL', 'https://githubsignals.com');
  vi.stubEnv('RATE_LIMIT_SECRET', 'r'.repeat(64));
  for (const mock of Object.values(m)) mock.mockReset();
  m.rpc.mockResolvedValue(true);
  m.verifyOtp.mockResolvedValue({ error: null });
  m.updateUser.mockResolvedValue({ error: null });
  m.signOut.mockResolvedValue({ error: null });
  m.requireAdmin.mockResolvedValue({ id: 'editor' });
});
afterEach(() => vi.unstubAllEnvs());

it.each(['invite', 'recovery'])(
  'sets an authorized editor password from a valid %s and revokes refresh sessions',
  async (type) => {
    const response = await POST(request({ ...input, type }));
    expect(response.status).toBe(200);
    expect(m.verifyOtp).toHaveBeenCalledWith({ token_hash: input.token_hash, type });
    expect(m.updateUser).toHaveBeenCalledWith({ password: input.password });
    expect(m.signOut).toHaveBeenCalledWith({ scope: 'global' });
    expect(await response.json()).toEqual({ ok: true });
  },
);
it('rejects an expired or replayed token without changing credentials', async () => {
  m.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired' } });
  expect((await POST(request())).status).toBe(401);
  expect(m.updateUser).not.toHaveBeenCalled();
});
it('requires admin membership even when Auth accepts an invitation', async () => {
  m.requireAdmin.mockRejectedValue(new HttpError(403, 'Administrator access required.'));
  expect((await POST(request())).status).toBe(403);
  expect(m.updateUser).not.toHaveBeenCalled();
  expect(m.signOut).toHaveBeenCalledWith({ scope: 'local' });
});
it('validates the password before consuming the one-time token', async () => {
  expect((await POST(request({ ...input, password: 'short' }))).status).toBe(400);
  expect(m.verifyOtp).not.toHaveBeenCalled();
});
it('rejects other Auth token purposes', async () => {
  expect((await POST(request({ ...input, type: 'email_change' }))).status).toBe(400);
  expect(m.verifyOtp).not.toHaveBeenCalled();
});
it('rejects cross-origin requests before contacting Auth', async () => {
  expect((await POST(request(input, 'https://attacker.example'))).status).toBe(403);
  expect(m.verifyOtp).not.toHaveBeenCalled();
});
it('limits token guesses before contacting Auth', async () => {
  m.rpc.mockResolvedValue(false);
  expect((await POST(request())).status).toBe(429);
  expect(m.verifyOtp).not.toHaveBeenCalled();
});
it('clears the temporary session when the provider rejects the password', async () => {
  m.updateUser.mockResolvedValue({ error: { code: 'weak_password' } });
  const response = await POST(request());
  expect(response.status).toBe(400);
  expect(m.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(await response.json()).toHaveProperty('error');
});
it('reports a failed session revocation separately from a saved password', async () => {
  m.signOut.mockResolvedValueOnce({ error: { code: 'unavailable' } });
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect((await response.json()).error).toContain('Your password was saved');
});
