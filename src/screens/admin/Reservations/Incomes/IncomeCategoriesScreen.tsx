import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "../../../../components/common/PageState";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { ROUTES } from "../../../../routes/paths";
import {
  createIncomeCategory,
  deleteIncomeCategory,
  getIncomeCategory,
  listIncomeCategories,
  updateIncomeCategory,
} from "../../../../services/admin/incomeService.service";
import type { IncomeCategory } from "../../../../types/income";
import "../../Finance/Expenses/expenses.css";
import "./incomes.css";

type CategoryDraft = {
  code: string;
  name: string;
  isActive: boolean;
};

const emptyDraft = (): CategoryDraft => ({
  code: "",
  name: "",
  isActive: true,
});

const draftFrom = (category: IncomeCategory): CategoryDraft => ({
  code: category.code,
  name: category.name,
  isActive: category.isActive,
});

export default function IncomeCategoriesScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();
  const editorTitleId = useId();
  const archiveTitleId = useId();

  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);

  const [editor, setEditor] = useState<"create" | string | null>(null);
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<IncomeCategory | null>(null);
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
    listIncomeCategories(propertyUid)
      .then((next) => {
        if (active) setCategories(next);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load income categories.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  useEffect(() => {
    if (!editor && !pendingArchive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || saving || editorLoading || archiving) return;
      setEditor(null);
      setPendingArchive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, pendingArchive, saving, editorLoading, archiving]);

  const openCreate = () => {
    setNotice("");
    setSaveError("");
    setPendingArchive(null);
    setDraft(emptyDraft());
    setEditor("create");
  };

  const openEdit = (uid: string) => {
    if (!propertyUid) return;
    setNotice("");
    setSaveError("");
    setPendingArchive(null);
    setDraft(null);
    setEditor(uid);
    setEditorLoading(true);
    getIncomeCategory(propertyUid, uid)
      .then((category) => setDraft(draftFrom(category)))
      .catch((err: unknown) => {
        setSaveError(err instanceof ApiError ? err.message : "Could not load this category.");
      })
      .finally(() => setEditorLoading(false));
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setDraft((current) => {
      if (!current) return current;
      if (type === "checkbox") return { ...current, isActive: checked };
      return { ...current, [name]: name === "code" ? value.toUpperCase() : value };
    });
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid || !editor || !draft) return;
    if (!draft.code.trim()) return setSaveError("Code is required.");
    if (!draft.name.trim()) return setSaveError("Name is required.");

    const payload = {
      code: draft.code.trim(),
      name: draft.name.trim(),
      isActive: draft.isActive,
    };

    setSaving(true);
    setSaveError("");
    try {
      if (editor === "create") {
        await createIncomeCategory(propertyUid, payload);
        setNotice(`${payload.name} added.`);
      } else {
        await updateIncomeCategory(propertyUid, editor, payload);
        setNotice(`${payload.name} updated.`);
      }
      setEditor(null);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save this category.");
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!propertyUid || !pendingArchive) return;
    setArchiving(true);
    setArchiveError("");
    try {
      await deleteIncomeCategory(propertyUid, pendingArchive.uid);
      setNotice(`${pendingArchive.name} archived.`);
      setPendingArchive(null);
      setTick((n) => n + 1);
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : "Could not archive this category.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="exp-page">
      <div className="exp-head">
        <button type="button" className="exp-ghost" onClick={() => navigate(ROUTES.ADMIN_FINANCE)}>
          ← Income
        </button>
      </div>

      {!propertyUid && <p className="exp-empty">This account is not assigned to a property.</p>}

      {propertyUid && (
        <header className="exp-hero">
          <div>
            <p className="exp-kicker">Finance</p>
            <h1>Income categories</h1>
            <p>Categories used when recording other income, such as laundry or events.</p>
          </div>
          <button type="button" className="exp-add" onClick={openCreate} disabled={loading || !!error}>
            Add category
          </button>
        </header>
      )}

      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {propertyUid && !loading && !error && (
        <>
          {notice && <p className="exp-notice">{notice}</p>}
          {categories.length === 0 ? (
            <p className="exp-empty">No income categories yet. Add one before recording income.</p>
          ) : (
            <div className="exp-table-wrap">
              <table className="exp-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.uid}>
                      <td>{category.code}</td>
                      <td>{category.name}</td>
                      <td>{category.isActive ? "Active" : "Inactive"}</td>
                      <td className="inc-row-actions">
                        <button type="button" className="exp-text" onClick={() => openEdit(category.uid)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="exp-text"
                          onClick={() => {
                            setArchiveError("");
                            setPendingArchive(category);
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
        </>
      )}

      {editor &&
        createPortal(
          <div className="exp-backdrop" onClick={() => !saving && !editorLoading && setEditor(null)}>
            <div
              className="exp-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={editorTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="exp-dialog-head">
                <h2 id={editorTitleId}>{editor === "create" ? "New category" : "Edit category"}</h2>
                <button
                  type="button"
                  className="exp-close"
                  aria-label="Close"
                  onClick={() => !saving && !editorLoading && setEditor(null)}
                >
                  ×
                </button>
              </div>
              {editorLoading && <p className="exp-hint">Loading this category…</p>}
              {!editorLoading && !draft && saveError && <p className="exp-error">{saveError}</p>}
              {!editorLoading && draft && (
                <form className="exp-form" onSubmit={saveCategory}>
                  <label>
                    Code
                    <input name="code" value={draft.code} onChange={onChange} maxLength={30} />
                  </label>
                  <label>
                    Name
                    <input name="name" value={draft.name} onChange={onChange} maxLength={100} />
                  </label>
                  <label className="inc-switch">
                    <input name="isActive" type="checkbox" checked={draft.isActive} onChange={onChange} />
                    Active
                  </label>
                  {saveError && <p className="exp-error">{saveError}</p>}
                  <div className="exp-form-actions">
                    <button type="button" className="exp-ghost" onClick={() => setEditor(null)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className="exp-save" disabled={saving}>
                      {saving ? "Saving…" : editor === "create" ? "Add category" : "Save changes"}
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
          <div className="exp-backdrop" onClick={() => !archiving && setPendingArchive(null)}>
            <div
              className="exp-dialog exp-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={archiveTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={archiveTitleId}>Archive {pendingArchive.name}?</h2>
              <p>This hides the category from new income. The code stays reserved, and existing records stay as they are.</p>
              {archiveError && <p className="exp-error">{archiveError}</p>}
              <div className="exp-form-actions">
                <button type="button" className="exp-ghost" onClick={() => setPendingArchive(null)} disabled={archiving}>
                  Keep
                </button>
                <button type="button" className="exp-danger" onClick={onArchive} disabled={archiving}>
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
