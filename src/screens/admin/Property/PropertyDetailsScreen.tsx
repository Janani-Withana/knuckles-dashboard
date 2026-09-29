import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import {
  getProperty,
  updateProperty,
} from "../../../services/superAdmin/propertyService.service";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  propertyStatusLabel,
  propertyTypeLabel,
  type Property,
} from "../../../types/superAdmin/property";
import "./PropertyDetailsScreen.css";

const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "AUD", "INR"];

const formatWhen = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

type Draft = {
  name: string;
  propertyType: string;
  description: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;
  countryCode: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  timezone: string;
  defaultCurrency: string;
  status: string;
};

const draftFrom = (property: Property): Draft => ({
  name: property.name,
  propertyType: String(property.propertyType),
  description: property.description,
  addressLine1: property.addressLine1,
  addressLine2: property.addressLine2,
  city: property.city,
  district: property.district,
  province: property.province,
  postalCode: property.postalCode,
  countryCode: property.countryCode,
  latitude: property.latitude === null ? "" : String(property.latitude),
  longitude: property.longitude === null ? "" : String(property.longitude),
  phone: property.phone,
  email: property.email,
  timezone: property.timezone,
  defaultCurrency: property.defaultCurrency,
  status: String(property.status),
});

export default function PropertyDetailsScreen() {
  const { user } = useAuth();
  const propertyUid = user?.propertyUid || user?.propertyUids?.[0] || "";

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!propertyUid) {
      setLoading(false);
      setProperty(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const next = await getProperty(propertyUid);
        if (!cancelled) {
          setProperty(next);
          setDraft(draftFrom(next));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this property.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [propertyUid, tick]);

  const startEdit = () => {
    if (!property) return;
    setDraft(draftFrom(property));
    setSaveError("");
    setSaved("");
    setEditing(true);
  };

  const cancelEdit = () => {
    if (property) setDraft(draftFrom(property));
    setSaveError("");
    setEditing(false);
  };

  const onChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setDraft((current) => (current ? { ...current, [name]: value } : current));
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !propertyUid) return;
    setSaveError("");
    setSaved("");
    if (!draft.name.trim()) return setSaveError("Enter the property name.");
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email.trim())) {
      return setSaveError("Enter a valid email address.");
    }
    const latitude = draft.latitude.trim() ? Number(draft.latitude) : null;
    const longitude = draft.longitude.trim() ? Number(draft.longitude) : null;
    if (latitude !== null && Number.isNaN(latitude)) {
      return setSaveError("Latitude must be a number.");
    }
    if (longitude !== null && Number.isNaN(longitude)) {
      return setSaveError("Longitude must be a number.");
    }

    setSaving(true);
    try {
      await updateProperty(propertyUid, {
        name: draft.name.trim(),
        propertyType: Number(draft.propertyType),
        description: draft.description.trim(),
        addressLine1: draft.addressLine1.trim(),
        addressLine2: draft.addressLine2.trim() || null,
        city: draft.city.trim(),
        district: draft.district.trim(),
        province: draft.province.trim(),
        postalCode: draft.postalCode.trim(),
        countryCode: draft.countryCode.trim().toUpperCase(),
        latitude,
        longitude,
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        timezone: draft.timezone.trim(),
        defaultCurrency: draft.defaultCurrency,
        status: Number(draft.status),
      });
      const next = await getProperty(propertyUid);
      setProperty(next);
      setDraft(draftFrom(next));
      setEditing(false);
      setSaved("Property updated.");
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Could not update the property.",
      );
    } finally {
      setSaving(false);
    }
  };

  const facts: [string, string][] = property
    ? [
        ["Code", property.code],
        ["Slug", property.slug],
        ["Type", propertyTypeLabel(property.propertyType)],
        [
          "Address",
          [property.addressLine1, property.addressLine2]
            .filter(Boolean)
            .join(", "),
        ],
        ["City", property.city],
        ["District", property.district],
        ["Province", property.province],
        ["Postal code", property.postalCode],
        ["Country", property.countryCode],
        ["Phone", property.phone],
        ["Email", property.email],
        ["Timezone", property.timezone],
        ["Currency", property.defaultCurrency],
        [
          "Coordinates",
          property.latitude === null && property.longitude === null
            ? ""
            : `${property.latitude ?? "—"}, ${property.longitude ?? "—"}`,
        ],
        ["Created", formatWhen(property.creationDate)],
      ]
    : [];

  return (
    <div className="pd-page">
      {!propertyUid && (
        <p className="pd-empty">This account is not assigned to a property.</p>
      )}
      {propertyUid && loading && <PageLoading />}
      {propertyUid && !loading && error && (
        <PageError message={error} onRetry={() => setTick((t) => t + 1)} />
      )}

      {!loading && !error && property && draft && (
        <>
          <header className="pd-hero">
            <div>
              <p className="pd-kicker">Your property</p>
              <h1>{property.name}</h1>
              {property.description && <p>{property.description}</p>}
              <div className="pd-chips">
                {property.code && <span>{property.code}</span>}
                <span>{propertyTypeLabel(property.propertyType)}</span>
                {property.city && <span>{property.city}</span>}
              </div>
            </div>
            <div className="pd-hero-actions">
              <span className={`pd-status ${property.status === 1 ? "on" : ""}`}>
                {propertyStatusLabel(property.status)}
              </span>
              {!editing && (
                <button type="button" className="pd-edit" onClick={startEdit}>
                  Edit property
                </button>
              )}
            </div>
          </header>

          {editing ? (
            <form className="pd-panel" onSubmit={onSave}>
              <h2>Edit property</h2>
              <div className="pd-form-grid">
                <label>
                  Name
                  <input name="name" value={draft.name} onChange={onChange} />
                </label>
                <label>
                  Type
                  <select
                    name="propertyType"
                    value={draft.propertyType}
                    onChange={onChange}
                  >
                    {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select name="status" value={draft.status} onChange={onChange}>
                    {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Currency
                  <select
                    name="defaultCurrency"
                    value={draft.defaultCurrency}
                    onChange={onChange}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency}>{currency}</option>
                    ))}
                  </select>
                </label>
                <label className="pd-span">
                  Description
                  <textarea
                    name="description"
                    rows={3}
                    value={draft.description}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Address
                  <input
                    name="addressLine1"
                    value={draft.addressLine1}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Address line 2
                  <input
                    name="addressLine2"
                    value={draft.addressLine2}
                    onChange={onChange}
                  />
                </label>
                <label>
                  City
                  <input name="city" value={draft.city} onChange={onChange} />
                </label>
                <label>
                  District
                  <input
                    name="district"
                    value={draft.district}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Province
                  <input
                    name="province"
                    value={draft.province}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Postal code
                  <input
                    name="postalCode"
                    value={draft.postalCode}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Country
                  <input
                    name="countryCode"
                    value={draft.countryCode}
                    onChange={onChange}
                    maxLength={2}
                  />
                </label>
                <label>
                  Phone
                  <input name="phone" value={draft.phone} onChange={onChange} />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    value={draft.email}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Timezone
                  <input
                    name="timezone"
                    value={draft.timezone}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Latitude
                  <input
                    name="latitude"
                    value={draft.latitude}
                    onChange={onChange}
                    inputMode="decimal"
                  />
                </label>
                <label>
                  Longitude
                  <input
                    name="longitude"
                    value={draft.longitude}
                    onChange={onChange}
                    inputMode="decimal"
                  />
                </label>
              </div>
              {saveError && <p className="pd-error">{saveError}</p>}
              <div className="pd-form-actions">
                <button
                  type="button"
                  className="pd-ghost"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="pd-save" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <section className="pd-panel">
              <h2>Details</h2>
              {saved && <p className="pd-saved">{saved}</p>}
              <dl className="pd-facts">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </>
      )}
    </div>
  );
}
