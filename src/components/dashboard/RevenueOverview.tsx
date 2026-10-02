import {
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import CardHeader from "./CardHeader";

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

export type MonthProgress = {
  label: string;
  income: number;
  expenses: number;
  net: number;
};

type Props = {
  currency: string;
  months: MonthProgress[];
};

export default function RevenueOverview({ currency, months }: Props) {
  const current = months[months.length - 1];
  const previous = months[months.length - 2];
  const amount = current?.net ?? 0;
  const prior = previous?.net ?? 0;
  const change = prior === 0 ? 0 : ((amount - prior) / Math.abs(prior)) * 100;
  const isUp = change >= 0;
  const highs = months.flatMap((month) => [month.income, month.expenses, month.net]);
  const peak = Math.max(...highs, 1);
  const floor = Math.min(0, ...months.map((month) => month.net));

  return (
    <section className="dashboard-card revenue-card">
      <CardHeader icon={BarChart3} title="Revenue" />

      <div className="revenue-number">
        {formatCurrency(amount, currency)}

        <div className={`growth ${isUp ? "" : "down"}`}>
          {isUp ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
          {Math.abs(change).toFixed(0)}%
        </div>

        <small>after expenses, vs. last month</small>
      </div>

      <div className="revenue-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={months} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 3" vertical={false} stroke="#E9ECEB" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#697776" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#697776" }}
              axisLine={false}
              tickLine={false}
              domain={[floor, Math.ceil(peak * 1.1)]}
              tickFormatter={(value: number) => (value === 0 ? "0" : value >= 1000 ? `${Math.round(value / 1000)}K` : String(value))}
            />
            <Tooltip formatter={(value, name) => [formatCurrency(Number(value), currency), name]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="income" name="Income" fill="#4D896B" radius={[4, 4, 0, 0]} barSize={10} />
            <Bar dataKey="expenses" name="Expenses" fill="#C4704F" radius={[4, 4, 0, 0]} barSize={10} />
            <Line dataKey="net" name="After expenses" stroke="#173a36" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
