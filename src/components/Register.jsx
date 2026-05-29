import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usersApi } from "../api/api";
import { Leaf, Field } from "./Leaf";
import { AuthShell } from "./AuthShell";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [role, setRole] = useState("learner"); // decorative — the API has no role on register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const registrationData = {
        name: formData.name || undefined,
        email: formData.email,
        password: formData.password,
      };
      await usersApi.register(registrationData);
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err.response && err.response.status === 409) {
        setError("This email is already registered. Please use a different email or try logging in.");
      } else {
        setError("Registration failed. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      kicker="begin"
      title="Create a quiet account"
      intro="No newsletters, no streaks. Just the courses, the leaves, and the time you give them."
      progress={2}
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div
            role="alert"
            className="mb-6 rounded px-4 py-3 text-[13px]"
            style={{ background: "color-mix(in oklab, var(--gold) 12%, transparent)", color: "var(--ink)", border: "1px solid color-mix(in oklab, var(--gold) 40%, transparent)" }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded px-4 py-3 text-[13px]"
            style={{ background: "var(--moss-wash)", color: "var(--moss-deep)", border: "1px solid color-mix(in oklab, var(--moss-soft) 60%, transparent)" }}
          >
            <Leaf size={16} strokeWidth={0} />
            <span>
              <strong className="text-ink">Account created! </strong>
              Check your inbox for a verification email. Taking you home…
            </span>
          </div>
        )}

        <Field label="Name" hint="optional">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            placeholder="what to call you"
            className="ml-input"
          />
        </Field>

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

        <Field label="Password" required hint="at least 6 characters">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            className="ml-input"
          />
        </Field>

        <Field label="Confirm password" required>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            className="ml-input"
          />
        </Field>

        <Field label="I'm here to">
          <div className="flex gap-2.5 mt-1">
            {[["learner", "learn"], ["creator", "teach"]].map(([key, label]) => {
              const activeRole = role === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setRole(key)}
                  className="flex-1 flex items-center justify-center gap-2.5 rounded text-[14px]"
                  style={{
                    padding: "14px 18px",
                    border: "1px solid " + (activeRole ? "var(--moss)" : "var(--hair-strong)"),
                    background: activeRole ? "var(--moss-wash)" : "transparent",
                    color: activeRole ? "var(--moss-deep)" : "var(--ink-soft)",
                    transition: "background 200ms ease, border-color 200ms ease",
                  }}
                >
                  <Leaf size={12} filled={activeRole} strokeWidth={activeRole ? 0 : 1.2} /> {label}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="mt-9 flex items-center justify-between gap-3 flex-wrap">
          <button type="submit" disabled={loading || success} className="ml-button-primary">
            {loading ? "creating account…" : success ? "account created" : "register"}
            <Leaf size={12} strokeWidth={0} tilt={-20} color="var(--moss-soft)" />
          </button>
          <Link to="/login" className="text-[13px] text-ink-soft">
            already have an account? sign in
          </Link>
        </div>

        <p className="mt-8 text-[12px] text-ink-faint leading-relaxed max-w-[420px]">
          By creating an account you agree to our quiet terms — no spam, no third-party tracking,
          and no recommendation engine.
        </p>
      </form>
    </AuthShell>
  );
}

export default Register;
