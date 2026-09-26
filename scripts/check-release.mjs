// Validates names and relationships without printing secret values.
const errors = [];
const needs = [
  'APP_URL',
  'APP_ENV',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_PROJECT_REF',
  'PRODUCTION_SUPABASE_PROJECT_REF',
  'RESEND_API_KEY',
  'RESEND_WEBHOOK_SECRET',
  'RESEND_NEWSLETTER_SEGMENT_ID',
  'RESEND_FROM',
  'REPLY_TO_EMAIL',
  'CRON_SECRET',
  'TOKEN_SECRET',
  'RATE_LIMIT_SECRET',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'BUSINESS_NAME',
  'BUSINESS_POSTAL_ADDRESS',
  'CONTACT_EMAIL',
];
for (const name of needs) if (!process.env[name]) errors.push(`${name} is missing`);
for (const name of ['CRON_SECRET', 'TOKEN_SECRET', 'RATE_LIMIT_SECRET'])
  if ((process.env[name] || '').length < 32)
    errors.push(`${name} needs at least 32 random characters`);
try {
  const app = new URL(process.env.APP_URL),
    db = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (db.hostname !== `${process.env.SUPABASE_PROJECT_REF}.supabase.co`)
    errors.push('Supabase URL and project reference differ');
  const production =
    process.env.APP_ENV === 'production' &&
    (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production');
  if (production) {
    if (app.origin !== 'https://githubsignals.com')
      errors.push('Production canonical origin must be https://githubsignals.com');
    if (process.env.SUPABASE_PROJECT_REF !== process.env.PRODUCTION_SUPABASE_PROJECT_REF)
      errors.push('Wrong production database');
  } else {
    if (process.env.SUPABASE_PROJECT_REF === process.env.PRODUCTION_SUPABASE_PROJECT_REF)
      errors.push('Preview cannot use production data');
    if (!process.env.TEST_RECIPIENTS)
      errors.push('Set controlled TEST_RECIPIENTS for preview delivery checks');
  }
  if (process.env.EMAIL_ENABLED !== 'true' || process.env.SIGNUPS_ENABLED !== 'true')
    errors.push(
      'Signup/email switches are still off; enable only after inbox and recovery verification',
    );
  if (/1x00000000000000000000/.test(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''))
    errors.push('Replace the Turnstile test key before launch');
} catch {
  errors.push('APP_URL or Supabase URL is invalid');
}
if (errors.length) {
  console.error('Release configuration is incomplete:\n' + errors.map((x) => '- ' + x).join('\n'));
  process.exitCode = 1;
} else
  console.log(
    'Configuration checks passed. This does not replace inbox, DNS, webhook, preview-isolation or restore verification.',
  );
