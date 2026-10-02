import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { ROUTES } from "../../../routes/paths";
import { listAccommodationTypes, listAccommodationUnits } from "../../../services/admin/accommodationService.service";
import { getBookingCalendar } from "../../../services/admin/bookingService.service";
import {
  addBookingGuest,
  assignBookingUnit,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  confirmBooking,
  getBooking,
  getBookingHistory,
  removeBookingGuest,
} from "../../../services/admin/bookingDetailsService.service";
import { listGuests, type Guest } from "../../../services/admin/guestService.service";
import { pricingBasisLabel, type AccommodationType, type AccommodationUnit } from "../../../types/accommodation";
import {
  bookingSourceLabel,
  bookingStatusLabel,
  bookingTypeLabel,
  paymentMethodLabel,
  summaryGuestTypeLabel,
} from "../../../types/booking";
import type {
  BookingDetail,
  BookingHistoryEntry,
  BookingUnitLine,
} from "../../../types/bookingDetails";
import { formatDate, isoDate, overlapsStay } from "./bookingDates";
import "./reservations.css";

type Dialog = { kind: "cancel" } | { kind: "assign"; line: BookingUnitLine } | { kind: "guest" } | null;

const statusKey = (status: string) => status.trim().toUpperCase().replace(/[\s-]+/g, "_");

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

const errText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

const dateTime = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

