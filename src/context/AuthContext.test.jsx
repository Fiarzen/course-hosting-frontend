import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../api/api', () => ({
  default: {
    defaults: { headers: { common: {} } },
  },
  authApi: {
    login: vi.fn(),
  },
  usersApi: {
    getCurrentUser: vi.fn(),
  },
}));

import api, { authApi, usersApi } from '../api/api';

function TestConsumer() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
    </div>
  );
}

function LoginConsumer() {
  const { login, logout } = useAuth();
  return (
    <>
      <button onClick={() => login('a@b.com', 'pass')}>login</button>
      <button onClick={logout}>logout</button>
      <TestConsumer />
    </>
  );
}

function renderWithProvider(ui) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  api.defaults.headers.common = {};
});

describe('AuthContext', () => {
  it('starts unauthenticated when localStorage is empty', async () => {
    renderWithProvider(<TestConsumer />);
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('no'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('restores session from localStorage on mount', async () => {
    localStorage.setItem(
      'auth_data',
      JSON.stringify({ token: 'tok123', user: { email: 'stored@test.com' } }),
    );
    renderWithProvider(<TestConsumer />);
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('yes'));
    expect(screen.getByTestId('user')).toHaveTextContent('stored@test.com');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer tok123');
  });

  it('silently clears corrupt localStorage on mount', async () => {
    localStorage.setItem('auth_data', 'not-valid-json{{{');
    renderWithProvider(<TestConsumer />);
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('no'));
    expect(localStorage.getItem('auth_data')).toBeNull();
  });

  it('login() success stores auth data and sets user', async () => {
    authApi.login.mockResolvedValue({ token: 'newtoken', user: { email: 'u@test.com' } });
    renderWithProvider(<LoginConsumer />);
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('no'));

    await act(async () => {
      screen.getByRole('button', { name: 'login' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('yes'));
    expect(screen.getByTestId('user')).toHaveTextContent('u@test.com');
    expect(JSON.parse(localStorage.getItem('auth_data')).token).toBe('newtoken');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer newtoken');
  });

  it('login() failure returns success:false with error message', async () => {
    authApi.login.mockRejectedValue({
      response: { data: { error: 'Bad credentials' } },
    });

    let result;
    function CapturingConsumer() {
      const { login } = useAuth();
      return (
        <button
          onClick={async () => {
            result = await login('x@y.com', 'wrong');
          }}
        >
          login
        </button>
      );
    }

    renderWithProvider(<CapturingConsumer />);
    await act(async () => {
      screen.getByRole('button', { name: 'login' }).click();
    });

    expect(result).toEqual({ success: false, error: 'Bad credentials' });
    expect(localStorage.getItem('auth_data')).toBeNull();
  });

  it('login() failure falls back to generic message when no response body', async () => {
    authApi.login.mockRejectedValue(new Error('network'));

    let result;
    function CapturingConsumer() {
      const { login } = useAuth();
      return (
        <button
          onClick={async () => {
            result = await login('x@y.com', 'wrong');
          }}
        >
          login
        </button>
      );
    }

    renderWithProvider(<CapturingConsumer />);
    await act(async () => {
      screen.getByRole('button', { name: 'login' }).click();
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password');
  });

  it('logout() clears localStorage and user state', async () => {
    localStorage.setItem(
      'auth_data',
      JSON.stringify({ token: 'tok', user: { email: 'me@test.com' } }),
    );
    renderWithProvider(<LoginConsumer />);
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('yes'));

    await act(async () => {
      screen.getByRole('button', { name: 'logout' }).click();
    });

    expect(screen.getByTestId('auth')).toHaveTextContent('no');
    expect(localStorage.getItem('auth_data')).toBeNull();
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });
});
