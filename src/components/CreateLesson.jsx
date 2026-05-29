import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { lessonsApi, coursesApi } from '../api/api';
import { Leaf, Kicker, Field } from './Leaf';

function CreateLesson() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseId: '',
    videoUrl: '',
  });
  const [files, setFiles] = useState({ pdf: null });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourses();
    const params = new URLSearchParams(location.search);
    const qsCourseId = params.get('courseId');
    if (qsCourseId) {
      setFormData((prev) => ({ ...prev, courseId: qsCourseId }));
    }
  }, [location.search]);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError('Failed to load courses. Please refresh the page.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    setFiles((prev) => ({ ...prev, [name]: file || null }));
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
    setLoading(true);
    setError(null);

    try {
      if (!formData.courseId) {
        setError('Please select a course.');
        setLoading(false);
        return;
      }
      const videoUrl = formData.videoUrl ? convertToEmbedUrl(formData.videoUrl) : null;
      await lessonsApi.create(
        {
          title: formData.title,
          content: formData.content,
          courseId: parseInt(formData.courseId),
          videoUrl: videoUrl,
        },
        files
      );
      navigate(`/courses/${formData.courseId}`);
    } catch (err) {
      setError('Failed to create lesson. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: 'transparent', border: '1px solid var(--hair-strong)', color: 'var(--ink)' };

  return (
    <div className="ml-screen-fade max-w-[680px] mx-auto py-12">
      <button onClick={() => navigate('/my-courses')} className="text-[13px] text-ink-soft mb-8">
        ← back to your courses
      </button>
      <Kicker className="mb-4">new lesson</Kicker>
      <h1 className="font-serif text-[clamp(34px,5vw,48px)] leading-[1.05] tracking-tight2 text-ink mb-10">Add a lesson.</h1>

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
          <textarea name="content" value={formData.content} onChange={handleChange} required rows="6" placeholder="Write the lesson…" className="ml-input resize-y" />
        </Field>

        <Field label="Course" required>
          <select name="courseId" value={formData.courseId} onChange={handleChange} required className="w-full text-[15px] px-3 py-2.5 rounded" style={inputStyle}>
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </Field>

        <Field label="YouTube video URL" hint="optional">
          <input type="url" name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=…" className="ml-input" />
        </Field>

        <Field label="PDF notes" hint="optional">
          <input type="file" name="pdf" accept="application/pdf" onChange={handleFileChange} className="w-full text-[13px] text-ink-soft file:mr-3 file:rounded file:border-0 file:bg-[var(--moss-wash)] file:px-3 file:py-1.5 file:text-[var(--moss-deep)]" />
          {files.pdf && <p className="mt-2 text-[12px] text-ink-faint">Selected: {files.pdf.name}</p>}
        </Field>

        <div className="mt-9 flex items-center gap-4">
          <button type="submit" disabled={loading} className="ml-button-primary">
            {loading ? 'creating…' : 'create lesson'}
            <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
          </button>
          <button type="button" onClick={() => navigate('/my-courses')} className="ml-button-ghost">cancel</button>
        </div>
      </form>
    </div>
  );
}

export default CreateLesson;
