import type { MetadataRoute } from 'next';
import { projects, offers } from '@/lib/content';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [p, o] = await Promise.all([projects(), offers()]);
  return [
    ...['', '/projects', '/tools', '/partners', '/privacy', '/disclosure'].map((path) => ({
      url: `https://githubsignals.com${path}`,
    })),
    ...p.map((p) => ({
      url: `https://githubsignals.com/projects/${p.slug}`,
      lastModified: p.updated_at,
    })),
    ...o.map((o) => ({
      url: `https://githubsignals.com/tools/${o.slug}`,
      lastModified: o.updated_at,
    })),
  ];
}
