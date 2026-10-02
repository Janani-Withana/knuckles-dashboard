import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

import CardHeader from "./CardHeader";
import StatusBadge from "./StatusBadge";
import { adminReservationPath } from "../../routes/paths";

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

export type RecentBookingRow = {
  uid: string;
  name: string;
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  status: string;
  outstanding: number;
  currency: string;
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "G").slice(0, 2).toUpperCase();
};

export default function RecentBookings({ rows }: { rows: RecentBookingRow[] }) {
  return (
    <section className="dashboard-card recent-bookings">
      <CardHeader icon={CalendarDays} title="Recent Bookings" action="View all" />

      {rows.length === 0 ? (
        <p className="dash-note">No bookings yet.</p>
      ) : (
        <div className="booking-table">
          <div className="table-header">
            <span>Guest</span>
            <span>Booking</span>
            <span>Check in</span>
            <span>Check out</span>
            <span>Balance</span>
          </div>

          {rows.map((booking) => (
            <Link className="table-row" key={booking.uid || booking.bookingNumber} to={adminReservationPath(booking.uid)}>
              <div className="guest-cell">
                <span className="guest-mark" aria-hidden="true">{initials(booking.name)}</span>
                <span>{booking.name}</span>
              </div>
              <span>{booking.bookingNumber}</span>
              <span>{booking.checkIn}</span>
              <span>{booking.checkOut}</span>
              <span>
                {money(booking.outstanding, booking.currency)}
                <StatusBadge status={booking.status} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
