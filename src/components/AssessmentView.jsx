import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentsApi } from '../api/api';
import { Leaf, Kicker, LeafLoader } from './Leaf';

function AssessmentView() {
  const { courseId, assessmentId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({}); // { [questionId]: choiceId }
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setAccessError(null);
      try {
        const data = await assessmentsApi.getById(assessmentId);
        setAssessment(data);
      } catch (err) {
        const status = err.response?.status;
        if (status === 401) setAccessError('You must be logged in to take this assessment.');
        else if (status === 403) setAccessError('You must be enrolled in this course (or be the author/admin) to take this assessment.');
        else if (status === 404) setError('Assessment not found.');
        else setError('Failed to load assessment. Please try again.');
        console.error('Failed to load assessment:', err);
      } finally {
        setLoading(false);
      }
    };
    if (assessmentId && isAuthenticated) load();
    else if (!isAuthenticated) {
      setLoading(false);
      setAccessError('You must be logged in to take this assessment.');
    }
  }, [assessmentId, isAuthenticated]);

  const resultByQuestion = useMemo(() => {
    const map = {};
    (result?.results || []).forEach((r) => { map[r.questionId] = r; });
    return map;
  }, [result]);

  const select = (questionId, choiceId) => {
    if (result) return; // locked after submitting
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const allAnswered = assessment && assessment.questions.every((q) => answers[q.id] != null);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, choiceId]) => ({
        questionId: Number(questionId),
        choiceId,
      }));
      const res = await assessmentsApi.check(assessmentId, payload);
      setResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check answers. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const tryAgain = () => {
    setResult(null);
    setAnswers({});
  };

  if (loading) return <LeafLoader label="loading assessment" />;

  if (error || accessError) {
    const msg = error || accessError;
    return (
      <div className="ml-card p-6 my-12 max-w-[760px] mx-auto" role="alert">
        <strong className="font-serif text-ink">A small pause. </strong>
        <span className="text-ink-soft">{msg}</span>
        <div className="mt-4">
          <button onClick={() => navigate(`/courses/${courseId}`)} className="ml-button-primary">back to course</button>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  // Choice styling once results are in.
  const choiceStyle = (questionId, choiceId) => {
    const base = { border: '1px solid var(--hair-strong)', background: 'transparent' };
    if (!result) {
      if (answers[questionId] === choiceId) {
        return { border: '1px solid var(--moss)', background: 'var(--moss-wash)' };
      }
      return base;
    }
    const r = resultByQuestion[questionId];
    if (!r) return base;
    if (choiceId === r.correctChoiceId) {
      return { border: '1px solid var(--moss)', background: 'color-mix(in oklab, var(--moss-wash) 80%, transparent)' };
    }
    if (choiceId === r.selectedChoiceId) {
      return { border: '1px solid color-mix(in oklab, var(--gold) 60%, transparent)', background: 'color-mix(in oklab, var(--gold) 12%, transparent)' };
    }
    return base;
  };

  return (
    <div className="ml-screen-fade max-w-[760px] mx-auto py-12">
      <button onClick={() => navigate(`/courses/${courseId}`)} className="text-[13px] text-ink-soft mb-8">
        ← back to course
      </button>

      <Kicker className="mb-3">self-check · {assessment.questions.length} questions</Kicker>
      <h1 className="font-serif text-[clamp(34px,5vw,52px)] leading-[1.08] tracking-tight2 text-ink mb-4">
        {assessment.title}
      </h1>
      {assessment.description && (
        <p className="text-[16px] text-ink-soft leading-relaxed mb-8 max-w-[620px]">{assessment.description}</p>
      )}

      {result && (
        <div
          className="ml-card p-6 mb-10 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: 'var(--moss-wash)', borderColor: 'color-mix(in oklab, var(--moss-soft) 60%, transparent)' }}
        >
          <div>
            <div className="font-serif text-[32px] text-ink leading-none">{result.score} / {result.total}</div>
            <div className="text-[13px] text-ink-soft mt-1">
              {result.score === result.total ? 'Perfect — every answer correct.' : 'Review the highlights below, then try again.'}
            </div>
          </div>
          <button onClick={tryAgain} className="ml-button-ghost">try again</button>
        </div>
      )}

      <ol className="list-none p-0 m-0 space-y-8">
        {assessment.questions.map((q, qi) => {
          const r = resultByQuestion[q.id];
          return (
            <li key={q.id}>
              <div className="flex items-start gap-3 mb-4">
                <span className="font-mono text-[12px] tracking-widest text-ink-faint pt-1">{String(qi + 1).padStart(2, '0')}</span>
                <h3 className="font-serif text-[22px] text-ink leading-snug">{q.prompt}</h3>
                {r && (
                  <span className="ml-auto text-[12px] flex items-center gap-1.5" style={{ color: r.isCorrect ? 'var(--moss)' : 'var(--gold)' }}>
                    <Leaf size={12} strokeWidth={r.isCorrect ? 0 : 1.2} /> {r.isCorrect ? 'correct' : 'review'}
                  </span>
                )}
              </div>
              <div className="space-y-2.5 pl-8">
                {q.choices.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-md text-[15px] text-ink cursor-pointer transition-colors"
                    style={choiceStyle(q.id, c.id)}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === c.id}
                      disabled={!!result}
                      onChange={() => select(q.id, c.id)}
                      className="accent-[var(--moss)]"
                    />
                    {c.text}
                  </label>
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="mt-12 pt-8 flex items-center gap-4" style={{ borderTop: '1px solid var(--hair)' }}>
          <button onClick={handleSubmit} disabled={!allAnswered || submitting} className="ml-button-primary disabled:opacity-40">
            {submitting ? 'checking…' : 'check answers'}
            <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
          </button>
          {!allAnswered && <span className="text-[13px] text-ink-faint">answer every question to check</span>}
        </div>
      )}
    </div>
  );
}

export default AssessmentView;