function Modal({
  title,
  busy,
  onClose,
  children,
}: {
  title: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return createPortal(
    <div className="rsv-backdrop" onClick={() => !busy && onClose()}>
      <div
        className="rsv-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId}>{title}</h3>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default function ReservationDetailsScreen() {
  const { bookingUid = "" } = useParams<{ bookingUid: string }>();
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [rooms, setRooms] = useState<AccommodationUnit[]>([]);
  const [history, setHistory] = useState<BookingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [notice, setNotice] = useState("");

  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  // dialog inputs
  const [reason, setReason] = useState("");
  const [choice, setChoice] = useState("");
  const [makeLead, setMakeLead] = useState(false);
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!bookingUid) return;
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      getBooking(bookingUid),
      getBookingHistory(bookingUid).catch(() => [] as BookingHistoryEntry[]),
      propertyUid ? listAccommodationTypes(propertyUid).catch(() => [] as AccommodationType[]) : Promise.resolve([]),
      propertyUid ? listAccommodationUnits(propertyUid).catch(() => [] as AccommodationUnit[]) : Promise.resolve([]),
    ])
      .then(([nextBooking, nextHistory, nextTypes, nextRooms]) => {
        if (!active) return;
        setBooking(nextBooking);
        setHistory(nextHistory);
        setTypes(nextTypes);
        setRooms(nextRooms);
      })
      .catch((err: unknown) => {
        if (active) setError(errText(err, "Could not load this reservation."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookingUid, propertyUid, tick]);

  const closeDialog = () => {
    setDialog(null);
    setActionError("");
    setReason("");
    setChoice("");
    setMakeLead(false);
    setOptions([]);
  };

  // Load choices for the assign-unit and add-guest dialogs
  useEffect(() => {
    if (!dialog || !booking || !propertyUid) return;
    if (dialog.kind !== "assign" && dialog.kind !== "guest") return;
    let active = true;
    setOptionsLoading(true);

    const load =
      dialog.kind === "assign"
        ? getBookingCalendar(
            propertyUid,
            booking.checkInDate,
            booking.checkOutDate,
            dialog.line.accommodationTypeUid || undefined,
          ).then((calendar) => {
            const usedByOthers = new Set(
              booking.units.filter((u) => u.uid !== dialog.line.uid).map((u) => u.unitUid),
            );
            return calendar.units
              .filter(
                (unit) =>
                  (!dialog.line.accommodationTypeUid ||
                    unit.accommodationTypeUid === dialog.line.accommodationTypeUid) &&
                  !usedByOthers.has(unit.unitUid) &&
                  !unit.segments.some(
                    (s) =>
                      s.bookingUid !== booking.uid &&
                      overlapsStay(s.startDate, s.endDate, booking.checkInDate, booking.checkOutDate),
                  ),
              )
              .map((unit) => ({ value: unit.unitUid, label: unit.unitCode || unit.unitName }));
          })
        : listGuests(propertyUid).then((guests: Guest[]) =>
            guests
              .filter((g) => g.isActive && !booking.guests.some((bg) => bg.guestUid === g.uid))
              .map((g) => ({ value: g.uid, label: g.displayName || g.phone || g.email })),
          );

    load
      .then((next) => {
        if (active) setOptions(next);
      })
      .catch((err: unknown) => {
        if (active) setActionError(errText(err, "Could not load the options."));
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dialog, booking, propertyUid]);

  const run = async (task: () => Promise<unknown>, done: string, close = false) => {
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      await task();
      setNotice(done);
      if (close) closeDialog();
      setTick((n) => n + 1);
    } catch (err) {
      setActionError(errText(err, "That did not work. Try again."));
    } finally {
      setBusy(false);
    }
  };

  if (!bookingUid) return <p className="rsv-empty">No reservation selected.</p>;
  if (loading && !booking) return <PageLoading />;
  if (error || !booking) {
    return <PageError message={error || "Reservation not found."} onRetry={() => setTick((n) => n + 1)} />;
  }

  const status = statusKey(booking.status);
  const canConfirm = ["INQUIRY", "PENDING", "TENTATIVE"].includes(status);
  const canCheckIn = status === "CONFIRMED";
  const canCheckOut = status === "CHECKED_IN";
  const checkInOpen = booking.checkInDate <= isoDate(new Date());
  const canCancel = canConfirm || canCheckIn;
  const editable = canConfirm || canCheckIn || canCheckOut;

  const quoted = booking.quotedTotal;
  const party = [
    `${booking.adults} adult${booking.adults === 1 ? "" : "s"}`,
    booking.children ? `${booking.children} child${booking.children === 1 ? "" : "ren"}` : "",
    booking.infants ? `${booking.infants} infant${booking.infants === 1 ? "" : "s"}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rsv-page">
      <div>
        <button type="button" className="rsv-back" onClick={() => navigate(ROUTES.ADMIN_RESERVATIONS)}>
          ← Reservations
        </button>
        <div className="rsv-header">
          <div>
            <p className="rsv-eyebrow">Reservation</p>
            <h2>{booking.bookingNumber || "Booking"}</h2>
            <p className="rsv-sub">
              {[
                booking.leadGuestName || "No lead guest",
                booking.summary?.guestType ? summaryGuestTypeLabel(booking.summary.guestType) : "",
                booking.summary?.contactNumber,
                bookingSourceLabel(booking.bookingSource),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="rsv-head-actions">
            <span className={`rsv-status ${status.toLowerCase()}`}>{bookingStatusLabel(booking.status)}</span>
            {canConfirm && (
              <button
                className="rsv-btn"
                disabled={busy}
                onClick={() => run(() => confirmBooking(booking.uid), "Booking confirmed.")}
              >
                Confirm
              </button>
            )}
            {canCheckIn && (
              <button
                className="rsv-btn"
                disabled={busy || !checkInOpen}
                title={checkInOpen ? undefined : `Check in opens on ${formatDate(booking.checkInDate)}.`}
                onClick={() => run(() => checkInBooking(booking.uid), "Guest checked in.")}
              >
                Check in
              </button>
            )}
            {canCheckOut && (
              <button
                className="rsv-btn"
                disabled={busy || !checkInOpen}
                title={checkInOpen ? undefined : `Check out opens on ${formatDate(booking.checkInDate)}.`}
                onClick={() => run(() => checkOutBooking(booking.uid), "Guest checked out.")}
              >
                Check out
              </button>
            )}
            {canCancel && (
              <button className="rsv-btn rsv-btn-ghost" disabled={busy} onClick={() => setDialog({ kind: "cancel" })}>
                Cancel booking
              </button>
            )}
          </div>
        </div>
      </div>

      {notice && <p className="rsv-notice">{notice}</p>}
      {!dialog && actionError && <p className="rsv-error">{actionError}</p>}

      <div className="rsv-summary">
        <article className="rsv-card">
          <span>Check-in</span>
          <strong>{formatDate(booking.checkInDate)}</strong>
        </article>
        <article className="rsv-card">
          <span>Check-out</span>
          <strong>{formatDate(booking.checkOutDate)}</strong>
        </article>
        <article className="rsv-card rsv-card-sage">
          <span>Nights</span>
          <strong>{booking.nights}</strong>
        </article>
        <article className="rsv-card rsv-card-sand">
          <span>Quoted total</span>
          <strong>{money(quoted, booking.currency)}</strong>
        </article>
      </div>

      <div className="rsv-detail-grid">
        <section className="rsv-panel">
          <h3 className="rsv-panel-title">Rooms</h3>
          {booking.units.length === 0 ? (
            <p className="rsv-muted-note">No rooms on this booking.</p>
          ) : (
            <div className="rsv-lines">
              {booking.units.map((line) => {
                const typeName =
                  line.accommodationTypeName ||
                  types.find((type) => type.uid === line.accommodationTypeUid)?.name ||
                  "Room";
                const matched = rooms.find((room) => room.uid === line.unitUid);
                const code = line.unitCode || line.unitName || matched?.unitCode || matched?.unitName || "";
                return (
                  <article key={line.uid} className="rsv-line">
                    <div>
                      <strong>
                        {line.unitQuantity > 1 ? `${line.unitQuantity} × ` : ""}
                        {typeName}
                      </strong>
                      <span>
                        {code ? `Room ${code}` : "No room assigned yet"}
                        {` · ${pricingBasisLabel(line.pricingBasis)}`}
                        {line.unitRate !== null ? ` · ${money(line.unitRate, booking.currency)}` : ""}
                      </span>
                      {line.totalAmount !== null && (
                        <span>Stay total {money(line.totalAmount, booking.currency)}</span>
                      )}
                    </div>
                    {editable && (
                      <button
                        type="button"
                        className="rsv-text"
                        onClick={() => setDialog({ kind: "assign", line })}
                      >
                        {line.unitUid ? "Change room" : "Assign room"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rsv-panel">
          <div className="rsv-panel-row">
            <h3 className="rsv-panel-title">Guests</h3>
            {editable && (
              <button type="button" className="rsv-text" onClick={() => setDialog({ kind: "guest" })}>
                Add guest
              </button>
            )}
          </div>
          <p className="rsv-muted-note">{party}</p>
          {booking.guests.length === 0 ? (
            <p className="rsv-muted-note">No guests listed.</p>
          ) : (
            <div className="rsv-lines">
              {booking.guests.map((guest) => (
                <article key={guest.guestUid} className="rsv-line">
                  <div>
                    <strong>{guest.displayName || "Guest"}</strong>
                    {guest.isLeadGuest && <em className="rsv-pill">Lead guest</em>}
                  </div>
                  {editable && !guest.isLeadGuest && (
                    <button
                      type="button"
                      className="rsv-link-danger"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => removeBookingGuest(booking.uid, guest.guestUid),
                          `${guest.displayName || "Guest"} removed.`,
                        )
                      }
                    >
                      Remove
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rsv-panel">
          <h3 className="rsv-panel-title">Charges</h3>
          <dl className="rsv-facts">
            {booking.summary?.bookingType && (
              <div>
                <dt>Booking type</dt>
                <dd>{bookingTypeLabel(booking.summary.bookingType)}</dd>
              </div>
            )}
            {booking.summary?.roomRatePerNight !== null && booking.summary?.roomRatePerNight !== undefined && (
              <div>
                <dt>Room rate / night</dt>
                <dd>{money(booking.summary.roomRatePerNight, booking.currency)}</dd>
              </div>
            )}
            {booking.summary && (
              <>
                <div>
                  <dt>Room revenue</dt>
                  <dd>{money(booking.summary.totalRoomRevenue, booking.currency)}</dd>
                </div>
                <div>
                  <dt>Cooking</dt>
                  <dd>{money(booking.summary.cookingCharges, booking.currency)}</dd>
                </div>
                <div>
                  <dt>Extras</dt>
                  <dd>{money(booking.summary.extraCharges, booking.currency)}</dd>
                </div>
                {booking.summary.paymentMethod && (
                  <div>
                    <dt>Payment</dt>
                    <dd>{paymentMethodLabel(booking.summary.paymentMethod)}</dd>
                  </div>
                )}
                {booking.summary.averagePerPerson !== null && (
                  <div>
                    <dt>Average / person</dt>
                    <dd>{money(booking.summary.averagePerPerson, booking.currency)}</dd>
                  </div>
                )}
                <div className="rsv-facts-total">
                  <dt>Booking value</dt>
                  <dd>{money(booking.summary.totalBookingValue, booking.currency)}</dd>
                </div>
              </>
            )}
            <div>
              <dt>Discount</dt>
              <dd>{money(booking.discountAmount, booking.currency)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{money(booking.taxAmount, booking.currency)}</dd>
            </div>
            <div>
              <dt>Service charge</dt>
              <dd>{money(booking.serviceCharge, booking.currency)}</dd>
            </div>
            <div className="rsv-facts-total">
              <dt>Quoted total</dt>
              <dd>{money(quoted, booking.currency)}</dd>
            </div>
          </dl>
        </section>

        <section className="rsv-panel">
          <h3 className="rsv-panel-title">Notes</h3>
          <p className="rsv-notes">{booking.specialRequests || booking.summary?.notes || "No special requests."}</p>
          {booking.internalNotes && <p className="rsv-notes">{booking.internalNotes}</p>}
          {(booking.arrivalTime || booking.departureTime) && (
            <p className="rsv-muted-note">
              {[
                booking.arrivalTime && `Arrives ${booking.arrivalTime}`,
                booking.departureTime && `Leaves ${booking.departureTime}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {booking.cancellationReason && (
            <p className="rsv-error">Cancelled: {booking.cancellationReason}</p>
          )}
        </section>
      </div>

      <section className="rsv-panel">
        <h3 className="rsv-panel-title">History</h3>
        {history.length === 0 ? (
          <p className="rsv-muted-note">No history yet.</p>
        ) : (
          <ol className="rsv-timeline">
            {history.map((entry) => (
              <li key={entry.key}>
                <strong>
                  {entry.toStatus
                    ? entry.fromStatus
                      ? `${bookingStatusLabel(entry.fromStatus)} to ${bookingStatusLabel(entry.toStatus)}`
                      : `Created as ${bookingStatusLabel(entry.toStatus).toLowerCase()}`
                    : entry.kind || "Created"}
                </strong>
                <span>
                  {[entry.changedAt && dateTime(entry.changedAt), entry.changedBy && `by ${entry.changedBy}`]
                    .filter(Boolean)
                    .join(" ")}
                </span>
                {entry.reason && <p>{entry.reason}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>

      {dialog?.kind === "cancel" && (
        <Modal title="Cancel this booking?" busy={busy} onClose={closeDialog}>
          <p>The rooms are released. Tell us why so it shows in the history.</p>
          <label className="rsv-field">
            Reason
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {actionError && <p className="rsv-error">{actionError}</p>}
          <div className="rsv-actions">
            <button className="rsv-btn rsv-btn-ghost" onClick={closeDialog} disabled={busy}>
              Keep booking
            </button>
            <button
              className="rsv-btn rsv-btn-danger"
              disabled={busy || !reason.trim()}
              onClick={() => run(() => cancelBooking(booking.uid, reason), "Booking cancelled.", true)}
            >
              {busy ? "Cancelling…" : "Cancel booking"}
            </button>
          </div>
        </Modal>
      )}

      {dialog?.kind === "assign" && (
        <Modal title="Assign a room" busy={busy} onClose={closeDialog}>
          <p>
            Free{" "}
            {dialog.line.accommodationTypeName ||
              types.find((type) => type.uid === dialog.line.accommodationTypeUid)?.name ||
              "rooms"}{" "}
            for {formatDate(booking.checkInDate)} –{" "}
            {formatDate(booking.checkOutDate)}.
          </p>
          {optionsLoading ? (
            <p className="rsv-muted-note">Checking availability…</p>
          ) : options.length === 0 ? (
            <p className="rsv-muted-note">No free rooms of this type for these dates.</p>
          ) : (
            <label className="rsv-field">
              Room
              <select value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">Select a room</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {actionError && <p className="rsv-error">{actionError}</p>}
          <div className="rsv-actions">
            <button className="rsv-btn rsv-btn-ghost" onClick={closeDialog} disabled={busy}>
              Close
            </button>
            <button
              className="rsv-btn"
              disabled={busy || !choice}
              onClick={() =>
                run(() => assignBookingUnit(booking.uid, dialog.line.uid, choice), "Room assigned.", true)
              }
            >
              {busy ? "Assigning…" : "Assign room"}
            </button>
          </div>
        </Modal>
      )}

      {dialog?.kind === "guest" && (
        <Modal title="Add a guest" busy={busy} onClose={closeDialog}>
          {optionsLoading ? (
            <p className="rsv-muted-note">Loading guests…</p>
          ) : options.length === 0 ? (
            <p className="rsv-muted-note">No other guests available to add.</p>
          ) : (
            <label className="rsv-field">
              Guest
              <select value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">Select a guest</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="rsv-check">
            <input type="checkbox" checked={makeLead} onChange={(e) => setMakeLead(e.target.checked)} />
            Make lead guest (replaces the current one)
          </label>
          {actionError && <p className="rsv-error">{actionError}</p>}
          <div className="rsv-actions">
            <button className="rsv-btn rsv-btn-ghost" onClick={closeDialog} disabled={busy}>
              Close
            </button>
            <button
              className="rsv-btn"
              disabled={busy || !choice}
              onClick={() => run(() => addBookingGuest(booking.uid, choice, makeLead), "Guest added.", true)}
            >
              {busy ? "Adding…" : "Add guest"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}