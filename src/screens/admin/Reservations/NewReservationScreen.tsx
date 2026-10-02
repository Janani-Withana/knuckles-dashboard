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
import {
  BOOKING_GUEST_TYPES,
  BOOKING_SOURCE_LABELS,
  BOOKING_TYPES,
  bookingGuestTypeNumber,
  parseBookingGuestType,
  type BookingCalendarUnit,
} from "../../../types/booking";
import { addDays, formatDate, isoDate, nightsBetween, overlapsStay } from "./bookingDates";
import "./reservations.css";

type GuestDraft = {
  existingUid: string;
  displayName: string;
  title: string;
  firstName: string;
  lastName: string;
  guestType: string;
  phone: string;
  email: string;
  nationalityCode: string;
  countryCode: string;
  identityNumber: string;
  notes: string;
};

type StayDraft = {
  bookingType: string;
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

const emptyGuest = (): GuestDraft => ({
  existingUid: "",
  displayName: "",
  title: "",
  firstName: "",
  lastName: "",
  guestType: "Single",
  phone: "",
  email: "",
  nationalityCode: "",
  countryCode: "",
  identityNumber: "",
  notes: "",
});

const emptyStay = (currency = "LKR"): StayDraft => {
  const checkInDate = isoDate(new Date());
  return {
    bookingType: "",
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

const guestName = (guest: Guest) =>
  guest.displayName || [guest.firstName, guest.lastName].filter(Boolean).join(" ") || "Guest";

export default function NewReservationScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const navigate = useNavigate();

  const [, setGuests] = useState<Guest[]>([]);
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [units, setUnits] = useState<BookingCalendarUnit[]>([]);
  const [calendarError, setCalendarError] = useState("");
  const [guestDraft, setGuestDraft] = useState<GuestDraft>(emptyGuest);
  const [stay, setStay] = useState<StayDraft>(emptyStay);
  const [leadGuest, setLeadGuest] = useState<Guest | null>(null);
  const [step, setStep] = useState<"guest" | "stay">("guest");
  const [loading, setLoading] = useState(true);
  const [savingGuest, setSavingGuest] = useState(false);
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
        const activeTypes = nextTypes.filter((type) => type.isActive);
        setGuests(nextGuests.filter((guest) => guest.isActive));
        setTypes(nextTypes);
        setStay((current) => ({
          ...current,
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
          setStay((current) => ({ ...current, currency: property.defaultCurrency }));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [propertyUid]);

  useEffect(() => {
    if (!propertyUid || stay.checkOutDate <= stay.checkInDate) {
      setUnits([]);
      return;
    }
    let active = true;
    setCalendarError("");
    getBookingCalendar(
      propertyUid,
      stay.checkInDate,
      stay.checkOutDate,
      stay.accommodationTypeUid || undefined,
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
  }, [propertyUid, stay.checkInDate, stay.checkOutDate, stay.accommodationTypeUid]);

  const nights = nightsBetween(stay.checkInDate, stay.checkOutDate);
  const unitRate = amount(stay.unitRate);
  const quoted =
    nights > 0 && unitRate !== undefined
      ? stay.pricingBasis === "3"
        ? unitRate
        : unitRate * nights
      : null;

  const unitState = useMemo(() => {
    return units.map((unit) => {
      const hit = unit.segments.find((segment) =>
        overlapsStay(segment.startDate, segment.endDate, stay.checkInDate, stay.checkOutDate),
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
  }, [units, stay.checkInDate, stay.checkOutDate]);

  const onGuestChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    const next =
      name === "nationalityCode" || name === "countryCode" ? value.toUpperCase() : value;
    setGuestDraft((current) => ({ ...current, [name]: next }));
  };

  const onStayChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setStay((current) => {
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

  const onCreateGuest = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid) return;
    setError("");

    const firstName = guestDraft.firstName.trim();
    const lastName = guestDraft.lastName.trim();
    const displayName = guestDraft.displayName.trim() || [firstName, lastName].filter(Boolean).join(" ");
    const email = guestDraft.email.trim();
    const nationalityCode = guestDraft.nationalityCode.trim();
    const countryCode = guestDraft.countryCode.trim();
    if (!displayName) return setError("Enter a display name, or a first and last name.");
    if (email && !email.includes("@")) return setError("Email needs an @ sign.");
    if (nationalityCode && nationalityCode.length !== 2) return setError("Nationality must be a 2-letter code.");
    if (countryCode && countryCode.length !== 2) return setError("Country must be a 2-letter code.");
    if (!parseBookingGuestType(guestDraft.guestType)) return setError("Choose a guest type.");

    setSavingGuest(true);
    try {
      const guest = await createGuest(propertyUid, {
        displayName,
        firstName: firstName || null,
        lastName: lastName || null,
        title: guestDraft.title.trim() || null,
        guestType: bookingGuestTypeNumber(guestDraft.guestType),
        phone: guestDraft.phone.trim() || null,
        email: email || null,
        nationalityCode: nationalityCode || null,
        countryCode: countryCode || null,
        identityNumber: guestDraft.identityNumber.trim() || null,
        notes: guestDraft.notes.trim() || null,
      });
      const saved: Guest = {
        ...guest,
        displayName: guest.displayName || displayName,
        firstName: guest.firstName || firstName,
        lastName: guest.lastName || lastName,
        title: guest.title || guestDraft.title.trim(),
        phone: guest.phone || guestDraft.phone.trim(),
        email: guest.email || email,
        nationalityCode: guest.nationalityCode || nationalityCode,
        countryCode: guest.countryCode || countryCode,
        identityNumber: guest.identityNumber || guestDraft.identityNumber.trim(),
        guestType: bookingGuestTypeNumber(guestDraft.guestType),
      };
      setLeadGuest(saved);
      setGuests((current) => [saved, ...current.filter((item) => item.uid !== saved.uid)]);
      setStep("stay");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this guest.");
    } finally {
      setSavingGuest(false);
    }
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid || !leadGuest?.uid) return;
    setError("");

    const adults = whole(stay.adults);
    const children = whole(stay.children);
    const infants = whole(stay.infants);
    const rate = amount(stay.unitRate);
    const currency = stay.currency.trim().toUpperCase();
    if (stay.checkOutDate <= stay.checkInDate) {
      return setError("Check-out must be after check-in.");
    }
    if (adults === undefined || adults < 1) return setError("Adults must be at least 1.");
    if (children === undefined || infants === undefined) {
      return setError("Children and infants must be zero or more.");
    }
    if (currency.length !== 3) return setError("Currency must be a 3-letter code.");
    if (!stay.accommodationTypeUid) return setError("Choose an accommodation type.");
    if (rate === undefined) return setError("Enter a unit rate of zero or more.");
    const chosen = unitState.find((item) => item.unit.unitUid === stay.unitUid);
    if (chosen?.reason) return setError(`That room is ${chosen.reason} for these dates.`);

    setSaving(true);
    try {
      const booking = await createBooking(propertyUid, {
        leadGuestUid: leadGuest.uid,
        guestType: parseBookingGuestType(leadGuest.guestType) || "Single",
        bookingType: stay.bookingType || null,
        bookingSource: Number(stay.bookingSource),
        checkInDate: stay.checkInDate,
        checkOutDate: stay.checkOutDate,
        adults,
        children,
        infants,
        currency,
        specialRequests: stay.specialRequests.trim() || null,
        units: [
          {
            accommodationTypeUid: stay.accommodationTypeUid,
            unitUid: stay.unitUid || null,
            pricingBasis: Number(stay.pricingBasis),
            unitRate: rate,
            adults,
            children,
            unitQuantity: 1,
            guestCount: adults + children,
          },
        ],
      });
      navigate(ROUTES.ADMIN_RESERVATIONS, {
        state: { notice: `${booking.bookingNumber || "Booking"} created for ${guestName(leadGuest)}.` },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create this reservation.");
      setSaving(false);
    }
  };

  const activeTypes = types.filter((type) => type.isActive);
  const guestType = leadGuest ? parseBookingGuestType(leadGuest.guestType) || "Single" : "";
  const guestFacts = leadGuest
    ? [
        guestType,
        leadGuest.phone,
        leadGuest.email,
        leadGuest.identityNumber,
        [leadGuest.nationalityCode, leadGuest.countryCode].filter(Boolean).join(" · "),
      ].filter(Boolean)
    : [];

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
            {step === "guest"
              ? "Create the guest first. The reservation is created with that guest."
              : "The booking is saved as pending. Check-out is the morning the room becomes free."}
          </p>
        </div>
        <ol className="rsv-steps">
          <li>
            <button
              type="button"
              className={step === "guest" ? "current" : "done"}
              onClick={() => setStep("guest")}
            >
              <span className="rsv-step-index">1</span>
              Guest
            </button>
          </li>
          <li>
            <button
              type="button"
              className={step === "stay" ? "current" : ""}
              disabled={!leadGuest}
              onClick={() => leadGuest && setStep("stay")}
            >
              <span className="rsv-step-index">2</span>
              Reservation
            </button>
          </li>
        </ol>
      </div>

      {!propertyUid && <p className="rsv-empty">This account is not assigned to a property.</p>}

      {propertyUid && loading && <p className="rsv-empty">Loading guests and room types…</p>}

      {propertyUid && !loading && step === "guest" && (
        <form className="rsv-form" onSubmit={onCreateGuest}>
          <h3>New guest</h3>
          <div className="rsv-grid">
            <label>
              Display name
              <input
                name="displayName"
                value={guestDraft.displayName}
                onChange={onGuestChange}
                maxLength={200}
                placeholder="Nimal Perera"
              />
            </label>
            <label>
              Guest type
              <select name="guestType" value={guestDraft.guestType} onChange={onGuestChange}>
                {BOOKING_GUEST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input name="title" value={guestDraft.title} onChange={onGuestChange} maxLength={20} placeholder="Mr" />
            </label>
            <label>
              First name
              <input name="firstName" value={guestDraft.firstName} onChange={onGuestChange} maxLength={100} />
            </label>
            <label>
              Last name
              <input name="lastName" value={guestDraft.lastName} onChange={onGuestChange} maxLength={100} />
            </label>
            <label>
              Phone
              <input name="phone" value={guestDraft.phone} onChange={onGuestChange} maxLength={30} />
            </label>
            <label>
              Email
              <input name="email" value={guestDraft.email} onChange={onGuestChange} maxLength={254} />
            </label>
            <label>
              NIC or passport
              <input
                name="identityNumber"
                value={guestDraft.identityNumber}
                onChange={onGuestChange}
                maxLength={50}
                placeholder="199012345678"
              />
            </label>
            <label>
              Nationality
              <input
                name="nationalityCode"
                value={guestDraft.nationalityCode}
                onChange={onGuestChange}
                maxLength={2}
                placeholder="LK"
              />
            </label>
            <label>
              Country
              <input
                name="countryCode"
                value={guestDraft.countryCode}
                onChange={onGuestChange}
                maxLength={2}
                placeholder="LK"
              />
            </label>
            <label className="rsv-span">
              Notes
              <textarea name="notes" rows={2} value={guestDraft.notes} onChange={onGuestChange} />
            </label>
          </div>
          {error && <p className="rsv-error">{error}</p>}
          <div className="rsv-actions">
            <button type="button" className="rsv-btn rsv-btn-ghost" onClick={goBack} disabled={savingGuest}>
              Cancel
            </button>
            <button type="submit" className="rsv-btn" disabled={savingGuest}>
              {savingGuest ? "Saving guest…" : "Save guest and continue"}
            </button>
          </div>

          {/* {guests.length > 0 && (
            <>
              <p className="rsv-divider">or use an existing guest</p>
              <div className="rsv-grid">
                <label>
                  Guest
                  <select name="existingUid" value={guestDraft.existingUid} onChange={onGuestChange}>
                    <option value="">Select a guest</option>
                    {guests.map((guest) => (
                      <option key={guest.uid} value={guest.uid}>
                        {guestName(guest)}
                        {guest.phone ? ` · ${guest.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="rsv-actions">
                <button type="button" className="rsv-btn rsv-btn-ghost" onClick={useExistingGuest}>
                  Continue with this guest
                </button>
              </div>
            </>
          )} */}
        </form>
      )}

      {propertyUid && !loading && step === "stay" && leadGuest && (
        <form className="rsv-form" onSubmit={onSave}>
          <article className="rsv-guest-card">
            <div>
              {/* <p className="rsv-guest-kicker">Lead guest</p> */}
              <h3>{guestName(leadGuest)}</h3>
              {guestFacts.length > 0 && (
                <ul className="rsv-guest-facts">
                  {guestFacts.map((fact) => (
                    <li key={fact}>
                      <strong>{fact}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              className="rsv-btn rsv-btn-ghost"
              onClick={() => setStep("guest")}
              disabled={saving}
            >
              Change guest
            </button>
          </article>

          <h3>Stay</h3>
          <div className="rsv-grid">
            <label>
              Check-in
              <input name="checkInDate" type="date" value={stay.checkInDate} onChange={onStayChange} required />
            </label>
            <label>
              Check-out
              <input name="checkOutDate" type="date" value={stay.checkOutDate} onChange={onStayChange} required />
            </label>
            <label>
              Booking type
              <select name="bookingType" value={stay.bookingType} onChange={onStayChange}>
                <option value="">None</option>
                {BOOKING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Source
              <select name="bookingSource" value={stay.bookingSource} onChange={onStayChange}>
                {Object.entries(BOOKING_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Adults
              <input name="adults" type="number" min={1} step={1} value={stay.adults} onChange={onStayChange} />
            </label>
            <label>
              Children
              <input name="children" type="number" min={0} step={1} value={stay.children} onChange={onStayChange} />
            </label>
            <label>
              Infants
              <input name="infants" type="number" min={0} step={1} value={stay.infants} onChange={onStayChange} />
            </label>
            <label>
              Currency
              <input name="currency" value={stay.currency} onChange={onStayChange} maxLength={3} />
            </label>
            <label className="rsv-span">
              Special requests
              <textarea
                name="specialRequests"
                rows={2}
                value={stay.specialRequests}
                onChange={onStayChange}
                placeholder="Late arrival"
              />
            </label>
          </div>

          <h3>Room</h3>
          <div className="rsv-grid">
            <label>
              Accommodation type
              <select name="accommodationTypeUid" value={stay.accommodationTypeUid} onChange={onStayChange}>
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
              <select name="unitUid" value={stay.unitUid} onChange={onStayChange}>
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
              <select name="pricingBasis" value={stay.pricingBasis} onChange={onStayChange}>
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
                value={stay.unitRate}
                onChange={onStayChange}
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
                    : `${quoted.toLocaleString()} ${stay.currency || "LKR"} · ${formatDate(stay.checkInDate)} – ${formatDate(stay.checkOutDate)}`
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
