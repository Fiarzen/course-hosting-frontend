import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Field } from './Leaf';
import { AuthShell } from './AuthShell';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      kicker="welcome back"
      title="Sign in"
      intro="Pick up where you left off. Your leaves are waiting where you last set them."
      progress={5}
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded px-4 py-3 text-[13px]"
            style={{ background: 'color-mix(in oklab, var(--gold) 12%, transparent)', color: 'var(--ink)', border: '1px solid color-mix(in oklab, var(--gold) 40%, transparent)' }}
          >
            {error}
          </div>
        )}

        <Field label="Email" required>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="ml-input"
          />
        </Field>

        <Field
          label="Password"
          required
          hint={<Link to="/forgot-password" className="text-moss">forgot password?</Link>}
        >
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="ml-input"
          />
        </Field>

        <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
          <button type="submit" disabled={loading} className="ml-button-primary">
            {loading ? 'signing in…' : 'sign in'}
            <Leaf size={12} strokeWidth={0} tilt={-20} color="var(--moss-soft)" />
          </button>
          <Link to="/register" className="text-[13px] text-ink-soft">
            new here? create an account →
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export default Login;
