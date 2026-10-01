import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../../../../components/common/PageState";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { ROUTES } from "../../../../routes/paths";
import {
  deleteUtilityBill,
  getUtilityBill,
  listUtilityTypes,
  updateUtilityBill,
} from "../../../../services/admin/utilitiesService.service";
import {
  UTILITY_BILL_STATUS_LABELS,
  utilityBillStatus,
  type UtilityBill as UtilityBillRecord,
  type UtilityType,
} from "../../../../types/utilities";
import { formatDate, isoDate } from "../../Reservations/bookingDates";
import "./utilities.css";

type Draft = {
  utilityTypeUid: string;
  periodStart: string;
  periodEnd: string;
  previousReading: string;
  currentReading: string;
  amount: string;
  currency: string;
  dueDate: string;
  paidAt: string;
  referenceNumber: string;
};

const toLocalInput = (iso: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 16);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const draftFrom = (bill: UtilityBillRecord): Draft => ({
  utilityTypeUid: bill.utilityTypeUid,
  periodStart: bill.periodStart,
  periodEnd: bill.periodEnd,
  previousReading: bill.previousReading === null ? "" : String(bill.previousReading),
  currentReading: bill.currentReading === null ? "" : String(bill.currentReading),
  amount: String(bill.amount),
  currency: bill.currency || "LKR",
  dueDate: bill.dueDate,
  paidAt: toLocalInput(bill.paidAt),
  referenceNumber: bill.referenceNumber,
});

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "LKR",
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};

