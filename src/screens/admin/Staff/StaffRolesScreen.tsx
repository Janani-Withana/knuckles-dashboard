import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import {
  createStaffRole,
  deleteStaffRole,
  listPropertyStaff,
  listStaffRoles,
} from "../../../services/admin/staffService.service";
import type { StaffRole } from "../../../types/staff";
import "../Reservations/reservations.css";
import "../../superAdmin/superAdmin.css";
import "./staff.css";

export default function StaffRolesScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid ?? "";
  const navigate = useNavigate();
  const createTitleId = useId();
  const archiveTitleId = useId();

  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [pendingArchive, setPendingArchive] = useState<StaffRole | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      setError("No property is linked to this account yet.");
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([listStaffRoles(propertyUid), listPropertyStaff(propertyUid)])
      .then(([nextRoles, staff]) => {
        if (!active) return;
        const counts: Record<string, number> = {};
        staff.forEach((s) => {
          counts[s.staffRoleUid] = (counts[s.staffRoleUid] ?? 0) + 1;
        });
        setRoles(nextRoles);
        setUsage(counts);
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof ApiError ? err.message : "Could not load staff roles.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  useEffect(() => {
    if (!creating && !pendingArchive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || saving || archiving) return;
      setCreating(false);
      setPendingArchive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [creating, pendingArchive, saving, archiving]);

  const sorted = useMemo(
    () => [...roles].sort((a, b) => a.name.localeCompare(b.name)),
    [roles],
  );

  const openCreate = () => {
    setNotice("");
    setSaveError("");
    setName("");
    setCreating(true);
  };

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!propertyUid) return;
    if (!trimmed) return setSaveError("Enter a role name.");
    if (roles.some((role) => role.name.toLowerCase() === trimmed.toLowerCase())) {
      return setSaveError("A role with this name already exists.");
    }
    setSaving(true);
    setSaveError("");
    try {
      await createStaffRole(propertyUid, { name: trimmed });
      setNotice(`${trimmed} added.`);
      setCreating(false);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not add this role.");
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!propertyUid || !pendingArchive) return;
    setArchiving(true);
    setArchiveError("");
    try {
      await deleteStaffRole(propertyUid, pendingArchive.uid);
      setNotice(`${pendingArchive.name} archived.`);
      setPendingArchive(null);
      setTick((n) => n + 1);
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : "Could not archive this role.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="rsv-page">
      <div>
        <button type="button" className="rsv-back" onClick={() => navigate(-1)}>
          ← Staff
        </button>
        <div className="rsv-header">
          <div>
            <p className="rsv-eyebrow">Property</p>
            <h2>Staff roles</h2>
            <p className="rsv-sub">Job titles you can give to staff members, such as Front Desk.</p>
          </div>
          <button className="rsv-btn" onClick={openCreate} disabled={loading || !!error}>
            + New role
          </button>
        </div>
      </div>

      {loading && <PageLoading />}
      {!loading && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {!loading && !error && (
        <>
          {notice && <p className="rsv-notice">{notice}</p>}
          {sorted.length === 0 ? (
            <p className="rsv-empty">No roles yet. Add one before creating a staff member.</p>
          ) : (
            <div className="rsv-table-wrap">
              <table className="rsv-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Staff</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((role) => {
                    const count = usage[role.uid] ?? 0;
                    return (
                      <tr key={role.uid}>
                        <td>{role.name}</td>
                        <td>{count === 0 ? "None" : `${count} member${count === 1 ? "" : "s"}`}</td>
                        <td className="sr-row-actions">
                          <button
                            type="button"
                            className="sa-link sr-archive"
                            disabled={count > 0}
                            title={count > 0 ? "Move these staff to another role first" : undefined}
                            onClick={() => {
                              setArchiveError("");
                              setPendingArchive(role);
                            }}
                          >
                            Archive
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {creating &&
        createPortal(
          <div className="sr-backdrop" onClick={() => !saving && setCreating(false)}>
            <div
              className="sr-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={createTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h3 id={createTitleId}>New role</h3>
              <form className="sr-form" onSubmit={onCreate}>
                <label>
                  Role name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    placeholder="Front Desk"
                    autoFocus
                  />
                </label>
                {saveError && <p className="sr-error">{saveError}</p>}
                <div className="sr-actions">
                  <button type="button" className="rsv-btn rsv-btn-ghost" onClick={() => setCreating(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="rsv-btn" disabled={saving}>
                    {saving ? "Adding…" : "Add role"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {pendingArchive &&
        createPortal(
          <div className="sr-backdrop" onClick={() => !archiving && setPendingArchive(null)}>
            <div
              className="sr-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={archiveTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h3 id={archiveTitleId}>Archive {pendingArchive.name}?</h3>
              <p>This removes the role from the list. It can't be archived while staff still use it.</p>
              {archiveError && <p className="sr-error">{archiveError}</p>}
              <div className="sr-actions">
                <button type="button" className="rsv-btn rsv-btn-ghost" onClick={() => setPendingArchive(null)} disabled={archiving}>
                  Keep
                </button>
                <button type="button" className="rsv-btn sr-danger" onClick={onArchive} disabled={archiving}>
                  {archiving ? "Archiving…" : "Archive"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}