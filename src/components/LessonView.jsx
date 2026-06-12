import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLeavesCollected } from '../context/LeavesCollectedContext';
import { lessonsApi, enrollmentApi } from '../api/api';
import { playCompletionSound } from '../utils/sound';
import { Leaf, Kicker, LeafRow, LeafLoader } from './Leaf';
import RichTextContent from './RichTextContent';

function LessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { refresh: refreshLeaves } = useLeavesCollected();

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
        const list = await lessonsApi.getByCourse(parseInt(courseId));
        setLessons(list);

        const fullLesson = await lessonsApi.getById(parseInt(lessonId));
        setCurrentLesson(fullLesson);

        try {
          const progress = await enrollmentApi.getCourseProgress(parseInt(courseId));
          setIsEnrolled(true);
          const lp = progress.lessons.find((p) => p.lesson.id === parseInt(lessonId));
          setIsCompleted(lp?.completed || false);
          setCourseCompletedCount(progress.lessons.filter((p) => p.completed).length);
        } catch (progressErr) {
          if (progressErr.response?.status === 403) {
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
    return <LeafLoader label="loading lesson" />;
  }

  if (error) {
    return (
      <div className="ml-card p-6 my-12 max-w-[1080px] mx-auto" role="alert">
        <strong className="font-serif text-ink">A small pause. </strong>
        <span className="text-ink-soft">{error}</span>
        <div className="mt-4">
          <button onClick={() => navigate(`/courses/${courseId}`)} className="ml-button-primary">back to course</button>
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div
        className="ml-card p-6 my-12 max-w-[1080px] mx-auto"
        role="alert"
        style={{ background: 'color-mix(in oklab, var(--gold) 10%, transparent)', borderColor: 'color-mix(in oklab, var(--gold) 35%, transparent)' }}
      >
        <strong className="font-serif text-ink">Access restricted. </strong>
        <span className="text-ink-soft">{accessError}</span>
        <div className="mt-4 flex gap-3 flex-wrap">
          <button onClick={() => navigate(`/courses/${courseId}`)} className="ml-button-ghost">back to course</button>
          <Link to="/login" className="ml-button-primary">sign in</Link>
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
      refreshLeaves();
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
    <div className="ml-screen-fade max-w-[1080px] mx-auto py-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-6 flex-wrap mb-8">
        <button onClick={() => navigate(`/courses/${courseId}`)} className="text-[13px] text-ink-soft">
          ← back to course
        </button>
        {isEnrolled && total > 0 && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] tracking-widest text-ink-faint">
              {courseCompletedCount}/{total}
            </span>
            <div className="overflow-x-auto">
              <LeafRow
                total={total}
                completed={courseCompletedCount}
                size={14}
                gap={7}
                onLeafClick={(i) => {
                  const target = lessons[i];
                  if (target) navigate(`/courses/${courseId}/lessons/${target.id}`);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Video panel */}
      <div
        className="relative w-full overflow-hidden rounded-md mb-9"
        style={{ paddingBottom: '56.25%', background: 'var(--paper-2)', border: '1px solid var(--hair)' }}
      >
        {embedUrl ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            title={currentLesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ background: 'repeating-linear-gradient(135deg, var(--moss-wash) 0 2px, transparent 2px 14px)' }}
          >
            <span
              className="grid place-items-center rounded-full"
              style={{ width: 64, height: 64, border: '1px solid var(--hair-strong)', background: 'var(--paper)', color: 'var(--moss)' }}
            >
              <Leaf size={24} strokeWidth={0} tilt={-18} />
            </span>
          </div>
        )}
      </div>

      {/* Title + meta */}
      <Kicker className="mb-3">
        {index ? `lesson ${String(index).padStart(2, '0')}` : 'lesson'}{total ? ` · of ${total}` : ''}
      </Kicker>
      <h1 className="font-serif text-[clamp(34px,5vw,52px)] leading-[1.08] tracking-tight2 text-ink mb-8">
        {currentLesson.title}
      </h1>

      <RichTextContent html={currentLesson.content} className="max-w-[680px]" />

      {/* PDF notes — embedded inline, with a fallback link below */}
      {currentLesson.pdfUrl && (
        <div className="mt-10">
          <Kicker className="mb-3">lesson notes</Kicker>
          <div
            className="w-full overflow-hidden rounded-md"
            style={{ border: '1px solid var(--hair)', background: 'var(--paper-2)' }}
          >
            <iframe
              src={currentLesson.pdfUrl}
              title="Lesson notes (PDF)"
              className="w-full"
              style={{ height: 'min(80vh, 760px)', border: 0 }}
            />
          </div>
          <a
            href={currentLesson.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-[13px] text-ink-soft"
          >
            <Leaf size={13} strokeWidth={0} tilt={-18} color="var(--moss)" />
            open pdf in a new tab →
          </a>
        </div>
      )}

      {/* Footer: complete + prev/next */}
      <div className="mt-12 pt-8 flex items-center justify-between gap-6 flex-wrap" style={{ borderTop: '1px solid var(--hair)' }}>
        <div>
          {isAuthenticated && isEnrolled && (
            isCompleted ? (
              <span className="ml-pill">
                <Leaf size={11} strokeWidth={0} /> lesson complete
              </span>
            ) : (
              <button onClick={handleCompleteLesson} disabled={completing} className="ml-button-primary">
                {completing ? 'marking…' : 'mark complete'}
                <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
              </button>
            )
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={!prevLessonId}
            onClick={() => prevLessonId && navigate(`/courses/${courseId}/lessons/${prevLessonId}`)}
            className="ml-button-ghost text-[13px] disabled:opacity-40"
          >
            ← previous
          </button>
          <button
            disabled={!nextLessonId}
            onClick={() => nextLessonId && navigate(`/courses/${courseId}/lessons/${nextLessonId}`)}
            className="ml-button-primary text-[13px] disabled:opacity-40"
          >
            next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default LessonView;
