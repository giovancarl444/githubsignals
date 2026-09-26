import type { MetadataRoute } from 'next';
import { isProduction } from '@/lib/config';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: !isProduction()
      ? { userAgent: '*', disallow: '/' }
      : {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin', '/api', '/go/', '/subscribe/', '/unsubscribe'],
        },
    sitemap: 'https://githubsignals.com/sitemap.xml',
  };
}
