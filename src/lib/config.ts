export const CONSENT_VERSION = 'weekly-newsletter-2026-09-26';
export const CONSENT_TEXT =
  'Send me the weekly GitHub Signals newsletter, including clearly labelled partner recommendations. I can unsubscribe at any time.';
export const SITE_NAME = 'GitHub Signals';
export function appUrl() {
  return process.env.APP_URL || 'http://localhost:3000';
}
export function isProduction() {
  return (
    process.env.APP_ENV === 'production' &&
    (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production')
  );
}
export function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
export function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
}
export function assertEnvironmentIsolation() {
  const url = required('NEXT_PUBLIC_SUPABASE_URL');
  const project = new URL(url).hostname.split('.')[0];
  if (project !== required('SUPABASE_PROJECT_REF')) throw new Error('Database project mismatch');
  const production = required('PRODUCTION_SUPABASE_PROJECT_REF');
  if (isProduction() ? project !== production : project === production)
    throw new Error('Database environment isolation failed');
}
export function signupsEnabled() {
  return (
    isConfigured() &&
    process.env.SIGNUPS_ENABLED === 'true' &&
    process.env.EMAIL_ENABLED === 'true' &&
    Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  );
}
