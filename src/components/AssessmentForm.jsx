import { useState } from 'react';
import { Leaf, Kicker, Field } from './Leaf';

const emptyChoice = (isCorrect = false) => ({ text: '', isCorrect });
const emptyQuestion = () => ({
  prompt: '',
  choices: [emptyChoice(true), emptyChoice(false)],
});

// Normalize loaded assessment data (from the API) into editable form state.
function toFormState(initial) {
  if (!initial) {
    return { title: '', description: '', questions: [emptyQuestion()] };
  }
  return {
    title: initial.title || '',
    description: initial.description || '',
    questions:
      initial.questions && initial.questions.length
        ? initial.questions.map((q) => ({
            prompt: q.prompt || '',
            choices: (q.choices || []).map((c) => ({
              text: c.text || '',
              isCorrect: !!c.isCorrect,
            })),
          }))
        : [emptyQuestion()],
  };
}

/**
 * Dynamic editor for a multiple-choice assessment, shared by the create and
 * edit screens. Calls `onSubmit({ title, description, questions })`.
 */
function AssessmentForm({ heading, initial, onSubmit, submitting, submitLabel, onCancel }) {
  const [title, setTitle] = useState(() => toFormState(initial).title);
  const [description, setDescription] = useState(() => toFormState(initial).description);
  const [questions, setQuestions] = useState(() => toFormState(initial).questions);
  const [error, setError] = useState(null);

  const updateQuestion = (qi, patch) =>
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const updateChoice = (qi, ci, patch) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? { ...q, choices: q.choices.map((c, j) => (j === ci ? { ...c, ...patch } : c)) }
          : q,
      ),
    );

  const setCorrect = (qi, ci) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? { ...q, choices: q.choices.map((c, j) => ({ ...c, isCorrect: j === ci })) }
          : q,
      ),
    );

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (qi) =>
    setQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== qi) : prev));

  const addChoice = (qi) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, choices: [...q.choices, emptyChoice(false)] } : q)),
    );
  const removeChoice = (qi, ci) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi || q.choices.length <= 2) return q;
        const choices = q.choices.filter((_, j) => j !== ci);
        // Ensure a correct answer survives the removal.
        if (!choices.some((c) => c.isCorrect)) choices[0].isCorrect = true;
        return { ...q, choices };
      }),
    );

  const validate = () => {
    if (!title.trim()) return 'Please give the assessment a title.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) return `Question ${i + 1} needs a prompt.`;
      if (q.choices.length < 2) return `Question ${i + 1} needs at least two choices.`;
      if (q.choices.some((c) => !c.text.trim())) return `Question ${i + 1} has an empty choice.`;
      if (!q.choices.some((c) => c.isCorrect)) return `Question ${i + 1} needs a correct answer.`;
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      questions: questions.map((q) => ({
        prompt: q.prompt.trim(),
        choices: q.choices.map((c) => ({ text: c.text.trim(), isCorrect: c.isCorrect })),
      })),
    });
  };

  return (
    <div className="ml-screen-fade max-w-[760px] mx-auto py-12">
      <button onClick={onCancel} className="text-[13px] text-ink-soft mb-8">← cancel</button>
      <Kicker className="mb-4">{heading.kicker}</Kicker>
      <h1 className="font-serif text-[clamp(34px,5vw,48px)] leading-[1.05] tracking-tight2 text-ink mb-10">
        {heading.title}
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div
            role="alert"
            className="mb-6 rounded px-4 py-3 text-[13px]"
            style={{ background: 'color-mix(in oklab, var(--gold) 12%, transparent)', color: 'var(--ink)', border: '1px solid color-mix(in oklab, var(--gold) 40%, transparent)' }}
          >
            {error}
          </div>
        )}

        <Field label="Title" required>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assessment title" className="ml-input" />
        </Field>

        <Field label="Description" hint="optional">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description" className="ml-input" />
        </Field>

        <div className="mt-10 space-y-8">
          {questions.map((q, qi) => (
            <div key={qi} className="ml-card p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <Kicker>question {qi + 1}</Kicker>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(qi)} className="text-[12px] text-ink-faint hover:text-ink">
                    remove question
                  </button>
                )}
              </div>

              <input
                type="text"
                value={q.prompt}
                onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
                placeholder="What do you want to ask?"
                className="ml-input mb-5"
              />

              <div className="space-y-3">
                {q.choices.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-[12px] text-ink-soft cursor-pointer" title="Mark as the correct answer">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={c.isCorrect}
                        onChange={() => setCorrect(qi, ci)}
                        className="accent-[var(--moss)]"
                      />
                      correct
                    </label>
                    <input
                      type="text"
                      value={c.text}
                      onChange={(e) => updateChoice(qi, ci, { text: e.target.value })}
                      placeholder={`Choice ${ci + 1}`}
                      className="ml-input flex-1"
                    />
                    {q.choices.length > 2 && (
                      <button type="button" onClick={() => removeChoice(qi, ci)} className="text-[12px] text-ink-faint hover:text-ink px-1" aria-label="Remove choice">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => addChoice(qi)} className="mt-4 text-[12px] text-moss-deep">
                + add choice
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addQuestion} className="ml-button-ghost mt-8">
          + add question
        </button>

        <div className="mt-10 flex items-center gap-4">
          <button type="submit" disabled={submitting} className="ml-button-primary">
            {submitting ? 'saving…' : submitLabel}
            <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
          </button>
          <button type="button" onClick={onCancel} className="ml-button-ghost">cancel</button>
        </div>
      </form>
    </div>
  );
}

export default AssessmentForm;
