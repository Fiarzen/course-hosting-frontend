import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesApi, lessonsApi, paymentsApi } from '../api/api';
import { formatPrice, CURRENCY_OPTIONS } from '../utils/pricing';

function MyCourses() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [courses, setCourses] = useState([]);
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingOrder, setSavingOrder] = useState({});
  const [deletingLesson, setDeletingLesson] = useState({});
  const [savingAccess, setSavingAccess] = useState({});
  const [accessForm, setAccessForm] = useState({}); // { [courseId]: { restrictedToAllowList, allowedEmailsText } }
  const [deletingCourse, setDeletingCourse] = useState({});
  const [pricingForm, setPricingForm] = useState({}); // { [courseId]: { isPaid, priceInput, currency } }
  const [savingPricing, setSavingPricing] = useState({});

  const isCreatorOrAdmin = user?.role === 'CREATOR' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isCreatorOrAdmin) {
      setLoading(false);
      setError('Only creators or admins can access this page.');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await coursesApi.getMyCreated();
        setCourses(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load created courses:', err);
        const backendMessage = err.response?.data?.error;
        if (backendMessage) {
          setError(`Failed to load your courses: ${backendMessage}`);
        } else {
          setError('Failed to load your courses. Make sure you are logged in as a creator or admin.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, isCreatorOrAdmin, navigate]);

  const loadLessonsForCourse = async (courseId) => {
    try {
      const lessons = await lessonsApi.getByCourse(courseId);
      setLessonsByCourse((prev) => ({
        ...prev,
        [courseId]: lessons,
      }));
    } catch (err) {
      console.error('Failed to load lessons for course', courseId, err);
      alert('Failed to load lessons for this course.');
    }
  };

  const handleMoveLesson = (courseId, index, direction) => {
    setLessonsByCourse((prev) => {
      const list = prev[courseId] ? [...prev[courseId]] : [];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= list.length) return prev;
      const tmp = list[index];
      list[index] = list[newIndex];
      list[newIndex] = tmp;
      return {
        ...prev,
        [courseId]: list,
      };
    });
  };

  const handleSaveOrder = async (courseId) => {
    const lessons = lessonsByCourse[courseId] || [];
    const ids = lessons.map((l) => l.id);
    setSavingOrder((prev) => ({ ...prev, [courseId]: true }));
    try {
      const updated = await lessonsApi.reorderForCourse(courseId, ids);
      setLessonsByCourse((prev) => ({
        ...prev,
        [courseId]: updated,
      }));
    } catch (err) {
      console.error('Failed to save lesson order:', err);
      alert('Failed to save lesson order. Please try again.');
    } finally {
      setSavingOrder((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleDeleteLesson = async (courseId, lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    setDeletingLesson((prev) => ({ ...prev, [lessonId]: true }));
    try {
      await lessonsApi.delete(lessonId);
      // Reload lessons for this course
      await loadLessonsForCourse(courseId);
    } catch (err) {
      console.error('Failed to delete lesson:', err);
      alert('Failed to delete lesson. Please try again.');
    } finally {
      setDeletingLesson((prev) => ({ ...prev, [lessonId]: false }));
    }
  };

  const handleAccessChange = (courseId, field, value) => {
    setAccessForm((prev) => ({
      ...prev,
      [courseId]: {
        restrictedToAllowList: prev[courseId]?.restrictedToAllowList ?? false,
        allowedEmailsText: prev[courseId]?.allowedEmailsText ?? '',
        ...{
          [field]: value,
        },
      },
    }));
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This will remove all its lessons and enrollments.')) {
      return;
    }
    setDeletingCourse((prev) => ({ ...prev, [courseId]: true }));
    try {
      await coursesApi.delete(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert(err.response?.data?.error || 'Failed to delete course. Please try again.');
    } finally {
      setDeletingCourse((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleSaveAccess = async (courseId) => {
    const form = accessForm[courseId];
    const course = courses.find((c) => c.id === courseId);
    if (!course && !form) return;

    const restricted = form?.restrictedToAllowList ?? course?.restrictedToAllowList ?? false;
    const raw = form?.allowedEmailsText ?? (course?.allowedEmails || []).join(', ');
    const allowedEmails = raw
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    setSavingAccess((prev) => ({ ...prev, [courseId]: true }));
    try {
      const updated = await coursesApi.updateAccess(courseId, {
        restrictedToAllowList: restricted,
        allowedEmails,
      });

      // Update local courses state with new access info
      setLessonsByCourse((prev) => ({ ...prev })); // no-op, just to ensure rerender
    } catch (err) {
      console.error('Failed to update course access:', err);
      alert('Failed to update course access. Please try again.');
    } finally {
      setSavingAccess((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const getPricingForm = (course) => {
    const form = pricingForm[course.id];
    return {
      isPaid: form?.isPaid ?? course.isPaid ?? false,
      priceInput: form?.priceInput ?? (course.priceCents ? (course.priceCents / 100).toFixed(2) : ''),
      currency: form?.currency ?? course.currency ?? 'gbp',
    };
  };

  const handlePricingChange = (courseId, field, value) => {
    setPricingForm((prev) => ({
      ...prev,
      [courseId]: {
        ...getPricingForm({ id: courseId, ...courses.find((c) => c.id === courseId) }),
        ...prev[courseId],
        [field]: value,
      },
    }));
  };

  const handleSavePricing = async (courseId) => {
    const form = getPricingForm(courses.find((c) => c.id === courseId) || { id: courseId });
    setSavingPricing((prev) => ({ ...prev, [courseId]: true }));
    try {
      let priceCents = null;
      if (form.isPaid) {
        const parsed = parseFloat(form.priceInput);
        if (isNaN(parsed) || parsed <= 0) {
          alert('Please enter a valid price greater than 0.');
          return;
        }
        priceCents = Math.round(parsed * 100);
      }
      const updated = await paymentsApi.updatePricing(courseId, {
        isPaid: form.isPaid,
        priceCents,
        currency: form.isPaid ? form.currency : null,
      });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, isPaid: updated.isPaid, priceCents: updated.priceCents, currency: updated.currency }
            : c
        )
      );
      // Clear local form overrides so display reverts to saved state
      setPricingForm((prev) => ({ ...prev, [courseId]: undefined }));
      alert('Pricing saved.');
    } catch (err) {
      console.error('Failed to save pricing:', err);
      alert(err.response?.data?.error || 'Failed to save pricing. Please try again.');
    } finally {
      setSavingPricing((prev) => ({ ...prev, [courseId]: false }));
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">My Courses</h2>
          <button
            onClick={() => navigate('/courses/create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
          >
            + Create Course
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">You haven't created any courses yet.</p>
            <button
              onClick={() => navigate('/courses/create')}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              Create your first course
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-1">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{course.description || 'No description'}</p>
                    <p className="text-xs text-gray-500">Course ID: {course.id}</p>
                    <p className="text-xs mt-1">
                      {course.restrictedToAllowList ? (
                        <span className="text-red-600 font-medium">Restricted to allowlist</span>
                      ) : (
                        <span className="text-green-600">Open to all enrolled users</span>
                      )}
                    </p>
                    <p className="text-xs mt-1">
                      {course.isPaid ? (
                        <span className="text-amber-700 font-medium">
                          Paid — {formatPrice(course.priceCents, course.currency) || '(price not set)'}
                        </span>
                      ) : (
                        <span className="text-green-600">Free</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Link
                      to={`/courses/${course.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-1 px-3 rounded text-center"
                    >
                      View Course
                    </Link>
                    <button
                      onClick={() => navigate(`/lessons/create?courseId=${course.id}`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-1 px-3 rounded"
                    >
                      + Add Lesson
                    </button>
                    <button
                      onClick={() => loadLessonsForCourse(course.id)}
                      className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-1 px-3 rounded"
                    >
                      Manage Lessons
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      disabled={deletingCourse[course.id]}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingCourse[course.id] ? 'Deleting...' : 'Delete Course'}
                    </button>
                  </div>
                </div>

                {/* Access control + Pricing — always visible */}
                <div className="mt-4 border-t border-gray-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded p-3 bg-gray-50">
                    <h5 className="text-sm font-semibold text-gray-800 mb-2">Access control</h5>
                    <label className="inline-flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={accessForm[course.id]?.restrictedToAllowList ?? course.restrictedToAllowList ?? false}
                        onChange={(e) =>
                          handleAccessChange(course.id, 'restrictedToAllowList', e.target.checked)
                        }
                        className="mr-2"
                      />
                      <span className="text-xs text-gray-700 font-medium">
                        Restrict to allowlist of emails
                      </span>
                    </label>
                    <textarea
                      className="mt-1 w-full text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      rows={3}
                      placeholder="user1@example.com, user2@example.com"
                      value={
                        accessForm[course.id]?.allowedEmailsText ??
                        (course.allowedEmails && course.allowedEmails.length > 0
                          ? course.allowedEmails.join(', ')
                          : '')
                      }
                      onChange={(e) =>
                        handleAccessChange(course.id, 'allowedEmailsText', e.target.value)
                      }
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        disabled={savingAccess[course.id]}
                        onClick={() => handleSaveAccess(course.id)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingAccess[course.id] ? 'Saving...' : 'Save access'}
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const pf = getPricingForm(course);
                    return (
                      <div className="border border-gray-200 rounded p-3 bg-gray-50">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">Pricing</h5>
                        <label className="inline-flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={pf.isPaid}
                            onChange={(e) => handlePricingChange(course.id, 'isPaid', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-xs text-gray-700 font-medium">Paid course</span>
                        </label>
                        {pf.isPaid && (
                          <div className="flex gap-2 mt-1">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={pf.priceInput}
                              onChange={(e) => handlePricingChange(course.id, 'priceInput', e.target.value)}
                              className="text-xs border rounded px-2 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="9.99"
                            />
                            <select
                              value={pf.currency}
                              onChange={(e) => handlePricingChange(course.id, 'currency', e.target.value)}
                              className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {CURRENCY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="mt-2 flex justify-end">
                          <button
                            disabled={savingPricing[course.id]}
                            onClick={() => handleSavePricing(course.id)}
                            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingPricing[course.id] ? 'Saving...' : 'Save pricing'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {lessonsByCourse[course.id] && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">Lessons</h4>
                      <button
                        disabled={savingOrder[course.id]}
                        onClick={() => handleSaveOrder(course.id)}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-1 px-3 rounded"
                      >
                        {savingOrder[course.id] ? 'Saving...' : 'Save Order'}
                      </button>
                    </div>

                    {lessonsByCourse[course.id].length === 0 ? (
                      <p className="text-gray-500 text-sm">No lessons yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {lessonsByCourse[course.id].map((lesson, index) => (
                          <li
                            key={lesson.id}
                            className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-xs text-gray-500 w-10">#{index + 1}</span>
                              <span className="text-sm font-medium text-gray-900">{lesson.title}</span>
                              <span className="text-xs text-gray-400">ID: {lesson.id}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleMoveLesson(course.id, index, -1)}
                                disabled={index === 0}
                                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Up
                              </button>
                              <button
                                onClick={() => handleMoveLesson(course.id, index, 1)}
                                disabled={index === lessonsByCourse[course.id].length - 1}
                                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Down
                              </button>
                              <button
                                onClick={() => navigate(`/courses/${course.id}/lessons/${lesson.id}`)}
                                className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
                              >
                                View
                              </button>
                              <button
                                onClick={() => navigate(`/courses/${course.id}/lessons/${lesson.id}/edit`)}
                                className="px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(course.id, lesson.id)}
                                disabled={deletingLesson[lesson.id]}
                                className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingLesson[lesson.id] ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyCourses;
