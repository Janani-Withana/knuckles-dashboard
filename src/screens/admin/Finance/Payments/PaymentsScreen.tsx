import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageError,
  PageLoading,
} from "../../../../components/common/PageState";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { adminBookingPaymentsPath } from "../../../../routes/paths";
import { listBookings } from "../../../../services/admin/bookingService.service";
import { bookingStatusLabel, type Booking } from "../../../../types/booking";
import { formatDate } from "../../Reservations/bookingDates";
import "./payments.css";

export default function PaymentsScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    listBookings(propertyUid)
      .then((list) => {
        if (active) setBookings(list);
      })
      .catch((err: unknown) => {
        if (active)
          setError(
            err instanceof ApiError ? err.message : "Could not load bookings.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...bookings]
      .sort((a, b) => (b.checkInDate || "").localeCompare(a.checkInDate || ""))
      .filter((b) =>
        `${b.bookingNumber} ${b.leadGuestName}`.toLowerCase().includes(q),
      );
  }, [bookings, query]);

  return (
    <div className="pay-page">
      {!propertyUid && (
        <p className="pay-empty">This account is not assigned to a property.</p>
      )}

      {propertyUid && (
        <header className="pay-hero">
          <div>
            <p className="pay-kicker">Finance</p>
            <h1>Payments</h1>
            <p>Charges, payments and refunds for each booking.</p>
          </div>
        </header>
      )}

      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && (
        <PageError message={error} onRetry={() => setTick((n) => n + 1)} />
      )}

      {propertyUid && !loading && !error && (
        <>
          <input
            className="pay-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by booking number or guest"
          />

          {visible.length === 0 ? (
            <p className="pay-empty">
              {bookings.length === 0
                ? "No bookings yet."
                : "No bookings match that search."}
            </p>
          ) : (
            <div className="pay-table-wrap">
              <table className="pay-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Guest</th>
                    <th>Check-in</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((b) => (
                    <tr key={b.uid}>
                      <td>{b.bookingNumber || "—"}</td>
                      <td>{b.leadGuestName || "—"}</td>
                      <td>{b.checkInDate ? formatDate(b.checkInDate) : "—"}</td>
                      <td>{bookingStatusLabel(b.status)}</td>
                      <td>
                        <button
                          type="button"
                          className="pay-text"
                          onClick={() =>
                            navigate(adminBookingPaymentsPath(b.uid))
                          }
                        >
                          Manage
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
    </div>
  );
}
