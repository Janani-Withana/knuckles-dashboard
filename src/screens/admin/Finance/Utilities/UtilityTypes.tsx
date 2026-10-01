import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "../../../../components/common/PageState";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { ROUTES } from "../../../../routes/paths";
import {
  createUtilityType,
  deleteUtilityType,
  getUtilityType,
  listUtilityTypes,
  updateUtilityType,
} from "../../../../services/admin/utilitiesService.service";
import type { UtilityType } from "../../../../types/utilities";
import "./utilities.css";

type TypeDraft = {
  code: string;
  name: string;
  unitOfMeasure: string;
  isMetered: boolean;
};

const emptyType = (): TypeDraft => ({
  code: "",
  name: "",
  unitOfMeasure: "",
  isMetered: true,
});

const typeDraftFrom = (type: UtilityType): TypeDraft => ({
  code: type.code,
  name: type.name,
  unitOfMeasure: type.unitOfMeasure,
  isMetered: type.isMetered,
});

export default function UtilityTypes() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();
  const typeTitleId = useId();
  const archiveTitleId = useId();

  const [types, setTypes] = useState<UtilityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);

  const [typeEditor, setTypeEditor] = useState<"create" | string | null>(null);
  const [typeDraft, setTypeDraft] = useState<TypeDraft | null>(null);
  const [typeLoading, setTypeLoading] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<UtilityType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    listUtilityTypes(propertyUid)
      .then((next) => {
        if (active) setTypes(next);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load utility types.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  useEffect(() => {
    if (!typeEditor && !pendingArchive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || saving || typeLoading || archiving) return;
      setTypeEditor(null);
      setPendingArchive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typeEditor, pendingArchive, saving, typeLoading, archiving]);

  const openTypeCreate = () => {
    setNotice("");
    setSaveError("");
    setPendingArchive(null);
    setTypeDraft(emptyType());
    setTypeEditor("create");
  };

  const openTypeEdit = (uid: string) => {
    if (!propertyUid) return;
    setNotice("");
    setSaveError("");
    setPendingArchive(null);
    setTypeDraft(null);
    setTypeEditor(uid);
    setTypeLoading(true);
    getUtilityType(propertyUid, uid)
      .then((type) => setTypeDraft(typeDraftFrom(type)))
      .catch((err: unknown) => {
        setSaveError(err instanceof ApiError ? err.message : "Could not load this type.");
      })
      .finally(() => setTypeLoading(false));
  };

  const onTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setTypeDraft((current) => {
      if (!current) return current;
      if (type === "checkbox") {
        return { ...current, isMetered: checked, unitOfMeasure: checked ? current.unitOfMeasure : "" };
      }
      return { ...current, [name]: name === "code" ? value.toUpperCase() : value };
    });
  };

  const saveType = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid || !typeEditor || !typeDraft) return;
    if (!typeDraft.code.trim()) return setSaveError("Code is required.");
    if (!typeDraft.name.trim()) return setSaveError("Name is required.");
    if (typeDraft.isMetered && !typeDraft.unitOfMeasure.trim()) {
      return setSaveError("A metered type needs a unit, such as kWh.");
    }

    const payload = {
      code: typeDraft.code.trim(),
      name: typeDraft.name.trim(),
      unitOfMeasure: typeDraft.isMetered ? typeDraft.unitOfMeasure.trim() : null,
      isMetered: typeDraft.isMetered,
    };

    setSaving(true);
    setSaveError("");
    try {
      if (typeEditor === "create") {
        await createUtilityType(propertyUid, payload);
        setNotice(`${payload.name} added.`);
      } else {
        await updateUtilityType(propertyUid, typeEditor, payload);
        setNotice(`${payload.name} updated.`);
      }
      setTypeEditor(null);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save this type.");
    } finally {
      setSaving(false);
    }
  };

  const onArchiveType = async () => {
    if (!propertyUid || !pendingArchive) return;
    setArchiving(true);
    setArchiveError("");
    try {
      await deleteUtilityType(propertyUid, pendingArchive.uid);
      setNotice(`${pendingArchive.name} archived.`);
      setPendingArchive(null);
      setTick((n) => n + 1);
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : "Could not archive this type.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="ut-page">
      <div className="ut-head">
        <button type="button" className="ut-ghost" onClick={() => navigate(ROUTES.ADMIN_FINANCE_UTILITIES)}>
          ← Utilities
        </button>
      </div>

      {!propertyUid && <p className="ut-empty">This account is not assigned to a property.</p>}

      {propertyUid && (
        <header className="ut-hero">
          <div>
            <p className="ut-kicker">Finance</p>
            <h1>Utility types</h1>
            <p>Electricity, water, and other types used when recording a bill.</p>
          </div>
          <button type="button" className="ut-add" onClick={openTypeCreate} disabled={loading || !!error}>
            Add type
          </button>
        </header>
      )}

      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {propertyUid && !loading && !error && (
        <>
          {notice && <p className="ut-notice">{notice}</p>}
          <section className="ut-types">
            {types.length === 0 ? (
              <p className="ut-hint">No utility types yet. Add electricity, water, or another type before a bill.</p>
            ) : (
              <div className="ut-table-wrap">
                <table className="ut-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Unit</th>
                      <th>Meter</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {types.map((type) => (
                      <tr key={type.uid}>
                        <td>{type.code}</td>
                        <td>{type.name}</td>
                        <td>{type.unitOfMeasure || "—"}</td>
                        <td>{type.isMetered ? "Metered" : "Flat"}</td>
                        <td className="ut-row-actions">
                          <button type="button" className="ut-text" onClick={() => openTypeEdit(type.uid)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="ut-text"
                            onClick={() => {
                              setArchiveError("");
                              setPendingArchive(type);
                            }}
                          >
                            Archive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {typeEditor &&
        createPortal(
          <div className="ut-backdrop" onClick={() => !saving && !typeLoading && setTypeEditor(null)}>
            <div
              className="ut-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={typeTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="ut-dialog-head">
                <h2 id={typeTitleId}>{typeEditor === "create" ? "New type" : "Edit type"}</h2>
                <button
                  type="button"
                  className="ut-close"
                  aria-label="Close"
                  onClick={() => !saving && !typeLoading && setTypeEditor(null)}
                >
                  ×
                </button>
              </div>
              {typeLoading && <p className="ut-hint">Loading this type…</p>}
              {!typeLoading && !typeDraft && saveError && <p className="ut-error">{saveError}</p>}
              {!typeLoading && typeDraft && (
                <form className="ut-form" onSubmit={saveType}>
                  <label>
                    Code
                    <input name="code" value={typeDraft.code} onChange={onTypeChange} maxLength={30} />
                  </label>
                  <label>
                    Name
                    <input name="name" value={typeDraft.name} onChange={onTypeChange} maxLength={100} />
                  </label>
                  <label>
                    Unit
                    <input
                      name="unitOfMeasure"
                      value={typeDraft.unitOfMeasure}
                      onChange={onTypeChange}
                      maxLength={30}
                      placeholder="kWh"
                      disabled={!typeDraft.isMetered}
                    />
                  </label>
                  <label className="ut-switch">
                    <input name="isMetered" type="checkbox" checked={typeDraft.isMetered} onChange={onTypeChange} />
                    Metered
                  </label>
                  {saveError && <p className="ut-error">{saveError}</p>}
                  <div className="ut-form-actions">
                    <button type="button" className="ut-ghost" onClick={() => setTypeEditor(null)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className="ut-save" disabled={saving}>
                      {saving ? "Saving…" : typeEditor === "create" ? "Add type" : "Save changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}

      {pendingArchive &&
        createPortal(
          <div className="ut-backdrop" onClick={() => !archiving && setPendingArchive(null)}>
            <div
              className="ut-dialog ut-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={archiveTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={archiveTitleId}>Archive {pendingArchive.name}?</h2>
              <p>This hides the type from new bills. Existing bills stay as they are.</p>
              {archiveError && <p className="ut-error">{archiveError}</p>}
              <div className="ut-form-actions">
                <button type="button" className="ut-ghost" onClick={() => setPendingArchive(null)} disabled={archiving}>
                  Keep
                </button>
                <button type="button" className="ut-danger" onClick={onArchiveType} disabled={archiving}>
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
