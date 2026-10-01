import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { ROUTES } from "../../../routes/paths";
import {
  getStaff,
  listPropertyStaffPayments,
  listStaffWorkLogs,
  updateStaff,
} from "../../../services/admin/staffService.service";
import {
  EMPLOYMENT_TYPE_LABELS,
  STAFF_STATUS_LABELS,
  employmentTypeLabel,
  paymentMethodLabel,
  staffStatusLabel,
  type StaffMember,
  type StaffPayment,
  type WorkLog,
} from "../../../types/staff";
import { formatLKR } from "../../../utils/reservationCalc";
import WorkLogForm from "./components/WorkLogForm";
import StaffPaymentForm from "./components/StaffPaymentForm";
import "../Reservations/reservations.css";
import "../../superAdmin/superAdmin.css";
import "./staff.css";

type Tab = "profile" | "workLogs" | "payments";

export default function StaffDetailScreen() {
  const { staffUid = "" } = useParams();
  const { user } = useAuth();
  const propertyUid = user?.propertyUid ?? "";
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [payments, setPayments] = useState<StaffPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("profile");
  const [tick, setTick] = useState(0);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<StaffMember | null>(null);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const [s, logs, pays] = await Promise.all([
          getStaff(staffUid),
          listStaffWorkLogs(staffUid),
          propertyUid
            ? listPropertyStaffPayments(propertyUid)
            : Promise.resolve([] as StaffPayment[]),
        ]);
        if (cancelled) return;
        setStaff(s);
        setForm(s);
        setWorkLogs(logs);
        setPayments(pays.filter((p) => p.staffUid === staffUid));
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this staff member.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffUid, propertyUid, tick]);

  const handleSave = async () => {
    if (!form) return;
    setSaveError("");
    if (
      !form.employeeNumber.trim() ||
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      setSaveError("Employee number, first and last name are required.");
      return;
    }
    setSaving(true);
    try {
      await updateStaff(staffUid, {
        staffRoleUid: form.staffRoleUid,
        employeeNumber: form.employeeNumber.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        employmentType: Number(form.employmentType),
        basicSalary: Number(form.basicSalary),
        joinedDate: form.joinedDate,
        status: Number(form.status),
      });
      setEditing(false);
      setTick((t) => t + 1);
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Could not save changes.",
      );
    } finally {
      setSaving(false);
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
          <p className="rsv-eyebrow">Staff</p>
          <h2>
            {staff ? `${staff.firstName} ${staff.lastName}` : "Staff member"}
          </h2>
          {staff && (
            <p className="rsv-sub">
              {staff.employeeNumber} ·{" "}
              {employmentTypeLabel(staff.employmentType)}
            </p>
          )}
        </div>
        {staff && (
          <span
            className={`sa-badge ${staff.status === 0 ? "" : "sa-badge-muted"}`}
          >
            {staffStatusLabel(staff.status)}
          </span>
        )}
      </div>

      {loading && <PageLoading />}
      {!loading && error && (
        <PageError message={error} onRetry={() => setTick((t) => t + 1)} />
      )}

      {!loading && !error && staff && form && (
        <>
          <div className="sa-steps">
            <button
              type="button"
              className={`sa-step ${tab === "profile" ? "active" : ""}`}
              onClick={() => setTab("profile")}
            >
              Profile
            </button>
            <button
              type="button"
              className={`sa-step ${tab === "workLogs" ? "active" : ""}`}
              onClick={() => setTab("workLogs")}
            >
              Work logs ({workLogs.length})
            </button>
            <button
              type="button"
              className={`sa-step ${tab === "payments" ? "active" : ""}`}
              onClick={() => setTab("payments")}
            >
              Payments ({payments.length})
            </button>
          </div>

          {tab === "profile" && (
            <section className="sa-section">
              <div className="sa-section-head">
                <h3>Profile</h3>
                {!editing ? (
                  <button className="sa-link" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                ) : (
                  <button
                    className="sa-link"
                    onClick={() => {
                      setForm(staff);
                      setEditing(false);
                      setSaveError("");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!editing ? (
                <dl className="sa-kv">
                  <div>
                    <dt>Employee no.</dt>
                    <dd>{staff.employeeNumber}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{staff.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{staff.email || "—"}</dd>
                  </div>
                  <div>
                    <dt>Employment type</dt>
                    <dd>{employmentTypeLabel(staff.employmentType)}</dd>
                  </div>
                  <div>
                    <dt>Basic salary</dt>
                    <dd>{formatLKR(staff.basicSalary)}</dd>
                  </div>
                  <div>
                    <dt>Joined</dt>
                    <dd>{staff.joinedDate || "—"}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{staffStatusLabel(staff.status)}</dd>
                  </div>
                </dl>
              ) : (
                <div className="rsv-form sa-flat">
                  <div className="rsv-grid">
                    <label>
                      Employee number
                      <input
                        value={form.employeeNumber}
                        onChange={(e) =>
                          setForm({ ...form, employeeNumber: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      First name
                      <input
                        value={form.firstName}
                        onChange={(e) =>
                          setForm({ ...form, firstName: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Last name
                      <input
                        value={form.lastName}
                        onChange={(e) =>
                          setForm({ ...form, lastName: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Employment type
                      <select
                        value={form.employmentType}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            employmentType: Number(e.target.value),
                          })
                        }
                      >
                        {Object.entries(EMPLOYMENT_TYPE_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <label>
                      Basic salary
                      <input
                        type="number"
                        min={0}
                        value={form.basicSalary}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            basicSalary: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Joined date
                      <input
                        type="date"
                        value={form.joinedDate}
                        onChange={(e) =>
                          setForm({ ...form, joinedDate: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Status
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: Number(e.target.value) })
                        }
                      >
                        {Object.entries(STAFF_STATUS_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  </div>

                  {saveError && <p className="rsv-error">{saveError}</p>}

                  <div className="rsv-actions">
                    <button
                      type="button"
                      className="rsv-btn"
                      disabled={saving}
                      onClick={handleSave}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === "workLogs" && (
            <>
              <section className="sa-section">
                <div className="sa-section-head">
                  <h3>Add work log</h3>
                </div>
                <WorkLogForm
                  staffUid={staffUid}
                  onSaved={() => setTick((t) => t + 1)}
                />
              </section>

              {workLogs.length === 0 ? (
                <p className="rsv-empty">No work logs yet.</p>
              ) : (
                <div className="rsv-table-wrap">
                  <table className="rsv-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Hours</th>
                        <th>Overtime</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workLogs.map((log) => (
                        <tr key={log.uid}>
                          <td>{log.workDate}</td>
                          <td>{log.startTime}</td>
                          <td>{log.endTime}</td>
                          <td>{log.hoursWorked}</td>
                          <td>{log.overtimeHours}</td>
                          <td>{log.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === "payments" && (
            <>
              <section className="sa-section">
                <div className="sa-section-head">
                  <h3>Record payment</h3>
                </div>
                <StaffPaymentForm
                  staffUid={staffUid}
                  onSaved={() => setTick((t) => t + 1)}
                />
              </section>

              {payments.length === 0 ? (
                <p className="rsv-empty">No payments recorded yet.</p>
              ) : (
                <div className="rsv-table-wrap">
                  <table className="rsv-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Basic</th>
                        <th>Overtime</th>
                        <th>Bonus</th>
                        <th>Deduction</th>
                        <th>Method</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.uid}>
                          <td>
                            {p.periodStart} → {p.periodEnd}
                          </td>
                          <td>{formatLKR(p.basicAmount)}</td>
                          <td>{formatLKR(p.overtimeAmount)}</td>
                          <td>{formatLKR(p.bonusAmount)}</td>
                          <td>{formatLKR(p.deductionAmount)}</td>
                          <td>{paymentMethodLabel(p.paymentMethod)}</td>
                          <td>{p.referenceNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
