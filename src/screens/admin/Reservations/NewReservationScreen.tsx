import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { ROUTES } from "../../../routes/paths";
import { listAccommodationTypes } from "../../../services/admin/accommodationService.service";
import { createBooking, getBookingCalendar } from "../../../services/admin/bookingService.service";
import { createGuest, listGuests, type Guest } from "../../../services/admin/guestService.service";
import { getProperty } from "../../../services/superAdmin/propertyService.service";
import { PRICING_BASIS_LABELS, type AccommodationType } from "../../../types/accommodation";
import { BOOKING_SOURCE_LABELS, type BookingCalendarUnit } from "../../../types/booking";
import { addDays, formatDate, isoDate, nightsBetween, overlapsStay } from "./bookingDates";
import "./reservations.css";

const NEW_GUEST = "new";

type Draft = {
  guestUid: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  bookingSource: string;
  checkInDate: string;
  checkOutDate: string;
  adults: string;
  children: string;
  infants: string;
  currency: string;
  specialRequests: string;
  accommodationTypeUid: string;
  unitUid: string;
  pricingBasis: string;
  unitRate: string;
};

const emptyDraft = (currency = "LKR"): Draft => {
  const checkInDate = isoDate(new Date());
  return {
    guestUid: NEW_GUEST,
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    bookingSource: "3",
    checkInDate,
    checkOutDate: addDays(checkInDate, 2),
    adults: "2",
    children: "0",
    infants: "0",
    currency,
    specialRequests: "",
    accommodationTypeUid: "",
    unitUid: "",
    pricingBasis: "0",
    unitRate: "",
  };
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

export default function NewReservationScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [units, setUnits] = useState<BookingCalendarUnit[]>([]);
  const [calendarError, setCalendarError] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const goBack = () => navigate(ROUTES.ADMIN_RESERVATIONS);

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([listGuests(propertyUid), listAccommodationTypes(propertyUid)])
      .then(([nextGuests, nextTypes]) => {
        if (!active) return;
        const activeGuests = nextGuests.filter((guest) => guest.isActive);
        const activeTypes = nextTypes.filter((type) => type.isActive);
        setGuests(activeGuests);
        setTypes(nextTypes);
        setDraft((current) => ({
          ...current,
          guestUid: activeGuests[0]?.uid || NEW_GUEST,
          accommodationTypeUid: activeTypes[0]?.uid || "",
          unitRate: activeTypes[0]?.baseRate ? String(activeTypes[0].baseRate) : "",
        }));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Could not load reservation details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    getProperty(propertyUid)
      .then((property) => {
        if (active && property.defaultCurrency) {
          setDraft((current) => ({ ...current, currency: property.defaultCurrency }));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [propertyUid]);

  useEffect(() => {
    if (!propertyUid || draft.checkOutDate <= draft.checkInDate) {
      setUnits([]);
      return;
    }
    let active = true;
    setCalendarError("");
    getBookingCalendar(
      propertyUid,
      draft.checkInDate,
      draft.checkOutDate,
      draft.accommodationTypeUid || undefined,
    )
      .then((calendar) => {
        if (!active) return;
        setUnits(calendar.units);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setUnits([]);
        setCalendarError(err instanceof ApiError ? err.message : "Could not check room availability.");
      });
    return () => {
      active = false;
    };
  }, [propertyUid, draft.checkInDate, draft.checkOutDate, draft.accommodationTypeUid]);

  const nights = nightsBetween(draft.checkInDate, draft.checkOutDate);
  const unitRate = amount(draft.unitRate);
  const quoted =
    nights > 0 && unitRate !== undefined
      ? draft.pricingBasis === "3"
        ? unitRate
        : unitRate * nights
      : null;

  const unitState = useMemo(() => {
    return units.map((unit) => {
      const hit = unit.segments.find((segment) =>
        overlapsStay(segment.startDate, segment.endDate, draft.checkInDate, draft.checkOutDate),
      );
      const reason = !hit
        ? ""
        : hit.segmentType === "BLOCK"
          ? "blocked"
          : hit.bookingNumber
            ? `booked ${hit.bookingNumber}`
            : "booked";
      return { unit, reason };
    });
  }, [units, draft.checkInDate, draft.checkOutDate]);

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setDraft((current) => {
      const next = { ...current, [name]: name === "currency" ? value.toUpperCase() : value };
      if (name === "accommodationTypeUid") {
        const type = types.find((item) => item.uid === value);
        next.unitUid = "";
        if (type && type.baseRate > 0) next.unitRate = String(type.baseRate);
      }
      if (name === "checkInDate" && next.checkOutDate <= value) {
        next.checkOutDate = addDays(value, 1);
      }
      return next;
    });
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid) return;
    setError("");

    const adults = whole(draft.adults);
    const children = whole(draft.children);
    const infants = whole(draft.infants);
    const rate = amount(draft.unitRate);
    const currency = draft.currency.trim().toUpperCase();
    if (draft.checkOutDate <= draft.checkInDate) {
      return setError("Check-out must be after check-in.");
    }
    if (adults === undefined || adults < 1) return setError("Adults must be at least 1.");
    if (children === undefined || infants === undefined) {
      return setError("Children and infants must be zero or more.");
    }
    if (currency.length !== 3) return setError("Currency must be a 3-letter code.");
    if (!draft.accommodationTypeUid) return setError("Choose an accommodation type.");
    if (rate === undefined) return setError("Enter a unit rate of zero or more.");
    const chosen = unitState.find((item) => item.unit.unitUid === draft.unitUid);
    if (chosen?.reason) return setError(`That room is ${chosen.reason} for these dates.`);

    setSaving(true);
    try {
      let leadGuestUid = draft.guestUid;
      if (leadGuestUid === NEW_GUEST) {
        const name = draft.guestName.trim();
        if (!name) {
          setError("Enter the lead guest's name.");
          setSaving(false);
          return;
        }
        const guest = await createGuest(propertyUid, {
          displayName: name,
          phone: draft.guestPhone.trim() || null,
          email: draft.guestEmail.trim() || null,
        });
        leadGuestUid = guest.uid;
      }
      if (!leadGuestUid) {
        setError("Choose a lead guest.");
        setSaving(false);
        return;
      }
      const booking = await createBooking(propertyUid, {
        leadGuestUid,
        bookingSource: Number(draft.bookingSource),
        checkInDate: draft.checkInDate,
        checkOutDate: draft.checkOutDate,
        adults,
        children,
        infants,
        currency,
        specialRequests: draft.specialRequests.trim() || null,
        units: [
          {
            accommodationTypeUid: draft.accommodationTypeUid,
            unitUid: draft.unitUid || null,
            pricingBasis: Number(draft.pricingBasis),
            unitRate: rate,
            adults,
            children,
            unitQuantity: 1,
            guestCount: adults + children,
          },
        ],
      });
      navigate(ROUTES.ADMIN_RESERVATIONS, {
        state: { notice: `${booking.bookingNumber || "Booking"} created.` },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create this reservation.");
      setSaving(false);
    }
  };

  const activeTypes = types.filter((type) => type.isActive);

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <button type="button" className="rsv-back" onClick={goBack}>
            ← Back to reservations
          </button>
          <p className="rsv-eyebrow">Reservations</p>
          <h2>New reservation</h2>
          <p className="rsv-sub">
            The booking is saved as pending. Check-out is the morning the room becomes free.
          </p>
        </div>
      </div>

      {!propertyUid && <p className="rsv-empty">This account is not assigned to a property.</p>}

      {propertyUid && loading && <p className="rsv-empty">Loading guests and room types…</p>}

      {propertyUid && !loading && (
        <form className="rsv-form" onSubmit={onSave}>
          <h3>Guest</h3>
          <div className="rsv-grid">
            <label>
              Lead guest
              <select name="guestUid" value={draft.guestUid} onChange={onChange}>
                <option value={NEW_GUEST}>New guest</option>
                {guests.map((guest) => (
                  <option key={guest.uid} value={guest.uid}>
                    {guest.displayName}
                    {guest.phone ? ` · ${guest.phone}` : ""}
                  </option>
                ))}
              </select>
            </label>
            {draft.guestUid === NEW_GUEST && (
              <>
                <label>
                  Name
                  <input
                    name="guestName"
                    value={draft.guestName}
                    onChange={onChange}
                    placeholder="Nimal Perera"
                  />
                </label>
                <label>
                  Phone
                  <input
                    name="guestPhone"
                    value={draft.guestPhone}
                    onChange={onChange}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Email
                  <input
                    name="guestEmail"
                    value={draft.guestEmail}
                    onChange={onChange}
                    placeholder="Optional"
                  />
                </label>
              </>
            )}
          </div>

          <h3>Stay</h3>
          <div className="rsv-grid">
            <label>
              Check-in
              <input
                name="checkInDate"
                type="date"
                value={draft.checkInDate}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Check-out
              <input
                name="checkOutDate"
                type="date"
                value={draft.checkOutDate}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Source
              <select name="bookingSource" value={draft.bookingSource} onChange={onChange}>
                {Object.entries(BOOKING_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Adults
              <input name="adults" type="number" min={1} step={1} value={draft.adults} onChange={onChange} />
            </label>
            <label>
              Children
              <input
                name="children"
                type="number"
                min={0}
                step={1}
                value={draft.children}
                onChange={onChange}
              />
            </label>
            <label>
              Infants
              <input
                name="infants"
                type="number"
                min={0}
                step={1}
                value={draft.infants}
                onChange={onChange}
              />
            </label>
            <label>
              Currency
              <input name="currency" value={draft.currency} onChange={onChange} maxLength={3} />
            </label>
            <label className="rsv-span">
              Special requests
              <textarea
                name="specialRequests"
                rows={2}
                value={draft.specialRequests}
                onChange={onChange}
                placeholder="Late arrival"
              />
            </label>
          </div>

          <h3>Room</h3>
          <div className="rsv-grid">
            <label>
              Accommodation type
              <select
                name="accommodationTypeUid"
                value={draft.accommodationTypeUid}
                onChange={onChange}
              >
                <option value="">Select a type</option>
                {activeTypes.map((type) => (
                  <option key={type.uid} value={type.uid}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Room
              <select name="unitUid" value={draft.unitUid} onChange={onChange}>
                <option value="">Assign later</option>
                {unitState.map(({ unit, reason }) => (
                  <option key={unit.unitUid} value={unit.unitUid} disabled={!!reason}>
                    {unit.unitCode || unit.unitName}
                    {reason ? ` · ${reason}` : " · free"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pricing
              <select name="pricingBasis" value={draft.pricingBasis} onChange={onChange}>
                {Object.entries(PRICING_BASIS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Unit rate
              <input
                name="unitRate"
                type="number"
                min={0}
                step="0.01"
                value={draft.unitRate}
                onChange={onChange}
                placeholder="25000"
              />
            </label>
            <label>
              Quoted for this stay
              <input
                readOnly
                value={
                  quoted === null
                    ? nights > 0
                      ? `${nights} night${nights === 1 ? "" : "s"}`
                      : "Check-out must be after check-in"
                    : `${quoted.toLocaleString()} ${draft.currency || "LKR"} · ${formatDate(draft.checkInDate)} – ${formatDate(draft.checkOutDate)}`
                }
              />
            </label>
          </div>
          {calendarError && <p className="rsv-error">{calendarError}</p>}
          {error && <p className="rsv-error">{error}</p>}
          <div className="rsv-actions">
            <button type="button" className="rsv-btn rsv-btn-ghost" onClick={goBack} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="rsv-btn" disabled={saving || activeTypes.length === 0}>
              {saving ? "Saving…" : "Create reservation"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
