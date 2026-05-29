import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentsApi } from '../api/api';
import { Leaf, Kicker, LeafLoader } from './Leaf';

const MAX_POLLS = 10;
const POLL_INTERVAL_MS = 2000;

// A small composition: a stem with all leaves filled.
function FullStem() {
  return (
    <svg width="120" height="160" viewBox="0 0 120 160" style={{ overflow: 'visible' }} aria-hidden="true">
      <line x1="60" y1="8" x2="60" y2="150" stroke="var(--moss)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="60" cy="8" r="4" fill="var(--moss)" />
      {[24, 50, 76, 102, 128].map((y, i) => {
        const s = i % 2 === 0 ? -1 : 1;
        return (
          <g key={i}>
            <path d={`M 60 ${y} Q ${60 + s * 8} ${y + 1} ${60 + s * 22} ${y - 6}`}
                  stroke="var(--moss)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <g transform={`translate(${60 + s * 22} ${y - 6}) rotate(${s * 70}) scale(1.2)`}>
              <path d="M0 0 C -7 -3, -10 -10, 0 -16 C 10 -10, 7 -3, 0 0 Z" fill="var(--moss)" />
              <path d="M0 0 V -15" stroke="var(--paper-2)" strokeWidth="0.8" opacity="0.55" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const stripeSessionId = searchParams.get('session_id');
  const paypalToken = searchParams.get('token');
  const isPaypal = Boolean(paypalToken) && !stripeSessionId;

  const [courseId, setCourseId] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | capturing | enrolled | pending | error

  useEffect(() => {
    const stored = sessionStorage.getItem('stripeCheckout');
    if (stored) {
      try {
        const { courseId: cid } = JSON.parse(stored);
        setCourseId(cid);
        sessionStorage.removeItem('stripeCheckout');
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('error');
      return;
    }

    if (isPaypal && paypalToken) {
      setStatus('capturing');
      paymentsApi
        .capturePaypalOrder(paypalToken)
        .then(() => {
          setStatus('enrolled');
        })
        .catch((err) => {
          console.error('PayPal capture failed:', err);
          setStatus('loading');
        });
      return;
    }

    if (!courseId) return;

    let cancelled = false;
    let timer;
    let count = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        const result = await paymentsApi.getPaymentStatus(courseId);
        if (cancelled) return;
        if (result.isEnrolled || result.purchase?.status === 'SUCCEEDED') {
          setStatus('enrolled');
          return;
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }

      count += 1;
      if (count >= MAX_POLLS) {
        setStatus('pending');
      } else {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isAuthenticated, courseId, isPaypal, paypalToken]);

  useEffect(() => {
    if (status !== 'loading' || !courseId || !isPaypal) return;

    let cancelled = false;
    let timer;
    let count = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        const result = await paymentsApi.getPaymentStatus(courseId);
        if (cancelled) return;
        if (result.isEnrolled || result.purchase?.status === 'SUCCEEDED') {
          setStatus('enrolled');
          return;
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
      count += 1;
      if (count >= MAX_POLLS) {
        setStatus('pending');
      } else {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status, courseId, isPaypal]);

  if (status === 'capturing') {
    return (
      <div className="ml-screen-fade flex flex-col items-center justify-center min-h-[50vh]">
        <LeafLoader label="confirming payment" />
        <p className="text-ink-soft text-[13px] -mt-8">Confirming your PayPal payment…</p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="ml-screen-fade flex flex-col items-center justify-center min-h-[50vh]">
        <LeafLoader label="confirming payment" />
        <p className="text-ink-soft text-[13px] -mt-8">Confirming your payment…</p>
      </div>
    );
  }

  if (status === 'enrolled') {
    return (
      <div className="ml-screen-fade max-w-[760px] mx-auto py-24 text-center">
        <div className="inline-block mb-9"><FullStem /></div>
        <Kicker className="mb-5">payment received</Kicker>
        <h1 className="font-serif text-[clamp(40px,6vw,56px)] leading-[1.05] tracking-tight2 text-ink mb-5">You're enrolled.</h1>
        <p className="text-[17px] text-ink-soft leading-relaxed max-w-[520px] mx-auto">
          Thank you for joining mindleaf. A receipt is on its way to your inbox. The first lesson is ready when you are.
        </p>
        <div className="mt-11 flex justify-center gap-3.5 flex-wrap">
          {courseId && (
            <Link to={`/courses/${courseId}`} className="ml-button-primary">
              begin the course
              <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
            </Link>
          )}
          <Link to="/profile" className="ml-button-ghost">go to your library</Link>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="ml-screen-fade max-w-[760px] mx-auto py-24 text-center">
        <div className="inline-block mb-9 opacity-70"><FullStem /></div>
        <Kicker className="mb-5 text-ink-faint normal-case">payment processing</Kicker>
        <h1 className="font-serif text-[clamp(40px,6vw,56px)] leading-[1.05] tracking-tight2 text-ink mb-5">Almost there.</h1>
        <p className="text-[17px] text-ink-soft leading-relaxed max-w-[520px] mx-auto">
          Your payment is processing. Your enrollment will be activated shortly — check your library in a moment.
        </p>
        <div className="mt-11 flex justify-center gap-3.5 flex-wrap">
          {courseId && (
            <Link to={`/courses/${courseId}`} className="ml-button-primary">view course</Link>
          )}
          <Link to="/profile" className="ml-button-ghost">go to your library</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-screen-fade max-w-[760px] mx-auto py-24 text-center">
      <Kicker className="mb-5 text-ink-faint normal-case">something went wrong</Kicker>
      <h1 className="font-serif text-[clamp(40px,6vw,56px)] leading-[1.05] tracking-tight2 text-ink mb-5">We couldn't confirm it.</h1>
      <p className="text-[17px] text-ink-soft leading-relaxed max-w-[520px] mx-auto">
        If you completed payment, please check your library in a moment or contact support.
      </p>
      <div className="mt-11 flex justify-center">
        <Link to="/courses" className="ml-button-ghost">back to catalogue</Link>
      </div>
    </div>
  );
}

export default PaymentSuccess;
