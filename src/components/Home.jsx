import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Kicker } from './Leaf';

const PRINCIPLES = [
  {
    n: '01',
    title: 'One thing at a time',
    body: 'Each course is a single path of lessons, taken in order. No feeds, no dashboards calling for your attention.',
  },
  {
    n: '02',
    title: 'Progress that grows',
    body: 'Finish a lesson and a leaf unfurls along the stem. Your progress is something you tend, not a number you chase.',
  },
  {
    n: '03',
    title: 'Quiet by design',
    body: 'No streaks, no leaderboards, no recommendation engine. Just the course, the work, and the time you give it.',
  },
];

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

      {/* Three principles */}
      <section
        className="py-16 sm:py-20"
        style={{
          borderTop: '1px solid var(--hair)',
          borderBottom: '1px solid var(--hair)',
          background: 'color-mix(in oklab, var(--paper-2) 60%, transparent)',
        }}
      >
        <div className="grid gap-12 md:grid-cols-3 md:gap-10">
          {PRINCIPLES.map((p) => (
            <div key={p.n}>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[11px] tracking-widest text-ink-faint">{p.n}</span>
                <Leaf size={11} strokeWidth={0} tilt={-22} color="var(--moss)" />
              </div>
              <h3 className="font-serif text-[22px] text-ink leading-snug mb-2.5">{p.title}</h3>
              <p className="text-[14.5px] text-ink-soft leading-relaxed max-w-[340px]">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
