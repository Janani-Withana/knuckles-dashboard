import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../../../lib/api";
import { ROUTES } from "../../../../routes/paths";
import { listStaffRoles } from "../../../../services/admin/staffService.service";
import type { StaffRole } from "../../../../types/staff";
import "../staff.css";

type Props = {
  propertyUid: string;
  /** The selected role's uid. This is what you send as staffRoleUid. */
  value: string;
  onChange: (staffRoleUid: string) => void;
  disabled?: boolean;
  /** Pass the same class your other form labels use. */
  className?: string;
};

export default function StaffRoleSelect({ propertyUid, value, onChange, disabled, className }: Props) {
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    listStaffRoles(propertyUid)
      .then((next) => {
        if (active) setRoles(next);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load staff roles.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid]);

  const sorted = useMemo(() => [...roles].sort((a, b) => a.name.localeCompare(b.name)), [roles]);

  return (
    <label className={className}>
      Staff Role
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading}
      >
        <option value="">{loading ? "Loading roles…" : "Select a role"}</option>
        {sorted.map((role) => (
          <option key={role.uid} value={role.uid}>
            {role.name}
          </option>
        ))}
        {/* Editing a member whose role was archived: keep their value selectable */}
        {!loading && value && !sorted.some((role) => role.uid === value) && (
          <option value={value}>Current role (archived)</option>
        )}
      </select>
      {error && <span className="sr-select-hint sr-select-error">{error}</span>}
      {!loading && !error && roles.length === 0 && (
        <span className="sr-select-hint">
          No roles yet. <Link to={ROUTES.ADMIN_STAFF_ROLES}>Add a role</Link> first.
        </span>
      )}
    </label>
  );
}