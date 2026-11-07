import { requireAuthenticatedPage } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const user = await requireAuthenticatedPage('/auth/login');
  let initialValues = {
    fullName: '',
    email: user.email ?? '',
    phone: '',
    avatarUrl: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    marketingEmail: true,
    smsNotifications: false,
  };

  if (hasPublicSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('marketing_email, sms_notifications')
      .eq('user_id', user.id)
      .maybeSingle();

    const address = (profile?.address_primary as {
      line1?: string;
      line2?: string;
      city?: string;
      province?: string;
      postalCode?: string;
    } | null) ?? null;

    initialValues = {
      ...initialValues,
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      avatarUrl: profile?.avatar_url ?? '',
      addressLine1: address?.line1 ?? '',
      addressLine2: address?.line2 ?? '',
      city: address?.city ?? '',
      province: address?.province ?? '',
      postalCode: address?.postalCode ?? '',
      marketingEmail: prefs?.marketing_email ?? true,
      smsNotifications: prefs?.sms_notifications ?? false,
    };
  }

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <span className="label-accent">Account</span>
        <h1 className="heading-xl" style={{ color: 'var(--text-primary)', margin: '1rem 0 1.25rem' }}>Profile</h1>

        <article style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1rem' }}>
          <ProfileForm initialValues={initialValues} />
        </article>
      </div>
    </div>
  );
}
