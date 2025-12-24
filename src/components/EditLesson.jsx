import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonsApi } from '../api/api';

function EditLesson() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    videoUrl: '',
  });
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFiles({ pdf: file });
    if (file) {
      setRemovePdf(false);
    }
  };

  // Same YouTube URL normalization as in CreateLesson
  const convertToEmbedUrl = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Edit Lesson</h2>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
              placeholder="Enter lesson title"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows="6"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
              placeholder="Enter lesson content"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="videoUrl" className="block text-gray-700 text-sm font-bold mb-2">
              YouTube Video URL (Optional)
            </label>
            <input
              type="url"
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Paste a YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="pdf" className="block text-gray-700 text-sm font-bold mb-2">
              PDF File (Optional)
            </label>
            <input
              type="file"
              id="pdf"
              name="pdf"
              accept="application/pdf"
              onChange={handleFileChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
            />
            {files.pdf && (
              <p className="mt-2 text-sm text-gray-600">Selected: {files.pdf.name}</p>
            )}
            {!files.pdf && existingPdfUrl && (
              <div className="mt-2 flex items-center space-x-3">
                <a
                  href={existingPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  View current PDF
                </a>
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={removePdf}
                    onChange={(e) => setRemovePdf(e.target.checked)}
                  />
                  Remove PDF
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(`/courses/${courseId}`)}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditLesson;
