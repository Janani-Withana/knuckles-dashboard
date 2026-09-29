import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "../../lib/api";
import {
  invitePropertyAdmin,
  registerPropertyAdmin,
} from "../../services/propertyAdminService.service";

const empty = { firstName: "", lastName: "", email: "" };

/** At least 8 characters, with upper, lower, digit, and a symbol. */
const generateTemporaryPassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$%";
  const all = upper + lower + digits + symbols;
  const pick = (set: string) =>
    set[crypto.getRandomValues(new Uint8Array(1))[0] % set.length];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = crypto.getRandomValues(new Uint8Array(8));
  for (const n of rest) chars.push(all[n % all.length]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint8Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

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
  const [issuedPassword, setIssuedPassword] = useState("");

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
    const problem = identityProblem();
    if (problem) return setError(problem);

    const password = generateTemporaryPassword();
    setLoading(true);
    try {
      await registerPropertyAdmin({ ...identity(), password });
      setIssuedPassword(password);
      setRegistered(true);
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
      const result = await invitePropertyAdmin(identity());
      const email = form.email.trim();
      setInvited(true);
      if (result?.emailSent === false) {
        const password = result.temporaryPassword || issuedPassword;
        setNotice(
          password
            ? `The invitation email could not be sent. Share this temporary password with ${email}: ${password}`
            : `The invitation email could not be sent.`,
        );
      } else {
        setNotice(`Invitation sent to ${email}.`);
      }
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
    setIssuedPassword("");
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
