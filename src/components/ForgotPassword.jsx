import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/api';
import { Leaf, Field } from './Leaf';
import { AuthShell } from './AuthShell';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Email is required.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      kicker="reset"
      title={submitted ? 'Letter sent.' : 'Forgot your password?'}
      intro={
        submitted
          ? "We've sent a reset link to that address. Take a breath — check your inbox when ready. It expires in 1 hour."
          : "Tell us the email you signed up with. We'll send a quiet link to set a new one."
      }
      progress={submitted ? 7 : 3}
    >
      {submitted ? (
        <div>
          <div
            className="mb-6 flex items-center gap-3.5 rounded px-6 py-5"
            style={{
              background: 'var(--moss-wash)',
              border: '1px solid color-mix(in oklab, var(--moss-soft) 60%, transparent)',
              color: 'var(--moss-deep)',
            }}
          >
            <Leaf size={18} strokeWidth={0} />
            <div className="text-[14px]">
              A reset link is on its way to{' '}
              <strong className="text-ink">{email || 'your inbox'}</strong>.
            </div>
          </div>
          <Link to="/login" className="ml-button-ghost">back to sign in</Link>
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

          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              required
              autoComplete="email"
              placeholder="you@example.com"
              disabled={loading}
              className="ml-input"
            />
          </Field>

          <div className="mt-6 flex items-center justify-between gap-4">
            <button type="submit" disabled={loading} className="ml-button-primary">
              {loading ? 'sending…' : 'send reset link'}
            </button>
            <Link to="/login" className="text-[13px] text-ink-soft">back to sign in</Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

export default ForgotPassword;
