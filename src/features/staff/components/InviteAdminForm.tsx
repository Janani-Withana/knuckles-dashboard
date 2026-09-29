import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "../../lib/api";
import {
  invitePropertyAdmin,
  registerPropertyAdmin,
} from "../../services/propertyAdminService.service";

const empty = { firstName: "", lastName: "", email: "", password: "" };

export default function PropertyAdminPanel({
  propertyUid,
}: {
  propertyUid: string;
}) {
  const [form, setForm] = useState(empty);
  const [registered, setRegistered] = useState(false);
  const [invited, setInvited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const identityProblem = () => {
    if (!form.firstName.trim() || !form.lastName.trim())
      return "Enter the admin's first and last name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      return "Enter a valid email address.";
    return "";
  };

  const identity = () => ({
    propertyUid,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
  });

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const problem =
      identityProblem() ||
      (form.password.length < 8
        ? "Password must be at least 8 characters."
        : "");
    if (problem) return setError(problem);

    setLoading(true);
    try {
      await registerPropertyAdmin({ ...identity(), password: form.password });
      setRegistered(true);
      setForm((f) => ({ ...f, password: "" }));
      setNotice(`${form.email.trim()} is registered. Now send the invitation.`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not register the admin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await invitePropertyAdmin(identity());
      setInvited(true);
      setNotice(`Invitation sent to ${form.email.trim()}.`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not send the invitation.",
      );
    } finally {
      setLoading(false);
    }
  };

  const skipToInvite = () => {
    const problem = identityProblem();
    if (problem) return setError(problem);
    setError("");
    setRegistered(true);
  };

  const reset = () => {
    setForm(empty);
    setRegistered(false);
    setInvited(false);
    setError("");
    setNotice("");
  };

  return (
    <section className="sa-section">
      <div className="sa-section-head">
        <h3>Property admin</h3>
        <div className="sa-steps">
          <span className={`sa-step ${registered ? "done" : "active"}`}>
            1 · Register admin
          </span>
          <span
            className={`sa-step ${invited ? "done" : registered ? "active" : ""}`}
          >
            2 · Send invitation
          </span>
        </div>
      </div>

      <form className="rsv-form sa-flat" onSubmit={handleRegister}>
        <div className="rsv-grid">
          <label>
            First name
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              readOnly={registered}
            />
          </label>
          <label>
            Last name
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              readOnly={registered}
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              readOnly={registered}
            />
          </label>
          {!registered && (
            <label>
              Temporary password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </label>
          )}
        </div>

        {error && <p className="rsv-error">{error}</p>}
        {notice && <p className="rsv-success">{notice}</p>}

        <div className="rsv-actions">
          {!registered && (
            <>
              <button type="button" className="sa-link" onClick={skipToInvite}>
                Already registered? Skip to invitation
              </button>
              <button type="submit" className="rsv-btn" disabled={loading}>
                {loading ? "Registering…" : "Register admin"}
              </button>
            </>
          )}
          {registered && !invited && (
            <button
              type="button"
              className="rsv-btn"
              disabled={loading}
              onClick={handleInvite}
            >
              {loading ? "Sending…" : "Send invitation"}
            </button>
          )}
          {invited && (
            <button
              type="button"
              className="rsv-btn rsv-btn-ghost"
              onClick={reset}
            >
              Add another admin
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
