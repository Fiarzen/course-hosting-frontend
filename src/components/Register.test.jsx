import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../api/api', () => ({
  usersApi: { register: (...args) => mockRegister(...args) },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );
}

// Fill form fields using a freshly created userEvent instance (supports fake timers when needed)
async function fillForm(user, { name = '', email = '', password = '', confirm = '' } = {}) {
  if (name) await user.type(screen.getByLabelText(/name/i), name);
  if (email) await user.type(screen.getByLabelText(/^email/i), email);
  if (password) await user.type(screen.getByLabelText(/^password/i), password);
  if (confirm) await user.type(screen.getByLabelText(/confirm password/i), confirm);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Register', () => {
  it('shows error when email or password is missing', async () => {
    renderRegister();
    // fireEvent.submit bypasses native required validation so handleSubmit runs
    const form = screen.getByRole('button', { name: /register/i }).closest('form');
    fireEvent.submit(form);
    expect(await screen.findByRole('alert')).toHaveTextContent('Email and password are required');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error when password is shorter than 6 characters', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { email: 'a@b.com', password: 'abc', confirm: 'abc' });
    await user.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('at least 6 characters');
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { email: 'a@b.com', password: 'abcdef', confirm: 'xyzxyz' });
    await user.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('do not match');
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { email: 'not-an-email', password: 'abcdef', confirm: 'abcdef' });
    // fireEvent.submit because the email input type="email" native validation would block the button click
    const form = screen.getByRole('button', { name: /register/i }).closest('form');
    fireEvent.submit(form);
    expect(await screen.findByRole('alert')).toHaveTextContent('valid email');
  });

  it('calls usersApi.register with correct data and shows success message', async () => {
    mockRegister.mockResolvedValue({});
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { name: 'Alice', email: 'alice@test.com', password: 'secret', confirm: 'secret' });
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'secret',
    }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Account created!');
  });

  it('omits name from payload when name field is left blank', async () => {
    mockRegister.mockResolvedValue({});
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { email: 'b@test.com', password: 'secret', confirm: 'secret' });
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    const payload = mockRegister.mock.calls[0][0];
    expect(payload.name).toBeUndefined();
  });

  it('shows email-already-registered error on 409 response', async () => {
    mockRegister.mockRejectedValue({ response: { status: 409 } });
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { email: 'dup@test.com', password: 'secret', confirm: 'secret' });
    await user.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already registered');
  });

  it('shows backend error message when provided', async () => {
    mockRegister.mockRejectedValue({
      response: { status: 400, data: { error: 'Domain not allowed' } },
    });
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { email: 'x@bad.com', password: 'secret', confirm: 'secret' });
    await user.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Domain not allowed');
  });

  it('redirects to home 2 seconds after successful registration', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    mockRegister.mockResolvedValue({});
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { email: 'c@test.com', password: 'secret', confirm: 'secret' });
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Wait until the component schedules its 2-second redirect
    await waitFor(() =>
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000),
    );
    expect(mockNavigate).not.toHaveBeenCalled();

    // Fire the captured callback immediately (no real 2-second wait needed)
    const [callback] = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 2000);
    await act(async () => { callback(); });

    expect(mockNavigate).toHaveBeenCalledWith('/');
    setTimeoutSpy.mockRestore();
  });
});
