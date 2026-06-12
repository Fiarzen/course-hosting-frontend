import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeavesCollectedProvider, useLeavesCollected } from './LeavesCollectedContext';

const mockGetMyCourses = vi.fn();
vi.mock('../api/api', () => ({
  enrollmentApi: {
    getMyCourses: (...args) => mockGetMyCourses(...args),
  },
}));

const mockUseAuth = vi.fn();
vi.mock('./AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const KEY = 'leavesCollected_me@test.com';

function Consumer() {
  const { leavesCollected, celebratingMilestone, dismissCelebration, refresh } = useLeavesCollected();
  return (
    <div>
      <span data-testid="leaves">{leavesCollected}</span>
      <span data-testid="milestone">{celebratingMilestone ?? 'none'}</span>
      <button onClick={dismissCelebration}>dismiss</button>
      <button onClick={refresh}>refresh</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <LeavesCollectedProvider>
      <Consumer />
    </LeavesCollectedProvider>,
  );
}

const enrollments = (...counts) => counts.map((completedLessons, i) => ({
  course: { id: i + 1 },
  completedLessons,
  totalLessons: completedLessons + 1,
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { email: 'me@test.com' } });
  mockGetMyCourses.mockResolvedValue([]);
});

describe('LeavesCollectedContext', () => {
  it('sums completedLessons across enrollments and persists per-user', async () => {
    mockGetMyCourses.mockResolvedValue(enrollments(2, 3));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('leaves')).toHaveTextContent('5'));
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual({ leavesCollected: 5, seenMilestones: [] });
  });

  it('stays at zero and skips fetching when signed out', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('leaves')).toHaveTextContent('0'));
    expect(mockGetMyCourses).not.toHaveBeenCalled();
  });

  it('never drops below the stored count (ratchet on unenroll)', async () => {
    localStorage.setItem(KEY, JSON.stringify({ leavesCollected: 8, seenMilestones: [] }));
    mockGetMyCourses.mockResolvedValue(enrollments(3));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('leaves')).toHaveTextContent('8'));
    expect(JSON.parse(localStorage.getItem(KEY)).leavesCollected).toBe(8);
  });

  it('celebrates a newly crossed milestone and marks it seen', async () => {
    mockGetMyCourses.mockResolvedValue(enrollments(7, 5));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('milestone')).toHaveTextContent('10'));
    expect(JSON.parse(localStorage.getItem(KEY)).seenMilestones).toContain(10);
  });

  it('does not re-celebrate a milestone already seen', async () => {
    localStorage.setItem(KEY, JSON.stringify({ leavesCollected: 12, seenMilestones: [10] }));
    mockGetMyCourses.mockResolvedValue(enrollments(12));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('leaves')).toHaveTextContent('12'));
    expect(screen.getByTestId('milestone')).toHaveTextContent('none');
  });

  it('celebrates the highest milestone when several are crossed at once', async () => {
    mockGetMyCourses.mockResolvedValue(enrollments(60));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('milestone')).toHaveTextContent('50'));
    expect(JSON.parse(localStorage.getItem(KEY)).seenMilestones).toEqual([10, 25, 50]);
  });

  it('dismissCelebration clears the celebration without unmarking it', async () => {
    mockGetMyCourses.mockResolvedValue(enrollments(10));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('milestone')).toHaveTextContent('10'));

    await act(async () => {
      screen.getByRole('button', { name: 'dismiss' }).click();
    });

    expect(screen.getByTestId('milestone')).toHaveTextContent('none');
    expect(JSON.parse(localStorage.getItem(KEY)).seenMilestones).toContain(10);
  });

  it('refresh() picks up newly completed lessons', async () => {
    mockGetMyCourses.mockResolvedValue(enrollments(4));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('leaves')).toHaveTextContent('4'));

    mockGetMyCourses.mockResolvedValue(enrollments(5));
    await act(async () => {
      screen.getByRole('button', { name: 'refresh' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('leaves')).toHaveTextContent('5'));
  });

  it('recovers from corrupt stored data', async () => {
    localStorage.setItem(KEY, 'not-json{{{');
    mockGetMyCourses.mockResolvedValue(enrollments(2));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('leaves')).toHaveTextContent('2'));
  });
});
