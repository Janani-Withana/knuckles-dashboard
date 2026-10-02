import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "../../../../components/common/PageState";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { ROUTES } from "../../../../routes/paths";
import {
  createBookingChargeType,
  deleteBookingChargeType,
  getBookingChargeType,
  listBookingChargeTypes,
  updateBookingChargeType,
} from "../../../../services/admin/paymentsService.service";
import {
  CHARGE_TYPE_CATEGORIES,
  chargeTypeCategoryLabel,
  type BookingChargeType,
} from "../../../../types/payments";
import "./payments.css";
import "./chargeTypes.css";

type ChargeTypeDraft = {
  code: string;
  name: string;
  category: string;
  isTaxable: boolean;
  defaultPrice: string;
  isActive: boolean;
};

const emptyDraft = (): ChargeTypeDraft => ({
  code: "",
  name: "",
  category: "0",
  isTaxable: false,
  defaultPrice: "",
  isActive: true,
});

const draftFrom = (type: BookingChargeType): ChargeTypeDraft => ({
  code: type.code,
  name: type.name,
  category: String(type.category),
  isTaxable: type.isTaxable,
  defaultPrice: String(type.defaultPrice),
  isActive: type.isActive,
});

const money = (amount: number) =>
  amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ChargeTypesScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();
  const editorTitleId = useId();
  const archiveTitleId = useId();

  const [types, setTypes] = useState<BookingChargeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);

  const [editor, setEditor] = useState<"create" | string | null>(null);
  const [draft, setDraft] = useState<ChargeTypeDraft | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<BookingChargeType | null>(null);
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
    listBookingChargeTypes(propertyUid)
      .then((next) => {
        if (active) setTypes(next);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load charge types.");
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
    getBookingChargeType(propertyUid, uid)
      .then((type) => setDraft(draftFrom(type)))
      .catch((err: unknown) => {
        setSaveError(err instanceof ApiError ? err.message : "Could not load this charge type.");
      })
      .finally(() => setEditorLoading(false));
  };

  const onDraftChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const checked = event.target instanceof HTMLInputElement && event.target.checked;
    setDraft((current) => {
      if (!current) return current;
      if (type === "checkbox") return { ...current, [name]: checked };
      if (name === "code") return { ...current, code: value.toUpperCase() };
      return { ...current, [name]: value };
    });
  };

  const saveType = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid || !editor || !draft) return;
    if (!draft.code.trim()) return setSaveError("Code is required.");
    if (!draft.name.trim()) return setSaveError("Name is required.");
    const category = Number(draft.category);
    if (!CHARGE_TYPE_CATEGORIES.some((item) => item.value === category)) {
      return setSaveError("Choose a category.");
    }
    const defaultPrice = Number(draft.defaultPrice);
    if (!Number.isFinite(defaultPrice) || defaultPrice < 0) {
      return setSaveError("Default price must be zero or more.");
    }

    const payload = {
      code: draft.code.trim(),
      name: draft.name.trim(),
      category,
      isTaxable: draft.isTaxable,
      defaultPrice,
      isActive: draft.isActive,
    };

    setSaving(true);
    setSaveError("");
    try {
      if (editor === "create") {
        await createBookingChargeType(propertyUid, payload);
        setNotice(`${payload.name} added.`);
      } else {
        await updateBookingChargeType(propertyUid, editor, payload);
        setNotice(`${payload.name} updated.`);
      }
      setEditor(null);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save this charge type.");
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!propertyUid || !pendingArchive) return;
    setArchiving(true);
    setArchiveError("");
    try {
      await deleteBookingChargeType(propertyUid, pendingArchive.uid);
      setNotice(`${pendingArchive.name} archived.`);
      setPendingArchive(null);
      setTick((n) => n + 1);
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : "Could not archive this charge type.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="pay-page">
      <div className="pay-head">
        <button type="button" className="pay-ghost" onClick={() => navigate(ROUTES.ADMIN_FINANCE_PAYMENTS)}>
          ← Payments
        </button>
      </div>

      {!propertyUid && <p className="pay-empty">This account is not assigned to a property.</p>}

      {propertyUid && (
        <header className="pay-hero">
          <div>
            <p className="pay-kicker">Finance</p>
            <h1>Charge types</h1>
            <p>Food, laundry, transport, and other extras that can be charged to a booking.</p>
          </div>
          <button type="button" className="pay-add" onClick={openCreate} disabled={loading || !!error}>
            Add type
          </button>
        </header>
      )}

      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && (
        <PageError message={error} onRetry={() => setTick((n) => n + 1)} />
      )}

      {propertyUid && !loading && !error && (
        <>
          {notice && <p className="ct-notice">{notice}</p>}
          {types.length === 0 ? (
            <p className="pay-empty">No charge types yet. Add cooking, laundry, or another extra before a booking charge.</p>
          ) : (
            <div className="pay-table-wrap">
              <table className="pay-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Default price</th>
                    <th>Tax</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {types.map((type) => (
                    <tr key={type.uid}>
                      <td>{type.code}</td>
                      <td>{type.name}</td>
                      <td>{chargeTypeCategoryLabel(type.category)}</td>
                      <td>{money(type.defaultPrice)}</td>
                      <td>{type.isTaxable ? "Taxable" : "Not taxable"}</td>
                      <td className="pay-row-actions">
                        <button type="button" className="pay-text" onClick={() => openEdit(type.uid)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="pay-text"
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
        </>
      )}

      {editor &&
        createPortal(
          <div className="pay-backdrop" onClick={() => !saving && !editorLoading && setEditor(null)}>
            <div
              className="pay-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={editorTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="pay-dialog-head">
                <h2 id={editorTitleId}>{editor === "create" ? "New charge type" : "Edit charge type"}</h2>
                <button
                  type="button"
                  className="pay-close"
                  aria-label="Close"
                  onClick={() => !saving && !editorLoading && setEditor(null)}
                >
                  ×
                </button>
              </div>
              {editorLoading && <p className="pay-note">Loading this charge type…</p>}
              {!editorLoading && !draft && saveError && <p className="pay-error">{saveError}</p>}
              {!editorLoading && draft && (
                <form className="pay-form" onSubmit={saveType}>
                  <label>
                    Code
                    <input name="code" value={draft.code} onChange={onDraftChange} maxLength={30} />
                  </label>
                  <label>
                    Name
                    <input name="name" value={draft.name} onChange={onDraftChange} maxLength={100} />
                  </label>
                  <label>
                    Category
                    <select name="category" value={draft.category} onChange={onDraftChange}>
                      {CHARGE_TYPE_CATEGORIES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Default price
                    <input
                      name="defaultPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.defaultPrice}
                      onChange={onDraftChange}
                    />
                  </label>
                  <label className="ct-switch">
                    <input name="isTaxable" type="checkbox" checked={draft.isTaxable} onChange={onDraftChange} />
                    Taxable
                  </label>
                  <label className="ct-switch">
                    <input name="isActive" type="checkbox" checked={draft.isActive} onChange={onDraftChange} />
                    Active
                  </label>
                  {saveError && <p className="pay-error">{saveError}</p>}
                  <div className="pay-form-actions">
                    <button type="button" className="pay-ghost" onClick={() => setEditor(null)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className="pay-save" disabled={saving}>
                      {saving ? "Saving…" : editor === "create" ? "Add type" : "Save changes"}
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
          <div className="pay-backdrop" onClick={() => !archiving && setPendingArchive(null)}>
            <div
              className="pay-dialog pay-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={archiveTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={archiveTitleId}>Archive {pendingArchive.name}?</h2>
              <p>This hides the type from new charges. The code stays reserved, and existing charges stay as they are.</p>
              {archiveError && <p className="pay-error">{archiveError}</p>}
              <div className="pay-form-actions">
                <button type="button" className="pay-ghost" onClick={() => setPendingArchive(null)} disabled={archiving}>
                  Keep
                </button>
                <button type="button" className="pay-danger" onClick={onArchive} disabled={archiving}>
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
