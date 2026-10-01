import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "../../../../components/common/PageState";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { adminExpensePath } from "../../../../routes/paths";
import { listBookings } from "../../../../services/admin/bookingService.service";
import {
  createExpense,
  createExpenseCategory,
  listExpenseCategories,
  listExpenses,
} from "../../../../services/admin/expenseService.service";
import type { Booking } from "../../../../types/booking";
import {
  EXPENSE_GROUP_LABELS,
  PAYMENT_METHOD_LABELS,
  expenseGroupLabel,
  paymentMethodLabel,
  type Expense,
  type ExpenseCategory,
} from "../../../../types/expense";
import { formatDate, isoDate } from "../../Reservations/bookingDates";
import "./expenses.css"

type ExpenseDraft = {
  expenseCategoryUid: string;
  expenseDate: string;
  description: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  bookingUid: string;
  referenceNumber: string;
  notes: string;
};

type CategoryDraft = {
  code: string;
  name: string;
  expenseGroup: string;
  parentUid: string;
};

const emptyExpense = (categoryUid = ""): ExpenseDraft => ({
  expenseCategoryUid: categoryUid,
  expenseDate: isoDate(new Date()),
  description: "",
  amount: "",
  currency: "LKR",
  paymentMethod: "0",
  bookingUid: "",
  referenceNumber: "",
  notes: "",
});

