import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "../../../../components/common/PageState";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { ROUTES, adminUtilityBillPath } from "../../../../routes/paths";
import {
  createUtilityBill,
  listUtilityBills,
  listUtilityTypes,
} from "../../../../services/admin/utilitiesService.service";
import {
  UTILITY_BILL_STATUS_LABELS,
  utilityBillStatus,
  type UtilityBill,
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
  referenceNumber: string;
};

const monthStart = () => {
  const today = new Date();
  return isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
};

const emptyDraft = (typeUid = ""): Draft => ({
  utilityTypeUid: typeUid,
  periodStart: monthStart(),
  periodEnd: isoDate(new Date()),
  previousReading: "",
  currentReading: "",
  amount: "",
  currency: "LKR",
  dueDate: "",
  referenceNumber: "",
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

const monthKey = (bill: UtilityBill) => (bill.periodEnd || bill.periodStart).slice(0, 7);

const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const shiftKey = (key: string, delta: number) => {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const shortMonth = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short" });
};

type Bucket = { total: number; paid: number; unpaid: number; count: number; types: Map<string, number> };

export default function UtilitiesScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();
  const location = useLocation();
  const routedNotice =
    location.state && typeof location.state === "object" && "notice" in location.state
      ? String((location.state as { notice?: string }).notice || "")
      : "";
  const titleId = useId();
  const today = isoDate(new Date());

  const [bills, setBills] = useState<UtilityBill[]>([]);
  const [types, setTypes] = useState<UtilityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(routedNotice);
  const [tick, setTick] = useState(0);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [allMonths, setAllMonths] = useState(false);

  const [editor, setEditor] = useState<"create" | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
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
    Promise.all([listUtilityBills(propertyUid), listUtilityTypes(propertyUid)])
      .then(([nextBills, nextTypes]) => {
        if (!active) return;
        setBills(nextBills);
        setTypes(nextTypes);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load utility bills.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  useEffect(() => {
    if (!editor) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || saving) return;
      setEditor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, saving]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...bills]
      .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))
      .filter((bill) => allMonths || monthKey(bill) === month)
      .filter((bill) =>
        `${bill.utilityTypeName} ${bill.referenceNumber} ${UTILITY_BILL_STATUS_LABELS[utilityBillStatus(bill, today)]}`
          .toLowerCase()
          .includes(q),
      );
  }, [bills, query, today, month, allMonths]);

  const totals = useMemo(() => {
    const currency = bills.find((bill) => bill.currency)?.currency || "LKR";
    let unpaid = 0;
    let overdue = 0;
    let total = 0;
    for (const bill of bills) {
      const status = utilityBillStatus(bill, today);
      if (status === "overdue") overdue += 1;
      if (bill.currency !== currency) continue;
      total += bill.amount;
      if (status !== "paid") unpaid += bill.amount;
    }
    return { currency, unpaid, overdue, total };
  }, [bills, today]);

  const byMonth = useMemo(() => {
    const map = new Map<string, Map<string, Bucket>>();
    for (const bill of bills) {
      const key = monthKey(bill);
      if (!key) continue;
      const currency = bill.currency || "LKR";
      const currencies = map.get(key) ?? new Map<string, Bucket>();
      const bucket =
        currencies.get(currency) ?? { total: 0, paid: 0, unpaid: 0, count: 0, types: new Map<string, number>() };
      const name = bill.utilityTypeName || "Utility";
      bucket.total += bill.amount;
      bucket.count += 1;
      if (utilityBillStatus(bill, today) === "paid") bucket.paid += bill.amount;
      else bucket.unpaid += bill.amount;
      bucket.types.set(name, (bucket.types.get(name) ?? 0) + bill.amount);
      currencies.set(currency, bucket);
      map.set(key, currencies);
    }
    return map;
  }, [bills, today]);

  const selected = useMemo(
    () =>
      [...(byMonth.get(month)?.entries() ?? [])].map(([currency, bucket]) => {
        const previous = byMonth.get(shiftKey(month, -1))?.get(currency)?.total ?? 0;
        return {
          currency,
          ...bucket,
          change: previous > 0 ? ((bucket.total - previous) / previous) * 100 : null,
          types: [...bucket.types.entries()]
            .map(([name, amount]) => ({ name, amount }))
            .sort((x, y) => y.amount - x.amount),
        };
      }),
    [byMonth, month],
  );

  const trend = useMemo(() => {
    const points = Array.from({ length: 12 }, (_, index) => {
      const key = shiftKey(month, index - 11);
      return { key, total: byMonth.get(key)?.get(totals.currency)?.total ?? 0 };
    });
    return { points, max: Math.max(...points.map((point) => point.total), 1) };
  }, [byMonth, month, totals.currency]);

  const pickMonth = (key: string) => {
    setMonth(key);
    setAllMonths(false);
  };

  const openCreate = () => {
    setNotice("");
    setSaveError("");
    setDraft(emptyDraft(types.find((type) => type.isActive)?.uid || ""));
    setEditor("create");
  };

  const openView = (uid: string) => {
    navigate(adminUtilityBillPath(uid));
  };

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setDraft((current) =>
      current ? { ...current, [name]: name === "currency" ? value.toUpperCase() : value } : current,
    );
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid || !draft) return;
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

    const payload = {
      utilityTypeUid: draft.utilityTypeUid,
      periodStart: draft.periodStart,
      periodEnd: draft.periodEnd,
      previousReading: previous,
      currentReading: current,
      amount,
      currency: draft.currency.trim().toUpperCase(),
      dueDate: draft.dueDate || null,
      referenceNumber: draft.referenceNumber.trim() || null,
    };

    setSaving(true);
    setSaveError("");
    try {
      await createUtilityBill(propertyUid, payload);
      setNotice("Bill added.");
      setEditor(null);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save this bill.");
    } finally {
      setSaving(false);
    }
  };

  const unitsPreview = () => {
    if (!draft?.previousReading || !draft.currentReading) return null;
    const previous = Number(draft.previousReading);
    const current = Number(draft.currentReading);
    if (!Number.isFinite(previous) || !Number.isFinite(current) || current < previous) return null;
    return current - previous;
  };

  return (
    <div className="ut-page">
      {!propertyUid && <p className="ut-empty">This account is not assigned to a property.</p>}

      {propertyUid && (
        <header className="ut-hero">
          <div>
            <p className="ut-kicker">Finance</p>
            <h1>Utilities</h1>
            <p>Electricity, water, and other metered bills for this property.</p>
          </div>
          <div className="ut-hero-actions">
            <button type="button" className="ut-ghost ut-ghost-hero" onClick={() => navigate(ROUTES.ADMIN_FINANCE_UTILITY_TYPES)}>
              Utility Types
            </button>
            <button type="button" className="ut-add" onClick={openCreate} disabled={loading || !!error}>
              Add bill
            </button>
          </div>
        </header>
      )}

      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {propertyUid && !loading && !error && (
        <>
          <div className="ut-summary">
            <article className="ut-card">
              <span>Bills</span>
              <strong>{bills.length}</strong>
            </article>
            <article className="ut-card ut-card-sand">
              <span>Unpaid</span>
              <strong>{money(totals.unpaid, totals.currency)}</strong>
            </article>
            <article className="ut-card ut-card-clay">
              <span>Overdue</span>
              <strong>{totals.overdue}</strong>
            </article>
            <article className="ut-card">
              <span>Total</span>
              <strong>{money(totals.total, totals.currency)}</strong>
            </article>
          </div>

          {notice && <p className="ut-notice">{notice}</p>}

          <section className="ut-explorer" aria-label="Monthly cost">
            <div className="ut-explorer-head">
              <div>
                <h2>Monthly cost</h2>
                <p className="ut-sub">Pick any month to see what the property spent on utilities.</p>
              </div>
              <div className="ut-month-controls">
                <button
                  type="button"
                  className="ut-round"
                  aria-label="Previous month"
                  onClick={() => pickMonth(shiftKey(month, -1))}
                >
                  ‹
                </button>
                <input
                  type="month"
                  className="ut-month-input"
                  aria-label="Month"
                  value={month}
                  onChange={(event) => event.target.value && pickMonth(event.target.value)}
                />
                <button
                  type="button"
                  className="ut-round"
                  aria-label="Next month"
                  onClick={() => pickMonth(shiftKey(month, 1))}
                >
                  ›
                </button>
                <button
                  type="button"
                  className="ut-text"
                  disabled={month === today.slice(0, 7)}
                  onClick={() => pickMonth(today.slice(0, 7))}
                >
                  This month
                </button>
              </div>
            </div>

            <div className="ut-trend" role="group" aria-label={`Last 12 months in ${totals.currency}`}>
              {trend.points.map((point) => (
                <button
                  key={point.key}
                  type="button"
                  className={`ut-trend-col ${point.key === month ? "on" : ""}`}
                  aria-pressed={point.key === month}
                  title={`${monthLabel(point.key)}: ${money(point.total, totals.currency)}`}
                  onClick={() => pickMonth(point.key)}
                >
                  <span className="ut-trend-bar">
                    <i style={{ height: `${Math.max((point.total / trend.max) * 100, point.total ? 6 : 2)}%` }} />
                  </span>
                  <em>{shortMonth(point.key)}</em>
                </button>
              ))}
            </div>

            {selected.length === 0 ? (
              <p className="ut-month-empty">No utility bills for {monthLabel(month)}.</p>
            ) : (
              selected.map((bucket) => (
                <div key={bucket.currency} className="ut-month-body">
                  <div className="ut-month-sum">
                    <span>
                      {monthLabel(month)} · {bucket.count} bill{bucket.count === 1 ? "" : "s"}
                    </span>
                    <strong>{money(bucket.total, bucket.currency)}</strong>
                    {bucket.change !== null && (
                      <em className={bucket.change > 0 ? "up" : "down"}>
                        {bucket.change > 0 ? "▲" : bucket.change < 0 ? "▼" : "–"}{" "}
                        {Math.abs(Math.round(bucket.change))}% vs {shortMonth(shiftKey(month, -1))}
                      </em>
                    )}
                    <div className="ut-paid-split">
                      <span>
                        <i className="paid" /> Paid {money(bucket.paid, bucket.currency)}
                      </span>
                      <span>
                        <i className="unpaid" /> Unpaid {money(bucket.unpaid, bucket.currency)}
                      </span>
                    </div>
                  </div>
                  <ul className="ut-breakdown">
                    {bucket.types.map((type, index) => {
                      const share = bucket.total > 0 ? (type.amount / bucket.total) * 100 : 0;
                      return (
                        <li key={type.name}>
                          <div className="ut-breakdown-row">
                            <span>{type.name}</span>
                            <b>{money(type.amount, bucket.currency)}</b>
                          </div>
                          <div className="ut-share">
                            <i className={`tone-${index % 4}`} style={{ width: `${share}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </section>

          <div className="ut-toolbar">
            <input
              className="ut-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by type, reference, or status"
            />
            <div className="ut-scope" role="group" aria-label="Bills to list">
              <button type="button" className={allMonths ? "" : "on"} onClick={() => setAllMonths(false)}>
                {monthLabel(month)}
              </button>
              <button type="button" className={allMonths ? "on" : ""} onClick={() => setAllMonths(true)}>
                All months
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="ut-empty">
              {bills.length === 0
                ? "No utility bills yet."
                : query.trim()
                  ? "No bills match that search."
                  : `No bills for ${monthLabel(month)}.`}
            </p>
          ) : (
            <div className="ut-table-wrap">
              <table className="ut-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Readings</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((bill) => {
                    const status = utilityBillStatus(bill, today);
                    return (
                      <tr key={bill.uid}>
                        <td>
                          {bill.utilityTypeName || "Utility"}
                          {bill.referenceNumber && <span>{bill.referenceNumber}</span>}
                        </td>
                        <td>
                          {formatDate(bill.periodStart)} – {formatDate(bill.periodEnd)}
                        </td>
                        <td>
                          {reading(bill.previousReading)} → {reading(bill.currentReading)}
                          {bill.unitsUsed !== null && <span>{reading(bill.unitsUsed)} used</span>}
                        </td>
                        <td>{bill.dueDate ? formatDate(bill.dueDate) : "—"}</td>
                        <td>
                          <span className={`ut-status ${status}`}>{UTILITY_BILL_STATUS_LABELS[status]}</span>
                        </td>
                        <td>{money(bill.amount, bill.currency)}</td>
                        <td>
                          <button type="button" className="ut-text" onClick={() => openView(bill.uid)}>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {editor &&
        createPortal(
          <div className="ut-backdrop" onClick={() => !saving && setEditor(null)}>
            <div
              className="ut-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="ut-dialog-head">
                <h2 id={titleId}>New bill</h2>
                <button
                  type="button"
                  className="ut-close"
                  aria-label="Close"
                  onClick={() => !saving && setEditor(null)}
                >
                  ×
                </button>
              </div>
              {draft && (
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
                    </select>
                  </label>
                  <label>
                    Reference
                    <input
                      name="referenceNumber"
                      value={draft.referenceNumber}
                      onChange={onChange}
                      maxLength={150}
                    />
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
                  {unitsPreview() !== null && (
                    <p className="ut-hint">Units used: {unitsPreview()?.toLocaleString()}</p>
                  )}
                  {types.length === 0 && (
                    <p className="ut-hint">Add a utility type before saving a bill.</p>
                  )}
                  {saveError && <p className="ut-error">{saveError}</p>}
                  <div className="ut-form-actions">
                    <button type="button" className="ut-ghost" onClick={() => setEditor(null)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className="ut-save" disabled={saving || types.length === 0}>
                      {saving ? "Saving…" : "Add bill"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}

    </div>
  );
}