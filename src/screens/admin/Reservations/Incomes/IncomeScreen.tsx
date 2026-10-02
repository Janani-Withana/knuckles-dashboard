import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../../../../components/common/PageState";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { adminReservationPath, ROUTES } from "../../../../routes/paths";
import { listBookings } from "../../../../services/admin/bookingService.service";
import {
  createOtherIncome,
  deleteOtherIncome,
  getOtherIncome,
  listIncomeCategories,
  listOtherIncome,
  updateOtherIncome,
} from "../../../../services/admin/incomeService.service";
import type { Booking } from "../../../../types/booking";
import { PAYMENT_METHOD_LABELS, paymentMethodLabel } from "../../../../types/expense";
import type { IncomeCategory, OtherIncome } from "../../../../types/income";
import { formatDate, isoDate } from "../bookingDates";
import "../../Finance/Expenses/expenses.css";
import "./incomes.css";

type IncomeDraft = {
  incomeCategoryUid: string;
  incomeDate: string;
  description: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  bookingUid: string;
  referenceNumber: string;
  notes: string;
};

const emptyDraft = (categoryUid = "", bookingUid = ""): IncomeDraft => ({
  incomeCategoryUid: categoryUid,
  incomeDate: isoDate(new Date()),
  description: "",
  amount: "",
  currency: "LKR",
  paymentMethod: "0",
  bookingUid,
  referenceNumber: "",
  notes: "",
});

