import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../../lib/api";
import {
  superOrganizationPath,
  superPropertyPath,
} from "../../../routes/paths";
import { createProperty } from "../../../services/superAdmin/propertyService.service";
import { PROPERTY_TYPE_LABELS } from "../../../types/superAdmin/property";
import "../../admin/Reservations/reservations.css";
import "../superAdmin.css";

const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "AUD", "INR"];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Short unique code from the property name, sent with the create request. */
const generatePropertyCode = (name: string) => {
  const initials = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 6);
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${initials || "PRP"}-${suffix}`;
};

const empty = {
  name: "",
  slug: "",
  propertyType: "0",
  description: "",
  addressLine1: "",
  city: "",
  district: "",
  province: "",
  postalCode: "",
  countryCode: "LK",
  phone: "",
  email: "",
  timezone: "Asia/Colombo",
  defaultCurrency: "LKR",
};

export default function CreatePropertyScreen() {
  const { organizationUid = "" } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "slug") setSlugTouched(true);
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === "name" && !slugTouched ? { slug: slugify(value) } : {}),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Enter the property name.");
    if (!form.slug.trim()) return setError("Enter a slug.");
    if (!form.addressLine1.trim()) return setError("Enter the street address.");
    if (!form.city.trim()) return setError("Enter the city.");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      return setError("Enter a valid email address.");

    setLoading(true);
    try {
      const uid = await createProperty(organizationUid, {
        code: generatePropertyCode(form.name),
        name: form.name.trim(),
        slug: form.slug.trim(),
        propertyType: Number(form.propertyType),
        description: form.description.trim(),
        addressLine1: form.addressLine1.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        province: form.province.trim(),
        postalCode: form.postalCode.trim(),
        countryCode: form.countryCode.trim().toUpperCase(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        timezone: form.timezone.trim(),
        defaultCurrency: form.defaultCurrency,
      });
      // Property created → go register its admin
      navigate(
        uid ? superPropertyPath(uid) : superOrganizationPath(organizationUid),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create the property.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <Link
            className="rsv-back"
            to={superOrganizationPath(organizationUid)}
          >
            ← Back to organization
          </Link>
          <p className="rsv-eyebrow">Organization</p>
          <h2>New property</h2>
          <p className="rsv-sub">
            After saving, you'll register and invite this property's admin.
          </p>
        </div>
      </div>

      <form className="rsv-form" onSubmit={handleSubmit}>
        <h3>Basics</h3>
        <div className="rsv-grid">
          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ABC Hotel Colombo"
            />
          </label>
          <label>
            Slug
            <input name="slug" value={form.slug} onChange={handleChange} />
          </label>
          <label>
            Property type
            <select
              name="propertyType"
              value={form.propertyType}
              onChange={handleChange}
            >
              {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Description
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
          />
        </label>

        <h3>Location</h3>
        <div className="rsv-grid">
          <label>
            Address
            <input
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
            />
          </label>
          <label>
            City
            <input name="city" value={form.city} onChange={handleChange} />
          </label>
          <label>
            District
            <input
              name="district"
              value={form.district}
              onChange={handleChange}
            />
          </label>
          <label>
            Province
            <input
              name="province"
              value={form.province}
              onChange={handleChange}
            />
          </label>
          <label>
            Postal code
            <input
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
            />
          </label>
          <label>
            Country code
            <input
              name="countryCode"
              value={form.countryCode}
              onChange={handleChange}
              maxLength={2}
            />
          </label>
        </div>

        <h3>Contact & defaults</h3>
        <div className="rsv-grid">
          <label>
            Phone
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>
          <label>
            Timezone
            <input
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
            />
          </label>
          <label>
            Default currency
            <select
              name="defaultCurrency"
              value={form.defaultCurrency}
              onChange={handleChange}
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="rsv-error">{error}</p>}

        <div className="rsv-actions">
          <button
            type="button"
            className="rsv-btn rsv-btn-ghost"
            onClick={() => navigate(superOrganizationPath(organizationUid))}
          >
            Cancel
          </button>
          <button type="submit" className="rsv-btn" disabled={loading}>
            {loading ? "Creating…" : "Create property"}
          </button>
        </div>
      </form>
    </div>
  );
}
