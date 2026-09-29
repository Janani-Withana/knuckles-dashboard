import type { Reservation } from "../../../../types/reservation";
import { useCountUp } from "../../../../hooks/useCountUp";
import { calcTotals, formatLKR } from "../../../../utils/reservationCalc";

interface StatProps {
  label: string;
  value: number;
  money?: boolean;
  tone: "teal" | "sand" | "sage" | "clay";
}

function StatCard({ label, value, money = true, tone }: StatProps) {
  const animated = useCountUp(value);
  const shown = Math.round(animated);

  return (
    <div className={`rsv-card rsv-card-${tone}`}>
      <span>{label}</span>
      <strong>{money ? formatLKR(shown) : shown}</strong>
    </div>
  );
}

export default function ReservationSummary({
  items,
}: {
  items: Reservation[];
}) {
  const sum = items.reduce(
    (acc, r) => {
      const t = calcTotals(r);
      acc.revenue += t.bookingValue;
      acc.cost += t.totalCost;
      acc.profit += t.profit;
      return acc;
    },
    { revenue: 0, cost: 0, profit: 0 },
  );

  return (
    <div className="rsv-summary">
      <StatCard
        label="Reservations"
        value={items.length}
        money={false}
        tone="sage"
      />
      <StatCard label="Total revenue" value={sum.revenue} tone="teal" />
      <StatCard label="Total cost" value={sum.cost} tone="sand" />
      <StatCard
        label="Profit"
        value={sum.profit}
        tone={sum.profit < 0 ? "clay" : "teal"}
      />
    </div>
  );
}
