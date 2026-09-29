import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/routes/paths";

export default function ChangePasswordScreen() {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { completePasswordChange } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.newPassword || !form.confirmPassword) {
      setError("Please fill in both fields.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await completePasswordChange(form.newPassword);
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      setError("Couldn't update your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Your temporary password has expired. Choose a new one to continue."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="newPassword">New password</label>
          <div className="auth-input-wrap">
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={form.newPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <div className="auth-input-wrap">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? "Updating…" : "Update password & continue"}
        </button>
      </form>
    </AuthLayout>
  );
}
