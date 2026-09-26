import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { required } from './config';
import { HttpError } from './http';
export async function authClient() {
  const store = await cookies();
  return createServerClient(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (values) => {
          try {
            for (const { name, value, options } of values) store.set(name, value, options);
          } catch {
            /* Read-only server render; refresh is handled by proxy. */
          }
        },
      },
    },
  );
}
export async function requireAdmin() {
  const client = await authClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new HttpError(401, 'Please sign in.');
  const { data, error: roleError } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (roleError || !data) throw new HttpError(403, 'Administrator access required.');
  return user;
}