const reading = (value: number | null) =>
  value === null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function UtilityBill() {
  const { utilityBillUid = "" } = useParams<{ utilityBillUid: string }>();
  const archiveTitleId = useId();
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();
  const today = isoDate(new Date());

  const [bill, setBill] = useState<UtilityBillRecord | null>(null);
  const [types, setTypes] = useState<UtilityType[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!utilityBillUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      getUtilityBill(utilityBillUid),
      propertyUid ? listUtilityTypes(propertyUid) : Promise.resolve([] as UtilityType[]),
    ])
      .then(([nextBill, nextTypes]) => {
        if (!active) return;
        setBill(nextBill);
        setDraft(draftFrom(nextBill));
        setTypes(nextTypes);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load this bill.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [utilityBillUid, propertyUid, tick]);

  useEffect(() => {
    if (!confirming) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !archiving) setConfirming(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming, archiving]);

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setDraft((current) =>
      current ? { ...current, [name]: name === "currency" ? value.toUpperCase() : value } : current,
    );
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!bill || !draft) return;
    const amount = Number(draft.amount);
    const metered = types.find((type) => type.uid === draft.utilityTypeUid)?.isMetered !== false;
    const previous = !metered || draft.previousReading.trim() === "" ? null : Number(draft.previousReading);
    const current = !metered || draft.currentReading.trim() === "" ? null : Number(draft.currentReading);
    if (!draft.utilityTypeUid) return setSaveError("Choose a utility type.");
    if (!draft.periodStart || !draft.periodEnd) return setSaveError("Choose the billing period.");
    if (draft.periodEnd < draft.periodStart) return setSaveError("Period end must be on or after the start.");
    if (!Number.isFinite(amount) || amount < 0) return setSaveError("Amount cannot be negative.");
    if (draft.currency.trim().length !== 3) return setSaveError("Currency must be a 3-letter code.");
    if (previous !== null && !Number.isFinite(previous)) return setSaveError("Previous reading must be a number.");
    if (current !== null && !Number.isFinite(current)) return setSaveError("Current reading must be a number.");
    if (previous !== null && current !== null && current < previous) {
      return setSaveError("Current reading cannot be less than the previous reading.");
    }

    setSaving(true);
    setSaveError("");
    try {
      const paidAt = draft.paidAt ? new Date(draft.paidAt).toISOString() : null;
      const next = await updateUtilityBill(bill.uid, {
        utilityTypeUid: draft.utilityTypeUid,
        periodStart: draft.periodStart,
        periodEnd: draft.periodEnd,
        previousReading: previous,
        currentReading: current,
        amount,
        currency: draft.currency.trim().toUpperCase(),
        dueDate: draft.dueDate || null,
        referenceNumber: draft.referenceNumber.trim() || null,
        paidAt,
      });
      setBill(next);
      setDraft(draftFrom(next));
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not update this bill.");
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!bill) return;
    setArchiving(true);
    setArchiveError("");
    try {
      await deleteUtilityBill(bill.uid);
      const label = bill.utilityTypeName || bill.referenceNumber || "Bill";
      navigate(ROUTES.ADMIN_FINANCE_UTILITIES, { state: { notice: `${label} archived.` } });
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : "Could not archive this bill.");
      setArchiving(false);
    }
  };

  const unitsPreview = () => {
    if (!draft?.previousReading || !draft.currentReading) return null;
    const previous = Number(draft.previousReading);
    const current = Number(draft.currentReading);
    if (!Number.isFinite(previous) || !Number.isFinite(current) || current < previous) return null;
    return current - previous;
  };

  if (!utilityBillUid) return <p className="ut-empty">No bill selected.</p>;

  const status = bill ? utilityBillStatus(bill, today) : "due";
  const title = bill?.utilityTypeName || bill?.referenceNumber || "Utility bill";

  return (
    <div className="ut-page">
      <div className="ut-head">
        <button type="button" className="ut-ghost" onClick={() => navigate(ROUTES.ADMIN_FINANCE_UTILITIES)}>
          ← Utilities
        </button>
      </div>

      {loading && <PageLoading />}
      {!loading && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {!loading && !error && bill && draft && (
        <section className="ut-panel">
          <div className="ut-head">
            <div>
              <p className="ut-kicker">Utility bill</p>
              <h1>{title}</h1>
            </div>
            <div className="ut-hero-actions">
              {!editing && (
                <button type="button" className="ut-save" onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
              <button
                type="button"
                className="ut-danger"
                onClick={() => {
                  setArchiveError("");
                  setConfirming(true);
                }}
                disabled={archiving}
              >
                Archive
              </button>
            </div>
          </div>

          {!editing && (
            <div className="ut-facts">
              <div>
                <span>Amount</span>
                <strong>{money(bill.amount, bill.currency)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{UTILITY_BILL_STATUS_LABELS[status]}</strong>
              </div>
              <div>
                <span>Period</span>
                <strong>
                  {formatDate(bill.periodStart)} – {formatDate(bill.periodEnd)}
                </strong>
              </div>
              <div>
                <span>Due</span>
                <strong>{bill.dueDate ? formatDate(bill.dueDate) : "—"}</strong>
              </div>
              <div>
                <span>Readings</span>
                <strong>
                  {reading(bill.previousReading)} → {reading(bill.currentReading)}
                  {bill.unitsUsed !== null ? ` · ${reading(bill.unitsUsed)} used` : ""}
                </strong>
              </div>
              <div>
                <span>Reference</span>
                <strong>{bill.referenceNumber || "—"}</strong>
              </div>
              <div>
                <span>Paid</span>
                <strong>{bill.paidAt ? formatDate(bill.paidAt.slice(0, 10)) : "Unpaid"}</strong>
              </div>
            </div>
          )}

          {editing && (
            <form className="ut-form" onSubmit={onSave}>
              <label>
                Utility type
                <select name="utilityTypeUid" value={draft.utilityTypeUid} onChange={onChange}>
                  <option value="">Choose</option>
                  {types.map((type) => (
                    <option key={type.uid} value={type.uid}>
                      {type.name}
                      {type.unitOfMeasure ? ` · ${type.unitOfMeasure}` : ""}
                    </option>
                  ))}
                  {draft.utilityTypeUid && !types.some((type) => type.uid === draft.utilityTypeUid) && (
                    <option value={draft.utilityTypeUid}>{bill.utilityTypeName || "Current type"}</option>
                  )}
                </select>
              </label>
              <label>
                Reference
                <input name="referenceNumber" value={draft.referenceNumber} onChange={onChange} maxLength={150} />
              </label>
              <label>
                Period start
                <input type="date" name="periodStart" value={draft.periodStart} onChange={onChange} />
              </label>
              <label>
                Period end
                <input type="date" name="periodEnd" value={draft.periodEnd} onChange={onChange} />
              </label>
              {types.find((type) => type.uid === draft.utilityTypeUid)?.isMetered !== false && (
                <>
                  <label>
                    Previous reading
                    <input name="previousReading" inputMode="decimal" value={draft.previousReading} onChange={onChange} />
                  </label>
                  <label>
                    Current reading
                    <input name="currentReading" inputMode="decimal" value={draft.currentReading} onChange={onChange} />
                  </label>
                </>
              )}
              <label>
                Amount
                <input name="amount" inputMode="decimal" value={draft.amount} onChange={onChange} />
              </label>
              <label>
                Currency
                <input name="currency" value={draft.currency} onChange={onChange} maxLength={3} />
              </label>
              <label>
                Due date
                <input type="date" name="dueDate" value={draft.dueDate} onChange={onChange} />
              </label>
              <label>
                Paid at
                <input type="datetime-local" name="paidAt" value={draft.paidAt} onChange={onChange} />
              </label>
              {unitsPreview() !== null && <p className="ut-hint">Units used: {unitsPreview()?.toLocaleString()}</p>}
              {saveError && <p className="ut-error">{saveError}</p>}
              <div className="ut-form-actions">
                <button
                  type="button"
                  className="ut-ghost"
                  disabled={saving}
                  onClick={() => {
                    setDraft(draftFrom(bill));
                    setEditing(false);
                    setSaveError("");
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="ut-save" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {confirming &&
        bill &&
        createPortal(
          <div className="ut-backdrop" onClick={() => !archiving && setConfirming(false)}>
            <div
              className="ut-dialog ut-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={archiveTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={archiveTitleId}>Archive {title}?</h2>
              <p>This removes it from the bill list. The record stays archived.</p>
              {archiveError && <p className="ut-error">{archiveError}</p>}
              <div className="ut-form-actions">
                <button type="button" className="ut-ghost" onClick={() => setConfirming(false)} disabled={archiving}>
                  Keep
                </button>
                <button type="button" className="ut-danger" onClick={onArchive} disabled={archiving}>
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
