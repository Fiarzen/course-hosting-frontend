import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home, { selectFeaturedCourses } from './Home';

const mockGetAll = vi.fn();

vi.mock('../api/api', () => ({
  coursesApi: { getAll: (...args) => mockGetAll(...args) },
  enrollmentApi: {
    getMyCourses: vi.fn().mockResolvedValue([]),
    getCourseProgress: vi.fn(),
  },
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
  mockGetAll.mockResolvedValue([]);
});

describe('Home featured courses', () => {
  it('shows featured courses and not the rest', async () => {
    mockGetAll.mockResolvedValue([
      { id: 1, title: 'Ordinary Course', description: '', featured: false },
      { id: 2, title: 'Starred Course', description: 'Hand-picked.', featured: true },
    ]);
    renderHome();
    expect(await screen.findByText('Starred Course')).toBeInTheDocument();
    expect(screen.getByText(/featured courses/i)).toBeInTheDocument();
    expect(screen.queryByText('Ordinary Course')).not.toBeInTheDocument();
  });

  it('falls back to the three most recent courses when none are featured', async () => {
    mockGetAll.mockResolvedValue([
      { id: 1, title: 'Oldest Course', description: '' },
      { id: 2, title: 'Second Course', description: '' },
      { id: 3, title: 'Third Course', description: '' },
      { id: 4, title: 'Newest Course', description: '' },
    ]);
    renderHome();
    expect(await screen.findByText('Newest Course')).toBeInTheDocument();
    expect(screen.getByText(/recently planted/i)).toBeInTheDocument();
    expect(screen.getByText('Third Course')).toBeInTheDocument();
    expect(screen.getByText('Second Course')).toBeInTheDocument();
    expect(screen.queryByText('Oldest Course')).not.toBeInTheDocument();
  });

  it('renders no featured section when there are no courses', async () => {
    renderHome();
    // The hero always renders; wait for the fetch to settle.
    await screen.findByRole('link', { name: /browse the catalogue/i });
    expect(screen.queryByText(/featured courses/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recently planted/i)).not.toBeInTheDocument();
  });

  it('hides the section when the courses request fails', async () => {
    mockGetAll.mockRejectedValue(new Error('network'));
    renderHome();
    await screen.findByRole('link', { name: /browse the catalogue/i });
    expect(screen.queryByText(/featured courses/i)).not.toBeInTheDocument();
  });
});

describe('selectFeaturedCourses', () => {
  it('returns only featured courses when any exist', () => {
    const courses = [
      { id: 1, featured: false },
      { id: 2, featured: true },
      { id: 3, featured: true },
    ];
    expect(selectFeaturedCourses(courses).map((c) => c.id)).toEqual([2, 3]);
  });

  it('caps featured courses at the limit', () => {
    const courses = [1, 2, 3, 4].map((id) => ({ id, featured: true }));
    expect(selectFeaturedCourses(courses)).toHaveLength(3);
  });

  it('falls back to newest-first by id when none are featured', () => {
    const courses = [{ id: 5 }, { id: 9 }, { id: 2 }, { id: 7 }];
    expect(selectFeaturedCourses(courses).map((c) => c.id)).toEqual([9, 7, 5]);
  });

  it('does not mutate the input order', () => {
    const courses = [{ id: 1 }, { id: 3 }, { id: 2 }];
    selectFeaturedCourses(courses);
    expect(courses.map((c) => c.id)).toEqual([1, 3, 2]);
  });
});
