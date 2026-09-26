import { isProduction } from '@/lib/config';
import type { Metadata } from 'next';
import { Header, Footer } from '@/components/site-shell';
import '@/index.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://githubsignals.com'),
  title: {
    default: 'GitHub Signals — open-source projects worth your time',
    template: '%s · GitHub Signals',
  },
  description:
    'Independent discoveries for curious developers. Explore useful open-source projects, thoughtful tool recommendations and a weekly newsletter.',
  verification: { google: 'u5pvagiREMdJGJ5wwPq2UDNXL4Pizuf38fjThYrP_k4' },
  openGraph: { siteName: 'GitHub Signals', type: 'website', images: ['/opengraph-image'] },
  twitter: { card: 'summary_large_image' },
  robots: !isProduction() ? { index: false, follow: false } : undefined,
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
