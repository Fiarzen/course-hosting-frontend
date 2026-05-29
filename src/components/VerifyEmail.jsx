import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { authApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Leaf, Kicker, LeafLoader } from './Leaf';

function useQuery() {
  const location = useLocation();
  return new URLSearchParams(location.search);
}

function VerifyEmail() {
  const query = useQuery();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = query.get('token');
    if (!token) {
      setStatus('error');
      setError('Missing verification token. Please use the link from your email.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        refreshUser().catch(() => {});
      })
      .catch((err) => {
        setStatus('error');
        setError(
          err.response?.data?.error ||
            'Failed to verify email. The link may be invalid or expired.',
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ml-screen-fade max-w-[560px] mx-auto py-24 text-center">
      {status === 'loading' && (
        <>
          <LeafLoader label="verifying email" />
          <p className="text-ink-soft text-[14px] -mt-8">Verifying your email…</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="inline-flex mb-7" style={{ color: 'var(--moss)' }}>
            <Leaf size={48} strokeWidth={0} tilt={-12} />
          </div>
          <Kicker className="mb-4">verified</Kicker>
          <h1 className="font-serif text-[clamp(34px,5vw,48px)] leading-[1.05] tracking-tight2 text-ink mb-4">Email verified.</h1>
          <p className="text-[16px] text-ink-soft leading-relaxed mb-9">
            Your email address has been verified successfully.
          </p>
          <Link to="/login" className="ml-button-primary">
            go to sign in
            <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <Kicker className="mb-4 text-ink-faint normal-case">verification failed</Kicker>
          <h1 className="font-serif text-[clamp(34px,5vw,48px)] leading-[1.05] tracking-tight2 text-ink mb-4">That link didn't work.</h1>
          <div
            className="rounded px-4 py-3 text-[13px] mb-7 inline-block"
            style={{ background: 'color-mix(in oklab, var(--gold) 12%, transparent)', color: 'var(--ink)', border: '1px solid color-mix(in oklab, var(--gold) 40%, transparent)' }}
            role="alert"
          >
            {error}
          </div>
          <div className="flex flex-col items-center gap-2 text-[14px]">
            <p className="text-ink-soft">
              Need a new link?{' '}
              <Link to="/profile" className="ml-link">resend from your profile</Link>
            </p>
            <Link to="/login" className="ml-link">back to sign in</Link>
          </div>
        </>
      )}
    </div>
  );
}

export default VerifyEmail;
