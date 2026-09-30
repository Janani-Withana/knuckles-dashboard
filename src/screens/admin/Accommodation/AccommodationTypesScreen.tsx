import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import {
  createAccommodationType,
  deleteAccommodationType,
  getAccommodationType,
  listAccommodationTypes,
  updateAccommodationType,
} from "../../../services/admin/accommodationService.service";
import { getProperty } from "../../../services/superAdmin/propertyService.service";
import {
  UNIT_KIND_LABELS,
  unitKindLabel,
  type AccommodationType,
} from "../../../types/accommodation";
import "./AccommodationTypesScreen.css";

type Draft = {
  code: string;
  name: string;
  unitKind: string;
  description: string;
  maxAdults: string;
  maxChildren: string;
  maxOccupancy: string;
  defaultQuantity: string;
  baseRate: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyDraft = (): Draft => ({
  code: "",
  name: "",
  unitKind: "0",
  description: "",
  maxAdults: "2",
  maxChildren: "0",
  maxOccupancy: "2",
  defaultQuantity: "1",
  baseRate: "",
  sortOrder: "1",
  isActive: true,
});

const draftFrom = (type: AccommodationType): Draft => ({
  code: type.code,
  name: type.name,
  unitKind: String(type.unitKind),
  description: type.description,
  maxAdults: String(type.maxAdults),
  maxChildren: String(type.maxChildren),
  maxOccupancy: String(type.maxOccupancy),
  defaultQuantity: String(type.defaultQuantity),
  baseRate: String(type.baseRate),
  sortOrder: String(type.sortOrder),
  isActive: type.isActive,
});

const whole = (value: string, min: number) => {
  const n = Number(value);
  if (!value.trim() || !Number.isInteger(n) || n < min) return null;
  return n;
};

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "LKR",
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return amount.toLocaleString();
  }
};

const generateCode = (name: string, existing: string[]) => {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // "Villa" -> "VIL", "Deluxe Ocean View Room" -> "DOVR"
  let base =
    words.length === 0
      ? "TYPE"
      : words.length === 1
        ? words[0].slice(0, 3)
        : words.map((w) => w[0]).join("").slice(0, 4);

  const taken = new Set(existing.map((c) => c.toUpperCase()));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
};

