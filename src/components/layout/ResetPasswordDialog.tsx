import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";
import { ApiError } from "../../lib/api";
import { resetAdminPassword } from "../../services/authService.service";
import "./ResetPasswordDialog.css";

interface ResetPasswordDialogProps {
  email?: string;
  onClose: () => void;
}

const scorePassword = (value: string) => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value) && value.length >= 10) score += 1;
  return score;
};

const STRENGTH = ["Too short", "Fair", "Good", "Strong", "Strong"] as const;

export default function ResetPasswordDialog({
  email,
  onClose,
}: ResetPasswordDialogProps) {
  const titleId = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onClose]);

  const strength = scorePassword(password);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await resetAdminPassword(password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't update your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="pwd-backdrop" onClick={() => !loading && onClose()}>
      <div
        className="pwd-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="pwd-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="pwd-icon" aria-hidden="true">
          <KeyRound size={20} />
        </div>
        <h2 id={titleId}>Reset password</h2>
        <p className="pwd-sub">
          {done
            ? "Your new password is saved. Use it the next time you sign in."
            : `Choose a new password${email ? ` for ${email}` : ""}. Your email stays the same.`}
        </p>

        {done ? (
          <button type="button" className="pwd-primary" onClick={onClose}>
            Done
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="pwd-field">
              New password
              <span className="pwd-input">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="pwd-reveal"
                  onClick={() => setShow((current) => !current)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {password && (
              <div className="pwd-strength" aria-live="polite">
                <span className="pwd-bars" data-score={strength}>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span>{STRENGTH[strength]}</span>
              </div>
            )}

            <label className="pwd-field">
              Confirm password
              <span className="pwd-input">
                <input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                />
              </span>
            </label>

            {error && <p className="pwd-error">{error}</p>}

            <div className="pwd-actions">
              <button
                type="button"
                className="pwd-ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="pwd-primary" disabled={loading}>
                {loading ? "Saving…" : "Update password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
