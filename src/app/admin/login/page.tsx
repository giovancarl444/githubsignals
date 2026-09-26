import { AdminLogin } from '@/components/admin-login';
export const metadata = { title: 'Editor sign-in', robots: { index: false, follow: false } };
export default function Login() {
  return (
    <main id="main" className="shell page article" style={{ maxWidth: 480 }}>
      <span className="eyebrow">THE EDITORIAL DESK</span>
      <h1>Welcome back.</h1>
      <AdminLogin />
    </main>
  );
}
