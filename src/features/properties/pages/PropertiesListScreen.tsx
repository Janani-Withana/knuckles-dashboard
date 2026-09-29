import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { usePlatformData } from "../../../hooks/usePlatformData";
import { ROUTES, superPropertyPath } from "../../../routes/paths";
import {
  propertyStatusLabel,
  propertyTypeLabel,
} from "../../../types/superAdmin/property";
import "../../admin/Reservations/reservations.css";
import "../superAdmin.css";

export default function PropertiesListScreen() {
  const navigate = useNavigate();
  const { organizations, properties, loading, error, reload } =
    usePlatformData();
  const [query, setQuery] = useState("");

  const orgName = new Map(organizations.map((o) => [o.uid, o.name]));
  const q = query.trim().toLowerCase();
  const filtered = properties.filter((p) =>
    `${p.name} ${p.code} ${p.city} ${orgName.get(p.organizationUid) ?? ""}`
      .toLowerCase()
      .includes(q),
  );

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <p className="rsv-eyebrow">Platform</p>
          <h2>Properties</h2>
          <p className="rsv-sub">
            Every property across all organizations. New properties are created
            inside an organization.
          </p>
        </div>
        <button
          className="rsv-btn rsv-btn-ghost"
          onClick={() => navigate(ROUTES.SUPER_ORGANIZATIONS)}
        >
          Go to organizations
        </button>
      </div>

      <div className="sa-toolbar">
        <input
          className="sa-search"
          placeholder="Search by name, code, city or organization…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <PageLoading />}
      {!loading && error && <PageError message={error} onRetry={reload} />}

      {!loading && !error && filtered.length === 0 && (
        <p className="rsv-empty">
          {properties.length === 0
            ? "No properties yet. Open an organization to add one."
            : "No properties match your search."}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="rsv-table-wrap">
          <table className="rsv-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Organization</th>
                <th>City</th>
                <th>Type</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.uid}>
                  <td>{p.name}</td>
                  <td>{orgName.get(p.organizationUid) ?? "—"}</td>
                  <td>{p.city || "—"}</td>
                  <td>{propertyTypeLabel(p.propertyType)}</td>
                  <td>
                    <span
                      className={`sa-badge ${p.status === 1 ? "" : "sa-badge-muted"}`}
                    >
                      {propertyStatusLabel(p.status)}
                    </span>
                  </td>
                  <td>
                    <Link className="sa-link" to={superPropertyPath(p.uid)}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
