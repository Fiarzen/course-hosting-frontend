import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonsApi, coursesApi } from '../api/api';

function CreateLesson() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseId: '',
    videoUrl: '',
  });
  const [files, setFiles] = useState({
    pdf: null,
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    setFiles((prev) => ({
      ...prev,
      [name]: file || null,
    }));
  };

  // Helper function to convert YouTube URL to embed format
  const convertToEmbedUrl = (url) => {
    if (!url) return null;
    
    // Handle various YouTube URL formats
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/embed/VIDEO_ID
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    
    // If it's already an embed URL, return as is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    return url; // Return original if no pattern matches
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

      // Convert YouTube URL to embed format if provided
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
      navigate('/lessons');
    } catch (err) {
      setError('Failed to create lesson. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Create New Lesson</h2>

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
            <label htmlFor="courseId" className="block text-gray-700 text-sm font-bold mb-2">
              Course *
            </label>
            <select
              id="courseId"
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
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

          <div className="mb-6">
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
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/lessons')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateLesson;



