import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonsApi } from '../api/api';
import { Leaf, Kicker, Field, LeafLoader } from './Leaf';
import RichTextEditor from './RichTextEditor';

function EditLesson() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const [formData, setFormData] = useState({ title: '', content: '', videoUrl: '' });
  const [existingPdfUrl, setExistingPdfUrl] = useState(null);
  const [files, setFiles] = useState({ pdf: null });
  const [removePdf, setRemovePdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLesson = async () => {
      try {
        setLoading(true);
        const lesson = await lessonsApi.getById(parseInt(lessonId));
        setFormData({
          title: lesson.title || '',
          content: lesson.content || '',
          videoUrl: lesson.videoUrl || '',
        });
        setExistingPdfUrl(lesson.pdfUrl || null);
        setFiles({ pdf: null });
        setRemovePdf(false);
        setError(null);
      } catch (err) {
        console.error('Failed to load lesson for edit:', err);
        setError('Failed to load lesson. Make sure you are the course author or an admin.');
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFiles({ pdf: file });
    if (file) {
      setRemovePdf(false);
    }
  };

  const convertToEmbedUrl = (url) => {
    if (!url) return null;
    const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const videoUrl = formData.videoUrl ? convertToEmbedUrl(formData.videoUrl) : null;
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('content', formData.content);
      if (videoUrl) {
        fd.append('videoUrl', videoUrl);
      }
      fd.append('clearPdf', removePdf ? 'true' : 'false');
      if (files.pdf) {
        fd.append('pdf', files.pdf);
      }

      await lessonsApi.update(parseInt(lessonId), fd);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error('Failed to update lesson:', err);
      setError('Failed to update lesson. Please make sure you are the course author or an admin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LeafLoader label="loading lesson" />;
  }

  return (
    <div className="ml-screen-fade max-w-[680px] mx-auto py-12">
      <button onClick={() => navigate(`/courses/${courseId}`)} className="text-[13px] text-ink-soft mb-8">
        ← back to course
      </button>
      <Kicker className="mb-4">edit lesson</Kicker>
      <h1 className="font-serif text-[clamp(34px,5vw,48px)] leading-[1.05] tracking-tight2 text-ink mb-10">Edit a lesson.</h1>

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
          <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="Lesson title" className="ml-input" />
        </Field>

        <Field label="Content" required>
          <RichTextEditor
            value={formData.content}
            onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
          />
        </Field>

        <Field label="YouTube video URL" hint="optional">
          <input type="url" name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=…" className="ml-input" />
        </Field>

        <Field label="PDF notes" hint="optional">
          <input type="file" name="pdf" accept="application/pdf" onChange={handleFileChange} className="w-full text-[13px] text-ink-soft file:mr-3 file:rounded file:border-0 file:bg-[var(--moss-wash)] file:px-3 file:py-1.5 file:text-[var(--moss-deep)]" />
          {files.pdf && <p className="mt-2 text-[12px] text-ink-faint">Selected: {files.pdf.name}</p>}
          {!files.pdf && existingPdfUrl && (
            <div className="mt-3 flex items-center gap-4">
              <a href={existingPdfUrl} target="_blank" rel="noopener noreferrer" className="ml-link text-[13px]">view current pdf</a>
              <label className="flex items-center gap-2 text-[13px] text-ink-soft cursor-pointer">
                <input type="checkbox" checked={removePdf} onChange={(e) => setRemovePdf(e.target.checked)} className="accent-[var(--moss)]" />
                remove pdf
              </label>
            </div>
          )}
        </Field>

        <div className="mt-9 flex items-center gap-4">
          <button type="submit" disabled={saving} className="ml-button-primary">
            {saving ? 'saving…' : 'save changes'}
            <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
          </button>
          <button type="button" onClick={() => navigate(`/courses/${courseId}`)} className="ml-button-ghost">cancel</button>
        </div>
      </form>
    </div>
  );
}

export default EditLesson;
