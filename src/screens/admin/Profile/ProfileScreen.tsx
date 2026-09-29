import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, KeyRound, Mail, Shield, UserRound } from "lucide-react";
import ResetPasswordDialog from "../../../components/layout/ResetPasswordDialog";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { ROUTES } from "../../../routes/paths";
import { listMyProperties } from "../../../services/superAdmin/propertyService.service";
import type { Property } from "../../../types/superAdmin/property";
import "./ProfileScreen.css";

const roleLabel = (role: string) =>
  role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const initialsFor = (name: string, email: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase() || "AD";
};

export default function ProfileScreen() {
  const { user } = useAuth();
  const name = user?.fullName?.trim() || "Admin";
  const email = user?.email || "";
  const roles = user?.roles?.length
    ? user.roles
    : user?.role === "PropertyAdmin"
      ? ["HOTEL_ADMIN"]
      : [];

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listMyProperties()
      .then((list) => {
        if (!cancelled) setProperties(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load your properties.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackIds = user?.propertyUids?.length
    ? user.propertyUids
    : user?.propertyUid
      ? [user.propertyUid]
      : [];

  return (
    <div className="profile-page">
      <Link className="profile-back" to={ROUTES.ADMIN_DASHBOARD}>
        ← Back to dashboard
      </Link>

      <section className="profile-card">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">
            {initialsFor(name, email)}
          </div>
          <div>
            <p className="profile-kicker">Your account</p>
            <h1>{name}</h1>
            <p className="profile-email">{email}</p>
          </div>
        </div>
        <button
          type="button"
          className="profile-reset"
          onClick={() => setResetOpen(true)}
        >
          <KeyRound size={16} />
          Reset password
        </button>
      </section>

      <section className="profile-grid">
        <article className="profile-panel">
          <h2>Account</h2>
          <dl>
            <div>
              <dt>
                <UserRound size={16} /> Name
              </dt>
              <dd>{name}</dd>
            </div>
            <div>
              <dt>
                <Mail size={16} /> Email
              </dt>
              <dd>{email || "—"}</dd>
            </div>
            <div>
              <dt>
                <Shield size={16} /> Role
              </dt>
              <dd>
                {roles.length ? (
                  <span className="profile-roles">
                    {roles.map((role) => (
                      <span key={role}>{roleLabel(role)}</span>
                    ))}
                  </span>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article className="profile-panel">
          <h2>Properties</h2>
          {loading && <p className="profile-muted">Loading properties…</p>}
          {!loading && error && properties.length === 0 && (
            <>
              <p className="profile-error">{error}</p>
              {fallbackIds.map((uid) => (
                <div className="profile-property" key={uid}>
                  <Building2 size={18} />
                  <div>
                    <strong>Assigned property</strong>
                    <span>{uid}</span>
                  </div>
                </div>
              ))}
            </>
          )}
          {!loading && !error && properties.length === 0 && (
            <p className="profile-muted">No properties are assigned yet.</p>
          )}
          {properties.map((property) => (
            <div className="profile-property" key={property.uid}>
              <Building2 size={18} />
              <div>
                <strong>{property.name || "Property"}</strong>
                <span>
                  {[property.city, property.code].filter(Boolean).join(" · ") ||
                    property.uid}
                </span>
              </div>
            </div>
          ))}
        </article>
      </section>

      {resetOpen && (
        <ResetPasswordDialog
          email={email}
          onClose={() => setResetOpen(false)}
        />
      )}
    </div>
  );
}
