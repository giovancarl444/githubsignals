import { TokenAction } from '@/components/token-action';
export const metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = '' } = await searchParams;
  return (
    <main id="main" className="shell page article">
      <span className="eyebrow">YOUR INBOX, YOUR CHOICE</span>
      <h1>Take a little space.</h1>
      <p>Use the button below to stop receiving the newsletter.</p>
      <TokenAction token={token} action="unsubscribe" />
    </main>
  );
}
