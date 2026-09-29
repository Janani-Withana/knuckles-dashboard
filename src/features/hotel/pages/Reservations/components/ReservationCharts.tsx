import {
  MEAL_PLANS,
  PAYMENT_METHODS,
  type Reservation,
} from "../../../../types/reservation";
import { calcTotals, formatLKR } from "../../../../utils/reservationCalc";
import DonutChart from "./DonutChart";

export default function ReservationCharts({ items }: { items: Reservation[] }) {
  const sum = (fn: (r: Reservation) => number) =>
    items.reduce((s, r) => s + fn(r), 0);

  const revenueMix = [
    { label: "Room revenue", value: sum((r) => calcTotals(r).roomRevenue) },
    { label: "Cooking charges", value: sum((r) => r.cookingCharges) },
  ];

  const costBreakdown = [
    { label: "Food", value: sum((r) => r.foodCost) },
    { label: "Staff", value: sum((r) => r.staffCost) },
    { label: "Utilities", value: sum((r) => r.utilitiesCost) },
  ];

  const payments = PAYMENT_METHODS.map((m) => ({
    label: m,
    value: sum((r) => (r.paymentMethod === m ? calcTotals(r).bookingValue : 0)),
  }));

  const meals = MEAL_PLANS.map((m) => ({
    label: m,
    value: items.filter((r) => r.mealPlan === m).length,
  }));

  return (
    <div className="rsv-charts">
      <DonutChart
        title="Revenue mix"
        data={revenueMix}
        format={formatLKR}
        centerLabel="LKR gross"
      />
      <DonutChart
        title="Cost breakdown"
        data={costBreakdown}
        format={formatLKR}
        centerLabel="LKR cost"
        emptyText="Add food, staff or utility costs to a reservation to see this chart."
      />
      <DonutChart
        title="Payment methods"
        data={payments}
        format={formatLKR}
        centerLabel="LKR paid"
      />
      <DonutChart title="Meal types" data={meals} centerLabel="bookings" />
    </div>
  );
}