export default function AccommodationTypesScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const titleId = useId();

  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [currency, setCurrency] = useState("LKR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  const [editor, setEditor] = useState<"create" | string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [pendingArchive, setPendingArchive] = useState<AccommodationType | null>(null);
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
    listAccommodationTypes(propertyUid)
      .then((next) => {
        if (active) setTypes(next);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load accommodation types.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    getProperty(propertyUid)
      .then((property) => {
        if (active && property.defaultCurrency) setCurrency(property.defaultCurrency);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  useEffect(() => {
    if (!editor && !pendingArchive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || saving || archiving) return;
      setEditor(null);
      setPendingArchive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, pendingArchive, saving, archiving]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...types]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .filter((type) =>
        `${type.name} ${type.code} ${unitKindLabel(type.unitKind)}`
          .toLowerCase()
          .includes(q),
      );
  }, [types, query]);

  const openCreate = () => {
    setNotice("");
    setSaveError("");
    setDraft(emptyDraft());
    setEditor("create");
  };

  const openEdit = (uid: string) => {
    setNotice("");
    setSaveError("");
    setDraft(null);
    setEditor(uid);
    setEditorLoading(true);
    getAccommodationType(uid)
      .then((type) => setDraft(draftFrom(type)))
      .catch((err: unknown) => {
        setSaveError(
          err instanceof ApiError ? err.message : "Could not load this type.",
        );
      })
      .finally(() => setEditorLoading(false));
  };

  const onChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    const next =
      type === "checkbox" && event.target instanceof HTMLInputElement
        ? event.target.checked
        : value;
    setDraft((current) => {
      if (!current) return current;
      const updated = { ...current, [name]: next };
      if (editor === "create" && name === "name" && typeof next === "string") {
        updated.code = generateCode(
          next,
          types.map((item) => item.code),
        );
      }
      return updated;
    });
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !propertyUid || !editor) return;
    setSaveError("");

    const name = draft.name.trim();
    if (!name) return setSaveError("Enter a name.");
    const code =
      editor === "create"
        ? generateCode(name, types.map((t) => t.code))
        : draft.code; // keep the existing code when editing

    const maxAdults = whole(draft.maxAdults, 1);
    const maxChildren = whole(draft.maxChildren, 0);
    const maxOccupancy = whole(draft.maxOccupancy, 1);
    const defaultQuantity = whole(draft.defaultQuantity, 0);
    const sortOrder = whole(draft.sortOrder, 0);
    const baseRate = Number(draft.baseRate);
    if (maxAdults === null || maxChildren === null || maxOccupancy === null) {
      return setSaveError("Occupancy must be a whole number.");
    }
    if (maxOccupancy < maxAdults) {
      return setSaveError("Max occupancy must be at least the adult count.");
    }
    if (defaultQuantity === null || sortOrder === null) {
      return setSaveError("Quantity and sort order must be whole numbers.");
    }
    if (!draft.baseRate.trim() || Number.isNaN(baseRate) || baseRate < 0) {
      return setSaveError("Enter a base rate of zero or more.");
    }

    const payload = {
      code,
      name,
      unitKind: Number(draft.unitKind),
      description: draft.description.trim(),
      maxAdults,
      maxChildren,
      maxOccupancy,
      defaultQuantity,
      baseRate,
      sortOrder,
    };

    setSaving(true);
    try {
      if (editor === "create") {
        await createAccommodationType(propertyUid, payload);
        setNotice(`${name} added.`);
      } else {
        await updateAccommodationType(editor, { ...payload, isActive: draft.isActive });
        setNotice(`${name} updated.`);
      }
      setEditor(null);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Could not save this type.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!pendingArchive) return;
    setArchiveError("");
    setArchiving(true);
    try {
      await deleteAccommodationType(pendingArchive.uid);
      setNotice(`${pendingArchive.name} archived.`);
      setPendingArchive(null);
      setTick((n) => n + 1);
    } catch (err) {
      setArchiveError(
        err instanceof ApiError ? err.message : "Could not archive this type.",
      );
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="at-page">
      {!propertyUid && (
        <p className="at-empty-note">This account is not assigned to a property.</p>
      )}

      {propertyUid && (
        <header className="at-hero">
          <div>
            <p className="at-kicker">Accommodation</p>
            <h1>Accommodation types</h1>
            <p>Room categories, occupancy, and the base nightly rate.</p>
          </div>
          <button type="button" className="at-add" onClick={openCreate}>
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
          {notice && <p className="at-notice">{notice}</p>}
          {types.length > 0 && (
            <input
              className="at-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, code, or kind"
            />
          )}

          {visible.length === 0 ? (
            <div className="at-blank">
              <h2>{types.length === 0 ? "No accommodation types yet" : "No matches"}</h2>
              <p>
                {types.length === 0
                  ? "Add a room, villa, or other stay type to start taking bookings."
                  : "Try a different name or code."}
              </p>
            </div>
          ) : (
            <div className="at-grid">
              {visible.map((type) => (
                <article key={type.uid} className="at-card">
                  <div className="at-card-top">
                    <div>
                      <div className="at-code">{type.code}</div>
                      <h2>{type.name}</h2>
                    </div>
                    <span className={`at-badge ${type.isActive ? "" : "off"}`}>
                      {type.isActive ? unitKindLabel(type.unitKind) : "Archived"}
                    </span>
                  </div>
                  {type.description && <p className="at-desc">{type.description}</p>}
                  <p className="at-rate">{money(type.baseRate, currency)}</p>
                  <ul className="at-meta">
                    <li>
                      {type.maxAdults} adult{type.maxAdults === 1 ? "" : "s"}
                    </li>
                    <li>
                      {type.maxChildren} child{type.maxChildren === 1 ? "" : "ren"}
                    </li>
                    <li>Max {type.maxOccupancy}</li>
                    <li>
                      {type.defaultQuantity} unit{type.defaultQuantity === 1 ? "" : "s"}
                    </li>
                  </ul>
                  <div className="at-card-actions">
                    <button
                      type="button"
                      className="at-text-danger"
                      onClick={() => {
                        setArchiveError("");
                        setPendingArchive(type);
                      }}
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      className="at-text"
                      onClick={() => openEdit(type.uid)}
                    >
                      Edit
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {editor &&
        createPortal(
          <div
            className="at-backdrop"
            onClick={() => !saving && setEditor(null)}
          >
            <div
              className="at-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="at-dialog-head">
                <h2 id={titleId}>
                  {editor === "create" ? "New accommodation type" : "Edit accommodation type"}
                </h2>
                <button
                  type="button"
                  className="at-close"
                  aria-label="Close"
                  onClick={() => !saving && setEditor(null)}
                >
                  ×
                </button>
              </div>
              {editorLoading && <PageLoading />}
              {!editorLoading && draft && (
                <form className="at-form" onSubmit={onSave}>
                  <label>
                    Code
                    <input
                      value={draft.code}
                      readOnly
                      disabled
                      placeholder="Filled in from the name"
                    />
                  </label>
                  <label>
                    Name
                    <input name="name" value={draft.name} onChange={onChange} />
                  </label>
                  <label>
                    Kind
                    <select name="unitKind" value={draft.unitKind} onChange={onChange}>
                      {Object.entries(UNIT_KIND_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Base rate
                    <input
                      name="baseRate"
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.baseRate}
                      onChange={onChange}
                    />
                  </label>
                  <label className="at-span">
                    Description
                    <textarea
                      name="description"
                      rows={2}
                      value={draft.description}
                      onChange={onChange}
                    />
                  </label>
                  <label>
                    Max adults
                    <input
                      name="maxAdults"
                      type="number"
                      min={1}
                      step={1}
                      value={draft.maxAdults}
                      onChange={onChange}
                    />
                  </label>
                  <label>
                    Max children
                    <input
                      name="maxChildren"
                      type="number"
                      min={0}
                      step={1}
                      value={draft.maxChildren}
                      onChange={onChange}
                    />
                  </label>
                  <label>
                    Max occupancy
                    <input
                      name="maxOccupancy"
                      type="number"
                      min={1}
                      step={1}
                      value={draft.maxOccupancy}
                      onChange={onChange}
                    />
                  </label>
                  <label>
                    Default quantity
                    <input
                      name="defaultQuantity"
                      type="number"
                      min={0}
                      step={1}
                      value={draft.defaultQuantity}
                      onChange={onChange}
                    />
                  </label>
                  <label>
                    Sort order
                    <input
                      name="sortOrder"
                      type="number"
                      min={0}
                      step={1}
                      value={draft.sortOrder}
                      onChange={onChange}
                    />
                  </label>
                  {editor !== "create" && (
                    <label className="at-switch">
                      <input
                        name="isActive"
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={onChange}
                      />
                      <span>Active</span>
                    </label>
                  )}
                  {saveError && <p className="at-error">{saveError}</p>}
                  <div className="at-form-actions">
                    <button
                      type="button"
                      className="at-ghost"
                      onClick={() => setEditor(null)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="at-save" disabled={saving}>
                      {saving ? "Saving…" : editor === "create" ? "Add type" : "Save changes"}
                    </button>
                  </div>
                </form>
              )}
              {!editorLoading && !draft && saveError && <p className="at-error">{saveError}</p>}
            </div>
          </div>,
          document.body,
        )}

      {pendingArchive &&
        createPortal(
          <div
            className="at-backdrop"
            onClick={() => !archiving && setPendingArchive(null)}
          >
            <div
              className="at-dialog at-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={titleId}>Archive {pendingArchive.name}?</h2>
              <p>
                This hides the type from new bookings. Existing reservations stay
                as they are.
              </p>
              {archiveError && <p className="at-error">{archiveError}</p>}
              <div className="at-form-actions">
                <button
                  type="button"
                  className="at-ghost"
                  onClick={() => setPendingArchive(null)}
                  disabled={archiving}
                >
                  Keep
                </button>
                <button
                  type="button"
                  className="at-danger"
                  onClick={onArchive}
                  disabled={archiving}
                >
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
