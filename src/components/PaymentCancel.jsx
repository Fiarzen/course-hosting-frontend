import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Kicker } from './Leaf';

// A dashed, empty stem with outlined (unfilled) leaves.
function EmptyStem() {
  return (
    <svg width="120" height="160" viewBox="0 0 120 160" style={{ overflow: 'visible' }} aria-hidden="true">
      <line x1="60" y1="8" x2="60" y2="150" stroke="var(--hair-strong)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4" />
      {[40, 80, 120].map((y, i) => {
        const s = i % 2 === 0 ? -1 : 1;
        return (
          <g key={i}>
            <path d={`M 60 ${y} Q ${60 + s * 8} ${y + 1} ${60 + s * 22} ${y - 6}`}
                  stroke="var(--ink-faint)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
            <g transform={`translate(${60 + s * 22} ${y - 6}) rotate(${s * 70}) scale(1.1)`}>
              <path d="M0 0 C -7 -3, -10 -10, 0 -16 C 10 -10, 7 -3, 0 0 Z"
                    fill="none" stroke="var(--ink-faint)" strokeWidth="1.2" opacity="0.7" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function PaymentCancel() {
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('stripeCheckout');
    if (stored) {
      try {
        const { courseId: cid } = JSON.parse(stored);
        setCourseId(cid);
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div className="ml-screen-fade max-w-[760px] mx-auto py-24 text-center">
      <div className="inline-block mb-9 opacity-60"><EmptyStem /></div>
      <Kicker className="mb-5 text-ink-faint normal-case">payment not completed</Kicker>
      <h1 className="font-serif text-[clamp(40px,6vw,56px)] leading-[1.05] tracking-tight2 text-ink mb-5">No leaves planted.</h1>
      <p className="text-[17px] text-ink-soft leading-relaxed max-w-[520px] mx-auto">
        Your card was not charged. The course is still waiting whenever you'd like to begin.
      </p>
      <div className="mt-11 flex justify-center gap-3.5 flex-wrap">
        {courseId && (
          <Link to={`/courses/${courseId}`} className="ml-button-primary">try again</Link>
        )}
        <Link to="/courses" className="ml-button-ghost">back to catalogue</Link>
      </div>
    </div>
  );
}

export default PaymentCancel;
