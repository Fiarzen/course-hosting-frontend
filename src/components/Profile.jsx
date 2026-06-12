import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enrollmentApi, authApi } from '../api/api';
import { formatPrice } from '../utils/pricing';
import { Leaf, Kicker, SectionHeading, LeafTag, LeafRow, LeafLoader, Field } from './Leaf';

function Stat({ label, value }) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-widest uppercase text-ink-faint mb-3">{label}</div>
      <div className="font-serif text-[36px] text-ink leading-none">{value}</div>
    </div>
  );
}

function Profile() {
  const { user, isAuthenticated, changePassword } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseProgress, setCourseProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [unenrolling, setUnenrolling] = useState({});
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadEnrolledCourses();
  }, [isAuthenticated, navigate]);

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setVerificationMessage(null);
    try {
      await authApi.resendVerification();
      setVerificationMessage({ type: 'success', text: 'Verification email sent. Check your inbox.' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send verification email.';
      setVerificationMessage({ type: 'error', text: msg });
    } finally {
      setResendingVerification(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage(null);

    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (pwForm.next.length < 6) {
      setPwMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPwSaving(true);
    const result = await changePassword(pwForm.current, pwForm.next);
    setPwSaving(false);

    if (result.success) {
      setPwMessage({ type: 'success', text: 'Password changed successfully.' });
      setPwForm({ current: '', next: '', confirm: '' });
    } else {
      setPwMessage({ type: 'error', text: result.error });
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      const data = await enrollmentApi.getMyCourses();
      setEnrolledCourses(data);
      setError(null);
    } catch (err) {
      setError('Failed to load enrolled courses. Make sure you are logged in.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProgress = async (course) => {
    setSelectedCourse(course);
    setLoadingProgress(true);
    try {
      const progress = await enrollmentApi.getCourseProgress(course.course.id);
      setCourseProgress(progress);
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    try {
      await enrollmentApi.completeLesson(lessonId);
      if (selectedCourse) {
        const progress = await enrollmentApi.getCourseProgress(selectedCourse.course.id);
        setCourseProgress(progress);
        loadEnrolledCourses();
      }
    } catch (err) {
      console.error('Failed to mark lesson as complete:', err);
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!window.confirm('Are you sure you want to unenroll from this course? Your progress will be removed.')) {
      return;
    }
    setUnenrolling((prev) => ({ ...prev, [courseId]: true }));
    try {
      await enrollmentApi.unenrollFromCourse(courseId);
      setEnrolledCourses((prev) => prev.filter((e) => e.course.id !== courseId));
      if (selectedCourse?.course.id === courseId) {
        setSelectedCourse(null);
        setCourseProgress(null);
      }
    } catch (err) {
      console.error('Failed to unenroll from course:', err);
      alert(err.response?.data?.error || 'Failed to unenroll from course. Please try again.');
    } finally {
      setUnenrolling((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <LeafLoader label="loading your library" />;
  }

  const totalLeaves = enrolledCourses.reduce((s, e) => s + (e.completedLessons || 0), 0);
  const tending = enrolledCourses.filter((e) => (e.completedLessons || 0) < (e.totalLessons || 0));
  const finished = enrolledCourses.filter((e) => (e.totalLessons || 0) > 0 && (e.completedLessons || 0) === (e.totalLessons || 0));
  const readingMinutes = enrolledCourses.reduce((s, e) => s + (e.completedLessons || 0) * 6, 0);
  const initial = (user?.name || user?.email || '?')[0]?.toLowerCase();

  return (
    <div className="ml-screen-fade max-w-page mx-auto py-12">
      {/* Header */}
      <header className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-7 items-center pb-8" style={{ borderBottom: '1px solid var(--hair)' }}>
        <span
          className="grid place-items-center rounded-full"
          style={{ width: 84, height: 84, background: 'var(--moss-wash)', border: '1px solid var(--hair-strong)', color: 'var(--moss-deep)' }}
        >
          <span className="font-serif text-[38px] leading-none">{initial}</span>
        </span>
        <div>
          <Kicker className="mb-2">account · {(user?.role || 'STUDENT').toLowerCase()}</Kicker>
          <h1 className="font-serif text-[clamp(34px,5vw,48px)] leading-[1.05] text-ink">{user?.name || 'your account'}</h1>
          <div className="mt-2 text-[14px] text-ink-soft">
            {user?.email}
            {user?.emailVerified === true && (
              <span className="ml-3 inline-flex items-center gap-1.5 text-moss text-[12px]">
                <Leaf size={10} strokeWidth={0} /> verified
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Email verification banner */}
      {user?.emailVerified === false && (
        <div
          className="mt-6 rounded-md p-5"
          style={{ background: 'color-mix(in oklab, var(--gold) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--gold) 35%, transparent)' }}
        >
          <p className="text-[14px] text-ink font-medium">Your email isn't verified yet</p>
          <p className="text-[13px] text-ink-soft mt-1">
            Check your inbox for a verification link, or request a new one.
          </p>
          {verificationMessage && (
            <p className={`text-[12px] mt-2 ${verificationMessage.type === 'success' ? 'text-moss-deep' : 'text-ink'}`}>
              {verificationMessage.text}
            </p>
          )}
          <button onClick={handleResendVerification} disabled={resendingVerification} className="ml-button-ghost mt-3 text-[12px] py-2 px-4">
            {resendingVerification ? 'sending…' : 'resend verification email'}
          </button>
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-10" style={{ borderBottom: '1px solid var(--hair)' }}>
        <Stat label="leaves unfurled" value={String(totalLeaves)} />
        <Stat label="courses tending" value={String(tending.length)} />
        <Stat label="courses finished" value={String(finished.length)} />
        <Stat label="reading minutes" value={String(readingMinutes)} />
      </section>

      {error && (
        <div className="mt-6 ml-card p-4 text-[14px] text-ink-soft" role="alert">{error}</div>
      )}

      {enrolledCourses.length === 0 ? (
        <div className="text-center py-24 text-ink-faint">
          <Leaf size={40} strokeWidth={1} />
          <p className="mt-4 text-[15px]">You haven't planted any courses yet.</p>
          <button onClick={() => navigate('/courses')} className="ml-button-primary mt-6">
            browse the catalogue
            <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
          </button>
        </div>
      ) : (
        <>
          {tending.length > 0 && (
            <section className="pt-14 pb-6">
              <SectionHeading kicker="currently tending">In progress</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                {tending.map((enrollment) => {
                  const c = enrollment.course;
                  const completed = enrollment.completedLessons || 0;
                  const total = enrollment.totalLessons || 0;
                  return (
                    <article key={c.id} className="ml-card ml-lift p-7">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <Link to={`/courses/${c.id}`}>
                          <h4 className="font-serif text-[22px] text-ink leading-tight">{c.title}</h4>
                        </Link>
                        {c.isPaid ? (
                          <span className="font-mono text-[11px] text-ink-faint whitespace-nowrap">
                            {formatPrice(c.priceCents, c.currency) || 'paid'}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-ink-faint">free</span>
                        )}
                      </div>
                      {total > 0 && (
                        <div className="mt-3 overflow-x-auto">
                          <LeafRow total={total} completed={completed} size={14} gap={7} />
                        </div>
                      )}
                      <div className="mt-4 pt-4 flex items-center justify-between text-[12px]" style={{ borderTop: '1px solid var(--hair)' }}>
                        <span className="text-ink-soft">{completed} of {total} lessons</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleViewProgress(enrollment)} className="text-moss-deep">progress</button>
                          <button
                            onClick={() => handleUnenroll(c.id)}
                            disabled={unenrolling[c.id]}
                            className="text-ink-faint hover:text-ink"
                          >
                            {unenrolling[c.id] ? 'unenrolling…' : 'unenroll'}
                          </button>
                          <Link to={`/courses/${c.id}`} className="text-ink-soft">continue →</Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {finished.length > 0 && (
            <section className="pt-8 pb-4">
              <SectionHeading kicker="finished">Courses you've completed</SectionHeading>
              <ul className="list-none p-0 m-0">
                {finished.map((enrollment, i) => {
                  const c = enrollment.course;
                  return (
                    <li
                      key={c.id}
                      className="grid grid-cols-[1fr_auto_auto] gap-6 items-center py-6"
                      style={{ borderTop: i === 0 ? '1px solid var(--hair)' : 'none', borderBottom: '1px solid var(--hair)' }}
                    >
                      <div>
                        <Link to={`/courses/${c.id}`}>
                          <div className="font-serif text-[22px] text-ink leading-tight">{c.title}</div>
                        </Link>
                        <div className="text-[13px] text-ink-faint mt-1">
                          {c.author?.name || c.author?.email || 'mindleaf'} · {enrollment.totalLessons} lessons
                        </div>
                      </div>
                      <LeafTag>complete</LeafTag>
                      <button
                        onClick={() => handleUnenroll(c.id)}
                        disabled={unenrolling[c.id]}
                        className="text-[13px] text-ink-faint hover:text-ink"
                      >
                        {unenrolling[c.id] ? 'unenrolling…' : 'unenroll'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Change password */}
      <section className="pt-14 pb-6">
        <SectionHeading kicker="security">Change password</SectionHeading>
        <form onSubmit={handleChangePassword} noValidate className="max-w-md">
          {pwMessage && (
            <div
              role="alert"
              className="mb-5 rounded px-4 py-3 text-[13px]"
              style={
                pwMessage.type === 'success'
                  ? { background: 'var(--moss-wash)', color: 'var(--moss-deep)', border: '1px solid color-mix(in oklab, var(--moss-soft) 60%, transparent)' }
                  : { background: 'color-mix(in oklab, var(--gold) 12%, transparent)', color: 'var(--ink)', border: '1px solid color-mix(in oklab, var(--gold) 40%, transparent)' }
              }
            >
              {pwMessage.text}
            </div>
          )}

          <Field label="Current password" required>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
              disabled={pwSaving}
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="ml-input"
            />
          </Field>

          <Field label="New password" hint="at least 6 characters" required>
            <input
              type="password"
              value={pwForm.next}
              onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
              disabled={pwSaving}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              className="ml-input"
            />
          </Field>

          <Field label="Confirm new password" required>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              disabled={pwSaving}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              className="ml-input"
            />
          </Field>

          <button type="submit" disabled={pwSaving} className="ml-button-primary mt-2">
            {pwSaving ? 'saving…' : 'change password'}
          </button>
        </form>
      </section>

      {/* Course Progress Modal */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'color-mix(in oklab, var(--ink) 45%, transparent)' }}
          onClick={() => { setSelectedCourse(null); setCourseProgress(null); }}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-md"
            style={{ background: 'var(--paper)', border: '1px solid var(--hair-strong)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Kicker className="mb-2 text-ink-faint normal-case">progress</Kicker>
                  <h3 className="font-serif text-[28px] text-ink leading-tight">{selectedCourse.course.title}</h3>
                </div>
                <button
                  onClick={() => { setSelectedCourse(null); setCourseProgress(null); }}
                  className="text-ink-faint hover:text-ink text-2xl leading-none"
                  aria-label="close"
                >
                  ×
                </button>
              </div>

              {loadingProgress ? (
                <LeafLoader label="loading progress" />
              ) : courseProgress ? (
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-[13px] text-ink-soft">
                      {courseProgress.completedLessons} of {courseProgress.totalLessons} lessons · {Math.round(courseProgress.progress)}%
                    </span>
                    <div className="overflow-x-auto">
                      <LeafRow total={courseProgress.totalLessons} completed={courseProgress.completedLessons} size={14} gap={7} />
                    </div>
                  </div>

                  <ul className="list-none p-0 m-0">
                    {courseProgress.lessons.map((lp, i) => (
                      <li
                        key={lp.lesson.id}
                        className="grid grid-cols-[auto_1fr_auto] gap-4 items-start py-4"
                        style={{ borderTop: i === 0 ? '1px solid var(--hair)' : 'none', borderBottom: '1px solid var(--hair)' }}
                      >
                        <span style={{ color: lp.completed ? 'var(--moss)' : 'var(--ink-faint)', opacity: lp.completed ? 1 : 0.5 }}>
                          <Leaf size={16} filled={lp.completed} strokeWidth={lp.completed ? 0 : 1.2} />
                        </span>
                        <div>
                          <h4 className="font-serif text-[17px] text-ink leading-snug">{lp.lesson.title}</h4>
                          {lp.completed && lp.completedAt && (
                            <p className="text-[11px] text-ink-faint mt-1">
                              completed {new Date(lp.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {!lp.completed && (
                          <button
                            onClick={() => handleCompleteLesson(lp.lesson.id)}
                            className="text-[12px] text-moss-deep flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Leaf size={11} strokeWidth={1.2} /> mark complete
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-ink-faint text-[14px]">No progress data available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
