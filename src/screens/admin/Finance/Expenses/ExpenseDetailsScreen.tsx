import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../../../../components/common/PageState";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { ROUTES } from "../../../../routes/paths";
import { listBookings } from "../../../../services/admin/bookingService.service";
import {
  deleteExpense,
  getExpense,
  listExpenseCategories,
  updateExpense,
} from "../../../../services/admin/expenseService.service";
import type { Booking } from "../../../../types/booking";
import {
  PAYMENT_METHOD_LABELS,
  expenseGroupLabel,
  paymentMethodLabel,
  type Expense,
  type ExpenseCategory,
} from "../../../../types/expense";
import { formatDate } from "../../Reservations/bookingDates";
import "./expenses.css";

type Draft = {
  expenseCategoryUid: string;
  expenseDate: string;
  description: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  bookingUid: string;
  referenceNumber: string;
  receiptUrl: string;
  notes: string;
};

const draftFrom = (expense: Expense): Draft => ({
  expenseCategoryUid: expense.expenseCategoryUid,
  expenseDate: expense.expenseDate,
  description: expense.description,
  amount: String(expense.amount),
  currency: expense.currency || "LKR",
  paymentMethod: expense.paymentMethod === null ? "" : String(expense.paymentMethod),
  bookingUid: expense.bookingUid,
  referenceNumber: expense.referenceNumber,
  receiptUrl: expense.receiptUrl,
  notes: expense.notes,
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

export default function ExpenseDetailsScreen() {
  const { expenseUid = "" } = useParams<{ expenseUid: string }>();
  const archiveTitleId = useId();
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
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
    if (!expenseUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      getExpense(expenseUid),
      propertyUid ? listExpenseCategories(propertyUid) : Promise.resolve([] as ExpenseCategory[]),
      propertyUid ? listBookings(propertyUid).catch(() => [] as Booking[]) : Promise.resolve([] as Booking[]),
    ])
      .then(([nextExpense, nextCategories, nextBookings]) => {
        if (!active) return;
        setExpense(nextExpense);
        setDraft(draftFrom(nextExpense));
        setCategories(nextCategories);
        setBookings(nextBookings);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load this expense.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [expenseUid, propertyUid, tick]);

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setDraft((current) =>
      current ? { ...current, [name]: name === "currency" ? value.toUpperCase() : value } : current,
    );
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!expense || !draft) return;
    const amount = Number(draft.amount);
    if (!draft.expenseCategoryUid) return setSaveError("Choose a category.");
    if (!draft.description.trim()) return setSaveError("Description is required.");
    if (!Number.isFinite(amount) || amount <= 0) return setSaveError("Amount must be greater than zero.");
    if (draft.currency.trim().length !== 3) return setSaveError("Currency must be a 3-letter code.");

    setSaving(true);
    setSaveError("");
    try {
      const next = await updateExpense(expense.uid, {
        expenseCategoryUid: draft.expenseCategoryUid,
        expenseDate: draft.expenseDate,
        description: draft.description.trim(),
        amount,
        currency: draft.currency.trim().toUpperCase(),
        paymentMethod: draft.paymentMethod === "" ? null : Number(draft.paymentMethod),
        supplierUid: expense.supplierUid || null,
        bookingUid: draft.bookingUid || null,
        referenceNumber: draft.referenceNumber.trim() || null,
        receiptUrl: draft.receiptUrl.trim() || null,
        notes: draft.notes.trim() || null,
      });
      setExpense(next);
      setDraft(draftFrom(next));
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not update this expense.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!confirming) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !archiving) setConfirming(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming, archiving]);

  const onArchive = async () => {
    if (!expense) return;
    setArchiving(true);
    setArchiveError("");
    try {
      await deleteExpense(expense.uid);
      navigate(ROUTES.ADMIN_FINANCE_EXPENSES, { state: { notice: `${expense.description} archived.` } });
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : "Could not archive this expense.");
      setArchiving(false);
    }
  };

  if (!expenseUid) return <p className="exp-empty">No expense selected.</p>;

  return (
    <div className="exp-page">
      <div className="exp-head">
        <button type="button" className="exp-ghost" onClick={() => navigate(ROUTES.ADMIN_FINANCE_EXPENSES)}>
          ← Expenses
        </button>
      </div>

      {loading && <PageLoading />}
      {!loading && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {!loading && !error && expense && draft && (
        <section className="exp-panel">
          <div className="exp-head">
            <div>
              <p className="exp-kicker">Expense</p>
              <h1>{expense.description}</h1>
            </div>
            <div className="exp-hero-actions">
              {!editing && (
                <button type="button" className="exp-save" onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
              <button
                type="button"
                className="exp-danger"
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
            <div className="exp-facts">
              <div>
                <span>Amount</span>
                <strong>{money(expense.amount, expense.currency)}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>{formatDate(expense.expenseDate)}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{expense.expenseCategoryName || "—"}</strong>
              </div>
              <div>
                <span>Method</span>
                <strong>{paymentMethodLabel(expense.paymentMethod)}</strong>
              </div>
              <div>
                <span>Reference</span>
                <strong>{expense.referenceNumber || "—"}</strong>
              </div>
              <div>
                <span>Supplier</span>
                <strong>{expense.supplierName || "—"}</strong>
              </div>
              {expense.notes && <p className="exp-notes">{expense.notes}</p>}
            </div>
          )}

          {editing && (
            <form className="exp-form" onSubmit={onSave}>
              <label>
                Category
                <select name="expenseCategoryUid" value={draft.expenseCategoryUid} onChange={onChange}>
                  {categories.map((category) => (
                    <option key={category.uid} value={category.uid}>
                      {category.name} · {expenseGroupLabel(category.expenseGroup)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input type="date" name="expenseDate" value={draft.expenseDate} onChange={onChange} />
              </label>
              <label className="exp-span">
                Description
                <input name="description" value={draft.description} onChange={onChange} maxLength={300} />
              </label>
              <label>
                Amount
                <input name="amount" inputMode="decimal" value={draft.amount} onChange={onChange} />
              </label>
              <label>
                Currency
                <input name="currency" value={draft.currency} onChange={onChange} maxLength={3} />
              </label>
              <label>
                Payment method
                <select name="paymentMethod" value={draft.paymentMethod} onChange={onChange}>
                  <option value="">Not set</option>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Booking
                <select name="bookingUid" value={draft.bookingUid} onChange={onChange}>
                  <option value="">None</option>
                  {bookings.map((booking) => (
                    <option key={booking.uid} value={booking.uid}>
                      {booking.bookingNumber || "Booking"}
                      {booking.leadGuestName ? ` · ${booking.leadGuestName}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reference
                <input name="referenceNumber" value={draft.referenceNumber} onChange={onChange} maxLength={150} />
              </label>
              <label>
                Receipt link
                <input name="receiptUrl" value={draft.receiptUrl} onChange={onChange} maxLength={2000} />
              </label>
              <label className="exp-span">
                Notes
                <textarea name="notes" rows={2} value={draft.notes} onChange={onChange} />
              </label>
              {saveError && <p className="exp-error">{saveError}</p>}
              <div className="exp-form-actions">
                <button
                  type="button"
                  className="exp-ghost"
                  disabled={saving}
                  onClick={() => {
                    setDraft(draftFrom(expense));
                    setEditing(false);
                    setSaveError("");
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="exp-save" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}

        </section>
      )}

      {confirming &&
        expense &&
        createPortal(
          <div className="exp-backdrop" onClick={() => !archiving && setConfirming(false)}>
            <div
              className="exp-dialog exp-confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={archiveTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={archiveTitleId}>Archive {expense.description}?</h2>
              <p>This removes it from the expense list. The record stays archived.</p>
              {archiveError && <p className="exp-error">{archiveError}</p>}
              <div className="exp-form-actions">
                <button type="button" className="exp-ghost" onClick={() => setConfirming(false)} disabled={archiving}>
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
