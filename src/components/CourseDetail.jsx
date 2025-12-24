import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesApi, lessonsApi, enrollmentApi } from '../api/api';

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

  useEffect(() => {
    if (courseId) {
      loadCourse();
      loadLessons();
      if (isAuthenticated) {
        checkEnrollment();
        loadProgress();
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
      const data = await lessonsApi.getByCourse(parseInt(courseId));
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

  const loadProgress = async () => {
    try {
      const progress = await enrollmentApi.getCourseProgress(parseInt(courseId));
      const progressMap = {};
      progress.lessons.forEach(lp => {
        progressMap[lp.lesson.id] = lp.completed;
      });
      setLessonProgress(progressMap);
    } catch (err) {
      // Not enrolled or other error, ignore
      console.error('Failed to load progress:', err);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollmentApi.enrollInCourse(parseInt(courseId));
      setIsEnrolled(true);
      await loadProgress();
      alert('Successfully enrolled in course!');
    } catch (err) {
      if (err.response?.status === 409) {
        setIsEnrolled(true);
        await loadProgress();
      } else {
        alert('Failed to enroll in course. Please try again.');
      }
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800 mb-4"
          >
            ← Back to Courses
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{course?.title}</h1>
          <p className="text-gray-600 mb-4">{course?.description || 'No description'}</p>
          {course?.author && (
            <p className="text-sm text-gray-500">
              Author: {course.author.name || course.author.email}
            </p>
          )}
          {isAuthenticated && !isEnrolled && (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {enrolling ? 'Enrolling...' : 'Enroll in Course'}
            </button>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lessons</h2>
          {lessons.length === 0 ? (
            <p className="text-gray-500">No lessons available for this course yet.</p>
          ) : (
            <div className="space-y-6">
              {lessons.map((lesson, index) => {
                const isCompleted = lessonProgress[lesson.id] || false;
                const embedUrl = getEmbedUrl(lesson.videoUrl);
                
                return (
                  <div
                    key={lesson.id}
                    className={`bg-white rounded-lg shadow-md p-6 ${
                      isCompleted ? 'border-2 border-green-300' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-indigo-600">Lesson {index + 1}</span>
                          {isCompleted && (
                            <span className="text-green-600 text-sm">✓ Completed</span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                        <p className="text-gray-600 mb-4">{lesson.content || 'No content'}</p>
                      </div>
                    </div>

                    {embedUrl && (
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

                    {lesson.pdfUrl && (
                      <div className="mb-4">
                        <a
                          href={lesson.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-red-600 hover:text-red-800"
                        >
                          📄 View PDF
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

