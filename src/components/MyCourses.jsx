import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesApi, lessonsApi, paymentsApi, assessmentsApi, apiErrorMessage } from '../api/api';
import { formatPrice, CURRENCY_OPTIONS } from '../utils/pricing';
import { Leaf, Kicker, LeafTag, LeafLoader } from './Leaf';

function MyCourses() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [courses, setCourses] = useState([]);
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const [assessmentsByCourse, setAssessmentsByCourse] = useState({});
  const [openPanel, setOpenPanel] = useState({}); // { [courseId]: 'lessons' | 'assessments' | null }
  const [panelLoading, setPanelLoading] = useState({}); // { [courseId]: 'lessons' | 'assessments' | null }
  const [deletingAssessment, setDeletingAssessment] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingOrder, setSavingOrder] = useState({});
  const [deletingLesson, setDeletingLesson] = useState({});
  const [savingAccess, setSavingAccess] = useState({});
  const [accessForm, setAccessForm] = useState({}); // { [courseId]: { restrictedToAllowList, allowedEmailsText } }
  const [deletingCourse, setDeletingCourse] = useState({});
  const [pricingForm, setPricingForm] = useState({}); // { [courseId]: { isPaid, priceInput, currency } }
  const [savingPricing, setSavingPricing] = useState({});

  const isCreatorOrAdmin = user?.role === 'CREATOR' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isCreatorOrAdmin) {
      setLoading(false);
      setError('Only creators or admins can access this page.');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await coursesApi.getMyCreated();
        setCourses(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load created courses:', err);
        const backendMessage = err.response?.data?.error;
        if (backendMessage) {
          setError(`Failed to load your courses: ${backendMessage}`);
        } else {
          setError('Failed to load your courses. Make sure you are logged in as a creator or admin.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, isCreatorOrAdmin, navigate]);

  const loadLessonsForCourse = async (courseId) => {
    const lessons = await lessonsApi.getByCourse(courseId);
    setLessonsByCourse((prev) => ({ ...prev, [courseId]: lessons }));
  };

  const loadAssessmentsForCourse = async (courseId) => {
    const data = await assessmentsApi.getByCourse(courseId);
    setAssessmentsByCourse((prev) => ({ ...prev, [courseId]: data }));
  };

  // The "manage" buttons used to fire a silent fetch: no spinner, no way to
  // close the panel, and a second click looked like nothing happened. Now they
  // toggle, and they always refetch so the list can't go stale.
  const togglePanel = async (courseId, panel) => {
    if (openPanel[courseId] === panel) {
      setOpenPanel((prev) => ({ ...prev, [courseId]: null }));
      return;
    }
    setPanelLoading((prev) => ({ ...prev, [courseId]: panel }));
    try {
      if (panel === 'lessons') await loadLessonsForCourse(courseId);
      else await loadAssessmentsForCourse(courseId);
      setOpenPanel((prev) => ({ ...prev, [courseId]: panel }));
    } catch (err) {
      console.error(`Failed to load ${panel} for course`, courseId, err);
      alert(apiErrorMessage(err, `Failed to load ${panel} for this course.`));
    } finally {
      setPanelLoading((prev) => ({ ...prev, [courseId]: null }));
    }
  };

  const handleDeleteAssessment = async (courseId, assessmentId) => {
    if (!window.confirm('Delete this assessment? This cannot be undone.')) return;
    setDeletingAssessment((prev) => ({ ...prev, [assessmentId]: true }));
    try {
      await assessmentsApi.delete(assessmentId);
      await loadAssessmentsForCourse(courseId);
    } catch (err) {
      console.error('Failed to delete assessment:', err);
      alert(err.response?.data?.error || 'Failed to delete assessment. Please try again.');
    } finally {
      setDeletingAssessment((prev) => ({ ...prev, [assessmentId]: false }));
    }
  };

  const handleMoveLesson = (courseId, index, direction) => {
    setLessonsByCourse((prev) => {
      const list = prev[courseId] ? [...prev[courseId]] : [];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= list.length) return prev;
      const tmp = list[index];
      list[index] = list[newIndex];
      list[newIndex] = tmp;
      return { ...prev, [courseId]: list };
    });
  };

  const handleSaveOrder = async (courseId) => {
    const lessons = lessonsByCourse[courseId] || [];
    const ids = lessons.map((l) => l.id);
    setSavingOrder((prev) => ({ ...prev, [courseId]: true }));
    try {
      const updated = await lessonsApi.reorderForCourse(courseId, ids);
      setLessonsByCourse((prev) => ({ ...prev, [courseId]: updated }));
    } catch (err) {
      console.error('Failed to save lesson order:', err);
      alert(apiErrorMessage(err, 'Failed to save lesson order. Please try again.'));
    } finally {
      setSavingOrder((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleDeleteLesson = async (courseId, lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    setDeletingLesson((prev) => ({ ...prev, [lessonId]: true }));
    try {
      await lessonsApi.delete(lessonId);
      await loadLessonsForCourse(courseId);
    } catch (err) {
      console.error('Failed to delete lesson:', err);
      alert(apiErrorMessage(err, 'Failed to delete lesson. Please try again.'));
    } finally {
      setDeletingLesson((prev) => ({ ...prev, [lessonId]: false }));
    }
  };

  const handleAccessChange = (courseId, field, value) => {
    const course = courses.find((c) => c.id === courseId);
    setAccessForm((prev) => ({
      ...prev,
      [courseId]: {
        // Seed the untouched half of the form from the saved course. Defaulting
        // to false/'' meant ticking the checkbox blanked the email list (and
        // typing an email flipped the course back to unrestricted) on save.
        restrictedToAllowList:
          prev[courseId]?.restrictedToAllowList ?? course?.restrictedToAllowList ?? false,
        allowedEmailsText:
          prev[courseId]?.allowedEmailsText ?? (course?.allowedEmails || []).join(', '),
        [field]: value,
      },
    }));
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This will remove all its lessons and enrollments.')) {
      return;
    }
    setDeletingCourse((prev) => ({ ...prev, [courseId]: true }));
    try {
      await coursesApi.delete(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert(err.response?.data?.error || 'Failed to delete course. Please try again.');
    } finally {
      setDeletingCourse((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleSaveAccess = async (courseId) => {
    const form = accessForm[courseId];
    const course = courses.find((c) => c.id === courseId);
    if (!course && !form) return;

    const restricted = form?.restrictedToAllowList ?? course?.restrictedToAllowList ?? false;
    const raw = form?.allowedEmailsText ?? (course?.allowedEmails || []).join(', ');
    const allowedEmails = raw
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    setSavingAccess((prev) => ({ ...prev, [courseId]: true }));
    try {
      const updated = await coursesApi.updateAccess(courseId, {
        restrictedToAllowList: restricted,
        allowedEmails,
      });
      // Fold the server's answer back into `courses` and drop the local draft,
      // so the allowlist/open tag and the textarea show what was actually saved
      // instead of the stale value the page loaded with.
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                restrictedToAllowList: updated.restrictedToAllowList,
                allowedEmails: updated.allowedEmails || [],
              }
            : c
        )
      );
      setAccessForm((prev) => ({ ...prev, [courseId]: undefined }));
    } catch (err) {
      console.error('Failed to update course access:', err);
      alert(apiErrorMessage(err, 'Failed to update course access. Please try again.'));
    } finally {
      setSavingAccess((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const getPricingForm = (course) => {
    const form = pricingForm[course.id];
    return {
      isPaid: form?.isPaid ?? course.isPaid ?? false,
      priceInput: form?.priceInput ?? (course.priceCents ? (course.priceCents / 100).toFixed(2) : ''),
      currency: form?.currency ?? course.currency ?? 'gbp',
    };
  };

  const handlePricingChange = (courseId, field, value) => {
    setPricingForm((prev) => ({
      ...prev,
      [courseId]: {
        ...getPricingForm({ id: courseId, ...courses.find((c) => c.id === courseId) }),
        ...prev[courseId],
        [field]: value,
      },
    }));
  };

  const handleSavePricing = async (courseId) => {
    const form = getPricingForm(courses.find((c) => c.id === courseId) || { id: courseId });
    setSavingPricing((prev) => ({ ...prev, [courseId]: true }));
    try {
      let priceCents = null;
      if (form.isPaid) {
        const parsed = parseFloat(form.priceInput);
        if (isNaN(parsed) || parsed <= 0) {
          alert('Please enter a valid price greater than 0.');
          return;
        }
        priceCents = Math.round(parsed * 100);
      }
      const updated = await paymentsApi.updatePricing(courseId, {
        isPaid: form.isPaid,
        priceCents,
        currency: form.isPaid ? form.currency : null,
      });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, isPaid: updated.isPaid, priceCents: updated.priceCents, currency: updated.currency }
            : c
        )
      );
      setPricingForm((prev) => ({ ...prev, [courseId]: undefined }));
      alert('Pricing saved.');
    } catch (err) {
      console.error('Failed to save pricing:', err);
      alert(err.response?.data?.error || 'Failed to save pricing. Please try again.');
    } finally {
      setSavingPricing((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <LeafLoader label="loading your studio" />;
  }

  if (error) {
    return (
      <div className="ml-card p-6 my-12 max-w-page mx-auto" role="alert">
        <strong className="font-serif text-ink">A small pause. </strong>
        <span className="text-ink-soft">{error}</span>
      </div>
    );
  }

  const panelStyle = { background: 'var(--paper)', border: '1px solid var(--hair)', borderRadius: 6 };

  return (
    <div className="ml-screen-fade max-w-page mx-auto py-12">
      <div className="flex items-end justify-between gap-6 flex-wrap pb-8 mb-10" style={{ borderBottom: '1px solid var(--hair)' }}>
        <div>
          <Kicker className="mb-4">studio · {(user?.role || 'creator').toLowerCase()}</Kicker>
          <h1 className="font-serif text-[clamp(38px,5vw,56px)] leading-[1.05] text-ink tracking-tight2">Your courses</h1>
          <p className="mt-3 text-[15px] text-ink-soft max-w-[480px]">
            Tend to each in its own time. Add lessons, set access, and price your work.
          </p>
        </div>
        <button onClick={() => navigate('/courses/create')} className="ml-button-primary">
          new course
          <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-24 text-ink-faint">
          <Leaf size={40} strokeWidth={1} />
          <p className="mt-4 text-[15px]">You haven't planted any courses yet.</p>
          <button onClick={() => navigate('/courses/create')} className="ml-button-primary mt-6">
            create your first course
            <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => (
            <div key={course.id} className="ml-card p-7">
              <div className="flex justify-between items-start gap-6 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <Link to={`/courses/${course.id}`}>
                      <h3 className="font-serif text-[26px] text-ink leading-tight">{course.title}</h3>
                    </Link>
                    {course.restrictedToAllowList ? (
                      <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faint px-2 py-1 rounded" style={{ border: '1px solid var(--hair-strong)' }}>
                        allowlist
                      </span>
                    ) : (
                      <LeafTag>open</LeafTag>
                    )}
                  </div>
                  <p className="text-[14px] text-ink-soft max-w-[560px]">{course.description || 'No description'}</p>
                  <div className="mt-3 flex items-center gap-4 font-mono text-[11px] tracking-wider text-ink-faint">
                    <span>id {course.id}</span>
                    <span>·</span>
                    <span>
                      {course.isPaid
                        ? `paid — ${formatPrice(course.priceCents, course.currency) || '(price not set)'}`
                        : 'free'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => navigate(`/lessons/create?courseId=${course.id}`)} className="ml-button-primary text-[12px] py-2 px-4">
                    + add lesson
                  </button>
                  <button
                    onClick={() => togglePanel(course.id, 'lessons')}
                    disabled={!!panelLoading[course.id]}
                    aria-expanded={openPanel[course.id] === 'lessons'}
                    className="ml-button-ghost text-[12px] py-2 px-4 disabled:opacity-50"
                  >
                    {panelLoading[course.id] === 'lessons'
                      ? 'loading…'
                      : openPanel[course.id] === 'lessons'
                        ? 'hide lessons'
                        : 'manage lessons'}
                  </button>
                  <button
                    onClick={() => togglePanel(course.id, 'assessments')}
                    disabled={!!panelLoading[course.id]}
                    aria-expanded={openPanel[course.id] === 'assessments'}
                    className="ml-button-ghost text-[12px] py-2 px-4 disabled:opacity-50"
                  >
                    {panelLoading[course.id] === 'assessments'
                      ? 'loading…'
                      : openPanel[course.id] === 'assessments'
                        ? 'hide assessments'
                        : 'manage assessments'}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    disabled={deletingCourse[course.id]}
                    className="text-[12px] text-ink-faint hover:text-ink py-1"
                  >
                    {deletingCourse[course.id] ? 'deleting…' : 'delete course'}
                  </button>
                </div>
              </div>

              {/* Access control + Pricing */}
              <div className="mt-6 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ borderTop: '1px solid var(--hair)' }}>
                <div className="p-4" style={panelStyle}>
                  <h5 className="font-mono text-[10px] tracking-widest uppercase text-ink-faint mb-3">access control</h5>
                  <label className="inline-flex items-center mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accessForm[course.id]?.restrictedToAllowList ?? course.restrictedToAllowList ?? false}
                      onChange={(e) => handleAccessChange(course.id, 'restrictedToAllowList', e.target.checked)}
                      className="mr-2 accent-[var(--moss)]"
                    />
                    <span className="text-[13px] text-ink-soft">Restrict to an allowlist of emails</span>
                  </label>
                  <textarea
                    className="w-full text-[13px] px-3 py-2 rounded resize-none"
                    style={{ background: 'transparent', border: '1px solid var(--hair-strong)', color: 'var(--ink)' }}
                    rows={3}
                    placeholder="user1@example.com, user2@example.com"
                    value={
                      accessForm[course.id]?.allowedEmailsText ??
                      (course.allowedEmails && course.allowedEmails.length > 0 ? course.allowedEmails.join(', ') : '')
                    }
                    onChange={(e) => handleAccessChange(course.id, 'allowedEmailsText', e.target.value)}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      disabled={savingAccess[course.id]}
                      onClick={() => handleSaveAccess(course.id)}
                      className="ml-button-ghost text-[12px] py-1.5 px-3"
                    >
                      {savingAccess[course.id] ? 'saving…' : 'save access'}
                    </button>
                  </div>
                </div>

                {(() => {
                  const pf = getPricingForm(course);
                  return (
                    <div className="p-4" style={panelStyle}>
                      <h5 className="font-mono text-[10px] tracking-widest uppercase text-ink-faint mb-3">pricing</h5>
                      <label className="inline-flex items-center mb-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pf.isPaid}
                          onChange={(e) => handlePricingChange(course.id, 'isPaid', e.target.checked)}
                          className="mr-2 accent-[var(--moss)]"
                        />
                        <span className="text-[13px] text-ink-soft">Paid course</span>
                      </label>
                      {pf.isPaid && (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={pf.priceInput}
                            onChange={(e) => handlePricingChange(course.id, 'priceInput', e.target.value)}
                            className="text-[13px] px-3 py-2 rounded w-24"
                            style={{ background: 'transparent', border: '1px solid var(--hair-strong)', color: 'var(--ink)' }}
                            placeholder="9.99"
                          />
                          <select
                            value={pf.currency}
                            onChange={(e) => handlePricingChange(course.id, 'currency', e.target.value)}
                            className="text-[13px] px-3 py-2 rounded"
                            style={{ background: 'transparent', border: '1px solid var(--hair-strong)', color: 'var(--ink)' }}
                          >
                            {CURRENCY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="mt-2 flex justify-end">
                        <button
                          disabled={savingPricing[course.id]}
                          onClick={() => handleSavePricing(course.id)}
                          className="ml-button-ghost text-[12px] py-1.5 px-3"
                        >
                          {savingPricing[course.id] ? 'saving…' : 'save pricing'}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {openPanel[course.id] === 'lessons' && lessonsByCourse[course.id] && (
                <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--hair)' }}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-mono text-[10px] tracking-widest uppercase text-ink-faint">lessons</h4>
                    <button
                      disabled={savingOrder[course.id]}
                      onClick={() => handleSaveOrder(course.id)}
                      className="ml-button-ghost text-[12px] py-1.5 px-3"
                    >
                      {savingOrder[course.id] ? 'saving…' : 'save order'}
                    </button>
                  </div>

                  {lessonsByCourse[course.id].length === 0 ? (
                    <p className="text-ink-faint text-[14px]">
                      No lessons yet.{' '}
                      <button onClick={() => navigate(`/lessons/create?courseId=${course.id}`)} className="ml-link">
                        add the first one
                      </button>
                    </p>
                  ) : (
                    <ul className="list-none p-0 m-0 space-y-px">
                      {lessonsByCourse[course.id].map((lesson, index) => (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between gap-3 px-3 py-3"
                          style={{ borderBottom: '1px solid var(--hair)' }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-[11px] text-ink-faint w-8">{String(index + 1).padStart(2, '0')}</span>
                            <span className="text-[14px] text-ink truncate">{lesson.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => handleMoveLesson(course.id, index, -1)} disabled={index === 0}
                              className="ml-button-ghost text-[11px] py-1 px-2 disabled:opacity-40">up</button>
                            <button onClick={() => handleMoveLesson(course.id, index, 1)} disabled={index === lessonsByCourse[course.id].length - 1}
                              className="ml-button-ghost text-[11px] py-1 px-2 disabled:opacity-40">down</button>
                            <button onClick={() => navigate(`/courses/${course.id}/lessons/${lesson.id}`)}
                              className="ml-button-ghost text-[11px] py-1 px-2">view</button>
                            <button onClick={() => navigate(`/courses/${course.id}/lessons/${lesson.id}/edit`)}
                              className="ml-button-primary text-[11px] py-1 px-2">edit</button>
                            <button onClick={() => handleDeleteLesson(course.id, lesson.id)} disabled={deletingLesson[lesson.id]}
                              className="text-[11px] text-ink-faint hover:text-ink px-1">
                              {deletingLesson[lesson.id] ? 'deleting…' : 'delete'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {openPanel[course.id] === 'assessments' && assessmentsByCourse[course.id] && (
                <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--hair)' }}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-mono text-[10px] tracking-widest uppercase text-ink-faint">assessments</h4>
                    <button
                      onClick={() => navigate(`/courses/${course.id}/assessments/create`)}
                      className="ml-button-ghost text-[12px] py-1.5 px-3"
                    >
                      + add assessment
                    </button>
                  </div>

                  {assessmentsByCourse[course.id].length === 0 ? (
                    <p className="text-ink-faint text-[14px]">No assessments yet.</p>
                  ) : (
                    <ul className="list-none p-0 m-0 space-y-px">
                      {assessmentsByCourse[course.id].map((a, index) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between gap-3 px-3 py-3"
                          style={{ borderBottom: '1px solid var(--hair)' }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-[11px] text-ink-faint w-8">{String(index + 1).padStart(2, '0')}</span>
                            <span className="text-[14px] text-ink truncate">{a.title}</span>
                            <span className="font-mono text-[11px] text-ink-faint shrink-0">{a.questions?.length || 0}q</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => navigate(`/courses/${course.id}/assessments/${a.id}`)}
                              className="ml-button-ghost text-[11px] py-1 px-2">take</button>
                            <button onClick={() => navigate(`/courses/${course.id}/assessments/${a.id}/edit`)}
                              className="ml-button-primary text-[11px] py-1 px-2">edit</button>
                            <button onClick={() => handleDeleteAssessment(course.id, a.id)} disabled={deletingAssessment[a.id]}
                              className="text-[11px] text-ink-faint hover:text-ink px-1">
                              {deletingAssessment[a.id] ? 'deleting…' : 'delete'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCourses;
