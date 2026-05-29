import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Login', () => {
  it('shows error when submitting empty fields', async () => {
    renderLogin();
    // fireEvent.submit bypasses native HTML5 required-field validation so handleSubmit runs
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    fireEvent.submit(form);
    expect(await screen.findByRole('alert')).toHaveTextContent('Email and password are required');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValue({ success: true });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'secret123'));
  });

  it('navigates to home on successful login', async () => {
    mockLogin.mockResolvedValue({ success: true });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows error message from login result on failure', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Wrong password' });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong password');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows loading text during submission', async () => {
    let resolve;
    mockLogin.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('button', { name: /signing in/i })).toBeDisabled();

    resolve({ success: true });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled(),
    );
  });
});
