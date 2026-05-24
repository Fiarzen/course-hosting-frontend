import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Courses from './Courses';

const mockGetAll = vi.fn();
const mockGetMyCourses = vi.fn();
const mockEnroll = vi.fn();

vi.mock('../api/api', () => ({
  coursesApi: { getAll: (...args) => mockGetAll(...args) },
  enrollmentApi: {
    getMyCourses: (...args) => mockGetMyCourses(...args),
    enrollInCourse: (...args) => mockEnroll(...args),
  },
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const SAMPLE_COURSES = [
  { id: 1, title: 'React Basics', description: 'Learn React', author: { name: 'Alice', email: 'a@a.com' } },
  { id: 2, title: 'Node Deep Dive', description: null, author: null },
];

function renderCourses() {
  return render(
    <MemoryRouter>
      <Courses />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: unauthenticated student
  mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
  mockGetAll.mockResolvedValue(SAMPLE_COURSES);
  mockGetMyCourses.mockResolvedValue([]);
});

describe('Courses', () => {
  it('shows a loading spinner while fetching', () => {
    mockGetAll.mockReturnValue(new Promise(() => {})); // never resolves
    renderCourses();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders course titles after data loads', async () => {
    renderCourses();
    expect(await screen.findByText('React Basics')).toBeInTheDocument();
    expect(screen.getByText('Node Deep Dive')).toBeInTheDocument();
  });

  it('shows "No courses found" when API returns empty array', async () => {
    mockGetAll.mockResolvedValue([]);
    renderCourses();
    expect(await screen.findByText(/no courses found/i)).toBeInTheDocument();
  });

  it('shows error message when API rejects', async () => {
    mockGetAll.mockRejectedValue(new Error('network'));
    renderCourses();
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load courses');
  });

  it('shows "+ Create Course" button for CREATOR role', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'CREATOR' } });
    mockGetMyCourses.mockResolvedValue([]);
    renderCourses();
    expect(await screen.findByRole('link', { name: /create course/i })).toBeInTheDocument();
  });

  it('shows "+ Create Course" button for ADMIN role', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'ADMIN' } });
    mockGetMyCourses.mockResolvedValue([]);
    renderCourses();
    expect(await screen.findByRole('link', { name: /create course/i })).toBeInTheDocument();
  });

  it('does NOT show "+ Create Course" for STUDENT role', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'STUDENT' } });
    mockGetMyCourses.mockResolvedValue([]);
    renderCourses();
    await screen.findByText('React Basics');
    expect(screen.queryByRole('link', { name: /create course/i })).not.toBeInTheDocument();
  });

  it('shows Enroll button for authenticated non-enrolled user', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'STUDENT' } });
    mockGetMyCourses.mockResolvedValue([]);
    renderCourses();
    await screen.findByText('React Basics');
    const enrollButtons = screen.getAllByRole('button', { name: /^enroll$/i });
    expect(enrollButtons).toHaveLength(2);
  });

  it('shows "Enrolled" badge for already-enrolled courses', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'STUDENT' } });
    mockGetMyCourses.mockResolvedValue([{ course: { id: 1 } }]);
    renderCourses();
    await screen.findByText('React Basics');
    expect(screen.getByRole('link', { name: /^enrolled$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^enroll$/i })).toBeInTheDocument();
  });

  it('does not show Enroll button for unauthenticated users', async () => {
    renderCourses();
    await screen.findByText('React Basics');
    expect(screen.queryByRole('button', { name: /enroll/i })).not.toBeInTheDocument();
  });
});
