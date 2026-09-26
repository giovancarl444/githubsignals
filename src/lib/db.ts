import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { assertEnvironmentIsolation, required } from './config';
export function db() {
  assertEnvironmentIsolation();
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db().rpc(name, args);
  if (error) {
    console.error('database_rpc_failed', { operation: name, code: error.code });
    throw new Error('Database operation failed');
  }
  return data as T;
}
