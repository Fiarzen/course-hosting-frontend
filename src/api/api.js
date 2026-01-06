import axios from 'axios';

// Always call the backend via the /api path.
// In development, Vite proxies /api -> http://localhost:8080 (see vite.config.js).
// In production (Netlify), netlify.toml proxies /api -> http://52.19.127.28:8080.
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Courses API
export const coursesApi = {
  getAll: async () => {
    const response = await api.get('/courses');
    return response.data;
  },
  create: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },
  // Courses created by the currently authenticated creator/admin
  getMyCreated: async () => {
    const response = await api.get('/courses/my-created');
    return response.data;
  },
  getAccess: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/access`);
    return response.data;
  },
  updateAccess: async (courseId, payload) => {
    const response = await api.put(`/courses/${courseId}/access`, payload);
    return response.data;
  },
  delete: async (courseId) => {
    await api.delete(`/courses/${courseId}`);
  },
};

// Lessons API
export const lessonsApi = {
  getAll: async () => {
    const response = await api.get('/lessons');
    return response.data;
  },
  getByCourse: async (courseId) => {
    const numericCourseId = Number(courseId);
    if (!Number.isInteger(numericCourseId)) {
      console.warn('lessonsApi.getByCourse called with invalid courseId:', courseId);
      return [];
    }
    const response = await api.get(`/lessons/course/${numericCourseId}`);
    return response.data;
  },
  getById: async (lessonId) => {
    const response = await api.get(`/lessons/${lessonId}`);
    return response.data;
  },
  reorderForCourse: async (courseId, orderedLessonIds) => {
    const response = await api.post(`/lessons/course/${courseId}/reorder`, orderedLessonIds);
    return response.data;
  },
  delete: async (lessonId) => {
    await api.delete(`/lessons/${lessonId}`);
  },
  update: async (lessonId, data) => {
    // `data` can be JSON or FormData. If it's FormData, override Content-Type so the browser sets the boundary.
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': undefined } }
      : {};
    const response = await api.put(`/lessons/${lessonId}`, data, config);
    return response.data;
  },
  create: async (lessonData, files = {}) => {
    const formData = new FormData();

    // Add PDF file if provided
    if (files.pdf) {
      formData.append('pdf', files.pdf);
    }

    // Add text parameters
    formData.append('title', lessonData.title);
    formData.append('content', lessonData.content);
    formData.append('courseId', lessonData.courseId.toString());
    
    // Add videoUrl if provided (YouTube URL)
    if (lessonData.videoUrl) {
      formData.append('videoUrl', lessonData.videoUrl);
    }

    // Send multipart/form-data body
    // Axios will automatically set Content-Type with boundary for FormData
    const response = await api.post('/lessons', formData, {
      headers: {
        'Content-Type': undefined, // Let axios set multipart/form-data with boundary automatically
      },
    });
    return response.data;
  },
};

// Users API
export const usersApi = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  upgradeUserToCreator: async (userId) => {
    const response = await api.post(`/users/${userId}/upgrade-to-creator`);
    return response.data;
  },
  // Admin: generate a password reset link for a given user
  resetPassword: async (userId) => {
    const response = await api.post(`/users/${userId}/reset-password`);
    return response.data; // { message, resetToken, resetPath }
  },
};

// Auth API (token-based)
export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // { token, user }
  },
  // Complete a password reset using the one-time token
  resetPasswordWithToken: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data; // { message }
  },
};

// Enrollment API
export const enrollmentApi = {
  enrollInCourse: async (courseId) => {
    const response = await api.post(`/enrollments/courses/${courseId}`);
    return response.data;
  },
  getMyCourses: async () => {
    const response = await api.get('/enrollments/my-courses');
    return response.data;
  },
  completeLesson: async (lessonId) => {
    const response = await api.post(`/enrollments/lessons/${lessonId}/complete`);
    return response.data;
  },
  getCourseProgress: async (courseId) => {
    const response = await api.get(`/enrollments/courses/${courseId}/progress`);
    return response.data;
  },
};

export default api;

