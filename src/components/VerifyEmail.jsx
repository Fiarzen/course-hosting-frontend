import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { authApi } from '../api/api';
import { useAuth } from '../context/AuthContext';

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
        // Refresh user in context so emailVerified updates without re-login
        refreshUser().catch(() => {});
      })
      .catch((err) => {
        setStatus('error');
        setError(
          err.response?.data?.error ||
            'Failed to verify email. The link may be invalid or expired.',
        );
      });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="text-emerald-600 text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email verified</h2>
              <p className="text-gray-600 mb-6">
                Your email address has been verified successfully.
              </p>
              <Link
                to="/login"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              >
                Go to login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">✕</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification failed</h2>
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
                {error}
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  Need a new link?{' '}
                  <Link to="/profile" className="text-emerald-700 hover:text-emerald-900 font-medium">
                    Resend from your profile
                  </Link>
                </p>
                <p>
                  <Link to="/login" className="text-emerald-700 hover:text-emerald-900 font-medium">
                    Back to login
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
