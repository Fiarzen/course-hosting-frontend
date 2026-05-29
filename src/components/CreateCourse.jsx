import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesApi } from '../api/api';
import { CURRENCY_OPTIONS, formatPrice } from '../utils/pricing';
import { Leaf, Kicker, Field } from './Leaf';

function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    restrictedToAllowList: false,
    allowedEmailsText: '',
    isPaid: false,
    priceInput: '',
    currency: 'gbp',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const raw = formData.allowedEmailsText || '';
      const allowedEmails = raw
        .split(/[,\n]/)
        .map((em) => em.trim().toLowerCase())
        .filter((em) => em.length > 0);

      let priceCents = null;
      if (formData.isPaid) {
        const parsed = parseFloat(formData.priceInput);
        if (isNaN(parsed) || parsed <= 0) {
          setError('Please enter a valid price greater than 0.');
          setLoading(false);
          return;
        }
        priceCents = Math.round(parsed * 100);
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        authorId: user?.id,
        restrictedToAllowList: formData.restrictedToAllowList,
        allowedEmails,
        isPaid: formData.isPaid,
        priceCents: formData.isPaid ? priceCents : null,
        currency: formData.isPaid ? formData.currency : null,
      };

      await coursesApi.create(courseData);
      navigate('/courses');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to create course. Please make sure you are logged in as a CREATOR or ADMIN.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const previewPrice = formData.isPaid
    ? (formData.priceInput ? formatPrice(Math.round(parseFloat(formData.priceInput || '0') * 100), formData.currency) || 'paid' : 'paid')
    : 'free';

  const inputStyle = { background: 'transparent', border: '1px solid var(--hair-strong)', color: 'var(--ink)' };

  return (
    <div className="ml-screen-fade max-w-page mx-auto py-12">
      <button onClick={() => navigate('/my-courses')} className="text-[13px] text-ink-soft mb-8">
        ← back to your courses
      </button>

      <div className="grid gap-16 lg:grid-cols-[1.3fr_1fr] items-start">
        <section>
          <Kicker className="mb-4">new course</Kicker>
          <h1 className="font-serif text-[clamp(38px,5vw,56px)] leading-[1.05] text-ink tracking-tight2 mb-3">Plant a course.</h1>
          <p className="text-[16px] text-ink-soft leading-relaxed max-w-[480px] mb-10">
            Start with a title and a single sentence. You can add lessons, video, and PDFs later.
          </p>

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
              <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="What will you teach?" className="ml-input" />
            </Field>

            <Field label="One-sentence description" hint={`${formData.description.length} / 180`}>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => handleChange({ target: { name: 'description', value: e.target.value.slice(0, 180), type: 'text' } })}
                rows="2"
                placeholder="A single sentence that says what this course is, and what it is not."
                className="ml-input resize-none"
              />
            </Field>

            <Field label="Tuition">
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, isPaid: false }))}
                  className="flex-1 rounded text-[13px] py-2.5"
                  style={{
                    border: '1px solid ' + (!formData.isPaid ? 'var(--moss)' : 'var(--hair-strong)'),
                    background: !formData.isPaid ? 'var(--moss-wash)' : 'transparent',
                    color: !formData.isPaid ? 'var(--moss-deep)' : 'var(--ink-soft)',
                  }}
                >
                  free
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, isPaid: true }))}
                  className="flex-1 rounded text-[13px] py-2.5"
                  style={{
                    border: '1px solid ' + (formData.isPaid ? 'var(--moss)' : 'var(--hair-strong)'),
                    background: formData.isPaid ? 'var(--moss-wash)' : 'transparent',
                    color: formData.isPaid ? 'var(--moss-deep)' : 'var(--ink-soft)',
                  }}
                >
                  paid
                </button>
              </div>
            </Field>

            {formData.isPaid && (
              <Field label="Price">
                <div className="flex gap-3">
                  <input
                    type="number"
                    name="priceInput"
                    value={formData.priceInput}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required={formData.isPaid}
                    placeholder="9.99"
                    className="ml-input flex-1"
                  />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="text-[14px] px-3 rounded"
                    style={inputStyle}
                  >
                    {CURRENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </Field>
            )}

            <Field label="Access">
              <label className="inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  name="restrictedToAllowList"
                  checked={formData.restrictedToAllowList}
                  onChange={handleChange}
                  className="mr-2 accent-[var(--moss)]"
                />
                <span className="text-[13px] text-ink-soft">Restrict access to specific emails</span>
              </label>
              <p className="mt-2 text-[12px] text-ink-faint">
                When enabled, only allowed emails, the author, and admins can enroll and view content.
              </p>
            </Field>

            {formData.restrictedToAllowList && (
              <Field label="Allowed emails" hint="comma or newline separated">
                <textarea
                  name="allowedEmailsText"
                  value={formData.allowedEmailsText}
                  onChange={handleChange}
                  rows="3"
                  placeholder="user1@example.com, user2@example.com"
                  className="ml-input resize-none"
                />
              </Field>
            )}

            <div className="mt-9 flex items-center gap-4 flex-wrap">
              <button type="submit" disabled={loading} className="ml-button-primary">
                {loading ? 'creating…' : 'save and continue'}
                <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
              </button>
              <button type="button" onClick={() => navigate('/my-courses')} className="ml-button-ghost">cancel</button>
            </div>
          </form>
        </section>

        {/* Live preview */}
        <aside className="ml-card p-8 lg:sticky lg:top-24">
          <div className="font-mono text-[10px] tracking-widest uppercase text-ink-faint mb-5">preview</div>
          <div className="relative p-6 rounded-md min-h-[220px]" style={{ background: 'var(--paper)', border: '1px solid var(--hair)' }}>
            <span className="absolute top-5 right-5" style={{ color: 'var(--moss)' }}>
              <Leaf size={18} strokeWidth={0} tilt={formData.isPaid ? 28 : -22} />
            </span>
            <div className="font-mono text-[11px] tracking-widest uppercase text-ink-faint mb-3">0 lessons</div>
            <h3 className="font-serif text-[22px] leading-tight mb-2" style={{ color: formData.title ? 'var(--ink)' : 'var(--ink-faint)' }}>
              {formData.title || 'Your course title'}
            </h3>
            <p className="text-[14px] leading-relaxed" style={{ color: formData.description ? 'var(--ink-soft)' : 'var(--ink-faint)' }}>
              {formData.description || 'Your one-sentence description will appear here.'}
            </p>
            <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--hair)' }}>
              <span className="text-[13px] text-ink">{user?.name || user?.email}</span>
              <span className="font-serif text-[16px] text-ink">{(previewPrice || 'free').toLowerCase()}</span>
            </div>
          </div>
          <p className="mt-5 text-[12px] text-ink-faint leading-relaxed">
            This is how your course card will appear in the catalogue. You can add lessons and a cover after saving.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default CreateCourse;
