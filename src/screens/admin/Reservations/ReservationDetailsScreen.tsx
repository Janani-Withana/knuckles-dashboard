import { useEffect, useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { adminReservationIncomePath, adminReservationPaymentsPath, ROUTES } from "../../../routes/paths";
import {
  listAccommodationTypes,
  listAccommodationUnits,
  listRatePlans,
} from "../../../services/admin/accommodationService.service";
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
  updateBooking,
} from "../../../services/admin/bookingDetailsService.service";
import { listGuests, type Guest } from "../../../services/admin/guestService.service";
import { getBookingFinancialSummary } from "../../../services/admin/paymentsService.service";
import {
  pricingBasisLabel,
  type AccommodationType,
  type AccommodationUnit,
  type RatePlan,
} from "../../../types/accommodation";
import {
  BOOKING_GUEST_TYPES,
  BOOKING_SOURCE_LABELS,
  bookingSourceLabel,
  bookingStatusLabel,
  bookingTypeLabel,
  parseBookingStatus,
  paymentMethodLabel,
  summaryGuestTypeLabel,
} from "../../../types/booking";
import type {
  BookingDetail,
  BookingHistoryEntry,
  BookingUnitLine,
} from "../../../types/bookingDetails";
import type { BookingFinancialSummary } from "../../../types/payments";
import { addDays, formatDate, isoDate, overlapsStay } from "./bookingDates";
import "./reservations.css";

type Dialog = { kind: "cancel" } | { kind: "assign"; line: BookingUnitLine } | { kind: "guest" } | null;

type EditDraft = {
  leadGuestUid: string;
  guestType: string;
  bookingSource: string;
  checkInDate: string;
  checkOutDate: string;
  adults: string;
  children: string;
  infants: string;
  currency: string;
  quotedTotal: string;
  discountAmount: string;
  taxAmount: string;
  serviceCharge: string;
  specialRequests: string;
  cancellationReason: string;
};

const whole = (value: string) => {
  if (!/^\d+$/.test(value.trim())) return undefined;
  return Number(value);
};

const amount = (value: string) => {
  if (!value.trim()) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
};

