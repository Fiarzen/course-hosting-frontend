import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lessonsApi, coursesApi, enrollmentApi } from '../api/api';
import { playCompletionSound } from '../utils/sound';
import { Leaf, Kicker, LeafRow, LeafLoader } from './Leaf';

function Lessons() {
  const { user, isAuthenticated } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lessonProgress, setLessonProgress] = useState({});

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
      setError('Failed to load lessons. Make sure the backend is running.');
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
      progress.lessons.forEach((lp) => {
        progressMap[lp.lesson.id] = lp.completed;
      });
      setLessonProgress(progressMap);
    } catch (err) {
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
      setLessonProgress((prev) => ({ ...prev, [lessonId]: true }));
      playCompletionSound();
      await loadProgress();
    } catch (err) {
      alert('Failed to mark lesson as complete. Make sure you are enrolled in the course.');
      console.error(err);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtube.com/watch?v=')) return url.replace('youtube.com/watch?v=', 'youtube.com/embed/');
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
    return url;
  };

  if (loading) {
    return <LeafLoader label="loading lessons" />;
  }

  if (error) {
    return (
      <div className="ml-card p-6 my-12 max-w-page mx-auto" role="alert">
        <strong className="font-serif text-ink">A small pause. </strong>
        <span className="text-ink-soft">{error}</span>
      </div>
    );
  }

  const completedCount = Object.values(lessonProgress).filter(Boolean).length;
  const inputStyle = { background: 'transparent', border: '1px solid var(--hair-strong)', color: 'var(--ink)' };

  return (
    <div className="ml-screen-fade max-w-page mx-auto py-12">
      <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
        <div>
          <Kicker className="mb-4">all lessons</Kicker>
          <h1 className="font-serif text-[clamp(34px,5vw,52px)] leading-[1.05] tracking-tight2 text-ink">Lessons</h1>
        </div>
        {canCreateLesson && (
          <Link to="/lessons/create" className="ml-button-primary">
            new lesson
            <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
          </Link>
        )}
      </div>

      <div className="mb-8 flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[11px] tracking-widest uppercase text-ink-faint">filter by course</span>
        <select
          value={selectedCourseId || ''}
          onChange={(e) => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
          className="text-[14px] px-3 py-2 rounded"
          style={inputStyle}
        >
          <option value="">All lessons</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      {isAuthenticated && selectedCourseId && lessons.length > 0 && (
        <div className="mb-8 flex items-center gap-4">
          <span className="font-mono text-[11px] tracking-widest text-ink-faint">{completedCount}/{lessons.length}</span>
          <div className="overflow-x-auto">
            <LeafRow total={lessons.length} completed={completedCount} size={14} gap={7} />
          </div>
        </div>
      )}

      {lessons.length === 0 ? (
        <div className="text-center py-20 text-ink-faint">
          <Leaf size={40} strokeWidth={1} />
          <p className="mt-4 text-[15px]">No lessons found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {lessons.map((lesson) => {
            const embedUrl = getEmbedUrl(lesson.videoUrl);
            const done = isAuthenticated && selectedCourseId && lessonProgress[lesson.id];
            return (
              <article key={lesson.id} className="ml-card p-7 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-serif text-[22px] text-ink leading-tight">{lesson.title}</h3>
                  {done && (
                    <span className="text-moss shrink-0"><Leaf size={16} strokeWidth={0} /></span>
                  )}
                </div>
                <p className="text-[14px] text-ink-soft leading-relaxed line-clamp-3 mb-4">{lesson.content || 'No content'}</p>

                {lesson.course && (
                  <div className="text-[12px] text-ink-faint mb-3">
                    course:{' '}
                    <Link to={`/courses/${lesson.course.id}`} className="ml-link">{lesson.course.title}</Link>
                  </div>
                )}

                {embedUrl && (
                  <div className="relative w-full overflow-hidden rounded mb-3" style={{ paddingBottom: '56.25%', border: '1px solid var(--hair)' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={embedUrl}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                {lesson.pdfUrl && (
                  <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer" className="ml-link text-[13px] mb-3 inline-flex items-center gap-2">
                    <Leaf size={12} strokeWidth={0} color="var(--moss)" /> open pdf →
                  </a>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--hair)' }}>
                  <span className="font-mono text-[11px] tracking-wider text-ink-faint">lesson {lesson.id}</span>
                  {isAuthenticated && selectedCourseId && !lessonProgress[lesson.id] && (
                    <button onClick={() => handleCompleteLesson(lesson.id)} className="text-[12px] text-moss-deep flex items-center gap-1.5">
                      <Leaf size={11} strokeWidth={1.2} /> mark complete
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Lessons;
