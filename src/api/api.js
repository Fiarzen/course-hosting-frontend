import axios from 'axios';

// Use the proxy path which is configured in vite.config.js
// This avoids CORS issues during development
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://localhost:8080';

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
};

// Lessons API
export const lessonsApi = {
  getAll: async () => {
    const response = await api.get('/lessons');
    return response.data;
  },
  getByCourse: async (courseId) => {
    const response = await api.get(`/lessons/course/${courseId}`);
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
  getCurrentUser: async (email, password) => {
    // Use Basic Auth for this request
    const response = await api.get('/users/me', {
      auth: {
        username: email,
        password: password,
      },
    });
    return response.data;
  },
  // Helper to set auth for all future requests
  setAuth: (email, password) => {
    if (email && password) {
      api.defaults.auth = {
        username: email,
        password: password,
      };
    } else {
      api.defaults.auth = undefined;
    }
  },
  upgradeUserToCreator: async (userId) => {
    const response = await api.post(`/users/${userId}/upgrade-to-creator`);
    return response.data;
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

