import { TokenAction } from '@/components/token-action';
export const metadata = {
  title: 'Confirm your subscription',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default async function Confirm({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = '' } = await searchParams;
  return (
    <main id="main" className="shell page article">
      <span className="eyebrow">ONE MORE CLICK</span>
      <h1>Make it official.</h1>
      <p>
        Confirm your address to receive the weekly GitHub Signals newsletter. Opening this page
        alone does not subscribe you.
      </p>
      <TokenAction token={token} action="confirm" />
    </main>
  );
}
