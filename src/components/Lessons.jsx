import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lessonsApi, coursesApi, enrollmentApi } from '../api/api';

function Lessons() {
  const { user, isAuthenticated } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lessonProgress, setLessonProgress] = useState({});
  
  // Check if user is CREATOR or ADMIN
  const canCreateLesson = user?.role === 'CREATOR' || user?.role === 'ADMIN';

  useEffect(() => {
    loadLessons();
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadLessonsByCourse(selectedCourseId);
    } else {
      loadLessons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const data = await lessonsApi.getAll();
      setLessons(data);
      setError(null);
    } catch (err) {
      setError('Failed to load lessons. Make sure the backend is running on http://localhost:8080');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLessonsByCourse = async (courseId) => {
    try {
      setLoading(true);
      const data = await lessonsApi.getByCourse(courseId);
      setLessons(data);
      setError(null);
    } catch (err) {
      setError('Failed to load lessons for this course.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadProgress = async () => {
    if (!isAuthenticated || !selectedCourseId) return;
    try {
      const progress = await enrollmentApi.getCourseProgress(selectedCourseId);
      const progressMap = {};
      progress.lessons.forEach(lp => {
        progressMap[lp.lesson.id] = lp.completed;
      });
      setLessonProgress(progressMap);
    } catch (err) {
      // If user is not enrolled or backend returns a validation error, just log quietly
      if (err.response?.status === 400 || err.response?.status === 403 || err.response?.status === 404) {
        console.warn('Lessons: failed to load course progress (likely not enrolled yet):', err.response?.data || err.message);
      } else {
        console.error('Failed to load progress:', err);
      }
    }
  };

  useEffect(() => {
    if (selectedCourseId && isAuthenticated) {
      loadProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, isAuthenticated]);

  const handleCompleteLesson = async (lessonId) => {
    try {
      await enrollmentApi.completeLesson(lessonId);
      setLessonProgress(prev => ({ ...prev, [lessonId]: true }));
      await loadProgress(); // Reload to get updated stats
    } catch (err) {
      alert('Failed to mark lesson as complete. Make sure you are enrolled in the course.');
      console.error(err);
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Lessons</h2>
        {canCreateLesson && (
          <Link
            to="/lessons/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
          >
            + Create Lesson
          </Link>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Course:
        </label>
        <select
          id="course-filter"
          value={selectedCourseId || ''}
          onChange={(e) => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
          className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">All Lessons</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No lessons found. Create your first lesson!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{lesson.content || 'No content'}</p>
                {lesson.course && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Course: </span>
                    <Link to={`/courses/${lesson.course.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                      {lesson.course.title}
                    </Link>
                  </div>
                )}
                {isAuthenticated && selectedCourseId && lessonProgress[lesson.id] && (
                  <div className="mb-2">
                    <span className="text-sm text-green-600">✓ Completed</span>
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  {lesson.videoUrl && (
                    <div className="mb-2">
                      {lesson.videoUrl.includes('youtube.com/embed/') || lesson.videoUrl.includes('youtube.com/watch') || lesson.videoUrl.includes('youtu.be/') ? (
                        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded">
                          <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={lesson.videoUrl.includes('youtube.com/embed/') ? lesson.videoUrl : 
                                 lesson.videoUrl.includes('youtube.com/watch?v=') ? lesson.videoUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/') :
                                 lesson.videoUrl.includes('youtu.be/') ? lesson.videoUrl.replace('youtu.be/', 'youtube.com/embed/') : lesson.videoUrl}
                            title={lesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <a
                          href={lesson.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-blue-600 hover:text-blue-800"
                        >
                          📹 View Video
                        </a>
                      )}
                    </div>
                  )}
                  {lesson.pdfUrl && (
                    <a
                      href={lesson.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-red-600 hover:text-red-800"
                    >
                      📄 View PDF
                    </a>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm text-indigo-600 font-medium">ID: {lesson.id}</span>
                  {isAuthenticated && selectedCourseId && !lessonProgress[lesson.id] && (
                    <button
                      onClick={() => handleCompleteLesson(lesson.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Lessons;

