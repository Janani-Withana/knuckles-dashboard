import React, { useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import type { SignInFormData } from "../../types/auth";

interface SignInScreenProps {
  onSignIn: () => void;
  onSwitchToSignUp: () => void;
}

export default function SignInScreen({
  onSignIn,
  onSwitchToSignUp,
}: SignInScreenProps): React.ReactElement {
  const [form, setForm] = useState<SignInFormData>({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setLoading(true);

    try {
      // TODO: replace with your real auth API call
      // await signIn(form);
      onSignIn();
    } catch {
      setError("That email and password don\u2019t match.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your stay at Knuckles Retreat"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <div className="auth-input-wrap">
            <input
              id="email"
              name="email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrap">
            <input
              id="password"
              name="password"
              type="password"
              className="auth-input"
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? "Signing in\u2026" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        New to Knuckles Retreat?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitchToSignUp();
          }}
        >
          Create an account
        </a>
      </p>
    </AuthLayout>
  );
}
