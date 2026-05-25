import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enrollmentApi, authApi } from '../api/api';
import { formatPrice } from '../utils/pricing';

function Profile() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseProgress, setCourseProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [unenrolling, setUnenrolling] = useState({});
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadEnrolledCourses();
  }, [isAuthenticated, navigate]);

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setVerificationMessage(null);
    try {
      await authApi.resendVerification();
      setVerificationMessage({ type: 'success', text: 'Verification email sent. Check your inbox.' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send verification email.';
      setVerificationMessage({ type: 'error', text: msg });
    } finally {
      setResendingVerification(false);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      const data = await enrollmentApi.getMyCourses();
      setEnrolledCourses(data);
      setError(null);
    } catch (err) {
      setError('Failed to load enrolled courses. Make sure you are logged in.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProgress = async (course) => {
    setSelectedCourse(course);
    setLoadingProgress(true);
    try {
      const progress = await enrollmentApi.getCourseProgress(course.course.id);
      setCourseProgress(progress);
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    try {
      await enrollmentApi.completeLesson(lessonId);
      // Reload progress
      if (selectedCourse) {
        const progress = await enrollmentApi.getCourseProgress(selectedCourse.course.id);
        setCourseProgress(progress);
        // Also reload enrolled courses to update progress
        loadEnrolledCourses();
      }
    } catch (err) {
      console.error('Failed to mark lesson as complete:', err);
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!window.confirm('Are you sure you want to unenroll from this course? Your progress will be removed.')) {
      return;
    }
    setUnenrolling((prev) => ({ ...prev, [courseId]: true }));
    try {
      await enrollmentApi.unenrollFromCourse(courseId);
      setEnrolledCourses((prev) => prev.filter((e) => e.course.id !== courseId));
      if (selectedCourse?.course.id === courseId) {
        setSelectedCourse(null);
        setCourseProgress(null);
      }
    } catch (err) {
      console.error('Failed to unenroll from course:', err);
      alert(err.response?.data?.error || 'Failed to unenroll from course. Please try again.');
    } finally {
      setUnenrolling((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h2>

        {/* User Info */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {user?.name || 'Not set'}</p>
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p>
              <span className="font-medium">Role:</span>{' '}
              <span className={`px-2 py-1 text-xs rounded-full ${
                user?.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-800'
                  : user?.role === 'CREATOR'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                {user?.role || 'STUDENT'}
              </span>
            </p>
            {user?.emailVerified === true && (
              <p className="flex items-center gap-2 text-sm text-green-700">
                <span>Email verified</span>
                <span className="text-green-500">✓</span>
              </p>
            )}
            {user?.emailVerified === false && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">Email not verified</p>
                <p className="text-xs text-amber-700 mt-1">
                  Check your inbox for a verification link, or request a new one.
                </p>
                {verificationMessage && (
                  <p className={`text-xs mt-2 font-medium ${
                    verificationMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {verificationMessage.text}
                  </p>
                )}
                <button
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="mt-2 text-xs bg-amber-600 hover:bg-amber-700 text-white py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendingVerification ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">My Enrolled Courses</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">You haven't enrolled in any courses yet.</p>
              <button
                onClick={() => navigate('/courses')}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrolledCourses.map((enrollment) => (
                <div
                  key={enrollment.course.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2 flex-wrap">
                        <Link to={`/courses/${enrollment.course.id}`}>
                          <h4 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                            {enrollment.course.title}
                          </h4>
                        </Link>
                        {enrollment.course.isPaid ? (
                          <span className="flex-shrink-0 mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                            {formatPrice(enrollment.course.priceCents, enrollment.course.currency) || 'Paid'}
                          </span>
                        ) : (
                          <span className="flex-shrink-0 mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Free
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {enrollment.course.description || 'No description'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                        <span>
                          Progress: {enrollment.completedLessons} / {enrollment.totalLessons} lessons
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${enrollment.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {Math.round(enrollment.progress)}% Complete
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4 sm:space-y-0 sm:space-x-2 sm:flex-row">
                      <button
                        onClick={() => handleViewProgress(enrollment)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded"
                      >
                        View Progress
                      </button>
                      <button
                        onClick={() => handleUnenroll(enrollment.course.id)}
                        disabled={unenrolling[enrollment.course.id]}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {unenrolling[enrollment.course.id] ? 'Unenrolling...' : 'Unenroll'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Progress Modal */}
        {selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedCourse.course.title} - Progress
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCourse(null);
                      setCourseProgress(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {loadingProgress ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : courseProgress ? (
                  <div>
                    <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Completed: {courseProgress.completedLessons} / {courseProgress.totalLessons} lessons
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                        <div
                          className="bg-indigo-600 h-3 rounded-full transition-all"
                          style={{ width: `${courseProgress.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm font-medium text-indigo-600 mt-2">
                        {Math.round(courseProgress.progress)}% Complete
                      </p>
                    </div>

                    <div className="space-y-3">
                      {courseProgress.lessons.map((lessonProgress) => (
                        <div
                          key={lessonProgress.lesson.id}
                          className={`border rounded-lg p-4 ${
                            lessonProgress.completed
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                {lessonProgress.completed ? (
                                  <span className="text-green-600 text-xl">✓</span>
                                ) : (
                                  <span className="text-gray-400 text-xl">○</span>
                                )}
                                <h4 className="font-semibold text-gray-900">
                                  {lessonProgress.lesson.title}
                                </h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {lessonProgress.lesson.content || 'No content'}
                              </p>
                              {lessonProgress.completed && lessonProgress.completedAt && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Completed: {new Date(lessonProgress.completedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            {!lessonProgress.completed && (
                              <button
                                onClick={() => handleCompleteLesson(lessonProgress.lesson.id)}
                                className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-1 px-3 rounded"
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No progress data available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

