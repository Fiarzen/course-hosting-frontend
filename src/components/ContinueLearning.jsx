import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enrollmentApi } from '../api/api';
import { LeafRow, LeafLoader, SectionHeading } from './Leaf';

function ContinueLearning() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;

    const load = async () => {
      try {
        const enrollments = await enrollmentApi.getMyCourses();
        const tending = enrollments
          .filter((e) => (e.totalLessons || 0) > 0 && (e.completedLessons || 0) < e.totalLessons)
          .slice(0, 3);
        const withNext = await Promise.all(
          tending.map(async (enrollment) => {
            try {
              const progress = await enrollmentApi.getCourseProgress(enrollment.course.id);
              const next = progress.lessons.find((lp) => !lp.completed);
              return { enrollment, nextLesson: next?.lesson || null };
            } catch (err) {
              console.error('Failed to load progress for course:', enrollment.course.id, err);
              return { enrollment, nextLesson: null };
            }
          }),
        );
        if (!cancelled) setItems(withNext);
      } catch (err) {
        console.error('Failed to load in-progress courses:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (loading) return <LeafLoader label="loading your courses" />;
  if (items.length === 0) return null;

  return (
    <section className="py-16" style={{ borderTop: '1px solid var(--hair)' }}>
      <SectionHeading kicker="continue tending">Pick up where you left off.</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {items.map(({ enrollment, nextLesson }) => {
          const c = enrollment.course;
          const completed = enrollment.completedLessons || 0;
          const total = enrollment.totalLessons || 0;
          const continueTo = nextLesson
            ? `/courses/${c.id}/lessons/${nextLesson.id}`
            : `/courses/${c.id}`;
          return (
            <article key={c.id} className="ml-card ml-lift p-7">
              <Link to={`/courses/${c.id}`}>
                <h4 className="font-serif text-[22px] text-ink leading-tight">{c.title}</h4>
              </Link>
              {nextLesson && (
                <p className="mt-1.5 text-[13px] text-ink-faint">next · {nextLesson.title}</p>
              )}
              <div className="mt-3 overflow-x-auto">
                <LeafRow total={total} completed={completed} size={14} gap={7} />
              </div>
              <div className="mt-4 pt-4 flex items-center justify-between text-[12px]" style={{ borderTop: '1px solid var(--hair)' }}>
                <span className="text-ink-soft">{completed} of {total} lessons</span>
                <Link to={continueTo} className="text-moss-deep">continue →</Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ContinueLearning;
