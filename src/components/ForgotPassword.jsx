import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/api';

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
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-md mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Forgot password</h2>
        <p className="text-gray-600 text-center mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          {submitted ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded mb-6">
                <p className="font-medium">Check your inbox</p>
                <p className="text-sm mt-1">
                  If <span className="font-medium">{email}</span> is registered, a password reset
                  link has been sent. It expires in 1 hour.
                </p>
              </div>
              <Link
                to="/login"
                className="text-sm text-emerald-700 hover:text-emerald-900 font-medium"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-emerald-500"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <Link to="/login" className="text-sm text-emerald-700 hover:text-emerald-900">
                  Back to login
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
