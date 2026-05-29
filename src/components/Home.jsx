import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Kicker, SectionHeading } from './Leaf';

function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="ml-screen-fade">
      <section className="relative py-24 sm:py-32 max-w-page mx-auto">
        <Kicker className="mb-7">mindleaf · est. 2024</Kicker>
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
        className="px-0 py-16 sm:py-20"
        style={{
          borderTop: '1px solid var(--hair)',
          borderBottom: '1px solid var(--hair)',
          background: 'color-mix(in oklab, var(--paper-2) 60%, transparent)',
        }}
      >
      </section>

      {/* <section className="py-24 max-w-page mx-auto">
        <SectionHeading kicker="featured this season">A course we recommend</SectionHeading>
        <Link
          to="/courses"
          className="ml-card grid overflow-hidden md:grid-cols-2 cursor-pointer"
        >
          <div
            className="relative min-h-[360px] grid place-items-center"
            style={{
              background:
                'repeating-linear-gradient(135deg, var(--moss-wash) 0 2px, transparent 2px 14px), var(--paper)',
              borderRight: '1px solid var(--hair)',
            }}
          >
            <div className="opacity-50" style={{ color: 'var(--moss)' }}>
              <Leaf size={140} strokeWidth={0} tilt={-12} />
            </div>
            <div className="ml-kicker absolute bottom-4 left-5 text-ink-faint normal-case tracking-widest">
              [ cover · author portrait ]
            </div>
          </div>
          <div className="flex flex-col justify-between p-10 sm:p-12">
            <div>
              <Kicker className="mb-5 text-ink-faint normal-case">spring · 8 lessons · 6 min each</Kicker>
              <h3 className="font-serif text-[40px] leading-tight text-ink mb-4">The art of slow reading</h3>
              <p className="text-[16px] text-ink-soft leading-relaxed max-w-[420px]">
                A six-week practice in attention. Inhabit a page longer than is comfortable,
                and notice what you would otherwise have missed.
              </p>
            </div>
            <div className="mt-9 pt-6 flex items-center justify-between" style={{ borderTop: '1px solid var(--hair)' }}>
              <div>
                <div className="text-[13px] text-ink">Ren Asano</div>
                <div className="text-[12px] text-ink-faint">Essayist, Kyoto</div>
              </div>
              <span className="font-serif text-[22px] text-ink">free</span>
            </div>
          </div>
        </Link>
      </section> */}
    </div>
  );
}

export default Home;
