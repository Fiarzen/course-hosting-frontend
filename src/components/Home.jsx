import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesApi } from '../api/api';
import { formatPrice } from '../utils/pricing';
import { Leaf, Kicker, SectionHeading } from './Leaf';
import ContinueLearning from './ContinueLearning';

// Featured courses first; if none are featured, fall back to the most
// recently created (ids are sequential, so highest id = newest).
export function selectFeaturedCourses(courses, limit = 3) {
  const featured = courses.filter((c) => c.featured);
  if (featured.length > 0) return featured.slice(0, limit);
  return [...courses].sort((a, b) => b.id - a.id).slice(0, limit);
}

function FeaturedCourses() {
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    let cancelled = false;
    coursesApi
      .getAll()
      .then((data) => { if (!cancelled) setCourses(data); })
      .catch((err) => {
        console.error('Failed to load featured courses:', err);
        if (!cancelled) setCourses([]);
      });
    return () => { cancelled = true; };
  }, []);

  if (!courses || courses.length === 0) return null;

  const anyFeatured = courses.some((c) => c.featured);
  const picks = selectFeaturedCourses(courses);

  return (
    <section
      className="py-16 sm:py-20"
      style={{
        borderTop: '1px solid var(--hair)',
        borderBottom: '1px solid var(--hair)',
        background: 'color-mix(in oklab, var(--paper-2) 60%, transparent)',
      }}
    >
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <SectionHeading kicker={anyFeatured ? 'featured courses' : 'recently planted'}>
          {anyFeatured ? 'A few worth your time.' : 'The latest from the catalogue.'}
        </SectionHeading>
        <Link
          to="/courses"
          className="mb-7 pb-1 text-sm text-ink-soft"
          style={{ borderBottom: '1px solid var(--hair-strong)' }}
        >
          view the full catalogue →
        </Link>
      </div>
      <div className="grid gap-12 md:grid-cols-3 md:gap-10">
        {picks.map((course, i) => (
          <Link key={course.id} to={`/courses/${course.id}`} className="block">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[11px] tracking-widest text-ink-faint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <Leaf size={11} strokeWidth={0} tilt={-22} color="var(--moss)" />
            </div>
            <h3 className="font-serif text-[22px] text-ink leading-snug mb-2.5">{course.title}</h3>
            <p className="text-[14.5px] text-ink-soft leading-relaxed max-w-[340px]">
              {course.description || 'No description'}
            </p>
            <div className="mt-4 flex items-baseline gap-2.5">
              <span className="font-serif text-[15px] text-ink">
                {course.isPaid ? formatPrice(course.priceCents, course.currency)?.toLowerCase() : 'free'}
              </span>
              {course.author && (
                <span className="text-[12px] text-ink-faint">
                  · {course.author.name || course.author.email}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="ml-screen-fade">
      <section className="relative py-24 sm:py-32 max-w-page mx-auto">
        <Kicker className="mb-7">mindleaf · est. 2025</Kicker>
        <h1
          className="font-serif font-medium text-ink leading-[1.02] tracking-tight2 max-w-[900px]"
          style={{ fontSize: 'clamp(48px, 7vw, 96px)' }}
        >
          A quieter place<br />to learn one thing<br />at a time.
        </h1>
        <p className="mt-9 max-w-[520px] text-[17px] leading-relaxed text-ink-soft">
          A place to share learnings and expand the mind.
        </p>
        <div className="mt-11 flex items-center gap-6 flex-wrap">
          <Link to="/courses" className="ml-button-primary">
            browse the catalogue
            <Leaf size={14} strokeWidth={0} tilt={-20} color="var(--moss-soft)" />
          </Link>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="py-4 text-sm text-ink-soft"
              style={{ borderBottom: '1px solid var(--hair-strong)' }}
            >
              create an account ↓
            </Link>
          )}
        </div>

        {/* Quiet anchor leaf */}
        <div aria-hidden="true" className="pointer-events-none absolute right-10 top-20 opacity-10 hidden sm:block" style={{ color: 'var(--moss)' }}>
          <Leaf size={360} strokeWidth={0} tilt={-8} />
        </div>
      </section>

      {isAuthenticated && <ContinueLearning />}

      <FeaturedCourses />
    </div>
  );
}

export default Home;
