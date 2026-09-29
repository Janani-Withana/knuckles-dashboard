import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "@/components/common/PageState";
import { usePlatformOverview } from "@/features/platform/hooks/usePlatformOverview";
import { ROUTES, superPropertyPath } from "@/routes/paths";
import {
  propertyStatusLabel,
  propertyTypeLabel,
} from "@/types/property.types";
import { getApiErrorMessage } from "@/utils/errors";
import "@/styles/reservations.css";
import "@/styles/superAdmin.css";

export default function PropertiesListScreen() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = usePlatformOverview();
  const [query, setQuery] = useState("");

  const organizations = data?.organizations ?? [];
  const properties = data?.properties ?? [];
  const orgName = new Map(organizations.map((org) => [org.uid, org.name]));
  const q = query.trim().toLowerCase();
  const filtered = properties.filter((property) =>
    `${property.name} ${property.code} ${property.city} ${orgName.get(property.organizationUid) ?? ""}`
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

      {isLoading && <PageLoading />}
      {isError && (
        <PageError
          message={getApiErrorMessage(error, "Could not load properties.")}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className="rsv-empty">
          {properties.length === 0
            ? "No properties yet. Open an organization to add one."
            : "No properties match your search."}
        </p>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
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
              {filtered.map((property) => (
                <tr key={property.uid}>
                  <td>{property.name}</td>
                  <td>{orgName.get(property.organizationUid) ?? "—"}</td>
                  <td>{property.city || "—"}</td>
                  <td>{propertyTypeLabel(property.propertyType)}</td>
                  <td>
                    <span
                      className={`sa-badge ${property.status === 1 ? "" : "sa-badge-muted"}`}
                    >
                      {propertyStatusLabel(property.status)}
                    </span>
                  </td>
                  <td>
                    <Link
                      className="sa-link"
                      to={
                        property.organizationUid
                          ? superPropertyPath(
                              property.organizationUid,
                              property.uid,
                            )
                          : `/platform/properties/${property.uid}`
                      }
                    >
                      View
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
