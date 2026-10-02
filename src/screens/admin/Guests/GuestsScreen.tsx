import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { adminReservationPath } from "../../../routes/paths";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import {
  createGuest,
  getGuest,
  getGuestBookingHistory,
  GUEST_TYPE_LABELS,
  guestTypeLabel,
  listGuests,
  updateGuest,
  type Guest,
  type GuestStay,
} from "../../../services/admin/guestService.service";
import { bookingStatusLabel } from "../../../types/booking";
import { formatDate, isoDate } from "../Reservations/bookingDates";
import "./GuestsScreen.css";

type Draft = {
  displayName: string;
  firstName: string;
  lastName: string;
  title: string;
  guestType: string;
  phone: string;
  alternatePhone: string;
  email: string;
  nationalityCode: string;
  dateOfBirth: string;
  preferredLanguage: string;
  address: string;
  city: string;
  countryCode: string;
  identityNumber: string;
  notes: string;
  isActive: boolean;
};

const emptyDraft = (): Draft => ({
  displayName: "",
  firstName: "",
  lastName: "",
  title: "",
  guestType: "0",
  phone: "",
  alternatePhone: "",
  email: "",
  nationalityCode: "",
  dateOfBirth: "",
  preferredLanguage: "",
  address: "",
  city: "",
  countryCode: "",
  identityNumber: "",
  notes: "",
  isActive: true,
});

const draftFrom = (guest: Guest): Draft => ({
  displayName: guest.displayName,
  firstName: guest.firstName,
  lastName: guest.lastName,
  title: guest.title,
  guestType: String(guest.guestType),
  phone: guest.phone,
  alternatePhone: guest.alternatePhone,
  email: guest.email,
  nationalityCode: guest.nationalityCode,
  dateOfBirth: guest.dateOfBirth,
  preferredLanguage: guest.preferredLanguage,
  address: guest.address,
  city: guest.city,
  countryCode: guest.countryCode,
  identityNumber: guest.identityNumber,
  notes: guest.notes,
  isActive: guest.isActive,
});

const payloadFrom = (draft: Draft) => ({
  displayName: draft.displayName.trim(),
  firstName: draft.firstName.trim() || null,
  lastName: draft.lastName.trim() || null,
  title: draft.title.trim() || null,
  guestType: Number(draft.guestType),
  phone: draft.phone.trim() || null,
  alternatePhone: draft.alternatePhone.trim() || null,
  email: draft.email.trim() || null,
  nationalityCode: draft.nationalityCode.trim() || null,
  dateOfBirth: draft.dateOfBirth || null,
  preferredLanguage: draft.preferredLanguage.trim() || null,
  address: draft.address.trim() || null,
  city: draft.city.trim() || null,
  countryCode: draft.countryCode.trim() || null,
  identityNumber: draft.identityNumber.trim() || null,
  notes: draft.notes.trim() || null,
  isActive: draft.isActive,
});

