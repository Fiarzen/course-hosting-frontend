import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesApi, lessonsApi, enrollmentApi, paymentsApi, assessmentsApi } from '../api/api';
import { formatPrice } from '../utils/pricing';
import { playCompletionSound } from '../utils/sound';
import { Leaf, GrowingStem, Kicker, SectionHeading, LeafTag, LeafLoader } from './Leaf';

// Lesson content is now rich HTML; show a plain-text preview in the list.
function contentPreview(content) {
  if (!content) return 'No content';
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || 'No content';
}

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [lessonProgress, setLessonProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [payingWithPaypal, setPayingWithPaypal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!courseId) return;
    loadCourse();
    loadLessons();
    if (isAuthenticated) {
      checkEnrollment();
      loadProgress();
      loadPaymentStatus();
      loadAssessments();
    }
  }, [courseId, isAuthenticated]);

  const loadAssessments = async () => {
    try {
      const id = parseInt(courseId, 10);
      if (Number.isNaN(id)) return;
      const data = await assessmentsApi.getByCourse(id);
      setAssessments(data);
    } catch (err) {
      // 403 (not enrolled) / 404 are expected for some viewers — show nothing.
      if (![400, 403, 404].includes(err.response?.status)) console.error(err);
      setAssessments([]);
    }
  };

  const loadCourse = async () => {
    try {
      const courses = await coursesApi.getAll();
      const found = courses.find((c) => c.id === parseInt(courseId));
      if (found) setCourse(found); else setError('Course not found');
    } catch (err) { setError('Failed to load course'); console.error(err); }
  };

  const loadLessons = async () => {
    try {
      const id = parseInt(courseId, 10);
      if (Number.isNaN(id)) return;
      const data = await lessonsApi.getByCourse(id);
      setLessons(data);
    } catch (err) { setError('Failed to load lessons'); console.error(err); }
    finally { setLoading(false); }
  };

  const checkEnrollment = async () => {
    try {
      const enrolled = await enrollmentApi.getMyCourses();
      setIsEnrolled(enrolled.some((e) => e.course.id === parseInt(courseId)));
    } catch (err) { console.error(err); }
  };

  const loadPaymentStatus = async () => {
    try {
      const status = await paymentsApi.getPaymentStatus(parseInt(courseId, 10));
      setPaymentStatus(status);
    } catch (err) { console.error(err); }
  };

  const loadProgress = async () => {
    try {
      const id = parseInt(courseId, 10);
      if (Number.isNaN(id)) return;
      const progress = await enrollmentApi.getCourseProgress(id);
      const map = {};
      progress.lessons.forEach((lp) => { map[lp.lesson.id] = lp.completed; });
      setLessonProgress(map);
    } catch (err) {
      if (![400, 403, 404].includes(err.response?.status)) console.error(err);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollmentApi.enrollInCourse(parseInt(courseId));
      setIsEnrolled(true);
      await loadProgress();
      await loadPaymentStatus();
      alert('Successfully enrolled in course!');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error;
      const code = err.response?.data?.code;
      if (status === 409) { setIsEnrolled(true); await loadProgress(); alert('You are already enrolled.'); }
      else if (status === 402 || code === 'PAYMENT_REQUIRED') alert('This is a paid course. Please purchase it to enroll.');
      else if (status === 403 && msg?.includes('allowlist')) alert('This course is restricted.');
      else alert(msg || 'Failed to enroll.');
      console.error(err);
    } finally { setEnrolling(false); }
  };

  const handleBuyNow = async () => {
    setCheckingOut(true);
    try {
      const result = await paymentsApi.createCheckoutSession(parseInt(courseId));
      sessionStorage.setItem('stripeCheckout', JSON.stringify({ courseId: parseInt(courseId) }));
      window.location.href = result.checkoutUrl;
    } catch (err) { alert(err.response?.data?.error || 'Failed to start checkout.'); console.error(err); }
    finally { setCheckingOut(false); }
  };

  const handlePayPal = async () => {
    setPayingWithPaypal(true);
    try {
      const result = await paymentsApi.createPaypalOrder(parseInt(courseId));
      sessionStorage.setItem('stripeCheckout', JSON.stringify({ courseId: parseInt(courseId) }));
      window.location.href = result.approvalUrl;
    } catch (err) { alert(err.response?.data?.error || 'Failed to start PayPal checkout.'); console.error(err); }
    finally { setPayingWithPaypal(false); }
  };

  const handleCompleteLesson = async (lessonId) => {
    try {
      await enrollmentApi.completeLesson(lessonId);
      setLessonProgress((prev) => ({ ...prev, [lessonId]: true }));
      playCompletionSound();
      await loadProgress();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark lesson complete.');
      console.error(err);
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (!window.confirm('Delete this assessment? This cannot be undone.')) return;
    try {
      await assessmentsApi.delete(assessmentId);
      setAssessments((prev) => prev.filter((a) => a.id !== assessmentId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete assessment.');
      console.error(err);
    }
  };

  if (loading) return <LeafLoader />;

  if (error && !course) return (
    <div className="ml-card p-6 max-w-page mx-auto my-12" role="alert">
      <strong className="font-serif text-ink">A small pause. </strong>
      <span className="text-ink-soft">{error}</span>
      <div className="mt-4">
        <button onClick={() => navigate('/courses')} className="ml-button-primary">back to catalogue</button>
      </div>
    </div>
  );

  const completedLessonsCount = Object.values(lessonProgress).filter(Boolean).length;
  const totalLessons = lessons.length;

  const isPaid = course?.isPaid;
  const priceLabel = isPaid ? formatPrice(course?.priceCents, course?.currency) : null;
  const hasPendingPurchase = paymentStatus?.purchase?.status === 'PENDING';
  const hasSucceededPurchase = paymentStatus?.purchase?.status === 'SUCCEEDED';
  const isAuthorOrAdmin = user?.role === 'ADMIN' || (course?.authorId === user?.id);
  const canEnrollDirectly = !isPaid || hasSucceededPurchase || isAuthorOrAdmin;

  // Map lessons to the shape GrowingStem expects.
  const stemLessons = lessons.map((l) => ({ id: l.id, title: l.title, done: !!lessonProgress[l.id] }));

  return (
    <div className="ml-screen-fade max-w-page mx-auto py-12">
      <button onClick={() => navigate('/courses')} className="text-[13px] text-ink-soft mb-8">
        ← back to catalogue
      </button>

      <header className="grid gap-16 items-end pb-12 mb-14 md:grid-cols-[1.4fr_1fr]" style={{ borderBottom: '1px solid var(--hair)' }}>
        <div>
          <Kicker className="mb-5">{totalLessons} lessons</Kicker>
          <h1 className="font-serif text-ink leading-[1.04] tracking-tight2" style={{ fontSize: 'clamp(40px, 6vw, 76px)' }}>
            {course?.title}
          </h1>
          <p className="mt-6 text-[17px] text-ink-soft leading-relaxed max-w-[580px]">
            {course?.description || 'No description'}
          </p>
        </div>
        <aside className="flex flex-col items-start md:items-end gap-7">
          {course?.author && (
            <div className="md:text-right">
              <div className="text-[13px] text-ink">{course.author.name || course.author.email}</div>
              <div className="text-[12px] text-ink-faint">author</div>
            </div>
          )}
          <div className="md:text-right">
            <Kicker className="mb-1.5 text-ink-faint normal-case">tuition</Kicker>
            <div className="font-serif text-[36px] text-ink leading-none">{isPaid ? priceLabel : 'free'}</div>
          </div>
          {isAuthenticated && !isEnrolled && (
            <div className="flex flex-col items-start md:items-end gap-2">
              {isPaid && !canEnrollDirectly && (
                <div className="flex gap-2 flex-wrap md:justify-end">
                  <button onClick={handleBuyNow} disabled={checkingOut || payingWithPaypal} className="ml-button-primary">
                    {checkingOut ? 'redirecting…' : `pay by card · ${priceLabel}`}
                  </button>
                  <button onClick={handlePayPal} disabled={checkingOut || payingWithPaypal} className="ml-button-ghost">
                    {payingWithPaypal ? 'redirecting…' : 'PayPal'}
                  </button>
                </div>
              )}
              {canEnrollDirectly && (
                <button onClick={handleEnroll} disabled={enrolling} className="ml-button-primary">
                  {enrolling ? 'enrolling…' : (isPaid ? 'begin course' : 'enroll in course')}
                  <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
                </button>
              )}
              {hasPendingPurchase && !hasSucceededPurchase && (
                <span className="ml-pill">
                  <Leaf size={9} strokeWidth={0} /> pending payment — complete checkout
                </span>
              )}
            </div>
          )}
          {isAuthenticated && isEnrolled && (
            <LeafTag>tending — {completedLessonsCount} of {totalLessons}</LeafTag>
          )}
          {!isAuthenticated && (
            <Link to="/login" className="ml-button-primary">
              sign in to enroll
              <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
            </Link>
          )}
        </aside>
      </header>

      <div className="grid gap-14 md:grid-cols-[160px_1fr] items-start">
        <div className="sticky top-24 hidden md:block">
          <Kicker className="text-center normal-case mb-4 text-ink-faint">growth</Kicker>
          {stemLessons.length > 0 && (
            <GrowingStem lessons={stemLessons} currentIndex={currentIndex} onJump={(i) => setCurrentIndex(i)} />
          )}
          <div className="mt-4 text-center font-mono text-[11px] tracking-widest text-ink-faint">
            {completedLessonsCount}/{totalLessons}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <SectionHeading kicker="curriculum">Lessons</SectionHeading>
            {isAuthorOrAdmin && (
              <button onClick={() => navigate(`/lessons/create?courseId=${courseId}`)} className="ml-button-ghost">
                + add lesson
              </button>
            )}
          </div>

          {lessons.length === 0 ? (
            <p className="text-ink-faint">
              {!isAuthenticated
                ? 'Please sign in to see lessons.'
                : isAuthorOrAdmin
                  ? 'No lessons yet — add the first one to get this course started.'
                  : 'No lessons available for this course yet.'}
            </p>
          ) : (
            <ol className="list-none p-0 m-0">
              {lessons.map((lesson, i) => {
                const isCompleted = lessonProgress[lesson.id] || false;
                const isCurrent = i === currentIndex;
                // The backend already serves full content to the author/admin;
                // gating on enrollment alone told creators to "enroll to view"
                // their own lessons and hid the open/edit links.
                const canViewContent = isAuthenticated && (isEnrolled || isAuthorOrAdmin);
                return (
                  <li key={lesson.id} style={{
                    borderTop: i === 0 ? '1px solid var(--hair)' : 'none',
                    borderBottom: '1px solid var(--hair)',
                  }}>
                    <div
                      onClick={() => setCurrentIndex(i)}
                      className="grid grid-cols-[44px_1fr_auto] gap-6 items-start py-7 cursor-pointer"
                      style={{
                        background: isCurrent ? 'color-mix(in oklab, var(--moss-wash) 60%, transparent)' : 'transparent',
                        marginInline: isCurrent ? -16 : 0,
                        paddingInline: isCurrent ? 16 : 0,
                        borderRadius: isCurrent ? 4 : 0,
                        transition: 'background 220ms ease, margin 220ms ease, padding 220ms ease',
                      }}
                    >
                      <span className="font-mono text-[12px] tracking-widest pt-1" style={{ color: isCompleted ? 'var(--moss)' : 'var(--ink-faint)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h4 className="font-serif text-[22px] text-ink leading-tight mb-1.5">{lesson.title}</h4>
                        {canViewContent ? (
                          <p className="m-0 text-[14px] text-ink-soft leading-relaxed max-w-[620px] line-clamp-2">{contentPreview(lesson.content)}</p>
                        ) : (
                          <p className="m-0 text-[13px] text-ink-faint">
                            {isPaid && !isEnrolled ? 'Purchase this course to view the full content.' : 'Enroll to view the full content.'}
                          </p>
                        )}
                        <div className="mt-3.5 flex items-center gap-4 flex-wrap">
                          <span className="font-mono text-[11px] tracking-wider text-ink-faint">video + pdf</span>
                          {isAuthenticated && isEnrolled && !isCompleted && (
                            <button onClick={(e) => { e.stopPropagation(); handleCompleteLesson(lesson.id); }}
                              className="text-[11px] text-moss-deep flex items-center gap-1.5">
                              <Leaf size={11} strokeWidth={1.2} /> mark complete
                            </button>
                          )}
                          {isCompleted && (
                            <span className="text-[11px] text-moss flex items-center gap-1.5">
                              <Leaf size={11} strokeWidth={0} /> completed
                            </span>
                          )}
                          {canViewContent && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/courses/${courseId}/lessons/${lesson.id}`); }}
                              className="text-[11px] text-ink-soft"
                            >
                              open →
                            </button>
                          )}
                          {isAuthorOrAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/courses/${courseId}/lessons/${lesson.id}/edit`); }}
                              className="text-[11px] text-moss-deep"
                            >
                              edit
                            </button>
                          )}
                        </div>
                      </div>
                      <span style={{
                        color: isCompleted ? 'var(--moss)' : (isCurrent ? 'var(--moss-deep)' : 'var(--ink-faint)'),
                        opacity: isCompleted || isCurrent ? 1 : 0.5,
                      }}>
                        <Leaf size={22} filled={isCompleted || isCurrent} strokeWidth={isCompleted || isCurrent ? 0 : 1.2} tilt={-22 + ((i * 7) % 14)} />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {(isAuthenticated && (isEnrolled || isAuthorOrAdmin)) && (
        <section className="mt-16 pt-12" style={{ borderTop: '1px solid var(--hair)' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
            <SectionHeading kicker="self-check">Assessments</SectionHeading>
            {isAuthorOrAdmin && (
              <button onClick={() => navigate(`/courses/${courseId}/assessments/create`)} className="ml-button-ghost">
                + add assessment
              </button>
            )}
          </div>

          {assessments.length === 0 ? (
            <p className="text-ink-faint">
              {isAuthorOrAdmin ? 'No assessments yet — add one to let students self-check.' : 'No assessments for this course yet.'}
            </p>
          ) : (
            <ul className="list-none p-0 m-0">
              {assessments.map((a, i) => (
                <li key={a.id} style={{
                  borderTop: i === 0 ? '1px solid var(--hair)' : 'none',
                  borderBottom: '1px solid var(--hair)',
                }}>
                  <div className="flex items-center justify-between gap-6 py-6 flex-wrap">
                    <div>
                      <h4 className="font-serif text-[22px] text-ink leading-tight">{a.title}</h4>
                      <p className="m-0 mt-1 text-[13px] text-ink-faint">
                        {a.questions?.length || 0} question{(a.questions?.length || 0) === 1 ? '' : 's'}
                        {a.description ? ` · ${a.description}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => navigate(`/courses/${courseId}/assessments/${a.id}`)}
                        className="ml-button-primary text-[13px]"
                      >
                        take self-check
                        <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
                      </button>
                      {isAuthorOrAdmin && (
                        <>
                          <button onClick={() => navigate(`/courses/${courseId}/assessments/${a.id}/edit`)} className="text-[12px] text-ink-soft">edit</button>
                          <button onClick={() => handleDeleteAssessment(a.id)} className="text-[12px] text-ink-faint hover:text-ink">delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default CourseDetail;
