import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import {
  createMealPlan,
  deleteMealPlan,
  getMealPlan,
  listMealPlans,
  updateMealPlan,
} from "../../../services/accommodationService.service";
import type { MealPlan } from "../../../types/accommodation";
import "./MealPlansScreen.css";

type Draft = {
  code: string;
  name: string;
  description: string;
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
  allowByo: boolean;
};

const emptyDraft = (): Draft => ({
  code: "",
  name: "",
  description: "",
  includesBreakfast: false,
  includesLunch: false,
  includesDinner: false,
  allowByo: false,
});

const draftFrom = (plan: MealPlan): Draft => ({
  code: plan.code,
  name: plan.name,
  description: plan.description,
  includesBreakfast: plan.includesBreakfast,
  includesLunch: plan.includesLunch,
  includesDinner: plan.includesDinner,
  allowByo: plan.allowByo,
});

const included = (plan: Pick<MealPlan, "includesBreakfast" | "includesLunch" | "includesDinner" | "allowByo">) => {
  const meals = [
    plan.includesBreakfast ? "Breakfast" : "",
    plan.includesLunch ? "Lunch" : "",
    plan.includesDinner ? "Dinner" : "",
    plan.allowByo ? "Bring your own" : "",
  ].filter(Boolean);
  return meals.length > 0 ? meals : ["Room only"];
};

