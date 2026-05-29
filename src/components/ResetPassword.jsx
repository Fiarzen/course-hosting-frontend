import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';
import { Leaf, Field } from './Leaf';
import { AuthShell } from './AuthShell';

function useQuery() {
  const location = useLocation();
  return new URLSearchParams(location.search);
}

function ResetPassword() {
  const query = useQuery();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const t = query.get('token') || '';
    setToken(t);
  }, [query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError('Missing or invalid reset token. Please request a new password reset link.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPasswordWithToken(token, password);
      setSuccessMessage('Your password has been reset successfully. Taking you to sign in…');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may be invalid or expired.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      kicker="reset"
      title="Set a new password"
      intro="Choose something you'll remember. We'll take you back to sign in once it's done."
      progress={4}
    >
      {successMessage ? (
        <div>
          <div
            className="mb-6 flex items-center gap-3.5 rounded px-6 py-5"
            style={{ background: 'var(--moss-wash)', border: '1px solid color-mix(in oklab, var(--moss-soft) 60%, transparent)', color: 'var(--moss-deep)' }}
          >
            <Leaf size={18} strokeWidth={0} />
            <div className="text-[14px]">{successMessage}</div>
          </div>
          <Link to="/login" className="ml-button-ghost">go to sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div
              role="alert"
              className="mb-6 rounded px-4 py-3 text-[13px]"
              style={{ background: 'color-mix(in oklab, var(--gold) 12%, transparent)', color: 'var(--ink)', border: '1px solid color-mix(in oklab, var(--gold) 40%, transparent)' }}
            >
              {error}
            </div>
          )}

          <Field label="New password" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              placeholder="••••••••"
              className="ml-input"
            />
          </Field>

          <Field label="Confirm new password" required>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              placeholder="••••••••"
              className="ml-input"
            />
          </Field>

          <div className="mt-6 flex items-center justify-between gap-4">
            <button type="submit" disabled={loading} className="ml-button-primary">
              {loading ? 'resetting…' : 'reset password'}
            </button>
            <Link to="/login" className="text-[13px] text-ink-soft">remembered it? sign in</Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

export default ResetPassword;
