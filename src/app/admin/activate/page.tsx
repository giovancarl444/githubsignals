import { AdminActivate } from '@/components/admin-activate';
export const metadata = {
  title: 'Set your editor password',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default function Activate() {
  return (
    <main id="main" className="shell page article" style={{ maxWidth: 480 }}>
      <span className="eyebrow">THE EDITORIAL DESK</span>
      <h1>Choose your password.</h1>
      <AdminActivate />
    </main>
  );
}
