'use client';

import { useActionState } from 'react';
import { useToastFeedback } from '@/lib/toast-feedback';
import { changePassword, type ChangePasswordState } from './actions';

const initialState: ChangePasswordState = {};

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initialState);

  useToastFeedback({ error: state.error, success: state.success });

  return (
    <form action={action} style={{ display: 'grid', gap: '0.8rem' }}>
      <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
        Current Password
        <input className="form-input" name="currentPassword" type="password" required />
      </label>
      <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
        New Password
        <input className="form-input" name="newPassword" type="password" minLength={8} required />
      </label>
      <label style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
        Confirm New Password
        <input className="form-input" name="confirmPassword" type="password" minLength={8} required />
      </label>

      {state.error ? <p style={{ color: 'var(--status-danger)', margin: 0 }}>{state.error}</p> : null}
      {state.success ? <p style={{ color: '#b6eccf', margin: 0 }}>{state.success}</p> : null}

      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}
