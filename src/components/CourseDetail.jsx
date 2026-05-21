import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesApi, lessonsApi, enrollmentApi, paymentsApi } from '../api/api';

function formatPrice(priceCents, currency) {
  if (!priceCents || !currency) return null;
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceCents / 100);
  } catch {
    return `${currency.toUpperCase()} ${(priceCents / 100).toFixed(2)}`;
  }
}

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonProgress, setLessonProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    if (courseId) {
      loadCourse();
      loadLessons();
      if (isAuthenticated) {
        checkEnrollment();
        loadProgress();
        loadPaymentStatus();
      }
    }
  }, [courseId, isAuthenticated]);

  const loadCourse = async () => {
    try {
      const courses = await coursesApi.getAll();
      const foundCourse = courses.find(c => c.id === parseInt(courseId));
      if (foundCourse) {
        setCourse(foundCourse);
      } else {
        setError('Course not found');
      }
    } catch (err) {
      setError('Failed to load course');
      console.error(err);
    }
  };

  const loadLessons = async () => {
    try {
      const numericCourseId = parseInt(courseId, 10);
      if (Number.isNaN(numericCourseId)) return;
      const data = await lessonsApi.getByCourse(numericCourseId);
      setLessons(data);
    } catch (err) {
      setError('Failed to load lessons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const enrolledCourses = await enrollmentApi.getMyCourses();
      const enrolled = enrolledCourses.some(e => e.course.id === parseInt(courseId));
      setIsEnrolled(enrolled);
    } catch (err) {
      console.error('Failed to check enrollment:', err);
    }
  };

  const loadPaymentStatus = async () => {
    try {
      const status = await paymentsApi.getPaymentStatus(parseInt(courseId, 10));
      setPaymentStatus(status);
    } catch (err) {
      console.error('Failed to load payment status:', err);
    }
  };

  const loadProgress = async () => {
    try {
      const numericCourseId = parseInt(courseId, 10);
      if (Number.isNaN(numericCourseId)) return;
      const progress = await enrollmentApi.getCourseProgress(numericCourseId);
      const progressMap = {};
      progress.lessons.forEach(lp => {
        progressMap[lp.lesson.id] = lp.completed;
      });
      setLessonProgress(progressMap);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 403 || err.response?.status === 404) {
        console.warn('Failed to load course progress (likely not enrolled yet):', err.response?.data || err.message);
      } else {
        console.error('Failed to load progress:', err);
      }
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollmentApi.enrollInCourse(parseInt(courseId));
      setIsEnrolled(true);
      await loadProgress();
      await loadPaymentStatus();
      alert('Successfully enrolled in course!');
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.error;
      const code = err.response?.data?.code;

      if (status === 409) {
        setIsEnrolled(true);
        await loadProgress();
        alert('You are already enrolled in this course.');
      } else if (status === 402 || code === 'PAYMENT_REQUIRED') {
        alert('This is a paid course. Please purchase it to enroll.');
      } else if (status === 403 && backendMessage?.includes('allowlist')) {
        alert('This course is restricted to an allowlist of users, and your account is not on that list.');
      } else if (backendMessage) {
        alert(backendMessage);
      } else {
        alert('Failed to enroll in course. Please try again.');
      }
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleBuyNow = async () => {
    setCheckingOut(true);
    try {
      const result = await paymentsApi.createCheckoutSession(parseInt(courseId));
      sessionStorage.setItem('stripeCheckout', JSON.stringify({ courseId: parseInt(courseId) }));
      window.location.href = result.checkoutUrl;
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error;
      if (code === 'ALREADY_ENROLLED') {
        setIsEnrolled(true);
        await loadProgress();
        alert('You are already enrolled in this course.');
      } else if (msg) {
        alert(msg);
      } else {
        alert('Failed to start checkout. Please try again.');
      }
      console.error(err);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    try {
      await enrollmentApi.completeLesson(lessonId);
      setLessonProgress(prev => ({ ...prev, [lessonId]: true }));
      await loadProgress();
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.error;
      if (status === 403 || status === 401) {
        alert(backendMessage || 'You cannot mark this lesson as complete because you are not enrolled.');
      } else {
        alert('Failed to mark lesson as complete. Please try again.');
      }
      console.error(err);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('youtube.com/watch?v=', 'youtube.com/embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <button onClick={() => navigate('/')} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded">
          Back to Courses
        </button>
      </div>
    );
  }

  const isPaid = course?.isPaid;
  const priceLabel = isPaid ? formatPrice(course?.priceCents, course?.currency) : null;
  const hasPendingPurchase = paymentStatus?.purchase?.status === 'PENDING';
  const hasSucceededPurchase = paymentStatus?.purchase?.status === 'SUCCEEDED';

  // Author/admin always see enroll directly; free courses allow direct enroll
  const isAuthorOrAdmin = user?.role === 'ADMIN' || (course?.authorId === user?.id);
  const canEnrollDirectly = !isPaid || hasSucceededPurchase || isAuthorOrAdmin;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/courses')}
            className="text-indigo-600 hover:text-indigo-800 mb-4"
          >
            Back to Courses
          </button>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{course?.title}</h1>
            {isPaid && priceLabel && (
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full">
                {priceLabel}
              </span>
            )}
            {!isPaid && (
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                Free
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-4">{course?.description || 'No description'}</p>
          {course?.author && (
            <p className="text-sm text-gray-500">
              Author: {course.author.name || course.author.email}
            </p>
          )}

          {isAuthenticated && !isEnrolled && (
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              {isPaid && !canEnrollDirectly && (
                <button
                  onClick={handleBuyNow}
                  disabled={checkingOut}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
                >
                  {checkingOut ? 'Redirecting to payment...' : `Buy Now — ${priceLabel}`}
                </button>
              )}
              {canEnrollDirectly && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                </button>
              )}
              {hasPendingPurchase && !hasSucceededPurchase && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  You have a pending payment. Complete checkout or wait for it to process.
                </p>
              )}
            </div>
          )}

          {isAuthenticated && isEnrolled && (
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-green-700 font-medium text-sm bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                Enrolled
              </span>
              {hasSucceededPurchase && paymentStatus?.purchase?.paidAt && (
                <span className="text-xs text-gray-400">
                  Purchased {new Date(paymentStatus.purchase.paidAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lessons</h2>
          {lessons.length === 0 ? (
            !isAuthenticated ? (
              <p className="text-gray-500">
                Please log in to see lessons for this course.
              </p>
            ) : (
              <p className="text-gray-500">No lessons available for this course yet.</p>
            )
          ) : (
            <div className="space-y-6">
              {lessons.map((lesson, index) => {
                const isCompleted = lessonProgress[lesson.id] || false;
                const embedUrl = getEmbedUrl(lesson.videoUrl);
                const canViewContent = isAuthenticated && isEnrolled;

                return (
                  <div
                    key={lesson.id}
                    className={`bg-white rounded-lg shadow-md p-6 ${isCompleted ? 'border-2 border-green-300' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-indigo-600">Lesson {index + 1}</span>
                          {isCompleted && (
                            <span className="text-green-600 text-sm">Completed</span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                        {canViewContent && (
                          <p className="text-gray-600 mb-4">{lesson.content || 'No content'}</p>
                        )}
                        {!canViewContent && (
                          <p className="text-gray-500 text-sm mb-4">
                            {isPaid && !isEnrolled
                              ? 'Purchase this course to view full lesson content.'
                              : 'Enroll in this course to view full lesson content.'}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded"
                        >
                          View Lesson
                        </button>
                      </div>
                    </div>

                    {canViewContent && embedUrl && (
                      <div className="mb-4">
                        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded">
                          <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={embedUrl}
                            title={lesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    )}

                    {canViewContent && lesson.pdfUrl && (
                      <div className="mb-4">
                        <a
                          href={lesson.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-red-600 hover:text-red-800"
                        >
                          View PDF
                        </a>
                      </div>
                    )}

                    {isAuthenticated && isEnrolled && !isCompleted && (
                      <button
                        onClick={() => handleCompleteLesson(lesson.id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
                      >
                        Mark as Complete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
