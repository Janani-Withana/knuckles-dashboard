import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PageError } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { getPropertyAvailability } from "../../../services/admin/accommodationService.service";
import { unitKindLabel, type PropertyAvailability } from "../../../types/accommodation";
import { addDays, formatDate, isoDate, monthBounds, nightsBetween, parseIso } from "../Reservations/bookingDates";
import "./AvailabilityScreen.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const partyLabel = (adults: number, children: number) => {
  const parts = [`${adults} adult${adults === 1 ? "" : "s"}`];
  if (children) parts.push(`${children} child${children === 1 ? "" : "ren"}`);
  return parts.join(", ");
};

const stayError = (checkIn: string, checkOut: string, adults: string, children: string) => {
  if (!checkIn || !checkOut) return "Choose a check-in and a check-out.";
  if (checkOut <= checkIn) return "Check-out must be after check-in.";
  if (nightsBetween(checkIn, checkOut) > 365) return "A stay cannot be longer than 365 nights.";
  const adultCount = Number(adults);
  const childCount = Number(children);
  if (!Number.isInteger(adultCount) || adultCount < 1) return "Adults must be at least 1.";
  if (!Number.isInteger(childCount) || childCount < 0) return "Children cannot be negative.";
  return "";
};

export default function AvailabilityScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";

  const [checkIn, setCheckIn] = useState(() => isoDate(new Date()));
  const [checkOut, setCheckOut] = useState(() => addDays(isoDate(new Date()), 2));
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [month, setMonth] = useState(() => new Date());
  const [result, setResult] = useState<PropertyAvailability | null>(null);
  const [checking, setChecking] = useState(false);
  const [formError, setFormError] = useState("");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const bounds = useMemo(() => monthBounds(month), [month]);
  const lead = parseIso(bounds.from).getDay();

  useEffect(() => {
    if (!propertyUid) return;
    const problem = stayError(checkIn, checkOut, adults, children);
    if (problem) {
      setChecking(false);
      setFormError(checkOut ? problem : "");
      return;
    }
    let active = true;
    setChecking(true);
    setFormError("");
    setError("");
    getPropertyAvailability(propertyUid, checkIn, checkOut, Number(adults), Number(children))
      .then((next) => {
        if (active) setResult(next);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setResult(null);
        setError(err instanceof ApiError ? err.message : "Could not check availability.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [propertyUid, checkIn, checkOut, adults, children, tick]);

  const shiftMonth = (delta: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const pickDay = (day: string) => {
    setError("");
    if (!checkIn || checkOut) {
      setCheckIn(day);
      setCheckOut("");
      setResult(null);
      setMonth(parseIso(day));
      return;
    }
    if (day <= checkIn) {
      setCheckIn(day);
      setMonth(parseIso(day));
      return;
    }
    setCheckOut(day);
  };

  const onCheck = (event: FormEvent) => {
    event.preventDefault();
    const problem = stayError(checkIn, checkOut, adults, children);
    if (problem) {
      setFormError(problem);
      return;
    }
    if (checkIn) setMonth(parseIso(checkIn));
    setTick((n) => n + 1);
  };

  const nights = checkIn && checkOut && checkOut > checkIn ? nightsBetween(checkIn, checkOut) : 0;

  return (
    <div className="av-page">
      {!propertyUid && <p className="av-empty">This account is not assigned to a property.</p>}

      {propertyUid && (
        <header className="av-hero">
          <div>
            <p className="av-kicker">Accommodation</p>
            <h1>Availability</h1>
            <p>See which room types are free for a stay, and what that stay would cost.</p>
          </div>
        </header>
      )}

      {propertyUid && (
        <>
        <section className="av-panel">
          <div className="av-cal-head">
            <h2>Stay dates</h2>
            <div className="av-cal-tools">
              <button type="button" className="av-ghost" onClick={() => shiftMonth(-1)}>
                Previous
              </button>
              <strong>{bounds.label}</strong>
              <button type="button" className="av-ghost" onClick={() => shiftMonth(1)}>
                Next
              </button>
            </div>
          </div>
          <p className="av-note">
            Click the arrival day, then the morning the room is free. The last morning is not a night.
          </p>
          <div className="av-month">
            {WEEKDAYS.map((label) => (
              <span key={label} className="av-dow">
                {label}
              </span>
            ))}
            {Array.from({ length: lead }, (_, index) => (
              <span key={`pad-${index}`} />
            ))}
            {bounds.days.map((day) => {
              const start = day === checkIn;
              const end = day === checkOut;
              const inside = Boolean(checkIn && checkOut && day > checkIn && day < checkOut);
              return (
                <button
                  key={day}
                  type="button"
                  className={`av-day${start ? " start" : ""}${end ? " end" : ""}${inside ? " inside" : ""}`}
                  onClick={() => pickDay(day)}
                  aria-pressed={start || end || inside}
                  title={formatDate(day)}
                >
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>
          <ul className="av-legend">
            <li>
              <i className="start" /> Check-in
            </li>
            <li>
              <i className="inside" /> Night
            </li>
            <li>
              <i className="end" /> Check-out
            </li>
          </ul>
        </section>

        <section className="av-panel">
          <form className="av-form" onSubmit={onCheck}>
            <label>
              Check-in
              <input
                type="date"
                value={checkIn}
                onChange={(event) => {
                  setCheckIn(event.target.value);
                  if (event.target.value) setMonth(parseIso(event.target.value));
                }}
              />
            </label>
            <label>
              Check-out
              <input type="date" value={checkOut} min={checkIn || undefined} onChange={(event) => setCheckOut(event.target.value)} />
            </label>
            <label>
              Adults
              <input
                type="number"
                min={1}
                value={adults}
                onChange={(event) => setAdults(event.target.value)}
              />
            </label>
            <label>
              Children
              <input
                type="number"
                min={0}
                value={children}
                onChange={(event) => setChildren(event.target.value)}
              />
            </label>
            <button type="submit" className="av-check" disabled={checking}>
              {checking ? "Checking…" : "Check"}
            </button>
          </form>
          {formError && <p className="av-error">{formError}</p>}
          {nights > 0 && !formError && (
            <p className="av-note">
              {formatDate(checkIn)} – {formatDate(checkOut)} · {nights} night{nights === 1 ? "" : "s"} ·{" "}
              {partyLabel(Number(adults) || 0, Number(children) || 0)}
            </p>
          )}
          </section>
        </> 
      )}

      {propertyUid && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {propertyUid && !error && result && (
        <section className="av-panel">
          <div className="av-cal-head">
            <h2>Open for this stay</h2>
            <p className="av-note">
              {result.nights} night{result.nights === 1 ? "" : "s"} · {partyLabel(result.adults, result.children)} ·{" "}
              {result.currency}
            </p>
          </div>
          {result.items.length === 0 ? (
            <p className="av-empty">No room type fits that party for these dates.</p>
          ) : (
            <div className="av-table-wrap">
              <table className="av-table">
                <thead>
                  <tr>
                    <th>Room type</th>
                    <th>Kind</th>
                    <th>Fits</th>
                    <th>Free</th>
                    <th>Nightly</th>
                    <th>Stay total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => (
                    <tr key={item.accommodationTypeUid || item.code} className={item.availableUnits ? "" : "sold"}>
                      <td>
                        <strong>{item.name || "Room type"}</strong>
                        {item.code && <span>{item.code}</span>}
                      </td>
                      <td>{unitKindLabel(item.unitKind)}</td>
                      <td>
                        {item.maxAdults} adult{item.maxAdults === 1 ? "" : "s"}
                        {item.maxChildren ? `, ${item.maxChildren} children` : ""}
                        <span>Up to {item.maxOccupancy}</span>
                      </td>
                      <td>
                        {item.availableUnits} of {item.totalUnits}
                      </td>
                      <td>{money(item.baseRate, result.currency)}</td>
                      <td>{money(item.estimatedTotal, result.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
