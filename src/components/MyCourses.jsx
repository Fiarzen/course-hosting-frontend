import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesApi, lessonsApi } from '../api/api';

function MyCourses() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [courses, setCourses] = useState([]);
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingOrder, setSavingOrder] = useState({});
  const [deletingLesson, setDeletingLesson] = useState({});

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
                  </div>
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
