'use client';

import { useActionState } from 'react';
import { useToastFeedback } from '@/lib/toast-feedback';
import { updateProfile, type UpdateProfileState } from './actions';

interface ProfileFormValues {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  marketingEmail: boolean;
  smsNotifications: boolean;
}

const initialState: UpdateProfileState = {};

export default function ProfileForm({ initialValues }: { initialValues: ProfileFormValues }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);

  useToastFeedback({ error: state.error, success: state.success });

  return (
    <form action={action} style={{ display: 'grid', gap: '0.8rem' }}>
      <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
        Full Name
        <input className="form-input" name="fullName" defaultValue={initialValues.fullName} required />
      </label>

      <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
        Email
        <input className="form-input" value={initialValues.email} readOnly />
      </label>

      <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
        Phone
        <input className="form-input" name="phone" defaultValue={initialValues.phone} />
      </label>

      <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
        Avatar URL
        <input className="form-input" name="avatarUrl" defaultValue={initialValues.avatarUrl} />
      </label>

      <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
        Address Line 1
        <input className="form-input" name="addressLine1" defaultValue={initialValues.addressLine1} />
      </label>

      <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
        Address Line 2
        <input className="form-input" name="addressLine2" defaultValue={initialValues.addressLine2} />
      </label>

      <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
          City
          <input className="form-input" name="city" defaultValue={initialValues.city} />
        </label>
        <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
          Province
          <input className="form-input" name="province" defaultValue={initialValues.province} />
        </label>
        <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
          Postal Code
          <input className="form-input" name="postalCode" defaultValue={initialValues.postalCode} />
        </label>
      </div>

      <label style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.9rem' }}>
        <input name="marketingEmail" type="checkbox" defaultChecked={initialValues.marketingEmail} />
        Marketing emails
      </label>
      <label style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.9rem' }}>
        <input name="smsNotifications" type="checkbox" defaultChecked={initialValues.smsNotifications} />
        SMS notifications
      </label>

      {state.error ? <p style={{ color: 'var(--status-danger)', margin: 0 }}>{state.error}</p> : null}
      {state.success ? <p style={{ color: '#b6eccf', margin: 0 }}>{state.success}</p> : null}

      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}
