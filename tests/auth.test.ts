import { beforeEach, afterEach, it, expect, vi } from 'vitest';
const m = vi.hoisted(() => ({ getUser: vi.fn(), membership: vi.fn() }));
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: m.getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: m.membership }) }) }),
  }),
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ getAll: () => [], set: vi.fn() }) }));
import { requireAdmin } from '../src/lib/auth';
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'test');
  m.getUser.mockReset();
  m.membership.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
it('denies unauthenticated requests', async () => {
  m.getUser.mockResolvedValue({ data: { user: null }, error: null });
  await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
  expect(m.membership).not.toHaveBeenCalled();
});
it('denies signed-in users without explicit admin membership', async () => {
  m.getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null });
  m.membership.mockResolvedValue({ data: null, error: null });
  await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
});
it('permits an authenticated designated administrator', async () => {
  m.getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null });
  m.membership.mockResolvedValue({ data: { user_id: 'u' }, error: null });
  expect(await requireAdmin()).toEqual({ id: 'u' });
});
