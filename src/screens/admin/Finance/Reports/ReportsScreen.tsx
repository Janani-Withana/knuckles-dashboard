import { useEffect, useState, type ReactNode } from "react";
import { PageError, PageLoading } from "../../../../components/common/PageState";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import {
  getBookingProfitability,
  getBookingRevenue,
  getExpenseReport,
  getMonthlySummary,
  getOccupancy,
  getOutstandingBalances,
  getPaymentSummary,
  getUtilityReport,
} from "../../../../services/admin/reportsService.service";
import { bookingStatusLabel } from "../../../../types/booking";
import { paymentMethodName, type ReportPeriod } from "../../../../types/reports";
import { formatDate, isoDate } from "../../Reservations/bookingDates";
import "./reports.css";

type TabKey = "overview" | "revenue" | "profitability" | "stays" | "balances";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "revenue", label: "Booking revenue" },
  { key: "profitability", label: "Profitability" },
  { key: "stays", label: "Guest stays" },
  { key: "balances", label: "Outstanding" },
];

const money = (amount: number, currency = "LKR") => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};

const amount = (value: number | null, digits = 2) =>
  value === null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: digits });

const sum = <T,>(list: T[], pick: (row: T) => number) => list.reduce((total, row) => total + pick(row), 0);

const monthText = (period: ReportPeriod) =>
  new Date(period.year, period.month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

/* ---------- loading helper ---------- */

function useReport<T>(load: () => Promise<T>, key: string) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string }>({
    data: null,
    loading: true,
    error: "",
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: "" }));
    load()
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((err: unknown) => {
        if (active)
          setState({
            data: null,
            loading: false,
            error: err instanceof ApiError ? err.message : "Could not load this report.",
          });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  return { ...state, retry: () => setTick((n) => n + 1) };
}

function Async<T>({
  state,
  children,
}: {
  state: { data: T | null; loading: boolean; error: string; retry: () => void };
  children: (data: T) => ReactNode;
}) {
  if (state.loading) return <PageLoading />;
  if (state.error) return <PageError message={state.error} onRetry={state.retry} />;
  if (!state.data) return null;
  return <>{children(state.data)}</>;
}

/* ---------- generic table ---------- */

type Column<T> = { header: string; render: (row: T) => ReactNode; num?: boolean };

function DataTable<T>({
  rows,
  columns,
  empty,
  rowKey,
}: {
  rows: T[];
  columns: Column<T>[];
  empty: string;
  rowKey: (row: T, index: number) => string;
}) {
  if (rows.length === 0) return <p className="fr-empty">{empty}</p>;
  return (
    <div className="fr-table-wrap">
      <table className="fr-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.header} className={col.num ? "fr-num" : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)}>
              {columns.map((col) => (
                <td key={col.header} className={col.num ? "fr-num" : undefined}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Card = ({ label, value, tone = "" }: { label: string; value: string; tone?: string }) => (
  <article className={`fr-card ${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

const profit = (value: number, currency: string) => (
  <span className={value < 0 ? "fr-loss" : undefined}>{money(value, currency)}</span>
);

/* ---------- tabs ---------- */

function OverviewTab({ propertyUid, period }: { propertyUid: string; period: ReportPeriod }) {
  const state = useReport(
    () =>
      Promise.all([
        getMonthlySummary(propertyUid, period),
        getExpenseReport(propertyUid, period),
        getPaymentSummary(propertyUid, period),
        getUtilityReport(propertyUid, period),
      ]),
    `${propertyUid}:${period.year}-${period.month}`,
  );

  return (
    <Async state={state}>
      {([summary, expenses, payments, utilities]) => {
        const c = summary.currency;
        const parts = [
          { name: "Staff", value: expenses.staffCost },
          { name: "Utilities", value: expenses.utilityCost },
          { name: "Other expenses", value: expenses.generalExpenses },
        ];
        const total = expenses.total || sum(parts, (p) => p.value);
        return (
          <>
            <div className="fr-summary">
              <Card label="Booking income" value={money(summary.bookingIncome, c)} />
              <Card label="Total expenses" value={money(summary.totalExpenses, c)} tone="fr-card-sand" />
              <Card
                label="Net profit"
                value={money(summary.netProfit, c)}
                tone={summary.netProfit < 0 ? "fr-card-clay" : "fr-card-sage"}
              />
            </div>

            <section className="fr-panel">
              <h2>Where the money went in {monthText(period)}</h2>
              {total <= 0 ? (
                <p className="fr-note">No expenses recorded for this month.</p>
              ) : (
                <ul className="fr-breakdown">
                  {parts.map((part, index) => (
                    <li key={part.name}>
                      <div>
                        <span>{part.name}</span>
                        <b>{money(part.value, expenses.currency)}</b>
                      </div>
                      <div className="fr-share">
                        <i className={`tone-${index}`} style={{ width: `${(part.value / total) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="fr-two">
              <section>
                <h2>Payments by method</h2>
                <DataTable
                  rows={payments}
                  empty="No completed payments this month."
                  rowKey={(row, i) => `${row.paymentMethod}-${row.currency}-${i}`}
                  columns={[
                    { header: "Method", render: (r) => paymentMethodName(r.paymentMethod) },
                    { header: "Payments", num: true, render: (r) => r.paymentCount },
                    { header: "Total", num: true, render: (r) => money(r.totalAmount, r.currency) },
                  ]}
                />
              </section>
              <section>
                <h2>Utilities</h2>
                <DataTable
                  rows={utilities}
                  empty="No utility bills this month."
                  rowKey={(row, i) => `${row.utilityTypeUid}-${i}`}
                  columns={[
                    { header: "Type", render: (r) => r.utilityTypeName || "Utility" },
                    {
                      header: "Used",
                      num: true,
                      render: (r) =>
                        r.unitsUsed === null ? "—" : `${amount(r.unitsUsed)} ${r.unitOfMeasure}`.trim(),
                    },
                    { header: "Cost", num: true, render: (r) => money(r.totalAmount, r.currency) },
                  ]}
                />
              </section>
            </div>
          </>
        );
      }}
    </Async>
  );
}

function RevenueTab({ propertyUid }: { propertyUid: string }) {
  const state = useReport(() => getBookingRevenue(propertyUid), propertyUid);
  return (
    <Async state={state}>
      {(list) => {
        const c = list[0]?.currency;
        return (
          <>
            <div className="fr-summary">
              <Card label="Total booking value" value={money(sum(list, (r) => r.totalBookingValue), c)} />
              <Card label="Payments received" value={money(sum(list, (r) => r.paymentsReceived), c)} tone="fr-card-sage" />
              <Card label="Outstanding" value={money(sum(list, (r) => r.outstandingBalance), c)} tone="fr-card-sand" />
            </div>
            <DataTable
              rows={list}
              empty="No bookings yet."
              rowKey={(r) => r.bookingUid}
              columns={[
                { header: "Booking", render: (r) => r.bookingNumber || "—" },
                // { header: "Guest", render: (r) => r.leadGuestName || "—" },
                { header: "Check-in", render: (r) => formatDate(r.checkInDate) },
                { header: "Status", render: (r) => bookingStatusLabel(r.status) },
                { header: "Total", num: true, render: (r) => money(r.totalBookingValue, r.currency) },
                { header: "Received", num: true, render: (r) => money(r.paymentsReceived, r.currency) },
                { header: "Refunded", num: true, render: (r) => money(r.refundsPaid, r.currency) },
              ]}
            />
          </>
        );
      }}
    </Async>
  );
}

function ProfitabilityTab({ propertyUid }: { propertyUid: string }) {
  const state = useReport(
    () => getBookingProfitability(propertyUid),
    propertyUid,
  );
  return (
    <Async state={state}>
      {(bookings) => {
        const c = bookings[0]?.currency;
        const total = sum(bookings, (r) => r.estimatedProfit);
        return (
          <>
            <div className="fr-summary">
              <Card label="Booking value" value={money(sum(bookings, (r) => r.totalBookingValue), c)} />
              <Card label="Costs" value={money(sum(bookings, (r) => r.directExpenses + r.allocatedOverhead), c)} tone="fr-card-sand" />
              <Card label="Estimated profit" value={money(total, c)} tone={total < 0 ? "fr-card-clay" : "fr-card-sage"} />
            </div>
            <h2 className="fr-heading">By booking</h2>
            <DataTable
              rows={bookings}
              empty="No bookings to report on."
              rowKey={(r) => r.bookingUid}
              columns={[
                { header: "Booking", render: (r) => r.bookingNumber || "—" },
                // { header: "Guest", render: (r) => r.leadGuestName || "—" },
                { header: "Stay", render: (r) => `${formatDate(r.checkInDate)} – ${formatDate(r.checkOutDate)}` },
                { header: "Value", num: true, render: (r) => money(r.totalBookingValue, r.currency) },
                { header: "Direct costs", num: true, render: (r) => money(r.directExpenses, r.currency) },
                { header: "Overhead", num: true, render: (r) => money(r.allocatedOverhead, r.currency) },
                { header: "Profit", num: true, render: (r) => profit(r.estimatedProfit, r.currency) },
                { header: "Per guest night", num: true, render: (r) => (r.profitPerGuestNight === null ? "—" : money(r.profitPerGuestNight, r.currency)) },
              ]}
            />
            {/* <h2 className="fr-heading">By lead guest</h2>
            <DataTable
              rows={guests}
              empty="No guest data yet."
              rowKey={(r, i) => r.guestUid || String(i)}
              columns={[
                { header: "Guest", render: (r) => r.guestName || "—" },
                { header: "Bookings", num: true, render: (r) => r.bookingCount },
                { header: "Value", num: true, render: (r) => money(r.totalBookingValue, r.currency) },
                { header: "Profit", num: true, render: (r) => profit(r.estimatedProfit, r.currency) },
              ]}
            /> */}
          </>
        );
      }}
    </Async>
  );
}

function StaysTab({ propertyUid }: { propertyUid: string }) {
  const state = useReport(() => getOccupancy(propertyUid), propertyUid);
  return (
    <Async state={state}>
      {(list) => (
        <DataTable
          rows={list}
          empty="No guest stays yet."
          rowKey={(r, i) => `${r.bookingUid}-${r.guestUid}-${i}`}
          columns={[
            { header: "Guest", render: (r) => `${r.guestName || "—"}${r.isLeadGuest ? " (lead)" : ""}` },
            { header: "Booking", render: (r) => r.bookingNumber || "—" },
            { header: "Check-in", render: (r) => formatDate(r.checkInDate) },
            { header: "Check-out", render: (r) => formatDate(r.checkOutDate) },
            { header: "Nights", num: true, render: (r) => r.nights },
            { header: "Status", render: (r) => bookingStatusLabel(r.status) },
          ]}
        />
      )}
    </Async>
  );
}

function BalancesTab({ propertyUid }: { propertyUid: string }) {
  const state = useReport(() => getOutstandingBalances(propertyUid), propertyUid);
  return (
    <Async state={state}>
      {(list) => (
        <>
          <div className="fr-summary">
            <Card label="Bookings with a balance" value={String(list.length)} />
            <Card label="Total outstanding" value={money(sum(list, (r) => r.outstandingBalance), list[0]?.currency)} tone="fr-card-clay" />
          </div>
          <DataTable
            rows={list}
            empty="Nothing outstanding. Every booking is settled."
            rowKey={(r) => r.bookingUid}
            columns={[
              { header: "Booking", render: (r) => r.bookingNumber || "—" },
              // { header: "Guest", render: (r) => r.leadGuestName || "—" },
              { header: "Check-in", render: (r) => formatDate(r.checkInDate) },
              { header: "Status", render: (r) => bookingStatusLabel(r.status) },
              { header: "Total", num: true, render: (r) => money(r.totalBookingValue, r.currency) },
              { header: "Received", num: true, render: (r) => money(r.paymentsReceived, r.currency) },
              { header: "Balance", num: true, render: (r) => <b>{money(r.outstandingBalance, r.currency)}</b> },
            ]}
          />
        </>
      )}
    </Async>
  );
}

/* ---------- screen ---------- */

export default function ReportsScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const [tab, setTab] = useState<TabKey>("overview");
  const [monthValue, setMonthValue] = useState(isoDate(new Date()).slice(0, 7));

  const [year, month] = monthValue.split("-").map(Number);
  const period: ReportPeriod = { year, month };

  const shift = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1);
    setMonthValue(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="fr-page">
      {!propertyUid && <p className="fr-empty">This account is not assigned to a property.</p>}

      {propertyUid && (
        <>
          <header className="fr-hero">
            <div>
              <p className="fr-kicker">Finance</p>
              <h1>Reports</h1>
              <p>Income, costs, profit and balances for this property.</p>
            </div>
            {tab === "overview" && (
              <div className="fr-month">
                <button type="button" className="fr-round" aria-label="Previous month" onClick={() => shift(-1)}>
                  ‹
                </button>
                <input
                  type="month"
                  aria-label="Month"
                  value={monthValue}
                  onChange={(event) => event.target.value && setMonthValue(event.target.value)}
                />
                <button type="button" className="fr-round" aria-label="Next month" onClick={() => shift(1)}>
                  ›
                </button>
              </div>
            )}
          </header>

          <div className="fr-tabs" role="tablist" aria-label="Reports">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                className={tab === item.key ? "on" : ""}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "overview" && <OverviewTab propertyUid={propertyUid} period={period} />}
          {tab === "revenue" && <RevenueTab propertyUid={propertyUid} />}
          {tab === "profitability" && <ProfitabilityTab propertyUid={propertyUid} />}
          {tab === "stays" && <StaysTab propertyUid={propertyUid} />}
          {tab === "balances" && <BalancesTab propertyUid={propertyUid} />}
        </>
      )}
    </div>
  );
}