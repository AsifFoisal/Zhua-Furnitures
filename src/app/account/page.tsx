import Link from 'next/link';
import { requireAuthenticatedPage } from '@/lib/auth';
import { signOutUser } from '@/app/auth/actions';

export default async function AccountPage() {
  const user = await requireAuthenticatedPage('/auth/login');

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <span className="label-accent">My Account</span>
        <h1 className="heading-xl" style={{ color: 'var(--text-primary)', margin: '1rem 0 1.25rem' }}>Account Dashboard</h1>

        <article style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.02rem', margin: 0 }}>Signed in as</h2>
            <p style={{ color: 'var(--text-dim)', margin: '0.4rem 0 0' }}>{user.email ?? 'No email available'}</p>
          </div>
          <form action={signOutUser}>
            <button type="submit" className="btn btn-outline btn-sm">
              Sign Out
            </button>
          </form>
        </article>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <article style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1rem' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.4rem' }}>Orders</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>View your order history and statuses.</p>
            <Link href="/account/orders" className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>View Orders</Link>
          </article>
          <article style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1rem' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.4rem' }}>Profile</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Manage your profile details and preferences.</p>
            <Link href="/account/profile" className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>Open Profile</Link>
          </article>
          <article style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1rem' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.4rem' }}>Security</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Change your password and keep your account secure.</p>
            <Link href="/account/password" className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>Change Password</Link>
          </article>
          <article style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1rem' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.4rem' }}>Wishlist</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Your saved pieces for future rooms.</p>
            <Link href="/account/wishlist" className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>Open Wishlist</Link>
          </article>
          <article style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1rem' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.4rem' }}>Activity</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Review your recent account and product activity.</p>
            <Link href="/account/activity" className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>View Timeline</Link>
          </article>
        </div>
      </div>
    </div>
  );
}
