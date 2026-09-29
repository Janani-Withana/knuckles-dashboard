import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../../lib/api";
import { ROUTES, superOrganizationPath } from "../../../routes/paths";
import { createOrganization } from "../../../services/superAdmin/organizationService.service";
import "../../admin/Reservations/reservations.css";
import "../superAdmin.css";

const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "AUD", "INR"];

const generateOrganizationCode = (name: string) => {
  const initials = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 6);
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${initials || "ORG"}-${suffix}`;
};

const empty = {
  name: "",
  legalName: "",
  defaultCurrency: "LKR",
  timezone: "Asia/Colombo",
};

export default function CreateOrganizationScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Enter the organization name.");
    if (!form.timezone.trim()) return setError("Enter a timezone.");

    setLoading(true);
    try {
      const uid = await createOrganization({
        code: generateOrganizationCode(form.name),
        name: form.name.trim(),
        legalName: form.legalName.trim() || form.name.trim(),
        defaultCurrency: form.defaultCurrency,
        timezone: form.timezone.trim(),
      });
      navigate(uid ? superOrganizationPath(uid) : ROUTES.SUPER_ORGANIZATIONS);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create the organization.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <Link className="rsv-back" to={ROUTES.SUPER_ORGANIZATIONS}>
            ← Back to organizations
          </Link>
          <p className="rsv-eyebrow">Platform</p>
          <h2>New organization</h2>
          <p className="rsv-sub">
            Next you'll add its properties, then register an admin for each one.
          </p>
        </div>
      </div>

      <form className="rsv-form" onSubmit={handleSubmit}>
        <div className="rsv-grid">
          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ABC Hotels"
            />
          </label>
          <label>
            Legal name
            <input
              name="legalName"
              value={form.legalName}
              onChange={handleChange}
              placeholder="ABC Hotels Pvt Ltd"
            />
          </label>
          <label>
            Default currency
            <select
              name="defaultCurrency"
              value={form.defaultCurrency}
              onChange={handleChange}
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Timezone
            <input
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
            />
          </label>
        </div>

        {error && <p className="rsv-error">{error}</p>}

        <div className="rsv-actions">
          <button
            type="button"
            className="rsv-btn rsv-btn-ghost"
            onClick={() => navigate(ROUTES.SUPER_ORGANIZATIONS)}
          >
            Cancel
          </button>
          <button type="submit" className="rsv-btn" disabled={loading}>
            {loading ? "Creating…" : "Create organization"}
          </button>
        </div>
      </form>
    </div>
  );
}
