import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentsApi } from '../api/api';

const MAX_POLLS = 10;
const POLL_INTERVAL_MS = 2000;

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const sessionId = searchParams.get('session_id');

  const [courseId, setCourseId] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | enrolled | pending | error
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem('stripeCheckout');
    if (stored) {
      try {
        const { courseId: cid } = JSON.parse(stored);
        setCourseId(cid);
        sessionStorage.removeItem('stripeCheckout');
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !courseId) {
      if (!isAuthenticated) setStatus('error');
      return;
    }

    let cancelled = false;
    let timer;

    const poll = async () => {
      if (cancelled) return;
      try {
        const result = await paymentsApi.getPaymentStatus(courseId);
        if (cancelled) return;
        if (result.isEnrolled || result.purchase?.status === 'SUCCEEDED') {
          setStatus('enrolled');
          return;
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }

      setPollCount((prev) => {
        const next = prev + 1;
        if (next >= MAX_POLLS) {
          setStatus('pending');
        } else {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
        return next;
      });
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isAuthenticated, courseId]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-gray-600 text-sm">Confirming your payment…</p>
      </div>
    );
  }

  if (status === 'enrolled') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment successful!</h1>
        <p className="text-gray-600 mb-8">
          You are now enrolled and can start learning right away.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {courseId && (
            <Link
              to={`/courses/${courseId}`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded transition"
            >
              Go to Course
            </Link>
          )}
          <Link
            to="/profile"
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-6 rounded transition"
          >
            My Enrolled Courses
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment received</h1>
        <p className="text-gray-600 mb-8">
          Your payment is processing. Your enrollment will be activated shortly — check your enrolled
          courses in a moment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {courseId && (
            <Link
              to={`/courses/${courseId}`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded transition"
            >
              View Course
            </Link>
          )}
          <Link
            to="/profile"
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-6 rounded transition"
          >
            My Enrolled Courses
          </Link>
        </div>
      </div>
    );
  }

  // error state
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Something went wrong</h1>
      <p className="text-gray-600 mb-8">
        We couldn't confirm your enrollment. If you completed payment, please check your enrolled
        courses or contact support.
      </p>
      <Link to="/courses" className="text-emerald-600 hover:underline font-medium">
        Back to Courses
      </Link>
    </div>
  );
}

export default PaymentSuccess;
