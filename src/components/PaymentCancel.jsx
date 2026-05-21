import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function PaymentCancel() {
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('stripeCheckout');
    if (stored) {
      try {
        const { courseId: cid } = JSON.parse(stored);
        setCourseId(cid);
        // Keep it in sessionStorage in case they want to retry — success page clears it
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">↩</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment cancelled</h1>
      <p className="text-gray-600 mb-8">
        No charge was made. You can try again whenever you're ready.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {courseId && (
          <Link
            to={`/courses/${courseId}`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded transition"
          >
            Back to Course
          </Link>
        )}
        <Link
          to="/courses"
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-6 rounded transition"
        >
          Browse Courses
        </Link>
      </div>
    </div>
  );
}

export default PaymentCancel;
