import React, { useEffect, useState } from "react";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  CalendarCheck,
  PiggyBank,
} from "lucide-react";

import CardHeader from "./CardHeader";

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "LKR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
};

type Props = {
  currency: string;
  bookingIncome: number;
  paymentsReceived: number;
  totalExpenses: number;
  bookingCount: number;
  netProfit: number;
  lastMonthIncome: number;
  thisMonthIncome: number;
};

export default function FinanceOverview({
  currency,
  bookingIncome,
  paymentsReceived,
  totalExpenses,
  bookingCount,
  netProfit,
  lastMonthIncome,
  thisMonthIncome,
}: Props): React.ReactElement {
  const revenueCount = useCountUp(bookingIncome);
  const incomeCount = useCountUp(paymentsReceived);
  const expensesCount = useCountUp(totalExpenses);
  const profitCount = useCountUp(netProfit);
  const bookingsCount = useCountUp(bookingCount);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const change = lastMonthIncome === 0 ? 0 : ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
  const isUp = change >= 0;
  const scale = Math.max(lastMonthIncome, thisMonthIncome, 1) * 1.15;
  const lastWidth = (lastMonthIncome / scale) * 100;
  const thisWidth = (thisMonthIncome / scale) * 100;

  return (
    <section className="dashboard-card finance-overview">
      <CardHeader icon={Wallet} title="Finance Overview" />

      <div className="finance-metrics">
        <div className="finance-metric" style={{ animationDelay: "0.05s" }}>
          <span className="finance-metric-icon green">
            <TrendingUp size={20} />
          </span>
          <div>
            <span className="finance-metric-label">Booking income</span>
            <strong className="finance-metric-value">
              {formatCurrency(revenueCount, currency)}
            </strong>
          </div>
        </div>

        <div className="finance-metric" style={{ animationDelay: "0.12s" }}>
          <span className="finance-metric-icon blue">
            <PiggyBank size={20} />
          </span>
          <div>
            <span className="finance-metric-label">Payments received</span>
            <strong className="finance-metric-value">
              {formatCurrency(incomeCount, currency)}
            </strong>
          </div>
        </div>

        <div className="finance-metric" style={{ animationDelay: "0.19s" }}>
          <span className="finance-metric-icon yellow">
            <Receipt size={20} />
          </span>
          <div>
            <span className="finance-metric-label">Total Expenses</span>
            <strong className="finance-metric-value">
              {formatCurrency(expensesCount, currency)}
            </strong>
          </div>
        </div>

        <div className="finance-metric" style={{ animationDelay: "0.26s" }}>
          <span className="finance-metric-icon purple">
            <CalendarCheck size={20} />
          </span>
          <div>
            <span className="finance-metric-label">Total Bookings</span>
            <strong className="finance-metric-value">{bookingsCount}</strong>
          </div>
        </div>
      </div>

      <div className="finance-bottom">
        <div className="finance-progress">
          <div className="finance-progress-header">
            <span>Monthly Progress</span>
            <span className={`finance-trend ${isUp ? "up" : "down"}`}>
              {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>

          <div className="finance-bar-row">
            <span className="finance-bar-label">Last Month</span>
            <div className="finance-bar-track">
              <span
                className="finance-bar-fill last"
                style={{ width: ready ? `${lastWidth}%` : "0%" }}
              />
            </div>
            <span className="finance-bar-value">
              {formatCurrency(lastMonthIncome, currency)}
            </span>
          </div>

          <div className="finance-bar-row">
            <span className="finance-bar-label">This Month</span>
            <div className="finance-bar-track">
              <span
                className="finance-bar-fill current"
                style={{ width: ready ? `${thisWidth}%` : "0%" }}
              />
            </div>
            <span className="finance-bar-value">
              {formatCurrency(thisMonthIncome, currency)}
            </span>
          </div>
        </div>

        <div className="finance-profit">
          <span className="finance-profit-label">Profit</span>
          <strong className="finance-profit-value">
            {formatCurrency(profitCount, currency)}
          </strong>
          <span className="finance-profit-note">Booking income minus expenses</span>
        </div>
      </div>
    </section>
  );
}
