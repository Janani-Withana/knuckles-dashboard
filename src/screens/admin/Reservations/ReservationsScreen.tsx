import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { adminReservationPath, ROUTES } from "../../../routes/paths";
import { listAccommodationTypes } from "../../../services/admin/accommodationService.service";
import { getBookingCalendar, listBookings } from "../../../services/admin/bookingService.service";
import type { AccommodationType } from "../../../types/accommodation";
import {
  bookingSourceLabel,
  bookingStatusLabel,
  type Booking,
  type BookingCalendar,
} from "../../../types/booking";
import { coversDay, formatDate, monthBounds } from "./bookingDates";
import "./reservations.css";

const money = (amount: number | null, currency: string) => {
  if (amount === null) return "—";
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

const party = (booking: Booking) => {
  if (!booking.adults && !booking.children && !booking.infants && booking.summary?.numberOfPeople) {
    const count = booking.summary.numberOfPeople;
    return `${count} guest${count === 1 ? "" : "s"}`;
  }
  const parts = [`${booking.adults} adult${booking.adults === 1 ? "" : "s"}`];
  if (booking.children) parts.push(`${booking.children} child${booking.children === 1 ? "" : "ren"}`);
  if (booking.infants) parts.push(`${booking.infants} infant${booking.infants === 1 ? "" : "s"}`);
  return parts.join(", ");
};

const statusKey = (status: string) => status.trim().toUpperCase().replace(/[\s-]+/g, "_");

export default function ReservationsScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();
  const location = useLocation();
  const notice =
    location.state && typeof location.state === "object" && "notice" in location.state
      ? String((location.state as { notice?: string }).notice || "")
      : "";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [calendar, setCalendar] = useState<BookingCalendar | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [typeUid, setTypeUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarError, setCalendarError] = useState("");
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");

  const bounds = useMemo(() => monthBounds(month), [month]);

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([listBookings(propertyUid), listAccommodationTypes(propertyUid)])
      .then(([nextBookings, nextTypes]) => {
        if (!active) return;
        setBookings(nextBookings);
        setTypes(nextTypes);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Could not load reservations.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, tick]);

  useEffect(() => {
    if (!propertyUid) return;
    let active = true;
    setCalendarLoading(true);
    setCalendarError("");
    getBookingCalendar(propertyUid, bounds.from, bounds.to, typeUid || undefined)
      .then((next) => {
        if (active) setCalendar(next);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setCalendar(null);
        setCalendarError(err instanceof ApiError ? err.message : "Could not load the calendar.");
      })
      .finally(() => {
        if (active) setCalendarLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, bounds.from, bounds.to, typeUid, tick]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((booking) =>
      `${booking.bookingNumber} ${booking.leadGuestName} ${bookingStatusLabel(booking.status)} ${bookingSourceLabel(booking.bookingSource)}`
        .toLowerCase()
        .includes(q),
    );
  }, [bookings, query]);

  const counts = useMemo(() => {
    let pending = 0;
    let inHouse = 0;
    let quoted = 0;
    let currency = "LKR";
    for (const booking of bookings) {
      const status = statusKey(booking.status);
      if (status === "PENDING" || status === "TENTATIVE" || status === "INQUIRY") pending += 1;
      if (status === "CHECKED_IN") inHouse += 1;
      if (status !== "CANCELLED" && booking.quotedTotal !== null) {
        quoted += booking.quotedTotal;
        currency = booking.currency || currency;
      }
    }
    return { pending, inHouse, quoted, currency };
  }, [bookings]);

  const shiftMonth = (delta: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  return (
    <div className="rsv-page">
      {!propertyUid && <p className="rsv-empty">This account is not assigned to a property.</p>}

      {propertyUid && (
        <div className="rsv-header">
          <div>
            <p className="rsv-eyebrow">Reservations</p>
            <h2>Reservations</h2>
            <p className="rsv-sub">Bookings for this property, and which rooms are already taken.</p>
          </div>
          <button className="rsv-btn" onClick={() => navigate(ROUTES.ADMIN_RESERVATION_NEW)}>
            + New reservation
          </button>
        </div>
      )}

      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && (
        <PageError message={error} onRetry={() => setTick((n) => n + 1)} />
      )}

      {propertyUid && !loading && !error && (
        <>
          {notice && <p className="rsv-notice">{notice}</p>}

          <div className="rsv-summary">
            <article className="rsv-card">
              <span>Bookings</span>
              <strong>{bookings.length}</strong>
            </article>
            <article className="rsv-card rsv-card-sand">
              <span>Pending</span>
              <strong>{counts.pending}</strong>
            </article>
            <article className="rsv-card rsv-card-sage">
              <span>In house</span>
              <strong>{counts.inHouse}</strong>
            </article>
            <article className="rsv-card">
              <span>Quoted</span>
              <strong>{money(counts.quoted, counts.currency)}</strong>
            </article>
          </div>

          <section className="rsv-panel">
            <div className="rsv-cal-head">
              <h3 className="rsv-panel-title">Room calendar</h3>
              <div className="rsv-cal-tools">
                <button type="button" className="rsv-btn rsv-btn-ghost" onClick={() => shiftMonth(-1)}>
                  Previous
                </button>
                <strong>{bounds.label}</strong>
                <button type="button" className="rsv-btn rsv-btn-ghost" onClick={() => shiftMonth(1)}>
                  Next
                </button>
                <select value={typeUid} onChange={(event) => setTypeUid(event.target.value)}>
                  <option value="">All room types</option>
                  {types
                    .filter((type) => type.isActive)
                    .map((type) => (
                      <option key={type.uid} value={type.uid}>
                        {type.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <p className="rsv-cal-note">
              The first date is included and the last morning is open. A booking ends on the
              check-out date.
            </p>
            {calendarLoading && <p className="rsv-cal-note">Loading rooms…</p>}
            {!calendarLoading && calendarError && (
              <p className="rsv-error">
                {calendarError}{" "}
                <button type="button" className="rsv-text" onClick={() => setTick((n) => n + 1)}>
                  Try again
                </button>
              </p>
            )}
            {!calendarLoading && !calendarError && calendar && calendar.units.length === 0 && (
              <p className="rsv-empty">No rooms to show for this month.</p>
            )}
            {!calendarLoading && !calendarError && calendar && calendar.units.length > 0 && (
              <div className="rsv-cal">
                <div
                  className="rsv-cal-row rsv-cal-days"
                  style={{ gridTemplateColumns: `160px repeat(${bounds.days.length}, 28px)` }}
                >
                  <span />
                  {bounds.days.map((day) => (
                    <span key={day} title={formatDate(day)}>
                      {Number(day.slice(8))}
                    </span>
                  ))}
                </div>
                {calendar.units.map((unit) => (
                  <div
                    key={unit.unitUid}
                    className="rsv-cal-row"
                    style={{ gridTemplateColumns: `160px repeat(${bounds.days.length}, 28px)` }}
                  >
                    <div className="rsv-cal-unit">
                      <strong>{unit.unitCode || unit.unitName}</strong>
                      <span>{unit.accommodationTypeName}</span>
                    </div>
                    {bounds.days.map((day) => {
                      const hits = unit.segments.filter((segment) =>
                        coversDay(segment.startDate, segment.endDate, day),
                      );
                      const booking = hits.find((segment) => segment.segmentType === "BOOKING");
                      const block = hits.find((segment) => segment.segmentType === "BLOCK");
                      const kind = booking ? "booked" : block ? "blocked" : "";
                      const title = hits
                        .map((segment) =>
                          segment.segmentType === "BOOKING"
                            ? `${segment.bookingNumber || "Booking"}${segment.label ? ` · ${segment.label}` : ""}`
                            : segment.label || "Blocked",
                        )
                        .join(", ");
                      return <span key={day} className={`rsv-cal-cell ${kind}`} title={title} />;
                    })}
                  </div>
                ))}
                <ul className="rsv-cal-legend">
                  <li>
                    <i className="booked" /> Booked
                  </li>
                  <li>
                    <i className="blocked" /> Blocked
                  </li>
                  <li>
                    <i /> Open
                  </li>
                </ul>
              </div>
            )}
          </section>

          {bookings.length > 0 && (
            <input
              className="rsv-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by booking number, guest, or status"
            />
          )}

          {visible.length === 0 ? (
            <p className="rsv-empty">
              {bookings.length === 0
                ? "No reservations yet. Add the first booking."
                : "No bookings match that search."}
            </p>
          ) : (
            <div className="rsv-table-wrap">
              <table className="rsv-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Guest</th>
                    <th>Stay</th>
                    <th>Party</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Quoted</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((booking) => (
                    <tr key={booking.uid}>
                      <td>{booking.bookingNumber || "—"}</td>
                      <td>{booking.leadGuestName || "—"}</td>
                      <td>
                        {formatDate(booking.checkInDate)} – {formatDate(booking.checkOutDate)}
                        <span className="rsv-muted">
                          {booking.nights} night{booking.nights === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td>{party(booking)}</td>
                      <td>{bookingSourceLabel(booking.bookingSource)}</td>
                      <td>
                        <span className={`rsv-status ${statusKey(booking.status).toLowerCase()}`}>
                          {bookingStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td>{money(booking.quotedTotal, booking.currency)}</td>
                      <td>
                        <button
                          type="button"
                          className="rsv-text"
                          onClick={() => navigate(adminReservationPath(booking.uid))}
                        >
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
    </div>
  );
}