export default function MealPlansScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const editorTitleId = useId();
  const archiveTitleId = useId();

  const [plans, setPlans] = useState<MealPlan[]>([]);
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

  const [pendingArchive, setPendingArchive] = useState<MealPlan | null>(null);
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
    listMealPlans(propertyUid)
      .then((next) => {
        if (active) setPlans(next);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Could not load meal plans.");
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
      if (event.key !== "Escape" || saving || archiving) return;
      setEditor(null);
      setPendingArchive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, pendingArchive, saving, archiving]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...plans]
      .sort((a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code))
      .filter((plan) =>
        `${plan.code} ${plan.name} ${plan.description} ${included(plan).join(" ")}`
          .toLowerCase()
          .includes(q),
      );
  }, [plans, query]);

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
    getMealPlan(propertyUid, uid)
      .then((plan) => setDraft(draftFrom(plan)))
      .catch((err: unknown) => {
        setSaveError(err instanceof ApiError ? err.message : "Could not load this meal plan.");
      })
      .finally(() => setEditorLoading(false));
  };

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    const next =
      type === "checkbox" && event.target instanceof HTMLInputElement
        ? event.target.checked
        : name === "code"
          ? value.toUpperCase()
          : value;
    setDraft((current) => (current ? { ...current, [name]: next } : current));
  };

  const payloadFrom = (current: Draft) => ({
    code: current.code.trim().toUpperCase(),
    name: current.name.trim(),
    description: current.description.trim() || null,
    includesBreakfast: current.includesBreakfast,
    includesLunch: current.includesLunch,
    includesDinner: current.includesDinner,
    allowByo: current.allowByo,
  });

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid || !draft || !editor) return;
    setSaveError("");

    const payload = payloadFrom(draft);
    if (!payload.code || !payload.name) return setSaveError("Enter a code and a name.");
    if (payload.code.length > 30) return setSaveError("Code cannot exceed 30 characters.");
    if (payload.name.length > 100) return setSaveError("Name cannot exceed 100 characters.");

    setSaving(true);
    try {
      if (editor === "create") {
        await createMealPlan(propertyUid, payload);
        setNotice(`${payload.name} added.`);
      } else {
        await updateMealPlan(propertyUid, editor, payload);
        setNotice(`${payload.name} updated.`);
      }
      setEditor(null);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : editor === "create"
            ? "Could not add this meal plan."
            : "Could not update this meal plan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!propertyUid || !pendingArchive) return;
    setArchiveError("");
    setArchiving(true);
    try {
      await deleteMealPlan(propertyUid, pendingArchive.uid);
      setNotice(`${pendingArchive.name} archived.`);
      setPendingArchive(null);
      setTick((n) => n + 1);
    } catch (err) {
      setArchiveError(
        err instanceof ApiError ? err.message : "Could not archive this meal plan.",
      );
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="mp-page">
      {!propertyUid && (
        <p className="mp-empty-note">This account is not assigned to a property.</p>
      )}

      {propertyUid && (
        <header className="mp-hero">
          <div>
            <p className="mp-kicker">Accommodation</p>
            <h1>Meal plans</h1>
            <p>Board basis for a stay: breakfast, lunch, dinner, or bring your own.</p>
          </div>
          <button type="button" className="mp-add" onClick={openCreate} disabled={loading || !!error}>
            Add meal plan
          </button>
        </header>
      )}

      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && (
        <PageError message={error} onRetry={() => setTick((n) => n + 1)} />
      )}

      {propertyUid && !loading && !error && (
        <>
          {notice && <p className="mp-notice">{notice}</p>}
          {plans.length > 0 && (
            <input
              className="mp-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by code, name, or meals"
            />
          )}

          {visible.length === 0 ? (
            <div className="mp-blank">
              <h2>{plans.length === 0 ? "No meal plans yet" : "No matches"}</h2>
              <p>
                {plans.length === 0
                  ? "Add room only, bed and breakfast, or another board basis."
                  : "Try a different code or name."}
              </p>
            </div>
          ) : (
            <div className="mp-grid">
              {visible.map((plan) => (
                <article key={plan.uid} className="mp-card">
                  <div className="mp-card-top">
                    <div>
                      <div className="mp-code">{plan.code}</div>
                      <h2>{plan.name}</h2>
                    </div>
                    <span className={`mp-badge ${plan.isActive ? "" : "off"}`}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {plan.description && <p className="mp-desc">{plan.description}</p>}
                  <ul className="mp-meals">
                    {included(plan).map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                  <div className="mp-card-actions">
                    <button
                      type="button"
                      className="mp-text-danger"
                      onClick={() => {
                        setArchiveError("");
                        setEditor(null);
                        setPendingArchive(plan);
                      }}
                    >
                      Archive
                    </button>
                    <button type="button" className="mp-text" onClick={() => openEdit(plan.uid)}>
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
          <div className="mp-backdrop" onClick={() => !saving && setEditor(null)}>
            <div
              className="mp-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={editorTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mp-dialog-head">
                <h2 id={editorTitleId}>
                  {editor === "create" ? "New meal plan" : "Edit meal plan"}
                </h2>
                <button
                  type="button"
                  className="mp-close"
                  aria-label="Close"
                  onClick={() => !saving && setEditor(null)}
                >
                  ×
                </button>
              </div>
              {editorLoading && <PageLoading />}
              {!editorLoading && draft && (
                <form className="mp-form" onSubmit={onSave}>
                  <label>
                    Code
                    <input
                      name="code"
                      value={draft.code}
                      onChange={onChange}
                      maxLength={30}
                      placeholder="BB"
                    />
                  </label>
                  <label>
                    Name
                    <input
                      name="name"
                      value={draft.name}
                      onChange={onChange}
                      maxLength={100}
                      placeholder="Bed and Breakfast"
                    />
                  </label>
                  <label className="mp-span">
                    Description
                    <textarea
                      name="description"
                      rows={2}
                      value={draft.description}
                      onChange={onChange}
                      placeholder="Room with breakfast"
                    />
                  </label>
                  <div className="mp-checks">
                    <label>
                      <input
                        name="includesBreakfast"
                        type="checkbox"
                        checked={draft.includesBreakfast}
                        onChange={onChange}
                      />
                      Breakfast
                    </label>
                    <label>
                      <input
                        name="includesLunch"
                        type="checkbox"
                        checked={draft.includesLunch}
                        onChange={onChange}
                      />
                      Lunch
                    </label>
                    <label>
                      <input
                        name="includesDinner"
                        type="checkbox"
                        checked={draft.includesDinner}
                        onChange={onChange}
                      />
                      Dinner
                    </label>
                    <label>
                      <input
                        name="allowByo"
                        type="checkbox"
                        checked={draft.allowByo}
                        onChange={onChange}
                      />
                      Bring your own
                    </label>
                  </div>
                  {saveError && <p className="mp-error">{saveError}</p>}
                  <div className="mp-form-actions">
                    <button
                      type="button"
                      className="mp-ghost"
                      onClick={() => setEditor(null)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="mp-save" disabled={saving}>
                      {saving
                        ? "Saving…"
                        : editor === "create"
                          ? "Add meal plan"
                          : "Save changes"}
                    </button>
                  </div>
                </form>
              )}
              {!editorLoading && !draft && saveError && <p className="mp-error">{saveError}</p>}
            </div>
          </div>,
          document.body,
        )}

      {pendingArchive &&
        createPortal(
          <div className="mp-backdrop" onClick={() => !archiving && setPendingArchive(null)}>
            <div
              className="mp-dialog mp-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={archiveTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={archiveTitleId}>Archive {pendingArchive.name}?</h2>
              <p>
                This hides the plan from new bookings. Rate plans that already use it keep that
                link.
              </p>
              {archiveError && <p className="mp-error">{archiveError}</p>}
              <div className="mp-form-actions">
                <button
                  type="button"
                  className="mp-ghost"
                  onClick={() => setPendingArchive(null)}
                  disabled={archiving}
                >
                  Keep
                </button>
                <button
                  type="button"
                  className="mp-danger"
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
