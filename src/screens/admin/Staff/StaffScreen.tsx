import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DonutChart from "../../../components/charts/DonutChart";
import { PageError, PageLoading } from "../../../components/common/PageState";
import StatCard from "../../../components/common/StatCard";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { ROUTES, adminStaffPath } from "../../../routes/paths";
import { listPropertyStaff } from "../../../services/admin/staffService.service";
import {
  employmentTypeLabel,
  staffStatusLabel,
  type StaffMember,
} from "../../../types/staff";
import { formatLKR } from "../../../utils/reservationCalc";
import "../Reservations/reservations.css";
import "../../superAdmin/superAdmin.css";
import "./staff.css";

export default function StaffScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid ?? "";
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      setError("No property is linked to this account yet.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    listPropertyStaff(propertyUid)
      .then((list) => {
        if (!cancelled) setStaff(list);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiError ? err.message : "Could not load staff.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyUid, tick]);

  const q = query.trim().toLowerCase();
  const filtered = staff.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.employeeNumber} ${s.phone} ${s.email}`
      .toLowerCase()
      .includes(q),
  );

  const activeCount = staff.filter((s) => s.status === 0).length;
  const totalBasic = staff.reduce((sum, s) => sum + s.basicSalary, 0);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    staff.forEach((s) => {
      const label = employmentTypeLabel(s.employmentType);
      map.set(label, (map.get(label) ?? 0) + 1);
    });
    return [...map].map(([label, value]) => ({ label, value }));
  }, [staff]);

  return (
    <div className="rsv-page">
      <header className="st-hero">
        <div>
          <p className="st-kicker">Staff</p>
          <h1>Staff</h1>
          <p>Manage employees, work logs and payments.</p>
        </div>
        <div className="st-hero-actions">
          <button
            type="button"
            className="st-ghost"
            onClick={() => navigate(ROUTES.ADMIN_STAFF_ROLES)}
          >
            Staff roles
          </button>
          <button
            type="button"
            className="st-add"
            onClick={() => navigate(ROUTES.ADMIN_STAFF_NEW)}
            disabled={loading || !!error}
          >
            Add staff
          </button>
        </div>
      </header>

      {loading && <PageLoading />}
      {!loading && error && (
        <PageError message={error} onRetry={() => setTick((t) => t + 1)} />
      )}

      {!loading && !error && (
        <>
          <div className="rsv-summary">
            <StatCard label="Total staff" value={staff.length} tone="teal" />
            <StatCard label="Active" value={activeCount} tone="sage" />
            <StatCard
              label="Monthly basic payroll"
              value={totalBasic}
              tone="sand"
              format={formatLKR}
            />
          </div>

          {staff.length > 0 && (
            <div className="rsv-charts">
              <DonutChart
                title="Employment type"
                data={byType}
                centerLabel="staff"
              />
            </div>
          )}

        <input
          className="st-search"
          placeholder="Search by name, employee no, phone or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

          {filtered.length === 0 ? (
            <p className="rsv-empty">
              {staff.length === 0
                ? "No staff yet. Add your first team member."
                : "No staff match your search."}
            </p>
          ) : (
            <div className="rsv-table-wrap">
              <table className="rsv-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>No.</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Basic salary</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.uid}>
                      <td>
                        {s.firstName} {s.lastName}
                      </td>
                      <td>{s.employeeNumber}</td>
                      <td>{s.phone || "—"}</td>
                      <td>{employmentTypeLabel(s.employmentType)}</td>
                      <td>{formatLKR(s.basicSalary)}</td>
                      <td>
                        <span
                          className={`sa-badge ${s.status === 0 ? "" : "sa-badge-muted"}`}
                        >
                          {staffStatusLabel(s.status)}
                        </span>
                      </td>
                      <td>
                        <Link className="sa-link" to={adminStaffPath(s.uid)}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}