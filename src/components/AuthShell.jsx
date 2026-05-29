import { Kicker, GrowingStem } from './Leaf';

// A decorative "growing plant" panel — the visual right-hand side of auth pages.
export function AuthLeafComposition({ progress = 4 }) {
  const lessons = Array.from({ length: 7 }).map((_, i) => ({
    id: i, title: `Lesson ${i + 1}`, done: i < progress,
  }));
  return (
    <div className="absolute inset-0 grid place-items-center p-10">
      <div className="flex flex-col items-center gap-6">
        <GrowingStem lessons={lessons} currentIndex={progress} onJump={() => {}} />
        <div className="text-center max-w-[280px]">
          <div className="font-serif text-[22px] text-ink mb-1.5">One leaf at a time.</div>
          <p className="text-[13px] text-ink-soft leading-relaxed">
            Each lesson you finish unfurls a leaf alongside the course.
          </p>
        </div>
      </div>
    </div>
  );
}

// Shared auth shell: a centered form on the left, a quiet leaf composition on the right.
export function AuthShell({ kicker, title, intro, children, progress = 4 }) {
  return (
    <div className="ml-screen-fade grid md:grid-cols-2 max-w-page mx-auto" style={{ minHeight: 'calc(100vh - 220px)' }}>
      <section className="flex flex-col justify-center py-16 sm:py-24 sm:pr-14 max-w-[520px]">
        <Kicker className="mb-5">{kicker}</Kicker>
        <h1 className="font-serif text-ink leading-[1.05] tracking-tight2 mb-4" style={{ fontSize: 'clamp(40px, 5vw, 56px)' }}>
          {title}
        </h1>
        {intro && <p className="mb-10 text-[16px] leading-relaxed text-ink-soft max-w-[460px]">{intro}</p>}
        {children}
      </section>
      <aside
        className="relative hidden md:block overflow-hidden rounded-md"
        style={{ background: 'var(--paper-2)', borderLeft: '1px solid var(--hair)' }}
      >
        <AuthLeafComposition progress={progress} />
      </aside>
    </div>
  );
}