const draftFrom = (income: OtherIncome): IncomeDraft => ({
  incomeCategoryUid: income.incomeCategoryUid,
  incomeDate: income.incomeDate,
  description: income.description,
  amount: String(income.amount),
  currency: income.currency || "LKR",
  paymentMethod: income.paymentMethod === null ? "" : String(income.paymentMethod),
  bookingUid: income.bookingUid,
  referenceNumber: income.referenceNumber,
  notes: income.notes,
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

export default function IncomeScreen() {
  const { bookingUid: routeBookingUid = "" } = useParams();
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();
  const editorTitleId = useId();
  const archiveTitleId = useId();

  const [incomes, setIncomes] = useState<OtherIncome[]>([]);
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);

  const [editor, setEditor] = useState<"create" | string | null>(null);
  const [draft, setDraft] = useState<IncomeDraft | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<OtherIncome | null>(null);
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
    Promise.all([
      listOtherIncome(propertyUid),
      listIncomeCategories(propertyUid),
      listBookings(propertyUid).catch(() => [] as Booking[]),
    ])
      .then(([nextIncomes, nextCategories, nextBookings]) => {
        if (!active) return;
        setIncomes(nextIncomes);
        setCategories(nextCategories);
        setBookings(nextBookings);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load income.");
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

  const categoryName = (income: OtherIncome) =>
    categories.find((category) => category.uid === income.incomeCategoryUid)?.name || income.incomeCategoryName || "—";

  const forBooking = useMemo(
    () => (routeBookingUid ? incomes.filter((income) => income.bookingUid === routeBookingUid) : incomes),
    [incomes, routeBookingUid],
  );

  const currentBooking = bookings.find((booking) => booking.uid === routeBookingUid);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...forBooking]
      .sort((a, b) => b.incomeDate.localeCompare(a.incomeDate))
      .filter((income) =>
        `${income.description} ${categoryName(income)} ${income.referenceNumber} ${income.bookingNumber} ${paymentMethodLabel(income.paymentMethod)}`
          .toLowerCase()
          .includes(q),
      );
  }, [forBooking, categories, query]);

  const totals = useMemo(() => {
    const month = isoDate(new Date()).slice(0, 7);
    const currency = forBooking.find((income) => income.currency)?.currency || "LKR";
    let monthAmount = 0;
    let total = 0;
    for (const income of forBooking) {
      if (income.currency !== currency) continue;
      total += income.amount;
      if (income.incomeDate.startsWith(month)) monthAmount += income.amount;
    }
    return { currency, monthAmount, total };
  }, [forBooking]);

  const openCreate = () => {
    setNotice("");
    setSaveError("");
    setPendingArchive(null);
    setDraft(emptyDraft(categories.find((category) => category.isActive)?.uid || "", routeBookingUid));
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
    getOtherIncome(propertyUid, uid)
      .then((income) => setDraft(draftFrom(income)))
      .catch((err: unknown) => {
        setSaveError(err instanceof ApiError ? err.message : "Could not load this income.");
      })
      .finally(() => setEditorLoading(false));
  };

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setDraft((current) => (current ? { ...current, [name]: name === "currency" ? value.toUpperCase() : value } : current));
  };

  const saveIncome = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid || !editor || !draft) return;
    const amount = Number(draft.amount);
    if (!draft.incomeCategoryUid.trim()) return setSaveError("Choose an income category.");
    if (!draft.description.trim()) return setSaveError("Description is required.");
    if (!Number.isFinite(amount) || amount <= 0) return setSaveError("Amount must be greater than zero.");
    if (draft.currency.trim().length !== 3) return setSaveError("Currency must be a 3-letter code.");
    if (!draft.incomeDate) return setSaveError("Choose the income date.");
    const bookingUid = routeBookingUid || draft.bookingUid;
    if (!bookingUid) return setSaveError("Choose a booking.");

    const payload = {
      incomeCategoryUid: draft.incomeCategoryUid.trim(),
      bookingUid,
      incomeDate: draft.incomeDate,
      description: draft.description.trim(),
      amount,
      currency: draft.currency.trim().toUpperCase(),
      paymentMethod: draft.paymentMethod === "" ? null : Number(draft.paymentMethod),
      referenceNumber: draft.referenceNumber.trim() || null,
      notes: draft.notes.trim() || null,
    };

    setSaving(true);
    setSaveError("");
    try {
      if (editor === "create") {
        await createOtherIncome(propertyUid, payload);
        setNotice(`${payload.description} added.`);
      } else {
        await updateOtherIncome(propertyUid, editor, payload);
        setNotice(`${payload.description} updated.`);
      }
      setEditor(null);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save this income.");
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!propertyUid || !pendingArchive) return;
    setArchiving(true);
    setArchiveError("");
    try {
      await deleteOtherIncome(propertyUid, pendingArchive.uid);
      setNotice(`${pendingArchive.description} archived.`);
      setPendingArchive(null);
      setTick((n) => n + 1);
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : "Could not archive this income.");
    } finally {
      setArchiving(false);
    }
  };

  const bookingLabel = (booking: Booking) =>
    `${booking.bookingNumber || "Booking"}${booking.leadGuestName ? ` · ${booking.leadGuestName}` : ""}`;

  const lockedBooking =
    currentBooking || bookings.find((booking) => booking.uid === routeBookingUid);

  return (
    <div className="exp-page">
      {routeBookingUid && (
        <div className="exp-head">
          <button type="button" className="exp-ghost" onClick={() => navigate(adminReservationPath(routeBookingUid))}>
            ← Reservation
          </button>
        </div>
      )}

      {!propertyUid && <p className="exp-empty">This account is not assigned to a property.</p>}

      {propertyUid && (
        <header className="exp-hero">
          <div>
            <p className="exp-kicker">Finance</p>
            <h1>{routeBookingUid ? lockedBooking?.bookingNumber || "Other income" : "Income"}</h1>
            <p>
              {routeBookingUid
                ? `${lockedBooking?.leadGuestName || "This booking"} · other income recorded for this stay.`
                : "Other income recorded against a booking."}
            </p>
          </div>
          <div className="exp-hero-actions">
            <button
              type="button"
              className="exp-ghost"
              onClick={() => navigate(ROUTES.ADMIN_FINANCE_INCOME_CATEGORIES)}
              disabled={loading || !!error}
            >
              Income Category
            </button>
            <button type="button" className="exp-add" onClick={openCreate} disabled={loading || !!error}>
              Add income
            </button>
          </div>
        </header>
      )}

      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {propertyUid && !loading && !error && (
        <>
          <div className="exp-summary">
            <article className="exp-card">
              <span>Records</span>
              <strong>{forBooking.length}</strong>
            </article>
            <article className="exp-card exp-card-sand">
              <span>This month</span>
              <strong>{money(totals.monthAmount, totals.currency)}</strong>
            </article>
            <article className="exp-card">
              <span>Total</span>
              <strong>{money(totals.total, totals.currency)}</strong>
            </article>
          </div>

          {notice && <p className="exp-notice">{notice}</p>}

          <input
            className="exp-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by description, category, or reference"
          />

          {visible.length === 0 ? (
            <p className="exp-empty">
              {forBooking.length === 0
                ? routeBookingUid
                  ? "No other income for this booking yet."
                  : "No other income yet."
                : "No income matches that search."}
            </p>
          ) : (
            <div className="exp-table-wrap">
              <table className="exp-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((income) => (
                    <tr key={income.uid}>
                      <td>{income.incomeDate ? formatDate(income.incomeDate) : "—"}</td>
                      <td>
                        {income.description || "—"}
                        {income.bookingNumber && <span className="inc-sub">{income.bookingNumber}</span>}
                      </td>
                      <td>{categoryName(income)}</td>
                      <td>{paymentMethodLabel(income.paymentMethod)}</td>
                      <td>{income.referenceNumber || "—"}</td>
                      <td>{money(income.amount, income.currency)}</td>
                      <td className="inc-row-actions">
                        <button type="button" className="exp-text" onClick={() => openEdit(income.uid)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="exp-text"
                          onClick={() => {
                            setArchiveError("");
                            setPendingArchive(income);
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
                <h2 id={editorTitleId}>{editor === "create" ? "New income" : "Edit income"}</h2>
                <button
                  type="button"
                  className="exp-close"
                  aria-label="Close"
                  onClick={() => !saving && !editorLoading && setEditor(null)}
                >
                  ×
                </button>
              </div>
              {editorLoading && <p className="exp-hint">Loading this income…</p>}
              {!editorLoading && !draft && saveError && <p className="exp-error">{saveError}</p>}
              {!editorLoading && draft && (
                <form className="exp-form" onSubmit={saveIncome}>
                  <label>
                    Category
                    <select name="incomeCategoryUid" value={draft.incomeCategoryUid} onChange={onChange}>
                      <option value="">Choose</option>
                      {categories
                        .filter((category) => category.isActive || category.uid === draft.incomeCategoryUid)
                        .map((category) => (
                          <option key={category.uid} value={category.uid}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Date
                    <input type="date" name="incomeDate" value={draft.incomeDate} onChange={onChange} />
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
                    {routeBookingUid ? (
                      <input value={lockedBooking ? bookingLabel(lockedBooking) : "This booking"} readOnly />
                    ) : (
                      <select name="bookingUid" value={draft.bookingUid} onChange={onChange}>
                        <option value="">Choose</option>
                        {bookings.map((booking) => (
                          <option key={booking.uid} value={booking.uid}>
                            {bookingLabel(booking)}
                          </option>
                        ))}
                        {draft.bookingUid && !bookings.some((booking) => booking.uid === draft.bookingUid) && (
                          <option value={draft.bookingUid}>Current booking</option>
                        )}
                      </select>
                    )}
                  </label>
                  <label>
                    Reference
                    <input name="referenceNumber" value={draft.referenceNumber} onChange={onChange} maxLength={150} />
                  </label>
                  <label className="exp-span">
                    Notes
                    <textarea name="notes" rows={2} value={draft.notes} onChange={onChange} />
                  </label>
                  {categories.length === 0 && (
                    <p className="exp-hint">Add an income category before saving income.</p>
                  )}
                  {saveError && <p className="exp-error">{saveError}</p>}
                  <div className="exp-form-actions">
                    <button type="button" className="exp-ghost" onClick={() => setEditor(null)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className="exp-save" disabled={saving || categories.length === 0}>
                      {saving ? "Saving…" : editor === "create" ? "Add income" : "Save changes"}
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
              <h2 id={archiveTitleId}>Archive {pendingArchive.description}?</h2>
              <p>This hides the income record. The amount stays out of new totals.</p>
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