export default function GuestsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";
  const editorTitleId = useId();
  const profileTitleId = useId();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);

  const [editor, setEditor] = useState<"create" | string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [profile, setProfile] = useState<Guest | null>(null);
  const [stays, setStays] = useState<GuestStay[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    const handle = window.setTimeout(() => {
      listGuests(propertyUid, query)
        .then((next) => {
          if (active) setGuests(next);
        })
        .catch((err: unknown) => {
          if (active) setError(err instanceof ApiError ? err.message : "Could not load guests.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, query.trim() ? 250 : 0);
    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [propertyUid, query, tick]);

  useEffect(() => {
    if (!editor && !profile) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || saving || editorLoading) return;
      setEditor(null);
      setProfile(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, profile, saving, editorLoading]);

  const openCreate = () => {
    setNotice("");
    setSaveError("");
    setProfile(null);
    setDraft(emptyDraft());
    setEditor("create");
  };

  const openEdit = (uid: string) => {
    setNotice("");
    setSaveError("");
    setProfile(null);
    setDraft(null);
    setEditor(uid);
    setEditorLoading(true);
    getGuest(uid)
      .then((guest) => setDraft(draftFrom(guest)))
      .catch((err: unknown) => {
        setSaveError(err instanceof ApiError ? err.message : "Could not load this guest.");
      })
      .finally(() => setEditorLoading(false));
  };

  const openProfile = (uid: string) => {
    setNotice("");
    setEditor(null);
    setProfileError("");
    setStays([]);
    setProfileLoading(true);
    setProfile({ ...emptyGuest(), uid });
    Promise.all([getGuest(uid), getGuestBookingHistory(uid).catch(() => [] as GuestStay[])])
      .then(([guest, history]) => {
        setProfile(guest);
        setStays(history);
      })
      .catch((err: unknown) => {
        setProfile(null);
        setProfileError(err instanceof ApiError ? err.message : "Could not load this guest.");
      })
      .finally(() => setProfileLoading(false));
  };

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const next =
      type === "checkbox" && event.target instanceof HTMLInputElement
        ? event.target.checked
        : name === "nationalityCode" || name === "countryCode"
          ? value.toUpperCase()
          : value;
    setDraft((current) => (current ? { ...current, [name]: next } : current));
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!propertyUid || !editor || !draft) return;
    setSaveError("");

    const payload = payloadFrom(draft);
    if (!payload.displayName && !(payload.firstName && payload.lastName)) {
      return setSaveError("Enter a display name, or a first and last name.");
    }
    if (payload.email && !payload.email.includes("@")) return setSaveError("Email needs an @ sign.");
    if (payload.nationalityCode && payload.nationalityCode.length !== 2) {
      return setSaveError("Nationality must be a 2-letter code.");
    }
    if (payload.countryCode && payload.countryCode.length !== 2) {
      return setSaveError("Country must be a 2-letter code.");
    }
    if (payload.dateOfBirth && payload.dateOfBirth > isoDate(new Date())) {
      return setSaveError("Date of birth cannot be in the future.");
    }

    setSaving(true);
    try {
      if (editor === "create") {
        await createGuest(propertyUid, payload);
        setNotice(`${payload.displayName || payload.firstName} added.`);
      } else {
        await updateGuest(editor, payload);
        setNotice(`${payload.displayName || payload.firstName} updated.`);
      }
      setEditor(null);
      setTick((n) => n + 1);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : editor === "create"
            ? "Could not add this guest."
            : "Could not update this guest.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gs-page">
      {!propertyUid && <p className="gs-empty-note">This account is not assigned to a property.</p>}

      {propertyUid && (
        <header className="gs-hero">
          <div>
            <p className="gs-kicker">Guests</p>
            <h1>Guests</h1>
            <p>People who stay at the property. A booking needs one of them as the lead guest.</p>
          </div>
          <button type="button" className="at-add" onClick={openCreate} disabled={loading || !!error}>
            Add guest
          </button>
        </header>
      )}

      {propertyUid && loading && guests.length === 0 && <PageLoading />}
      {propertyUid && error && <PageError message={error} onRetry={() => setTick((n) => n + 1)} />}

      {propertyUid && !error && (
        <>
          {notice && <p className="gs-notice">{notice}</p>}
          <input
            className="gs-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, phone, or email"
          />

          {!loading && guests.length === 0 ? (
            <div className="gs-blank">
              <h2>{query.trim() ? "No matches" : "No guests yet"}</h2>
              <p>
                {query.trim()
                  ? "Try another name, phone, or email."
                  : "Add the first guest so a reservation can name a lead guest."}
              </p>
            </div>
          ) : (
            <div className="gs-table-wrap">
              <table className="gs-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Type</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>ID</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest.uid}>
                      <td>{guest.displayName || "Guest"}</td>
                      <td>{guestTypeLabel(guest.guestType)}</td>
                      <td>{guest.phone || "—"}</td>
                      <td>{guest.email || "—"}</td>
                      <td>{guest.identityNumber || "—"}</td>
                      <td>{[guest.city, guest.countryCode].filter(Boolean).join(", ") || "—"}</td>
                      <td>
                        <span className={`gs-badge ${guest.isActive ? "" : "off"}`}>
                          {guest.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="gs-row-actions">
                        <button type="button" className="gs-text" onClick={() => openProfile(guest.uid)}>
                          Stays
                        </button>
                        <button type="button" className="gs-text" onClick={() => openEdit(guest.uid)}>
                          Edit
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

      {editor &&
        createPortal(
          <div className="gs-backdrop" onClick={() => !saving && !editorLoading && setEditor(null)}>
            <div
              className="gs-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={editorTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="gs-dialog-head">
                <h2 id={editorTitleId}>{editor === "create" ? "New guest" : "Edit guest"}</h2>
                <button
                  type="button"
                  className="gs-close"
                  aria-label="Close"
                  onClick={() => !saving && !editorLoading && setEditor(null)}
                >
                  ×
                </button>
              </div>
              {editorLoading && <p className="gs-hint">Loading this guest…</p>}
              {!editorLoading && !draft && saveError && <p className="gs-error">{saveError}</p>}
              {!editorLoading && draft && (
                <form className="gs-form" onSubmit={onSave}>
                  <label>
                    Display name
                    <input name="displayName" value={draft.displayName} onChange={onChange} maxLength={200} />
                  </label>
                  <label>
                    Type
                    <select name="guestType" value={draft.guestType} onChange={onChange}>
                      {Object.entries(GUEST_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Title
                    <input name="title" value={draft.title} onChange={onChange} maxLength={20} placeholder="Mr" />
                  </label>
                  <label>
                    First name
                    <input name="firstName" value={draft.firstName} onChange={onChange} maxLength={100} />
                  </label>
                  <label>
                    Last name
                    <input name="lastName" value={draft.lastName} onChange={onChange} maxLength={100} />
                  </label>
                  <label>
                    Phone
                    <input name="phone" value={draft.phone} onChange={onChange} maxLength={30} />
                  </label>
                  <label>
                    Other phone
                    <input name="alternatePhone" value={draft.alternatePhone} onChange={onChange} maxLength={30} />
                  </label>
                  <label>
                    Email
                    <input name="email" value={draft.email} onChange={onChange} maxLength={254} />
                  </label>
                  <label>
                    NIC or passport
                    <input
                      name="identityNumber"
                      value={draft.identityNumber}
                      onChange={onChange}
                      maxLength={50}
                      placeholder="199012345678"
                    />
                  </label>
                  <label>
                    Date of birth
                    <input name="dateOfBirth" type="date" value={draft.dateOfBirth} onChange={onChange} />
                  </label>
                  <label>
                    Nationality
                    <input
                      name="nationalityCode"
                      value={draft.nationalityCode}
                      onChange={onChange}
                      maxLength={2}
                      placeholder="LK"
                    />
                  </label>
                  <label>
                    Language
                    <input
                      name="preferredLanguage"
                      value={draft.preferredLanguage}
                      onChange={onChange}
                      maxLength={10}
                      placeholder="en"
                    />
                  </label>
                  <label>
                    City
                    <input name="city" value={draft.city} onChange={onChange} maxLength={100} />
                  </label>
                  <label>
                    Country
                    <input
                      name="countryCode"
                      value={draft.countryCode}
                      onChange={onChange}
                      maxLength={2}
                      placeholder="LK"
                    />
                  </label>
                  <label className="gs-span">
                    Address
                    <input name="address" value={draft.address} onChange={onChange} maxLength={2000} />
                  </label>
                  <label className="gs-span">
                    Notes
                    <textarea name="notes" rows={2} value={draft.notes} onChange={onChange} />
                  </label>
                  {editor !== "create" && (
                    <label className="gs-switch">
                      <input name="isActive" type="checkbox" checked={draft.isActive} onChange={onChange} />
                      Active
                    </label>
                  )}
                  {saveError && <p className="gs-error">{saveError}</p>}
                  <div className="gs-form-actions">
                    <button type="button" className="gs-ghost" onClick={() => setEditor(null)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className="gs-save" disabled={saving}>
                      {saving ? "Saving…" : editor === "create" ? "Add guest" : "Save changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}

      {(profile || profileError) &&
        createPortal(
          <div className="gs-backdrop" onClick={() => !profileLoading && setProfile(null)}>
            <div
              className="gs-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={profileTitleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="gs-dialog-head">
                <h2 id={profileTitleId}>{profile?.displayName || "Guest"}</h2>
                <button type="button" className="gs-close" aria-label="Close" onClick={() => setProfile(null)}>
                  ×
                </button>
              </div>
              {profileLoading && <p className="gs-hint">Loading stays…</p>}
              {profileError && <p className="gs-error">{profileError}</p>}
              {profile && !profileLoading && (
                <>
                  <p className="gs-hint">
                    {[guestTypeLabel(profile.guestType), profile.phone, profile.email, profile.identityNumber]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {stays.length === 0 ? (
                    <p className="gs-hint">No stays yet.</p>
                  ) : (
                    <ul className="gs-stays">
                      {stays.map((stay) => (
                        <li key={stay.bookingUid}>
                          <button
                            type="button"
                            className="gs-stay"
                            disabled={!stay.bookingUid}
                            onClick={() => navigate(adminReservationPath(stay.bookingUid))}
                          >
                            <strong>{stay.bookingNumber || "Booking"}</strong>
                            <span>
                              {formatDate(stay.checkInDate)} – {formatDate(stay.checkOutDate)}
                            </span>
                            <em>
                              {bookingStatusLabel(stay.status)}
                              {stay.isLeadGuest ? " · Lead guest" : ""}
                            </em>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              <div className="gs-form-actions">
                <button type="button" className="gs-ghost" onClick={() => setProfile(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function emptyGuest(): Guest {
  return {
    uid: "",
    guestType: 0,
    title: "",
    firstName: "",
    lastName: "",
    displayName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    nationalityCode: "",
    dateOfBirth: "",
    preferredLanguage: "",
    address: "",
    city: "",
    countryCode: "",
    identityNumber: "",
    notes: "",
    isActive: true,
  };
}