import React, { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import type { SignUpFormData } from '../../types/auth';

interface SignUpScreenProps {
  onSignUp: () => void;
  onSwitchToSignIn: () => void;
}

const initialState: SignUpFormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

export default function SignUpScreen({
  onSignUp,
  onSwitchToSignIn,
}: SignUpScreenProps): React.ReactElement {
  const [form, setForm] = useState<SignUpFormData>(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.fullName || !form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // TODO: replace with your real auth API call
      // await signUp(form);
      onSignUp();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join Knuckles Retreat">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="fullName">Full Name</label>
          <input id="fullName" name="fullName" type="text" className="auth-input" placeholder="Your name" value={form.fullName} onChange={handleChange} />
        </div>

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="auth-input" placeholder="you@example.com" value={form.email} onChange={handleChange} />
        </div>

        <div className="auth-field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" className="auth-input" placeholder="+94 7X XXX XXXX" value={form.phone} onChange={handleChange} />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="auth-input" placeholder="••••••••" value={form.password} onChange={handleChange} />
        </div>

        <div className="auth-field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" className="auth-input" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitchToSignIn();
          }}
        >
          Sign in
        </a>
      </p>
    </AuthLayout>
  );
}