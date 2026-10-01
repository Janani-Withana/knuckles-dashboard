import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { ROUTES, adminStaffPath } from "../../../routes/paths";
import { createStaff } from "../../../services/admin/staffService.service";
import {
  EMPLOYMENT_TYPE_LABELS,
  STAFF_STATUS_LABELS,
} from "../../../types/staff";
import "../Reservations/reservations.css";
import "../../superAdmin/superAdmin.css";

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const empty = {
  staffRoleUid: "",
  employeeNumber: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  employmentType: "0",
  basicSalary: "",
  joinedDate: "",
  status: "0",
};

export default function StaffFormScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid ?? "";
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!propertyUid) return setError("No property is linked to this account.");
    if (!GUID_RE.test(form.staffRoleUid.trim()))
      return setError("Staff role UID must be a valid GUID.");
    if (!form.employeeNumber.trim())
      return setError("Enter an employee number.");
    if (!form.firstName.trim() || !form.lastName.trim())
      return setError("Enter the staff member's first and last name.");
    if (!form.joinedDate) return setError("Select the joined date.");
    if (!form.basicSalary || Number(form.basicSalary) <= 0)
      return setError("Enter a basic salary greater than 0.");

    setLoading(true);
    try {
      const uid = await createStaff(propertyUid, {
        staffRoleUid: form.staffRoleUid.trim(),
        employeeNumber: form.employeeNumber.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        employmentType: Number(form.employmentType),
        basicSalary: Number(form.basicSalary),
        joinedDate: form.joinedDate,
        status: Number(form.status),
      });
      navigate(uid ? adminStaffPath(uid) : ROUTES.ADMIN_STAFF);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create the staff member.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <button
            type="button"
            className="rsv-back"
            onClick={() => navigate(ROUTES.ADMIN_STAFF)}
          >
            ← Back to staff
          </button>
          <p className="rsv-eyebrow">Property</p>
          <h2>New staff member</h2>
          <p className="rsv-sub">Add an employee to this property.</p>
        </div>
      </div>

      <form className="rsv-form" onSubmit={handleSubmit}>
        <h3>Identity</h3>
        <div className="rsv-grid">
          <label>
            Staff role UID
            <input
              name="staffRoleUid"
              value={form.staffRoleUid}
              onChange={handleChange}
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </label>
          <label>
            Employee number
            <input
              name="employeeNumber"
              value={form.employeeNumber}
              onChange={handleChange}
              placeholder="EMP-001"
            />
          </label>
          <label>
            First name
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
            />
          </label>
          <label>
            Last name
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
            />
          </label>
        </div>

        <h3>Contact</h3>
        <div className="rsv-grid">
          <label>
            Phone
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>
        </div>

        <h3>Employment</h3>
        <div className="rsv-grid">
          <label>
            Employment type
            <select
              name="employmentType"
              value={form.employmentType}
              onChange={handleChange}
            >
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Basic salary (LKR)
            <input
              name="basicSalary"
              type="number"
              min={0}
              value={form.basicSalary}
              onChange={handleChange}
            />
          </label>
          <label>
            Joined date
            <input
              name="joinedDate"
              type="date"
              value={form.joinedDate}
              onChange={handleChange}
            />
          </label>
          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              {Object.entries(STAFF_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="rsv-error">{error}</p>}

        <div className="rsv-actions">
          <button
            type="button"
            className="rsv-btn rsv-btn-ghost"
            onClick={() => navigate(ROUTES.ADMIN_STAFF)}
          >
            Cancel
          </button>
          <button type="submit" className="rsv-btn" disabled={loading}>
            {loading ? "Saving…" : "Create staff member"}
          </button>
        </div>
      </form>
    </div>
  );
}
