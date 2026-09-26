import { z } from 'zod';
export const slug = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const email = z.string().trim().toLowerCase().email().max(254);
const httpsUrl = z
  .string()
  .url()
  .max(2048)
  .refine((v) => {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port;
  }, 'Use a public HTTPS URL without credentials or a custom port');
export const repositoryUrl = httpsUrl.refine((v) => {
  const u = new URL(v);
  return (
    u.hostname === 'github.com' && /^\/[^/]+\/[^/]+\/?$/.test(u.pathname) && !u.search && !u.hash
  );
}, 'Use a GitHub repository URL');
export const instagramUrl = z
  .union([
    z.literal(''),
    httpsUrl.refine(
      (v) => /^https:\/\/www\.instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/.test(v),
      'Use an Instagram post or reel permalink',
    ),
  ])
  .transform((v) => v || null);
export const sourceSchema = z.object({
  path: z
    .string()
    .max(200)
    .regex(/^\/[a-zA-Z0-9/_-]*$/)
    .default('/'),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
});
export const subscribeSchema = z.object({
  email,
  consent: z.literal(true),
  source: sourceSchema.default({ path: '/' }),
  website: z.string().max(200).default(''),
  turnstileToken: z.string().min(1).max(2048),
});
export const partnerSchema = z.object({
  email,
  name: z.string().trim().min(2).max(100),
  company: z.string().trim().min(2).max(160),
  url: httpsUrl,
  message: z.string().trim().min(20).max(4000),
  website: z.string().max(200).default(''),
  turnstileToken: z.string().min(1).max(2048),
});
export const projectSchema = z.object({
  slug,
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10).max(300),
  body: z.string().max(30000).default(''),
  repository_url: repositoryUrl,
  instagram_url: instagramUrl.default(''),
  category: z.string().trim().min(2).max(60).default('Developer tools'),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});
export const offerSchema = z
  .object({
    slug,
    title: z.string().trim().min(3).max(160),
    summary: z.string().trim().min(10).max(300),
    body: z.string().max(30000).default(''),
    program: z.string().trim().min(2).max(120),
    destination_url: httpsUrl,
    approved_hostname: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/),
    agreement_confirmed: z.boolean(),
    disclosure: z.string().trim().min(20).max(500),
    status: z.enum(['draft', 'published', 'archived']),
  })
  .superRefine((v, ctx) => {
    if (!safeDestination(v.destination_url, v.approved_hostname))
      ctx.addIssue({
        code: 'custom',
        path: ['destination_url'],
        message: 'Destination must match the approved public hostname',
      });
    if (v.status === 'published' && !v.agreement_confirmed)
      ctx.addIssue({
        code: 'custom',
        path: ['agreement_confirmed'],
        message: 'Confirm the real agreement before publishing',
      });
  });
export function safeDestination(value: string, hostname: string): boolean {
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      u.hostname === hostname &&
      !u.username &&
      !u.password &&
      !u.port &&
      /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(hostname) &&
      !/(^|\.)(localhost|local|internal|test|invalid)$/.test(hostname)
    );
  } catch {
    return false;
  }
}
export const campaignSchema = z.object({
  title: z.string().trim().min(3).max(160),
  subject: z.string().trim().min(3).max(160),
  body: z.string().trim().min(30).max(30000),
});
export const commissionSchema = z.object({
  program: z.string().trim().min(1).max(120),
  transaction_id: z.string().trim().min(1).max(200),
  offer_id: z
    .union([z.string().uuid(), z.literal('')])
    .transform((v) => v || null)
    .optional(),
  amount_minor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.enum(['pending', 'approved', 'reversed', 'paid']),
  occurred_at: z.string().datetime({ offset: true }),
});
export type Project = z.infer<typeof projectSchema> & {
  id: string;
  published_at: string | null;
  updated_at: string;
};
export type Offer = z.infer<typeof offerSchema> & { id: string; updated_at: string };