const draftFrom = (booking: BookingDetail): EditDraft => ({
  leadGuestUid: booking.leadGuestUid,
  guestType: booking.guestType || booking.summary?.guestType || "Single",
  bookingSource: String(booking.bookingSource),
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
  adults: String(booking.adults),
  children: String(booking.children),
  infants: String(booking.infants),
  currency: booking.currency || "LKR",
  quotedTotal: booking.quotedTotal === null ? "" : String(booking.quotedTotal),
  discountAmount: String(booking.discountAmount),
  taxAmount: String(booking.taxAmount),
  serviceCharge: String(booking.serviceCharge),
  specialRequests: booking.specialRequests,
  cancellationReason: booking.cancellationReason,
});

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
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [rooms, setRooms] = useState<AccommodationUnit[]>([]);
  const [propertyGuests, setPropertyGuests] = useState<Guest[]>([]);
  const [history, setHistory] = useState<BookingHistoryEntry[]>([]);
  const [finance, setFinance] = useState<BookingFinancialSummary | null>(null);
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
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  useEffect(() => {
    if (!bookingUid) return;
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      getBooking(bookingUid),
      getBookingHistory(bookingUid).catch(() => [] as BookingHistoryEntry[]),
      propertyUid ? listAccommodationTypes(propertyUid).catch(() => [] as AccommodationType[]) : Promise.resolve([]),
      propertyUid ? listRatePlans(propertyUid).catch(() => [] as RatePlan[]) : Promise.resolve([]),
      propertyUid ? listAccommodationUnits(propertyUid).catch(() => [] as AccommodationUnit[]) : Promise.resolve([]),
      propertyUid ? listGuests(propertyUid).catch(() => [] as Guest[]) : Promise.resolve([]),
      getBookingFinancialSummary(bookingUid).catch(() => null),
    ])
      .then(([nextBooking, nextHistory, nextTypes, nextPlans, nextRooms, nextGuests, nextFinance]) => {
        if (!active) return;
        setBooking(nextBooking);
        setHistory(nextHistory);
        setTypes(nextTypes);
        setRatePlans(nextPlans);
        setRooms(nextRooms);
        setPropertyGuests(nextGuests);
        setFinance(nextFinance);
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

  useEffect(() => {
    setEditing(false);
    setEditDraft(null);
  }, [bookingUid]);

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

  const openEdit = () => {
    if (!booking) return;
    setNotice("");
    setActionError("");
    setEditDraft(draftFrom(booking));
    setEditing(true);
  };

  const onEditChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setEditDraft((current) => {
      if (!current) return current;
      const next = { ...current, [name]: name === "currency" ? value.toUpperCase() : value };
      if (name === "checkInDate" && next.checkOutDate <= value) {
        next.checkOutDate = addDays(value, 1);
      }
      return next;
    });
  };

  const onSaveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!booking || !editDraft) return;
    setActionError("");

    const adults = whole(editDraft.adults);
    const children = whole(editDraft.children);
    const infants = whole(editDraft.infants);
    const quotedTotal = amount(editDraft.quotedTotal);
    const discountAmount = amount(editDraft.discountAmount);
    const taxAmount = amount(editDraft.taxAmount);
    const serviceCharge = amount(editDraft.serviceCharge);
    const currency = editDraft.currency.trim().toUpperCase();
    const status = parseBookingStatus(booking.status);

    if (!editDraft.leadGuestUid) return setActionError("Choose a lead guest.");
    if (editDraft.checkOutDate <= editDraft.checkInDate) {
      return setActionError("Check-out must be after check-in.");
    }
    if (adults === undefined || adults < 1) return setActionError("Adults must be at least 1.");
    if (children === undefined || infants === undefined) {
      return setActionError("Children and infants must be zero or more.");
    }
    if (currency.length !== 3) return setActionError("Currency must be a 3-letter code.");
    if (
      quotedTotal === undefined ||
      discountAmount === undefined ||
      taxAmount === undefined ||
      serviceCharge === undefined
    ) {
      return setActionError("Amounts must be zero or more.");
    }
    if (status === null) return setActionError("This booking status cannot be saved.");
    if (statusKey(booking.status) === "CANCELLED" && !editDraft.cancellationReason.trim()) {
      return setActionError("A cancelled booking needs a reason.");
    }

    setBusy(true);
    setNotice("");
    try {
      await updateBooking(booking.uid, {
        leadGuestUid: editDraft.leadGuestUid,
        guestType: editDraft.guestType,
        bookingSource: Number(editDraft.bookingSource),
        status,
        checkInDate: editDraft.checkInDate,
        checkOutDate: editDraft.checkOutDate,
        adults,
        children,
        infants,
        currency,
        discountAmount,
        taxAmount,
        serviceCharge,
        quotedTotal,
        specialRequests: editDraft.specialRequests.trim() || null,
        cancellationReason: editDraft.cancellationReason.trim() || null,
      });
      setEditing(false);
      setEditDraft(null);
      setNotice("Reservation updated.");
      setTick((n) => n + 1);
    } catch (err) {
      setActionError(errText(err, "Could not update this reservation."));
    } finally {
      setBusy(false);
    }
  };

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
  const charges = booking.charges ?? [];
  const chargesTotal = charges.reduce((sum, charge) => sum + charge.totalAmount, 0);
  const extraIncome = booking.summary?.extraIncome ?? chargesTotal;
  const totalBookingValue = booking.summary?.totalBookingValue ?? (quoted ?? 0) + chargesTotal;
  const outstanding = finance?.outstandingBalance ?? booking.summary?.outstandingBalance ?? null;
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
                booking.leadGuestName || "-",
                booking.guestType || (booking.summary?.guestType ? summaryGuestTypeLabel(booking.summary.guestType) : ""),
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
            <button
              type="button"
              className="rsv-btn rsv-btn-ghost"
              onClick={() => navigate(adminReservationPaymentsPath(booking.uid))}
            >
              Payments
            </button>
            <button
              type="button"
              className="rsv-btn rsv-btn-ghost"
              onClick={() => navigate(adminReservationIncomePath(booking.uid))}
            >
              Other income
            </button>
            {editable && !editing && (
              <button type="button" className="rsv-btn rsv-btn-ghost" disabled={busy} onClick={openEdit}>
                Edit details
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

      {editing && editDraft && (
        <form className="rsv-form" onSubmit={onSaveEdit}>
          <h3>Update reservation</h3>
          <div className="rsv-grid">
            <label>
              Lead guest
              <select name="leadGuestUid" value={editDraft.leadGuestUid} onChange={onEditChange}>
                {!propertyGuests.some((guest) => guest.uid === booking.leadGuestUid) && booking.leadGuestUid && (
                  <option value={booking.leadGuestUid}>{booking.leadGuestName || "Current guest"}</option>
                )}
                {propertyGuests.map((guest) => (
                  <option key={guest.uid} value={guest.uid}>
                    {guest.displayName || "Guest"}
                    {guest.phone ? ` · ${guest.phone}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Guest type
              <select name="guestType" value={editDraft.guestType} onChange={onEditChange}>
                {BOOKING_GUEST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Source
              <select name="bookingSource" value={editDraft.bookingSource} onChange={onEditChange}>
                {Object.entries(BOOKING_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Check-in
              <input name="checkInDate" type="date" value={editDraft.checkInDate} onChange={onEditChange} required />
            </label>
            <label>
              Check-out
              <input name="checkOutDate" type="date" value={editDraft.checkOutDate} onChange={onEditChange} required />
            </label>
            <label>
              Adults
              <input name="adults" type="number" min={1} step={1} value={editDraft.adults} onChange={onEditChange} />
            </label>
            <label>
              Children
              <input name="children" type="number" min={0} step={1} value={editDraft.children} onChange={onEditChange} />
            </label>
            <label>
              Infants
              <input name="infants" type="number" min={0} step={1} value={editDraft.infants} onChange={onEditChange} />
            </label>
            <label>
              Currency
              <input name="currency" value={editDraft.currency} onChange={onEditChange} maxLength={3} />
            </label>
            <label>
              Quoted total
              <input name="quotedTotal" type="number" min={0} step="0.01" value={editDraft.quotedTotal} onChange={onEditChange} />
            </label>
            <label>
              Discount
              <input name="discountAmount" type="number" min={0} step="0.01" value={editDraft.discountAmount} onChange={onEditChange} />
            </label>
            <label>
              Tax
              <input name="taxAmount" type="number" min={0} step="0.01" value={editDraft.taxAmount} onChange={onEditChange} />
            </label>
            <label>
              Service charge
              <input name="serviceCharge" type="number" min={0} step="0.01" value={editDraft.serviceCharge} onChange={onEditChange} />
            </label>
            <label className="rsv-span">
              Special requests
              <textarea name="specialRequests" rows={2} value={editDraft.specialRequests} onChange={onEditChange} />
            </label>
            {statusKey(booking.status) === "CANCELLED" && (
              <label className="rsv-span">
                Cancellation reason
                <textarea name="cancellationReason" rows={2} value={editDraft.cancellationReason} onChange={onEditChange} />
              </label>
            )}
          </div>
          <div className="rsv-actions">
            <button
              type="button"
              className="rsv-btn rsv-btn-ghost"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setEditDraft(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="rsv-btn" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}

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
        <button
          type="button"
          className={`rsv-card ${outstanding !== null && outstanding > 0 ? "rsv-card-clay" : "rsv-card-sage"}`}
          onClick={() => navigate(adminReservationPaymentsPath(booking.uid))}
        >
          <span>Outstanding</span>
          <strong>{money(outstanding, finance?.currency || booking.currency)}</strong>
        </button>
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
                const plan = ratePlans.find((item) => item.uid === line.ratePlanUid);
                const planLabel = plan ? [plan.code, plan.name].filter(Boolean).join(" · ") : "";
                return (
                  <article key={line.uid} className="rsv-line">
                    <div>
                      <strong>
                        {line.unitQuantity > 1 ? `${line.unitQuantity} × ` : ""}
                        {typeName}
                      </strong>
                      <span>
                        {code ? `Room ${code}` : "No room assigned yet"}
                        {planLabel ? ` · ${planLabel}` : ""}
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
            {/* {editable && (
              <button type="button" className="rsv-text" onClick={() => setDialog({ kind: "guest" })}>
                Add guest
              </button>
            )} */}
          </div>
          <p className="rsv-muted-note">{party}</p>
          {booking.guests.length === 0 ? (
            <p className="rsv-muted-note">No guests listed.</p>
          ) : (
            <div className="rsv-lines">
              {booking.guests.map((guest) => {
                const profile = propertyGuests.find((item) => item.uid === guest.guestUid);
                const typeLabel = summaryGuestTypeLabel(
                  guest.guestType || (guest.isLeadGuest ? booking.guestType : "") || (profile ? String(profile.guestType) : ""),
                );
                const email = guest.email || profile?.email || "";
                return (
                  <article key={guest.guestUid} className="rsv-line">
                    <div>
                      <strong>{guest.displayName || profile?.displayName || "Guest"}</strong>
                      {typeLabel && <span>{typeLabel}</span>}
                      {email && <span>{email}</span>}
                      {/* {guest.isLeadGuest && <em className="rsv-pill">Lead guest</em>} */}
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
                );
              })}
            </div>
          )}
        </section>


        {/* <section className="rsv-panel rsv-panel-span">
          <div className="rsv-panel-row">
            <h3 className="rsv-panel-title">Charges</h3>
            <strong>{money(extraIncome, booking.currency)}</strong>
          </div>
          {charges.length === 0 ? (
            <p className="rsv-muted-note">No extra charges on this reservation.</p>
          ) : (
            <div className="rsv-lines">
              {[...charges]
                .sort((a, b) => a.serviceDate.localeCompare(b.serviceDate) || a.creationDate.localeCompare(b.creationDate))
                .map((charge) => {
                  const title = charge.chargeTypeName || charge.description || "Charge";
                  const qty = Number.isInteger(charge.quantity)
                    ? String(charge.quantity)
                    : charge.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 });
                  return (
                    <article key={charge.uid} className="rsv-line">
                      <div>
                        <strong>{title}</strong>
                        <span>
                          {charge.serviceDate ? formatDate(charge.serviceDate) : "No date"}
                          {` · ${qty} × ${money(charge.unitPrice, booking.currency)}`}
                          {charge.discountAmount > 0
                            ? ` · Discount ${money(charge.discountAmount, booking.currency)}`
                            : ""}
                          {charge.taxAmount > 0 ? ` · Tax ${money(charge.taxAmount, booking.currency)}` : ""}
                        </span>
                        {charge.description && charge.description !== title && <span>{charge.description}</span>}
                        {charge.notes && <span>{charge.notes}</span>}
                      </div>
                      <strong className="rsv-line-amount">{money(charge.totalAmount, booking.currency)}</strong>
                    </article>
                  );
                })}
            </div>
          )}
        </section> */}

        <section className="rsv-panel">
          <h3 className="rsv-panel-title">Financial summary</h3>
          <dl className="rsv-facts">
            {booking.bookingType && (
              <div>
                <dt>Booking type</dt>
                <dd>{bookingTypeLabel(booking.bookingType)}</dd>
              </div>
            )}
            {booking.summary?.roomRatePerNight !== null && booking.summary?.roomRatePerNight !== undefined && (
              <div>
                <dt>Room rate / night</dt>
                <dd>{money(booking.summary.roomRatePerNight, booking.currency)}</dd>
              </div>
            )}
            <div>
              <dt>Room revenue</dt>
              <dd>{money(booking.summary?.totalRoomRevenue ?? quoted, booking.currency)}</dd>
            </div>
            <div>
              <dt>Extra income</dt>
              <dd>{money(extraIncome, booking.currency)}</dd>
            </div>
            <div>
              <dt>Service charge</dt>
              <dd>{money(booking.summary?.serviceCharge ?? booking.serviceCharge, booking.currency)}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd>{money(booking.summary?.discountAmount ?? booking.discountAmount, booking.currency)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{money(booking.summary?.taxAmount ?? booking.taxAmount, booking.currency)}</dd>
            </div>
            <div className="rsv-facts-total">
              <dt>Booking value</dt>
              <dd>{money(totalBookingValue, booking.currency)}</dd>
            </div>
            {booking.summary && (
              <>
                <div>
                  <dt>Payments received</dt>
                  <dd>{money(booking.summary.paymentsReceived, booking.currency)}</dd>
                </div>
                <div>
                  <dt>Refunds paid</dt>
                  <dd>{money(booking.summary.refundsPaid, booking.currency)}</dd>
                </div>
                <div>
                  <dt>Net paid</dt>
                  <dd>{money(booking.summary.netPaid, booking.currency)}</dd>
                </div>
              </>
            )}
            <div className="rsv-facts-total">
              <dt>Outstanding balance</dt>
              <dd>{money(outstanding, booking.currency)}</dd>
            </div>
            {booking.summary?.paymentMethod && (
              <div>
                <dt>Payment method</dt>
                <dd>{paymentMethodLabel(booking.summary.paymentMethod)}</dd>
              </div>
            )}
            {booking.summary?.averagePerPerson !== null && booking.summary?.averagePerPerson !== undefined && (
              <div>
                <dt>Average / person</dt>
                <dd>{money(booking.summary.averagePerPerson, booking.currency)}</dd>
              </div>
            )}
            <div>
              <dt>Quoted total (rooms)</dt>
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
            Make guest (replaces the current one)
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