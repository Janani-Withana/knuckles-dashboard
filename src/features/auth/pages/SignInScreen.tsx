import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { signInSchema, type SignInFormValues } from "@/features/auth/schemas";
import { useAuth } from "@/hooks/useAuth";
import { homeRouteForUser } from "@/routes/paths";
import { ApiError, getApiErrorMessage } from "@/utils/errors";

export default function SignInScreen() {
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setError("");
    try {
      const user = await login(values.email, values.password);
      navigate(homeRouteForUser(user), { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && (err.status === 0 || err.status >= 500)
          ? getApiErrorMessage(err, "Couldn't reach the server.")
          : "That email and password don't match.",
      );
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your stay at Knuckles Retreat"
    >
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <div className="auth-input-wrap">
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrap">
            <input
              id="password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
