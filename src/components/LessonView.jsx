import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lessonsApi, enrollmentApi } from '../api/api';
import { playCompletionSound } from '../utils/sound';
import './LessonView.css';

function LessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessError, setAccessError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [courseCompletedCount, setCourseCompletedCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setAccessError(null);

      try {
        // Always load the ordered lessons list so we know previous/next positions.
        const list = await lessonsApi.getByCourse(parseInt(courseId));
        setLessons(list);

        // Then load the full lesson content; backend will enforce enrollment/role access.
        const fullLesson = await lessonsApi.getById(parseInt(lessonId));
        setCurrentLesson(fullLesson);

        // Load enrollment/progress to determine if Mark Complete should be shown
        try {
          const progress = await enrollmentApi.getCourseProgress(parseInt(courseId));
          setIsEnrolled(true);
          const lp = progress.lessons.find((p) => p.lesson.id === parseInt(lessonId));
          setIsCompleted(lp?.completed || false);
          setCourseCompletedCount(progress.lessons.filter((p) => p.completed).length);
        } catch (progressErr) {
          if (progressErr.response?.status === 403) {
            // Not enrolled in course
            setIsEnrolled(false);
            setIsCompleted(false);
          } else {
            console.error('Failed to load course progress for lesson view:', progressErr);
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setAccessError('You must be logged in to view this lesson.');
        } else if (err.response?.status === 403) {
          setAccessError('You must be enrolled in this course (or be the author/admin) to view this lesson.');
        } else if (err.response?.status === 404) {
          setError('Lesson not found.');
        } else {
          setError('Failed to load lesson. Please try again.');
        }
        console.error('Failed to load lesson view:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && lessonId && isAuthenticated) {
      load();
    } else if (!isAuthenticated) {
      setLoading(false);
      setAccessError('You must be logged in to view this lesson.');
    }
  }, [courseId, lessonId, isAuthenticated]);

  const { index, total, prevLessonId, nextLessonId } = useMemo(() => {
    let idx = -1;
    const idNum = parseInt(lessonId);
    lessons.forEach((lesson, i) => {
      if (lesson.id === idNum) {
        idx = i;
      }
    });

    const prevId = idx > 0 ? lessons[idx - 1].id : null;
    const nextId = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1].id : null;

    return {
      index: idx >= 0 ? idx + 1 : null,
      total: lessons.length,
      prevLessonId: prevId,
      nextLessonId: nextId,
    };
  }, [lessons, lessonId]);

  // Helper to convert YouTube URL to embed format
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <div className="mt-4">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Access restricted: </strong>
        <span className="block sm:inline">{accessError}</span>
        <div className="mt-4 space-x-2">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back to Course
          </button>
          <Link
            to="/login"
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return null;
  }

  const embedUrl = getEmbedUrl(currentLesson.videoUrl);

  const handleCompleteLesson = async () => {
    setCompleting(true);
    try {
      await enrollmentApi.completeLesson(parseInt(lessonId));
      setIsCompleted(true);
      setCourseCompletedCount((prev) => prev + 1);
      playCompletionSound();
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.error;

      if (status === 403 || status === 401) {
        alert(backendMessage || 'You cannot mark this lesson as complete because you are not enrolled in this course.');
      } else {
        alert('Failed to mark lesson as complete. Please try again.');
      }
      console.error('Failed to mark lesson complete from LessonView:', err);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="lesson-view px-4 py-6 sm:px-0">
      <div className="lesson-view__container max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="lesson-view__back-button text-indigo-600 hover:text-indigo-800 mb-4"
        >
          ← Back to Course
        </button>

        {isEnrolled && total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{courseCompletedCount} / {total} lessons completed</span>
              <span>{Math.round((courseCompletedCount / total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(courseCompletedCount / total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="lesson-view__header mb-4 flex items-center justify-between">
          <div>
            <h1 className="lesson-view__title text-3xl font-bold text-gray-900 mb-1">{currentLesson.title}</h1>
            <p className="lesson-view__meta text-sm text-gray-600">
              Course ID: {courseId}
              {index && total ? ` • Lesson ${index} of ${total}` : null}
            </p>
          </div>
          <div className="lesson-view__nav flex space-x-2">
            <button
              disabled={!prevLessonId}
              onClick={() => prevLessonId && navigate(`/courses/${courseId}/lessons/${prevLessonId}`)}
              className={`lesson-view__nav-btn lesson-view__nav-btn--prev px-3 py-2 rounded text-sm font-medium ${
                prevLessonId
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              ← Previous
            </button>
            <button
              disabled={!nextLessonId}
              onClick={() => nextLessonId && navigate(`/courses/${courseId}/lessons/${nextLessonId}`)}
              className={`lesson-view__nav-btn lesson-view__nav-btn--next px-3 py-2 rounded text-sm font-medium ${
                nextLessonId
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-indigo-50 text-indigo-300 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          </div>
        </div>

        <div className="lesson-view__card bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="lesson-view__content prose max-w-none mb-4">
            <p className="lesson-view__content-text whitespace-pre-wrap text-gray-800">{currentLesson.content || 'No content'}</p>
          </div>

          {isAuthenticated && isEnrolled && (
            <div className="lesson-view__status mb-4 flex items-center justify-between">
              <div>
                {isCompleted && (
                  <span className="lesson-view__status-text text-green-600 text-sm font-medium">✓ Completed</span>
                )}
              </div>
              {!isCompleted && (
                <button
                  onClick={handleCompleteLesson}
                  disabled={completing}
                  className="lesson-view__complete-btn bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completing ? 'Marking...' : 'Mark as Complete'}
                </button>
              )}
            </div>
          )}

          {embedUrl && (
            <div className="lesson-view__video mb-4">
              <div className="lesson-view__video-inner relative pb-[56.25%] h-0 overflow-hidden rounded">
                <iframe
                  className="lesson-view__video-frame absolute top-0 left-0 w-full h-full"
                  src={embedUrl}
                  title={currentLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {currentLesson.pdfUrl && (
            <div className="lesson-view__pdf mb-2">
              <a
                href={currentLesson.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lesson-view__pdf-link inline-flex items-center text-red-600 hover:text-red-800"
              >
                📄 View PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LessonView;