const emptyCategory = (): CategoryDraft => ({
  code: "",
  name: "",
  expenseGroup: "6",
  parentUid: "",
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

export default function ExpensesScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();
  const location = useLocation();
  const expenseTitleId = useId();
  const categoryTitleId = useId();
  const routedNotice =
    location.state && typeof location.state === "object" && "notice" in location.state
      ? String((location.state as { notice?: string }).notice || "")
      : "";

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(routedNotice);
  const [tick, setTick] = useState(0);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft>(emptyExpense());
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyCategory());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      listExpenses(propertyUid),
      listExpenseCategories(propertyUid),
      listBookings(propertyUid).catch(() => [] as Booking[]),
    ])
      .then(([nextExpenses, nextCategories, nextBookings]) => {
        if (!active) return;
        setExpenses(nextExpenses);
        setCategories(nextCategories);
        setBookings(nextBookings);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load expenses.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  useEffect(() => {
    if (!expenseOpen && !categoryOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        setExpenseOpen(false);
        setCategoryOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expenseOpen, categoryOpen, saving]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...expenses]
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
      .filter((expense) =>
        `${expense.description} ${expense.expenseCategoryName} ${expense.referenceNumber} ${paymentMethodLabel(expense.paymentMethod)}`
          .toLowerCase()
          .includes(q),
      );
  }, [expenses, query]);

  const totals = useMemo(() => {
    const month = isoDate(new Date()).slice(0, 7);
    const currency = expenses.find((expense) => expense.currency)?.currency || "LKR";
    let monthAmount = 0;
    let total = 0;
    for (const expense of expenses) {
      if (expense.currency !== currency) continue;
      total += expense.amount;
      if (expense.expenseDate.startsWith(month)) monthAmount += expense.amount;
    }
    return { currency, monthAmount, total, categories: categories.filter((category) => category.isActive).length };
  }, [expenses, categories]);

  const onExpenseChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setExpenseDraft((current) => ({ ...current, [name]: name === "currency" ? value.toUpperCase() : value }));
  };

  const onCategoryChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setCategoryDraft((current) => ({ ...current, [name]: name === "code" ? value.toUpperCase() : value }));
  };

  const openExpense = () => {
    setNotice("");
    setSaveError("");
    setCategoryOpen(false);
    setExpenseDraft(emptyExpense(categories.find((category) => category.isActive)?.uid || ""));
    setExpenseOpen(true);
  };

  const openCategory = () => {
    setNotice("");
    setSaveError("");
    setExpenseOpen(false);
    setCategoryDraft(emptyCategory());
    setCategoryOpen(true);
  };

  const saveExpense = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid) return;
    const amount = Number(expenseDraft.amount);
    if (!expenseDraft.expenseCategoryUid) return setSaveError("Choose a category.");
    if (!expenseDraft.description.trim()) return setSaveError("Description is required.");
    if (!Number.isFinite(amount) || amount <= 0) return setSaveError("Amount must be greater than zero.");
    if (expenseDraft.currency.trim().length !== 3) return setSaveError("Currency must be a 3-letter code.");
    if (!expenseDraft.expenseDate) return setSaveError("Choose the expense date.");

    setSaving(true);
    setSaveError("");
    try {
      await createExpense(propertyUid, {
        expenseCategoryUid: expenseDraft.expenseCategoryUid,
        expenseDate: expenseDraft.expenseDate,
        description: expenseDraft.description.trim(),
        amount,
        currency: expenseDraft.currency.trim().toUpperCase(),
        paymentMethod: expenseDraft.paymentMethod === "" ? null : Number(expenseDraft.paymentMethod),
        supplierUid: null,
        bookingUid: expenseDraft.bookingUid || null,
        referenceNumber: expenseDraft.referenceNumber.trim() || null,
        receiptUrl: null,
        notes: expenseDraft.notes.trim() || null,
      });
      setNotice(`${expenseDraft.description.trim()} added.`);
      setExpenseOpen(false);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not add this expense.");
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid) return;
    if (!categoryDraft.code.trim()) return setSaveError("Code is required.");
    if (!categoryDraft.name.trim()) return setSaveError("Name is required.");

    setSaving(true);
    setSaveError("");
    try {
      await createExpenseCategory(propertyUid, {
        code: categoryDraft.code.trim(),
        name: categoryDraft.name.trim(),
        expenseGroup: Number(categoryDraft.expenseGroup),
        parentUid: categoryDraft.parentUid || null,
      });
      setNotice(`${categoryDraft.name.trim()} added.`);
      setCategoryOpen(false);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not add this category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="exp-page">
      {!propertyUid && <p className="exp-empty">This account is not assigned to a property.</p>}

      {propertyUid && (
        <header className="exp-hero">
          <div>
            <p className="exp-kicker">Finance</p>
            <h1>Expenses</h1>
            <p>Money spent for this property, grouped by category.</p>
          </div>
          <div className="exp-hero-actions">
            <button type="button" className="exp-ghost" onClick={openCategory} disabled={loading || !!error}>
              Add category
            </button>
            <button type="button" className="exp-add" onClick={openExpense} disabled={loading || !!error}>
              Add expense
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
              <span>Expenses</span>
              <strong>{expenses.length}</strong>
            </article>
            <article className="exp-card exp-card-sand">
              <span>This month</span>
              <strong>{money(totals.monthAmount, totals.currency)}</strong>
            </article>
            <article className="exp-card exp-card-sage">
              <span>Categories</span>
              <strong>{totals.categories}</strong>
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
              {expenses.length === 0 ? "No expenses yet. Add a category, then the first expense." : "No expenses match that search."}
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
                  {visible.map((expense) => (
                    <tr key={expense.uid}>
                      <td>{formatDate(expense.expenseDate)}</td>
                      <td>{expense.description}</td>
                      <td>{expense.expenseCategoryName || "—"}</td>
                      <td>{paymentMethodLabel(expense.paymentMethod)}</td>
                      <td>{expense.referenceNumber || "—"}</td>
                      <td>{money(expense.amount, expense.currency)}</td>
                      <td>
                        <button type="button" className="exp-text" onClick={() => navigate(adminExpensePath(expense.uid))}>
                          View
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

      {expenseOpen &&
        createPortal(
          <div className="exp-backdrop" onClick={() => !saving && setExpenseOpen(false)}>
            <div
              className="exp-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={expenseTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="exp-dialog-head">
                <h2 id={expenseTitleId}>New expense</h2>
                <button type="button" className="exp-close" aria-label="Close" onClick={() => !saving && setExpenseOpen(false)}>
                  ×
                </button>
              </div>
              <form className="exp-form" onSubmit={saveExpense}>
                <label>
                  Category
                  <select name="expenseCategoryUid" value={expenseDraft.expenseCategoryUid} onChange={onExpenseChange} required>
                    <option value="">Choose</option>
                    {categories
                      .filter((category) => category.isActive)
                      .map((category) => (
                        <option key={category.uid} value={category.uid}>
                          {category.name} · {expenseGroupLabel(category.expenseGroup)}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Date
                  <input type="date" name="expenseDate" value={expenseDraft.expenseDate} onChange={onExpenseChange} required />
                </label>
                <label className="exp-span">
                  Description
                  <input name="description" value={expenseDraft.description} onChange={onExpenseChange} maxLength={300} />
                </label>
                <label>
                  Amount
                  <input name="amount" inputMode="decimal" value={expenseDraft.amount} onChange={onExpenseChange} />
                </label>
                <label>
                  Currency
                  <input name="currency" value={expenseDraft.currency} onChange={onExpenseChange} maxLength={3} />
                </label>
                <label>
                  Payment method
                  <select name="paymentMethod" value={expenseDraft.paymentMethod} onChange={onExpenseChange}>
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
                  <select name="bookingUid" value={expenseDraft.bookingUid} onChange={onExpenseChange}>
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
                  <input name="referenceNumber" value={expenseDraft.referenceNumber} onChange={onExpenseChange} maxLength={150} />
                </label>
                <label className="exp-span">
                  Notes
                  <textarea name="notes" rows={2} value={expenseDraft.notes} onChange={onExpenseChange} />
                </label>
                {categories.length === 0 && <p className="exp-hint">Add a category before saving an expense.</p>}
                {saveError && <p className="exp-error">{saveError}</p>}
                <div className="exp-form-actions">
                  <button type="button" className="exp-ghost" onClick={() => setExpenseOpen(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="exp-save" disabled={saving || categories.length === 0}>
                    {saving ? "Saving…" : "Add expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {categoryOpen &&
        createPortal(
          <div className="exp-backdrop" onClick={() => !saving && setCategoryOpen(false)}>
            <div
              className="exp-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={categoryTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="exp-dialog-head">
                <h2 id={categoryTitleId}>New category</h2>
                <button type="button" className="exp-close" aria-label="Close" onClick={() => !saving && setCategoryOpen(false)}>
                  ×
                </button>
              </div>
              <form className="exp-form" onSubmit={saveCategory}>
                <label>
                  Code
                  <input name="code" value={categoryDraft.code} onChange={onCategoryChange} maxLength={30} />
                </label>
                <label>
                  Name
                  <input name="name" value={categoryDraft.name} onChange={onCategoryChange} maxLength={100} />
                </label>
                <label>
                  Group
                  <select name="expenseGroup" value={categoryDraft.expenseGroup} onChange={onCategoryChange}>
                    {Object.entries(EXPENSE_GROUP_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Parent
                  <select name="parentUid" value={categoryDraft.parentUid} onChange={onCategoryChange}>
                    <option value="">None</option>
                    {categories.map((category) => (
                      <option key={category.uid} value={category.uid}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                {saveError && <p className="exp-error">{saveError}</p>}
                <div className="exp-form-actions">
                  <button type="button" className="exp-ghost" onClick={() => setCategoryOpen(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="exp-save" disabled={saving}>
                    {saving ? "Saving…" : "Add category"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
