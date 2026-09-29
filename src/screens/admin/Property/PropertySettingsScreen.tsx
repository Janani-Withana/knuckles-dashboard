import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import {
  getPropertySettings,
  updatePropertySettings,
} from "../../../services/superAdmin/propertyService.service";
import type { PropertySettings } from "../../../types/superAdmin/property";
import "./PropertySettingsScreen.css";

type Draft = {
  checkInTime: string;
  checkOutTime: string;
  bookingNumberPrefix: string;
  invoiceNumberPrefix: string;
  taxPercent: string;
  servicePercent: string;
  allowOverbooking: boolean;
  extraSettings: string;
};

const clockInput = (value: string) => value.slice(0, 5);

const percentInput = (rate: number) => {
  const percent = rate * 100;
  if (!Number.isFinite(percent)) return "0";
  return Number.isInteger(percent)
    ? String(percent)
    : String(Math.round(percent * 100) / 100);
};

const clockLabel = (value: string) => {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return value || "—";
  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const rateLabel = (rate: number) => `${percentInput(rate)}%`;

const extraLabel = (extra: Record<string, unknown>) =>
  Object.keys(extra).length ? JSON.stringify(extra) : "None";

const draftFrom = (settings: PropertySettings): Draft => ({
  checkInTime: clockInput(settings.checkInTime),
  checkOutTime: clockInput(settings.checkOutTime),
  bookingNumberPrefix: settings.bookingNumberPrefix,
  invoiceNumberPrefix: settings.invoiceNumberPrefix,
  taxPercent: percentInput(settings.taxRate),
  servicePercent: percentInput(settings.serviceChargeRate),
  allowOverbooking: settings.allowOverbooking,
  extraSettings: Object.keys(settings.extraSettings).length
    ? JSON.stringify(settings.extraSettings, null, 2)
    : "",
});

const toApiTime = (value: string) => {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return "";
};

const toRate = (value: string) => {
  const percent = Number(value);
  if (!value.trim() || Number.isNaN(percent) || percent < 0 || percent > 100) {
    return null;
  }
  return Number((percent / 100).toFixed(4));
};

export default function PropertySettingsScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";

  const [settings, setSettings] = useState<PropertySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    getPropertySettings(propertyUid)
      .then((next) => {
        if (!active) return;
        setSettings(next);
        setDraft(draftFrom(next));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load property settings.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  const startEdit = () => {
    if (!settings) return;
    setDraft(draftFrom(settings));
    setSaveError("");
    setSaved("");
    setEditing(true);
  };

  const cancelEdit = () => {
    if (settings) setDraft(draftFrom(settings));
    setSaveError("");
    setEditing(false);
  };

  const onChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target;
    const next =
      type === "checkbox" && event.target instanceof HTMLInputElement
        ? event.target.checked
        : value;
    setDraft((current) => (current ? { ...current, [name]: next } : current));
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !propertyUid) return;
    setSaveError("");
    setSaved("");

    const checkInTime = toApiTime(draft.checkInTime);
    const checkOutTime = toApiTime(draft.checkOutTime);
    if (!checkInTime || !checkOutTime) {
      return setSaveError("Enter a check-in and check-out time.");
    }
    if (!draft.bookingNumberPrefix.trim() || !draft.invoiceNumberPrefix.trim()) {
      return setSaveError("Enter the booking and invoice prefixes.");
    }
    const taxRate = toRate(draft.taxPercent);
    const serviceChargeRate = toRate(draft.servicePercent);
    if (taxRate === null) return setSaveError("Tax rate must be between 0 and 100.");
    if (serviceChargeRate === null) {
      return setSaveError("Service charge must be between 0 and 100.");
    }

    let extraSettings: Record<string, unknown> = {};
    const rawExtra = draft.extraSettings.trim();
    if (rawExtra) {
      try {
        const parsed: unknown = JSON.parse(rawExtra);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return setSaveError("Extra settings must be a JSON object.");
        }
        extraSettings = parsed as Record<string, unknown>;
      } catch {
        return setSaveError("Extra settings must be valid JSON.");
      }
    }

    setSaving(true);
    try {
      await updatePropertySettings(propertyUid, {
        checkInTime,
        checkOutTime,
        bookingNumberPrefix: draft.bookingNumberPrefix.trim(),
        invoiceNumberPrefix: draft.invoiceNumberPrefix.trim(),
        taxRate,
        serviceChargeRate,
        allowOverbooking: draft.allowOverbooking,
        extraSettings,
      });
      const next = await getPropertySettings(propertyUid);
      setSettings(next);
      setDraft(draftFrom(next));
      setEditing(false);
      setSaved("Settings updated.");
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Could not update settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const facts: [string, string][] = settings
    ? [
        ["Check-in", clockLabel(settings.checkInTime)],
        ["Check-out", clockLabel(settings.checkOutTime)],
        ["Booking prefix", settings.bookingNumberPrefix],
        ["Invoice prefix", settings.invoiceNumberPrefix],
        ["Tax rate", rateLabel(settings.taxRate)],
        ["Service charge", rateLabel(settings.serviceChargeRate)],
        ["Overbooking", settings.allowOverbooking ? "Allowed" : "Not allowed"],
        ["Extra settings", extraLabel(settings.extraSettings)],
      ]
    : [];

  return (
    <div className="ps-page">
      {!propertyUid && (
        <p className="ps-empty">This account is not assigned to a property.</p>
      )}
      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && (
        <PageError message={error} onRetry={() => setTick((t) => t + 1)} />
      )}

      {!loading && !error && settings && draft && (
        <>
          <header className="ps-hero">
            <div>
              <p className="ps-kicker">Operations</p>
              <h1>Property settings</h1>
              <p>Check-in hours, numbering, tax, and overbooking.</p>
              <div className="ps-chips">
                <span>Check-in {clockLabel(settings.checkInTime)}</span>
                <span>Check-out {clockLabel(settings.checkOutTime)}</span>
              </div>
            </div>
            <div className="ps-hero-actions">
              <span className={`ps-status ${settings.allowOverbooking ? "on" : ""}`}>
                {settings.allowOverbooking ? "Overbooking on" : "Overbooking off"}
              </span>
              {!editing && (
                <button type="button" className="ps-edit" onClick={startEdit}>
                  Edit settings
                </button>
              )}
            </div>
          </header>

          {editing ? (
            <form className="ps-panel" onSubmit={onSave}>
              <h2>Edit settings</h2>
              <div className="ps-form-grid">
                <label>
                  Check-in
                  <input
                    name="checkInTime"
                    type="time"
                    value={draft.checkInTime}
                    onChange={onChange}
                    required
                  />
                </label>
                <label>
                  Check-out
                  <input
                    name="checkOutTime"
                    type="time"
                    value={draft.checkOutTime}
                    onChange={onChange}
                    required
                  />
                </label>
                <label>
                  Booking prefix
                  <input
                    name="bookingNumberPrefix"
                    value={draft.bookingNumberPrefix}
                    onChange={onChange}
                    maxLength={12}
                  />
                </label>
                <label>
                  Invoice prefix
                  <input
                    name="invoiceNumberPrefix"
                    value={draft.invoiceNumberPrefix}
                    onChange={onChange}
                    maxLength={12}
                  />
                </label>
                <label>
                  Tax rate (%)
                  <input
                    name="taxPercent"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={draft.taxPercent}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Service charge (%)
                  <input
                    name="servicePercent"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={draft.servicePercent}
                    onChange={onChange}
                  />
                </label>
                <label className="ps-switch">
                  <input
                    name="allowOverbooking"
                    type="checkbox"
                    checked={draft.allowOverbooking}
                    onChange={onChange}
                  />
                  <span>Allow overbooking</span>
                </label>
                <label className="ps-span">
                  Extra settings
                  <textarea
                    name="extraSettings"
                    rows={4}
                    value={draft.extraSettings}
                    onChange={onChange}
                    placeholder="Enter notes here..."
                    spellCheck={false}
                  />
                </label>
              </div>
              {saveError && <p className="ps-error">{saveError}</p>}
              <div className="ps-form-actions">
                <button
                  type="button"
                  className="ps-ghost"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="ps-save" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <section className="ps-panel">
              <h2>Settings</h2>
              {saved && <p className="ps-saved">{saved}</p>}
              <dl className="ps-facts">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </>
      )}
    </div>
  );
}
