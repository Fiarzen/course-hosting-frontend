import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesApi } from '../api/api';

const CURRENCY_OPTIONS = [
  { value: 'gbp', label: 'GBP (£)' },
  { value: 'usd', label: 'USD ($)' },
  { value: 'eur', label: 'EUR (€)' },
];

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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const raw = formData.allowedEmailsText || '';
      const allowedEmails = raw
        .split(/[,\n]/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0);

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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Create New Course</h2>

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
              placeholder="Enter course title"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
              placeholder="Enter course description"
            />
          </div>

          {/* Pricing */}
          <div className="mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Pricing</h3>
            <label className="inline-flex items-center mb-3">
              <input
                type="checkbox"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm font-medium">This is a paid course</span>
            </label>

            {formData.isPaid && (
              <div className="flex gap-3 mt-2">
                <div className="flex-1">
                  <label htmlFor="priceInput" className="block text-gray-700 text-xs font-bold mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    id="priceInput"
                    name="priceInput"
                    value={formData.priceInput}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required={formData.isPaid}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:border-indigo-500"
                    placeholder="9.99"
                  />
                </div>
                <div className="w-36">
                  <label htmlFor="currency" className="block text-gray-700 text-xs font-bold mb-1">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:border-indigo-500"
                  >
                    {CURRENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Access control */}
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="restrictedToAllowList"
                checked={formData.restrictedToAllowList}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm font-bold">
                Restrict access to specific users
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              When enabled, only allowed emails, the course author, and admins can enroll and view content.
            </p>
          </div>

          {formData.restrictedToAllowList && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Allowed emails (comma or newline separated)
              </label>
              <textarea
                id="allowedEmailsText"
                name="allowedEmailsText"
                value={formData.allowedEmailsText}
                onChange={handleChange}
                rows="3"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
                placeholder="user1@example.com, user2@example.com"
              />
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Course will be created by: <span className="font-medium">{user?.name || user?.email}</span>
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCourse;
