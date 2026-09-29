import type { Reservation } from "@/types/reservation";
import { calcTotals, formatLKR } from "@/utils/reservationCalc";

interface Props {
  items: Reservation[];
  onDelete: (id: string) => void;
}

export default function ReservationTable({ items, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <p className="rsv-empty">No reservations yet. Add your first one.</p>
    );
  }

  return (
    <div className="rsv-table-wrap">
      <table className="rsv-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Nights</th>
            <th>Guests</th>
            <th>Meal</th>
            <th>Payment</th>
            <th>Room revenue</th>
            <th>Cooking</th>
            <th>Discount</th>
            <th>Booking value</th>
            <th>Avg / person</th>
            <th>Total cost</th>
            <th>Profit</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((r) => {
            const t = calcTotals(r);
            return (
              <tr key={r.id} title={r.notes || undefined}>
                <td>{r.guestName}</td>
                <td>{r.contactNo || "—"}</td>
                <td>{r.checkIn}</td>
                <td>{r.checkOut}</td>
                <td>{t.nights}</td>
                <td>{r.occupancy}</td>
                <td>{r.mealPlan}</td>
                <td>{r.paymentMethod}</td>
                <td>{formatLKR(t.roomRevenue)}</td>
                <td>{formatLKR(r.cookingCharges)}</td>
                <td>{formatLKR(r.discount)}</td>
                <td>{formatLKR(t.bookingValue)}</td>
                <td>{formatLKR(t.avgPerPerson)}</td>
                <td>{formatLKR(t.totalCost)}</td>
                <td className={t.profit < 0 ? "rsv-negative" : "rsv-positive"}>
                  {formatLKR(t.profit)}
                </td>
                <td>
                  <button
                    className="rsv-link-danger"
                    onClick={() => onDelete(r.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
