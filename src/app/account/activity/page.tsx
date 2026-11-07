import Link from 'next/link';
import { requireAuthenticatedPage } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';

function toTitle(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function ActivityPage() {
  const user = await requireAuthenticatedPage('/auth/login');
  const feed: {
    id: string;
    actionType: string;
    resourceType: string;
    resourceId: string | null;
    createdAt: string;
  }[] = [];

  if (hasPublicSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('user_activity_log')
      .select('id, action_type, resource_type, resource_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(120);

    (data ?? []).forEach((entry) => {
      feed.push({
        id: entry.id,
        actionType: entry.action_type,
        resourceType: entry.resource_type,
        resourceId: entry.resource_id,
        createdAt: new Date(entry.created_at).toLocaleString('en-ZA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    });
  }

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <span className="label-accent">Account</span>
        <h1 className="heading-xl" style={{ color: 'var(--text-primary)', margin: '1rem 0 1.25rem' }}>Activity Timeline</h1>

        {feed.length === 0 ? (
          <div style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1.2rem' }}>
            <p style={{ color: 'var(--text-dim)', marginBottom: '0.8rem' }}>No activity captured yet for this account.</p>
            <Link href="/shop" className="btn btn-primary btn-sm">Browse Shop</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {feed.map((event) => (
              <article key={event.id} style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '0.9rem 1rem', display: 'grid', gap: '0.25rem' }}>
                <p style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>{toTitle(event.actionType)}</p>
                <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.9rem' }}>
                  {toTitle(event.resourceType)}{event.resourceId ? ` · ${event.resourceId}` : ''}
                </p>
                <p style={{ color: '#7e9ab8', margin: 0, fontSize: '0.8rem' }}>{event.createdAt}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
