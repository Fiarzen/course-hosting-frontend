import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Courses, { courseMatchesFilters } from './Courses';

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
  it('shows a loading indicator while fetching', () => {
    mockGetAll.mockReturnValue(new Promise(() => {})); // never resolves
    renderCourses();
    expect(screen.getByRole('status')).toBeInTheDocument();
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

  it('shows the new-course button for CREATOR role', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'CREATOR' } });
    mockGetMyCourses.mockResolvedValue([]);
    renderCourses();
    expect(await screen.findByRole('link', { name: /new course/i })).toBeInTheDocument();
  });

  it('shows the new-course button for ADMIN role', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'ADMIN' } });
    mockGetMyCourses.mockResolvedValue([]);
    renderCourses();
    expect(await screen.findByRole('link', { name: /new course/i })).toBeInTheDocument();
  });

  it('does NOT show the new-course button for STUDENT role', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'STUDENT' } });
    mockGetMyCourses.mockResolvedValue([]);
    renderCourses();
    await screen.findByText('React Basics');
    expect(screen.queryByRole('link', { name: /new course/i })).not.toBeInTheDocument();
  });

  it('shows Enroll button for authenticated non-enrolled user', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'STUDENT' } });
    mockGetMyCourses.mockResolvedValue([]);
    renderCourses();
    await screen.findByText('React Basics');
    const enrollButtons = screen.getAllByRole('button', { name: /^enroll$/i });
    expect(enrollButtons).toHaveLength(2);
  });

  it('shows a "tending" marker for already-enrolled courses', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'STUDENT' } });
    mockGetMyCourses.mockResolvedValue([{ course: { id: 1 } }]);
    renderCourses();
    await screen.findByText('React Basics');
    expect(screen.getByRole('link', { name: /tending/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^enroll$/i })).toBeInTheDocument();
  });

  it('does not show Enroll button for unauthenticated users', async () => {
    renderCourses();
    await screen.findByText('React Basics');
    expect(screen.queryByRole('button', { name: /enroll/i })).not.toBeInTheDocument();
  });

  it('filters courses by search text', async () => {
    renderCourses();
    await screen.findByText('React Basics');
    await userEvent.type(screen.getByLabelText(/search courses/i), 'node');
    expect(screen.queryByText('React Basics')).not.toBeInTheDocument();
    expect(screen.getByText('Node Deep Dive')).toBeInTheDocument();
  });

  it('suggests clearing filters when search matches nothing', async () => {
    renderCourses();
    await screen.findByText('React Basics');
    await userEvent.type(screen.getByLabelText(/search courses/i), 'zzzz');
    expect(screen.getByText(/nothing matches your search or filters/i)).toBeInTheDocument();
  });

  it('filters courses by lesson-count bucket', async () => {
    mockGetAll.mockResolvedValue([
      { id: 1, title: 'Short Course', description: '', lessonCount: 2 },
      { id: 2, title: 'Long Course', description: '', lessonCount: 12 },
    ]);
    renderCourses();
    await screen.findByText('Short Course');
    await userEvent.click(screen.getByRole('button', { name: /long/i }));
    expect(screen.queryByText('Short Course')).not.toBeInTheDocument();
    expect(screen.getByText('Long Course')).toBeInTheDocument();
  });
});

describe('courseMatchesFilters', () => {
  const course = {
    title: 'Gentle Botany',
    description: 'Leaves and stems, slowly.',
    isPaid: false,
    lessonCount: 5,
  };

  it('matches everything with default options', () => {
    expect(courseMatchesFilters(course)).toBe(true);
    expect(courseMatchesFilters(course, {})).toBe(true);
  });

  it('matches search against title, case-insensitively', () => {
    expect(courseMatchesFilters(course, { search: 'BOTANY' })).toBe(true);
    expect(courseMatchesFilters(course, { search: '  botany ' })).toBe(true);
  });

  it('matches search against description', () => {
    expect(courseMatchesFilters(course, { search: 'stems' })).toBe(true);
  });

  it('rejects search text found in neither field', () => {
    expect(courseMatchesFilters(course, { search: 'rust' })).toBe(false);
  });

  it('tolerates missing title and description', () => {
    expect(courseMatchesFilters({}, { search: 'anything' })).toBe(false);
    expect(courseMatchesFilters({}, { search: '' })).toBe(true);
  });

  it('applies the free/paid filter', () => {
    expect(courseMatchesFilters(course, { filter: 'free' })).toBe(true);
    expect(courseMatchesFilters(course, { filter: 'paid' })).toBe(false);
    expect(courseMatchesFilters({ ...course, isPaid: true }, { filter: 'paid' })).toBe(true);
    expect(courseMatchesFilters({ ...course, isPaid: true }, { filter: 'free' })).toBe(false);
  });

  it('applies length buckets from lessons array or lessonCount', () => {
    expect(courseMatchesFilters({ lessons: [1, 2] }, { lengthFilter: 'short' })).toBe(true);
    expect(courseMatchesFilters({ lessonCount: 3 }, { lengthFilter: 'short' })).toBe(true);
    expect(courseMatchesFilters({ lessonCount: 4 }, { lengthFilter: 'short' })).toBe(false);
    expect(courseMatchesFilters({ lessonCount: 4 }, { lengthFilter: 'medium' })).toBe(true);
    expect(courseMatchesFilters({ lessonCount: 8 }, { lengthFilter: 'medium' })).toBe(true);
    expect(courseMatchesFilters({ lessonCount: 9 }, { lengthFilter: 'long' })).toBe(true);
    expect(courseMatchesFilters({ lessonCount: 8 }, { lengthFilter: 'long' })).toBe(false);
  });

  it('excludes courses with no lessons from sized buckets but not from any', () => {
    expect(courseMatchesFilters({}, { lengthFilter: 'short' })).toBe(false);
    expect(courseMatchesFilters({}, { lengthFilter: 'any' })).toBe(true);
  });

  it('combines search, payment, and length filters', () => {
    expect(courseMatchesFilters(course, { filter: 'free', search: 'gentle', lengthFilter: 'medium' })).toBe(true);
    expect(courseMatchesFilters(course, { filter: 'free', search: 'gentle', lengthFilter: 'long' })).toBe(false);
  });
});
