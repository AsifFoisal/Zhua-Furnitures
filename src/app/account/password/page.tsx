import { requireAuthenticatedPage } from '@/lib/auth';
import PasswordForm from './PasswordForm';

export default async function AccountPasswordPage() {
  await requireAuthenticatedPage('/auth/login');

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <span className="label-accent">Account</span>
        <h1 className="heading-xl" style={{ color: 'var(--text-primary)', margin: '1rem 0 1.25rem' }}>Change Password</h1>

        <article style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1rem' }}>
          <PasswordForm />
        </article>
      </div>
    </div>
  );
}
